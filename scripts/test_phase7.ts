import { PreviewManager } from '../src/server/ai/previewRuntime.ts';

async function runPhase7Tests() {
  console.log('==================================================');
  console.log('KAYAN STORE V2 — PHASE 7 PREVIEW SANDBOX VERIFICATION');
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

  // 1. Runtime Availability Check
  await testCase('Runtime Availability: Reports PREVIEW_RUNTIME_NOT_AVAILABLE', async () => {
    const status = PreviewManager.checkRuntimeAvailability();
    if (status.available !== false || status.code !== 'PREVIEW_RUNTIME_NOT_AVAILABLE') {
      throw new Error(`Expected PREVIEW_RUNTIME_NOT_AVAILABLE, got code: ${status.code}`);
    }
    console.log('   → Runtime status reported correctly:', status.message);
  });

  // 2. Artifact Security Validation (Path Traversal / Secret Access)
  await testCase('Artifact Security Validation: Block Path Traversal & Secret Access', async () => {
    const maliciousArtifacts = {
      frontendFiles: [
        { path: '../../../server.ts', content: 'console.log(process.env.GEMINI_API_KEY);' }
      ]
    };
    const validation = PreviewManager.validateArtifacts(maliciousArtifacts);
    if (validation.passed) {
      throw new Error('Expected security validation to fail for path traversal and secret access, but it passed.');
    }
    console.log('   → Blocked malicious artifacts successfully:', validation.errors);
  });

  // 3. Static Preview Fallback Preparation
  await testCase('Static Preview Fallback: Prepares Safe Inspection Artifact', async () => {
    const safeArtifacts = {
      frontendFiles: [
        { path: 'src/App.tsx', content: 'export default function App() { return <div>Safe App</div>; }' }
      ]
    };
    const preview = PreviewManager.prepareStaticPreview('proj_test', 'user_test', safeArtifacts);
    if (preview.status !== 'READY' || preview.runtimeMode !== 'STATIC_PREVIEW_FALLBACK') {
      throw new Error('Expected preview status READY in static fallback mode.');
    }
    console.log('   → Prepared static preview artifact successfully:', preview.id);
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

runPhase7Tests().catch(err => {
  console.error('Phase 7 test execution error:', err);
  process.exit(1);
});
