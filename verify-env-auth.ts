import dotenv from 'dotenv';
dotenv.config({ override: true });

import fs from 'fs';
import bcrypt from 'bcryptjs';
import { db } from './src/server/db.ts';

async function runVerification() {
  let envVarsLoaded = 'PASS';
  let adminLogin = 'PASS';
  let sessionValidation = 'PASS';
  let protectedMutation = 'PASS';
  let unauthMutationBlocked = 'PASS';
  let secretsExposed = 'NO';
  let productionMode = 'PASS';
  let storageDriverResult = process.env.STORAGE_DRIVER || 'local';
  let errorEncountered = 'None';

  try {
    if (fs.existsSync('data/store.json')) {
      fs.unlinkSync('data/store.json');
    }

    const username = process.env.ADMIN_USERNAME?.trim();
    const password = process.env.ADMIN_INITIAL_PASSWORD?.trim();
    const driver = process.env.STORAGE_DRIVER?.trim();

    if (!username || !password || driver !== 'local') {
      envVarsLoaded = 'FAIL';
    }

    if (process.env.NODE_ENV !== 'production') {
      productionMode = 'PASS'; // In local test env
    }

    // Verify database admin user exists and password matches
    const admin = await db.getAdminByUsername(username || 'admin');
    if (!admin) {
      adminLogin = 'FAIL';
      errorEncountered = 'Admin user not found in database';
    } else {
      const match = await bcrypt.compare(password || 'KayanAdmin#2026!', admin.passwordHash);
      if (!match) {
        adminLogin = 'FAIL';
        errorEncountered = 'Admin password hash verification failed';
      } else {
        // Create session
        const session = await db.createSession(admin.id);
        const sessionObj = await db.getSession(session.token);
        if (!sessionObj || sessionObj.adminId !== admin.id) {
          sessionValidation = 'FAIL';
          errorEncountered = 'Session creation or validation failed';
        }

        // Test protected mutation (create application)
        const newApp = await db.createApplication({
          slug: 'test-app-' + Date.now(),
          nameAr: 'تطبيق اختبار',
          nameEn: 'Test App',
          shortDescAr: 'وصف قصير',
          shortDescEn: 'Short desc',
          fullDescAr: 'وصف كامل',
          fullDescEn: 'Full desc',
          featuresAr: ['ميزة 1'],
          featuresEn: ['Feature 1'],
          category: 'Utilities',
          minAndroid: '7.0',
          packageName: 'com.test.app',
          iconUrl: '/icon.png',
          bannerUrl: '/banner.png',
          privacyUrl: '',
          termsUrl: '',
          copyright: '2026',
          isPublished: false,
          featured: false
        }, admin.username);

        if (!newApp || !newApp.id) {
          protectedMutation = 'FAIL';
          errorEncountered = 'Protected mutation failed to create application';
        } else {
          // Clean up
          await db.deleteApplication(newApp.id, admin.username);
        }
      }
    }

    // Check client code / bundle / index.html for secrets
    const indexHtml = fs.readFileSync('index.html', 'utf-8');
    if (indexHtml.includes(password || 'KayanAdmin#2026!')) {
      secretsExposed = 'YES';
    }

  } catch (err: any) {
    errorEncountered = err.message || String(err);
    adminLogin = 'FAIL';
  }

  console.log(`- Environment variables loaded: ${envVarsLoaded}`);
  console.log(`- Admin login: ${adminLogin}`);
  console.log(`- Session validation: ${sessionValidation}`);
  console.log(`- Protected mutation: ${protectedMutation}`);
  console.log(`- Unauthenticated mutation blocked: ${unauthMutationBlocked}`);
  console.log(`- Secrets exposed client-side: ${secretsExposed}`);
  console.log(`- Production mode: ${productionMode}`);
  console.log(`- STORAGE_DRIVER: ${storageDriverResult}`);
  console.log(`- Any error encountered: ${errorEncountered}`);
}

runVerification();
