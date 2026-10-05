export type Language = 'ar' | 'en';

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
  currentRelease?: Release;
  releases?: Release[];
  screenshots?: Screenshot[];
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

export interface Product {
  id: string;
  slug: string;
  type: 'android_app' | 'desktop_software' | 'ebook' | 'template' | 'course' | 'audio' | 'design' | 'file' | 'other';
  nameAr: string;
  nameEn: string;
  shortDescAr: string;
  shortDescEn: string;
  fullDescAr: string;
  fullDescEn: string;
  featuresAr: string[];
  featuresEn: string[];
  category: string;
  author: string;
  publisher?: string;
  pages?: number;
  language?: string;
  isbn?: string;
  versionName?: string;
  versionCode?: number;
  packageName?: string;
  minAndroid?: string;
  releaseNotesAr?: string;
  releaseNotesEn?: string;
  sha256?: string;
  price: number;
  currency: string;
  tags: string[];
  license: string;
  isPublished: boolean;
  featured?: boolean;
  status: 'draft' | 'published' | 'archived';
  iconUrl?: string;
  coverUrl?: string;
  bannerUrl?: string;
  videoUrl?: string;
  videoTitle?: string;
  createdAt: string;
  updatedAt: string;
  files?: ProductFile[];
  media?: Media[];
}

export interface ProductFile {
  id: string;
  productId: string;
  fileUrl: string;
  title: string;
  fileType: 'MAIN' | 'PREVIEW' | 'SUPPLEMENTARY' | 'GUIDE' | 'README' | string;
  originalName?: string;
  size: string;
  sizeBytes: number;
  sha256?: string;
  isMain: boolean;
  createdAt: string;
}

