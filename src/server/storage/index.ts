import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface IArtifactStorage {
  saveArtifact(fileName: string, buffer: Buffer, releaseTag?: string, versionName?: string): Promise<{ storedName: string; sizeBytes: number; sha256: string; downloadUrl?: string }>;
  saveProductFile(productId: string, fileName: string, buffer: Buffer): Promise<{ storedName: string; sizeBytes: number; downloadUrl: string; sha256: string }>;
  saveMediaFile(productId: string, fileName: string, buffer: Buffer): Promise<{ storedName: string; sizeBytes: number; downloadUrl: string; sha256: string }>;
  getArtifactStream(fileName: string): fs.ReadStream | NodeJS.ReadableStream | null;
  getArtifactPath(fileName: string): string | null;
  artifactExists(fileName: string): boolean;
  getPublicDownloadUrl(releaseId: string): string;
  deleteArtifact(storageKeyOrFileName: string): Promise<boolean>;
}

export interface IMediaStorage {
  saveMediaFile(productId: string, fileName: string, buffer: Buffer): Promise<{ storedName: string; sizeBytes: number; downloadUrl: string; sha256: string }>;
}

export class LocalDiskArtifactStorage implements IArtifactStorage, IMediaStorage {
  private uploadsDir: string;
  private productsDir: string;
  private mediaDir: string;

  constructor(customDir?: string) {
    this.uploadsDir = customDir || path.resolve(process.cwd(), 'uploads', 'apks');
    this.productsDir = path.resolve(process.cwd(), 'uploads', 'products');
    this.mediaDir = path.resolve(process.cwd(), 'uploads', 'media');
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
    if (!fs.existsSync(this.productsDir)) {
      fs.mkdirSync(this.productsDir, { recursive: true });
    }
    if (!fs.existsSync(this.mediaDir)) {
      fs.mkdirSync(this.mediaDir, { recursive: true });
    }
  }

  public async saveArtifact(fileName: string, buffer: Buffer, releaseTag?: string, versionName?: string) {
    const sanitizedOriginal = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storedName = `${Date.now()}_${sanitizedOriginal}`;
    const dest = path.join(this.uploadsDir, storedName);
    fs.writeFileSync(dest, buffer);
    const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');
    return { storedName, sizeBytes: buffer.length, sha256, downloadUrl: `/uploads/apks/${storedName}` };
  }

  public async saveProductFile(productId: string, fileName: string, buffer: Buffer) {
    const sanitizedOriginal = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storedName = `${productId}_${Date.now()}_${sanitizedOriginal}`;
    const dest = path.join(this.productsDir, storedName);
    fs.writeFileSync(dest, buffer);
    const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');
    return { storedName, sizeBytes: buffer.length, downloadUrl: `/uploads/products/${storedName}`, sha256 };
  }

  public async saveMediaFile(productId: string, fileName: string, buffer: Buffer) {
    const sanitizedOriginal = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storedName = `${productId}_${Date.now()}_${sanitizedOriginal}`;
    const dest = path.join(this.mediaDir, storedName);
    fs.writeFileSync(dest, buffer);
    const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');
    return { storedName, sizeBytes: buffer.length, downloadUrl: `/uploads/media/${storedName}`, sha256 };
  }

  public getArtifactStream(fileName: string) {
    const filePath = path.join(this.uploadsDir, fileName);
    if (!fs.existsSync(filePath)) return null;
    return fs.createReadStream(filePath);
  }

  public getArtifactPath(fileName: string): string | null {
    const filePath = path.join(this.uploadsDir, fileName);
    return fs.existsSync(filePath) ? filePath : null;
  }

  public artifactExists(fileName: string): boolean {
    return fs.existsSync(path.join(this.uploadsDir, fileName));
  }

  public getPublicDownloadUrl(releaseId: string): string {
    return `/api/download/${releaseId}`;
  }

