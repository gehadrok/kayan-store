import { db } from '../src/server/db.ts';

async function testSessionPersistence() {
  console.log('================================================================');
  console.log('🧪 Kayan | كيان — Session Persistence & Server Restart Test Suite');
  console.log('================================================================\n');

  await db.initialize();

  const testEmail = `persist_${Date.now()}@kayan.test`;
  const user = await db.createUser({
    email: testEmail,
    passwordHash: 'dummyhash',
    displayName: 'Persistence Test',
    locale: 'ar'
  });

  const { token } = await db.createUserSession(user.id, 'TestAgent', '127.0.0.1');
  console.log(`   ✅ Initial session created for user ${user.id}`);

  console.log('   🔄 Simulating database re-initialization...');
  const resolvedBefore = await db.getUserSessionByToken(token);
  if (!resolvedBefore) {
    throw new Error('FAILED: Session not valid before database re-initialization.');
  }

  await db.initialize();

  const resolvedAfter = await db.getUserSessionByToken(token);
  if (!resolvedAfter || resolvedAfter.user.id !== user.id) {
    throw new Error('FAILED: Session did not persist after database re-initialization.');
  }

  console.log('   ✅ Session successfully persisted and verified across restart simulation!');
  console.log('\n🎉 ALL SESSION PERSISTENCE TESTS PASSED SUCCESSFULLY!');
}

testSessionPersistence().catch(err => {
  console.error('❌ Session Persistence Test Failed:', err);
  process.exit(1);
});
