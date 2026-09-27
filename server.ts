import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import cookieParser from 'cookie-parser';
import multer from 'multer';
import bcrypt from 'bcryptjs';
import { db, artifactStorage } from './src/server/db.ts';
import { validateAndAnalyzeApk } from './src/server/apkValidator.ts';

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const IS_PROD = process.env.NODE_ENV === 'production';
const STORAGE_DRIVER = process.env.STORAGE_DRIVER || (IS_PROD ? 'github' : 'local');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Static directories
const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads', 'apks');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
app.use('/uploads/apks', express.static(UPLOADS_DIR));

// Multer memory storage for validating APK in-memory first
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 250 * 1024 * 1024 // 250MB limit
  }
});

// Admin Authentication Middleware
async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies.kayan_admin_session || req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ success: false, error: 'غير مصرح لك بالوصول. يرجى تسجيل الدخول كمسؤول.' });
  }

  const session = await db.getSession(token);
  if (!session) {
    return res.status(401).json({ success: false, error: 'انتهت صلاحية الجلسة. يرجى تسجيل الدخول مجدداً.' });
  }

  const admin = await db.getAdminById(session.adminId);
  if (!admin) {
    return res.status(401).json({ success: false, error: 'المستخدم غير موجود.' });
  }

  (req as any).admin = admin;
  (req as any).session = session;
  next();
}

// ==========================================
// HEALTH CHECK
// ==========================================
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    environment: IS_PROD ? 'production' : 'development'
  });
});

// ==========================================
// PUBLIC API ENDPOINTS
// ==========================================

// Get all published applications
app.get('/api/apps', async (req: Request, res: Response) => {
  const apps = await db.getApplications(true);
  const result = [];
  for (const appItem of apps) {
    const currentRelease = await db.getCurrentRelease(appItem.id);
    result.push({
      ...appItem,
      currentRelease
    });
  }
  res.json({ success: true, apps: result });
});

// Get application by slug
app.get('/api/apps/:slug', async (req: Request, res: Response) => {
  const { slug } = req.params;
  const appItem = await db.getApplicationBySlug(slug, true);
  if (!appItem) {
    return res.status(404).json({ success: false, error: 'التطبيق المطلوب غير موجود أو غير منشور حالياً.' });
  }

  const releases = await db.getReleasesByAppId(appItem.id);
  const currentRelease = await db.getCurrentRelease(appItem.id);
  const screenshots = await db.getScreenshotsByAppId(appItem.id);

  res.json({
    success: true,
    app: {
      ...appItem,
      releases,
      currentRelease,
      screenshots
    }
  });
});

// Download release APK
app.get('/api/download/:releaseId', async (req: Request, res: Response) => {
  const { releaseId } = req.params;
  const release = await db.getReleaseById(releaseId);
  if (!release) {
    return res.status(404).send('Release not found / الملف غير موجود');
  }

  const appItem = await db.getApplicationById(release.appId);

  if (STORAGE_DRIVER === 'github' && release.apkDownloadUrl && release.apkDownloadUrl.startsWith('http')) {
    return res.redirect(release.apkDownloadUrl);
  }

  const filePath = path.join(UPLOADS_DIR, release.apkFileName);
  if (fs.existsSync(filePath)) {
    const downloadName = `${appItem?.slug || 'app'}-v${release.versionName}.apk`;
    res.setHeader('Content-Type', 'application/vnd.android.package-archive');
    res.setHeader('Content-Disposition', `attachment; filename="${downloadName}"`);
    res.setHeader('X-APK-SHA256', release.sha256);
    res.setHeader('X-APK-Size-Bytes', release.apkSizeBytes.toString());

    const fileStream = fs.createReadStream(filePath);
    return fileStream.pipe(res);
  }

  if (release.apkDownloadUrl && release.apkDownloadUrl.startsWith('http')) {
    return res.redirect(release.apkDownloadUrl);
  }

  return res.status(404).send('APK file missing on server / ملف الحزمة غير متوفر على الخادم');
});

// SEO: Sitemap.xml
app.get('/sitemap.xml', async (req: Request, res: Response) => {
  const origin = `${req.protocol}://${req.get('host')}`;
  const apps = await db.getApplications(true);

  const staticUrls = [
    '',
    '/apps',
    '/about',
    '/privacy',
    '/terms',
    '/licenses'
  ];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  for (const url of staticUrls) {
    xml += `  <url>\n    <loc>${origin}${url}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>${url === '' ? '1.0' : '0.8'}</priority>\n  </url>\n`;
  }

  for (const appItem of apps) {
    xml += `  <url>\n    <loc>${origin}/apps/${appItem.slug}</loc>\n    <lastmod>${appItem.updatedAt.split('T')[0]}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.9</priority>\n  </url>\n`;
  }

  xml += `</urlset>`;

  res.setHeader('Content-Type', 'application/xml');
  res.send(xml);
});

