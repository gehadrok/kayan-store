import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import AdmZip from 'adm-zip';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';
import cookieParser from 'cookie-parser';
import multer from 'multer';
import bcrypt from 'bcryptjs';
import { db, artifactStorage } from './src/server/db.ts';
import { validateAndAnalyzeApk } from './src/server/apkValidator.ts';
import { aiGateway } from './src/server/ai/index.ts';
import { DocumentProcessor } from './src/server/documents/index.ts';
import { registerDocumentRoutes } from './src/server/documents/documentRoutes.ts';
import { registerVisionRoutes } from './src/server/ai/visionRoutes.ts';
import { registerAppBuilderRoutes } from './src/server/ai/appBuilderRoutes.ts';
import { registerPreviewRoutes } from './src/server/ai/previewRoutes.ts';
import { registerExportRoutes } from './src/server/ai/exportRoutes.ts';
import { MODEL_CAPABILITY_MAPPING } from './src/server/ai/constants.ts';
import { NewsEngine } from './src/server/newsEngine.ts';
import { setupNewsApi } from './src/server/newsApiHandler.ts';
import { registerCVRoutes } from './src/server/cv/cvRoutes.ts';
import { registerBuildRoutes } from './src/server/build/buildRoutes.ts';

const app = express();
app.set('trust proxy', 1);
const PORT = parseInt(process.env.PORT || '3000', 10);
const IS_PROD = process.env.NODE_ENV === 'production' || (process.env.NODE_ENV !== 'development' && fs.existsSync(path.resolve(process.cwd(), 'dist')));
const STORAGE_DRIVER = process.env.STORAGE_DRIVER || (IS_PROD ? 'github' : 'local');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const newsEngine = new NewsEngine(db);
setupNewsApi(app, db, newsEngine, requireAdmin);

// Static directories
const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads', 'apks');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
app.use('/uploads/apks', express.static(UPLOADS_DIR));

const PRODUCTS_UPLOADS_DIR = path.resolve(process.cwd(), 'uploads', 'products');
if (!fs.existsSync(PRODUCTS_UPLOADS_DIR)) {
  fs.mkdirSync(PRODUCTS_UPLOADS_DIR, { recursive: true });
}
app.use('/uploads/products', express.static(PRODUCTS_UPLOADS_DIR));

const MEDIA_UPLOADS_DIR = path.resolve(process.cwd(), 'uploads', 'media');
if (!fs.existsSync(MEDIA_UPLOADS_DIR)) {
  fs.mkdirSync(MEDIA_UPLOADS_DIR, { recursive: true });
}
app.use('/uploads/media', express.static(MEDIA_UPLOADS_DIR));

// Static images directory from public/assets/images
const PUBLIC_ASSETS_DIR = path.resolve(process.cwd(), 'public', 'assets', 'images');
if (fs.existsSync(PUBLIC_ASSETS_DIR)) {
  app.use('/assets/images', express.static(PUBLIC_ASSETS_DIR));
  // Backwards compatibility for legacy /src/assets/images requests
  app.use('/src/assets/images', express.static(PUBLIC_ASSETS_DIR));
}

function isValidVideoUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim().toLowerCase();
  try {
    const parsed = new URL(trimmed);
    const hostname = parsed.hostname;
    return (
      hostname === 'www.youtube.com' ||
      hostname === 'youtube.com' ||
      hostname === 'm.youtube.com' ||
      hostname === 'youtu.be' ||
      hostname === 'www.vimeo.com' ||
      hostname === 'vimeo.com' ||
      hostname === 'player.vimeo.com'
    );
  } catch {
    return false;
  }
}

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
    return res.status(401).json({ success: false, error: 'ط؛ظٹط± ظ…طµط±ط­ ظ„ظƒ ط¨ط§ظ„ظˆطµظˆظ„. ظٹط±ط¬ظ‰ طھط³ط¬ظٹظ„ ط§ظ„ط¯ط®ظˆظ„ ظƒظ…ط³ط¤ظˆظ„.' });
  }

  const session = await db.getSession(token);
  if (!session) {
    return res.status(401).json({ success: false, error: 'ط§ظ†طھظ‡طھ طµظ„ط§ط­ظٹط© ط§ظ„ط¬ظ„ط³ط©. ظٹط±ط¬ظ‰ طھط³ط¬ظٹظ„ ط§ظ„ط¯ط®ظˆظ„ ظ…ط¬ط¯ط¯ط§ظ‹.' });
  }

  const admin = await db.getAdminById(session.adminId);
  if (!admin) {
    return res.status(401).json({ success: false, error: 'ط§ظ„ظ…ط³طھط®ط¯ظ… ط؛ظٹط± ظ…ظˆط¬ظˆط¯.' });
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
    environment: IS_PROD ? 'production' : 'development',
    dbReady: db.isInitialized()
  });
});

// Database Readiness Middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.path.startsWith('/api/health')) return next();
  if (!db.isInitialized()) {
    return res.status(503).json({ success: false, error: 'SERVICE_UNAVAILABLE', message: 'Database is still initializing. Please try again later.' });
  }
  next();
});

// ==========================================
// STORE ANNOUNCEMENTS / PROMOTIONS API
// ==========================================

// Get active public announcements with ticker speed and height settings
app.get('/api/announcements', async (req: Request, res: Response) => {
  try {
    const [announcements, tickerSettings] = await Promise.all([
      db.getAnnouncements(true),
      db.getTickerSettings()
    ]);
    res.json({
      success: true,
      announcements,
      tickerSpeed: tickerSettings.speed,
      tickerHeight: tickerSettings.height
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'ظپط´ظ„ ظپظٹ طھط­ظ…ظٹظ„ ط§ظ„ط¥ط¹ظ„ط§ظ†ط§طھ ظˆط§ظ„ط¹ط±ظˆط¶' });
  }
});

// Public: Get ticker settings
app.get('/api/ticker-settings', async (req: Request, res: Response) => {
  try {
    const settings = await db.getTickerSettings();
    res.json({ success: true, tickerSpeed: settings.speed, tickerHeight: settings.height });
  } catch {
    res.json({ success: true, tickerSpeed: 35, tickerHeight: 40 });
  }
});

// Admin: Update ticker speed and height setting
app.put('/api/admin/ticker-settings', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { speed, height } = req.body;
    const settings = await db.updateTickerSettings(
      typeof speed === 'number' ? speed : 35,
      typeof height === 'number' ? height : 40
    );
    res.json({
      success: true,
      tickerSpeed: settings.speed,
      tickerHeight: settings.height,
      message: 'طھظ… طھط­ط¯ظٹط« ط¥ط¹ط¯ط§ط¯ط§طھ ط´ط±ظٹط· ط§ظ„ط£ط®ط¨ط§ط± ط¨ظ†ط¬ط§ط­'
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'ظپط´ظ„ ظپظٹ طھط­ط¯ظٹط« ط¥ط¹ط¯ط§ط¯ط§طھ ط´ط±ظٹط· ط§ظ„ط£ط®ط¨ط§ط±' });
  }
});

// Admin: Get all announcements
app.get('/api/admin/announcements', requireAdmin, async (req: Request, res: Response) => {
  try {
    const announcements = await db.getAnnouncements(false);
    res.json({ success: true, announcements });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'ظپط´ظ„ ظپظٹ طھط­ظ…ظٹظ„ ط¥ط¯ط§ط±ط© ط§ظ„ط¥ط¹ظ„ط§ظ†ط§طھ' });
  }
});

// Admin: Create announcement
app.post('/api/admin/announcements', requireAdmin, async (req: Request, res: Response) => {
  try {
    const admin = (req as any).admin;
    const { title, message, type, icon, link, productId, startAt, endAt, priority, displayOrder, active, dismissible } = req.body;
    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ success: false, error: 'ط¹ظ†ظˆط§ظ† ط§ظ„ط¥ط¹ظ„ط§ظ† ظ…ط·ظ„ظˆط¨' });
    }
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ success: false, error: 'ظ…ط­طھظˆظ‰ ط§ظ„ط¥ط¹ظ„ط§ظ† ظ…ط·ظ„ظˆط¨' });
    }

    const announcement = await db.createAnnouncement({
      title: title.trim(),
      message: message.trim(),
      type: type || 'info',
      icon: icon ? String(icon).trim() : undefined,
      link: link ? String(link).trim() : undefined,
      productId: productId ? String(productId).trim() : undefined,
      startAt: startAt || new Date().toISOString(),
      endAt: endAt || new Date(Date.now() + 86400000 * 30).toISOString(),
      priority: typeof priority === 'number' ? priority : parseInt(priority, 10) || 0,
      displayOrder: typeof displayOrder === 'number' ? displayOrder : parseInt(displayOrder, 10) || 0,
      active: active !== false,
      dismissible: dismissible !== false
    }, admin.username);

    res.status(201).json({ success: true, announcement });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'ظپط´ظ„ ظپظٹ ط¥ظ†ط´ط§ط، ط§ظ„ط¥ط¹ظ„ط§ظ†' });
  }
});

// Admin: Update announcement
app.put('/api/admin/announcements/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const admin = (req as any).admin;
    const { id } = req.params;
    const updated = await db.updateAnnouncement(id, req.body, admin.username);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'ط§ظ„ط¥ط¹ظ„ط§ظ† ط؛ظٹط± ظ…ظˆط¬ظˆط¯' });
    }
    res.json({ success: true, announcement: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'ظپط´ظ„ ظپظٹ طھط­ط¯ظٹط« ط§ظ„ط¥ط¹ظ„ط§ظ†' });
  }
});

// Admin: Delete announcement
app.delete('/api/admin/announcements/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const admin = (req as any).admin;
    const { id } = req.params;
    const deleted = await db.deleteAnnouncement(id, admin.username);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'ط§ظ„ط¥ط¹ظ„ط§ظ† ط؛ظٹط± ظ…ظˆط¬ظˆط¯' });
    }
    res.json({ success: true, message: 'طھظ… ط­ط°ظپ ط§ظ„ط¥ط¹ظ„ط§ظ† ط¨ظ†ط¬ط§ط­' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'ظپط´ظ„ ظپظٹ ط­ط°ظپ ط§ظ„ط¥ط¹ظ„ط§ظ†' });
  }
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
    return res.status(404).json({ success: false, error: 'ط§ظ„طھط·ط¨ظٹظ‚ ط§ظ„ظ…ط·ظ„ظˆط¨ ط؛ظٹط± ظ…ظˆط¬ظˆط¯ ط£ظˆ ط؛ظٹط± ظ…ظ†ط´ظˆط± ط­ط§ظ„ظٹط§ظ‹.' });
  }

  const releases = await db.getReleasesByAppId(appItem.id);
  const currentRelease = await db.getCurrentRelease(appItem.id);
  const screenshots = await db.getScreenshotsByAppId(appItem.id);
  const media = await db.getMediaByAppId(appItem.id, true);

  res.json({
    success: true,
    app: {
      ...appItem,
      releases,
      currentRelease,
      screenshots,
      media
    }
  });
});

// ==========================================
// PUBLIC DIGITAL PRODUCTS API
// ==========================================

// Get all published products with optional filters
app.get('/api/products', async (req: Request, res: Response) => {
  const { type, category, search, free, featured } = req.query;
  let products = await db.getProducts(true);

  if (type && typeof type === 'string' && type !== 'all') {
    products = products.filter(p => p.type.toLowerCase() === type.toLowerCase());
  }

  if (category && typeof category === 'string' && category !== 'all') {
    products = products.filter(p => p.category.toLowerCase() === category.toLowerCase());
  }

  if (free === 'true') {
    products = products.filter(p => !p.price || p.price === 0);
  } else if (free === 'false') {
    products = products.filter(p => p.price && p.price > 0);
  }

  if (featured === 'true') {
    products = products.filter(p => p.featured);
  }

  if (search && typeof search === 'string' && search.trim()) {
    const q = search.trim().toLowerCase();
    products = products.filter(p =>
      p.nameAr.toLowerCase().includes(q) ||
      p.nameEn.toLowerCase().includes(q) ||
      p.shortDescAr.toLowerCase().includes(q) ||
      p.shortDescEn.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      (p.tags && p.tags.some(t => t.toLowerCase().includes(q)))
    );
  }

  res.json({ success: true, products });
});

