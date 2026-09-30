import { ExportPipeline } from '../src/server/ai/exportPipeline.ts';

async function runPhase8Tests() {
  console.log('==================================================');
  console.log('KAYAN STORE V2 — PHASE 8 BUILD & EXPORT PIPELINE TESTS');
  console.log('==================================================\n');

  let passedTests = 0;
  let failedTests = 0;

  const testCase = async (name: string, fn: () => void | Promise<void>) => {
    try {
      await fn();
      console.log(`[PASS] ${name}`);
      passedTests++;
    } catch (err: any) {
      console.error(`[FAIL] ${name}:`, err.message || err);
      failedTests++;
    }
  };

  // 1. Unapproved Project Export Gate Test
  await testCase('Export Gate: Unapproved project rejected', async () => {
    const unapprovedProject: any = {
      id: 'proj_test',
      name: 'Test',
      userId: 'user_1'
      // missing specification, architecture, pir, generatedArtifacts
    };
    const gate = ExportPipeline.validateExportGate(unapprovedProject);
    if (gate.passed) {
      throw new Error('Expected export gate to fail for unapproved project.');
    }
    console.log('   → Export gate correctly rejected unapproved project:', gate.errors);
  });

  // 2. Invalid Artifact Path & Traversal Test
  await testCase('Artifact Validation: Path traversal and absolute path rejected', async () => {
    const dangerousFiles = [
      { path: '../../../etc/passwd', content: 'root:x:0:0' },
      { path: '/absolute/path/file.ts', content: 'malicious' }
    ];
    const safety = ExportPipeline.validateArtifactsSafety(dangerousFiles);
    if (safety.passed) {
      throw new Error('Expected artifact safety validation to reject traversal and absolute paths.');
    }
    console.log('   → Correctly rejected dangerous paths:', safety.errors);
  });

  // 3. Secret Detection Test
  await testCase('Secret Scanning: Forbidden secrets and .env files rejected', async () => {
    const secretFiles = [
      { path: 'src/config.ts', content: 'const apiKey = "TEST_API_KEY_PLACEHOLDER_VALUE";' },
      { path: '.env', content: 'DATABASE_URL=postgres://user:pass@localhost:5432/db' }
    ];
    const safety = ExportPipeline.validateArtifactsSafety(secretFiles);
    if (safety.passed) {
      throw new Error('Expected secret scanning to reject secret tokens and .env files.');
    }
    console.log('   → Correctly detected and rejected secrets:', safety.errors);
  });

  // 4. Valid Project Packaging & Manifest Test
  await testCase('Manifest & Checksums: Deterministic package generation', async () => {
    const validProject: any = {
      id: 'proj_valid',
      name: 'Valid App',
      userId: 'user_1',
      specification: { name: 'Valid App', description: 'Test app' },
      architecture: { frontend: { framework: 'React' }, backend: { runtime: 'Node.js' } },
      pir: { project: { name: 'Valid App' }, entities: [] },
      generatedArtifacts: {
        databaseSchemaSQL: 'CREATE TABLE items (id VARCHAR(64) PRIMARY KEY);',
        backendFiles: [{ path: 'src/server.ts', content: 'console.log("server");' }],
        frontendFiles: [{ path: 'src/App.tsx', content: 'export default function App() { return <div />; }' }]
      }
    };

    const { manifest, zipBuffer } = await ExportPipeline.packageProject(validProject);
    if (!manifest || !manifest.files || manifest.files.length === 0 || !zipBuffer) {
      throw new Error('Failed to generate valid build manifest or ZIP buffer.');
    }
    console.log('   → Generated build manifest successfully with files count:', manifest.files.length);
    console.log('   → ZIP buffer size:', zipBuffer.length, 'bytes');
  });

  console.log('\n==================================================');
  console.log(`TEST RUN COMPLETE: Passed: ${passedTests}, Failed: ${failedTests}`);
  console.log('==================================================');

  if (failedTests > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runPhase8Tests().catch(err => {
  console.error('Phase 8 test execution error:', err);
  process.exit(1);
});
