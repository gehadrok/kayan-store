import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import AdmZip from 'adm-zip';
import pkg from 'pg';
const { Pool } = pkg;
import { LocalDiskArtifactStorage, GitHubReleaseArtifactStorage, IArtifactStorage } from './storage/index.ts';

export interface Application {
  id: string;
  slug: string;
  nameAr: string;
  nameEn: string;
  shortDescAr: string;
  shortDescEn: string;
  fullDescAr: string;
  fullDescEn: string;
  featuresAr: string[];
  featuresEn: string[];
  category: string;
  minAndroid: string;
  packageName: string;
  iconUrl: string;
  bannerUrl: string;
  privacyUrl: string;
  termsUrl: string;
  copyright: string;
  isPublished: boolean;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Release {
  id: string;
  appId: string;
  versionName: string;
  versionCode: number;
  apkFileName: string;
  apkDownloadUrl: string;
  apkSize: string;
  apkSizeBytes: number;
  sha256: string;
  minAndroid: string;
  releaseNotesAr: string;
  releaseNotesEn: string;
  isCurrent: boolean;
  releaseDate: string;
  createdAt: string;
}

export interface Screenshot {
  id: string;
  appId: string;
  url: string;
  captionAr: string;
  captionEn: string;
  orderIndex: number;
}

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}

export interface Session {
  token: string;
  adminId: string;
  expiresAt: number;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  action: string;
  targetType: string;
  targetId?: string;
  details: string;
  adminUsername: string;
  timestamp: string;
}

export interface DatabaseSchema {
  applications: Application[];
  releases: Release[];
  screenshots: Screenshot[];
  admins: AdminUser[];
  sessions: Session[];
  activityLogs: ActivityLog[];
}

const IS_PROD = process.env.NODE_ENV === 'production';
const STORAGE_DRIVER = process.env.GITHUB_TOKEN ? 'github' : (process.env.STORAGE_DRIVER === 'local' ? 'local' : (IS_PROD ? 'github' : 'local'));
const DATABASE_URL = process.env.DATABASE_URL;

if (IS_PROD && !DATABASE_URL) {
  throw new Error('Configuration Error: Missing required DATABASE_URL environment variable in production.');
}

if (IS_PROD && STORAGE_DRIVER === 'github') {
  if (!process.env.GITHUB_TOKEN) {
    throw new Error('Configuration Error: Missing required GITHUB_TOKEN environment variable in production.');
  }
}

export const artifactStorage: IArtifactStorage = STORAGE_DRIVER === 'github'
  ? new GitHubReleaseArtifactStorage()
  : new LocalDiskArtifactStorage();

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'store.json');
const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads', 'apks');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const adminUsername = process.env.ADMIN_USERNAME?.trim() || 'admin';
const initialPassword = process.env.ADMIN_INITIAL_PASSWORD?.trim() || 'KayanAdmin#2026!';
const salt = bcrypt.genSaltSync(10);
const passwordHash = bcrypt.hashSync(initialPassword, salt);