// Get product details by slug
app.get('/api/products/:slug', async (req: Request, res: Response) => {
  const { slug } = req.params;
  const product = await db.getProductBySlug(slug, true);
  if (!product) {
    return res.status(404).json({ success: false, error: 'ط§ظ„ظ…ظ†طھط¬ ط§ظ„ظ…ط·ظ„ظˆط¨ ط؛ظٹط± ظ…ظˆط¬ظˆط¯ ط£ظˆ ط؛ظٹط± ظ…ظ†ط´ظˆط± ط­ط§ظ„ظٹط§ظ‹.' });
  }

  const media = await db.getMediaByProductId(product.id, true);
  const files = await db.getProductFiles(product.id);
  const allProducts = await db.getProducts(true);
  const related = allProducts
    .filter(p => p.id !== product.id && (p.category === product.category || p.type === product.type))
    .slice(0, 4);

  res.json({
    success: true,
    product: {
      ...product,
      media,
      files,
      related
    }
  });
});

// Admin: Media Management
app.get('/api/admin/apps/:appId/media', requireAdmin, async (req: Request, res: Response) => {
  const { appId } = req.params;
  const media = await db.getMediaByAppId(appId, false);
  res.json({ success: true, media });
});

// Download release APK (Official GitHub Release Asset API Proxy - Hardened Architecture)
app.get('/api/download/:releaseId', async (req: Request, res: Response) => {
  const { releaseId } = req.params;
  const release = await db.getReleaseById(releaseId);
  if (!release) {
    return res.status(404).send('Release not found / ط§ظ„ظ…ظ„ظپ ط؛ظٹط± ظ…ظˆط¬ظˆط¯');
  }

  const appItem = await db.getApplicationById(release.appId);
  const downloadName = `${appItem?.slug || 'app'}-${release.apkFileName}`;

  // 1. Resolve Asset ID strictly by matching release.apkFileName across GitHub repository releases
  let assetId: number | null = null;
  try {
    const headers: Record<string, string> = {
      'User-Agent': 'Kayan-Store-Server',
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2026-03-10'
    };
    if (process.env.GITHUB_TOKEN) {
      headers['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`;
    }
    const releasesRes = await fetch('https://api.github.com/repos/gehadrok/kayan-store/releases', { headers, redirect: 'follow' });
    if (releasesRes.ok) {
      const releasesList: any[] = await releasesRes.json();
      for (const rel of releasesList) {
        const found = rel.assets?.find((a: any) => a.name === release.apkFileName);
        if (found) {
          assetId = found.id;
          break;
        }
      }
    }
  } catch (e: any) {
    console.error('GitHub Releases fetch error:', e?.message || e);
  }

  // 2. Defensive check: If no matching asset ID found for this release's apkFileName, return 404/502 explicitly without fallback to other apps
  if (!assetId) {
    console.error('GitHub Asset Resolution Error: No matching GitHub asset found for filename:', release.apkFileName);
    return res.status(404).send(`Asset not found on GitHub for file: ${release.apkFileName}`);
  }

  const assetApiUrl = `https://api.github.com/repos/gehadrok/kayan-store/releases/assets/${assetId}`;

  try {
    const headers: Record<string, string> = {
      'User-Agent': 'Kayan-Store-Server',
      'Accept': 'application/octet-stream',
      'X-GitHub-Api-Version': '2026-03-10'
    };
    const token = process.env.GITHUB_TOKEN;
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const upstreamRes = await fetch(assetApiUrl, {
      headers,
      redirect: 'follow'
    });

    const upstreamContentType = upstreamRes.headers.get('content-type') || '';
    const upstreamContentLengthHeader = upstreamRes.headers.get('content-length');
    const upstreamLength = upstreamContentLengthHeader ? parseInt(upstreamContentLengthHeader, 10) : NaN;
    const finalContentLength = (!isNaN(upstreamLength) && upstreamLength > 0) ? upstreamLength : (release.apkSizeBytes || 0);

    // Diagnostic logging (NEVER logs GITHUB_TOKEN)
    console.log('GitHub Asset API Hardened Diagnostic:', {
      releaseId,
      appSlug: appItem?.slug,
      apkFileName: release.apkFileName,
      assetId,
      upstreamStatus: upstreamRes.status,
      upstreamContentType,
      upstreamContentLength: upstreamContentLengthHeader,
      finalContentLength,
      expectedSha256: release.sha256
    });

    if (!upstreamRes.ok || !upstreamRes.body) {
      return res.status(502).send(`Failed to fetch release asset from GitHub API: ${upstreamRes.status}`);
    }

    res.setHeader('Content-Type', 'application/vnd.android.package-archive');
    res.setHeader('Content-Length', finalContentLength.toString());
    res.setHeader('Content-Disposition', `attachment; filename="${downloadName}"`);
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.setHeader('X-APK-SHA256', release.sha256);
    res.setHeader('X-APK-Size-Bytes', finalContentLength.toString());

    const webStream = upstreamRes.body;
    const nodeReadable = Readable.fromWeb(webStream as any);

    await pipeline(nodeReadable, res);
    return;
  } catch (err: any) {
    console.error('GitHub Asset API proxy download error:', err?.message || err);
    if (!res.headersSent) {
      return res.status(502).send('Error proxying APK download from GitHub');
    }
  }
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
// CUSTOMER AUTH HELPER & MIDDLEWARE
// ==========================================

async function getUserFromReq(req: Request) {
  let token = '';
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else if (req.cookies && req.cookies.kayan_user_session) {
    token = req.cookies.kayan_user_session;
  } else if (req.headers.cookie) {
    const cookies = req.headers.cookie.split(';').reduce((acc: any, c) => {
      const [k, v] = c.trim().split('=');
      if (k && v) acc[k] = decodeURIComponent(v);
      return acc;
    }, {});
    token = cookies.kayan_user_session || '';
  }

  if (!token) return null;
  const sessionData = await db.getUserSessionByToken(token);
  return sessionData ? sessionData.user : null;
}

async function requireUser(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await getUserFromReq(req);
    if (!user) {
      return res.status(401).json({ success: false, error: 'ظٹطھط·ظ„ط¨ طھط³ط¬ظٹظ„ ط§ظ„ط¯ط®ظˆظ„ ظ„ظ„ظˆطµظˆظ„ ط¥ظ„ظ‰ ظ‡ط°ظ‡ ط§ظ„ط®ط¯ظ…ط©' });
    }
    (req as any).user = user;
    next();
  } catch (err) {
    res.status(401).json({ success: false, error: 'ط¬ظ„ط³ط© ط§ظ„ظ…ط³طھط®ط¯ظ… ط؛ظٹط± طµط§ظ„ط­ط©' });
  }
}

// AI Rate Limiter Middleware
const aiTracker = new Map<string, number[]>();

function aiRateLimiter(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;
  const key = user ? `u_${user.id}` : `ip_${req.ip || 'anon'}`;
  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxReq = 20;

  const times = (aiTracker.get(key) || []).filter(t => now - t < windowMs);
  if (times.length >= maxReq) {
    return res.status(429).json({
      success: false,
      error: 'AI_RATE_LIMITED',
      message: 'طھط¬ط§ظˆط²طھ ط§ظ„ط­ط¯ ط§ظ„ظ…ط³ظ…ظˆط­ ط¨ظ‡ ظ…ظ† ط·ظ„ط¨ط§طھ ط§ظ„ط°ظƒط§ط، ط§ظ„ط§طµط·ظ†ط§ط¹ظٹ. ظٹط±ط¬ظ‰ ط§ظ„ط§ظ†طھط¸ط§ط± ط¯ظ‚ظٹظ‚ط© ظˆط§ط­ط¯ط©.'
    });
  }

  times.push(now);
  aiTracker.set(key, times);
  next();
}

// ==========================================
// CUSTOMER AUTH API ENDPOINTS
// ==========================================

// Register
app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const { email, password, displayName, locale } = req.body;
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ success: false, error: 'ظٹط±ط¬ظ‰ ط¥ط¯ط®ط§ظ„ ط¨ط±ظٹط¯ ط¥ظ„ظƒطھط±ظˆظ†ظٹ طµط­ظٹط­' });
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ success: false, error: 'ظƒظ„ظ…ط© ط§ظ„ظ…ط±ظˆط± ظٹط¬ط¨ ط£ظ† ظ„ط§ طھظ‚ظ„ ط¹ظ† 6 ط£ط­ط±ظپ' });
    }
    if (!displayName || typeof displayName !== 'string' || displayName.trim().length < 2) {
      return res.status(400).json({ success: false, error: 'ط§ظ„ط§ط³ظ… ط§ظ„ظ…ط¹ط±ظˆط¶ ظٹط¬ط¨ ط£ظ† ظ„ط§ ظٹظ‚ظ„ ط¹ظ† ط­ط±ظپظٹظ†' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await db.getUserByEmail(normalizedEmail);
    if (existing) {
      return res.status(409).json({ success: false, error: 'ط§ظ„ط¨ط±ظٹط¯ ط§ظ„ط¥ظ„ظƒطھط±ظˆظ†ظٹ ظ…ط³ط¬ظ„ ط¨ط§ظ„ظپط¹ظ„' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await db.createUser({
      email: normalizedEmail,
      passwordHash,
      displayName: displayName.trim(),
      locale: locale || 'ar'
    });

    const userAgent = req.headers['user-agent'] || undefined;
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.ip || undefined;
    const { token } = await db.createUserSession(user.id, userAgent, ipAddress);

    res.cookie('kayan_user_session', token, {
      httpOnly: true,
      secure: IS_PROD,
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000
    });

    res.status(201).json({
      success: true,
      token,
      user
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    res.status(500).json({ success: false, error: 'ط­ط¯ط« ط®ط·ط£ ط£ط«ظ†ط§ط، ط¥ظ†ط´ط§ط، ط§ظ„ط­ط³ط§ط¨' });
  }
});

// Login
app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'ظٹط±ط¬ظ‰ ط¥ط¯ط®ط§ظ„ ط§ظ„ط¨ط±ظٹط¯ ط§ظ„ط¥ظ„ظƒطھط±ظˆظ†ظٹ ظˆظƒظ„ظ…ط© ط§ظ„ظ…ط±ظˆط±' });
    }

    const userWithAuth = await db.getUserByEmail(email);
    if (!userWithAuth) {
      return res.status(401).json({ success: false, error: 'ط§ظ„ط¨ط±ظٹط¯ ط§ظ„ط¥ظ„ظƒطھط±ظˆظ†ظٹ ط£ظˆ ظƒظ„ظ…ط© ط§ظ„ظ…ط±ظˆط± ط؛ظٹط± طµط­ظٹط­ط©' });
    }

    if (userWithAuth.status === 'SUSPENDED') {
      return res.status(403).json({ success: false, error: 'طھظ… طھط¹ظ„ظٹظ‚ ظ‡ط°ط§ ط§ظ„ط­ط³ط§ط¨ ظ…ط¤ظ‚طھط§ظ‹. ظٹط±ط¬ظ‰ ط§ظ„طھظˆط§طµظ„ ظ…ط¹ ط§ظ„ط¯ط¹ظ… ط§ظ„ظپظ†ظٹ' });
    }

    const passwordValid = await bcrypt.compare(password, userWithAuth.passwordHash);
    if (!passwordValid) {
      return res.status(401).json({ success: false, error: 'ط§ظ„ط¨ط±ظٹط¯ ط§ظ„ط¥ظ„ظƒطھط±ظˆظ†ظٹ ط£ظˆ ظƒظ„ظ…ط© ط§ظ„ظ…ط±ظˆط± ط؛ظٹط± طµط­ظٹط­ط©' });
    }

    await db.updateUserLastLogin(userWithAuth.id);

    const userAgent = req.headers['user-agent'] || undefined;
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.ip || undefined;
    const { token } = await db.createUserSession(userWithAuth.id, userAgent, ipAddress);

    res.cookie('kayan_user_session', token, {
      httpOnly: true,
      secure: IS_PROD,
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000
    });

    const { passwordHash: _, status: __, ...user } = userWithAuth;

    res.json({
      success: true,
      token,
      user
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, error: 'ط­ط¯ط« ط®ط·ط£ ط£ط«ظ†ط§ط، طھط³ط¬ظٹظ„ ط§ظ„ط¯ط®ظˆظ„' });
  }
});

// Logout
app.post('/api/auth/logout', async (req: Request, res: Response) => {
  try {
    let token = '';
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    } else if (req.cookies && req.cookies.kayan_user_session) {
      token = req.cookies.kayan_user_session;
    }

    if (token) {
      await db.deleteUserSession(token);
    }

    res.clearCookie('kayan_user_session');
    res.json({ success: true });
  } catch (err) {
    res.json({ success: true });
  }
});

