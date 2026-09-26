import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface IArtifactStorage {
  saveArtifact(fileName: string, buffer: Buffer, releaseTag?: string, versionName?: string): Promise<{ storedName: string; sizeBytes: number; sha256: string; downloadUrl?: string }>;
  getArtifactStream(fileName: string): fs.ReadStream | NodeJS.ReadableStream | null;
  getArtifactPath(fileName: string): string | null;
  artifactExists(fileName: string): boolean;
  getPublicDownloadUrl(releaseId: string): string;
}

export class LocalDiskArtifactStorage implements IArtifactStorage {
  private uploadsDir: string;

  constructor(customDir?: string) {
    this.uploadsDir = customDir || path.resolve(process.cwd(), 'uploads', 'apks');
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
  }

  public async saveArtifact(fileName: string, buffer: Buffer) {
    const sanitizedOriginal = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storedName = `${Date.now()}_${sanitizedOriginal}`;
    const dest = path.join(this.uploadsDir, storedName);
    fs.writeFileSync(dest, buffer);
    const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');
    return { storedName, sizeBytes: buffer.length, sha256, downloadUrl: `/uploads/apks/${storedName}` };
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
}

export class GitHubReleaseArtifactStorage implements IArtifactStorage {
  private token: string;
  private owner: string;
  private repo: string;

  constructor() {
    this.token = process.env.GITHUB_TOKEN || '';
    this.owner = process.env.GITHUB_OWNER || '';
    this.repo = process.env.GITHUB_REPOSITORY || '';
    if (process.env.NODE_ENV === 'production' && process.env.STORAGE_DRIVER === 'github') {
      if (!this.token || !this.owner || !this.repo) {
        throw new Error('Configuration Error: GITHUB_TOKEN, GITHUB_OWNER, and GITHUB_REPOSITORY are required when STORAGE_DRIVER=github in production.');
      }
    }
  }

  public async saveArtifact(fileName: string, buffer: Buffer, releaseTag?: string, versionName?: string) {
    if (!this.token || !this.owner || !this.repo) {
      throw new Error('GitHub release storage is not configured. Missing GITHUB_TOKEN, GITHUB_OWNER, or GITHUB_REPOSITORY.');
    }

    const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');
    const sizeBytes = buffer.length;
    const tag = releaseTag || `v-${versionName || Date.now()}`;
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');

    // 1. Get or create GitHub Release by tag
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
      uploadUrl = releaseData.upload_url.replace('{?name,label}', '');
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
          name: `Kayan App Release ${versionName || tag}`,
          body: `Automated APK release uploaded via Kayan Store.\nSHA-256: ${sha256}`,
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
    }

    // 2. Upload asset
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
}