// SEO: Robots.txt
app.get('/robots.txt', (req: Request, res: Response) => {
  const origin = `${req.protocol}://${req.get('host')}`;
  const text = `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/admin\n\nSitemap: ${origin}/sitemap.xml\n`;
  res.setHeader('Content-Type', 'text/plain');
  res.send(text);
});

// ==========================================
// ADMIN API ENDPOINTS
// ==========================================

// Login
app.post('/api/admin/login', async (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, error: 'يرجى إدخال اسم المستخدم وكلمة المرور' });
  }

  const admin = await db.getAdminByUsername(username.trim());
  if (!admin) {
    return res.status(401).json({ success: false, error: 'بيانات الدخول غير صحيحة' });
  }

  const passwordValid = await bcrypt.compare(password, admin.passwordHash);
  if (!passwordValid) {
    return res.status(401).json({ success: false, error: 'بيانات الدخول غير صحيحة' });
  }

  const session = await db.createSession(admin.id);
  await db.logActivity('ADMIN_LOGIN', 'ADMIN', admin.id, `تسجيل دخول ناجح للمسؤول (${admin.username})`, admin.username);

  res.cookie('kayan_admin_session', session.token, {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });

  res.json({
    success: true,
    token: session.token,
    admin: {
      id: admin.id,
      username: admin.username,
      email: admin.email
    }
  });
});

// Current Admin Info
app.get('/api/admin/me', requireAdmin, (req: Request, res: Response) => {
  const admin = (req as any).admin;
  res.json({
    success: true,
    admin: {
      id: admin.id,
      username: admin.username,
      email: admin.email
    }
  });
});

// Logout
app.post('/api/admin/logout', requireAdmin, async (req: Request, res: Response) => {
  const session = (req as any).session;
  const admin = (req as any).admin;
  if (session) {
    await db.deleteSession(session.token);
  }
  await db.logActivity('ADMIN_LOGOUT', 'ADMIN', admin.id, `تسجيل خروج المسؤول (${admin.username})`, admin.username);
  res.clearCookie('kayan_admin_session');
  res.json({ success: true });
});

// Change Password
app.post('/api/admin/change-password', requireAdmin, async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  const admin = (req as any).admin;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, error: 'يرجى ملء جميع الحقول' });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ success: false, error: 'يجب ألا تقل كلمة المرور الجديدة عن 8 أحرف' });
  }

  const matches = await bcrypt.compare(currentPassword, admin.passwordHash);
  if (!matches) {
    return res.status(400).json({ success: false, error: 'كلمة المرور الحالية غير صحيحة' });
  }

  const salt = await bcrypt.genSalt(10);
  const newHash = await bcrypt.hash(newPassword, salt);
  await db.updateAdminPassword(admin.id, newHash);
  await db.logActivity('CHANGE_PASSWORD', 'ADMIN', admin.id, 'تم تغيير كلمة المرور بنجاح', admin.username);

  res.json({ success: true, message: 'تم تحديث كلمة المرور بنجاح' });
});

// Dashboard stats
app.get('/api/admin/dashboard-stats', requireAdmin, async (req: Request, res: Response) => {
  const stats = await db.getStats();
  res.json({ success: true, stats });
});

// Admin Applications list
app.get('/api/admin/apps', requireAdmin, async (req: Request, res: Response) => {
  const apps = await db.getApplications(false);
  const result = [];
  for (const a of apps) {
    const releases = await db.getReleasesByAppId(a.id);
    const currentRelease = await db.getCurrentRelease(a.id);
    result.push({
      ...a,
      releasesCount: releases.length,
      currentRelease
    });
  }
  res.json({ success: true, apps: result });
});

