import { androidBuildProvider } from '../src/server/build/AndroidBuildProvider.ts';

async function runPhase10Tests() {
  console.log('==================================================');
  console.log('KAYAN STORE V2 — PHASE 10 ANDROID BUILD TESTS');
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

  // 1. Validate Package Name Regex
  await testCase('Android Package Name Validation', async () => {
    if (!androidBuildProvider.validatePackageName('com.kayan.store')) {
      throw new Error('Expected com.kayan.store to be valid');
    }
    if (androidBuildProvider.validatePackageName('invalid-package')) {
      throw new Error('Expected invalid-package to be invalid');
    }
    if (androidBuildProvider.validatePackageName('123.com.app')) {
      throw new Error('Expected 123.com.app to be invalid');
    }
    console.log('   → Package name validation regex correctly enforced.');
  });

  // 2. Unconfigured Provider Check
  await testCase('Android External Builder: Unconfigured check', async () => {
    const isConfigured = androidBuildProvider.isConfigured();
    if (isConfigured) {
      console.log('   → Android External Builder is configured in environment.');
    } else {
      console.log('   → Android External Builder is unconfigured as expected.');
      try {
        await androidBuildProvider.createBuild({
          userId: 'u1',
          projectId: 'p1',
          projectVersion: '1.0.0',
          exportId: 'e1',
          manifestChecksum: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
          targetPlatform: 'ANDROID',
          targetFormat: 'ANDROID_APK',
          signingMode: 'UNSIGNED',
          packageName: 'com.example.app',
          versionName: '1.0.0',
          versionCode: 1,
          buildProfile: 'default'
        } as any);
        throw new Error('Expected createBuild to throw when unconfigured.');
      } catch (err: any) {
        if (!err.message.includes('EXTERNAL_BUILDER_NOT_CONFIGURED')) {
          throw new Error(`Expected EXTERNAL_BUILDER_NOT_CONFIGURED, got: ${err.message}`);
        }
        console.log('   → Successfully caught unconfigured error:', err.message);
      }
    }
  });

  // 3. Release Signing Config Check
  await testCase('Android Release Signing Configuration Check', async () => {
    const signingConfigured = androidBuildProvider.isSigningConfigured();
    console.log(`   → Release signing configured: ${signingConfigured}`);
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

runPhase10Tests().catch(err => {
  console.error('Phase 10 test execution error:', err);
  process.exit(1);
});
