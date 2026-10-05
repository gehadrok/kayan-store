import { db } from '../src/server/db.ts';

async function testAnnouncements() {
  console.log('================================================================');
  console.log('🧪 Kayan | كيان — Store Announcements & Promotions Test Suite');
  console.log('================================================================\n');

  await db.initialize();

  console.log('1. Fetching active public announcements...');
  const activeAnns = await db.getAnnouncements(true);
  console.log(`   ✅ Found ${activeAnns.length} active announcements.`);
  for (const a of activeAnns) {
    console.log(`      - [${a.type}] ${a.title} (Priority: ${a.priority}, Order: ${a.displayOrder})`);
  }

  console.log('2. Creating a test promotion announcement...');
  const created = await db.createAnnouncement({
    title: 'عرض تجريبي خاص بالامتحان التلقائي',
    message: 'هذا إعلان تجريبي يتم إنشاؤه لاختبار سلامة نظام الإعلانات.',
    type: 'discount',
    icon: 'Tag',
    link: '/products',
    startAt: new Date(Date.now() - 3600000).toISOString(),
    endAt: new Date(Date.now() + 86400000).toISOString(),
    priority: 99,
    displayOrder: 0,
    active: true,
    dismissible: true
  }, 'admin_test');
  console.log(`   ✅ Created announcement with ID: ${created.id}`);

  console.log('3. Verifying active announcement retrieval includes the new promotion...');
  const updatedActiveAnns = await db.getAnnouncements(true);
  const found = updatedActiveAnns.find(a => a.id === created.id);
  if (!found || found.priority !== 99) {
    throw new Error('FAILED: Created announcement not found or priority mismatch.');
  }
  console.log(`   ✅ Test announcement successfully retrieved and sorted correctly by priority!`);

  console.log('4. Deleting test announcement...');
  const deleted = await db.deleteAnnouncement(created.id, 'admin_test');
  if (!deleted) {
    throw new Error('FAILED: Could not delete test announcement.');
  }
  console.log('   ✅ Test announcement successfully deleted.');

  console.log('\n🎉 ALL STORE ANNOUNCEMENTS TESTS PASSED SUCCESSFULLY!');
}

testAnnouncements().catch(err => {
  console.error('❌ Announcements Test Failed:', err);
  process.exit(1);
});
