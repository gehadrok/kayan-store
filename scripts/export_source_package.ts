import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import AdmZip from 'adm-zip';

const ROOT_DIR = process.cwd();
const OUTPUT_ZIP_PATH = path.join(ROOT_DIR, 'Kayan-Platform-FINAL-SOURCE-V8.zip');
const CHECKSUM_FILE_PATH = OUTPUT_ZIP_PATH + '.sha256';

const EXCLUDED_DIRS = new Set([
  'node_modules',
  'dist',
  '.git',
  'data',
  'uploads',
  '.ais'
]);

const EXCLUDED_FILES = new Set([
  '.env',
  '.DS_Store',
  'Kayan-Platform-FINAL-SOURCE.zip',
  'Kayan-Platform-FINAL-SOURCE-V2.zip',
  'Kayan-Platform-FINAL-SOURCE-V3.zip',
  'Kayan-Platform-FINAL-SOURCE-V4.zip',
  'Kayan-Platform-FINAL-SOURCE-V5.zip',
  'Kayan-Platform-FINAL-SOURCE-V6.zip',
  'Kayan-Platform-FINAL-SOURCE-V6.zip.sha256',
  'Kayan-Platform-FINAL-SOURCE-V7.zip',
  'Kayan-Platform-FINAL-SOURCE-V7.zip.sha256',
  'Kayan-Platform-FINAL-SOURCE-V8.zip',
  'Kayan-Platform-FINAL-SOURCE-V8.zip.sha256'
]);

function shouldInclude(relPath: string): boolean {
  if (relPath.endsWith('.zip')) return false;
  const parts = relPath.split(path.sep);
  for (const part of parts) {
    if (EXCLUDED_DIRS.has(part)) return false;
    if (EXCLUDED_FILES.has(part)) return false;
    if (part.startsWith('.env') && part !== '.env.example') return false;
  }
  return true;
}

function getAllFiles(dir: string, baseDir: string = dir): string[] {
  let results: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(baseDir, fullPath);

    if (!shouldInclude(relPath)) {
      continue;
    }

    if (entry.isDirectory()) {
      results = results.concat(getAllFiles(fullPath, baseDir));
    } else if (entry.isFile()) {
      results.push(relPath);
    }
  }

  return results;
}

async function packageSource() {
  console.log('====================================================');
  console.log('KAYAN | كيان — SOURCE CODE EXPORT PACKAGING');
  console.log('====================================================');

  console.log('1. Scanning working tree for source files...');
  const filesToInclude = getAllFiles(ROOT_DIR);
  console.log(`   Found ${filesToInclude.length} files eligible for export.`);

  console.log('2. Assembling ZIP package using AdmZip...');
  const zip = new AdmZip();

  let totalRawBytes = 0;
  for (const relPath of filesToInclude) {
    const fullPath = path.join(ROOT_DIR, relPath);
    const fileData = fs.readFileSync(fullPath);
    totalRawBytes += fileData.length;
    const zipEntryDir = path.dirname(relPath);
    const entryDirInZip = zipEntryDir === '.' ? '' : zipEntryDir.replace(/\\/g, '/');
    zip.addLocalFile(fullPath, entryDirInZip);
  }

  console.log(`3. Writing package to: ${OUTPUT_ZIP_PATH}...`);
  if (fs.existsSync(OUTPUT_ZIP_PATH)) {
    fs.unlinkSync(OUTPUT_ZIP_PATH);
  }
  zip.writeZip(OUTPUT_ZIP_PATH);

  const stats = fs.statSync(OUTPUT_ZIP_PATH);
  const zipBuffer = fs.readFileSync(OUTPUT_ZIP_PATH);
  const sha256 = crypto.createHash('sha256').update(zipBuffer).digest('hex');
  fs.writeFileSync(CHECKSUM_FILE_PATH, sha256);

  console.log('4. Verifying package integrity...');
  console.log(`   Checksum saved to: ${CHECKSUM_FILE_PATH}`);
  const verifyZip = new AdmZip(OUTPUT_ZIP_PATH);
  const entries = verifyZip.getEntries();
  console.log(`   Total entries inside ZIP: ${entries.length}`);
  console.log(`   Raw uncompressed size: ${(totalRawBytes / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`   Compressed ZIP size: ${(stats.size / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`   SHA-256 Checksum: ${sha256}`);

  // Spot-check critical files
  const criticalFiles = [
    'package.json',
    'package-lock.json',
    'server.ts',
    'index.html',
    'metadata.json',
    '.env.example',
    'src/server/db.ts',
    'src/server/ai/AIGateway.ts',
    'src/server/ai/utils/AIModelRouter.ts',
    'src/server/ai/providers/GeminiProvider.ts',
    'src/pages/admin/AdminDashboard.tsx',
    'docs/KAYAN_EXPORT_MANIFEST.md'
  ];

  console.log('5. Spot-checking critical files in export archive:');
  const entryNames = new Set(entries.map(e => e.entryName));
  let allPresent = true;
  for (const crit of criticalFiles) {
    const present = entryNames.has(crit);
    console.log(`   ${present ? '✓' : '✗'} ${crit}`);
    if (!present) allPresent = false;
  }

  if (!allPresent) {
    throw new Error('Integrity Check Failed: One or more critical files missing from export archive!');
  }

  // Security check: ensure no .env is in the zip
  const hasEnv = entries.some(e => e.entryName === '.env' || (e.entryName.includes('.env') && !e.entryName.includes('.env.example')));
  if (hasEnv) {
    throw new Error('SECURITY VIOLATION: .env file found in export archive!');
  }
  console.log('   ✓ Security check passed: No .env or sensitive files present.');

  console.log('====================================================');
  console.log('EXPORT PACKAGING COMPLETE — STATUS: EXPORT READY');
  console.log('====================================================');
}

packageSource().catch(err => {
  console.error('Packaging failed:', err);
  process.exit(1);
});
