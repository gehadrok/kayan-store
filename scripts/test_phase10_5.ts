
import 'dotenv/config';
import { db } from '../src/server/db.ts';

async function runTests() {
  console.log('🚀 Phase 10.5 AI Admin Control Center Verification\n');

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

  // 1. Database Table Existence
  await test('AI Settings Table Persistence', async () => {
    const settings = await db.getAISettings();
    if (!settings) throw new Error('Settings not initialized');
    console.log(`   - Default Mode: ${settings.routingMode}, Retries: ${settings.maxRetryAttempts}`);
  });

  // 2. Provider CRUD
  await test('Provider Metadata Update', async () => {
    const providers = await db.getAIProviders();
    const gemini = providers.find(p => p.id === 'gemini');
    if (!gemini) throw new Error('Gemini provider missing');
    
    const originalName = gemini.displayName;
    await db.updateAIProviderDetails('gemini', { displayName: 'Google Gemini Pro' });
    
    const updated = await db.getAIProviderById('gemini');
    if (updated?.displayName !== 'Google Gemini Pro') throw new Error('Update failed');
    
    // Restore
    await db.updateAIProviderDetails('gemini', { displayName: originalName });
  });

  // 3. Settings Update
  await test('Global Routing Policy Update', async () => {
    const original = await db.getAISettings();
    await db.updateAISettings({ routingMode: 'FREE_FIRST', allowPaidFallback: true });
    
    const updated = await db.getAISettings();
    if (updated.routingMode !== 'FREE_FIRST' || updated.allowPaidFallback !== true) {
      throw new Error('Settings update failed');
    }
    
    // Restore
    await db.updateAISettings(original);
  });

  // 4. Model Registry CRUD
  await test('Model Registry Management', async () => {
    const newModelId = 'test-model-999';
    await db.createAIModel({
      id: 'model_test_999',
      providerId: 'gemini',
      modelId: newModelId,
      displayNameAr: 'نموذج تجريبي',
      displayNameEn: 'Test Model',
      active: true,
      priority: 1,
      capabilities: ['TEXT'],
      pricingClass: 'FREE',
      freeTierStatus: 'FREE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    const models = await db.getAIModels();
    const found = models.find(m => m.modelId === newModelId);
    if (!found) throw new Error('Model creation failed');
    
    await db.deleteAIModel(found.id);
    const deletedModels = await db.getAIModels();
    if (deletedModels.find(m => m.modelId === newModelId)) throw new Error('Model deletion failed');
  });

  // 5. Usage Aggregation
  await test('AI Usage Statistics Aggregation', async () => {
    const stats = await db.getAIUsageStats();
    if (!Array.isArray(stats)) throw new Error('Stats should be an array');
    console.log(`   - Aggregated data for ${stats.length} model/capability pairs`);
  });

  console.log(`\n==================================================`);
  console.log(`PHASE 10.5 SUMMARY: ${passed} Passed, ${failed} Failed`);
  console.log(`==================================================\n`);

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error('Fatal error during test:', err);
  process.exit(1);
});
