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

export interface AdminUser {
  id: string;
  username: string;
  email: string;
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