  public async deleteArtifact(storageKeyOrFileName: string): Promise<boolean> {
    const cleanName = path.basename(storageKeyOrFileName);
    const candidates = [
      path.join(this.mediaDir, cleanName),
      path.join(this.uploadsDir, cleanName),
      path.join(this.productsDir, cleanName)
    ];

    if (storageKeyOrFileName.startsWith('/uploads/')) {
      const explicit = path.resolve(process.cwd(), storageKeyOrFileName.replace(/^\//, ''));
      candidates.unshift(explicit);
    }

    for (const p of candidates) {
      if (fs.existsSync(p)) {
        try {
          fs.unlinkSync(p);
          return true;
        } catch (err) {
          console.warn('Failed to delete disk artifact:', err);
          return false;
        }
      }
    }
    return false;
  }
}

export class GitHubReleaseArtifactStorage implements IArtifactStorage {
  private token: string;
  private owner: string;
  private repo: string;

  constructor() {
    this.token = process.env.GITHUB_TOKEN || '';
    this.owner = process.env.GITHUB_OWNER || 'gehadrok';
    this.repo = process.env.GITHUB_REPOSITORY || 'kayan-store';
    if (process.env.NODE_ENV === 'production' && process.env.STORAGE_DRIVER === 'github' && !this.token) {
      console.warn('⚠️ Warning: GITHUB_TOKEN is missing while STORAGE_DRIVER=github in production.');
    }
  }

  public async saveArtifact(fileName: string, buffer: Buffer, releaseTag?: string, versionName?: string) {
    if (!this.token) {
      throw new Error('GitHub release storage is not configured. Missing GITHUB_TOKEN.');
    }

    const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');
    const sizeBytes = buffer.length;
    const tag = releaseTag || (versionName ? `v${versionName}` : `v1.0.0`);
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');

    // 1. Get or create GitHub Release by tag
    let uploadUrl = '';
    let existingAssets: any[] = [];

    const tagRes = await fetch(`https://api.github.com/repos/${this.owner}/${this.repo}/releases/tags/${tag}`, {
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Accept': 'application/vnd.github+json',
        'User-Agent': 'Kayan-Store-Server'
      }
    });

    if (tagRes.ok) {
      const releaseData = await tagRes.json() as any;
      uploadUrl = releaseData.upload_url.replace('{?name,label}', '');
      existingAssets = releaseData.assets || [];
    } else {
      const createRes = await fetch(`https://api.github.com/repos/${this.owner}/${this.repo}/releases`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Accept': 'application/vnd.github+json',
          'Content-Type': 'application/json',
          'User-Agent': 'Kayan-Store-Server'
        },
        body: JSON.stringify({
          tag_name: tag,
          name: `Kayan PDF ${versionName ? 'v' + versionName : tag}`,
          body: `Official release ${tag} uploaded via Kayan Store.\n\nSHA-256: ${sha256}\nBytes: ${sizeBytes}`,
          draft: false,
          prerelease: false
        })
      });

      if (!createRes.ok) {
        const errText = await createRes.text();
        throw new Error(`Failed to create GitHub release: ${createRes.status} ${errText}`);
      }

      const createData = await createRes.json() as any;
      uploadUrl = createData.upload_url.replace('{?name,label}', '');
      existingAssets = createData.assets || [];
    }

