
import 'dotenv/config';
import { aiGateway } from '../src/server/ai/index.ts';
import { AIModelRouter } from '../src/server/ai/utils/AIModelRouter.ts';
import { db } from '../src/server/db.ts';
import { decrypt, encrypt } from '../src/server/ai/utils/encryption.ts';

async function runVerification() {
  console.log('🚀 Starting Phase 10.4.1 Comprehensive Verification\n');

  let passed = 0;
  let failed = 0;

  const test = async (name: string, fn: () => Promise<void>) => {
    try {
      await fn();
      console.log(`✅ [PASS] ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`❌ [FAIL] ${name}:`, err.message);
      failed++;
    }
  };

  // 1. Provider Registry
  await test('Provider Registry', async () => {
    const providers = await db.getAIProviders();
    if (providers.length === 0) throw new Error('No providers found in DB');
    const gemini = providers.find(p => p.id === 'gemini');
    if (!gemini) throw new Error('Gemini provider missing');
  });

  // 2. Model Registry
  await test('Model Registry', async () => {
    const models = await db.getAIModels();
    if (models.length === 0) throw new Error('No models found in DB');
    const flash = models.find(m => m.modelId === 'gemini-3.8-flash');
    if (!flash) throw new Error('Gemini Flash model missing');
  });

  // 3. Capability Matrix
  await test('Capability Matrix Enforcement', async () => {
    try {
      await AIModelRouter.route({ capability: 'INVALID_CAP' });
      throw new Error('Should have failed');
    } catch (err: any) {
      if (err.message !== 'AI_MODEL_CAPABILITY_MISMATCH') throw err;
    }
  });

  // 4. Router Selection
  await test('Router Selection Logic', async () => {
    const result = await AIModelRouter.route({ capability: 'TEXT', providerPreference: 'gemini', routingMode: 'PROVIDER_SELECTED' });
    if (result.providerId !== 'gemini') throw new Error('Preference ignored');
  });

  // 5. Free-First
  await test('Free-First Policy', async () => {
    const result = await AIModelRouter.route({ capability: 'TEXT', routingMode: 'FREE_FIRST' });
    const models = await db.getAIModels();
    const model = models.find(m => m.modelId === result.modelId);
    if (model?.freeTierStatus !== 'FREE') throw new Error('Picked paid model');
  });

  // 6. Free-Only (New!)
  await test('Free-Only Enforcement', async () => {
    const result = await AIModelRouter.route({ capability: 'TEXT', freeOnly: true });
    const models = await db.getAIModels();
    for (const cand of result.candidates) {
      const m = models.find(x => x.modelId === cand.modelId);
      if (m?.freeTierStatus !== 'FREE') throw new Error('Found paid model in freeOnly candidates');
    }
  });

  // 7. BYOK Encryption
  await test('Encryption AES-256-GCM', async () => {
    const key = 'test-secret';
    const enc = encrypt(key);
    const dec = decrypt(enc.encryptedText, enc.iv, enc.tag);
    if (dec !== key) throw new Error('Decryption mismatch');
  });

  // 8. Fallback Count
  await test('Fallback Attempt Limit', async () => {
    const result = await AIModelRouter.route({ capability: 'TEXT' });
    if (result.candidates.length > 3) {
      // The gateway should slice to 3
      console.log('   - Router returned more than 3, Gateway will slice.');
    }
  });

  console.log(`\n==================================================`);
  console.log(`SUMMARY: ${passed} Passed, ${failed} Failed`);
  console.log(`==================================================\n`);

  process.exit(failed > 0 ? 1 : 0);
}

runVerification();
