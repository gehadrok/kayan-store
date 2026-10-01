import { db } from '../src/server/db.ts';
import bcrypt from 'bcryptjs';

async function testE2EAuth() {
  console.log('================================================================');
  console.log('🧪 Kayan | كيان — E2E Authentication & AI Project Test Suite');
  console.log('================================================================\n');

  await db.initialize();

  const testEmail = `test_${Date.now()}@kayan.test`;
  const password = 'Password123!';
  const displayName = 'Test User Kayan';

  console.log(`1. Registering test user: ${testEmail}`);
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await db.createUser({
    email: testEmail,
    passwordHash,
    displayName,
    locale: 'ar'
  });
  console.log(`   ✅ User created with ID: ${user.id}`);

  console.log('2. Creating user session (Login simulation)...');
  const sessionResult = await db.createUserSession(user.id, 'TestAgent', '127.0.0.1');
  const token = sessionResult.token;
  console.log(`   ✅ Session token generated successfully.`);

  console.log('3. Resolving session via getUserSessionByToken (/api/auth/me equivalent)...');
  const resolved = await db.getUserSessionByToken(token);
  if (!resolved || resolved.user.id !== user.id) {
    throw new Error('FAILED: Session token could not be resolved to valid user.');
  }
  console.log(`   ✅ Session successfully resolved for user: ${resolved.user.email}`);

  console.log('4. Creating AI project for authenticated user...');
  const project = await db.createAIProject(user.id, 'E2E Test Project', 'Testing Kayan AI integration', 'GENERAL');
  console.log(`   ✅ Project created with ID: ${project.id}`);

  console.log('5. Retrieving user AI projects...');
  const userProjects = await db.getUserAIProjects(user.id);
  const found = userProjects.find(p => p.id === project.id);
  if (!found) {
    throw new Error('FAILED: Created project not found in user projects list.');
  }
  console.log(`   ✅ Project successfully retrieved from database!`);

  console.log('\n🎉 ALL E2E AUTHENTICATION TESTS PASSED SUCCESSFULLY!');
}

testE2EAuth().catch(err => {
  console.error('❌ E2E Authentication Test Failed:', err);
  process.exit(1);
});