// Me
app.get('/api/auth/me', async (req: Request, res: Response) => {
  const user = await getUserFromReq(req);
  if (!user) {
    return res.json({ authenticated: false, user: null });
  }
  res.json({ authenticated: true, user });
});

// ==========================================
// USER LIBRARY & ENTITLEMENTS API
// ==========================================

app.get('/api/me/library', requireUser, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const products = await db.getUserLibrary(user.id);
    res.json({ success: true, products });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'ظپط´ظ„ ظپظٹ طھط­ظ…ظٹظ„ ط§ظ„ظ…ظƒطھط¨ط©' });
  }
});

app.post('/api/products/:productId/claim-free', requireUser, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { productId } = req.params;
    const product = await db.getProductById(productId);
    if (!product) {
      return res.status(404).json({ success: false, error: 'ط§ظ„ظ…ظ†طھط¬ ط؛ظٹط± ظ…ظˆط¬ظˆط¯' });
    }

    if (product.price > 0) {
      return res.status(400).json({ success: false, error: 'ظ‡ط°ط§ ط§ظ„ظ…ظ†طھط¬ ظ…ط¯ظپظˆط¹ ظˆظٹطھط·ظ„ط¨ ط®ظٹط§ط± ط§ظ„ط´ط±ط§ط،' });
    }

    await db.grantEntitlement(user.id, productId, 'FREE');
    res.json({ success: true, message: 'طھظ…طھ ط¥ط¶ط§ظپط© ط§ظ„ظ…ظ†طھط¬ ط¥ظ„ظ‰ ظ…ظƒطھط¨طھظƒ ط¨ظ†ط¬ط§ط­' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'ظپط´ظ„ ظپظٹ ط¥ط¶ط§ظپط© ط§ظ„ظ…ظ†طھط¬ ط¥ظ„ظ‰ ط§ظ„ظ…ظƒطھط¨ط©' });
  }
});

// ==========================================
// FAVORITES API ENDPOINTS
// ==========================================

app.get('/api/me/favorites', requireUser, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const favorites = await db.getUserFavorites(user.id);
    res.json({ success: true, favorites });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'ظپط´ظ„ ظپظٹ طھط­ظ…ظٹظ„ ط§ظ„ظ…ظپط¶ظ„ط©' });
  }
});

app.post('/api/me/favorites/:productId', requireUser, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { productId } = req.params;
    await db.addFavorite(user.id, productId);
    res.json({ success: true, message: 'طھظ…طھ ط§ظ„ط¥ط¶ط§ظپط© ط¥ظ„ظ‰ ط§ظ„ظ…ظپط¶ظ„ط©' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'ظپط´ظ„ ظپظٹ ط§ظ„ط¥ط¶ط§ظپط© ظ„ظ„ظ…ظپط¶ظ„ط©' });
  }
});

app.delete('/api/me/favorites/:productId', requireUser, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { productId } = req.params;
    await db.removeFavorite(user.id, productId);
    res.json({ success: true, message: 'طھظ…طھ ط§ظ„ط¥ط²ط§ظ„ط© ظ…ظ† ط§ظ„ظ…ظپط¶ظ„ط©' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'ظپط´ظ„ ظپظٹ ط¥ط²ط§ظ„ط© ط§ظ„ط¹ظ†طµط± ظ…ظ† ط§ظ„ظ…ظپط¶ظ„ط©' });
  }
});

app.get('/api/products/:productId/favorite-status', async (req: Request, res: Response) => {
  try {
    const user = await getUserFromReq(req);
    if (!user) {
      return res.json({ isFavorite: false });
    }
    const isFav = await db.isFavorite(user.id, req.params.productId);
    res.json({ isFavorite: isFav });
  } catch (err: any) {
    res.json({ isFavorite: false });
  }
});

// ==========================================
// REVIEWS API ENDPOINTS
// ==========================================

app.get('/api/products/:productId/reviews', async (req: Request, res: Response) => {
  try {
    const reviews = await db.getProductReviews(req.params.productId);
    res.json({ success: true, reviews });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'ظپط´ظ„ ظپظٹ طھط­ظ…ظٹظ„ ط§ظ„طھظ‚ظٹظٹظ…ط§طھ' });
  }
});

app.post('/api/products/:productId/reviews', requireUser, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { productId } = req.params;
    const { rating, body, title } = req.body;

    const parsedRating = parseInt(rating, 10);
    if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      return res.status(400).json({ success: false, error: 'ط§ظ„طھظ‚ظٹظٹظ… ظٹط¬ط¨ ط£ظ† ظٹظƒظˆظ† ط¨ظٹظ† 1 ظˆ 5 ظ†ط¬ظˆظ…ط§ظ‹' });
    }

    if (!body || typeof body !== 'string' || body.trim().length < 3) {
      return res.status(400).json({ success: false, error: 'ظ†طµ ط§ظ„طھظ‚ظٹظٹظ… ظٹط¬ط¨ ط£ظ† ظ„ط§ ظٹظ‚ظ„ ط¹ظ† 3 ط£ط­ط±ظپ' });
    }

    await db.createOrUpdateReview(user.id, productId, parsedRating, body.trim(), title ? String(title).trim() : undefined);
    res.json({ success: true, message: 'طھظ… ظ†ط´ط± ط§ظ„طھظ‚ظٹظٹظ… ط¨ظ†ط¬ط§ط­' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'ظپط´ظ„ ظپظٹ ط­ظپط¸ ط§ظ„طھظ‚ظٹظٹظ…' });
  }
});

// ==========================================
// USER DOWNLOADS API ENDPOINTS
// ==========================================

app.get('/api/me/downloads', requireUser, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const downloads = await db.getUserDownloads(user.id);
    res.json({ success: true, downloads });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'ظپط´ظ„ ظپظٹ طھط­ظ…ظٹظ„ ط³ط¬ظ„ ط§ظ„طھظ†ط²ظٹظ„ط§طھ' });
  }
});

// ==========================================
// KAYAN AI PROJECTS API ENDPOINTS
// ==========================================

app.get('/api/me/ai/projects', requireUser, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const projects = await db.getUserAIProjects(user.id);
    res.json({ success: true, projects });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'ظپط´ظ„ ظپظٹ طھط­ظ…ظٹظ„ ظ…ط´ط§ط±ظٹط¹ ط§ظ„ط°ظƒط§ط، ط§ظ„ط§طµط·ظ†ط§ط¹ظٹ' });
  }
});

app.post('/api/me/ai/projects', requireUser, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { name, description, type } = req.body;
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({ success: false, error: 'ط§ط³ظ… ط§ظ„ظ…ط´ط±ظˆط¹ ظٹط¬ط¨ ط£ظ† ظ„ط§ ظٹظ‚ظ„ ط¹ظ† ط­ط±ظپظٹظ†' });
    }

    const project = await db.createAIProject(user.id, name.trim(), description, type || 'GENERAL');
    res.status(201).json({ success: true, project });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'ظپط´ظ„ ظپظٹ ط¥ظ†ط´ط§ط، ط§ظ„ظ…ط´ط±ظˆط¹' });
  }
});

app.get('/api/me/ai/projects/:id', requireUser, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const project = await db.getAIProjectById(req.params.id);
    if (!project || project.userId !== user.id) {
      return res.status(404).json({ success: false, error: 'ط§ظ„ظ…ط´ط±ظˆط¹ ط؛ظٹط± ظ…ظˆط¬ظˆط¯ ط£ظˆ ظ„ط§ طھظ…ظ„ظƒ طµظ„ط§ط­ظٹط© ط§ظ„ظˆطµظˆظ„ ط¥ظ„ظٹظ‡' });
    }
    res.json({ success: true, project });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'ظپط´ظ„ ظپظٹ طھط­ظ…ظٹظ„ طھظپط§طµظٹظ„ ط§ظ„ظ…ط´ط±ظˆط¹' });
  }
});

app.put('/api/me/ai/projects/:id', requireUser, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { name, description } = req.body;
    const project = await db.updateAIProject(req.params.id, user.id, { name, description });
    if (!project) {
      return res.status(404).json({ success: false, error: 'ط§ظ„ظ…ط´ط±ظˆط¹ ط؛ظٹط± ظ…ظˆط¬ظˆط¯ ط£ظˆ ظ„ط§ طھظ…ظ„ظƒ طµظ„ط§ط­ظٹط© ط§ظ„طھط¹ط¯ظٹظ„ ط¹ظ„ظٹظ‡' });
    }
    res.json({ success: true, project });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'ظپط´ظ„ ظپظٹ طھط­ط¯ظٹط« ط¨ظٹط§ظ†ط§طھ ط§ظ„ظ…ط´ط±ظˆط¹' });
  }
});

app.delete('/api/me/ai/projects/:id', requireUser, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const deleted = await db.deleteAIProject(req.params.id, user.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'ط§ظ„ظ…ط´ط±ظˆط¹ ط؛ظٹط± ظ…ظˆط¬ظˆط¯ ط£ظˆ ظ„ط§ طھظ…ظ„ظƒ طµظ„ط§ط­ظٹط© ط§ظ„ط­ط°ظپ' });
    }
    res.json({ success: true, message: 'طھظ… ط­ط°ظپ ط§ظ„ظ…ط´ط±ظˆط¹ ط¨ظ†ط¬ط§ط­' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'ظپط´ظ„ ظپظٹ ط­ط°ظپ ط§ظ„ظ…ط´ط±ظˆط¹' });
  }
});

app.get('/api/me/ai/projects/:id/assets', requireUser, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const project = await db.getAIProjectById(req.params.id);
    if (!project || project.userId !== user.id) {
      return res.status(404).json({ success: false, error: 'ط§ظ„ظ…ط´ط±ظˆط¹ ط؛ظٹط± ظ…ظˆط¬ظˆط¯' });
    }
    const assets = await db.getProjectAIAssets(project.id);
    res.json({ success: true, assets });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'ظپط´ظ„ ظپظٹ طھط­ظ…ظٹظ„ ط£طµظˆظ„ ط§ظ„ط°ظƒط§ط، ط§ظ„ط§طµط·ظ†ط§ط¹ظٹ' });
  }
});

// ==========================================
// AI BYOK (BRING YOUR OWN KEY) API
// ==========================================

app.get('/api/me/ai/keys', requireUser, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const keys = await db.getUserKeys(user.id);
    // Mask keys before returning to client
    const maskedKeys = keys.map(k => ({
      providerId: k.providerId,
      updatedAt: k.updatedAt,
      isConfigured: true,
      // Masking: Show first 4 and last 4 if long enough, else just mask
      mask: '********'
    }));
    res.json({ success: true, keys: maskedKeys });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'ظپط´ظ„ ظپظٹ طھط­ظ…ظٹظ„ ظ…ظپط§طھظٹط­ ط§ظ„ط°ظƒط§ط، ط§ظ„ط§طµط·ظ†ط§ط¹ظٹ' });
  }
});

app.post('/api/me/ai/keys', requireUser, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { providerId, apiKey } = req.body;
    
    if (!providerId || !apiKey || typeof apiKey !== 'string' || apiKey.trim().length < 8) {
      return res.status(400).json({ success: false, error: 'ظٹط±ط¬ظ‰ ط¥ط¯ط®ط§ظ„ ظ…ظپطھط§ط­ طµط§ظ„ط­' });
    }

    const providers = await db.getAIProviders();
    if (!providers.find(p => p.id === providerId)) {
      return res.status(400).json({ success: false, error: 'ظ…ط²ظˆط¯ ط§ظ„ط°ظƒط§ط، ط§ظ„ط§طµط·ظ†ط§ط¹ظٹ ط؛ظٹط± ظ…ط¯ط¹ظˆظ…' });
    }

    await db.saveUserKey(user.id, providerId, apiKey.trim());
    res.json({ success: true, message: 'طھظ… ط­ظپط¸ ط§ظ„ظ…ظپطھط§ط­ ط¨ظ†ط¬ط§ط­' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'ظپط´ظ„ ظپظٹ ط­ظپط¸ ط§ظ„ظ…ظپطھط§ط­' });
  }
});

app.delete('/api/me/ai/keys/:providerId', requireUser, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { providerId } = req.params;
    const deleted = await db.deleteUserKey(user.id, providerId);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'ط§ظ„ظ…ظپطھط§ط­ ط؛ظٹط± ظ…ظˆط¬ظˆط¯' });
    }
    res.json({ success: true, message: 'طھظ… ط­ط°ظپ ط§ظ„ظ…ظپطھط§ط­ ط¨ظ†ط¬ط§ط­' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'ظپط´ظ„ ظپظٹ ط­ط°ظپ ط§ظ„ظ…ظپطھط§ط­' });
  }
});