    // 2. Safely replace stale asset if one with same name already exists
    for (const asset of existingAssets) {
      if (asset.name === sanitizedFileName || asset.name === fileName) {
        console.log(`Removing existing asset ${asset.id} (${asset.name}) from GitHub release...`);
        try {
          await fetch(`https://api.github.com/repos/${this.owner}/${this.repo}/releases/assets/${asset.id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${this.token}`,
              'Accept': 'application/vnd.github+json',
              'User-Agent': 'Kayan-Store-Server'
            }
          });
        } catch (err) {
          console.error('Failed to delete existing asset:', err);
        }
      }
    }

    // 3. Upload new asset
    const assetUrl = `${uploadUrl}?name=${encodeURIComponent(sanitizedFileName)}`;
    const uploadRes = await fetch(assetUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/vnd.android.package-archive',
        'Content-Length': String(buffer.length),
        'Accept': 'application/vnd.github+json',
        'User-Agent': 'Kayan-Store-Server'
      },
      body: new Uint8Array(buffer)
    });

    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      throw new Error(`Failed to upload APK asset to GitHub release: ${uploadRes.status} ${errText}`);
    }

    const assetData = await uploadRes.json() as any;
    const downloadUrl = assetData.browser_download_url;

    return {
      storedName: sanitizedFileName,
      sizeBytes,
      sha256,
      downloadUrl
    };
  }

  public async saveProductFile(productId: string, fileName: string, buffer: Buffer): Promise<{ storedName: string; sizeBytes: number; downloadUrl: string; sha256: string }> {
    const sanitizedOriginal = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storedName = `${productId}_${Date.now()}_${sanitizedOriginal}`;
    const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');
    const sizeBytes = buffer.length;

    if (this.token) {
      try {
        const tag = 'product-files';
        let uploadUrl = '';

        const tagRes = await fetch(`https://api.github.com/repos/${this.owner}/${this.repo}/releases/tags/${tag}`, {
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Accept': 'application/vnd.github+json',
            'User-Agent': 'Kayan-Store-Server'
          }
        });

        if (tagRes.ok) {
          const releaseData = await tagRes.json() as any;
          uploadUrl = (releaseData.upload_url || '').replace('{?name,label}', '');
        } else {
          const createRes = await fetch(`https://api.github.com/repos/${this.owner}/${this.repo}/releases`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${this.token}`,
              'Accept': 'application/vnd.github+json',
              'Content-Type': 'application/json',
              'User-Agent': 'Kayan-Store-Server'
            },
            body: JSON.stringify({
              tag_name: tag,
              name: 'Kayan Store Digital Products & Assets',
              body: 'Storage release for official Kayan Store digital products, ebooks, and supplementary files.',
              draft: false,
              prerelease: false
            })
          });

          if (createRes.ok) {
            const createData = await createRes.json() as any;
            uploadUrl = (createData.upload_url || '').replace('{?name,label}', '');
          }
        }

        if (uploadUrl) {
          const assetUrl = `${uploadUrl}?name=${encodeURIComponent(storedName)}`;
          const uploadRes = await fetch(assetUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${this.token}`,
              'Content-Type': 'application/octet-stream',
              'Content-Length': String(buffer.length),
              'Accept': 'application/vnd.github+json',
              'User-Agent': 'Kayan-Store-Server'
            },
            body: new Uint8Array(buffer)
          });

          if (uploadRes.ok) {
            const assetData = await uploadRes.json() as any;
            return {
              storedName,
              sizeBytes,
              downloadUrl: assetData.browser_download_url,
              sha256
            };
          }
        }
      } catch (err) {
        console.warn('GitHub product asset upload encountered an issue, storing to production local disk fallback:', err);
      }
    }

    // Reliable on-disk fallback so production never crashes
    const productsDir = path.resolve(process.cwd(), 'uploads', 'products');
    if (!fs.existsSync(productsDir)) {
      fs.mkdirSync(productsDir, { recursive: true });
    }
    const dest = path.join(productsDir, storedName);
    fs.writeFileSync(dest, buffer);
    return {
      storedName,
      sizeBytes,
      downloadUrl: `/uploads/products/${storedName}`,
      sha256
    };
  }

  public async saveMediaFile(productId: string, fileName: string, buffer: Buffer): Promise<{ storedName: string; sizeBytes: number; downloadUrl: string; sha256: string }> {
    const sanitizedOriginal = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storedName = `${productId}_${Date.now()}_${sanitizedOriginal}`;
    const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');
    const sizeBytes = buffer.length;

    const mediaDir = path.resolve(process.cwd(), 'uploads', 'media');
    if (!fs.existsSync(mediaDir)) {
      fs.mkdirSync(mediaDir, { recursive: true });
    }
    const dest = path.join(mediaDir, storedName);
    fs.writeFileSync(dest, buffer);
    return {
      storedName,
      sizeBytes,
      downloadUrl: `/uploads/media/${storedName}`,
      sha256
    };
  }

  public getArtifactStream(fileName: string) {
    return null;
  }

  public getArtifactPath(fileName: string): string | null {
    return null;
  }

  public artifactExists(fileName: string): boolean {
    return true;
  }

  public getPublicDownloadUrl(releaseId: string): string {
    return `/api/download/${releaseId}`;
  }

  public async deleteArtifact(storageKeyOrFileName: string): Promise<boolean> {
    return true;
  }
}

export class S3CompatibleArtifactStorage implements IArtifactStorage, IMediaStorage {
  private bucket: string;
  private endpoint: string;
  private accessKeyId: string;
  private secretAccessKey: string;
  private fallback: LocalDiskArtifactStorage;

  constructor() {
    this.bucket = process.env.S3_BUCKET || '';
    this.endpoint = process.env.S3_ENDPOINT || '';
    this.accessKeyId = process.env.S3_ACCESS_KEY_ID || '';
    this.secretAccessKey = process.env.S3_SECRET_ACCESS_KEY || '';
    this.fallback = new LocalDiskArtifactStorage();
  }