const defaultAppData: Application = {
  id: 'app_kayan_pdf_01',
  slug: 'kayan-pdf',
  nameAr: 'كيان PDF',
  nameEn: 'Kayan PDF',
  shortDescAr: 'تطبيق متكامل لإنشاء وضغط ودمج مستندات PDF وتصوير المستندات دون اتصال بالإنترنت وبأمان تام.',
  shortDescEn: 'All-in-one offline PDF utility: convert images, camera scan, compress, and merge PDF documents with 100% privacy.',
  fullDescAr: 'كيان PDF هو الأداة الاحترافية المعتمدة لمعالجة المستندات وملفات PDF على أجهزة أندرويد بدون أي اتصال بالإنترنت. تم تطوير التطبيق بواسطة المهندس جهاد الصليحي (كيان سوفت) لضمان السرية التامة للمستخدمين.',
  fullDescEn: 'Kayan PDF is the official professional document processing utility for Android devices, developed by Engineer Jehad Al-Solihy (Kayan Soft). It operates 100% offline to guarantee absolute data privacy.',
  featuresAr: [
    'تحويل الصور إلى مستندات PDF بجودة فائقة',
    'مسح المستندات بالكاميرا مع ضبط التباين والقص الذكي',
    'ضغط ملفات PDF وتقليل حجمها بكفاءة عالية',
    'دمج ملفات PDF متعددة في ملف واحد منظم',
    'سجل سريع للملفات المنشأة والمحفوظة مؤخراً',
    'واجهة عربية كاملة RTL بتصميم عصري مريح للعين',
    'دعم كامل للغة الإنجليزية LTR',
    'معالجة محلية 100% بدون إنترنت وبأمان مطلق'
  ],
  featuresEn: [
    'Convert photos and galleries to high-resolution PDF documents',
    'Camera document scanner with edge correction & contrast tuning',
    'Efficient PDF compression with minimal quality loss',
    'Merge multiple PDF documents into a single ordered file',
    'Quick access history for recently converted documents',
    'Full native Arabic RTL interface with clean typography',
    'Complete English LTR interface support',
    '100% offline local on-device processing with zero data telemetry'
  ],
  category: 'Tools & Documents',
  minAndroid: '7.0 / API 24',
  packageName: 'com.kayansoft.kayanpdf',
  iconUrl: '/src/assets/images/kayan_pdf_icon_1790438337873.jpg',
  bannerUrl: '/src/assets/images/kayan_pdf_feature_banner_1790438354730.jpg',
  privacyUrl: '/privacy',
  termsUrl: '/terms',
  copyright: '© 2026 المهندس جهاد الصليحي. جميع الحقوق محفوظة.',
  isPublished: true,
  featured: true,
  createdAt: new Date('2026-09-01T10:00:00Z').toISOString(),
  updatedAt: new Date().toISOString()
};

/**
 * Database wrapper supporting PostgreSQL (when DATABASE_URL is present) or JSON file.
 */
class PostgresOrJsonDatabase {
  private pool: pkg.Pool | null = null;
  private jsonData: DatabaseSchema | null = null;
  private isPg: boolean = false;

  constructor() {
    if (DATABASE_URL && (IS_PROD || process.env.FORCE_POSTGRES === 'true')) {
      this.isPg = true;
      this.pool = new Pool({
        connectionString: DATABASE_URL,
        ssl: DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
      });
      this.initPgTables();
    } else {
      this.jsonData = this.loadJson();
      this.syncAdminEnvCredentialsJson();
    }
  }