// ==========================================
// KAYAN AI EXECUTION & JOBS (PHASE 2 API)
// ==========================================

// Backward compatibility general generate route
app.post('/api/ai/generate', requireUser, aiRateLimiter, async (req: Request, res: Response) => {
  try {
    const { prompt, taskType, projectId } = req.body;
    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({ success: false, error: 'AI_INVALID_REQUEST', message: 'ظٹط±ط¬ظ‰ ظƒطھط§ط¨ط© ظ†طµ ط§ظ„طھظˆط¬ظٹظ‡ (Prompt)' });
    }

    const type = (taskType || 'TEXT').toUpperCase();

    let providerConfigured = false;
    try {
      const provider = aiGateway.getProvider('gemini');
      providerConfigured = provider?.isConfigured() || false;
    } catch {
      providerConfigured = false;
    }

    if (!providerConfigured) {
      return res.status(400).json({
        success: false,
        error: 'AI_PROVIDER_NOT_CONFIGURED',
        message: 'AI provider is not configured. Missing GEMINI_API_KEY.'
      });
    }

    if (type === 'TEXT') {
      const resData = await aiGateway.generateText({ prompt: prompt.trim() });
      return res.json({ success: true, result: resData.text });
    } else if (type === 'CODE') {
      const resData = await aiGateway.generateCode({ prompt: prompt.trim() });
      return res.json({ success: true, result: resData.code || resData.summary });
    } else if (type === 'IMAGE') {
      const resData = await aiGateway.generateImage({ prompt: prompt.trim() });
      return res.json({ success: true, result: resData.imageBase64 || resData.imageUrl });
    } else if (type === 'VIDEO') {
      const resData = await aiGateway.generateVideo({ prompt: prompt.trim() });
      return res.json({ success: true, result: resData.operationName });
    }

    const resData = await aiGateway.generateText({ prompt: prompt.trim() });
    res.json({ success: true, result: resData.text });
  } catch (err: any) {
    console.error('AI Execution error:', err?.message || err);
    res.status(400).json({
      success: false,
      error: 'AI_PROVIDER_ERROR',
      message: err?.message || 'AI provider is not configured. Missing GEMINI_API_KEY.'
    });
  }
});

// Text Generation Endpoint
app.post('/api/ai/generate/text', requireUser, aiRateLimiter, async (req: Request, res: Response) => {
  const startedAt = new Date().toISOString();
  try {
    const user = (req as any).user;
    const { projectId, prompt, model, routingMode, providerPreference, freeOnly } = req.body;

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({ success: false, error: 'AI_INVALID_REQUEST', message: 'ظٹط±ط¬ظ‰ ط¥ط¯ط®ط§ظ„ ظ†طµ ط§ظ„طھظˆط¬ظٹظ‡ (prompt)' });
    }

    if (prompt.length > 10000) {
      return res.status(400).json({ success: false, error: 'AI_INVALID_REQUEST', message: 'ط·ظˆظ„ ط§ظ„طھظˆط¬ظٹظ‡ ظٹطھط¬ط§ظˆط² ط§ظ„ط­ط¯ ط§ظ„ظ…ط³ظ…ظˆط­ (10,000 ط­ط±ظپ)' });
    }

    if (projectId) {
      const project = await db.getAIProjectById(projectId);
      if (!project || project.userId !== user.id) {
        return res.status(403).json({ success: false, error: 'AI_UNAUTHORIZED', message: 'ط؛ظٹط± ظ…طµط±ط­ ظ„ظƒ ط¨ط§ظ„ظˆطµظˆظ„ ط¥ظ„ظ‰ ظ‡ط°ط§ ط§ظ„ظ…ط´ط±ظˆط¹' });
      }
    }

    const job = aiGateway.jobQueue.createJob({
      projectId,
      userId: user.id,
      type: 'text',
      provider: providerPreference || 'auto',
      model: model || 'auto',
      prompt: prompt.trim()
    });

    try {
      aiGateway.jobQueue.updateJobStatus(job.id, 'processing');
      
      const result = await aiGateway.generateText({ 
        prompt: job.prompt, 
        model 
      }, {
        userId: user.id,
        projectId,
        preferredModel: model,
        providerPreference,
        routingMode,
        freeOnly
      });

      const completedJob = aiGateway.jobQueue.updateJobStatus(job.id, 'completed', { 
        text: result.text, 
        model: result.model,
        providerId: result.providerId 
      });

      const completedAt = new Date().toISOString();
      const durationMs = new Date(completedAt).getTime() - new Date(startedAt).getTime();

      await db.recordAIUsage({
        userId: user.id,
        projectId,
        jobId: job.id,
        provider: result.providerId || 'unknown',
        model: result.model,
        capability: 'text',
        status: 'completed',
        retryCount: result.retryCount,
        fallbackUsed: result.fallbackUsed,
        startedAt,
        completedAt,
        durationMs
      });

      return res.json({
        success: true,
        jobId: job.id,
        status: 'completed',
        result: { text: result.text, model: result.model },
        job: completedJob
      });
    } catch (err: any) {
      aiGateway.jobQueue.updateJobStatus(job.id, 'failed', undefined, err?.message || 'AI processing failed');
      
      const completedAt = new Date().toISOString();
      const durationMs = new Date(completedAt).getTime() - new Date(startedAt).getTime();
      
      await db.recordAIUsage({
        userId: user.id,
        projectId,
        jobId: job.id,
        provider: 'auto',
        model: model || 'auto',
        capability: 'text',
        status: 'failed',
        startedAt,
        completedAt,
        durationMs,
        metadata: { error: err?.message || 'INTERNAL_ERROR' }
      });

      throw err;
    }

  } catch (err: any) {
    console.error('Text Generation Error:', err?.message || err);
    const status = err?.message?.includes('MISMATCH') || err?.message?.includes('COMPATIBLE') ? 400 : 500;
    return res.status(status).json({
      success: false,
      error: 'AI_PROVIDER_ERROR',
      message: err?.message || 'ط­ط¯ط« ط®ط·ط£ ط£ط«ظ†ط§ط، ظ…ط¹ط§ظ„ط¬ط© ط§ظ„ظ†طµ ط¨ط§ظ„ط°ظƒط§ط، ط§ظ„ط§طµط·ظ†ط§ط¹ظٹ'
    });
  }
});

// Image Generation Endpoint
app.post('/api/ai/generate/image', requireUser, aiRateLimiter, async (req: Request, res: Response) => {
  const startedAt = new Date().toISOString();
  try {
    const user = (req as any).user;
    const { projectId, prompt, model, aspectRatio, routingMode, providerPreference, freeOnly } = req.body;

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({ success: false, error: 'AI_INVALID_REQUEST', message: 'ظٹط±ط¬ظ‰ ط¥ط¯ط®ط§ظ„ ظˆطµظپ ط§ظ„طµظˆط±ط© (prompt)' });
    }

    if (projectId) {
      const project = await db.getAIProjectById(projectId);
      if (!project || project.userId !== user.id) {
        return res.status(403).json({ success: false, error: 'AI_UNAUTHORIZED', message: 'ط؛ظٹط± ظ…طµط±ط­ ظ„ظƒ ط¨ط§ظ„ظˆطµظˆظ„ ط¥ظ„ظ‰ ظ‡ط°ط§ ط§ظ„ظ…ط´ط±ظˆط¹' });
      }
    }

    const job = aiGateway.jobQueue.createJob({
      projectId,
      userId: user.id,
      type: 'image',
      provider: providerPreference || 'auto',
      model: model || 'auto',
      prompt: prompt.trim()
    });

    try {
      aiGateway.jobQueue.updateJobStatus(job.id, 'processing');
      
      const result = await aiGateway.generateImage({
        prompt: job.prompt,
        aspectRatio: aspectRatio || '1:1',
        model
      }, {
        userId: user.id,
        projectId,
        preferredModel: model,
        providerPreference,
        routingMode,
        freeOnly
      });

      if (!result.imageBase64 && !result.imageUrl) {
        throw new Error('ظ„ظ… ظٹطھظ… ط¥ط±ط¬ط§ط¹ ظ†طھظٹط¬ط© طµظˆط±ط© طµط§ظ„ط­ط© ظ…ظ† ط§ظ„ظ…ط²ظˆط¯');
      }

      const imageBuffer = result.imageBase64
        ? Buffer.from(result.imageBase64, 'base64')
        : Buffer.from('');

      const sha256 = crypto.createHash('sha256').update(imageBuffer).digest('hex');
      const fileName = `ai_image_${sha256.substring(0, 16)}.png`;

      const storedAsset = await artifactStorage.saveMediaFile(projectId || 'ai', fileName, imageBuffer);
      const storageKey = storedAsset.downloadUrl || `/uploads/media/${storedAsset.storedName}`;

      const asset = await db.createAIAsset({
        projectId,
        userId: user.id,
        jobId: job.id,
        assetType: 'image',
        url: storageKey,
        mimeType: result.mimeType || 'image/png',
        sizeBytes: storedAsset.sizeBytes || imageBuffer.length,
        sha256: storedAsset.sha256 || sha256
      });

      const completedJob = aiGateway.jobQueue.updateJobStatus(job.id, 'completed', {
        assetId: asset.id,
        imageUrl: storageKey,
        sha256,
        sizeBytes: imageBuffer.length,
        model: result.model,
        providerId: result.providerId
      });

      const completedAt = new Date().toISOString();
      const durationMs = new Date(completedAt).getTime() - new Date(startedAt).getTime();

      await db.recordAIUsage({
        userId: user.id,
        projectId,
        jobId: job.id,
        provider: result.providerId || 'unknown',
        model: result.model,
        capability: 'image',
        status: 'completed',
        retryCount: result.retryCount,
        fallbackUsed: result.fallbackUsed,
        startedAt,
        completedAt,
        durationMs
      });

      return res.json({
        success: true,
        jobId: job.id,
        status: 'completed',
        result: {
          assetId: asset.id,
          imageUrl: storageKey,
          sha256,
          sizeBytes: imageBuffer.length
        },
        job: completedJob
      });
    } catch (err: any) {
      aiGateway.jobQueue.updateJobStatus(job.id, 'failed', undefined, err?.message || 'Image generation failed');
      
      const completedAt = new Date().toISOString();
      const durationMs = new Date(completedAt).getTime() - new Date(startedAt).getTime();

      await db.recordAIUsage({
        userId: user.id,
        projectId,
        jobId: job.id,
        provider: 'auto',
        model: model || 'auto',
        capability: 'image',
        status: 'failed',
        startedAt,
        completedAt,
        durationMs,
        metadata: { error: err?.message || 'INTERNAL_ERROR' }
      });
      
      throw err;
    }

  } catch (err: any) {
    console.error('Image Generation Error:', err?.message || err);
    const status = err?.message?.includes('MISMATCH') || err?.message?.includes('COMPATIBLE') ? 400 : 500;
    return res.status(status).json({
      success: false,
      error: 'AI_PROVIDER_ERROR',
      message: err?.message || 'ط­ط¯ط« ط®ط·ط£ ط£ط«ظ†ط§ط، طھظˆظ„ظٹط¯ ط§ظ„طµظˆط±ط© ط¨ط§ظ„ط°ظƒط§ط، ط§ظ„ط§طµط·ظ†ط§ط¹ظٹ'
    });
  }
});