export interface Media {
  id: string;
  appId?: string;
  productId?: string;
  mediaType: 'cover' | 'screenshot' | 'video' | 'banner' | 'gallery';
  fileUrl?: string;
  thumbnailUrl?: string;
  externalUrl?: string;
  titleAr?: string;
  titleEn?: string;
  altAr?: string;
  altEn?: string;
  sortOrder: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  passwordHash?: string;
  createdAt?: string;
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

export interface DashboardStats {
  totalApps: number;
  publishedApps: number;
  draftApps: number;
  totalReleases: number;
  recentActivity: ActivityLog[];
}

// ==========================================
// USER & CUSTOMER DOMAIN MODELS
// ==========================================

export interface User {
  id: string;
  email: string;
  name: string;
  displayName?: string;
  avatarUrl?: string;
  role: 'customer' | 'publisher' | 'admin';
  createdAt: string;
  updatedAt: string;
}

export interface UserSession {
  id: string;
  userId: string;
  token: string;
  expiresAt: number;
  createdAt: string;
}

export interface Favorite {
  id: string;
  userId: string;
  productId: string;
  createdAt: string;
}

export interface Review {
  id: string;
  userId: string;
  productId: string;
  rating: number;
  commentAr?: string;
  commentEn?: string;
  isVerifiedPurchase: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Download {
  id: string;
  userId?: string;
  productId: string;
  fileId: string;
  ipAddress?: string;
  downloadedAt: string;
}

export interface Order {
  id: string;
  userId: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  totalAmount: number;
  currency: string;
  items: OrderItem[];
  paymentMethod?: string;
  paymentTransactionId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  unitPrice: number;
  currency: string;
}

export interface Entitlement {
  id: string;
  userId: string;
  productId: string;
  orderId?: string;
  licenseKey?: string;
  expiresAt?: string;
  createdAt: string;
}

export interface Publisher {
  id: string;
  nameAr: string;
  nameEn: string;
  slug: string;
  bioAr?: string;
  bioEn?: string;
  logoUrl?: string;
  websiteUrl?: string;
  verified: boolean;
  createdAt: string;
}

// ==========================================
// KAYAN AI DOMAIN MODELS
// ==========================================

export interface AIProject {
  id: string;
  userId: string;
  name: string;
  description?: string;
  type?: string;
  status: 'active' | 'archived';
  specification?: any;
  architecture?: any;
  pir?: any;
  generatedArtifacts?: any;
  createdAt: string;
  updatedAt: string;
}

export interface AIDocument {
  id: string;
  userId: string;
  projectId?: string;
  originalFileName: string;
  storageKey: string;
  mimeType: string;
  fileExtension: string;
  sizeBytes: number;
  sha256: string;
  documentType: 'pdf' | 'docx' | 'doc' | 'xlsx' | 'xls' | 'csv' | 'jpg' | 'jpeg' | 'png' | 'webp';
  status: 'UPLOADED' | 'PROCESSING' | 'READY' | 'FAILED';
  createdAt: string;
  updatedAt: string;
}

export type AIJobStatus = 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';

export interface AIJob {
  id: string;
  projectId?: string;
  userId?: string;
  type:
    | 'text'
    | 'image'
    | 'video'
    | 'code'
    | 'file_analysis'
    | 'image_understanding'
    | 'app_generation'
    | 'vision_analysis'
    | 'image_to_prompt'
    | 'ui_analysis'
    | 'screenshot_to_code';
  provider: string;
  model: string;
  status: AIJobStatus;
  prompt: string;
  params?: Record<string, any>;
  result?: Record<string, any>;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AIAsset {
  id: string;
  jobId?: string;
  projectId?: string;
  userId?: string;
  assetType: 'image' | 'video' | 'audio' | 'code' | 'document';
  url: string;
  mimeType: string;
  sizeBytes?: number;
  sha256?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface AIUsage {
  id: string;
  userId?: string;
  projectId?: string;
  jobId?: string;
  provider: string;
  model: string;
  capability: string;
  status: 'completed' | 'failed' | 'rate_limited' | 'error';
  retryCount: number;
  fallbackUsed: boolean;
  isPaid: boolean;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  durationMs: number;
  metadata?: any;
  timestamp: string;
}

export interface CreditAccount {
  id: string;
  userId: string;
  balance: number;
  currency: string;
  updatedAt: string;
}

export interface AIProviderConfig {
  id: string;
  name: string;
  displayName: string;
  status: 'LIVE' | 'NOT_CONFIGURED' | 'STUB' | 'DISABLED' | 'ERROR';
  type: 'GEMINI' | 'OPENAI' | 'ANTHROPIC' | 'OPENROUTER' | 'CUSTOM';
  baseUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AIModelConfig {
  id: string;
  providerId: string;
  modelId: string;
  displayNameAr: string;
  displayNameEn: string;
  active: boolean;
  defaultForCapability?: string;
  priority: number;
  capabilities: string[];
  inputTypes?: string[];
  outputTypes?: string[];
  pricingClass: 'FREE' | 'PAID' | 'UNKNOWN';
  freeTierStatus: 'FREE' | 'PAID' | 'UNKNOWN' | 'REQUIRES_BILLING';
  maxContext?: number;
  createdAt: string;
  updatedAt: string;
}

export interface AIUserKeyConfig {
  id: string;
  userId: string;
  providerId: string;
  encryptedApiKey: string;
  ivHex: string;
  tagHex: string;
  createdAt: string;
  updatedAt: string;
}

export interface AISettings {
  id: string;
  routingMode: 'AUTO' | 'FREE_FIRST' | 'USER_SELECTED' | 'PROVIDER_SELECTED';
  allowPaidFallback: boolean;
  maxRetryAttempts: number;
  updatedAt: string;
}

export interface AIUsageStats {
  providerId: string;
  modelId: string;
  capability: string;
  successCount: number;
  failedCount: number;
  quotaErrorCount: number;
  avgDurationMs: number;
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'discount' | 'new_product' | 'update' | 'promo' | string;
  icon?: string;
  link?: string;
  productId?: string;
  startAt: string;
  endAt: string;
  priority: number;
  displayOrder: number;
  active: boolean;
  dismissible: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NewsSource {
  id: string;
  name: string;
  url: string;
  providerType: 'gnews' | 'newsapi' | 'rss' | string;
  enabled: boolean;
  country: string;
  errorCount: number;
  lastSuccessAt?: string;
  lastError?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NewsLocation {
  id: string;
  nameAr: string;
  nameEn: string;
  countryCode: string; // e.g., 'YE', 'SA', 'US', 'GLOBAL'
  parentId?: string; // for city/district belonging to governorate/country
  type: 'country' | 'governorate' | 'city' | 'district';
  createdAt: string;
  updatedAt: string;
}

export interface NewsLocationAlias {
  id: string;
  locationId: string;
  alias: string;
  language: string; // 'ar' | 'en'
  createdAt: string;
}

export interface NewsArticle {
  id: string;
  sourceId?: string;
  sourceName?: string;
  title: string;
  originalTitle: string;
  description?: string;
  content?: string;
  url: string;
  canonicalUrl: string;
  contentHash: string;
  imageUrl?: string;
  language: string;
  country: string;
  regionId?: string;
  regionName?: string;
  category: string;
  publishedAt: string;
  aiTitle?: string;
  aiSummary?: string;
  aiKeyPoints?: string[];
  aiLocationVerified?: boolean;
  aiProcessed: boolean;
  aiError?: string;
  fetchedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface NewsFetchJob {
  id: string;
  startedAt: string;
  finishedAt?: string;
  status: 'running' | 'success' | 'failed' | 'partial';
  sourcesChecked: number;
  articlesFound: number;
  articlesNew: number;
  articlesDuplicate: number;
  articlesAiProcessed: number;
  articlesFailed: number;
  errorMessage?: string;
}

export interface NewsSettings {
  id: string;
  updateIntervalMinutes: number;
  enabled: boolean;
  lastRunAt?: string;
  updatedAt: string;
}