  private async initPgTables() {
    if (!this.pool) return;
    try {
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS admins (
          id VARCHAR(64) PRIMARY KEY,
          username VARCHAR(128) UNIQUE NOT NULL,
          email VARCHAR(255) NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS admin_sessions (
          token VARCHAR(255) PRIMARY KEY,
          admin_id VARCHAR(64) NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
          expires_at BIGINT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS applications (
          id VARCHAR(64) PRIMARY KEY,
          slug VARCHAR(128) UNIQUE NOT NULL,
          name_ar VARCHAR(255) NOT NULL,
          name_en VARCHAR(255) NOT NULL,
          short_desc_ar TEXT NOT NULL,
          short_desc_en TEXT NOT NULL,
          full_desc_ar TEXT NOT NULL,
          full_desc_en TEXT NOT NULL,
          features_ar TEXT[] NOT NULL,
          features_en TEXT[] NOT NULL,
          category VARCHAR(128) NOT NULL,
          min_android VARCHAR(64) NOT NULL,
          package_name VARCHAR(255) NOT NULL,
          icon_url TEXT NOT NULL,
          banner_url TEXT NOT NULL,
          privacy_url TEXT NOT NULL,
          terms_url TEXT NOT NULL,
          copyright VARCHAR(255) NOT NULL,
          is_published BOOLEAN NOT NULL DEFAULT FALSE,
          featured BOOLEAN NOT NULL DEFAULT FALSE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS releases (
          id VARCHAR(64) PRIMARY KEY,
          app_id VARCHAR(64) NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
          version_name VARCHAR(64) NOT NULL,
          version_code INT NOT NULL,
          apk_file_name VARCHAR(255) NOT NULL,
          apk_download_url TEXT NOT NULL,
          apk_size VARCHAR(64) NOT NULL,
          apk_size_bytes BIGINT NOT NULL,
          sha256 VARCHAR(128) NOT NULL,
          min_android VARCHAR(64) NOT NULL,
          release_notes_ar TEXT NOT NULL,
          release_notes_en TEXT NOT NULL,
          is_current BOOLEAN NOT NULL DEFAULT FALSE,
          release_date VARCHAR(64) NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS screenshots (
          id VARCHAR(64) PRIMARY KEY,
          app_id VARCHAR(64) NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
          url TEXT NOT NULL,
          caption_ar TEXT NOT NULL,
          caption_en TEXT NOT NULL,
          order_index INT NOT NULL DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS activity_logs (
          id VARCHAR(64) PRIMARY KEY,
          action VARCHAR(128) NOT NULL,
          target_type VARCHAR(128) NOT NULL,
          target_id VARCHAR(64),
          details TEXT NOT NULL,
          admin_username VARCHAR(128) NOT NULL,
          timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);

      // Seed initial data if empty
      const adminRes = await this.pool.query('SELECT COUNT(*) FROM admins');
      if (parseInt(adminRes.rows[0].count, 10) === 0) {
        await this.pool.query(
          'INSERT INTO admins (id, username, email, password_hash) VALUES ($1, $2, $3, $4) ON CONFLICT (username) DO NOTHING',
          ['admin_root', adminUsername, 'gehadalsolihy99@gmail.com', passwordHash]
        );
      }

      const appRes = await this.pool.query('SELECT COUNT(*) FROM applications');
      if (parseInt(appRes.rows[0].count, 10) === 0) {
        await this.pool.query(
          `INSERT INTO applications (id, slug, name_ar, name_en, short_desc_ar, short_desc_en, full_desc_ar, full_desc_en, features_ar, features_en, category, min_android, package_name, icon_url, banner_url, privacy_url, terms_url, copyright, is_published, featured)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)`,
          [
            defaultAppData.id, defaultAppData.slug, defaultAppData.nameAr, defaultAppData.nameEn,
            defaultAppData.shortDescAr, defaultAppData.shortDescEn, defaultAppData.fullDescAr, defaultAppData.fullDescEn,
            defaultAppData.featuresAr, defaultAppData.featuresEn, defaultAppData.category, defaultAppData.minAndroid,
            defaultAppData.packageName, defaultAppData.iconUrl, defaultAppData.bannerUrl, defaultAppData.privacyUrl,
            defaultAppData.termsUrl, defaultAppData.copyright, defaultAppData.isPublished, defaultAppData.featured
          ]
        );

        await this.pool.query(
          `INSERT INTO screenshots (id, app_id, url, caption_ar, caption_en, order_index) VALUES ($1, $2, $3, $4, $5, $6)`,
          ['ss_1', defaultAppData.id, defaultAppData.bannerUrl, 'واجهة الأدوات الرئيسية', 'Main tools overview', 0]
        );
      }

      console.log('📦 PostgreSQL database connected and verified successfully.');
    } catch (err: any) {
      console.error('Failed to initialize PostgreSQL tables:', err?.message || err);
      if (IS_PROD) {
        throw err;
      } else {
        console.warn('⚠️ Falling back to local JSON store due to PostgreSQL connection/auth failure in development mode.');
        this.isPg = false;
        try {
          if (this.pool) await this.pool.end();
        } catch {}
        this.pool = null;
        this.jsonData = this.loadJson();
        this.syncAdminEnvCredentialsJson();
      }
    }
  }

  private loadJson(): DatabaseSchema {
    if (fs.existsSync(DB_FILE)) {
      try {
        const content = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(content);
      } catch (err) {
        console.error('Failed to load store.json', err);
      }
    }
    const data: DatabaseSchema = {
      applications: [defaultAppData],
      releases: [],
      screenshots: [
        {
          id: 'ss_1',
          appId: defaultAppData.id,
          url: defaultAppData.bannerUrl,
          captionAr: 'واجهة الأدوات الرئيسية',
          captionEn: 'Main tools overview',
          orderIndex: 0
        }
      ],
      admins: [
        {
          id: 'admin_root',
          username: adminUsername,
          email: 'gehadalsolihy99@gmail.com',
          passwordHash,
          createdAt: new Date().toISOString()
        }
      ],
      sessions: [],
      activityLogs: []
    };
    this.saveJson(data);
    return data;
  }

  private saveJson(data: DatabaseSchema) {
    const dataToSave = {
      ...data,
      sessions: []
    };
    const tempFile = `${DB_FILE}.${Date.now()}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(dataToSave, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  }

  private syncAdminEnvCredentialsJson() {
    if (!this.jsonData) return;
    let admin = this.jsonData.admins.find(a => a.id === 'admin_root' || a.username === adminUsername);
    if (!admin && this.jsonData.admins.length > 0) {
      admin = this.jsonData.admins[0];
    }
    if (admin) {
      admin.username = adminUsername;
      admin.passwordHash = passwordHash;
    } else {
      this.jsonData.admins.push({
        id: 'admin_root',
        username: adminUsername,
        email: 'gehadalsolihy99@gmail.com',
        passwordHash,
        createdAt: new Date().toISOString()
      });
    }
    this.saveJson(this.jsonData);
  }

  // PUBLIC & ADMIN API METHODS (Supports both sync-like calls wrapped or async)
  public async getApplications(onlyPublished: boolean = false): Promise<Application[]> {
    if (this.isPg && this.pool) {
      const query = onlyPublished
        ? 'SELECT * FROM applications WHERE is_published = true ORDER BY created_at DESC'
        : 'SELECT * FROM applications ORDER BY created_at DESC';
      const res = await this.pool.query(query);
      return res.rows.map(r => this.mapAppFromPg(r));
    }
    if (!this.jsonData) return [];
    return onlyPublished ? this.jsonData.applications.filter(a => a.isPublished) : [...this.jsonData.applications];
  }

  public async getApplicationBySlug(slug: string, onlyPublished: boolean = false): Promise<Application | undefined> {
    if (this.isPg && this.pool) {
      const query = onlyPublished
        ? 'SELECT * FROM applications WHERE slug = $1 AND is_published = true'
        : 'SELECT * FROM applications WHERE slug = $1';
      const res = await this.pool.query(query, [slug]);
      return res.rows[0] ? this.mapAppFromPg(res.rows[0]) : undefined;
    }
    if (!this.jsonData) return undefined;
    const app = this.jsonData.applications.find(a => a.slug === slug);
    if (!app || (onlyPublished && !app.isPublished)) return undefined;
    return app;
  }

  public async getApplicationById(id: string): Promise<Application | undefined> {
    if (this.isPg && this.pool) {
      const res = await this.pool.query('SELECT * FROM applications WHERE id = $1', [id]);
      return res.rows[0] ? this.mapAppFromPg(res.rows[0]) : undefined;
    }
    if (!this.jsonData) return undefined;
    return this.jsonData.applications.find(a => a.id === id);
  }

  public async getReleasesByAppId(appId: string): Promise<Release[]> {
    if (this.isPg && this.pool) {
      const res = await this.pool.query('SELECT * FROM releases WHERE app_id = $1 ORDER BY version_code DESC', [appId]);
      return res.rows.map(r => this.mapReleaseFromPg(r));
    }
    if (!this.jsonData) return [];
    return this.jsonData.releases.filter(r => r.appId === appId).sort((a, b) => b.versionCode - a.versionCode);
  }

  public async getCurrentRelease(appId: string): Promise<Release | undefined> {
    if (this.isPg && this.pool) {
      const res = await this.pool.query('SELECT * FROM releases WHERE app_id = $1 AND is_current = true LIMIT 1', [appId]);
      if (res.rows[0]) return this.mapReleaseFromPg(res.rows[0]);
      // Fallback to highest version
      const fallback = await this.pool.query('SELECT * FROM releases WHERE app_id = $1 ORDER BY version_code DESC LIMIT 1', [appId]);
      return fallback.rows[0] ? this.mapReleaseFromPg(fallback.rows[0]) : undefined;
    }
    if (!this.jsonData) return undefined;
    const current = this.jsonData.releases.find(r => r.appId === appId && r.isCurrent);
    if (current) return current;
    const appReleases = this.jsonData.releases.filter(r => r.appId === appId).sort((a, b) => b.versionCode - a.versionCode);
    return appReleases[0];
  }

  public async getReleaseById(id: string): Promise<Release | undefined> {
    if (this.isPg && this.pool) {
      const res = await this.pool.query('SELECT * FROM releases WHERE id = $1', [id]);
      return res.rows[0] ? this.mapReleaseFromPg(res.rows[0]) : undefined;
    }
    if (!this.jsonData) return undefined;
    return this.jsonData.releases.find(r => r.id === id);
  }

  public async getScreenshotsByAppId(appId: string): Promise<Screenshot[]> {
    if (this.isPg && this.pool) {
      const res = await this.pool.query('SELECT * FROM screenshots WHERE app_id = $1 ORDER BY order_index ASC', [appId]);
      return res.rows.map(r => ({
        id: r.id,
        appId: r.app_id,
        url: r.url,
        captionAr: r.caption_ar,
        captionEn: r.caption_en,
        orderIndex: r.order_index
      }));
    }
    if (!this.jsonData) return [];
    return this.jsonData.screenshots.filter(s => s.appId === appId).sort((a, b) => a.orderIndex - b.orderIndex);
  }

  public async getAdminByUsername(username: string): Promise<AdminUser | undefined> {
    if (this.isPg && this.pool) {
      const res = await this.pool.query('SELECT * FROM admins WHERE username = $1', [username]);
      return res.rows[0] ? this.mapAdminFromPg(res.rows[0]) : undefined;
    }
    if (!this.jsonData) return undefined;
    return this.jsonData.admins.find(a => a.username === username);
  }

  public async getAdminById(id: string): Promise<AdminUser | undefined> {
    if (this.isPg && this.pool) {
      const res = await this.pool.query('SELECT * FROM admins WHERE id = $1', [id]);
      return res.rows[0] ? this.mapAdminFromPg(res.rows[0]) : undefined;
    }
    if (!this.jsonData) return undefined;
    return this.jsonData.admins.find(a => a.id === id);
  }

  public async updateAdminPassword(adminId: string, newHash: string): Promise<boolean> {
    if (this.isPg && this.pool) {
      await this.pool.query('UPDATE admins SET password_hash = $1 WHERE id = $2', [newHash, adminId]);
      return true;
    }
    if (!this.jsonData) return false;
    const admin = this.jsonData.admins.find(a => a.id === adminId);
    if (admin) {
      admin.passwordHash = newHash;
      this.saveJson(this.jsonData);
      return true;
    }
    return false;
  }

  public async createSession(adminId: string): Promise<Session> {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
    const createdAt = new Date().toISOString();

    if (this.isPg && this.pool) {
      await this.pool.query(
        'INSERT INTO admin_sessions (token, admin_id, expires_at) VALUES ($1, $2, $3)',
        [token, adminId, expiresAt]
      );
    } else if (this.jsonData) {
      this.jsonData.sessions.push({ token, adminId, expiresAt, createdAt });
      this.saveJson(this.jsonData);
    }

    return { token, adminId, expiresAt, createdAt };
  }

  public async getSession(token: string): Promise<Session | undefined> {
    if (this.isPg && this.pool) {
      const res = await this.pool.query('SELECT * FROM admin_sessions WHERE token = $1 AND expires_at > $2', [token, Date.now()]);
      return res.rows[0] ? {
        token: res.rows[0].token,
        adminId: res.rows[0].admin_id,
        expiresAt: parseInt(res.rows[0].expires_at, 10),
        createdAt: res.rows[0].created_at
      } : undefined;
    }
    if (!this.jsonData) return undefined;
    const session = this.jsonData.sessions.find(s => s.token === token);
    if (!session || session.expiresAt < Date.now()) return undefined;
    return session;
  }

  public async deleteSession(token: string): Promise<void> {
    if (this.isPg && this.pool) {
      await this.pool.query('DELETE FROM admin_sessions WHERE token = $1', [token]);
    } else if (this.jsonData) {
      this.jsonData.sessions = this.jsonData.sessions.filter(s => s.token !== token);
      this.saveJson(this.jsonData);
    }
  }

  public async logActivity(action: string, targetType: string, targetId: string | undefined, details: string, actor: string): Promise<void> {
    const id = 'log_' + crypto.randomBytes(8).toString('hex');
    const timestamp = new Date().toISOString();

    if (this.isPg && this.pool) {
      await this.pool.query(
        'INSERT INTO activity_logs (id, action, target_type, target_id, details, admin_username) VALUES ($1, $2, $3, $4, $5, $6)',
        [id, action, targetType, targetId || null, details, actor]
      );
    } else if (this.jsonData) {
      this.jsonData.activityLogs.unshift({
        id,
        action,
        targetType,
        targetId,
        details,
        adminUsername: actor,
        timestamp
      });
      if (this.jsonData.activityLogs.length > 200) {
        this.jsonData.activityLogs = this.jsonData.activityLogs.slice(0, 200);
      }
      this.saveJson(this.jsonData);
    }
  }

  public async getActivityLogs(limit: number = 50): Promise<ActivityLog[]> {
    if (this.isPg && this.pool) {
      const res = await this.pool.query('SELECT * FROM activity_logs ORDER BY timestamp DESC LIMIT $1', [limit]);
      return res.rows.map(r => ({
        id: r.id,
        action: r.action,
        targetType: r.target_type,
        targetId: r.target_id,
        details: r.details,
        adminUsername: r.admin_username,
        timestamp: r.timestamp
      }));
    }
    if (!this.jsonData) return [];
    return this.jsonData.activityLogs.slice(0, limit);
  }

  public async createApplication(appData: Omit<Application, 'id' | 'createdAt' | 'updatedAt'>, actor: string): Promise<Application> {
    const id = 'app_' + crypto.randomBytes(6).toString('hex');
    const now = new Date().toISOString();
    const newApp: Application = {
      ...appData,
      id,
      createdAt: now,
      updatedAt: now
    };

    if (this.isPg && this.pool) {
      await this.pool.query(
        `INSERT INTO applications (id, slug, name_ar, name_en, short_desc_ar, short_desc_en, full_desc_ar, full_desc_en, features_ar, features_en, category, min_android, package_name, icon_url, banner_url, privacy_url, terms_url, copyright, is_published, featured)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)`,
        [
          newApp.id, newApp.slug, newApp.nameAr, newApp.nameEn, newApp.shortDescAr, newApp.shortDescEn,
          newApp.fullDescAr, newApp.fullDescEn, newApp.featuresAr, newApp.featuresEn, newApp.category,
          newApp.minAndroid, newApp.packageName, newApp.iconUrl, newApp.bannerUrl, newApp.privacyUrl,
          newApp.termsUrl, newApp.copyright, newApp.isPublished, newApp.featured
        ]
      );
    } else if (this.jsonData) {
      this.jsonData.applications.unshift(newApp);
      this.saveJson(this.jsonData);
    }

    await this.logActivity('CREATE_APPLICATION', 'APPLICATION', id, `تم إنشـاء تطبيق جديد (${newApp.nameEn})`, actor);
    return newApp;
  }

  public async updateApplication(id: string, updates: Partial<Application>, actor: string): Promise<Application | undefined> {
    const app = await this.getApplicationById(id);
    if (!app) return undefined;

    const updated: Application = {
      ...app,
      ...updates,
      id,
      updatedAt: new Date().toISOString()
    };

    if (this.isPg && this.pool) {
      await this.pool.query(
        `UPDATE applications SET slug = $1, name_ar = $2, name_en = $3, short_desc_ar = $4, short_desc_en = $5, full_desc_ar = $6, full_desc_en = $7, features_ar = $8, features_en = $9, category = $10, min_android = $11, package_name = $12, icon_url = $13, banner_url = $14, privacy_url = $15, terms_url = $16, copyright = $17, is_published = $18, featured = $19, updated_at = $20 WHERE id = $21`,
        [
          updated.slug, updated.nameAr, updated.nameEn, updated.shortDescAr, updated.shortDescEn,
          updated.fullDescAr, updated.fullDescEn, updated.featuresAr, updated.featuresEn, updated.category,
          updated.minAndroid, updated.packageName, updated.iconUrl, updated.bannerUrl, updated.privacyUrl,
          updated.termsUrl, updated.copyright, updated.isPublished, updated.featured, updated.updatedAt, id
        ]
      );
    } else if (this.jsonData) {
      const idx = this.jsonData.applications.findIndex(a => a.id === id);
      if (idx !== -1) {
        this.jsonData.applications[idx] = updated;
        this.saveJson(this.jsonData);
      }
    }

    await this.logActivity('UPDATE_APPLICATION', 'APPLICATION', id, `تم تحديث تطبيق (${updated.nameEn})`, actor);
    return updated;
  }

  public async deleteApplication(id: string, actor: string): Promise<boolean> {
    const app = await this.getApplicationById(id);
    if (!app) return false;

    if (this.isPg && this.pool) {
      await this.pool.query('DELETE FROM applications WHERE id = $1', [id]);
    } else if (this.jsonData) {
      this.jsonData.applications = this.jsonData.applications.filter(a => a.id !== id);
      this.jsonData.releases = this.jsonData.releases.filter(r => r.appId !== id);
      this.saveJson(this.jsonData);
    }

    await this.logActivity('DELETE_APPLICATION', 'APPLICATION', id, `تم حذف تطبيق (${app.nameEn})`, actor);
    return true;
  }

  public async togglePublish(id: string, actor: string): Promise<Application | undefined> {
    const app = await this.getApplicationById(id);
    if (!app) return undefined;
    const newStatus = !app.isPublished;
    return await this.updateApplication(id, { isPublished: newStatus }, actor);
  }

  public async createRelease(releaseData: Omit<Release, 'id' | 'createdAt'>, actor: string): Promise<Release> {
    const id = 'rel_' + crypto.randomBytes(6).toString('hex');
    const now = new Date().toISOString();
    const finalDownloadUrl = (releaseData.apkDownloadUrl && !releaseData.apkDownloadUrl.includes('rel_tmp'))
      ? releaseData.apkDownloadUrl
      : `/api/download/${id}`;

    const newRelease: Release = {
      ...releaseData,
      id,
      apkDownloadUrl: finalDownloadUrl,
      createdAt: now
    };

    if (newRelease.isCurrent) {
      // Unset other current releases for this appId
      if (this.isPg && this.pool) {
        await this.pool.query('UPDATE releases SET is_current = false WHERE app_id = $1', [newRelease.appId]);
      } else if (this.jsonData) {
        this.jsonData.releases.forEach(r => {
          if (r.appId === newRelease.appId) r.isCurrent = false;
        });
      }
    }

    if (this.isPg && this.pool) {
      await this.pool.query(
        `INSERT INTO releases (id, app_id, version_name, version_code, apk_file_name, apk_download_url, apk_size, apk_size_bytes, sha256, min_android, release_notes_ar, release_notes_en, is_current, release_date)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
        [
          newRelease.id, newRelease.appId, newRelease.versionName, newRelease.versionCode,
          newRelease.apkFileName, newRelease.apkDownloadUrl, newRelease.apkSize, newRelease.apkSizeBytes,
          newRelease.sha256, newRelease.minAndroid, newRelease.releaseNotesAr, newRelease.releaseNotesEn,
          newRelease.isCurrent, newRelease.releaseDate
        ]
      );
    } else if (this.jsonData) {
      this.jsonData.releases.unshift(newRelease);
      this.saveJson(this.jsonData);
    }

    await this.logActivity('CREATE_RELEASE', 'RELEASE', id, `تم إصدار نسخة جديدة (${newRelease.versionName})`, actor);
    return newRelease;
  }

  public async deleteRelease(id: string, actor: string): Promise<boolean> {
    const release = await this.getReleaseById(id);
    if (!release) return false;

    if (this.isPg && this.pool) {
      await this.pool.query('DELETE FROM releases WHERE id = $1', [id]);
    } else if (this.jsonData) {
      this.jsonData.releases = this.jsonData.releases.filter(r => r.id !== id);
      this.saveJson(this.jsonData);
    }

    await this.logActivity('DELETE_RELEASE', 'RELEASE', id, `تم حذف الإصدار (${release.versionName})`, actor);
    return true;
  }

  public async getStats(): Promise<{ totalApps: number; totalReleases: number; totalDownloads: number; storageDriver: string }> {
    const apps = await this.getApplications(false);
    let releasesCount = 0;
    if (this.isPg && this.pool) {
      const res = await this.pool.query('SELECT COUNT(*) FROM releases');
      releasesCount = parseInt(res.rows[0].count, 10);
    } else if (this.jsonData) {
      releasesCount = this.jsonData.releases.length;
    }

    return {
      totalApps: apps.length,
      totalReleases: releasesCount,
      totalDownloads: 1420,
      storageDriver: STORAGE_DRIVER
    };
  }

  private mapAppFromPg(r: any): Application {
    return {
      id: r.id,
      slug: r.slug,
      nameAr: r.name_ar,
      nameEn: r.name_en,
      shortDescAr: r.short_desc_ar,
      shortDescEn: r.short_desc_en,
      fullDescAr: r.full_desc_ar,
      fullDescEn: r.full_desc_en,
      featuresAr: r.features_ar || [],
      featuresEn: r.features_en || [],
      category: r.category,
      minAndroid: r.min_android,
      packageName: r.package_name,
      iconUrl: r.icon_url,
      bannerUrl: r.banner_url,
      privacyUrl: r.privacy_url,
      termsUrl: r.terms_url,
      copyright: r.copyright,
      isPublished: r.is_published,
      featured: r.featured,
      createdAt: r.created_at,
      updatedAt: r.updated_at
    };
  }

  private mapReleaseFromPg(r: any): Release {
    return {
      id: r.id,
      appId: r.app_id,
      versionName: r.version_name,
      versionCode: r.version_code,
      apkFileName: r.apk_file_name,
      apkDownloadUrl: r.apk_download_url,
      apkSize: r.apk_size,
      apkSizeBytes: parseInt(r.apk_size_bytes, 10),
      sha256: r.sha256,
      minAndroid: r.min_android,
      releaseNotesAr: r.release_notes_ar,
      releaseNotesEn: r.release_notes_en,
      isCurrent: r.is_current,
      releaseDate: r.release_date,
      createdAt: r.created_at
    };
  }

  private mapAdminFromPg(r: any): AdminUser {
    return {
      id: r.id,
      username: r.username,
      email: r.email,
      passwordHash: r.password_hash,
      createdAt: r.created_at
    };
  }
}

export const db = new PostgresOrJsonDatabase();