// Code Generation Endpoint
app.post('/api/ai/generate/code', requireUser, aiRateLimiter, async (req: Request, res: Response) => {
  const startedAt = new Date().toISOString();
  try {
    const user = (req as any).user;
    const { projectId, prompt, language, framework, model, routingMode, providerPreference, freeOnly } = req.body;

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({ success: false, error: 'AI_INVALID_REQUEST', message: 'ظٹط±ط¬ظ‰ ط¥ط¯ط®ط§ظ„ ط§ظ„طھظˆط¬ظٹظ‡ ظˆط§ظ„ظˆطµظپ ط§ظ„ط¨ط±ظ…ط¬ظٹ ط§ظ„ظ…ط·ظ„ظˆط¨' });
    }

    if (projectId) {
      const project = await db.getAIProjectById(projectId);
      if (!project || project.userId !== user.id) {
        return res.status(403).json({ success: false, error: 'AI_UNAUTHORIZED', message: 'ط؛ظٹط± ظ…طµط±ط­ ظ„ظƒ ط¨ط§ظ„ظˆطµظˆظ„ ط¥ظ„ظ‰ ظ‡ط°ط§ ط§ظ„ظ…ط´ط±ظˆط¹' });
      }
    }

    const job = aiGateway.jobQueue.createJob({
      projectId,
      userId: user.id,
      type: 'code',
      provider: providerPreference || 'auto',
      model: model || 'auto',
      prompt: prompt.trim()
    });

    try {
      aiGateway.jobQueue.updateJobStatus(job.id, 'processing');
      
      const result = await aiGateway.generateCode({
        prompt: job.prompt,
        language: language || 'TypeScript',
        framework: framework || 'React',
        model
      }, {
        userId: user.id,
        projectId,
        preferredModel: model,
        providerPreference,
        routingMode,
        freeOnly
      });

      const completedJob = aiGateway.jobQueue.updateJobStatus(job.id, 'completed', { 
        summary: result.summary,
        files: result.files,
        model: result.model,
        providerId: result.providerId
      });

      const completedAt = new Date().toISOString();
      const durationMs = new Date(completedAt).getTime() - new Date(startedAt).getTime();

      await db.recordAIUsage({
        userId: user.id,
        projectId,
        jobId: job.id,
        provider: result.providerId || 'unknown',
        model: result.model,
        capability: 'code',
        status: 'completed',
        retryCount: result.retryCount,
        fallbackUsed: result.fallbackUsed,
        startedAt,
        completedAt,
        durationMs
      });

      return res.json({
        success: true,
        jobId: job.id,
        status: 'completed',
        result,
        job: completedJob
      });
    } catch (err: any) {
      aiGateway.jobQueue.updateJobStatus(job.id, 'failed', undefined, err?.message || 'Code generation failed');
      
      await db.recordAIUsage({
        userId: user.id,
        projectId,
        jobId: job.id,
        provider: 'auto',
        model: model || 'auto',
        capability: 'code',
        status: 'failed',
        startedAt,
        completedAt: new Date().toISOString(),
        metadata: { error: err?.message || 'INTERNAL_ERROR' }
      });
      
      throw err;
    }

  } catch (err: any) {
    console.error('Code Generation Error:', err?.message || err);
    const status = err?.message?.includes('MISMATCH') || err?.message?.includes('COMPATIBLE') ? 400 : 500;
    return res.status(status).json({
      success: false,
      error: 'AI_PROVIDER_ERROR',
      message: err?.message || 'ط­ط¯ط« ط®ط·ط£ ط£ط«ظ†ط§ط، طھظˆظ„ظٹط¯ ط§ظ„ظƒظˆط¯ ط¨ط§ظ„ط°ظƒط§ط، ط§ظ„ط§طµط·ظ†ط§ط¹ظٹ'
    });
  }
});

// Download ZIP Endpoint for Generated Code Files (Safe, pure archive generation)
app.post('/api/ai/download-zip', requireUser, async (req: Request, res: Response) => {
  try {
    const { files, projectName } = req.body;
    if (!Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ success: false, error: 'ظ„ط§ طھظˆط¬ط¯ ظ…ظ„ظپط§طھ ظ„طھظ†ط²ظٹظ„ظ‡ط§' });
    }

    const zip = new AdmZip();
    for (const f of files) {
      if (f && f.path && typeof f.content === 'string') {
        let cleanPath = String(f.path)
          .replace(/\\/g, '/')
          .replace(/\.\.+/g, '')
          .replace(/^\/+/, '')
          .replace(/[\0\x00-\x1F]/g, '');
        if (cleanPath) {
          zip.addFile(cleanPath, Buffer.from(f.content, 'utf-8'));
        }
      }
    }

    const zipBuffer = zip.toBuffer();
    const zipName = `${(projectName || 'kayan-ai-code').replace(/[^a-zA-Z0-9_-]/g, '_')}.zip`;

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${zipName}"`);
    res.setHeader('Content-Length', zipBuffer.length.toString());
    res.send(zipBuffer);
  } catch (err: any) {
    console.error('ZIP generation error:', err);
    res.status(500).json({ success: false, error: 'ظپط´ظ„ ظپظٹ طھط­ط²ظٹظ… ط§ظ„ظƒظˆط¯ ظپظٹ ط£ط±ط´ظٹظپ ZIP' });
  }
});

// ==========================================
// KAYAN AI PROJECTS & JOBS (PHASE 1 & 2 API)
// ==========================================

app.get('/api/ai/projects', requireUser, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const projects = await db.getUserAIProjects(user.id);
    res.json({ success: true, projects });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'ظپط´ظ„ ظپظٹ طھط­ظ…ظٹظ„ ط§ظ„ظ…ط´ط§ط±ظٹط¹' });
  }
});

app.post('/api/ai/projects', requireUser, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { name, description, type } = req.body;
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({ success: false, error: 'ط§ط³ظ… ط§ظ„ظ…ط´ط±ظˆط¹ ظٹط¬ط¨ ط£ظ† ظ„ط§ ظٹظ‚ظ„ ط¹ظ† ط­ط±ظپظٹظ†' });
    }
    const project = await db.createAIProject(user.id, name.trim(), description, type || 'GENERAL');
    res.status(201).json({ success: true, project });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'ظپط´ظ„ ظپظٹ ط¥ظ†ط´ط§ط، ط§ظ„ظ…ط´ط±ظˆط¹' });
  }
});

app.get('/api/ai/projects/:id', requireUser, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const project = await db.getAIProjectById(req.params.id);
    if (!project || project.userId !== user.id) {
      return res.status(404).json({ success: false, error: 'ط§ظ„ظ…ط´ط±ظˆط¹ ط؛ظٹط± ظ…ظˆط¬ظˆط¯' });
    }
    res.json({ success: true, project });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'ظپط´ظ„ ظپظٹ ط¬ظ„ط¨ ط§ظ„ظ…ط´ط±ظˆط¹' });
  }
});

app.get('/api/ai/projects/:projectId/jobs', requireUser, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { projectId } = req.params;
    const project = await db.getAIProjectById(projectId);
    if (!project || project.userId !== user.id) {
      return res.status(403).json({ success: false, error: 'AI_UNAUTHORIZED', message: 'ط؛ظٹط± ظ…طµط±ط­ ظ„ظƒ ط¨ط§ظ„ظˆطµظˆظ„ ط¥ظ„ظ‰ ظ‡ط°ط§ ط§ظ„ظ…ط´ط±ظˆط¹' });
    }
    const jobs = aiGateway.jobQueue.listJobsByProject(projectId);
    res.json({ success: true, jobs });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'ظپط´ظ„ ظپظٹ طھط­ظ…ظٹظ„ ط³ط¬ظ„ ط§ظ„ظ…ظ‡ط§ظ…' });
  }
});

app.get('/api/ai/projects/:projectId/jobs/:jobId', requireUser, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { projectId, jobId } = req.params;
    const project = await db.getAIProjectById(projectId);
    if (!project || project.userId !== user.id) {
      return res.status(403).json({ success: false, error: 'AI_UNAUTHORIZED', message: 'ط؛ظٹط± ظ…طµط±ط­ ظ„ظƒ ط¨ط§ظ„ظˆطµظˆظ„ ط¥ظ„ظ‰ ظ‡ط°ط§ ط§ظ„ظ…ط´ط±ظˆط¹' });
    }
    const job = aiGateway.jobQueue.getJob(jobId);
    if (!job || job.userId !== user.id || job.projectId !== projectId) {
      return res.status(404).json({ success: false, error: 'AI_JOB_NOT_FOUND', message: 'ط§ظ„ظ…ظ‡ظ…ط© ط؛ظٹط± ظ…ظˆط¬ظˆط¯ط©' });
    }
    res.json({ success: true, job });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'ظپط´ظ„ ظپظٹ ط¬ظ„ط¨ طھظپط§طµظٹظ„ ط§ظ„ظ…ظ‡ظ…ط©' });
  }
});

app.get('/api/ai/projects/:projectId/assets', requireUser, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { projectId } = req.params;
    const project = await db.getAIProjectById(projectId);
    if (!project || project.userId !== user.id) {
      return res.status(403).json({ success: false, error: 'AI_UNAUTHORIZED', message: 'ط؛ظٹط± ظ…طµط±ط­ ظ„ظƒ ط¨ط§ظ„ظˆطµظˆظ„ ط¥ظ„ظ‰ ظ‡ط°ط§ ط§ظ„ظ…ط´ط±ظˆط¹' });
    }
    const assets = await db.getProjectAIAssets(projectId);
    res.json({ success: true, assets });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'ظپط´ظ„ ظپظٹ ط¬ظ„ط¨ ظˆط³ط§ط¦ط· ظˆط£طµظˆظ„ ط§ظ„ظ…ط´ط±ظˆط¹' });
  }
});

// ==========================================
// DOCUMENT INTELLIGENCE ENDPOINTS
// ==========================================

registerDocumentRoutes(app, requireUser, aiRateLimiter);

// ==========================================
// VISUAL INTELLIGENCE ENDPOINTS (PHASE 5)
// ==========================================

registerVisionRoutes(app, requireUser, aiRateLimiter);

// ==========================================
// APP BUILDER ENDPOINTS (PHASE 6)
// ==========================================

registerAppBuilderRoutes(app, requireUser, aiRateLimiter);

// ==========================================
// PREVIEW SANDBOX ENDPOINTS (PHASE 7)
// ==========================================

registerPreviewRoutes(app, requireUser, aiRateLimiter);

// ==========================================
// BUILD & EXPORT PIPELINE ENDPOINTS (PHASE 8)
// ==========================================

registerExportRoutes(app, requireUser, aiRateLimiter);
registerBuildRoutes(app, requireUser, aiRateLimiter);

// ==========================================
// KAYAN CV ENDPOINTS (PHASE 1)
// ==========================================

registerCVRoutes(app, requireUser);

app.get('/api/admin/users', requireAdmin, async (req: Request, res: Response) => {
  try {
    const users = await db.listUsers();
    res.json({ success: true, users });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'ظپط´ظ„ ظپظٹ طھط­ظ…ظٹظ„ ظ‚ط§ط¦ظ…ط© ط§ظ„ظ…ط³طھط®ط¯ظ…ظٹظ†' });
  }
});

app.post('/api/admin/users/:id/suspend', requireAdmin, async (req: Request, res: Response) => {
  try {
    const admin = (req as any).admin;
    await db.updateUserStatus(req.params.id, 'SUSPENDED');
    await db.logActivity('USER_SUSPEND', 'USER', req.params.id, `طھط¹ظ„ظٹظ‚ ط­ط³ط§ط¨ ط§ظ„ظ…ط³طھط®ط¯ظ… ${req.params.id}`, admin.username);
    res.json({ success: true, message: 'طھظ… طھط¹ظ„ظٹظ‚ ط­ط³ط§ط¨ ط§ظ„ظ…ط³طھط®ط¯ظ… ط¨ظ†ط¬ط§ط­' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'ظپط´ظ„ ظپظٹ طھط¹ظ„ظٹظ‚ ط­ط³ط§ط¨ ط§ظ„ظ…ط³طھط®ط¯ظ…' });
  }
});

app.post('/api/admin/users/:id/activate', requireAdmin, async (req: Request, res: Response) => {
  try {
    const admin = (req as any).admin;
    await db.updateUserStatus(req.params.id, 'ACTIVE');
    await db.logActivity('USER_ACTIVATE', 'USER', req.params.id, `طھظ†ط´ظٹط· ط­ط³ط§ط¨ ط§ظ„ظ…ط³طھط®ط¯ظ… ${req.params.id}`, admin.username);
    res.json({ success: true, message: 'طھظ… طھظ†ط´ظٹط· ط­ط³ط§ط¨ ط§ظ„ظ…ط³طھط®ط¯ظ… ط¨ظ†ط¬ط§ط­' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'ظپط´ظ„ ظپظٹ طھظ†ط´ظٹط· ط­ط³ط§ط¨ ط§ظ„ظ…ط³طھط®ط¯ظ…' });
  }
});

// ==========================================
// ADMIN API ENDPOINTS
// ==========================================

