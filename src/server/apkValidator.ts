import crypto from 'crypto';
import AdmZip from 'adm-zip';

export interface ApkValidationResult {
  valid: boolean;
  error?: string;
  sizeBytes: number;
  sizeFormatted: string;
  sha256: string;
  hasManifest: boolean;
  hasDex: boolean;
  hasResources: boolean;
  packageNameCandidate?: string;
  versionNameCandidate?: string;
}

export function validateAndAnalyzeApk(buffer: Buffer, originalFilename: string): ApkValidationResult {
  // 1. Validate file extension
  if (!originalFilename.toLowerCase().endsWith('.apk')) {
    return {
      valid: false,
      error: 'الملف المرفوع ليس ملف APK صالح (يجب أن ينتهي بامتداد .apk)',
      sizeBytes: buffer.length,
      sizeFormatted: formatBytes(buffer.length),
      sha256: '',
      hasManifest: false,
      hasDex: false,
      hasResources: false
    };
  }

  // 2. Validate zip magic header PK\x03\x04
  if (buffer.length < 4 || buffer[0] !== 0x50 || buffer[1] !== 0x4B || buffer[2] !== 0x03 || buffer[3] !== 0x04) {
    return {
      valid: false,
      error: 'تنسيق الحزمة تالف أو ليس أرشيف حزمة APK صالح (ZIP header mismatch)',
      sizeBytes: buffer.length,
      sizeFormatted: formatBytes(buffer.length),
      sha256: '',
      hasManifest: false,
      hasDex: false,
      hasResources: false
    };
  }

  // 3. Compute exact byte size and SHA-256
  const sizeBytes = buffer.length;
  const sizeFormatted = formatBytes(sizeBytes);
  const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');

  // 4. Validate ZIP archive structure using adm-zip
  let hasManifest = false;
  let hasDex = false;
  let hasResources = false;
  let packageNameCandidate: string | undefined;
  let versionNameCandidate: string | undefined;

  try {
    const zip = new AdmZip(buffer);
    const entries = zip.getEntries();

    for (const entry of entries) {
      const entryName = entry.entryName.toLowerCase();
      if (entryName === 'androidmanifest.xml') {
        hasManifest = true;
        // Try parsing plaintext or binary manifest strings if possible
        try {
          const raw = entry.getData().toString('utf-8');
          const pkgMatch = raw.match(/package="([^"]+)"/) || raw.match(/([a-z][a-z0-9_]*(\.[a-z0-9_]+)+)/i);
          if (pkgMatch) {
            packageNameCandidate = pkgMatch[1];
          }
        } catch {
          // Binary manifest parsing fallback
        }
      }
      if (entryName.endsWith('.dex')) {
        hasDex = true;
      }
      if (entryName === 'resources.arsc') {
        hasResources = true;
      }
    }
  } catch (err: any) {
    return {
      valid: false,
      error: `فشل التحقق من بنية حزمة APK: ${err.message || 'أرشيف تالف'}`,
      sizeBytes,
      sizeFormatted,
      sha256,
      hasManifest,
      hasDex,
      hasResources
    };
  }

  return {
    valid: true,
    sizeBytes,
    sizeFormatted,
    sha256,
    hasManifest,
    hasDex,
    hasResources,
    packageNameCandidate,
    versionNameCandidate
  };
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
