import { buildOrchestrator } from '../src/server/build/BuildOrchestrator.ts';
import { GitHubActionsBuildProvider } from '../src/server/build/providers/GitHubActionsBuildProvider.ts';

async function runPhase9Tests() {
  console.log('==================================================');
  console.log('KAYAN STORE V2 — PHASE 9 EXTERNAL BUILD TESTS');
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

  // 1. Build Gate: Unapproved project rejected
  await testCase('Build Gate: Unapproved project rejected', async () => {
    const unapprovedProject: any = {
      id: 'proj_unapproved',
      name: 'Unapproved App'
    };
    const gate = buildOrchestrator.validateBuildGate(unapprovedProject);
    if (gate.passed) {
      throw new Error('Expected build gate to fail for unapproved project.');
    }
    console.log('   → Build gate correctly rejected unapproved project:', gate.errors);
  });

  // 2. Unconfigured External Builder Check
  await testCase('External Builder: Unconfigured provider returns EXTERNAL_BUILDER_NOT_CONFIGURED', async () => {
    const provider = new GitHubActionsBuildProvider();
    const isConfigured = provider.isConfigured();
    if (isConfigured) {
      console.log('   → GitHub Actions provider is configured in this environment.');
    } else {
      console.log('   → GitHub Actions provider is unconfigured as expected (EXTERNAL_BUILDER_NOT_CONFIGURED).');
      try {
        await provider.createBuild({
          userId: 'u1',
          projectId: 'p1',
          projectVersion: '1.0.0',
          exportId: 'e1',
          manifestChecksum: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
          targetPlatform: 'WEB',
          targetStack: { frontend: 'React', backend: 'Express', database: 'PostgreSQL' },
          buildProfile: 'default'
        });
        throw new Error('Expected createBuild to throw when unconfigured.');
      } catch (err: any) {
        if (!err.message.includes('EXTERNAL_BUILDER_NOT_CONFIGURED')) {
          throw new Error(`Expected EXTERNAL_BUILDER_NOT_CONFIGURED error, got: ${err.message}`);
        }
        console.log('   → Successfully caught unconfigured error message:', err.message);
      }
    }
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

runPhase9Tests().catch(err => {
  console.error('Phase 9 test execution error:', err);
  process.exit(1);
});