// Login
app.post('/api/admin/login', async (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, error: 'ظٹط±ط¬ظ‰ ط¥ط¯ط®ط§ظ„ ط§ط³ظ… ط§ظ„ظ…ط³طھط®ط¯ظ… ظˆظƒظ„ظ…ط© ط§ظ„ظ…ط±ظˆط±' });
  }

  const admin = await db.getAdminByUsername(username.trim());
  if (!admin) {
    return res.status(401).json({ success: false, error: 'ط¨ظٹط§ظ†ط§طھ ط§ظ„ط¯ط®ظˆظ„ ط؛ظٹط± طµط­ظٹط­ط©' });
  }

  const passwordValid = await bcrypt.compare(password, admin.passwordHash || '');
  if (!passwordValid) {
    return res.status(401).json({ success: false, error: 'ط¨ظٹط§ظ†ط§طھ ط§ظ„ط¯ط®ظˆظ„ ط؛ظٹط± طµط­ظٹط­ط©' });
  }

  const session = await db.createSession(admin.id);
  await db.logActivity('ADMIN_LOGIN', 'ADMIN', admin.id, `طھط³ط¬ظٹظ„ ط¯ط®ظˆظ„ ظ†ط§ط¬ط­ ظ„ظ„ظ…ط³ط¤ظˆظ„ (${admin.username})`, admin.username);

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
  await db.logActivity('ADMIN_LOGOUT', 'ADMIN', admin.id, `طھط³ط¬ظٹظ„ ط®ط±ظˆط¬ ط§ظ„ظ…ط³ط¤ظˆظ„ (${admin.username})`, admin.username);
  res.clearCookie('kayan_admin_session');
  res.json({ success: true });
});

// Change Password
app.post('/api/admin/change-password', requireAdmin, async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  const admin = (req as any).admin;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, error: 'ظٹط±ط¬ظ‰ ظ…ظ„ط، ط¬ظ…ظٹط¹ ط§ظ„ط­ظ‚ظˆظ„' });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ success: false, error: 'ظٹط¬ط¨ ط£ظ„ط§ طھظ‚ظ„ ظƒظ„ظ…ط© ط§ظ„ظ…ط±ظˆط± ط§ظ„ط¬ط¯ظٹط¯ط© ط¹ظ† 8 ط£ط­ط±ظپ' });
  }

  const matches = await bcrypt.compare(currentPassword, admin.passwordHash);
  if (!matches) {
    return res.status(400).json({ success: false, error: 'ظƒظ„ظ…ط© ط§ظ„ظ…ط±ظˆط± ط§ظ„ط­ط§ظ„ظٹط© ط؛ظٹط± طµط­ظٹط­ط©' });
  }

  const salt = await bcrypt.genSalt(10);
  const newHash = await bcrypt.hash(newPassword, salt);
  await db.updateAdminPassword(admin.id, newHash);
  await db.logActivity('CHANGE_PASSWORD', 'ADMIN', admin.id, 'طھظ… طھط؛ظٹظٹط± ظƒظ„ظ…ط© ط§ظ„ظ…ط±ظˆط± ط¨ظ†ط¬ط§ط­', admin.username);

  res.json({ success: true, message: 'طھظ… طھط­ط¯ظٹط« ظƒظ„ظ…ط© ط§ظ„ظ…ط±ظˆط± ط¨ظ†ط¬ط§ط­' });
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
    return res.status(400).json({ success: false, error: 'ظٹط±ط¬ظ‰ ظ…ظ„ط، ط§ظ„ط­ظ‚ظˆظ„ ط§ظ„ط£ط³ط§ط³ظٹط© (ط§ظ„ط§ط³ظ…طŒ ط§ظ„ظ…ط¹ط±ظ‘ظپطŒ ط§ط³ظ… ط§ظ„ط­ط²ظ…ط©)' });
  }

  const existingSlug = await db.getApplicationBySlug(slug, false);
  if (existingSlug) {
    return res.status(400).json({ success: false, error: 'ظ…ط¹ط±ظ‘ظپ ط§ظ„ط±ط§ط¨ط· (Slug) ظ…ط³طھط®ط¯ظ… ط¨ط§ظ„ظپط¹ظ„طŒ ظٹط±ط¬ظ‰ ط§ط®طھظٹط§ط± ظ…ط¹ط±ظ‘ظپ ط¢ط®ط±' });
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
    iconUrl: iconUrl || '/assets/images/kayan_pdf_icon.jpg',
    bannerUrl: bannerUrl || '/assets/images/kayan_pdf_feature_banner.jpg',
    privacyUrl: privacyUrl || '/privacy',
    termsUrl: termsUrl || '/terms',
    copyright: copyright || 'آ© 2026 ط§ظ„ظ…ظ‡ظ†ط¯ط³ ط¬ظ‡ط§ط¯ ط§ظ„طµظ„ظٹط­ظٹ. ط¬ظ…ظٹط¹ ط§ظ„ط­ظ‚ظˆظ‚ ظ…ط­ظپظˆط¸ط©.',
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
    return res.status(404).json({ success: false, error: 'ط§ظ„طھط·ط¨ظٹظ‚ ط؛ظٹط± ظ…ظˆط¬ظˆط¯' });
  }

  res.json({ success: true, app: updated });
});

// Delete Application
app.delete('/api/admin/apps/:id', requireAdmin, async (req: Request, res: Response) => {
  const admin = (req as any).admin;
  const { id } = req.params;
  const deleted = await db.deleteApplication(id, admin.username);
  if (!deleted) {
    return res.status(404).json({ success: false, error: 'ط§ظ„طھط·ط¨ظٹظ‚ ط؛ظٹط± ظ…ظˆط¬ظˆط¯' });
  }
  res.json({ success: true });
});

// Toggle Publish Status
app.post('/api/admin/apps/:id/toggle-publish', requireAdmin, async (req: Request, res: Response) => {
  const admin = (req as any).admin;
  const { id } = req.params;
  const appItem = await db.togglePublish(id, admin.username);
  if (!appItem) {
    return res.status(404).json({ success: false, error: 'ط§ظ„طھط·ط¨ظٹظ‚ ط؛ظٹط± ظ…ظˆط¬ظˆط¯' });
  }
  res.json({ success: true, isPublished: appItem.isPublished });
});

