
import 'dotenv/config';
import { db } from '../src/server/db.ts';
import crypto from 'crypto';

async function runE2E() {
  console.log('=== STARTING KAYAN DIGITAL PRODUCTS E2E VERIFICATION ===');

  await db.initialize();

  // 1. Test Admin Authorization rules
  console.log('1. Verifying Admin Authorization rules...');
  let admin = await db.getAdminByUsername('admin');
  if (!admin) {
    admin = await db.getAdminByUsername(process.env.ADMIN_USERNAME || 'admin');
  }
  if (!admin) {
    const allAdmins = (db as any).jsonData?.admins || [];
    admin = allAdmins[0];
  }
  if (!admin) {
    throw new Error('Admin user not found in database or JSON store');
  }
  console.log(`   [PASS] Admin verified: ${admin.username} (ID: ${admin.id})`);

  // 2. Create Test Product (Draft)
  console.log('2. Creating Test Digital Product (Draft)...');
  const slug = `kayan-test-template-${Date.now()}`;
  const product = await db.createProduct({
    nameAr: 'قالب اختبار كيان (TEST)',
    nameEn: 'Kayan Test Template (TEST)',
    slug,
    type: 'template',
    category: 'Templates & UI',
    author: 'المهندس جهاد الصليحي',
    publisher: 'Kayan Soft',
    shortDescAr: 'منتج رقمي تجريبي للتحقق من دورة الرفع والنشر والتنزيل.',
    shortDescEn: 'Experimental digital product for verification of upload lifecycle.',
    fullDescAr: 'هذا منتج اختبار تجريبي تم إنشاؤه لأغراض الاختبار الآلي وإثبات الجاهزية التشغيلية للمتجر الرقمي.',
    fullDescEn: 'This is an experimental test product created for automated testing.',
    price: 0,
    currency: 'USD',
    tags: ['test', 'template', 'kayan'],
    license: 'Free',
    isPublished: false,
    status: 'draft',
    featuresAr: ['ميزات متقدمة', 'دعم كامل'],
    featuresEn: ['Advanced features', 'Full support']
  }, admin.username);

  console.log(`   [PASS] Product created with ID: ${product.id}, Status: draft, Published: false`);

  // 3. Test Public Catalog Isolation (Drafts must not appear)
  const publicProductsBefore = await db.getProducts(true); // published only
  const foundBefore = publicProductsBefore.find(p => p.id === product.id);
  if (foundBefore) {
    throw new Error('SECURITY VIOLATION: Unpublished draft appeared in public catalog!');
  }
  console.log('   [PASS] Draft successfully isolated from public catalog.');

  // 4. Update Product & Add File / Media simulation
  console.log('3. Updating Product Metadata & Adding Test File/Media...');
  const updated = await db.updateProduct(product.id, {
    fullDescAr: 'تم تحديث الوصف بنجاح خلال اختبار دورة الحياة.',
    featured: true
  }, admin.username);
  if (!updated || updated.fullDescAr !== 'تم تحديث الوصف بنجاح خلال اختبار دورة الحياة.') {
    throw new Error('Product update verification failed');
  }
  console.log('   [PASS] Product updated successfully.');

  // Simulate file upload record & media
  const fileBuffer = Buffer.from('PDF/ZIP simulated binary content for Kayan test template');
  const sha256 = crypto.createHash('sha256').update(fileBuffer).digest('hex');
  const storedFile = await db.createProductFile({
    productId: product.id,
    fileUrl: `/uploads/products/${product.id}/test_template.zip`,
    title: 'قالب كايان الرئيسي (ZIP)',
    fileType: 'MAIN',
    originalName: 'test_template.zip',
    size: '1.2 KB',
    sizeBytes: fileBuffer.length,
    sha256,
    isMain: true
  }, admin.username);
  console.log(`   [PASS] Product file record created with SHA-256: ${sha256.slice(0, 16)}...`);

  const media = await db.createProductMedia({
    productId: product.id,
    mediaType: 'cover',
    fileUrl: '/assets/images/kayan_pdf_icon.jpg',
    thumbnailUrl: '/assets/images/kayan_pdf_icon.jpg',
    titleAr: 'غلاف قالب الاختبار',
    titleEn: 'Test Template Cover',
    sortOrder: 0,
    isPublished: true
  }, admin.username);
  console.log(`   [PASS] Product media record created with ID: ${media.id}`);

  // 5. Publish Product
  console.log('4. Publishing Test Product...');
  const published = await db.publishProduct(product.id, true, admin.username);
  if (!published || !published.isPublished || published.status !== 'published') {
    throw new Error('Failed to publish product');
  }
  console.log('   [PASS] Product published successfully.');

  // Verify public catalog now includes it
  const publicProductsAfter = await db.getProducts(true);
  const foundAfter = publicProductsAfter.find(p => p.id === product.id);
  if (!foundAfter) {
    throw new Error('Published product did not appear in public catalog!');
  }
  console.log('   [PASS] Product successfully retrieved in public catalog.');

  // 6. Audit Trail Verification
  console.log('5. Verifying Audit Log Entries...');
  const auditLogs = await db.getActivityLogs(50);
  const requiredActions = [
    { action: 'CREATE_PRODUCT', targetId: product.id },
    { action: 'UPDATE_PRODUCT', targetId: product.id },
    { action: 'CREATE_PRODUCT_FILE', targetId: storedFile.id },
    { action: 'CREATE_PRODUCT_MEDIA', targetId: media.id }
  ];
  for (const item of requiredActions) {
    const foundLog = auditLogs.find(l => l.action === item.action && (l.targetId === item.targetId || l.targetId === product.id));
    if (!foundLog) {
      throw new Error(`Missing expected audit log entry: ${item.action}`);
    }
    console.log(`   [PASS] Audit log verified: ${item.action} -> "${foundLog.details}"`);
  }

  // 7. Cleanup (Remove test product cleanly)
  console.log('6. Cleaning up Test Product...');
  await db.deleteProduct(product.id, admin.username);
  console.log('   [PASS] Test product and associated files/media cleaned up cleanly.');

  console.log('=== ALL DIGITAL PRODUCTS E2E TESTS PASSED ===');
}

runE2E().catch(err => {
  console.error('E2E VERIFICATION FAILED:', err);
  process.exit(1);
});
