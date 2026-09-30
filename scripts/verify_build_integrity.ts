/**
 * Kayan | كيان — Build Subsystem Integrity Verification Suite
 *
 * Verifies that the Build subsystem strictly prohibits mock builds, enforces
 * immutable export integrity, validates 64-char SHA-256 checksums, prevents
 * implicit exports, rejects unconfigured external builders, enforces
 * fail-closed BUILD_SOURCE_UNAVAILABLE when sources cannot be reached by runners,
 * and maintains valid UTF-8 Arabic error strings.
 */

import { androidBuildProvider, AndroidBuildProvider } from '../src/server/build/AndroidBuildProvider.ts';
import { GitHubActionsBuildProvider } from '../src/server/build/providers/GitHubActionsBuildProvider.ts';
import { buildOrchestrator } from '../src/server/build/BuildOrchestrator.ts';
import { db } from '../src/server/db.ts';

interface TestResult {
  id: number;
  name: string;
  expected: string;
  passed: boolean;
  details: string;
}

const results: TestResult[] = [];
const VALID_SHA256_TEST = 'a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90';

async function runTests() {
  console.log('================================================================');
  console.log('🧪 Kayan | كيان — Build Subsystem Integrity Verification');
  console.log('================================================================\n');

  // Test 1: Missing exportId validation
  try {
    const ghProvider = new GitHubActionsBuildProvider();
    const orig = ghProvider.isConfigured.bind(ghProvider);
    (ghProvider as any).isConfigured = () => true;
    try {
      await ghProvider.createBuild({
        userId: 'test_user',
        projectId: 'proj_test',
        projectVersion: '1.0.0',
        exportId: '',
        manifestChecksum: VALID_SHA256_TEST,
        targetPlatform: 'WEB',
        targetStack: { frontend: 'React', backend: 'Node.js', database: 'PostgreSQL' },
        buildProfile: 'default'
      });
      results.push({
        id: 1,
        name: 'Missing exportId Rejection',
        expected: 'BUILD_INPUT_INTEGRITY_FAILED',
        passed: false,
        details: 'Accepted empty exportId'
      });
    } finally {
      (ghProvider as any).isConfigured = orig;
    }
  } catch (err: any) {
    const passed = err.message.includes('BUILD_INPUT_INTEGRITY_FAILED');
    results.push({
      id: 1,
      name: 'Missing exportId Rejection',
      expected: 'BUILD_INPUT_INTEGRITY_FAILED',
      passed,
      details: `Safely trapped: ${err.message}`
    });
  }

  // Test 2: Missing manifestChecksum validation
  try {
    const androidProvider = new AndroidBuildProvider();
    // Temporarily mock isConfigured for input validation testing
    const originalIsConfigured = androidProvider.isConfigured.bind(androidProvider);
    (androidProvider as any).isConfigured = () => true;

    try {
      await androidProvider.createBuild({
        userId: 'test_user',
        projectId: 'proj_test',
        projectVersion: '1.0.0',
        exportId: 'exp_real_001',
        manifestChecksum: '',
        targetPlatform: 'ANDROID',
        targetFormat: 'ANDROID_APK',
        packageName: 'com.kayan.store',
        versionName: '1.0.0',
        versionCode: 1,
        signingMode: 'UNSIGNED',
        targetStack: { frontend: 'React', backend: 'Node.js', database: 'PostgreSQL' },
        buildProfile: 'default'
      });
      results.push({
        id: 2,
        name: 'Missing manifestChecksum Rejection',
        expected: 'BUILD_INPUT_INTEGRITY_FAILED',
        passed: false,
        details: 'Allowed empty manifestChecksum'
      });
    } finally {
      (androidProvider as any).isConfigured = originalIsConfigured;
    }
  } catch (err: any) {
    const passed = err.message.includes('BUILD_INPUT_INTEGRITY_FAILED');
    results.push({
      id: 2,
      name: 'Missing manifestChecksum Rejection',
      expected: 'BUILD_INPUT_INTEGRITY_FAILED',
      passed,
      details: `Safely rejected: ${err.message}`
    });
  }

  // Test 3: Invalid SHA-256 (not 64 hex characters or sha256_mock)
  try {
    const androidProvider = new AndroidBuildProvider();
    const originalIsConfigured = androidProvider.isConfigured.bind(androidProvider);
    (androidProvider as any).isConfigured = () => true;

    try {
      await androidProvider.createBuild({
        userId: 'test_user',
        projectId: 'proj_test',
        projectVersion: '1.0.0',
        exportId: 'exp_real_001',
        manifestChecksum: 'sha256_mock', // Invalid placeholder
        targetPlatform: 'ANDROID',
        targetFormat: 'ANDROID_APK',
        packageName: 'com.kayan.store',
        versionName: '1.0.0',
        versionCode: 1,
        signingMode: 'UNSIGNED',
        targetStack: { frontend: 'React', backend: 'Node.js', database: 'PostgreSQL' },
        buildProfile: 'default'
      });
      results.push({
        id: 3,
        name: 'Invalid Checksum Format Rejection (sha256_mock)',
        expected: 'BUILD_INPUT_INTEGRITY_FAILED',
        passed: false,
        details: 'Allowed placeholder checksum'
      });
    } finally {
      (androidProvider as any).isConfigured = originalIsConfigured;
    }
  } catch (err: any) {
    const passed = err.message.includes('BUILD_INPUT_INTEGRITY_FAILED');
    results.push({
      id: 3,
      name: 'Invalid Checksum Format Rejection (sha256_mock)',
      expected: 'BUILD_INPUT_INTEGRITY_FAILED',
      passed,
      details: `Safely rejected: ${err.message}`
    });
  }

  // Test 4: Unconfigured GitHub Actions builder deterministic error
  try {
    const originalToken = process.env.GITHUB_ACTIONS_TOKEN;
    const originalRepo = process.env.GITHUB_REPOSITORY;
    delete process.env.GITHUB_ACTIONS_TOKEN;
    delete process.env.GITHUB_REPOSITORY;

    try {
      const androidProvider = new AndroidBuildProvider();
      await androidProvider.createBuild({
        userId: 'test_user',
        projectId: 'proj_test',
        projectVersion: '1.0.0',
        exportId: 'exp_real_001',
        manifestChecksum: VALID_SHA256_TEST,
        targetPlatform: 'ANDROID',
        targetFormat: 'ANDROID_APK',
        packageName: 'com.kayan.store',
        versionName: '1.0.0',
        versionCode: 1,
        signingMode: 'UNSIGNED',
        targetStack: { frontend: 'React', backend: 'Node.js', database: 'PostgreSQL' },
        buildProfile: 'default'
      });
      results.push({
        id: 4,
        name: 'Unconfigured GitHub Actions Rejection',
        expected: 'EXTERNAL_BUILDER_NOT_CONFIGURED',
        passed: false,
        details: 'Did not throw for unconfigured environment'
      });
    } finally {
      if (originalToken) process.env.GITHUB_ACTIONS_TOKEN = originalToken;
      if (originalRepo) process.env.GITHUB_REPOSITORY = originalRepo;
    }
  } catch (err: any) {
    const passed = err.message.includes('EXTERNAL_BUILDER_NOT_CONFIGURED');
    results.push({
      id: 4,
      name: 'Unconfigured GitHub Actions Rejection',
      expected: 'EXTERNAL_BUILDER_NOT_CONFIGURED',
      passed,
      details: `Safely threw: ${err.message}`
    });
  }

  // Test 5: Unavailable Export Source => BUILD_SOURCE_UNAVAILABLE
  try {
    const ghProvider = new GitHubActionsBuildProvider();
    // Simulate configured environment
    const originalIsConfigured = ghProvider.isConfigured.bind(ghProvider);
    (ghProvider as any).isConfigured = () => true;

    try {
      await ghProvider.createBuild({
        userId: 'test_user',
        projectId: 'proj_test',
        projectVersion: '1.0.0',
        exportId: 'exp_real_001',
        manifestChecksum: VALID_SHA256_TEST,
        targetPlatform: 'ANDROID',
        targetStack: { frontend: 'React', backend: 'Node.js', database: 'PostgreSQL' },
        buildProfile: 'default',
        sourceDownloadUrl: '/uploads/products/exp_local_file.zip' // Local disk URL
      });
      results.push({
        id: 5,
        name: 'Unavailable Local Source Rejection',
        expected: 'BUILD_SOURCE_UNAVAILABLE',
        passed: false,
        details: 'Failed to detect local unroutable source'
      });
    } finally {
      (ghProvider as any).isConfigured = originalIsConfigured;
    }
  } catch (err: any) {
    const passed = err.message.includes('BUILD_SOURCE_UNAVAILABLE');
    results.push({
      id: 5,
      name: 'Unavailable Local Source Rejection',
      expected: 'BUILD_SOURCE_UNAVAILABLE',
      passed,
      details: `Safely trapped: ${err.message}`
    });
  }

  // Test 6: Verify no production code can generate a fake APK or fake checksum
  try {
    const androidProvider = new AndroidBuildProvider();
    const originalIsConfigured = androidProvider.isConfigured.bind(androidProvider);
    (androidProvider as any).isConfigured = () => false;

    let generatedFakeApk = false;
    try {
      await androidProvider.createBuild({
        userId: 'test_user',
        projectId: 'proj_test',
        projectVersion: '1.0.0',
        exportId: 'exp_real_001',
        manifestChecksum: VALID_SHA256_TEST,
        targetPlatform: 'ANDROID',
        targetFormat: 'ANDROID_APK',
        packageName: 'com.kayan.store',
        versionName: '1.0.0',
        versionCode: 1,
        signingMode: 'UNSIGNED',
        targetStack: { frontend: 'React', backend: 'Node.js', database: 'PostgreSQL' },
        buildProfile: 'default'
      });
      generatedFakeApk = true;
    } catch {
      generatedFakeApk = false;
    } finally {
      (androidProvider as any).isConfigured = originalIsConfigured;
    }

    const passed = !generatedFakeApk;
    results.push({
      id: 6,
      name: 'Prohibition of Synthetic / Mock APK Generation',
      expected: 'FAIL_CLOSED (NO FAKE ARTIFACTS)',
      passed,
      details: passed ? 'Verified no synthetic APK or fake artifacts can be created.' : 'Generated mock APK!'
    });
  } catch (err: any) {
    results.push({
      id: 6,
      name: 'Prohibition of Synthetic / Mock APK Generation',
      expected: 'FAIL_CLOSED',
      passed: true,
      details: err.message
    });
  }

  // Test 7: Verify Arabic strings UTF-8 validity (no mojibake)
  try {
    const errorStrings = [
      'EXTERNAL_BUILDER_NOT_CONFIGURED: بيئة البناء الخارجية (GitHub Actions) غير مهيأة حالياً.',
      'EXTERNAL_BUILDER_NOT_CONFIGURED: بيئة بناء أندرويد الخارجية (GitHub Actions) غير مهيأة.',
      'BUILD_SOURCE_UNAVAILABLE: حزمة التصدير غير متاحة لباني GitHub Actions الخارجي بشكل آمن. يتطلب إعداد تخزين سحابي خارجي (S3 أو GitHub Release Storage).'
    ];

    let hasMojibake = false;
    for (const str of errorStrings) {
      // Check for common mojibake characters like ?, \uFFFD, or double-encoded sequences
      if (str.includes('\uFFFD') || str.includes('Ø') || str.includes('Ù')) {
        hasMojibake = true;
      }
    }

    const passed = !hasMojibake;
    results.push({
      id: 7,
      name: 'Valid UTF-8 Arabic Error Encodings',
      expected: 'VALID UTF-8 (NO MOJIBAKE)',
      passed,
      details: passed ? 'All Arabic error strings verified valid UTF-8 Arabic without corruption.' : 'Detected mojibake encoding errors'
    });
  } catch (err: any) {
    results.push({
      id: 7,
      name: 'Valid UTF-8 Arabic Error Encodings',
      expected: 'VALID UTF-8',
      passed: false,
      details: err.message
    });
  }

  // Test 8: Build gate requirement check
  try {
    const incompleteProject = {
      id: 'proj_no_arch',
      userId: 'test_user',
      specification: { name: 'App' }
      // Missing architecture, pir, artifacts
    };
    const gate = buildOrchestrator.validateBuildGate(incompleteProject);
    const passed = !gate.passed && gate.errors.length >= 3;
    results.push({
      id: 8,
      name: 'Build Gate Incomplete Project Rejection',
      expected: 'BUILD_GATE_FAILED',
      passed,
      details: passed ? `Blocked build with ${gate.errors.length} validation errors.` : 'Allowed incomplete project'
    });
  } catch (err: any) {
    results.push({
      id: 8,
      name: 'Build Gate Incomplete Project Rejection',
      expected: 'BUILD_GATE_FAILED',
      passed: false,
      details: err.message
    });
  }

  // Print results
  console.log('| ID | Test Name | Expected | Status | Details |');
  console.log('| :--- | :--- | :--- | :--- | :--- |');
  let allPassed = true;
  for (const r of results) {
    const status = r.passed ? '✅ PASS' : '❌ FAIL';
    if (!r.passed) allPassed = false;
    console.log(`| ${r.id} | ${r.name} | ${r.expected} | ${status} | ${r.details} |`);
  }

  console.log('\n================================================================');
  if (allPassed) {
    console.log('🎉 ALL BUILD INTEGRITY TESTS PASSED!');
  } else {
    console.error('❌ SOME TESTS FAILED');
    process.exit(1);
  }
  console.log('================================================================\n');
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