// Upload and Validate APK file
app.post('/api/admin/upload-apk', requireAdmin, upload.single('apkFile'), async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'ظ„ظ… ظٹطھظ… ط¥ط±ط³ط§ظ„ ط£ظٹ ظ…ظ„ظپ APK' });
  }

  const analysis = validateAndAnalyzeApk(req.file.buffer, req.file.originalname);
  if (!analysis.valid) {
    return res.status(400).json({
      success: false,
      error: analysis.error || 'ط§ظ„ظ…ظ„ظپ ط§ظ„ظ…ط±ظپظˆط¹ ط؛ظٹط± طµط§ظ„ط­ ظƒط­ط²ظ…ط© APK'
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
    res.status(500).json({ success: false, error: `ظپط´ظ„ طھط®ط²ظٹظ† ط£ظˆ ط±ظپط¹ ط§ظ„ط­ط²ظ…ط©: ${err.message || err}` });
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
    return res.status(400).json({ success: false, error: 'ظٹط±ط¬ظ‰ طھظ‚ط¯ظٹظ… ط¨ظٹط§ظ†ط§طھ ط§ظ„ط¥طµط¯ط§ط± ظˆظ…ظ„ظپ ط§ظ„ط­ط²ظ…ط© ط§ظ„ظ…ط¹طھظ…ط¯' });
  }

  const appItem = await db.getApplicationById(appId);
  if (!appItem) {
    return res.status(404).json({ success: false, error: 'ط§ظ„طھط·ط¨ظٹظ‚ ط§ظ„طھط§ط¨ط¹ ظ„ظ„ط¥طµط¯ط§ط± ط؛ظٹط± ظ…ظˆط¬ظˆط¯' });
  }

  // Reject release if packageName Candidate is provided and does not match expected app package name
  if (appItem.packageName && req.body.packageNameCandidate) {
    if (req.body.packageNameCandidate !== appItem.packageName) {
      return res.status(400).json({
        success: false,
        error: `ط§ط³ظ… ط­ط²ظ…ط© APK ط§ظ„ظ…ط±ظپظˆط¹ (${req.body.packageNameCandidate}) ظ„ط§ ظٹط·ط§ط¨ظ‚ ط§ط³ظ… ط§ظ„ط­ط²ظ…ط© ط§ظ„ظ…ط³ط¬ظ„ ظ„ظ„طھط·ط¨ظٹظ‚ (${appItem.packageName})`
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
    return res.status(404).json({ success: false, error: 'ط§ظ„ط¥طµط¯ط§ط± ط؛ظٹط± ظ…ظˆط¬ظˆط¯' });
  }
  res.json({ success: true });
});

// ==========================================
// ADMIN DIGITAL PRODUCTS API
// ==========================================

// Get all products (published + drafts)
app.get('/api/admin/products', requireAdmin, async (req: Request, res: Response) => {
  const products = await db.getProducts(false);
  res.json({ success: true, products });
});

// Get single product by id with its media and files
app.get('/api/admin/products/:id', requireAdmin, async (req: Request, res: Response) => {
  const { id } = req.params;
  const product = await db.getProductById(id);
  if (!product) {
    return res.status(404).json({ success: false, error: 'ط§ظ„ظ…ظ†طھط¬ ط؛ظٹط± ظ…ظˆط¬ظˆط¯' });
  }
  const media = await db.getMediaByProductId(id, false);
  const files = await db.getProductFiles(id);
  res.json({ success: true, product, media, files });
});

// Create new digital product
app.post('/api/admin/products', requireAdmin, async (req: Request, res: Response) => {
  const admin = (req as any).admin;
  const {
    nameAr, nameEn, slug, type, category, author, publisher, pages, language, isbn,
    shortDescAr, shortDescEn, fullDescAr, fullDescEn, featuresAr, featuresEn,
    versionName, versionCode, packageName, minAndroid, releaseNotesAr, releaseNotesEn, sha256,
    price, currency, tags, license, isPublished, featured, status,
    iconUrl, coverUrl, bannerUrl, videoUrl, videoTitle
  } = req.body;

  if (!nameAr || !nameEn || !slug || !type) {
    return res.status(400).json({ success: false, error: 'ظٹط±ط¬ظ‰ طھظ‚ط¯ظٹظ… ط§ظ„ط­ظ‚ظˆظ„ ط§ظ„ط£ط³ط§ط³ظٹط© ظ„ظ„ظ…ظ†طھط¬ (ط§ظ„ط§ط³ظ… ط¨ط§ظ„ط¹ط±ط¨ظٹط©طŒ ط¨ط§ظ„ط¥ظ†ط¬ظ„ظٹط²ظٹط©طŒ ط§ظ„ظ…ط¹ط±ظپطŒ ظˆظ†ظˆط¹ ط§ظ„ظ…ظ†طھط¬)' });
  }

  if (videoUrl && !isValidVideoUrl(videoUrl)) {
    return res.status(400).json({ success: false, error: 'ط±ط§ط¨ط· ط§ظ„ظپظٹط¯ظٹظˆ ط؛ظٹط± طµط§ظ„ط­ ط£ظˆ ط؛ظٹط± ظ…ط¹طھظ…ط¯. ظٹط±ط¬ظ‰ طھط²ظˆظٹط¯ ط±ط§ط¨ط· ظ…ظ† YouTube ط£ظˆ Vimeo ظپظ‚ط·.' });
  }

  const existing = await db.getProductBySlug(slug, false);
  if (existing) {
    return res.status(400).json({ success: false, error: 'ظ…ط¹ط±ظپ ط§ظ„ط±ط§ط¨ط· (Slug) ظ…ط³طھط®ط¯ظ… ط¨ط§ظ„ظپط¹ظ„ ظ„ظ…ظ†طھط¬ ط¢ط®ط±' });
  }

  const product = await db.createProduct({
    nameAr: String(nameAr).trim(),
    nameEn: String(nameEn).trim(),
    slug: String(slug).trim().toLowerCase(),
    type: type || 'other',
    category: category || 'General',
    author: author || '',
    publisher: publisher || '',
    pages: pages ? parseInt(pages, 10) : undefined,
    language: language || '',
    isbn: isbn || '',
    shortDescAr: shortDescAr || '',
    shortDescEn: shortDescEn || '',
    fullDescAr: fullDescAr || '',
    fullDescEn: fullDescEn || '',
    featuresAr: Array.isArray(featuresAr) ? featuresAr : (typeof featuresAr === 'string' ? featuresAr.split('\n').map(s => s.trim()).filter(Boolean) : []),
    featuresEn: Array.isArray(featuresEn) ? featuresEn : (typeof featuresEn === 'string' ? featuresEn.split('\n').map(s => s.trim()).filter(Boolean) : []),
    versionName: versionName || '',
    versionCode: versionCode ? parseInt(versionCode, 10) : undefined,
    packageName: packageName || '',
    minAndroid: minAndroid || '',
    releaseNotesAr: releaseNotesAr || '',
    releaseNotesEn: releaseNotesEn || '',
    sha256: sha256 || '',
    price: price ? parseFloat(price) : 0,
    currency: currency || 'USD',
    tags: Array.isArray(tags) ? tags : (typeof tags === 'string' ? tags.split(',').map(s => s.trim()).filter(Boolean) : []),
    license: license || 'Free',
    isPublished: isPublished === true,
    featured: featured === true,
    status: status || (isPublished ? 'published' : 'draft'),
    iconUrl: iconUrl || '',
    coverUrl: coverUrl || '',
    bannerUrl: bannerUrl || '',
    videoUrl: videoUrl || '',
    videoTitle: videoTitle || ''
  }, admin.username);

  res.json({ success: true, product });
});

// Update digital product
app.put('/api/admin/products/:id', requireAdmin, async (req: Request, res: Response) => {
  const admin = (req as any).admin;
  const { id } = req.params;
  const updates = { ...req.body };

  if (updates.videoUrl && !isValidVideoUrl(updates.videoUrl)) {
    return res.status(400).json({ success: false, error: 'ط±ط§ط¨ط· ط§ظ„ظپظٹط¯ظٹظˆ ط؛ظٹط± طµط§ظ„ط­. ظٹط³ظ…ط­ ط¨ط±ظˆط§ط¨ط· YouTube ظˆ Vimeo ظپظ‚ط·.' });
  }

  if (typeof updates.featuresAr === 'string') {
    updates.featuresAr = updates.featuresAr.split('\n').map((s: string) => s.trim()).filter(Boolean);
  }
  if (typeof updates.featuresEn === 'string') {
    updates.featuresEn = updates.featuresEn.split('\n').map((s: string) => s.trim()).filter(Boolean);
  }
  if (typeof updates.tags === 'string') {
    updates.tags = updates.tags.split(',').map((s: string) => s.trim()).filter(Boolean);
  }

  const updated = await db.updateProduct(id, updates, admin.username);
  if (!updated) {
    return res.status(404).json({ success: false, error: 'ط§ظ„ظ…ظ†طھط¬ ط؛ظٹط± ظ…ظˆط¬ظˆط¯' });
  }

  res.json({ success: true, product: updated });
});

// Delete digital product
app.delete('/api/admin/products/:id', requireAdmin, async (req: Request, res: Response) => {
  const admin = (req as any).admin;
  const { id } = req.params;
  const deleted = await db.deleteProduct(id, admin.username);
  if (!deleted) {
    return res.status(404).json({ success: false, error: 'ط§ظ„ظ…ظ†طھط¬ ط؛ظٹط± ظ…ظˆط¬ظˆط¯' });
  }
  res.json({ success: true });
});

// Publish product
app.post('/api/admin/products/:id/publish', requireAdmin, async (req: Request, res: Response) => {
  const admin = (req as any).admin;
  const { id } = req.params;
  const product = await db.publishProduct(id, true, admin.username);
  if (!product) {
    return res.status(404).json({ success: false, error: 'ط§ظ„ظ…ظ†طھط¬ ط؛ظٹط± ظ…ظˆط¬ظˆط¯' });
  }
  res.json({ success: true, product });
});

// Unpublish product
app.post('/api/admin/products/:id/unpublish', requireAdmin, async (req: Request, res: Response) => {
  const admin = (req as any).admin;
  const { id } = req.params;
  const product = await db.unpublishProduct(id, admin.username);
  if (!product) {
    return res.status(404).json({ success: false, error: 'ط§ظ„ظ…ظ†طھط¬ ط؛ظٹط± ظ…ظˆط¬ظˆط¯' });
  }
  res.json({ success: true, product });
});

// ==========================================
// ADMIN PRODUCT MEDIA API
// ==========================================

// Get media for product
app.get('/api/admin/products/:productId/media', requireAdmin, async (req: Request, res: Response) => {
  const { productId } = req.params;
  const media = await db.getMediaByProductId(productId, false);
  res.json({ success: true, media });
});

// Add media to product
app.post('/api/admin/products/:productId/media', requireAdmin, async (req: Request, res: Response) => {
  const admin = (req as any).admin;
  const { productId } = req.params;
  const { mediaType, fileUrl, thumbnailUrl, externalUrl, titleAr, titleEn, altAr, altEn, sortOrder, isPublished } = req.body;

  if (!mediaType) {
    return res.status(400).json({ success: false, error: 'ظ†ظˆط¹ ط§ظ„ظˆط³ظٹط· ظ…ط·ظ„ظˆط¨' });
  }

  if (externalUrl && (mediaType === 'video' || externalUrl.includes('youtube') || externalUrl.includes('vimeo'))) {
    if (!isValidVideoUrl(externalUrl)) {
      return res.status(400).json({ success: false, error: 'ط±ط§ط¨ط· ط§ظ„ظپظٹط¯ظٹظˆ ط؛ظٹط± ظ…ط¯ط¹ظˆظ… ط£ظˆ ط؛ظٹط± ط¢ظ…ظ†. ظٹط³ظ…ط­ ط¨ظ€ YouTube ظˆ Vimeo ظپظ‚ط·.' });
    }
  }

  const media = await db.createProductMedia({
    productId,
    mediaType,
    fileUrl: fileUrl || '',
    thumbnailUrl: thumbnailUrl || '',
    externalUrl: externalUrl || '',
    titleAr: titleAr || '',
    titleEn: titleEn || '',
    altAr: altAr || '',
    altEn: altEn || '',
    sortOrder: typeof sortOrder === 'number' ? sortOrder : 0,
    isPublished: isPublished !== false
  }, admin.username);

  res.json({ success: true, media });
});

// Get single media item
app.get('/api/admin/media/:id', requireAdmin, async (req: Request, res: Response) => {
  const { id } = req.params;
  const media = await db.getMediaById(id);
  if (!media) {
    return res.status(404).json({ success: false, error: 'ط¹ظ†طµط± ط§ظ„ظˆط³ط§ط¦ط· ط؛ظٹط± ظ…ظˆط¬ظˆط¯' });
  }
  res.json({ success: true, media });
});

// Allowed image MIME types and extensions
const allowedMediaMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
const allowedMediaExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'];

// Upload product media image
app.post('/api/admin/products/:productId/media/upload', requireAdmin, upload.single('mediaFile'), async (req: Request, res: Response) => {
  const admin = (req as any).admin;
  const { productId } = req.params;
  const { mediaType, titleAr, titleEn, altAr, altEn, sortOrder, isPublished } = req.body;

  if (!req.file) {
    return res.status(400).json({ success: false, error: 'ظ„ظ… ظٹطھظ… ط¥ط±ط³ط§ظ„ ط£ظٹ ظ…ظ„ظپ طµظˆط±ط© ظ„ظ„ط±ظپط¹' });
  }

  const rawFilename = req.file.originalname || 'image';
  const sanitizedFilename = path.basename(rawFilename).replace(/[^a-zA-Z0-9._-]/g, '_');
  const lowerExt = path.extname(sanitizedFilename).toLowerCase();

  if (!allowedMediaMimeTypes.includes(req.file.mimetype)) {
    return res.status(400).json({
      success: false,
      error: `ظ†ظˆط¹ ط§ظ„ظˆط³ط§ط¦ط· ط؛ظٹط± ظ…ط¯ط¹ظˆظ… (${req.file.mimetype}). ظٹط³ظ…ط­ ظپظ‚ط· ط¨ظ…ظ„ظپط§طھ ط§ظ„طµظˆط±: JPEG, PNG, WebP, GIF, SVG.`
    });
  }

  if (!allowedMediaExtensions.includes(lowerExt)) {
    return res.status(400).json({
      success: false,
      error: `ط§ظ…طھط¯ط§ط¯ ط§ظ„ظ…ظ„ظپ ط؛ظٹط± ظ…ط³ظ…ظˆط­ ط¨ظ‡ (${lowerExt}). ط§ظ„ط§ظ…طھط¯ط§ط¯ط§طھ ط§ظ„ظ…ظ‚ط¨ظˆظ„ط©: .jpg, .jpeg, .png, .webp, .gif, .svg`
    });
  }

  if (req.file.size > 15 * 1024 * 1024) {
    return res.status(400).json({ success: false, error: 'ط­ط¬ظ… ظ…ظ„ظپ ط§ظ„طµظˆط±ط© ظٹطھط¬ط§ظˆط² ط§ظ„ط­ط¯ ط§ظ„ظ…ط³ظ…ظˆط­ ط¨ظ‡ (15 ظ…ظٹط¬ط§ط¨ط§ظٹطھ)' });
  }

  try {
    const stored = await artifactStorage.saveMediaFile(productId, sanitizedFilename, req.file.buffer);

    const media = await db.createProductMedia({
      productId,
      mediaType: mediaType || 'gallery',
      fileUrl: stored.downloadUrl,
      thumbnailUrl: stored.downloadUrl,
      titleAr: titleAr || '',
      titleEn: titleEn || '',
      altAr: altAr || '',
      altEn: altEn || '',
      sortOrder: sortOrder ? parseInt(sortOrder, 10) : 0,
      isPublished: isPublished !== 'false' && isPublished !== false
    }, admin.username);

    res.json({ success: true, media });
  } catch (err: any) {
    res.status(500).json({ success: false, error: `ظپط´ظ„ طھط®ط²ظٹظ† ظ…ظ„ظپ ط§ظ„ظˆط³ط§ط¦ط·: ${err.message || err}` });
  }
});

// Update media
app.put('/api/admin/media/:id', requireAdmin, async (req: Request, res: Response) => {
  const admin = (req as any).admin;
  const { id } = req.params;
  const updates = { ...req.body };

  if (updates.externalUrl && (updates.mediaType === 'video' || updates.externalUrl.includes('youtube') || updates.externalUrl.includes('vimeo'))) {
    if (!isValidVideoUrl(updates.externalUrl)) {
      return res.status(400).json({ success: false, error: 'ط±ط§ط¨ط· ط§ظ„ظپظٹط¯ظٹظˆ ط؛ظٹط± ظ…ط¯ط¹ظˆظ… ط£ظˆ ط؛ظٹط± ط¢ظ…ظ†. ظٹط³ظ…ط­ ط¨ظ€ YouTube ظˆ Vimeo ظپظ‚ط·.' });
    }
  }

  const media = await db.updateMedia(id, updates, admin.username);
  if (!media) {
    return res.status(404).json({ success: false, error: 'ط¹ظ†طµط± ط§ظ„ظˆط³ط§ط¦ط· ط؛ظٹط± ظ…ظˆط¬ظˆط¯' });
  }
  res.json({ success: true, media });
});

// Delete media
app.delete('/api/admin/media/:id', requireAdmin, async (req: Request, res: Response) => {
  const admin = (req as any).admin;
  const { id } = req.params;
  const deleted = await db.deleteMedia(id, admin.username);
  if (!deleted) {
    return res.status(404).json({ success: false, error: 'ط¹ظ†طµط± ط§ظ„ظˆط³ط§ط¦ط· ط؛ظٹط± ظ…ظˆط¬ظˆط¯' });
  }
  res.json({ success: true });
});

// Reorder media for product
app.post('/api/admin/products/:productId/media/reorder', requireAdmin, async (req: Request, res: Response) => {
  const admin = (req as any).admin;
  const { productId } = req.params;
  const { orderedIds } = req.body;

  if (!Array.isArray(orderedIds)) {
    return res.status(400).json({ success: false, error: 'ظٹط±ط¬ظ‰ طھظ‚ط¯ظٹظ… ظ…طµظپظˆظپط© ظ…ط¹ط±ظپط§طھ ط§ظ„ظˆط³ط§ط¦ط· ظ„ط¥ط¹ط§ط¯ط© ط§ظ„طھط±طھظٹط¨' });
  }

  await db.reorderProductMedia(productId, orderedIds, admin.username);
  res.json({ success: true });
});

// ==========================================
// ADMIN PRODUCT FILES API
// ==========================================

// Get files for product
app.get('/api/admin/products/:productId/files', requireAdmin, async (req: Request, res: Response) => {
  const { productId } = req.params;
  const files = await db.getProductFiles(productId);
  res.json({ success: true, files });
});

// Allowed file extensions for product downloads
const allowedFileExtensions = [
  '.pdf', '.epub', '.mobi', '.zip', '.tar.gz', '.tgz', '.apk', '.exe', '.dmg',
  '.pkg', '.iso', '.mp3', '.wav', '.mp4', '.mov', '.docx', '.xlsx', '.pptx',
  '.fig', '.psd', '.ai', '.json', '.txt', '.md', '.csv', '.svg', '.png', '.jpg'
];

// Upload digital product file
app.post('/api/admin/products/:productId/files/upload', requireAdmin, upload.single('productFile'), async (req: Request, res: Response) => {
  const admin = (req as any).admin;
  const { productId } = req.params;
  const { title, fileType, isMain } = req.body;

  if (!req.file) {
    return res.status(400).json({ success: false, error: 'ظ„ظ… ظٹطھظ… ط¥ط±ط³ط§ظ„ ط£ظٹ ظ…ظ„ظپ ظ„ظ„ط±ظپط¹' });
  }

  const rawFilename = req.file.originalname || 'file';
  const sanitizedFilename = path.basename(rawFilename).replace(/[^a-zA-Z0-9._-]/g, '_');
  const lowerExt = path.extname(sanitizedFilename).toLowerCase();

  const isAllowedExt = allowedFileExtensions.some(ext => sanitizedFilename.toLowerCase().endsWith(ext));
  if (!isAllowedExt) {
    return res.status(400).json({
      success: false,
      error: `ظ†ظˆط¹ ط§ظ„ظ…ظ„ظپ ط؛ظٹط± ظ…ط³ظ…ظˆط­ ط¨ظ‡ (${lowerExt}). ط§ظ„ط§ظ…طھط¯ط§ط¯ط§طھ ط§ظ„ظ…ط¯ط¹ظˆظ…ط© طھط´ظ…ظ„: PDF, EPUB, ZIP, APK, MP3, MP4, ط§ظ„ظ…ط³طھظ†ط¯ط§طھ ط§ظ„ظ…ظƒطھط¨ظٹط© ظˆط§ظ„طھطµظ…ظٹظ…ظٹط©.`
    });
  }

  if (req.file.size > 150 * 1024 * 1024) {
    return res.status(400).json({ success: false, error: 'ط­ط¬ظ… ط§ظ„ظ…ظ„ظپ ظٹطھط¬ط§ظˆط² ط§ظ„ط­ط¯ ط§ظ„ظ…ط³ظ…ظˆط­ ط¨ظ‡ (150 ظ…ظٹط¬ط§ط¨ط§ظٹطھ)' });
  }

  try {
    const stored = await artifactStorage.saveProductFile(productId, sanitizedFilename, req.file.buffer);

    const sizeFormatted = req.file.size > 1024 * 1024
      ? `${(req.file.size / (1024 * 1024)).toFixed(2)} MB`
      : `${(req.file.size / 1024).toFixed(1)} KB`;

    const productFile = await db.createProductFile({
      productId,
      fileUrl: stored.downloadUrl,
      title: title || sanitizedFilename,
      fileType: fileType || 'MAIN',
      originalName: sanitizedFilename,
      size: sizeFormatted,
      sizeBytes: req.file.size,
      sha256: stored.sha256,
      isMain: isMain === 'true' || isMain === true
    }, admin.username);

    res.json({ success: true, file: productFile });
  } catch (err: any) {
    res.status(500).json({ success: false, error: `ظپط´ظ„ طھط®ط²ظٹظ† ط§ظ„ظ…ظ„ظپ: ${err.message || err}` });
  }
});

// Delete product file
app.delete('/api/admin/product-files/:id', requireAdmin, async (req: Request, res: Response) => {
  const admin = (req as any).admin;
  const { id } = req.params;
  const deleted = await db.deleteProductFile(id, admin.username);
  if (!deleted) {
    return res.status(404).json({ success: false, error: 'ط§ظ„ظ…ظ„ظپ ط؛ظٹط± ظ…ظˆط¬ظˆط¯' });
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
// ADMIN AI CONTROL CENTER API
// ==========================================

app.get('/api/admin/ai/providers', requireAdmin, async (req: Request, res: Response) => {
  try {
    const providers = await db.getAIProviders();
    const enriched = providers.map(p => {
      const adapter = aiGateway.getProvider(p.id);
      return {
        ...p,
        adapterStatus: adapter ? (adapter.isConfigured() ? 'LIVE' : 'NOT_CONFIGURED') : 'STUB',
        isConfigured: adapter?.isConfigured() || false
      };
    });
    res.json({ success: true, providers: enriched });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'ظپط´ظ„ ظپظٹ طھط­ظ…ظٹظ„ ط§ظ„ظ…ط²ظˆط¯ظٹظ†' });
  }
});

app.patch('/api/admin/ai/providers/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const admin = (req as any).admin;
    const updates = req.body;
    const success = await db.updateAIProviderDetails(id, updates);
    if (!success) return res.status(404).json({ success: false, error: 'ط§ظ„ظ…ط²ظˆط¯ ط؛ظٹط± ظ…ظˆط¬ظˆط¯' });
    
    await db.logActivity('AI_PROVIDER_UPDATED', 'AI_PROVIDER', id, `طھط¹ط¯ظٹظ„ ط¥ط¹ط¯ط§ط¯ط§طھ ط§ظ„ظ…ط²ظˆط¯: ${id}`, admin.username);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'ظپط´ظ„ ظپظٹ طھط­ط¯ظٹط« ط§ظ„ظ…ط²ظˆط¯' });
  }
});

