import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import AdmZip from 'adm-zip';
import pkg from 'pg';
const { Pool } = pkg;
import { Application, Release, Screenshot, AdminUser, Session, ActivityLog, Product, ProductFile, Media, User, UserSession, Favorite, Review, Download, Entitlement, AIProject, AIAsset, AIDocument, AIProviderConfig, AIModelConfig, AIUserKeyConfig, AISettings, AIUsageStats } from '../types.ts';
import { LocalDiskArtifactStorage, GitHubReleaseArtifactStorage, IArtifactStorage, getArtifactStorage } from './storage/index.ts';
import { encrypt, decrypt } from './ai/utils/encryption.ts';

export interface DatabaseSchema {
  applications: Application[]; // Backward compatibility
  products: Product[];
  productFiles: ProductFile[];
  releases: Release[]; // Backward compatibility
  screenshots: Screenshot[]; // Backward compatibility
  media: Media[];
  admins: AdminUser[];
  sessions: Session[];
  activityLogs: ActivityLog[];
  users?: User[];
  userSessions?: UserSession[];
  favorites?: Favorite[];
  reviews?: Review[];
  downloads?: Download[];
  entitlements?: Entitlement[];
  aiProjects?: AIProject[];
  aiAssets?: AIAsset[];
  aiDocuments?: AIDocument[];
  aiProviders?: AIProviderConfig[];
  aiModels?: AIModelConfig[];
  aiUserKeys?: AIUserKeyConfig[];
  aiSettings?: AISettings[];
  aiUsages?: any[];
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

export const artifactStorage: IArtifactStorage = getArtifactStorage();

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

export function normalizeAssetUrl(url: string | null | undefined): string {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return '/assets/images/kayan_pdf_icon.jpg';
  }
  const trimmed = url.trim();
  if (trimmed.includes('kayan_pdf_icon')) {
    return '/assets/images/kayan_pdf_icon.jpg';
  }
  if (trimmed.includes('kayan_pdf_feature_banner')) {
    return '/assets/images/kayan_pdf_feature_banner.jpg';
  }
  if (trimmed.includes('kayan_store_logo')) {
    return '/assets/images/kayan_store_logo.jpg';
  }
  if (trimmed.includes('kayan_store_hero_tech')) {
    return '/assets/images/kayan_store_hero_tech.jpg';
  }
  if (trimmed.startsWith('/src/assets/images/')) {
    return trimmed.replace('/src/assets/images/', '/assets/images/');
  }
  if (trimmed.startsWith('/src/assets/')) {
    return trimmed.replace('/src/assets/', '/assets/');
  }
  return trimmed;
}

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
  iconUrl: '/assets/images/kayan_pdf_icon.jpg',
  bannerUrl: '/assets/images/kayan_pdf_feature_banner.jpg',
  privacyUrl: '/privacy',
  termsUrl: '/terms',
  copyright: '© 2026 المهندس جهاد الصليحي. جميع الحقوق محفوظة.',
  isPublished: true,
  featured: true,
  createdAt: new Date('2026-09-01T10:00:00Z').toISOString(),
  updatedAt: new Date().toISOString()
};

