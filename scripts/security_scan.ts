
import fs from 'fs';
import path from 'path';

const SCANNED_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.json', '.env', '.yaml', '.yml', '.md'];
const EXCLUDED_DIRS = ['node_modules', '.git', 'dist', 'uploads', 'data'];

const PATTERNS = {
  GEMINI_API_KEY: /AIzaSy[a-zA-Z0-9-_]{35}/g,
  OPENAI_API_KEY: /sk-[a-zA-Z0-9]{48}/g, // sk-proj-... or older sk-...
  ANTHROPIC_API_KEY: /sk-ant-api03-[a-zA-Z0-9-_]{93}/g,
  GITHUB_TOKEN: /ghp_[a-zA-Z0-9]{36}/g,
  POSTGRES_URL: /postgres:\/\/[^:]+:[^@]+@[^/]+\/[^?\s]+/g,
  PRIVATE_KEY: /-----BEGIN [A-Z ]+ PRIVATE KEY-----/g,
  GENERIC_SECRET: /(secret|password|key|token)\s*[:=]\s*["'][a-zA-Z0-9-_]{16,}["']/gi
};

interface ScanResult {
  file: string;
  line: number;
  pattern: string;
  match: string;
}

function scanFile(filePath: string): ScanResult[] {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const results: ScanResult[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const [name, regex] of Object.entries(PATTERNS)) {
      const matches = line.match(regex);
      if (matches) {
        for (const match of matches) {
          // Check if it's in an excluded file or allowed context
          if (filePath.includes('scripts/security_scan.ts')) continue;
          if (filePath.includes('scripts/test_') && match.includes('Test')) continue;
          if (filePath.includes('GeminiProvider.ts') && match.includes('REDACTED')) continue;

          results.push({
            file: filePath,
            line: i + 1,
            pattern: name,
            match: match.substring(0, 4) + '...' + match.substring(match.length - 4)
          });
        }
      }
    }
  }
  return results;
}

function walkDir(dir: string, allResults: ScanResult[]) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (EXCLUDED_DIRS.includes(file)) continue;
      walkDir(fullPath, allResults);
    } else {
      const ext = path.extname(file);
      if (SCANNED_EXTENSIONS.includes(ext)) {
        allResults.push(...scanFile(fullPath));
      }
    }
  }
}

console.log('--- KAYAN STORE SECURITY SCAN ---');
const results: ScanResult[] = [];
walkDir(process.cwd(), results);

if (results.length === 0) {
  console.log('✅ No secrets detected in scanned files.');
} else {
  console.log(`⚠️ Detected ${results.length} potential secrets:`);
  results.forEach(r => {
    console.log(`[${r.pattern}] ${r.file}:${r.line} (${r.match})`);
  });
}
console.log('--- SCAN COMPLETED ---');