app.post('/api/admin/ai/providers/:id/test', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const provider = aiGateway.getProvider(id);
    if (!provider) return res.status(404).json({ success: false, error: 'Adapter not found' });
    
    const isConfigured = provider.isConfigured();
    res.json({ 
      success: true, 
      status: isConfigured ? 'CONNECTED' : 'NOT_CONFIGURED',
      details: isConfigured ? 'ط§ظ„ظ…ط²ظˆط¯ ظ…ظ‡ظٹط£ ظˆط¬ط§ظ‡ط² ظ„ظ„ط¹ظ…ظ„' : 'ظ…ظپطھط§ط­ API ط؛ظٹط± ظ…طھظˆظپط± ظپظٹ ط§ظ„ط¨ظٹط¦ط©'
    });
  } catch (err: any) {
    res.json({ success: false, status: 'ERROR', details: err.message });
  }
});

app.get('/api/admin/ai/models', requireAdmin, async (req: Request, res: Response) => {
  try {
    const models = await db.getAIModels();
    res.json({ success: true, models });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'ظپط´ظ„ ظپظٹ طھط­ظ…ظٹظ„ ط§ظ„ظ†ظ…ط§ط°ط¬' });
  }
});

app.post('/api/admin/ai/models', requireAdmin, async (req: Request, res: Response) => {
  try {
    const admin = (req as any).admin;
    const modelData = req.body;
    if (!modelData.providerId || !modelData.modelId) {
      return res.status(400).json({ success: false, error: 'ظٹط±ط¬ظ‰ طھط­ط¯ظٹط¯ ط§ظ„ظ…ط²ظˆط¯ ظˆظ…ط¹ط±ظ‘ظپ ط§ظ„ظ†ظ…ظˆط°ط¬' });
    }
    
    const id = `model_${modelData.providerId}_${modelData.modelId.replace(/[^a-z0-9]/g, '_')}`;
    const now = new Date().toISOString();
    
    const newModel = await db.createAIModel({
      ...modelData,
      id,
      createdAt: now,
      updatedAt: now
    });
    
    await db.logActivity('AI_MODEL_CREATED', 'AI_MODEL', id, `ط¥ط¶ط§ظپط© ظ†ظ…ظˆط°ط¬ ط¬ط¯ظٹط¯: ${modelData.modelId}`, admin.username);
    res.json({ success: true, model: newModel });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'ظپط´ظ„ ظپظٹ ط¥ظ†ط´ط§ط، ط§ظ„ظ†ظ…ظˆط°ط¬' });
  }
});

app.patch('/api/admin/ai/models/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const admin = (req as any).admin;
    const updates = req.body;
    const success = await db.updateAIModelDetails(id, updates);
    if (!success) return res.status(404).json({ success: false, error: 'ط§ظ„ظ†ظ…ظˆط°ط¬ ط؛ظٹط± ظ…ظˆط¬ظˆط¯' });
    
    await db.logActivity('AI_MODEL_UPDATED', 'AI_MODEL', id, `طھط¹ط¯ظٹظ„ ط¥ط¹ط¯ط§ط¯ط§طھ ط§ظ„ظ†ظ…ظˆط°ط¬: ${id}`, admin.username);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'ظپط´ظ„ ظپظٹ طھط­ط¯ظٹط« ط§ظ„ظ†ظ…ظˆط°ط¬' });
  }
});

app.delete('/api/admin/ai/models/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const admin = (req as any).admin;
    const success = await db.deleteAIModel(id);
    if (!success) return res.status(404).json({ success: false, error: 'ط§ظ„ظ†ظ…ظˆط°ط¬ ط؛ظٹط± ظ…ظˆط¬ظˆط¯' });
    
    await db.logActivity('AI_MODEL_DELETED', 'AI_MODEL', id, `ط­ط°ظپ ط§ظ„ظ†ظ…ظˆط°ط¬: ${id}`, admin.username);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'ظپط´ظ„ ظپظٹ ط­ط°ظپ ط§ظ„ظ†ظ…ظˆط°ط¬' });
  }
});

app.get('/api/admin/ai/settings', requireAdmin, async (req: Request, res: Response) => {
  try {
    const settings = await db.getAISettings();
    res.json({ success: true, settings });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'ظپط´ظ„ ظپظٹ طھط­ظ…ظٹظ„ ط§ظ„ط¥ط¹ط¯ط§ط¯ط§طھ' });
  }
});

app.patch('/api/admin/ai/settings', requireAdmin, async (req: Request, res: Response) => {
  try {
    const admin = (req as any).admin;
    const updates = req.body;
    const settings = await db.updateAISettings(updates);
    
    await db.logActivity('AI_SETTINGS_UPDATED', 'AI_SETTINGS', 'global', `طھط¹ط¯ظٹظ„ ط³ظٹط§ط³ط§طھ ط§ظ„طھظˆط¬ظٹظ‡ ظˆط§ظ„طھط¹ط§ظپظٹ`, admin.username);
    res.json({ success: true, settings });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'ظپط´ظ„ ظپظٹ طھط­ط¯ظٹط« ط§ظ„ط¥ط¹ط¯ط§ط¯ط§طھ' });
  }
});

app.get('/api/admin/ai/usage/stats', requireAdmin, async (req: Request, res: Response) => {
  try {
    const stats = await db.getAIUsageStats();
    res.json({ success: true, stats });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'ظپط´ظ„ ظپظٹ طھط­ظ…ظٹظ„ ط¥ط­طµط§ط¦ظٹط§طھ ط§ظ„ط§ط³طھط®ط¯ط§ظ…' });
  }
});

app.get('/api/admin/ai/user-keys', requireAdmin, async (req: Request, res: Response) => {
  try {
    // This is for viewing BYOK entries (masked)
    // Needs a method in db.ts to list all user keys with user info
    // For now, let's assume we can at least query PG
    const pool = (db as any).pool;
    if (!(db as any).isPg || !pool) {
       return res.json({ success: true, keys: [] }); // JSON fallback empty for now
    }
    const resKeys = await pool.query(`
      SELECT k.id, k.provider_id, k.updated_at, u.email as "userEmail", u.display_name as "userName"
      FROM ai_user_keys k
      JOIN users u ON k.user_id = u.id
      ORDER BY k.updated_at DESC
    `);
    const keys = resKeys.rows.map((r: any) => ({
      id: r.id,
      providerId: r.provider_id,
      updatedAt: r.updated_at,
      userEmail: r.userEmail,
      userName: r.userName,
      mask: '********'
    }));
    res.json({ success: true, keys });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'ظپط´ظ„ ظپظٹ طھط­ظ…ظٹظ„ ظ…ظپط§طھظٹط­ ط§ظ„ظ…ط³طھط®ط¯ظ…ظٹظ†' });
  }
});

// ==========================================
// VITE OR STATIC SERVE
// ==========================================
async function startServer() {
  // Start HTTP server immediately
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ًںڑ€ Kayan Store server listening on port ${PORT} (http://localhost:${PORT})`);
  });

  // Asynchronously initialize database
  db.initialize().then(() => {
    console.log('âœ… Database initialized successfully');
    newsEngine.startScheduler().catch(err => {
      console.error('Failed to start news scheduler:', err);
    });
  }).catch(err => {
    console.error('â‌Œ Database initialization error:', err?.message || err);
  });

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
    console.log(`ًںڑ€ Kayan Store production server serving compiled static files from ${distPath} on port ${PORT}`);
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }
}

startServer();