  public async saveArtifact(fileName: string, buffer: Buffer, releaseTag?: string, versionName?: string) {
    const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');
    const sanitizedOriginal = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storedName = `${Date.now()}_${sanitizedOriginal}`;

    if (!this.bucket || !this.endpoint) {
      if (process.env.NODE_ENV === 'production') {
        console.warn('⚠️ S3 Storage configuration incomplete in production. Falling back to LocalDisk storage (EPHEMERAL).');
      }
      return this.fallback.saveArtifact(fileName, buffer, releaseTag, versionName);
    }

    const key = `apks/${storedName}`;
    const downloadUrl = `${this.endpoint.replace(/\/$/, '')}/${this.bucket}/${key}`;
    try {
      await fetch(downloadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/vnd.android.package-archive',
          'Content-Length': String(buffer.length)
        },
        body: new Uint8Array(buffer)
      });
    } catch (err: any) {
      console.warn('S3 upload request failed, falling back to local disk write:', err?.message || 'Network error');
      return this.fallback.saveArtifact(fileName, buffer, releaseTag, versionName);
    }

    return { storedName, sizeBytes: buffer.length, sha256, downloadUrl };
  }

  public async saveProductFile(productId: string, fileName: string, buffer: Buffer) {
    const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');
    const sanitizedOriginal = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storedName = `${productId}_${Date.now()}_${sanitizedOriginal}`;

    if (!this.bucket || !this.endpoint) {
      if (process.env.NODE_ENV === 'production') {
        console.warn('⚠️ S3 Storage configuration incomplete in production. Falling back to LocalDisk storage (EPHEMERAL).');
      }
      return this.fallback.saveProductFile(productId, fileName, buffer);
    }

    const key = `products/${storedName}`;
    const downloadUrl = `${this.endpoint.replace(/\/$/, '')}/${this.bucket}/${key}`;
    try {
      await fetch(downloadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/octet-stream',
          'Content-Length': String(buffer.length)
        },
        body: new Uint8Array(buffer)
      });
    } catch (err: any) {
      console.warn('S3 product upload request failed, falling back to local disk:', err?.message || 'Network error');
      return this.fallback.saveProductFile(productId, fileName, buffer);
    }

    return { storedName, sizeBytes: buffer.length, downloadUrl, sha256 };
  }

  public async saveMediaFile(productId: string, fileName: string, buffer: Buffer) {
    const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');
    const sanitizedOriginal = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storedName = `${productId}_${Date.now()}_${sanitizedOriginal}`;

    if (!this.bucket || !this.endpoint) {
      if (process.env.NODE_ENV === 'production') {
        console.warn('⚠️ S3 Storage configuration incomplete in production. Falling back to LocalDisk storage (EPHEMERAL).');
      }
      return this.fallback.saveMediaFile(productId, fileName, buffer);
    }

    const key = `media/${storedName}`;
    const downloadUrl = `${this.endpoint.replace(/\/$/, '')}/${this.bucket}/${key}`;
    try {
      await fetch(downloadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'image/png',
          'Content-Length': String(buffer.length)
        },
        body: new Uint8Array(buffer)
      });
    } catch (err: any) {
      console.warn('S3 media upload request failed, falling back to local disk:', err?.message || 'Network error');
      return this.fallback.saveMediaFile(productId, fileName, buffer);
    }

    return { storedName, sizeBytes: buffer.length, downloadUrl, sha256 };
  }

  public getArtifactStream(fileName: string) {
    return this.fallback.getArtifactStream(fileName);
  }

  public getArtifactPath(fileName: string): string | null {
    return this.fallback.getArtifactPath(fileName);
  }

  public artifactExists(fileName: string): boolean {
    return this.fallback.artifactExists(fileName);
  }

  public getPublicDownloadUrl(releaseId: string): string {
    return `/api/download/${releaseId}`;
  }

  public async deleteArtifact(storageKeyOrFileName: string): Promise<boolean> {
    if (!this.bucket || !this.endpoint) {
      return this.fallback.deleteArtifact(storageKeyOrFileName);
    }

    let key = storageKeyOrFileName;
    if (key.includes(`/${this.bucket}/`)) {
      key = key.split(`/${this.bucket}/`)[1];
    } else {
      key = `media/${path.basename(storageKeyOrFileName)}`;
    }

    const deleteUrl = `${this.endpoint.replace(/\/$/, '')}/${this.bucket}/${key}`;
    try {
      const res = await fetch(deleteUrl, { method: 'DELETE' });
      return res.ok || res.status === 404;
    } catch (err: any) {
      console.warn('S3 delete failed, falling back to local disk:', err?.message || 'Network error');
      return this.fallback.deleteArtifact(storageKeyOrFileName);
    }
  }
}

export function getArtifactStorage(): IArtifactStorage {
  const driver = process.env.STORAGE_DRIVER;
  const isProd = process.env.NODE_ENV === 'production';

  if (driver === 's3' || driver === 'object') {
    return new S3CompatibleArtifactStorage();
  }
  if (driver === 'github' || (!driver && process.env.GITHUB_TOKEN)) {
    return new GitHubReleaseArtifactStorage();
  }
  if (isProd && !driver) {
    console.warn('⚠️ PRODUCTION STORAGE NOTICE: STORAGE_DRIVER is not set. Ephemeral LocalDisk storage is active.');
  }
  return new LocalDiskArtifactStorage();
}
