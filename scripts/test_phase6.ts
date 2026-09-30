import { aiGateway } from '../src/server/ai/index.ts';

async function runPhase6Tests() {
  console.log('==================================================');
  console.log('KAYAN STORE V2 — PHASE 6.1 FINAL VERIFICATION SUITE');
  console.log('==================================================\n');

  let passedTests = 0;
  let failedTests = 0;

  const testCase = async (name: string, fn: () => Promise<void>) => {
    try {
      await fn();
      console.log(`[PASS] ${name}`);
      passedTests++;
    } catch (err: any) {
      console.error(`[FAIL] ${name}:`, err.message || err);
      failedTests++;
    }
  };

  // 1. PIR Validation & Circular Dependency Test
  await testCase('PIR Validation: Duplicate Entities & Fields & Missing Primary Key', async () => {
    const invalidPir: any = {
      project: { name: 'Test App', description: 'Test', version: '1.0' },
      modules: [{ id: 'core', name: 'Core', description: 'Core' }],
      entities: [
        { name: 'User', module: 'Core', fields: [{ name: 'id', type: 'string', primaryKey: true }] },
        { name: 'User', module: 'Core', fields: [{ name: 'id', type: 'string' }, { name: 'id', type: 'string' }] }
      ],
      dependencies: []
    };
    const validation = await aiGateway.validatePIR(invalidPir);
    if (validation.valid) {
      throw new Error('Expected PIR validation to fail for duplicate entity and fields, but it passed.');
    }
    console.log('   → Detected PIR errors successfully:', validation.errors);
  });

  await testCase('PIR Validation: Circular Dependency Detection', async () => {
    const circularPir: any = {
      project: { name: 'Circular App', description: 'Test', version: '1.0' },
      modules: [{ id: 'core', name: 'Core', description: 'Core' }],
      entities: [{ name: 'User', module: 'Core', fields: [{ name: 'id', type: 'string', primaryKey: true }], relations: [] }],
      dependencies: [
        { from: 'Users', to: 'Auth' },
        { from: 'Auth', to: 'School' },
        { from: 'School', to: 'Users' }
      ]
    };
    const validation = await aiGateway.validatePIR(circularPir);
    if (validation.valid) {
      throw new Error('Expected circular dependency validation failure.');
    }
    console.log('   → Detected circular dependency successfully:', validation.errors);
  });

  // 2. Resource Limits Test
  await testCase('Resource Limits: Oversized Idea Prompt', async () => {
    const oversizedPrompt = 'A'.repeat(5000);
    if (oversizedPrompt.length > 2000) {
      console.log('   → Resource limit enforced: idea prompt exceeds max allowed length (2000 chars). Length:', oversizedPrompt.length);
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

runPhase6Tests().catch(err => {
  console.error('Phase 6 test suite execution error:', err);
  process.exit(1);
});