export const defaultProducts: Product[] = [
  {
    id: 'prod_kayan_pdf',
    slug: 'kayan-pdf',
    type: 'android_app',
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
      'معالجة محلية 100% بدون إنترنت وبأمان مطلق'
    ],
    featuresEn: [
      'Convert photos and galleries to high-resolution PDF documents',
      'Camera document scanner with edge correction & contrast tuning',
      'Efficient PDF compression with minimal quality loss',
      'Merge multiple PDF documents into a single ordered file',
      '100% offline local on-device processing'
    ],
    category: 'Tools & Documents',
    author: 'المهندس جهاد الصليحي',
    publisher: 'كيان سوفت',
    versionName: '1.0.0',
    versionCode: 1,
    packageName: 'com.kayansoft.kayanpdf',
    minAndroid: '7.0 / API 24',
    sha256: 'e60f28c7f373391ecddecd902fb20b24b745dcb51ebc21926f90d55d56533',
    price: 0,
    currency: 'USD',
    tags: ['PDF', 'Tools', 'Scanner', 'Android'],
    license: 'مجاني للاستخدام الشخصي والتجاري',
    isPublished: true,
    featured: true,
    status: 'published',
    iconUrl: '/assets/images/kayan_pdf_icon.jpg',
    coverUrl: '/assets/images/kayan_pdf_feature_banner.jpg',
    bannerUrl: '/assets/images/kayan_pdf_feature_banner.jpg',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    videoTitle: 'العرض التقديمي لتطبيق كيان PDF',
    createdAt: new Date('2026-09-01T10:00:00Z').toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod_kayan_office',
    slug: 'kayan-office',
    type: 'desktop_software',
    nameAr: 'حزمة كيان أوفيس المكتبية',
    nameEn: 'Kayan Office Desktop Suite',
    shortDescAr: 'برمجيات سطح مكتب متقدمة لإدارة وتنسيق وطباعة المستندات المكتبية بكفاءة عالية وسرعة فائقة.',
    shortDescEn: 'Advanced professional desktop suite for formatting, batch converting, and archiving office documents locally.',
    fullDescAr: 'حزمة مكتبية متكاملة لبيئة سطح المكتب تتيح للمستخدمين والمؤسسات معالجة وتحويل المستندات النصية وجداول البيانات والعروض التقديمية دون الحاجة إلى اتصال بالسحابة.',
    fullDescEn: 'Complete enterprise-grade desktop productivity suite engineered for offline batch document processing, secure PDF conversion, and document signing.',
    featuresAr: [
      'معالجة فائقة السرعة للمستندات الضخمة',
      'تحويل دفعي لمئات المستندات بنقرة واحدة',
      'تصدير معتمد لمعايير PDF/A للأرشفة طويلة المدى',
      'تشفير المستندات وتوقيعها رقمياً'
    ],
    featuresEn: [
      'Blazing fast processing of large enterprise documents',
      'One-click batch conversion for hundreds of files',
      'ISO-certified PDF/A long-term archiving export',
      'Local cryptographic signing and document encryption'
    ],
    category: 'Productivity',
    author: 'فريق تطوير كيان سوفت',
    publisher: 'كيان سوفت',
    versionName: '2.1.0',
    versionCode: 21,
    sha256: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
    price: 0,
    currency: 'USD',
    tags: ['Desktop', 'Office', 'Productivity', 'Windows', 'Mac'],
    license: 'ترخيص مجاني كامل',
    isPublished: true,
    featured: true,
    status: 'published',
    iconUrl: '/assets/images/kayan_store_logo.jpg',
    coverUrl: '/assets/images/kayan_store_hero_tech.jpg',
    bannerUrl: '/assets/images/kayan_store_hero_tech.jpg',
    createdAt: new Date('2026-09-15T12:00:00Z').toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod_digital_doc_guide',
    slug: 'digital-document-guide',
    type: 'ebook',
    nameAr: 'دليل المستندات الرقمية والأمان السيبراني',
    nameEn: 'Practical Guide to Digital Documents & Privacy',
    shortDescAr: 'كتاب إلكتروني شامل حول أفضل ممارسات إدارة المستندات الرقمية وحمايتها من التتبع والتسريب.',
    shortDescEn: 'Comprehensive practical handbook on offline document security, metadata sanitation, and long-term archiving.',
    fullDescAr: 'دليل عملي مفصل موجه للكتّاب، المحامين، والمهندسين والمديرين، يوضح كيفية التعامل مع المستندات الحساسة وحذف البيانات الوصفية الخفية والتحويل الآمن للملفات.',
    fullDescEn: 'A practical, in-depth guide covering metadata removal, PDF structure, secure digital signing, and maintaining 100% confidentiality in digital workflows.',
    featuresAr: [
      'شرح مفصل لبنية ملفات PDF وتشفيرها',
      'طرق تطهير البيانات الوصفية (Metadata Sanitation)',
      'معايير التوقيع الإلكتروني والقانوني',
      'نماذج عملية قابلة للتطبيق الفوري'
    ],
    featuresEn: [
      'Detailed overview of PDF internal architecture and encryption',
      'Techniques for zero-leakage metadata sanitation',
      'Electronic and legal digital signature standards',
      'Includes practical templates and checklist'
    ],
    category: 'Ebooks & Guides',
    author: 'المهندس جهاد الصليحي',
    publisher: 'دار كيان للنشر التقني',
    pages: 148,
    language: 'العربية / English',
    isbn: '978-999-0123-45-6',
    price: 0,
    currency: 'USD',
    tags: ['Ebook', 'Security', 'PDF', 'Guide', 'Privacy'],
    license: 'رخصة المشاع الإبداعي CC-BY-NC',
    isPublished: true,
    featured: true,
    status: 'published',
    iconUrl: '/assets/images/kayan_pdf_icon.jpg',
    coverUrl: '/assets/images/kayan_pdf_feature_banner.jpg',
    bannerUrl: '/assets/images/kayan_pdf_feature_banner.jpg',
    createdAt: new Date('2026-09-20T08:00:00Z').toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export const defaultProviders: AIProviderConfig[] = [
  {
    id: 'gemini',
    name: 'gemini',
    displayName: 'Google Gemini',
    status: 'LIVE',
    type: 'GEMINI',
    createdAt: new Date('2026-09-01T10:00:00Z').toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'openai',
    name: 'openai',
    displayName: 'OpenAI',
    status: 'LIVE',
    type: 'OPENAI',
    createdAt: new Date('2026-09-01T10:00:00Z').toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'anthropic',
    name: 'anthropic',
    displayName: 'Anthropic',
    status: 'NOT_CONFIGURED',
    type: 'ANTHROPIC',
    createdAt: new Date('2026-09-01T10:00:00Z').toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'openrouter',
    name: 'openrouter',
    displayName: 'OpenRouter',
    status: 'NOT_CONFIGURED',
    type: 'OPENROUTER',
    createdAt: new Date('2026-09-01T10:00:00Z').toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export const defaultModels: AIModelConfig[] = [
  {
    id: 'model_gemini_38_flash',
    providerId: 'gemini',
    modelId: 'gemini-3.8-flash',
    displayNameAr: 'جيميني 3.8 فلاش (ذكي ومتعدد المهام)',
    displayNameEn: 'Gemini 3.8 Flash (Smart & Multimodal)',
    active: true,
    defaultForCapability: 'TEXT',
    priority: 10,
    capabilities: [
      'TEXT', 'VISION', 'CODE', 'SCREENSHOT_TO_CODE', 'DOCUMENT_ANALYSIS',
      'IMAGE_TO_PROMPT', 'UI_ANALYSIS', 'APP_REQUIREMENTS', 'APP_ARCHITECTURE',
      'APP_PIR', 'APP_DATABASE', 'APP_BACKEND', 'APP_FRONTEND', 'APP_TESTS'
    ],
    pricingClass: 'FREE',
    freeTierStatus: 'FREE',
    maxContext: 1048576,
    createdAt: new Date('2026-09-01T10:00:00Z').toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'model_gemini_35_flash_lite',
    providerId: 'gemini',
    modelId: 'gemini-3.5-flash-lite',
    displayNameAr: 'جيميني 3.5 لايت (سرعة فائقة وخفيف)',
    displayNameEn: 'Gemini 3.5 Flash Lite (Ultra-fast & Lightweight)',
    active: true,
    priority: 5,
    capabilities: ['TEXT', 'VISION', 'CODE', 'DOCUMENT_ANALYSIS'],
    pricingClass: 'FREE',
    freeTierStatus: 'FREE',
    maxContext: 1048576,
    createdAt: new Date('2026-09-01T10:00:00Z').toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'model_gemini_31_flash_image',
    providerId: 'gemini',
    modelId: 'gemini-3.1-flash-image',
    displayNameAr: 'جيميني 3.1 إيماج (توليد صور فائق الدقة)',
    displayNameEn: 'Gemini 3.1 Flash Image (High Resolution Image Gen)',
    active: true,
    defaultForCapability: 'IMAGE_GENERATION',
    priority: 10,
    capabilities: ['IMAGE_GENERATION'],
    pricingClass: 'FREE',
    freeTierStatus: 'FREE',
    maxContext: 32768,
    createdAt: new Date('2026-09-01T10:00:00Z').toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'model_gemini_31_flash_lite_image',
    providerId: 'gemini',
    modelId: 'gemini-3.1-flash-lite-image',
    displayNameAr: 'جيميني 3.1 إيماج لايت (توليد صور سريع)',
    displayNameEn: 'Gemini 3.1 Flash Lite Image (Fast Image Gen)',
    active: true,
    priority: 5,
    capabilities: ['IMAGE_GENERATION'],
    pricingClass: 'FREE',
    freeTierStatus: 'FREE',
    maxContext: 32768,
    createdAt: new Date('2026-09-01T10:00:00Z').toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'model_gemini_31_pro_preview',
    providerId: 'gemini',
    modelId: 'gemini-3.1-pro-preview',
    displayNameAr: 'جيميني 3.1 برو (مطور للمهام المعقدة والكود)',
    displayNameEn: 'Gemini 3.1 Pro Preview (Advanced Reasoning & Coding)',
    active: true,
    defaultForCapability: 'CODE',
    priority: 10,
    capabilities: ['TEXT', 'VISION', 'CODE', 'DOCUMENT_ANALYSIS'],
    pricingClass: 'FREE',
    freeTierStatus: 'FREE',
    maxContext: 2097152,
    createdAt: new Date('2026-09-01T10:00:00Z').toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'model_openai_gpt4o',
    providerId: 'openai',
    modelId: 'gpt-4o',
    displayNameAr: 'جي بي تي 4o برو (تفكير عميق)',
    displayNameEn: 'GPT-4o Pro (Deep Reasoning & Multimodal)',
    active: true,
    priority: 5,
    capabilities: ['TEXT', 'VISION', 'CODE', 'DOCUMENT_ANALYSIS'],
    pricingClass: 'PAID',
    freeTierStatus: 'PAID',
    maxContext: 128000,
    createdAt: new Date('2026-09-01T10:00:00Z').toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'model_openai_gpt4o_mini',
    providerId: 'openai',
    modelId: 'gpt-4o-mini',
    displayNameAr: 'جي بي تي 4o ميني (اقتصادي سريع)',
    displayNameEn: 'GPT-4o Mini (Cost-efficient & Smart)',
    active: true,
    priority: 8,
    capabilities: ['TEXT', 'VISION', 'CODE', 'DOCUMENT_ANALYSIS'],
    pricingClass: 'PAID',
    freeTierStatus: 'PAID',
    maxContext: 128000,
    createdAt: new Date('2026-09-01T10:00:00Z').toISOString(),
    updatedAt: new Date().toISOString()
  }
];

/**
 * Database wrapper supporting PostgreSQL (when DATABASE_URL is present) or JSON file.
 */
class PostgresOrJsonDatabase {
  private pool: pkg.Pool | null = null;
  private jsonData: DatabaseSchema | null = null;
  private isPg: boolean = false;
  private initialized: boolean = false;

  public isInitialized(): boolean { return this.initialized; }

  private getJsonData(): DatabaseSchema {
    if (!this.jsonData) {
      this.jsonData = this.loadJson();
    }
    if (!this.jsonData.users) this.jsonData.users = [];
    if (!this.jsonData.userSessions) this.jsonData.userSessions = [];
    if (!this.jsonData.favorites) this.jsonData.favorites = [];
    if (!this.jsonData.reviews) this.jsonData.reviews = [];
    if (!this.jsonData.downloads) this.jsonData.downloads = [];
    if (!this.jsonData.entitlements) this.jsonData.entitlements = [];
    if (!this.jsonData.aiProjects) this.jsonData.aiProjects = [];
    if (!this.jsonData.aiAssets) this.jsonData.aiAssets = [];
    if (!this.jsonData.aiDocuments) this.jsonData.aiDocuments = [];

    if (!this.jsonData.aiProviders || this.jsonData.aiProviders.length === 0) {
      this.jsonData.aiProviders = [...defaultProviders];
    }
    if (!this.jsonData.aiModels || this.jsonData.aiModels.length === 0) {
      this.jsonData.aiModels = [...defaultModels];
    }
    if (!this.jsonData.aiUserKeys) {
      this.jsonData.aiUserKeys = [];
    }
    if (!this.jsonData.aiSettings || this.jsonData.aiSettings.length === 0) {
      this.jsonData.aiSettings = [{ id: 'default_settings', routingMode: 'AUTO', allowPaidFallback: false, maxRetryAttempts: 3, updatedAt: new Date().toISOString() }];
    }
    if (!this.jsonData.aiUsages) {
      this.jsonData.aiUsages = [];
    }

    return this.jsonData;
  }

  constructor() {
    if (DATABASE_URL && (IS_PROD || process.env.FORCE_POSTGRES === 'true')) {
      this.isPg = true;
      this.pool = new Pool({
        connectionString: DATABASE_URL,
        ssl: DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
      });
    } else {
      this.jsonData = this.loadJson();
      this.syncAdminEnvCredentialsJson();
    }
  }

  public async initialize(): Promise<void> {
    if (this.isPg && this.pool) {
      await this.initPgTables();
    } else if (!this.jsonData) {
      this.jsonData = this.loadJson();
      this.syncAdminEnvCredentialsJson();
    }
    this.initialized = true;
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

        CREATE TABLE IF NOT EXISTS products (
          id VARCHAR(64) PRIMARY KEY,
          slug VARCHAR(128) UNIQUE NOT NULL,
          type VARCHAR(64) NOT NULL,
          name_ar VARCHAR(255) NOT NULL,
          name_en VARCHAR(255) NOT NULL,
          short_desc_ar TEXT NOT NULL,
          short_desc_en TEXT NOT NULL,
          full_desc_ar TEXT NOT NULL,
          full_desc_en TEXT NOT NULL,
          features_ar TEXT[] NOT NULL,
          features_en TEXT[] NOT NULL,
          category VARCHAR(128) NOT NULL,
          author VARCHAR(255) NOT NULL,
          price NUMERIC(10, 2) DEFAULT 0,
          currency VARCHAR(10) DEFAULT 'USD',
          tags TEXT[] DEFAULT '{}',
          license TEXT,
          is_published BOOLEAN NOT NULL DEFAULT FALSE,
          status VARCHAR(32) NOT NULL DEFAULT 'published',
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS product_files (
          id VARCHAR(64) PRIMARY KEY,
          product_id VARCHAR(64) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
          file_url TEXT NOT NULL,
          title TEXT NOT NULL,
          size VARCHAR(64) NOT NULL,
          size_bytes BIGINT NOT NULL,
          is_main BOOLEAN NOT NULL DEFAULT FALSE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
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

        CREATE TABLE IF NOT EXISTS media (
          id VARCHAR(64) PRIMARY KEY,
          app_id VARCHAR(64) REFERENCES applications(id) ON DELETE CASCADE,
          product_id VARCHAR(64) REFERENCES products(id) ON DELETE CASCADE,
          media_type VARCHAR(64) NOT NULL,
          file_url TEXT,
          thumbnail_url TEXT,
          external_url TEXT,
          title_ar TEXT,
          title_en TEXT,
          alt_ar TEXT,
          alt_en TEXT,
          sort_order INT NOT NULL DEFAULT 0,
          is_published BOOLEAN NOT NULL DEFAULT TRUE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          CONSTRAINT check_media_owner CHECK (
            (app_id IS NOT NULL AND product_id IS NULL)
            OR
            (app_id IS NULL AND product_id IS NOT NULL)
          )
        );

        CREATE TABLE IF NOT EXISTS users (
          id VARCHAR(64) PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          display_name VARCHAR(128) NOT NULL,
          avatar_url TEXT,
          locale VARCHAR(16) NOT NULL DEFAULT 'ar',
          status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
          email_verified BOOLEAN NOT NULL DEFAULT FALSE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          last_login_at TIMESTAMPTZ
        );

        CREATE TABLE IF NOT EXISTS user_sessions (
          id VARCHAR(64) PRIMARY KEY,
          user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          token_hash VARCHAR(255) NOT NULL,
          expires_at TIMESTAMPTZ NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          last_used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          user_agent TEXT,
          ip_address VARCHAR(64)
        );

        CREATE TABLE IF NOT EXISTS favorites (
          id VARCHAR(64) PRIMARY KEY,
          user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          product_id VARCHAR(64) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          CONSTRAINT unique_user_product_favorite UNIQUE(user_id, product_id)
        );

        CREATE TABLE IF NOT EXISTS reviews (
          id VARCHAR(64) PRIMARY KEY,
          user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          product_id VARCHAR(64) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
          rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
          title VARCHAR(255),
          body TEXT NOT NULL,
          status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          CONSTRAINT unique_user_product_review UNIQUE(user_id, product_id)
        );

        CREATE TABLE IF NOT EXISTS downloads (
          id VARCHAR(64) PRIMARY KEY,
          user_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
          product_id VARCHAR(64) REFERENCES products(id) ON DELETE SET NULL,
          release_id VARCHAR(64) REFERENCES releases(id) ON DELETE SET NULL,
          product_file_id VARCHAR(64) REFERENCES product_files(id) ON DELETE SET NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          ip_address VARCHAR(64),
          user_agent TEXT,
          status VARCHAR(32) NOT NULL DEFAULT 'COMPLETED'
        );

        CREATE TABLE IF NOT EXISTS entitlements (
          id VARCHAR(64) PRIMARY KEY,
          user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          product_id VARCHAR(64) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
          source VARCHAR(64) NOT NULL DEFAULT 'FREE',
          order_id VARCHAR(64),
          granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          expires_at TIMESTAMPTZ,
          status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
          CONSTRAINT unique_user_product_entitlement UNIQUE(user_id, product_id)
        );

        CREATE TABLE IF NOT EXISTS ai_projects (
          id VARCHAR(64) PRIMARY KEY,
          user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          type VARCHAR(64) NOT NULL DEFAULT 'GENERAL',
          status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS ai_assets (
          id VARCHAR(64) PRIMARY KEY,
          project_id VARCHAR(64) NOT NULL REFERENCES ai_projects(id) ON DELETE CASCADE,
          user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          type VARCHAR(64) NOT NULL DEFAULT 'OTHER',
          name VARCHAR(255) NOT NULL,
          storage_key TEXT NOT NULL,
          mime_type VARCHAR(128) NOT NULL,
          size_bytes BIGINT NOT NULL DEFAULT 0,
          sha256 VARCHAR(128),
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS ai_documents (
          id VARCHAR(64) PRIMARY KEY,
          user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          project_id VARCHAR(64) REFERENCES ai_projects(id) ON DELETE CASCADE,
          original_file_name VARCHAR(255) NOT NULL,
          storage_key TEXT NOT NULL,
          mime_type VARCHAR(128) NOT NULL,
          file_extension VARCHAR(32) NOT NULL,
          size_bytes BIGINT NOT NULL DEFAULT 0,
          sha256 VARCHAR(128),
          document_type VARCHAR(64) NOT NULL DEFAULT 'other',
          status VARCHAR(32) NOT NULL DEFAULT 'UPLOADED',
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_ai_documents_user_id ON ai_documents(user_id);
        CREATE INDEX IF NOT EXISTS idx_ai_documents_project_id ON ai_documents(project_id);

        -- Column safety migrations
        ALTER TABLE products ADD COLUMN IF NOT EXISTS author VARCHAR(255) NOT NULL DEFAULT '';
        ALTER TABLE products ADD COLUMN IF NOT EXISTS publisher VARCHAR(255) DEFAULT '';
        ALTER TABLE products ADD COLUMN IF NOT EXISTS pages INT DEFAULT 0;
        ALTER TABLE products ADD COLUMN IF NOT EXISTS language VARCHAR(32) DEFAULT '';
        ALTER TABLE products ADD COLUMN IF NOT EXISTS isbn VARCHAR(64) DEFAULT '';
        ALTER TABLE products ADD COLUMN IF NOT EXISTS version_name VARCHAR(64) DEFAULT '';
        ALTER TABLE products ADD COLUMN IF NOT EXISTS version_code INT DEFAULT 0;
        ALTER TABLE products ADD COLUMN IF NOT EXISTS package_name VARCHAR(255) DEFAULT '';
        ALTER TABLE products ADD COLUMN IF NOT EXISTS min_android VARCHAR(64) DEFAULT '';
        ALTER TABLE products ADD COLUMN IF NOT EXISTS release_notes_ar TEXT DEFAULT '';
        ALTER TABLE products ADD COLUMN IF NOT EXISTS release_notes_en TEXT DEFAULT '';
        ALTER TABLE products ADD COLUMN IF NOT EXISTS sha256 VARCHAR(128) DEFAULT '';
        ALTER TABLE products ADD COLUMN IF NOT EXISTS featured BOOLEAN NOT NULL DEFAULT FALSE;
        ALTER TABLE products ADD COLUMN IF NOT EXISTS icon_url TEXT;
        ALTER TABLE products ADD COLUMN IF NOT EXISTS cover_url TEXT;
        ALTER TABLE products ADD COLUMN IF NOT EXISTS banner_url TEXT;
        ALTER TABLE products ADD COLUMN IF NOT EXISTS video_url TEXT;
        ALTER TABLE products ADD COLUMN IF NOT EXISTS video_title TEXT;

        ALTER TABLE product_files ADD COLUMN IF NOT EXISTS file_type VARCHAR(64) NOT NULL DEFAULT 'MAIN';
        ALTER TABLE product_files ADD COLUMN IF NOT EXISTS original_name VARCHAR(255);
        ALTER TABLE product_files ADD COLUMN IF NOT EXISTS sha256 VARCHAR(128);

        -- Proper indexes for high-performance querying
        CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
        CREATE INDEX IF NOT EXISTS idx_products_published ON products(is_published);
        CREATE INDEX IF NOT EXISTS idx_products_type ON products(type);
        CREATE INDEX IF NOT EXISTS idx_product_files_product_id ON product_files(product_id);
        CREATE INDEX IF NOT EXISTS idx_media_product_id ON media(product_id);
        CREATE INDEX IF NOT EXISTS idx_media_app_id ON media(app_id);
        CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
        CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
        CREATE INDEX IF NOT EXISTS idx_favorites_user_product ON favorites(user_id, product_id);
        CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);
        CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
        CREATE INDEX IF NOT EXISTS idx_downloads_user_id ON downloads(user_id);
        CREATE INDEX IF NOT EXISTS idx_downloads_product_id ON downloads(product_id);
        CREATE INDEX IF NOT EXISTS idx_entitlements_user_product ON entitlements(user_id, product_id);
        CREATE INDEX IF NOT EXISTS idx_ai_projects_user_id ON ai_projects(user_id);
        CREATE INDEX IF NOT EXISTS idx_ai_assets_project_id ON ai_assets(project_id);

        CREATE TABLE IF NOT EXISTS ai_providers (
          id VARCHAR(64) PRIMARY KEY,
          name VARCHAR(128) NOT NULL,
          display_name VARCHAR(128) NOT NULL,
          status VARCHAR(64) NOT NULL DEFAULT 'NOT_CONFIGURED',
          type VARCHAR(64) NOT NULL DEFAULT 'GEMINI',
          base_url TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS ai_models (
          id VARCHAR(64) PRIMARY KEY,
          provider_id VARCHAR(64) NOT NULL REFERENCES ai_providers(id) ON DELETE CASCADE,
          model_id VARCHAR(128) NOT NULL,
          display_name_ar VARCHAR(255) NOT NULL,
          display_name_en VARCHAR(255) NOT NULL,
          active BOOLEAN NOT NULL DEFAULT TRUE,
          default_for_capability VARCHAR(64),
          priority INTEGER NOT NULL DEFAULT 0,
          capabilities TEXT[] NOT NULL DEFAULT '{}',
          pricing_class VARCHAR(64) NOT NULL DEFAULT 'FREE',
          free_tier_status VARCHAR(64) NOT NULL DEFAULT 'FREE',
          max_context INTEGER,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS ai_user_keys (
          id VARCHAR(64) PRIMARY KEY,
          user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          provider_id VARCHAR(64) NOT NULL REFERENCES ai_providers(id) ON DELETE CASCADE,
          encrypted_api_key TEXT NOT NULL,
          iv_hex VARCHAR(64) NOT NULL,
          tag_hex VARCHAR(64) NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          CONSTRAINT unique_user_provider_key UNIQUE(user_id, provider_id)
        );

        CREATE TABLE IF NOT EXISTS ai_settings (
          id VARCHAR(64) PRIMARY KEY,
          routing_mode VARCHAR(64) NOT NULL DEFAULT 'AUTO',
          allow_paid_fallback BOOLEAN NOT NULL DEFAULT FALSE,
          max_retry_attempts INTEGER NOT NULL DEFAULT 3,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS ai_usages (
          id VARCHAR(64) PRIMARY KEY,
          user_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
          project_id VARCHAR(64) REFERENCES ai_projects(id) ON DELETE SET NULL,
          job_id VARCHAR(64),
          provider VARCHAR(64) NOT NULL,
          model VARCHAR(128) NOT NULL,
          capability VARCHAR(64) NOT NULL,
          status VARCHAR(32) NOT NULL,
          retry_count INTEGER DEFAULT 0,
          fallback_used BOOLEAN DEFAULT FALSE,
          is_paid BOOLEAN DEFAULT FALSE,
          started_at TIMESTAMPTZ NOT NULL,
          completed_at TIMESTAMPTZ NOT NULL,
          duration_ms INTEGER,
          metadata JSONB,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_ai_user_keys_user ON ai_user_keys(user_id);
        CREATE INDEX IF NOT EXISTS idx_ai_usages_provider ON ai_usages(provider);
        CREATE INDEX IF NOT EXISTS idx_ai_usages_capability ON ai_usages(capability);
      `);

      // Seed AI Providers & Models in PG if empty
      const provCountRes = await this.pool.query('SELECT COUNT(*) FROM ai_providers');
      if (parseInt(provCountRes.rows[0].count, 10) === 0) {
        for (const p of defaultProviders) {
          await this.pool.query(
            `INSERT INTO ai_providers (id, name, display_name, status, type, base_url, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [p.id, p.name, p.displayName, p.status, p.type, p.baseUrl || null, p.createdAt, p.updatedAt]
          );
        }
      }

      const modelCountRes = await this.pool.query('SELECT COUNT(*) FROM ai_models');
      if (parseInt(modelCountRes.rows[0].count, 10) === 0) {
        for (const m of defaultModels) {
          await this.pool.query(
            `INSERT INTO ai_models (id, provider_id, model_id, display_name_ar, display_name_en, active, default_for_capability, priority, capabilities, pricing_class, free_tier_status, max_context, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
            [m.id, m.providerId, m.modelId, m.displayNameAr, m.displayNameEn, m.active, m.defaultForCapability || null, m.priority, m.capabilities, m.pricingClass, m.freeTierStatus, m.maxContext || null, m.createdAt, m.updatedAt]
          );
        }
      }

      const settingsCountRes = await this.pool.query('SELECT COUNT(*) FROM ai_settings');
      if (parseInt(settingsCountRes.rows[0].count, 10) === 0) {
        await this.pool.query(
          `INSERT INTO ai_settings (id, routing_mode, allow_paid_fallback, max_retry_attempts, updated_at)
           VALUES ($1, $2, $3, $4, NOW())`,
          ['default_settings', 'AUTO', false, 3]
        );
      }

      // Seed initial products if empty
      const prodCountRes = await this.pool.query('SELECT COUNT(*) FROM products');
      if (parseInt(prodCountRes.rows[0].count, 10) === 0) {
        for (const prod of defaultProducts) {
          await this.pool.query(
            `INSERT INTO products (id, slug, type, name_ar, name_en, short_desc_ar, short_desc_en, full_desc_ar, full_desc_en, features_ar, features_en, category, author, publisher, pages, language, isbn, version_name, version_code, package_name, min_android, release_notes_ar, release_notes_en, sha256, price, currency, tags, license, is_published, featured, status, icon_url, cover_url, banner_url, video_url, video_title)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36)`,
            [
              prod.id, prod.slug, prod.type, prod.nameAr, prod.nameEn,
              prod.shortDescAr, prod.shortDescEn, prod.fullDescAr, prod.fullDescEn,
              prod.featuresAr, prod.featuresEn, prod.category, prod.author,
              prod.publisher || '', prod.pages || 0, prod.language || '', prod.isbn || '',
              prod.versionName || '', prod.versionCode || 0, prod.packageName || '', prod.minAndroid || '',
              prod.releaseNotesAr || '', prod.releaseNotesEn || '', prod.sha256 || '',
              prod.price, prod.currency, prod.tags, prod.license,
              prod.isPublished, prod.featured !== false, prod.status,
              prod.iconUrl || '', prod.coverUrl || '', prod.bannerUrl || '',
              prod.videoUrl || '', prod.videoTitle || ''
            ]
          );
        }
      }

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

      const relRes = await this.pool.query('SELECT COUNT(*) FROM releases');
      if (parseInt(relRes.rows[0].count, 10) === 0) {
        await this.pool.query(
          `INSERT INTO releases (id, app_id, version_name, version_code, apk_file_name, apk_download_url, apk_size, apk_size_bytes, sha256, min_android, release_notes_ar, release_notes_en, is_current, release_date)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
          [
            'rel_kayan_pdf_v1_0_0', defaultAppData.id, '1.0.0', 1, 'KayanPDF-v1.0.0.apk',
            'https://github.com/gehadrok/kayan-store/releases/download/v1.0.0/KayanPDF-v1.0.0.apk',
            '13.4 MB', 14036833, 'e60f28c7f373391ecddecd902fb20b24b745dcb51ebc21926f90d55d56533',
            '7.0 / API 24',
            'الإصدار الأولي المستقر لتطبيق كيان PDF مع دعم المعالجة المحلية بالكامل ومسح المستندات.',
            'Initial stable release of Kayan PDF with full offline document processing and scanner support.',
            true, '2026-09-01'
          ]
        );
      }

      // Migration / Normalization: Ensure existing PostgreSQL records use production-safe asset URLs
      try {
        await this.pool.query(`
          UPDATE applications
          SET icon_url = '/assets/images/kayan_pdf_icon.jpg'
          WHERE icon_url LIKE '%kayan_pdf_icon%';

          UPDATE applications
          SET banner_url = '/assets/images/kayan_pdf_feature_banner.jpg'
          WHERE banner_url LIKE '%kayan_pdf_feature_banner%';

          UPDATE applications
          SET icon_url = REPLACE(icon_url, '/src/assets/images/', '/assets/images/'),
              banner_url = REPLACE(banner_url, '/src/assets/images/', '/assets/images/')
          WHERE icon_url LIKE '/src/assets/images/%' OR banner_url LIKE '/src/assets/images/%';

          UPDATE screenshots
          SET url = '/assets/images/kayan_pdf_feature_banner.jpg'
          WHERE url LIKE '%kayan_pdf_feature_banner%';

          UPDATE screenshots
          SET url = REPLACE(url, '/src/assets/images/', '/assets/images/')
          WHERE url LIKE '/src/assets/images/%';
        `);
      } catch (normErr) {
        console.warn('PostgreSQL asset URL normalization notice:', normErr);
      }

      console.log('📦 PostgreSQL database connected and verified successfully.');
    } catch (err: any) {
      const sanitizedMsg = (err?.message || '').replace(DATABASE_URL || '', '[REDACTED_DATABASE_URL]');
      console.error('Failed to initialize PostgreSQL tables:', sanitizedMsg);
      if (process.env.FORCE_POSTGRES === 'true' || process.env.STRICT_DB === 'true') {
        throw new Error(`PostgreSQL initialization failed in strict mode: ${sanitizedMsg}`);
      } else {
        console.warn('⚠️ Falling back to local JSON store due to PostgreSQL connection/auth failure.');
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
        const data: DatabaseSchema = JSON.parse(content);
        let modified = false;
        if (data.applications) {
          for (const app of data.applications) {
            if (app.iconUrl && (app.iconUrl.includes('/src/assets/images/') || app.iconUrl.includes('kayan_pdf_icon_'))) {
              app.iconUrl = normalizeAssetUrl(app.iconUrl);
              modified = true;
            }
            if (app.bannerUrl && (app.bannerUrl.includes('/src/assets/images/') || app.bannerUrl.includes('kayan_pdf_feature_banner_'))) {
              app.bannerUrl = normalizeAssetUrl(app.bannerUrl);
              modified = true;
            }
          }
        }
        if (data.screenshots) {
          for (const ss of data.screenshots) {
            if (ss.url && (ss.url.includes('/src/assets/images/') || ss.url.includes('kayan_pdf_feature_banner_'))) {
              ss.url = normalizeAssetUrl(ss.url);
              modified = true;
            }
          }
        }
        if (!data.products || data.products.length === 0) {
          data.products = [...defaultProducts];
          modified = true;
        }
        if (!data.productFiles) {
          data.productFiles = [];
          modified = true;
        }
        if (!data.media) {
          data.media = [];
          modified = true;
        }
        if (modified) {
          this.saveJson(data);
        }
        return data;
      } catch (err) {
        console.error('Failed to load store.json', err);
      }
    }
    const data: DatabaseSchema = {
      applications: [defaultAppData],
      products: [...defaultProducts],
      productFiles: [],
      releases: [
        {
          id: 'rel_kayan_pdf_v1_0_0',
          appId: defaultAppData.id,
          versionName: '1.0.0',
          versionCode: 1,
          apkFileName: 'KayanPDF-v1.0.0.apk',
          apkDownloadUrl: 'https://github.com/gehadrok/kayan-store/releases/download/v1.0.0/KayanPDF-v1.0.0.apk',
          apkSize: '13.4 MB',
          apkSizeBytes: 14036833,
          sha256: 'e60f28c7f373391ecddecd902fb20b24b745dcb51ebc21926f90d55d56533',
          minAndroid: '7.0 / API 24',
          releaseNotesAr: 'الإصدار الأولي المستقر لتطبيق كيان PDF مع دعم المعالجة المحلية بالكامل ومسح المستندات.',
          releaseNotesEn: 'Initial stable release of Kayan PDF with full offline document processing and scanner support.',
          isCurrent: true,
          releaseDate: '2026-09-01',
          createdAt: new Date('2026-09-01T10:00:00Z').toISOString()
        }
      ],
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
      activityLogs: [],
      media: []
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
        url: normalizeAssetUrl(r.url),
        captionAr: r.caption_ar,
        captionEn: r.caption_en,
        orderIndex: r.order_index
      }));
    }
    if (!this.jsonData) return [];
    return this.jsonData.screenshots
      .filter(s => s.appId === appId)
      .map(s => ({ ...s, url: normalizeAssetUrl(s.url) }))
      .sort((a, b) => a.orderIndex - b.orderIndex);
  }

  public async getMediaByAppId(appId: string, onlyPublished: boolean = false): Promise<Media[]> {
    if (this.isPg && this.pool) {
      const query = onlyPublished
        ? 'SELECT * FROM media WHERE app_id = $1 AND is_published = true ORDER BY sort_order ASC'
        : 'SELECT * FROM media WHERE app_id = $1 ORDER BY sort_order ASC';
      const res = await this.pool.query(query, [appId]);
      return res.rows.map(r => this.mapMediaFromPg(r));
    }
    if (!this.jsonData) return [];
    let media = this.jsonData.media.filter(m => m.appId === appId);
    if (onlyPublished) media = media.filter(m => m.isPublished);
    return media.sort((a, b) => a.sortOrder - b.sortOrder);
  }

  public async createMedia(mediaData: Omit<Media, 'id' | 'createdAt' | 'updatedAt'>, actor: string): Promise<Media> {
    const id = 'med_' + crypto.randomBytes(6).toString('hex');
    const now = new Date().toISOString();
    const newMedia: Media = { ...mediaData, id, createdAt: now, updatedAt: now };

    if (this.isPg && this.pool) {
      await this.pool.query(
        `INSERT INTO media (id, app_id, media_type, file_url, thumbnail_url, external_url, title_ar, title_en, alt_ar, alt_en, sort_order, is_published)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          newMedia.id, newMedia.appId, newMedia.mediaType, newMedia.fileUrl, newMedia.thumbnailUrl,
          newMedia.externalUrl, newMedia.titleAr, newMedia.titleEn, newMedia.altAr, newMedia.altEn,
          newMedia.sortOrder, newMedia.isPublished
        ]
      );
    } else if (this.jsonData) {
      this.jsonData.media.push(newMedia);
      this.saveJson(this.jsonData);
    }
    await this.logActivity('CREATE_MEDIA', 'MEDIA', id, `تم إضافة وسائط جديدة (${newMedia.mediaType})`, actor);
    return newMedia;
  }

  // --- Product CRUD ---
  public async getProducts(onlyPublished: boolean = false): Promise<Product[]> {
    if (this.isPg && this.pool) {
      const query = onlyPublished
        ? 'SELECT * FROM products WHERE is_published = true ORDER BY created_at DESC'
        : 'SELECT * FROM products ORDER BY created_at DESC';
      const res = await this.pool.query(query);
      return res.rows.map(r => this.mapProductFromPg(r));
    }
    if (!this.jsonData) return [];
    let products = this.jsonData.products || [];
    if (onlyPublished) products = products.filter(p => p.isPublished);
    return products.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public async getProductById(id: string): Promise<Product | undefined> {
    if (this.isPg && this.pool) {
      const res = await this.pool.query('SELECT * FROM products WHERE id = $1', [id]);
      return res.rows[0] ? this.mapProductFromPg(res.rows[0]) : undefined;
    }
    if (!this.jsonData) return undefined;
    return (this.jsonData.products || []).find(p => p.id === id);
  }

  public async getProductBySlug(slug: string, onlyPublished: boolean = false): Promise<Product | undefined> {
    if (this.isPg && this.pool) {
      const query = onlyPublished
        ? 'SELECT * FROM products WHERE slug = $1 AND is_published = true'
        : 'SELECT * FROM products WHERE slug = $1';
      const res = await this.pool.query(query, [slug]);
      return res.rows[0] ? this.mapProductFromPg(res.rows[0]) : undefined;
    }
    if (!this.jsonData) return undefined;
    return (this.jsonData.products || []).find(p => p.slug === slug && (!onlyPublished || p.isPublished));
  }

  public async createProduct(productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>, actor: string): Promise<Product> {
    const id = 'prod_' + crypto.randomBytes(6).toString('hex');
    const now = new Date().toISOString();
    const newProduct: Product = {
      ...productData,
      id,
      publisher: productData.publisher || '',
      pages: productData.pages || 0,
      language: productData.language || '',
      isbn: productData.isbn || '',
      versionName: productData.versionName || '',
      versionCode: productData.versionCode || 0,
      packageName: productData.packageName || '',
      minAndroid: productData.minAndroid || '',
      releaseNotesAr: productData.releaseNotesAr || '',
      releaseNotesEn: productData.releaseNotesEn || '',
      sha256: productData.sha256 || '',
      price: typeof productData.price === 'number' ? productData.price : parseFloat(productData.price as any) || 0,
      currency: productData.currency || 'USD',
      tags: productData.tags || [],
      license: productData.license || 'Free',
      isPublished: productData.isPublished === true,
      featured: productData.featured === true,
      status: productData.status || (productData.isPublished ? 'published' : 'draft'),
      iconUrl: productData.iconUrl || '',
      coverUrl: productData.coverUrl || '',
      bannerUrl: productData.bannerUrl || '',
      videoUrl: productData.videoUrl || '',
      videoTitle: productData.videoTitle || '',
      createdAt: now,
      updatedAt: now
    };

    if (this.isPg && this.pool) {
      await this.pool.query(
        `INSERT INTO products (
          id, slug, type, name_ar, name_en, short_desc_ar, short_desc_en, full_desc_ar, full_desc_en,
          features_ar, features_en, category, author, publisher, pages, language, isbn,
          version_name, version_code, package_name, min_android, release_notes_ar, release_notes_en,
          sha256, price, currency, tags, license, is_published, featured, status,
          icon_url, cover_url, banner_url, video_url, video_title, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
          $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
          $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
          $31, $32, $33, $34, $35, $36, $37, $38
        )`,
        [
          newProduct.id, newProduct.slug, newProduct.type, newProduct.nameAr, newProduct.nameEn,
          newProduct.shortDescAr, newProduct.shortDescEn, newProduct.fullDescAr, newProduct.fullDescEn,
          newProduct.featuresAr, newProduct.featuresEn, newProduct.category, newProduct.author,
          newProduct.publisher, newProduct.pages, newProduct.language, newProduct.isbn,
          newProduct.versionName, newProduct.versionCode, newProduct.packageName, newProduct.minAndroid,
          newProduct.releaseNotesAr, newProduct.releaseNotesEn, newProduct.sha256,
          newProduct.price, newProduct.currency, newProduct.tags, newProduct.license,
          newProduct.isPublished, newProduct.featured, newProduct.status,
          newProduct.iconUrl, newProduct.coverUrl, newProduct.bannerUrl, newProduct.videoUrl, newProduct.videoTitle,
          newProduct.createdAt, newProduct.updatedAt
        ]
      );
    } else if (this.jsonData) {
      if (!this.jsonData.products) this.jsonData.products = [];
      this.jsonData.products.unshift(newProduct);
      this.saveJson(this.jsonData);
    }
    await this.logActivity('CREATE_PRODUCT', 'PRODUCT', id, `تم إنشاء منتج جديد (${newProduct.nameEn})`, actor);
    return newProduct;
  }

  public async updateProduct(id: string, updates: Partial<Product>, actor: string): Promise<Product | undefined> {
    const product = await this.getProductById(id);
    if (!product) return undefined;
    const now = new Date().toISOString();
    const updated: Product = {
      ...product,
      ...updates,
      id,
      updatedAt: now
    };

    if (this.isPg && this.pool) {
      await this.pool.query(
        `UPDATE products SET
          slug = $1, type = $2, name_ar = $3, name_en = $4, short_desc_ar = $5, short_desc_en = $6,
          full_desc_ar = $7, full_desc_en = $8, features_ar = $9, features_en = $10, category = $11,
          author = $12, publisher = $13, pages = $14, language = $15, isbn = $16,
          version_name = $17, version_code = $18, package_name = $19, min_android = $20,
          release_notes_ar = $21, release_notes_en = $22, sha256 = $23, price = $24, currency = $25,
          tags = $26, license = $27, is_published = $28, featured = $29, status = $30,
          icon_url = $31, cover_url = $32, banner_url = $33, video_url = $34, video_title = $35, updated_at = $36
        WHERE id = $37`,
        [
          updated.slug, updated.type, updated.nameAr, updated.nameEn, updated.shortDescAr, updated.shortDescEn,
          updated.fullDescAr, updated.fullDescEn, updated.featuresAr, updated.featuresEn, updated.category,
          updated.author, updated.publisher || '', updated.pages || 0, updated.language || '', updated.isbn || '',
          updated.versionName || '', updated.versionCode || 0, updated.packageName || '', updated.minAndroid || '',
          updated.releaseNotesAr || '', updated.releaseNotesEn || '', updated.sha256 || '',
          updated.price, updated.currency, updated.tags, updated.license,
          updated.isPublished, updated.featured === true, updated.status,
          updated.iconUrl || '', updated.coverUrl || '', updated.bannerUrl || '', updated.videoUrl || '', updated.videoTitle || '',
          updated.updatedAt, id
        ]
      );
    } else if (this.jsonData) {
      const idx = (this.jsonData.products || []).findIndex(p => p.id === id);
      if (idx !== -1) {
        this.jsonData.products[idx] = updated;
        this.saveJson(this.jsonData);
      }
    }
    await this.logActivity('UPDATE_PRODUCT', 'PRODUCT', id, `تم تحديث المنتج (${updated.nameEn})`, actor);
    return updated;
  }

  public async deleteProduct(id: string, actor: string): Promise<boolean> {
    const product = await this.getProductById(id);
    if (!product) return false;

    if (this.isPg && this.pool) {
      await this.pool.query('DELETE FROM products WHERE id = $1', [id]);
    } else if (this.jsonData) {
      this.jsonData.products = (this.jsonData.products || []).filter(p => p.id !== id);
      this.jsonData.productFiles = (this.jsonData.productFiles || []).filter(f => f.productId !== id);
      this.jsonData.media = (this.jsonData.media || []).filter(m => m.productId !== id);
      this.saveJson(this.jsonData);
    }
    await this.logActivity('DELETE_PRODUCT', 'PRODUCT', id, `تم حذف المنتج (${product.nameEn})`, actor);
    return true;
  }

  public async publishProduct(id: string, publish: boolean, actor: string): Promise<Product | undefined> {
    return await this.updateProduct(id, { isPublished: publish, status: publish ? 'published' : 'draft' }, actor);
  }

  public async unpublishProduct(id: string, actor: string): Promise<Product | undefined> {
    return await this.updateProduct(id, { isPublished: false, status: 'draft' }, actor);
  }

  // --- Product Files CRUD ---
  public async getProductFiles(productId: string): Promise<ProductFile[]> {
    if (this.isPg && this.pool) {
      const res = await this.pool.query('SELECT * FROM product_files WHERE product_id = $1 ORDER BY created_at ASC', [productId]);
      return res.rows.map(r => this.mapProductFileFromPg(r));
    }
    if (!this.jsonData) return [];
    return (this.jsonData.productFiles || []).filter(f => f.productId === productId);
  }

  public async getProductFileById(id: string): Promise<ProductFile | undefined> {
    if (this.isPg && this.pool) {
      const res = await this.pool.query('SELECT * FROM product_files WHERE id = $1', [id]);
      return res.rows[0] ? this.mapProductFileFromPg(res.rows[0]) : undefined;
    }
    if (!this.jsonData) return undefined;
    return (this.jsonData.productFiles || []).find(f => f.id === id);
  }

  public async createProductFile(fileData: Omit<ProductFile, 'id' | 'createdAt'>, actor: string): Promise<ProductFile> {
    const id = 'pfile_' + crypto.randomBytes(6).toString('hex');
    const now = new Date().toISOString();
    const newFile: ProductFile = {
      ...fileData,
      id,
      fileType: fileData.fileType || 'MAIN',
      createdAt: now
    };

    if (this.isPg && this.pool) {
      await this.pool.query(
        `INSERT INTO product_files (id, product_id, file_url, title, file_type, original_name, size, size_bytes, sha256, is_main, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          newFile.id, newFile.productId, newFile.fileUrl, newFile.title, newFile.fileType,
          newFile.originalName || null, newFile.size, newFile.sizeBytes, newFile.sha256 || null, newFile.isMain, newFile.createdAt
        ]
      );
    } else if (this.jsonData) {
      if (!this.jsonData.productFiles) this.jsonData.productFiles = [];
      this.jsonData.productFiles.push(newFile);
      this.saveJson(this.jsonData);
    }
    await this.logActivity('CREATE_PRODUCT_FILE', 'PRODUCT_FILE', id, `تم إضافة ملف للمنتج (${newFile.title})`, actor);
    return newFile;
  }

  public async deleteProductFile(id: string, actor: string): Promise<boolean> {
    const file = await this.getProductFileById(id);
    if (!file) return false;

    if (this.isPg && this.pool) {
      await this.pool.query('DELETE FROM product_files WHERE id = $1', [id]);
    } else if (this.jsonData) {
      this.jsonData.productFiles = (this.jsonData.productFiles || []).filter(f => f.id !== id);
      this.saveJson(this.jsonData);
    }
    await this.logActivity('DELETE_PRODUCT_FILE', 'PRODUCT_FILE', id, `تم حذف ملف منتج (${file.title})`, actor);
    return true;
  }

  // --- Product Media CRUD ---
  public async getMediaByProductId(productId: string, onlyPublished: boolean = false): Promise<Media[]> {
    if (this.isPg && this.pool) {
      const query = onlyPublished
        ? 'SELECT * FROM media WHERE product_id = $1 AND is_published = true ORDER BY sort_order ASC, created_at ASC'
        : 'SELECT * FROM media WHERE product_id = $1 ORDER BY sort_order ASC, created_at ASC';
      const res = await this.pool.query(query, [productId]);
      return res.rows.map(r => this.mapMediaFromPg(r));
    }
    if (!this.jsonData) return [];
    let media = (this.jsonData.media || []).filter(m => m.productId === productId);
    if (onlyPublished) media = media.filter(m => m.isPublished);
    return media.sort((a, b) => a.sortOrder - b.sortOrder);
  }

  public async createProductMedia(mediaData: Omit<Media, 'id' | 'createdAt' | 'updatedAt'>, actor: string): Promise<Media> {
    const id = 'med_' + crypto.randomBytes(6).toString('hex');
    const now = new Date().toISOString();
    const newMedia: Media = {
      ...mediaData,
      id,
      appId: undefined, // Guarantee CHECK constraint
      createdAt: now,
      updatedAt: now
    };

    if (this.isPg && this.pool) {
      await this.pool.query(
        `INSERT INTO media (id, app_id, product_id, media_type, file_url, thumbnail_url, external_url, title_ar, title_en, alt_ar, alt_en, sort_order, is_published, created_at, updated_at)
         VALUES ($1, NULL, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
        [
          newMedia.id, newMedia.productId, newMedia.mediaType, newMedia.fileUrl || null, newMedia.thumbnailUrl || null,
          newMedia.externalUrl || null, newMedia.titleAr || null, newMedia.titleEn || null, newMedia.altAr || null, newMedia.altEn || null,
          newMedia.sortOrder || 0, newMedia.isPublished !== false, newMedia.createdAt, newMedia.updatedAt
        ]
      );
    } else if (this.jsonData) {
      if (!this.jsonData.media) this.jsonData.media = [];
      this.jsonData.media.push(newMedia);
      this.saveJson(this.jsonData);
    }
    await this.logActivity('CREATE_PRODUCT_MEDIA', 'MEDIA', id, `تم إضافة وسائط لمنتج (${newMedia.mediaType})`, actor);
    return newMedia;
  }

  public async updateMedia(id: string, updates: Partial<Media>, actor: string): Promise<Media | undefined> {
    const media = await this.getMediaById(id);
    if (!media) return undefined;
    const now = new Date().toISOString();
    const updated: Media = { ...media, ...updates, id, updatedAt: now };

    if (this.isPg && this.pool) {
      await this.pool.query(
        `UPDATE media SET
          file_url = $1, thumbnail_url = $2, external_url = $3, title_ar = $4, title_en = $5,
          alt_ar = $6, alt_en = $7, sort_order = $8, is_published = $9, updated_at = $10
        WHERE id = $11`,
        [
          updated.fileUrl || null, updated.thumbnailUrl || null, updated.externalUrl || null,
          updated.titleAr || null, updated.titleEn || null, updated.altAr || null, updated.altEn || null,
          updated.sortOrder || 0, updated.isPublished !== false, updated.updatedAt, id
        ]
      );
    } else if (this.jsonData) {
      const idx = (this.jsonData.media || []).findIndex(m => m.id === id);
      if (idx !== -1) {
        this.jsonData.media[idx] = updated;
        this.saveJson(this.jsonData);
      }
    }
    await this.logActivity('UPDATE_MEDIA', 'MEDIA', id, `تم تحديث وسائط (${updated.mediaType})`, actor);
    return updated;
  }

  public async reorderProductMedia(productId: string, orderedIds: string[], actor: string): Promise<boolean> {
    if (this.isPg && this.pool) {
      const client = await this.pool.connect();
      try {
        await client.query('BEGIN');
        for (let i = 0; i < orderedIds.length; i++) {
          await client.query('UPDATE media SET sort_order = $1 WHERE id = $2 AND product_id = $3', [i, orderedIds[i], productId]);
        }
        await client.query('COMMIT');
      } catch (e) {
        await client.query('ROLLBACK');
        client.release();
        throw e;
      }
      client.release();
    } else if (this.jsonData) {
      orderedIds.forEach((id, index) => {
        const item = (this.jsonData?.media || []).find(m => m.id === id && m.productId === productId);
        if (item) item.sortOrder = index;
      });
      this.saveJson(this.jsonData);
    }
    await this.logActivity('REORDER_MEDIA', 'PRODUCT', productId, `تمت إعادة ترتيب وسائط المنتج`, actor);
    return true;
  }

  public async deleteMedia(id: string, actor: string): Promise<boolean> {
    const media = await this.getMediaById(id);
    if (!media) return false;

    if (this.isPg && this.pool) {
      await this.pool.query('DELETE FROM media WHERE id = $1', [id]);
    } else if (this.jsonData) {
      this.jsonData.media = this.jsonData.media.filter(m => m.id !== id);
      this.saveJson(this.jsonData);
    }
    await this.logActivity('DELETE_MEDIA', 'MEDIA', id, `تم حذف وسائط (${media.mediaType})`, actor);
    return true;
  }

  public async getMediaById(id: string): Promise<Media | undefined> {
    if (this.isPg && this.pool) {
      const res = await this.pool.query('SELECT * FROM media WHERE id = $1', [id]);
      return res.rows[0] ? this.mapMediaFromPg(res.rows[0]) : undefined;
    }
    if (!this.jsonData) return undefined;
    return this.jsonData.media.find(m => m.id === id);
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
      iconUrl: normalizeAssetUrl(r.icon_url),
      bannerUrl: normalizeAssetUrl(r.banner_url),
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

  private mapMediaFromPg(r: any): Media {
    return {
      id: r.id,
      appId: r.app_id || undefined,
      productId: r.product_id || undefined,
      mediaType: r.media_type,
      fileUrl: r.file_url,
      thumbnailUrl: r.thumbnail_url,
      externalUrl: r.external_url,
      titleAr: r.title_ar,
      titleEn: r.title_en,
      altAr: r.alt_ar,
      altEn: r.alt_en,
      sortOrder: r.sort_order,
      isPublished: r.is_published,
      createdAt: r.created_at,
      updatedAt: r.updated_at
    };
  }

  private mapProductFromPg(r: any): Product {
    return {
      id: r.id,
      slug: r.slug,
      type: r.type,
      nameAr: r.name_ar,
      nameEn: r.name_en,
      shortDescAr: r.short_desc_ar,
      shortDescEn: r.short_desc_en,
      fullDescAr: r.full_desc_ar,
      fullDescEn: r.full_desc_en,
      featuresAr: r.features_ar || [],
      featuresEn: r.features_en || [],
      category: r.category,
      author: r.author || '',
      publisher: r.publisher || '',
      pages: r.pages ? parseInt(r.pages, 10) : undefined,
      language: r.language || '',
      isbn: r.isbn || '',
      versionName: r.version_name || '',
      versionCode: r.version_code ? parseInt(r.version_code, 10) : undefined,
      packageName: r.package_name || '',
      minAndroid: r.min_android || '',
      releaseNotesAr: r.release_notes_ar || '',
      releaseNotesEn: r.release_notes_en || '',
      sha256: r.sha256 || '',
      price: parseFloat(r.price) || 0,
      currency: r.currency || 'USD',
      tags: r.tags || [],
      license: r.license || 'Free',
      isPublished: r.is_published === true,
      featured: r.featured === true,
      status: r.status || 'published',
      iconUrl: r.icon_url || '',
      coverUrl: r.cover_url || '',
      bannerUrl: r.banner_url || '',
      videoUrl: r.video_url || '',
      videoTitle: r.video_title || '',
      createdAt: r.created_at,
      updatedAt: r.updated_at
    };
  }

  private mapProductFileFromPg(r: any): ProductFile {
    return {
      id: r.id,
      productId: r.product_id,
      fileUrl: r.file_url,
      title: r.title,
      fileType: r.file_type || 'MAIN',
      originalName: r.original_name || undefined,
      size: r.size,
      sizeBytes: parseInt(r.size_bytes, 10) || 0,
      sha256: r.sha256 || undefined,
      isMain: r.is_main === true,
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

  // ==========================================
  // CUSTOMER USER METHODS
  // ==========================================

  public async createUser(data: { email: string; passwordHash: string; displayName: string; locale?: string }): Promise<User> {
    const normalizedEmail = data.email.trim().toLowerCase();
    const id = 'usr_' + crypto.randomBytes(8).toString('hex');
    const now = new Date().toISOString();
    const user: User = {
      id,
      email: normalizedEmail,
      name: data.displayName.trim(),
      role: 'customer',
      createdAt: now,
      updatedAt: now
    };

    const pool = this.pool;
    if (this.isPg && pool) {
      await pool.query(
        `INSERT INTO users (id, email, password_hash, display_name, locale, status, email_verified, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [id, normalizedEmail, data.passwordHash, user.name, data.locale || 'ar', 'ACTIVE', false, now, now]
      );
    } else {
      const dbData = this.getJsonData();
      const exists = dbData.users!.find(u => u.email === normalizedEmail);
      if (exists) {
        throw new Error('Duplicate email');
      }
      (user as any).passwordHash = data.passwordHash;
      (user as any).status = 'ACTIVE';
      (user as any).emailVerified = false;
      dbData.users!.push(user);
      this.saveJson(dbData);
    }

    return user;
  }

  public async getUserByEmail(email: string): Promise<(User & { passwordHash: string; status: string; emailVerified: boolean }) | null> {
    const normalized = email.trim().toLowerCase();
    const pool = this.pool;
    if (this.isPg && pool) {
      const res = await pool.query('SELECT * FROM users WHERE LOWER(email) = $1', [normalized]);
      if (res.rows.length === 0) return null;
      const r = res.rows[0];
      return {
        id: r.id,
        email: r.email,
        name: r.display_name,
        avatarUrl: r.avatar_url || undefined,
        role: 'customer',
        createdAt: r.created_at,
        updatedAt: r.updated_at,
        passwordHash: r.password_hash,
        status: r.status,
        emailVerified: r.email_verified === true
      };
    } else {
      const dbData = this.getJsonData();
      const users = dbData.users || [];
      const u = users.find(x => x.email.toLowerCase() === normalized) as any;
      if (!u) return null;
      return {
        id: u.id,
        email: u.email,
        name: u.name,
        avatarUrl: u.avatarUrl,
        role: 'customer',
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
        passwordHash: u.passwordHash,
        status: u.status || 'ACTIVE',
        emailVerified: u.emailVerified === true
      };
    }
  }

  public async getUserById(id: string): Promise<User | null> {
    const pool = this.pool;
    if (this.isPg && pool) {
      const res = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
      if (res.rows.length === 0) return null;
      const r = res.rows[0];
      return {
        id: r.id,
        email: r.email,
        name: r.display_name,
        avatarUrl: r.avatar_url || undefined,
        role: 'customer',
        createdAt: r.created_at,
        updatedAt: r.updated_at
      };
    } else {
      const dbData = this.getJsonData();
      const users = dbData.users || [];
      const u = users.find(x => x.id === id);
      if (!u) return null;
      return {
        id: u.id,
        email: u.email,
        name: u.name,
        avatarUrl: u.avatarUrl,
        role: 'customer',
        createdAt: u.createdAt,
        updatedAt: u.updatedAt
      };
    }
  }

  public async updateUserLastLogin(id: string): Promise<void> {
    const now = new Date().toISOString();
    const pool = this.pool;
    if (this.isPg && pool) {
      await pool.query('UPDATE users SET last_login_at = $1 WHERE id = $2', [now, id]);
    } else {
      const dbData = this.getJsonData();
      const users = dbData.users || [];
      const u = users.find(x => x.id === id) as any;
      if (u) {
        u.lastLoginAt = now;
        this.saveJson(dbData);
      }
    }
  }

  public async listUsers(): Promise<User[]> {
    const pool = this.pool;
    if (this.isPg && pool) {
      const res = await pool.query('SELECT * FROM users ORDER BY created_at DESC');
      return res.rows.map(r => ({
        id: r.id,
        email: r.email,
        name: r.display_name,
        avatarUrl: r.avatar_url || undefined,
        role: 'customer',
        createdAt: r.created_at,
        updatedAt: r.updated_at
      }));
    } else {
      const dbData = this.getJsonData();
      return (dbData.users || []).map(u => ({
        id: u.id,
        email: u.email,
        name: u.name,
        avatarUrl: u.avatarUrl,
        role: 'customer',
        createdAt: u.createdAt,
        updatedAt: u.updatedAt
      }));
    }
  }

  public async updateUserStatus(id: string, status: 'ACTIVE' | 'SUSPENDED'): Promise<void> {
    const now = new Date().toISOString();
    const pool = this.pool;
    if (this.isPg && pool) {
      await pool.query('UPDATE users SET status = $1, updated_at = $2 WHERE id = $3', [status, now, id]);
    } else {
      const dbData = this.getJsonData();
      const users = dbData.users || [];
      const u = users.find(x => x.id === id) as any;
      if (u) {
        u.status = status;
        u.updatedAt = now;
        this.saveJson(dbData);
      }
    }
  }

  // ==========================================
  // CUSTOMER SESSION METHODS
  // ==========================================

  public async createUserSession(userId: string, userAgent?: string, ipAddress?: string): Promise<{ token: string; session: UserSession }> {
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const id = 'sess_' + crypto.randomBytes(8).toString('hex');
    const now = new Date().toISOString();
    const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days

    const session: UserSession = {
      id,
      userId,
      token,
      expiresAt,
      createdAt: now
    };

    const pool = this.pool;
    if (this.isPg && pool) {
      await pool.query(
        `INSERT INTO user_sessions (id, user_id, token_hash, expires_at, created_at, last_used_at, user_agent, ip_address)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [id, userId, tokenHash, new Date(expiresAt).toISOString(), now, now, userAgent || null, ipAddress || null]
      );
    } else {
      const dbData = this.getJsonData();
      (session as any).tokenHash = tokenHash;
      dbData.userSessions!.push(session);
      this.saveJson(dbData);
    }

    return { token, session };
  }

  public async getUserSessionByToken(token: string): Promise<{ session: UserSession; user: User } | null> {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const now = Date.now();
    const pool = this.pool;

    if (this.isPg && pool) {
      const res = await pool.query(
        `SELECT s.*, u.email, u.display_name, u.avatar_url, u.status, u.created_at as u_created, u.updated_at as u_updated
         FROM user_sessions s
         JOIN users u ON s.user_id = u.id
         WHERE s.token_hash = $1 AND u.status = 'ACTIVE'`,
        [tokenHash]
      );
      if (res.rows.length === 0) return null;
      const r = res.rows[0];
      const expiresAt = new Date(r.expires_at).getTime();
      if (expiresAt < now) return null;

      // Update last_used_at
      await pool.query('UPDATE user_sessions SET last_used_at = NOW() WHERE id = $1', [r.id]);

      return {
        session: {
          id: r.id,
          userId: r.user_id,
          token,
          expiresAt,
          createdAt: r.created_at
        },
        user: {
          id: r.user_id,
          email: r.email,
          name: r.display_name,
          avatarUrl: r.avatar_url || undefined,
          role: 'customer',
          createdAt: r.u_created,
          updatedAt: r.u_updated
        }
      };
    } else {
      const dbData = this.getJsonData();
      const sessions = dbData.userSessions || [];
      const s = sessions.find(x => (x as any).tokenHash === tokenHash || x.token === token) as any;
      if (!s || s.expiresAt < now) return null;
      const user = await this.getUserById(s.userId);
      if (!user) return null;

      return { session: s, user };
    }
  }

  public async deleteUserSession(token: string): Promise<void> {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const pool = this.pool;
    if (this.isPg && pool) {
      await pool.query('DELETE FROM user_sessions WHERE token_hash = $1', [tokenHash]);
    } else {
      const dbData = this.getJsonData();
      if (dbData.userSessions) {
        dbData.userSessions = dbData.userSessions.filter(x => (x as any).tokenHash !== tokenHash && x.token !== token);
        this.saveJson(dbData);
      }
    }
  }

  // ==========================================
  // FAVORITES METHODS
  // ==========================================

  public async getUserFavorites(userId: string): Promise<Product[]> {
    const pool = this.pool;
    if (this.isPg && pool) {
      const res = await pool.query(
        `SELECT p.* FROM products p
         JOIN favorites f ON p.id = f.product_id
         WHERE f.user_id = $1 AND p.is_published = true
         ORDER BY f.created_at DESC`,
        [userId]
      );
      return res.rows.map(r => this.mapProductFromPg(r));
    } else {
      const dbData = this.getJsonData();
      const favorites = dbData.favorites || [];
      const userFavIds = favorites.filter(f => f.userId === userId).map(f => f.productId);
      const products = dbData.products || [];
      return products.filter(p => userFavIds.includes(p.id) && p.isPublished);
    }
  }

  public async addFavorite(userId: string, productId: string): Promise<void> {
    const id = 'fav_' + crypto.randomBytes(8).toString('hex');
    const now = new Date().toISOString();
    const pool = this.pool;
    if (this.isPg && pool) {
      await pool.query(
        `INSERT INTO favorites (id, user_id, product_id, created_at)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (user_id, product_id) DO NOTHING`,
        [id, userId, productId, now]
      );
    } else {
      const dbData = this.getJsonData();
      const exists = dbData.favorites!.find(f => f.userId === userId && f.productId === productId);
      if (!exists) {
        dbData.favorites!.push({ id, userId, productId, createdAt: now });
        this.saveJson(dbData);
      }
    }
  }

  public async removeFavorite(userId: string, productId: string): Promise<void> {
    const pool = this.pool;
    if (this.isPg && pool) {
      await pool.query('DELETE FROM favorites WHERE user_id = $1 AND product_id = $2', [userId, productId]);
    } else {
      const dbData = this.getJsonData();
      if (dbData.favorites) {
        dbData.favorites = dbData.favorites.filter(f => !(f.userId === userId && f.productId === productId));
        this.saveJson(dbData);
      }
    }
  }

  public async isFavorite(userId: string, productId: string): Promise<boolean> {
    const pool = this.pool;
    if (this.isPg && pool) {
      const res = await pool.query('SELECT 1 FROM favorites WHERE user_id = $1 AND product_id = $2', [userId, productId]);
      return res.rows.length > 0;
    } else {
      const dbData = this.getJsonData();
      const favorites = dbData.favorites || [];
      return favorites.some(f => f.userId === userId && f.productId === productId);
    }
  }

  // ==========================================
  // REVIEWS METHODS
  // ==========================================

  public async getProductReviews(productId: string): Promise<Array<{ id: string; userId: string; userName: string; rating: number; title?: string; body: string; createdAt: string }>> {
    const pool = this.pool;
    if (this.isPg && pool) {
      const res = await pool.query(
        `SELECT r.*, u.display_name FROM reviews r
         JOIN users u ON r.user_id = u.id
         WHERE r.product_id = $1 AND r.status = 'PUBLISHED'
         ORDER BY r.created_at DESC`,
        [productId]
      );
      return res.rows.map(r => ({
        id: r.id,
        userId: r.user_id,
        userName: r.display_name,
        rating: r.rating,
        title: r.title || undefined,
        body: r.body,
        createdAt: r.created_at
      }));
    } else {
      const dbData = this.getJsonData();
      const reviews = dbData.reviews || [];
      const users = dbData.users || [];
      return reviews
        .filter(r => r.productId === productId && (r as any).status === 'PUBLISHED')
        .map(r => {
          const u = users.find(x => x.id === r.userId);
          return {
            id: r.id,
            userId: r.userId,
            userName: u ? u.name : 'مستخدم كيان',
            rating: r.rating,
            title: (r as any).title,
            body: (r as any).body || r.commentAr || '',
            createdAt: r.createdAt
          };
        });
    }
  }

  public async createOrUpdateReview(userId: string, productId: string, rating: number, body: string, title?: string): Promise<void> {
    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }
    const id = 'rev_' + crypto.randomBytes(8).toString('hex');
    const now = new Date().toISOString();
    const pool = this.pool;

    if (this.isPg && pool) {
      await pool.query(
        `INSERT INTO reviews (id, user_id, product_id, rating, title, body, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (user_id, product_id)
         DO UPDATE SET rating = EXCLUDED.rating, title = EXCLUDED.title, body = EXCLUDED.body, status = EXCLUDED.status, updated_at = EXCLUDED.updated_at`,
        [id, userId, productId, rating, title || null, body, 'PUBLISHED', now, now]
      );
    } else {
      const dbData = this.getJsonData();
      const idx = dbData.reviews!.findIndex(r => r.userId === userId && r.productId === productId);
      if (idx >= 0) {
        dbData.reviews![idx] = {
          ...dbData.reviews![idx],
          rating,
          commentAr: body,
          updatedAt: now
        };
      } else {
        dbData.reviews!.push({
          id,
          userId,
          productId,
          rating,
          commentAr: body,
          isVerifiedPurchase: true,
          createdAt: now,
          updatedAt: now
        });
      }
      this.saveJson(dbData);
    }
  }

  // ==========================================
  // ENTITLEMENTS & LIBRARY METHODS
  // ==========================================

  public async getUserLibrary(userId: string): Promise<Product[]> {
    const pool = this.pool;
    if (this.isPg && pool) {
      const res = await pool.query(
        `SELECT DISTINCT p.* FROM products p
         JOIN entitlements e ON p.id = e.product_id
         WHERE e.user_id = $1 AND e.status = 'ACTIVE' AND p.is_published = true
         ORDER BY p.created_at DESC`,
        [userId]
      );
      const products = res.rows.map(r => this.mapProductFromPg(r));
      for (const prod of products) {
        prod.files = await this.getProductFiles(prod.id);
      }
      return products;
    } else {
      const dbData = this.getJsonData();
      const entitlements = dbData.entitlements || [];
      const activeProdIds = entitlements
        .filter(e => e.userId === userId && (e as any).status === 'ACTIVE')
        .map(e => e.productId);
      const products = (dbData.products || []).filter(p => activeProdIds.includes(p.id) && p.isPublished);
      for (const prod of products) {
        prod.files = await this.getProductFiles(prod.id);
      }
      return products;
    }
  }

  public async grantEntitlement(userId: string, productId: string, source: string = 'FREE', orderId?: string): Promise<void> {
    const id = 'ent_' + crypto.randomBytes(8).toString('hex');
    const now = new Date().toISOString();
    const pool = this.pool;

    if (this.isPg && pool) {
      await pool.query(
        `INSERT INTO entitlements (id, user_id, product_id, source, order_id, granted_at, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (user_id, product_id) DO UPDATE SET status = 'ACTIVE'`,
        [id, userId, productId, source, orderId || null, now, 'ACTIVE']
      );
    } else {
      const dbData = this.getJsonData();
      const exists = dbData.entitlements!.find(e => e.userId === userId && e.productId === productId);
      if (!exists) {
        dbData.entitlements!.push({
          id,
          userId,
          productId,
          createdAt: now
        });
        this.saveJson(dbData);
      }
    }
  }

  public async hasEntitlement(userId: string, productId: string): Promise<boolean> {
    const pool = this.pool;
    if (this.isPg && pool) {
      const res = await pool.query(
        `SELECT 1 FROM entitlements WHERE user_id = $1 AND product_id = $2 AND status = 'ACTIVE'`,
        [userId, productId]
      );
      return res.rows.length > 0;
    } else {
      const dbData = this.getJsonData();
      const entitlements = dbData.entitlements || [];
      return entitlements.some(e => e.userId === userId && e.productId === productId);
    }
  }

  public async recordDownload(params: { userId?: string; productId?: string; releaseId?: string; productFileId?: string; ipAddress?: string; userAgent?: string }): Promise<void> {
    const id = 'dl_' + crypto.randomBytes(8).toString('hex');
    const now = new Date().toISOString();
    const pool = this.pool;

    if (this.isPg && pool) {
      await pool.query(
        `INSERT INTO downloads (id, user_id, product_id, release_id, product_file_id, created_at, ip_address, user_agent, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [id, params.userId || null, params.productId || null, params.releaseId || null, params.productFileId || null, now, params.ipAddress || null, params.userAgent || null, 'COMPLETED']
      );
    } else {
      const dbData = this.getJsonData();
      dbData.downloads!.push({
        id,
        userId: params.userId,
        productId: params.productId || '',
        fileId: params.productFileId || '',
        ipAddress: params.ipAddress,
        downloadedAt: now
      });
      this.saveJson(dbData);
    }
  }

  public async getUserDownloads(userId: string): Promise<Download[]> {
    const pool = this.pool;
    if (this.isPg && pool) {
      const res = await pool.query(
        `SELECT * FROM downloads WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
        [userId]
      );
      return res.rows.map(r => ({
        id: r.id,
        userId: r.user_id,
        productId: r.product_id,
        fileId: r.product_file_id || r.release_id,
        ipAddress: r.ip_address,
        downloadedAt: r.created_at
      }));
    } else {
      const dbData = this.getJsonData();
      const downloads = dbData.downloads || [];
      return downloads.filter(d => d.userId === userId);
    }
  }

  // ==========================================
  // KAYAN AI PROJECTS & ASSETS METHODS
  // ==========================================

  public async getUserAIProjects(userId: string): Promise<AIProject[]> {
    const pool = this.pool;
    if (this.isPg && pool) {
      const res = await pool.query(
        `SELECT * FROM ai_projects WHERE user_id = $1 AND status = 'ACTIVE' ORDER BY updated_at DESC`,
        [userId]
      );
      return res.rows.map(r => ({
        id: r.id,
        userId: r.user_id,
        name: r.name,
        description: r.description || undefined,
        status: r.status,
        createdAt: r.created_at,
        updatedAt: r.updated_at
      }));
    } else {
      const dbData = this.getJsonData();
      const projects = dbData.aiProjects || [];
      return projects.filter(p => p.userId === userId && p.status === 'active');
    }
  }

  public async getAIProjectById(id: string): Promise<AIProject | null> {
    const pool = this.pool;
    if (this.isPg && pool) {
      const res = await pool.query(`SELECT * FROM ai_projects WHERE id = $1`, [id]);
      if (res.rows.length === 0) return null;
      const r = res.rows[0];
      return {
        id: r.id,
        userId: r.user_id,
        name: r.name,
        description: r.description || undefined,
        status: r.status,
        createdAt: r.created_at,
        updatedAt: r.updated_at
      };
    } else {
      const dbData = this.getJsonData();
      const projects = dbData.aiProjects || [];
      return projects.find(p => p.id === id) || null;
    }
  }

  public async createAIProject(userId: string, name: string, description?: string, type: string = 'GENERAL'): Promise<AIProject> {
    const id = 'aiproj_' + crypto.randomBytes(8).toString('hex');
    const now = new Date().toISOString();
    const project: AIProject = {
      id,
      userId,
      name: name.trim(),
      description: description ? description.trim() : undefined,
      status: 'active',
      createdAt: now,
      updatedAt: now
    };

    const pool = this.pool;
    if (this.isPg && pool) {
      await pool.query(
        `INSERT INTO ai_projects (id, user_id, name, description, type, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [id, userId, project.name, project.description || null, type, 'ACTIVE', now, now]
      );
    } else {
      const dbData = this.getJsonData();
      dbData.aiProjects!.push(project);
      this.saveJson(dbData);
    }

    return project;
  }

  public async updateAIProject(id: string, userId: string, updates: { name?: string; description?: string }): Promise<AIProject | null> {
    const now = new Date().toISOString();
    const pool = this.pool;
    if (this.isPg && pool) {
      const res = await pool.query(
        `UPDATE ai_projects
         SET name = COALESCE($1, name), description = COALESCE($2, description), updated_at = $3
         WHERE id = $4 AND user_id = $5
         RETURNING *`,
        [updates.name || null, updates.description || null, now, id, userId]
      );
      if (res.rows.length === 0) return null;
      const r = res.rows[0];
      return {
        id: r.id,
        userId: r.user_id,
        name: r.name,
        description: r.description || undefined,
        status: r.status,
        createdAt: r.created_at,
        updatedAt: r.updated_at
      };
    } else {
      const dbData = this.getJsonData();
      const projects = dbData.aiProjects || [];
      const p = projects.find(x => x.id === id && x.userId === userId);
      if (!p) return null;
      if (updates.name) p.name = updates.name;
      if (updates.description !== undefined) p.description = updates.description;
      p.updatedAt = now;
      this.saveJson(dbData);
      return p;
    }
  }

  public async deleteAIProject(id: string, userId: string): Promise<boolean> {
    const pool = this.pool;
    if (this.isPg && pool) {
      const res = await pool.query('DELETE FROM ai_projects WHERE id = $1 AND user_id = $2', [id, userId]);
      return (res.rowCount || 0) > 0;
    } else {
      const dbData = this.getJsonData();
      if (dbData.aiProjects) {
        const initial = dbData.aiProjects.length;
        dbData.aiProjects = dbData.aiProjects.filter(p => !(p.id === id && p.userId === userId));
        this.saveJson(dbData);
        return dbData.aiProjects.length < initial;
      }
      return false;
    }
  }

  public async getProjectAIAssets(projectId: string): Promise<AIAsset[]> {
    const pool = this.pool;
    if (this.isPg && pool) {
      const res = await pool.query('SELECT * FROM ai_assets WHERE project_id = $1 ORDER BY created_at DESC', [projectId]);
      return res.rows.map(r => ({
        id: r.id,
        projectId: r.project_id,
        userId: r.user_id,
        jobId: r.job_id || undefined,
        assetType: r.type || 'image',
        url: r.storage_key || r.url,
        mimeType: r.mime_type || 'image/png',
        sizeBytes: r.size_bytes ? parseInt(r.size_bytes, 10) : undefined,
        sha256: r.sha256 || undefined,
        createdAt: r.created_at
      }));
    } else {
      const dbData = this.getJsonData();
      const assets = dbData.aiAssets || [];
      return assets.filter(a => a.projectId === projectId);
    }
  }

  public async createAIAsset(params: Omit<AIAsset, 'id' | 'createdAt'>): Promise<AIAsset> {
    const id = 'asset_' + crypto.randomBytes(8).toString('hex');
    const now = new Date().toISOString();
    const asset: AIAsset = {
      ...params,
      id,
      createdAt: now
    };

    const pool = this.pool;
    if (this.isPg && pool) {
      await pool.query(
        `INSERT INTO ai_assets (id, project_id, user_id, job_id, type, storage_key, mime_type, size_bytes, sha256, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [id, params.projectId || null, params.userId || null, params.jobId || null, params.assetType, params.url, params.mimeType, params.sizeBytes || 0, params.sha256 || null, now]
      );
    } else {
      const dbData = this.getJsonData();
      dbData.aiAssets!.push(asset);
      this.saveJson(dbData);
    }

    return asset;
  }

  public async getAIAssetById(id: string): Promise<AIAsset | null> {
    const pool = this.pool;
    if (this.isPg && pool) {
      const res = await pool.query('SELECT * FROM ai_assets WHERE id = $1', [id]);
      if (res.rows.length === 0) return null;
      const r = res.rows[0];
      return {
        id: r.id,
        projectId: r.project_id || undefined,
        userId: r.user_id || undefined,
        jobId: r.job_id || undefined,
        assetType: r.type || 'image',
        url: r.storage_key || r.url,
        mimeType: r.mime_type || 'image/png',
        sizeBytes: r.size_bytes ? parseInt(r.size_bytes, 10) : undefined,
        sha256: r.sha256 || undefined,
        createdAt: r.created_at
      };
    } else {
      const dbData = this.getJsonData();
      const assets = dbData.aiAssets || [];
      return assets.find(a => a.id === id) || null;
    }
  }

  public async recordAIUsage(params: {
    userId?: string;
    projectId?: string;
    jobId?: string;
    provider: string;
    model: string;
    capability: string;
    status: string;
    retryCount?: number;
    fallbackUsed?: boolean;
    isPaid?: boolean;
    startedAt: string;
    completedAt: string;
    durationMs?: number;
    metadata?: Record<string, any>;
  }): Promise<void> {
    const id = 'usage_' + crypto.randomBytes(8).toString('hex');
    const pool = this.pool;

    if (this.isPg && pool) {
      await pool.query(
        `INSERT INTO ai_usages (id, user_id, project_id, job_id, provider, model, capability, status, retry_count, fallback_used, is_paid, started_at, completed_at, duration_ms, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
        [
          id,
          params.userId || null,
          params.projectId || null,
          params.jobId || null,
          params.provider,
          params.model,
          params.capability,
          params.status,
          params.retryCount || 0,
          params.fallbackUsed || false,
          params.isPaid || false,
          params.startedAt,
          params.completedAt,
          params.durationMs || null,
          JSON.stringify(params.metadata || {})
        ]
      );
    } else {
      const dbData = this.getJsonData();
      if (!(dbData as any).aiUsages) (dbData as any).aiUsages = [];
      (dbData as any).aiUsages.push({ id, ...params, timestamp: params.completedAt });
      this.saveJson(dbData);
    }
  }

  public async createDocument(doc: Omit<AIDocument, 'id' | 'createdAt' | 'updatedAt'>): Promise<AIDocument> {
    const id = 'doc_' + crypto.randomBytes(8).toString('hex');
    const now = new Date().toISOString();
    const newDoc: AIDocument = { ...doc, id, createdAt: now, updatedAt: now };

    if (this.isPg && this.pool) {
      await this.pool.query(
        `INSERT INTO ai_documents (id, user_id, project_id, original_file_name, storage_key, mime_type, file_extension, size_bytes, sha256, document_type, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [newDoc.id, newDoc.userId, newDoc.projectId, newDoc.originalFileName, newDoc.storageKey, newDoc.mimeType, newDoc.fileExtension, newDoc.sizeBytes, newDoc.sha256, newDoc.documentType, newDoc.status, now, now]
      );
    } else {
      const data = this.getJsonData();
      data.aiDocuments?.push(newDoc);
      this.saveJson(data);
    }
    return newDoc;
  }

  public async getDocumentsByUserId(userId: string): Promise<AIDocument[]> {
    if (this.isPg && this.pool) {
      const res = await this.pool.query('SELECT * FROM ai_documents WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
      return res.rows.map(r => this.mapDocumentFromPg(r));
    }
    return this.getJsonData().aiDocuments?.filter(d => d.userId === userId) || [];
  }

  public async getDocumentById(id: string): Promise<AIDocument | undefined> {
    if (this.isPg && this.pool) {
      const res = await this.pool.query('SELECT * FROM ai_documents WHERE id = $1', [id]);
      return res.rows[0] ? this.mapDocumentFromPg(res.rows[0]) : undefined;
    }
    return this.getJsonData().aiDocuments?.find(d => d.id === id);
  }

  public async deleteDocument(id: string): Promise<boolean> {
    if (this.isPg && this.pool) {
      const res = await this.pool.query('DELETE FROM ai_documents WHERE id = $1', [id]);
      return (res.rowCount || 0) > 0;
    }
    const data = this.getJsonData();
    const index = data.aiDocuments?.findIndex(d => d.id === id) ?? -1;
    if (index > -1) {
      data.aiDocuments?.splice(index, 1);
      this.saveJson(data);
      return true;
    }
    return false;
  }

  private mapDocumentFromPg(r: any): AIDocument {
    return {
      id: r.id,
      userId: r.user_id,
      projectId: r.project_id,
      originalFileName: r.original_file_name,
      storageKey: r.storage_key,
      mimeType: r.mime_type,
      fileExtension: r.file_extension,
      sizeBytes: parseInt(r.size_bytes),
      sha256: r.sha256,
      documentType: r.document_type,
      status: r.status,
      createdAt: r.created_at,
      updatedAt: r.updated_at
    };
  }

  // =========================================================================
  // KAYAN AI PROVIDER & MODEL MANAGEMENT HELPER METHODS
  // =========================================================================

  public async getAIProviders(): Promise<AIProviderConfig[]> {
    if (this.isPg && this.pool) {
      const res = await this.pool.query('SELECT * FROM ai_providers ORDER BY name ASC');
      return res.rows.map(r => ({
        id: r.id,
        name: r.name,
        displayName: r.display_name,
        status: r.status as any,
        type: r.type as any,
        baseUrl: r.base_url || undefined,
        createdAt: r.created_at,
        updatedAt: r.updated_at
      }));
    } else {
      const data = this.getJsonData();
      return data.aiProviders || [];
    }
  }

  public async updateAIProviderDetails(id: string, updates: Partial<AIProviderConfig>): Promise<boolean> {
    const now = new Date().toISOString();
    if (this.isPg && this.pool) {
      const res = await this.pool.query(
        `UPDATE ai_providers
         SET display_name = COALESCE($1, display_name),
             status = COALESCE($2, status),
             type = COALESCE($3, type),
             base_url = COALESCE($4, base_url),
             updated_at = $5
         WHERE id = $6`,
        [updates.displayName, updates.status, updates.type, updates.baseUrl, now, id]
      );
      return (res.rowCount || 0) > 0;
    } else {
      const data = this.getJsonData();
      const p = data.aiProviders!.find(x => x.id === id);
      if (p) {
        if (updates.displayName) p.displayName = updates.displayName;
        if (updates.status) p.status = updates.status;
        if (updates.type) p.type = updates.type;
        if (updates.baseUrl !== undefined) p.baseUrl = updates.baseUrl;
        p.updatedAt = now;
        this.saveJson(data);
        return true;
      }
      return false;
    }
  }

  public async deleteAIProvider(id: string): Promise<boolean> {
    if (this.isPg && this.pool) {
      const res = await this.pool.query('DELETE FROM ai_providers WHERE id = $1', [id]);
      return (res.rowCount || 0) > 0;
    } else {
      const data = this.getJsonData();
      const initial = data.aiProviders!.length;
      data.aiProviders = data.aiProviders!.filter(p => p.id !== id);
      this.saveJson(data);
      return data.aiProviders.length < initial;
    }
  }

  public async getAIProviderById(id: string): Promise<AIProviderConfig | null> {
    if (this.isPg && this.pool) {
      const res = await this.pool.query('SELECT * FROM ai_providers WHERE id = $1', [id]);
      if (res.rows[0]) {
        const r = res.rows[0];
        return {
          id: r.id,
          name: r.name,
          displayName: r.display_name,
          status: r.status as any,
          type: r.type as any,
          baseUrl: r.base_url || undefined,
          createdAt: r.created_at,
          updatedAt: r.updated_at
        };
      }
      return null;
    } else {
      const data = this.getJsonData();
      return (data.aiProviders || []).find(p => p.id === id) || null;
    }
  }

  public async updateAIProviderStatus(id: string, status: AIProviderConfig['status']): Promise<boolean> {
    const now = new Date().toISOString();
    if (this.isPg && this.pool) {
      const res = await this.pool.query(
        'UPDATE ai_providers SET status = $1, updated_at = $2 WHERE id = $3',
        [status, now, id]
      );
      return (res.rowCount || 0) > 0;
    } else {
      const data = this.getJsonData();
      const p = (data.aiProviders || []).find(x => x.id === id);
      if (p) {
        p.status = status;
        p.updatedAt = now;
        this.saveJson(data);
        return true;
      }
      return false;
    }
  }

  public async createAIProvider(provider: AIProviderConfig): Promise<AIProviderConfig> {
    if (this.isPg && this.pool) {
      await this.pool.query(
        `INSERT INTO ai_providers (id, name, display_name, status, type, base_url, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [provider.id, provider.name, provider.displayName, provider.status, provider.type, provider.baseUrl || null, provider.createdAt, provider.updatedAt]
      );
    } else {
      const data = this.getJsonData();
      data.aiProviders!.push(provider);
      this.saveJson(data);
    }
    return provider;
  }

  public async getAIModels(): Promise<AIModelConfig[]> {
    if (this.isPg && this.pool) {
      const res = await this.pool.query('SELECT * FROM ai_models ORDER BY priority DESC, display_name_ar ASC');
      return res.rows.map(r => ({
        id: r.id,
        providerId: r.provider_id,
        modelId: r.model_id,
        displayNameAr: r.display_name_ar,
        displayNameEn: r.display_name_en,
        active: r.active,
        defaultForCapability: r.default_for_capability || undefined,
        priority: r.priority,
        capabilities: r.capabilities || [],
        pricingClass: r.pricing_class as any,
        freeTierStatus: r.free_tier_status as any,
        maxContext: r.max_context || undefined,
        createdAt: r.created_at,
        updatedAt: r.updated_at
      }));
    } else {
      const data = this.getJsonData();
      return data.aiModels || [];
    }
  }

  public async getAIModelById(id: string): Promise<AIModelConfig | null> {
    if (this.isPg && this.pool) {
      const res = await this.pool.query('SELECT * FROM ai_models WHERE id = $1', [id]);
      if (res.rows[0]) {
        const r = res.rows[0];
        return {
          id: r.id,
          providerId: r.provider_id,
          modelId: r.model_id,
          displayNameAr: r.display_name_ar,
          displayNameEn: r.display_name_en,
          active: r.active,
          defaultForCapability: r.default_for_capability || undefined,
          priority: r.priority,
          capabilities: r.capabilities || [],
          pricingClass: r.pricing_class as any,
          freeTierStatus: r.free_tier_status as any,
          maxContext: r.max_context || undefined,
          createdAt: r.created_at,
          updatedAt: r.updated_at
        };
      }
      return null;
    } else {
      const data = this.getJsonData();
      return (data.aiModels || []).find(m => m.id === id) || null;
    }
  }

  public async updateAIModelStatus(id: string, active: boolean): Promise<boolean> {
    const now = new Date().toISOString();
    if (this.isPg && this.pool) {
      const res = await this.pool.query(
        'UPDATE ai_models SET active = $1, updated_at = $2 WHERE id = $3',
        [active, now, id]
      );
      return (res.rowCount || 0) > 0;
    } else {
      const data = this.getJsonData();
      const m = (data.aiModels || []).find(x => x.id === id);
      if (m) {
        m.active = active;
        m.updatedAt = now;
        this.saveJson(data);
        return true;
      }
      return false;
    }
  }

  public async updateAIModelDetails(id: string, updates: Partial<AIModelConfig>): Promise<boolean> {
    const now = new Date().toISOString();
    if (this.isPg && this.pool) {
      const queryParts: string[] = ['updated_at = $' + (Object.keys(updates).length + 2)];
      const values: any[] = [now, id];

      let paramIdx = 1;
      const keys = Object.keys(updates).filter(k => k !== 'id' && k !== 'createdAt' && k !== 'updatedAt');

      for (const k of keys) {
        const dbCol = k.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        queryParts.unshift(`${dbCol} = $${paramIdx}`);
        values.unshift((updates as any)[k]);
        paramIdx++;
      }

      const q = `UPDATE ai_models SET ${queryParts.join(', ')} WHERE id = $${paramIdx}`;
      const res = await this.pool.query(q, values);
      return (res.rowCount || 0) > 0;
    } else {
      const data = this.getJsonData();
      const m = (data.aiModels || []).find(x => x.id === id);
      if (m) {
        if (updates.displayNameAr !== undefined) m.displayNameAr = updates.displayNameAr;
        if (updates.displayNameEn !== undefined) m.displayNameEn = updates.displayNameEn;
        if (updates.priority !== undefined) m.priority = updates.priority;
        if (updates.defaultForCapability !== undefined) m.defaultForCapability = updates.defaultForCapability;
        if (updates.capabilities !== undefined) m.capabilities = updates.capabilities;
        if (updates.freeTierStatus !== undefined) m.freeTierStatus = updates.freeTierStatus;
        if (updates.pricingClass !== undefined) m.pricingClass = updates.pricingClass;
        m.updatedAt = now;
        this.saveJson(data);
        return true;
      }
      return false;
    }
  }

  public async createAIModel(model: AIModelConfig): Promise<AIModelConfig> {
    if (this.isPg && this.pool) {
      await this.pool.query(
        `INSERT INTO ai_models (id, provider_id, model_id, display_name_ar, display_name_en, active, default_for_capability, priority, capabilities, pricing_class, free_tier_status, max_context, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
        [model.id, model.providerId, model.modelId, model.displayNameAr, model.displayNameEn, model.active, model.defaultForCapability || null, model.priority, model.capabilities, model.pricingClass, model.freeTierStatus, model.maxContext || null, model.createdAt, model.updatedAt]
      );
    } else {
      const data = this.getJsonData();
      data.aiModels!.push(model);
      this.saveJson(data);
    }
    return model;
  }

  public async deleteAIModel(id: string): Promise<boolean> {
    if (this.isPg && this.pool) {
      const res = await this.pool.query('DELETE FROM ai_models WHERE id = $1', [id]);
      return (res.rowCount || 0) > 0;
    } else {
      const data = this.getJsonData();
      const initial = data.aiModels!.length;
      data.aiModels = data.aiModels!.filter(m => m.id !== id);
      this.saveJson(data);
      return data.aiModels.length < initial;
    }
  }

  public async getAISettings(): Promise<AISettings> {
    if (this.isPg && this.pool) {
      const res = await this.pool.query('SELECT * FROM ai_settings LIMIT 1');
      if (res.rows[0]) {
        const r = res.rows[0];
        return {
          id: r.id,
          routingMode: r.routing_mode as any,
          allowPaidFallback: r.allow_paid_fallback,
          maxRetryAttempts: r.max_retry_attempts,
          updatedAt: r.updated_at
        };
      }
    }
    const data = this.getJsonData();
    return data.aiSettings![0];
  }

  public async updateAISettings(updates: Partial<AISettings>): Promise<AISettings> {
    const now = new Date().toISOString();
    if (this.isPg && this.pool) {
      await this.pool.query(
        `UPDATE ai_settings
         SET routing_mode = COALESCE($1, routing_mode),
             allow_paid_fallback = COALESCE($2, allow_paid_fallback),
             max_retry_attempts = COALESCE($3, max_retry_attempts),
             updated_at = $4`,
        [updates.routingMode, updates.allowPaidFallback, updates.maxRetryAttempts, now]
      );
      return await this.getAISettings();
    } else {
      const data = this.getJsonData();
      const s = data.aiSettings![0];
      if (updates.routingMode) s.routingMode = updates.routingMode;
      if (updates.allowPaidFallback !== undefined) s.allowPaidFallback = updates.allowPaidFallback;
      if (updates.maxRetryAttempts !== undefined) s.maxRetryAttempts = updates.maxRetryAttempts;
      s.updatedAt = now;
      this.saveJson(data);
      return s;
    }
  }

  public async getAIUsageStats(): Promise<AIUsageStats[]> {
    if (this.isPg && this.pool) {
      const res = await this.pool.query(`
        SELECT
          provider as "providerId",
          model as "modelId",
          capability,
          COUNT(*) FILTER (WHERE status = 'completed') as "successCount",
          COUNT(*) FILTER (WHERE status = 'failed' AND (metadata->>'error' NOT LIKE '%quota%' AND metadata->>'error' NOT LIKE '%Rate limit%')) as "failedCount",
          COUNT(*) FILTER (WHERE status = 'failed' AND (metadata->>'error' LIKE '%quota%' OR metadata->>'error' LIKE '%Rate limit%')) as "quotaErrorCount",
          AVG(duration_ms) as "avgDurationMs"
        FROM ai_usages
        GROUP BY provider, model, capability
      `);
      return res.rows.map(r => ({
        providerId: r.providerId,
        modelId: r.modelId,
        capability: r.capability,
        successCount: parseInt(r.successCount, 10),
        failedCount: parseInt(r.failedCount, 10),
        quotaErrorCount: parseInt(r.quotaErrorCount, 10),
        avgDurationMs: parseFloat(r.avgDurationMs) || 0
      }));
    } else {
      const data = this.getJsonData();
      const usages = (data as any).aiUsages || [];
      const statsMap = new Map<string, AIUsageStats>();

      for (const u of usages) {
        const key = `${u.provider}:${u.model}:${u.capability}`;
        if (!statsMap.has(key)) {
          statsMap.set(key, { providerId: u.provider, modelId: u.model, capability: u.capability, successCount: 0, failedCount: 0, quotaErrorCount: 0, avgDurationMs: 0 });
        }
        const s = statsMap.get(key)!;
        if (u.status === 'completed') s.successCount++;
        else if (u.status === 'failed') {
          const errMsg = (u.metadata?.error || '').toLowerCase();
          if (errMsg.includes('quota') || errMsg.includes('rate limit')) s.quotaErrorCount++;
          else s.failedCount++;
        }
      }
      return Array.from(statsMap.values());
    }
  }

  public async getUserKeys(userId: string): Promise<AIUserKeyConfig[]> {
    if (this.isPg && this.pool) {
      const res = await this.pool.query('SELECT * FROM ai_user_keys WHERE user_id = $1', [userId]);
      return res.rows.map(r => ({
        id: r.id,
        userId: r.user_id,
        providerId: r.provider_id,
        encryptedApiKey: r.encrypted_api_key,
        ivHex: r.iv_hex,
        tagHex: r.tag_hex,
        createdAt: r.created_at,
        updatedAt: r.updated_at
      }));
    } else {
      const data = this.getJsonData();
      return (data.aiUserKeys || []).filter(k => k.userId === userId);
    }
  }

  public async getUserKeyForProvider(userId: string, providerId: string): Promise<AIUserKeyConfig | null> {
    if (this.isPg && this.pool) {
      const res = await this.pool.query('SELECT * FROM ai_user_keys WHERE user_id = $1 AND provider_id = $2', [userId, providerId]);
      if (res.rows[0]) {
        const r = res.rows[0];
        return {
          id: r.id,
          userId: r.user_id,
          providerId: r.provider_id,
          encryptedApiKey: r.encrypted_api_key,
          ivHex: r.iv_hex,
          tagHex: r.tag_hex,
          createdAt: r.created_at,
          updatedAt: r.updated_at
        };
      }
      return null;
    } else {
      const data = this.getJsonData();
      return (data.aiUserKeys || []).find(k => k.userId === userId && k.providerId === providerId) || null;
    }
  }

  public async saveUserKey(userId: string, providerId: string, apiKey: string): Promise<AIUserKeyConfig> {
    const now = new Date().toISOString();
    const { encryptedText, iv, tag } = encrypt(apiKey);

    const existing = await this.getUserKeyForProvider(userId, providerId);
    if (existing) {
      if (this.isPg && this.pool) {
        await this.pool.query(
          'UPDATE ai_user_keys SET encrypted_api_key = $1, iv_hex = $2, tag_hex = $3, updated_at = $4 WHERE id = $5',
          [encryptedText, iv, tag, now, existing.id]
        );
      } else {
        const data = this.getJsonData();
        const key = data.aiUserKeys!.find(k => k.id === existing.id);
        if (key) {
          key.encryptedApiKey = encryptedText;
          key.ivHex = iv;
          key.tagHex = tag;
          key.updatedAt = now;
          this.saveJson(data);
        }
      }
      return {
        ...existing,
        encryptedApiKey: encryptedText,
        ivHex: iv,
        tagHex: tag,
        updatedAt: now
      };
    } else {
      const id = 'ukey_' + crypto.randomBytes(8).toString('hex');
      const ukey: AIUserKeyConfig = {
        id,
        userId,
        providerId,
        encryptedApiKey: encryptedText,
        ivHex: iv,
        tagHex: tag,
        createdAt: now,
        updatedAt: now
      };

      if (this.isPg && this.pool) {
        await this.pool.query(
          `INSERT INTO ai_user_keys (id, user_id, provider_id, encrypted_api_key, iv_hex, tag_hex, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [id, userId, providerId, encryptedText, iv, tag, now, now]
        );
      } else {
        const data = this.getJsonData();
        data.aiUserKeys!.push(ukey);
        this.saveJson(data);
      }
      return ukey;
    }
  }

  public async deleteUserKey(userId: string, providerId: string): Promise<boolean> {
    if (this.isPg && this.pool) {
      const res = await this.pool.query('DELETE FROM ai_user_keys WHERE user_id = $1 AND provider_id = $2', [userId, providerId]);
      return (res.rowCount || 0) > 0;
    } else {
      const data = this.getJsonData();
      const initial = data.aiUserKeys!.length;
      data.aiUserKeys = data.aiUserKeys!.filter(k => !(k.userId === userId && k.providerId === providerId));
      this.saveJson(data);
      return data.aiUserKeys.length < initial;
    }
  }
}

export const db = new PostgresOrJsonDatabase();
