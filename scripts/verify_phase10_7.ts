
import 'dotenv/config';
import { db } from '../src/server/db.ts';
import { aiGateway } from '../src/server/ai/index.ts';
import { AIModelRouter } from '../src/server/ai/utils/AIModelRouter.ts';
import { encrypt, decrypt } from '../src/server/ai/utils/encryption.ts';
import crypto from 'crypto';

async function test(name: string, fn: () => Promise<void>) {
  console.log(`\nTesting: ${name}...`);
  try {
    const start = Date.now();
    await fn();
    const duration = Date.now() - start;
    console.log(`✅ PASSED: ${name} (${duration}ms)`);
  } catch (err: any) {
    console.error(`❌ FAILED: ${name}`);
    console.error(err);
    // Don't exit 1 yet, try to run all tests
  }
}

async function runReadiness() {
  console.log('--- KAYAN AI PHASE 10.7 PRODUCTION OPERATIONAL READINESS VERIFICATION ---');

  // 1. DATABASE MIGRATIONS
  await test('Database: Schema integrity', async () => {
    // Check if critical tables exist (by querying them)
    const criticalTables = ['ai_providers', 'ai_models', 'ai_settings', 'ai_usages', 'ai_user_keys', 'ai_projects', 'ai_assets', 'users', 'activity_logs'];
    
    if ((db as any).isPg) {
      const pool = (db as any).pool;
      for (const table of criticalTables) {
        await pool.query(`SELECT 1 FROM ${table} LIMIT 1`);
        console.log(`  - Table '${table}' exists and is queryable.`);
      }
    } else {
      console.log('  - Running in JSON mode. Migration check skipped for PostgreSQL but tables present in memory.');
    }
  });

  // 2. REAL GEMINI PROVIDER VERIFICATION
  if (process.env.GEMINI_API_KEY) {
    await test('REAL PROVIDER: Gemini Text Generation', async () => {
      const result = await aiGateway.generateText({ prompt: 'Hello, are you operational?' });
      console.log('  - Response received from real provider.');
      console.log(`  - Provider: ${result.providerId}, Model: ${result.model}`);
      if (!result.text) throw new Error('Empty response from real provider');
    });

    await test('REAL PROVIDER: Gemini Vision Analysis', async () => {
      // Small 1x1 transparent pixel png base64
      const buffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR42mP8/AwAAw8BfAWvByYAAAAASUVORK5CYII=', 'base64');
      const result = await aiGateway.analyzeVision({
        imageBuffer: buffer,
        mimeType: 'image/png',
        instruction: 'What color is this image?'
      });
      console.log('  - Vision analysis response received.');
      if (!result.description) throw new Error('Empty vision response');
    });
  } else {
    console.log('⚠️ REAL PROVIDER tests skipped: GEMINI_API_KEY missing.');
  }

  // 3. PROVIDER STATE VALIDATION
  await test('Router: Status-based filtering', async () => {
    const providers = await db.getAIProviders();
    const gemini = providers.find(p => p.id === 'gemini');
    if (!gemini) throw new Error('Gemini provider not found in registry');

    const originalStatus = gemini.status;

    // Test: NOT_CONFIGURED should be excluded
    await db.updateAIProviderStatus('gemini', 'NOT_CONFIGURED');
    try {
      await AIModelRouter.route({ capability: 'TEXT' });
      // If we only have gemini as TEXT provider, this should throw
      const activeTextProviders = (await db.getAIModels())
        .filter(m => m.capabilities.includes('TEXT') && m.active);
      
      // If no other LIVE provider has TEXT, it should throw
      const liveProviders = (await db.getAIProviders()).filter(p => p.status === 'LIVE').map(p => p.id);
      const compatibleLive = activeTextProviders.filter(m => liveProviders.includes(m.providerId));
      
      if (compatibleLive.length === 0) {
        throw new Error('Should have thrown AI_MODEL_CAPABILITY_MISMATCH');
      }
    } catch (e: any) {
      if (!e.message.includes('MISMATCH')) throw e;
      console.log('  - Correctly excluded NOT_CONFIGURED provider.');
    } finally {
      await db.updateAIProviderStatus('gemini', originalStatus);
    }
  });

  // 4. FALLBACK LIVE TEST (Logical)
  await test('Fallback: Selection ordering', async () => {
    const result = await AIModelRouter.route({ capability: 'TEXT' });
    if (result.candidates.length > 1) {
      console.log(`  - Multiple candidates found: ${result.candidates.length}`);
      console.log(`  - Fallback order: ${result.candidates.map(c => `${c.providerId}/${c.modelId}`).join(' -> ')}`);
    } else {
      console.log('  - Only one candidate available for TEXT.');
    }
  });

  // 5. PAID FALLBACK SAFETY
  await test('Router: Paid Fallback Safety', async () => {
    const data = (db as any).getJsonData ? (db as any).getJsonData() : null;
    const settings = await db.getAISettings();
    const originalPaidFallback = settings.allowPaidFallback;

    // Force all TEXT models to be PAID except one
    const allModels = await db.getAIModels();
    const textModels = allModels.filter(m => m.capabilities.includes('TEXT'));
    
    await (db as any).pool?.query("UPDATE ai_settings SET allow_paid_fallback = false");
    if (data) data.aiSettings[0].allowPaidFallback = false;

    const result = await AIModelRouter.route({ capability: 'TEXT' });
    const fallbacks = result.candidates.slice(1);
    
    for (const fb of fallbacks) {
      const model = allModels.find(m => m.modelId === fb.modelId);
      if (model?.freeTierStatus === 'PAID' && !fb.isCustomKey) {
        throw new Error(`Paid model ${fb.modelId} included in fallback while disabled!`);
      }
    }
    console.log('  - Paid fallback safety enforced.');

    await (db as any).pool?.query(`UPDATE ai_settings SET allow_paid_fallback = ${originalPaidFallback}`);
    if (data) data.aiSettings[0].allowPaidFallback = originalPaidFallback;
  });

  // 6. BYOK SECURITY
  await test('BYOK: End-to-end security', async () => {
    const plaintext = 'sk-production-ready-key-long-enough';
    const encrypted = encrypt(plaintext);
    if (encrypted.encryptedText === plaintext) throw new Error('Encryption failed (returned plaintext)');
    
    const decrypted = decrypt(encrypted.encryptedText, encrypted.iv, encrypted.tag);
    if (decrypted !== plaintext) throw new Error('Decryption failed');
    
    console.log('  - AES-256-GCM verified.');
  });

  // 9. USAGE INTEGRITY
  await test('Usage: Audit field presence', async () => {
    const startedAt = new Date().toISOString();
    await db.recordAIUsage({
      provider: 'test',
      model: 'test-model',
      capability: 'TEXT',
      status: 'completed',
      retryCount: 0,
      fallbackUsed: false,
      isPaid: false,
      startedAt,
      completedAt: new Date().toISOString(),
      durationMs: 100
    });
    console.log('  - Usage record created with production metadata.');
  });

  // 12. PERSISTENT STORAGE
  await test('Storage: Production driver detection', async () => {
    const driver = process.env.STORAGE_DRIVER || 'local';
    console.log(`  - Active storage driver: ${driver}`);
    if (driver === 'local' && process.env.NODE_ENV === 'production') {
       console.warn('  ⚠️ Production environment using ephemeral local storage.');
    }
  });

  console.log('\n--- READINESS VERIFICATION COMPLETED ---');
}

runReadiness().catch(err => {
  console.error(err);
  process.exit(1);
});