// Create Application
app.post('/api/admin/apps', requireAdmin, async (req: Request, res: Response) => {
  const admin = (req as any).admin;
  const {
    nameAr, nameEn, slug, shortDescAr, shortDescEn, fullDescAr, fullDescEn,
    featuresAr, featuresEn, category, minAndroid, packageName,
    iconUrl, bannerUrl, privacyUrl, termsUrl, copyright, isPublished, featured
  } = req.body;

  if (!nameAr || !nameEn || !slug || !packageName) {
    return res.status(400).json({ success: false, error: 'يرجى ملء الحقول الأساسية (الاسم، المعرّف، اسم الحزمة)' });
  }

  const existingSlug = await db.getApplicationBySlug(slug, false);
  if (existingSlug) {
    return res.status(400).json({ success: false, error: 'معرّف الرابط (Slug) مستخدم بالفعل، يرجى اختيار معرّف آخر' });
  }

  const newApp = await db.createApplication({
    nameAr,
    nameEn,
    slug: slug.toLowerCase().trim().replace(/[^a-z0-9_-]/g, '-'),
    shortDescAr: shortDescAr || '',
    shortDescEn: shortDescEn || '',
    fullDescAr: fullDescAr || '',
    fullDescEn: fullDescEn || '',
    featuresAr: Array.isArray(featuresAr) ? featuresAr : [],
    featuresEn: Array.isArray(featuresEn) ? featuresEn : [],
    category: category || 'Tools & Documents',
    minAndroid: minAndroid || '7.0 / API 24',
    packageName: packageName.trim(),
    iconUrl: iconUrl || '/src/assets/images/kayan_pdf_icon_1790438337873.jpg',
    bannerUrl: bannerUrl || '/src/assets/images/kayan_pdf_feature_banner_1790438354730.jpg',
    privacyUrl: privacyUrl || '/privacy',
    termsUrl: termsUrl || '/terms',
    copyright: copyright || '© 2026 المهندس جهاد الصليحي. جميع الحقوق محفوظة.',
    isPublished: !!isPublished,
    featured: !!featured
  }, admin.username);

  res.json({ success: true, app: newApp });
});

// Update Application
app.put('/api/admin/apps/:id', requireAdmin, async (req: Request, res: Response) => {
  const admin = (req as any).admin;
  const { id } = req.params;
  const updates = req.body;

  const updated = await db.updateApplication(id, updates, admin.username);
  if (!updated) {
    return res.status(404).json({ success: false, error: 'التطبيق غير موجود' });
  }

  res.json({ success: true, app: updated });
});

// Delete Application
app.delete('/api/admin/apps/:id', requireAdmin, async (req: Request, res: Response) => {
  const admin = (req as any).admin;
  const { id } = req.params;
  const deleted = await db.deleteApplication(id, admin.username);
  if (!deleted) {
    return res.status(404).json({ success: false, error: 'التطبيق غير موجود' });
  }
  res.json({ success: true });
});

// Toggle Publish Status
app.post('/api/admin/apps/:id/toggle-publish', requireAdmin, async (req: Request, res: Response) => {
  const admin = (req as any).admin;
  const { id } = req.params;
  const appItem = await db.togglePublish(id, admin.username);
  if (!appItem) {
    return res.status(404).json({ success: false, error: 'التطبيق غير موجود' });
  }
  res.json({ success: true, isPublished: appItem.isPublished });
});

// Upload and Validate APK file
app.post('/api/admin/upload-apk', requireAdmin, upload.single('apkFile'), async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'لم يتم إرسال أي ملف APK' });
  }

  const analysis = validateAndAnalyzeApk(req.file.buffer, req.file.originalname);
  if (!analysis.valid) {
    return res.status(400).json({
      success: false,
      error: analysis.error || 'الملف المرفوع غير صالح كحزمة APK'
    });
  }

  try {
    const versionTag = `v${analysis.versionNameCandidate || '1.0.0'}`;
    const storedResult = await artifactStorage.saveArtifact(
      req.file.originalname,
      req.file.buffer,
      versionTag,
      analysis.versionNameCandidate || '1.0.0'
    );

    res.json({
      success: true,
      fileInfo: {
        fileName: storedResult.storedName,
        originalName: req.file.originalname,
        sizeBytes: analysis.sizeBytes,
        sizeFormatted: analysis.sizeFormatted,
        sha256: analysis.sha256,
        hasManifest: analysis.hasManifest,
        hasDex: analysis.hasDex,
        hasResources: analysis.hasResources,
        packageNameCandidate: analysis.packageNameCandidate,
        downloadUrl: storedResult.downloadUrl
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: `فشل تخزين أو رفع الحزمة: ${err.message || err}` });
  }
});

// Create Release for Application
app.post('/api/admin/releases', requireAdmin, async (req: Request, res: Response) => {
  const admin = (req as any).admin;
  const {
    appId, versionName, versionCode, apkFileName, apkSize, apkSizeBytes,
    sha256, minAndroid, releaseNotesAr, releaseNotesEn, isCurrent, apkDownloadUrl
  } = req.body;

  if (!appId || !versionName || !versionCode || !apkFileName || !sha256 || !apkSizeBytes) {
    return res.status(400).json({ success: false, error: 'يرجى تقديم بيانات الإصدار وملف الحزمة المعتمد' });
  }

  const appItem = await db.getApplicationById(appId);
  if (!appItem) {
    return res.status(404).json({ success: false, error: 'التطبيق التابع للإصدار غير موجود' });
  }

  // Reject release if packageName Candidate is provided and does not match expected app package name
  if (appItem.packageName && req.body.packageNameCandidate) {
    if (req.body.packageNameCandidate !== appItem.packageName) {
      return res.status(400).json({
        success: false,
        error: `اسم حزمة APK المرفوع (${req.body.packageNameCandidate}) لا يطابق اسم الحزمة المسجل للتطبيق (${appItem.packageName})`
      });
    }
  }

  const release = await db.createRelease({
    appId,
    versionName: String(versionName).trim(),
    versionCode: parseInt(versionCode, 10),
    apkFileName,
    apkDownloadUrl: apkDownloadUrl || '',
    apkSize: apkSize || `${(parseInt(apkSizeBytes, 10) / (1024 * 1024)).toFixed(2)} MB`,
    apkSizeBytes: parseInt(apkSizeBytes, 10),
    sha256,
    minAndroid: minAndroid || appItem.minAndroid,
    releaseNotesAr: releaseNotesAr || '',
    releaseNotesEn: releaseNotesEn || '',
    isCurrent: isCurrent !== false,
    releaseDate: new Date().toISOString().split('T')[0]
  }, admin.username);

  res.json({ success: true, release });
});

// Delete Release
app.delete('/api/admin/releases/:id', requireAdmin, async (req: Request, res: Response) => {
  const admin = (req as any).admin;
  const { id } = req.params;
  const deleted = await db.deleteRelease(id, admin.username);
  if (!deleted) {
    return res.status(404).json({ success: false, error: 'الإصدار غير موجود' });
  }
  res.json({ success: true });
});

// SEO Endpoints
app.get('/robots.txt', (req: Request, res: Response) => {
  const host = req.headers.host || 'kayanstore.com';
  const protocol = req.headers['x-forwarded-proto'] || 'https';
  res.type('text/plain');
  res.send(`User-agent: *
Allow: /
Disallow: /api/admin/
Disallow: /admin
Sitemap: ${protocol}://${host}/sitemap.xml
`);
});

app.get('/sitemap.xml', async (req: Request, res: Response) => {
  const host = req.headers.host || 'kayanstore.com';
  const protocol = req.headers['x-forwarded-proto'] || 'https';
  const baseUrl = `${protocol}://${host}`;

  const apps = await db.getApplications(true);
  const appUrls = apps.map(a => `
  <url>
    <loc>${baseUrl}/apps/${a.slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>`).join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/apps</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>${appUrls}
  <url>
    <loc>${baseUrl}/about</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>${baseUrl}/privacy</loc>
    <changefreq>monthly</changefreq>
    <priority>0.3</priority>
  </url>
  <url>
    <loc>${baseUrl}/terms</loc>
    <changefreq>monthly</changefreq>
    <priority>0.3</priority>
  </url>
  <url>
    <loc>${baseUrl}/licenses</loc>
    <changefreq>monthly</changefreq>
    <priority>0.3</priority>
  </url>
</urlset>`;

  res.type('application/xml');
  res.send(xml.trim());
});

// Activity logs
app.get('/api/admin/activity', requireAdmin, async (req: Request, res: Response) => {
  const logs = await db.getActivityLogs(50);
  res.json({ success: true, logs });
});

// ==========================================
// VITE OR STATIC SERVE
// ==========================================
async function startServer() {
  if (!IS_PROD) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);

    app.use('*', async (req: Request, res: Response, next: NextFunction) => {
      const url = req.originalUrl;
      try {
        let template = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e: any) {
        if (vite.ssrFixStacktrace) {
          vite.ssrFixStacktrace(e);
        }
        next(e);
      }
    });
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Kayan Store server listening on port ${PORT} (http://localhost:${PORT})`);
  });
}

startServer();
