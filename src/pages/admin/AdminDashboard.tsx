import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { Application, Release, DashboardStats, ActivityLog } from '../../types.ts';
import { 
  Shield, Key, Lock, LogOut, Plus, Edit3, Trash2, 
  Upload, FileText, Smartphone, Hash, CheckCircle2, 
  AlertTriangle, RefreshCw, Eye, EyeOff, Layers, 
  HardDrive, Calendar, ArrowRight, ArrowLeft, Clock,
  X, Check, AlertCircle
} from 'lucide-react';

interface AdminDashboardProps {
  onNavigate: (path: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const { lang, dir } = useLanguage();
  const { admin, loading: authLoading, token, login, logout } = useAuth();

  // Login form state
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginSubmitting, setLoginSubmitting] = useState(false);

  // Dashboard state
  const [activeTab, setActiveTab] = useState<'overview' | 'apps' | 'releases' | 'activity' | 'security'>('overview');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [apps, setApps] = useState<Application[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // App Modal State (Create / Edit)
  const [appModalOpen, setAppModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<Application | null>(null);
  const [appForm, setAppForm] = useState({
    nameAr: '',
    nameEn: '',
    slug: '',
    shortDescAr: '',
    shortDescEn: '',
    fullDescAr: '',
    fullDescEn: '',
    featuresAr: '',
    featuresEn: '',
    category: 'Tools & Documents',
    minAndroid: '7.0 / API 24',
    packageName: '',
    iconUrl: '/src/assets/images/kayan_pdf_icon_1790438337873.jpg',
    bannerUrl: '/src/assets/images/kayan_pdf_feature_banner_1790438354730.jpg',
    privacyUrl: '/privacy',
    termsUrl: '/terms',
    copyright: '© 2026 المهندس جهاد الصليحي. جميع الحقوق محفوظة.',
    isPublished: true,
    featured: false
  });
  const [appFormError, setAppFormError] = useState<string | null>(null);
  const [appFormSubmitting, setAppFormSubmitting] = useState(false);

  // Release Modal State
  const [releaseModalOpen, setReleaseModalOpen] = useState(false);
  const [selectedAppForRelease, setSelectedAppForRelease] = useState<Application | null>(null);
  const [releaseForm, setReleaseForm] = useState({
    versionName: '',
    versionCode: 1,
    apkFileName: '',
    apkSize: '',
    apkSizeBytes: 0,
    sha256: '',
    minAndroid: '7.0 / API 24',
    releaseNotesAr: '',
    releaseNotesEn: '',
    isCurrent: true
  });
  const [apkUploading, setApkUploading] = useState(false);
  const [apkUploadResult, setApkUploadResult] = useState<any>(null);
  const [releaseFormError, setReleaseFormError] = useState<string | null>(null);
  const [releaseFormSubmitting, setReleaseFormSubmitting] = useState(false);

  // Password Change state
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [pwMessage, setPwMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [pwSubmitting, setPwSubmitting] = useState(false);

  // Load Admin Data
  const loadDashboardData = async () => {
    if (!admin) return;
    setLoadingData(true);
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
      const [statsRes, appsRes, logsRes] = await Promise.all([
        fetch('/api/admin/dashboard-stats', { headers }),
        fetch('/api/admin/apps', { headers }),
        fetch('/api/admin/activity', { headers })
      ]);

      const [statsData, appsData, logsData] = await Promise.all([
        statsRes.json(),
        appsRes.json(),
        logsRes.json()
      ]);

      if (statsData.success) setStats(statsData.stats);
      if (appsData.success) setApps(appsData.apps);
      if (logsData.success) setActivityLogs(logsData.logs);
    } catch (err) {
      console.error('Error fetching dashboard data', err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (admin) {
      loadDashboardData();
    }
  }, [admin]);

  // Handle Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginSubmitting(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: usernameInput, password: passwordInput })
      });
      const data = await res.json();
      if (data.success && data.admin && data.token) {
        login(data.token, data.admin);
      } else {
        setLoginError(data.error || 'فشل تسجيل الدخول. يرجى التحقق من صحة البيانات.');
      }
    } catch {
      setLoginError('تعذر الاتصال بالخادم.');
    } finally {
      setLoginSubmitting(false);
    }
  };

  // Open Create App Modal
  const openCreateAppModal = () => {
    setEditingApp(null);
    setAppForm({
      nameAr: '',
      nameEn: '',
      slug: '',
      shortDescAr: '',
      shortDescEn: '',
      fullDescAr: '',
      fullDescEn: '',
      featuresAr: 'تحويل الصور إلى PDF\nمسح المستندات بالكاميرا\nمعالجة محلية 100%',
      featuresEn: 'Images to PDF\nCamera to PDF\n100% Offline Processing',
      category: 'Tools & Documents',
      minAndroid: '7.0 / API 24',
      packageName: 'com.kayansoft.',
      iconUrl: '/src/assets/images/kayan_pdf_icon_1790438337873.jpg',
      bannerUrl: '/src/assets/images/kayan_pdf_feature_banner_1790438354730.jpg',
      privacyUrl: '/privacy',
      termsUrl: '/terms',
      copyright: '© 2026 المهندس جهاد الصليحي. جميع الحقوق محفوظة.',
      isPublished: true,
      featured: false
    });
    setAppFormError(null);
    setAppModalOpen(true);
  };

  // Open Edit App Modal
  const openEditAppModal = (appItem: Application) => {
    setEditingApp(appItem);
    setAppForm({
      nameAr: appItem.nameAr,
      nameEn: appItem.nameEn,
      slug: appItem.slug,
      shortDescAr: appItem.shortDescAr,
      shortDescEn: appItem.shortDescEn,
      fullDescAr: appItem.fullDescAr,
      fullDescEn: appItem.fullDescEn,
      featuresAr: appItem.featuresAr?.join('\n') || '',
      featuresEn: appItem.featuresEn?.join('\n') || '',
      category: appItem.category,
      minAndroid: appItem.minAndroid,
      packageName: appItem.packageName,
      iconUrl: appItem.iconUrl,
      bannerUrl: appItem.bannerUrl,
      privacyUrl: appItem.privacyUrl,
      termsUrl: appItem.termsUrl,
      copyright: appItem.copyright,
      isPublished: appItem.isPublished,
      featured: appItem.featured
    });
    setAppFormError(null);
    setAppModalOpen(true);
  };

  // Handle Save App
  const handleSaveApp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAppFormError(null);
    setAppFormSubmitting(true);

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const payload = {
      ...appForm,
      featuresAr: appForm.featuresAr.split('\n').map(s => s.trim()).filter(Boolean),
      featuresEn: appForm.featuresEn.split('\n').map(s => s.trim()).filter(Boolean)
    };

    try {
      const url = editingApp ? `/api/admin/apps/${editingApp.id}` : '/api/admin/apps';
      const method = editingApp ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setAppModalOpen(false);
        loadDashboardData();
      } else {
        setAppFormError(data.error || 'حدث خطأ أثناء حفظ التطبيق');
      }
    } catch {
      setAppFormError('تعذر الاتصال بالخادم');
    } finally {
      setAppFormSubmitting(false);
    }
  };

  // Toggle Publish
  const handleTogglePublish = async (appId: string) => {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
      const res = await fetch(`/api/admin/apps/${appId}/toggle-publish`, {
        method: 'POST',
        headers
      });
      const data = await res.json();
      if (data.success) {
        loadDashboardData();
      }
    } catch (err) {
      console.error('Failed to toggle publish', err);
    }
  };

  // Delete App
  const handleDeleteApp = async (appItem: Application) => {
    if (!confirm(`هل أنت متأكد من حذف التطبيق "${appItem.nameAr}" وجميع إصداراته؟`)) return;

    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
      const res = await fetch(`/api/admin/apps/${appItem.id}`, {
        method: 'DELETE',
        headers
      });
      const data = await res.json();
      if (data.success) {
        loadDashboardData();
      }
    } catch (err) {
      console.error('Failed to delete app', err);
    }
  };

  // Open Release Modal
  const openCreateReleaseModal = (appItem: Application) => {
    setSelectedAppForRelease(appItem);
    setReleaseForm({
      versionName: '1.0.1',
      versionCode: 2,
      apkFileName: '',
      apkSize: '',
      apkSizeBytes: 0,
      sha256: '',
      minAndroid: appItem.minAndroid || '7.0 / API 24',
      releaseNotesAr: 'تحسينات في الأداء وسرعة المعالجة المحلية.',
      releaseNotesEn: 'Performance enhancements and faster local processing.',
      isCurrent: true
    });
    setApkUploadResult(null);
    setReleaseFormError(null);
    setReleaseModalOpen(true);
  };

  // Handle APK File Upload and Automatic SHA-256 / Size calculation
  const handleApkFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.apk')) {
      setReleaseFormError('يرجى اختيار ملف بامتداد .apk صالح');
      return;
    }

    setApkUploading(true);
    setReleaseFormError(null);
    setApkUploadResult(null);

    const formData = new FormData();
    formData.append('apkFile', file);

    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
      const res = await fetch('/api/admin/upload-apk', {
        method: 'POST',
        headers,
        body: formData
      });

      const responseText = await res.text();
      let data: any = null;
      try {
        data = JSON.parse(responseText);
      } catch {
        setReleaseFormError(`خطأ خادم استجابة غير صالحة (رمز ${res.status}): ${responseText.slice(0, 300) || res.statusText}`);
        return;
      }

      if (res.ok && data.success && data.fileInfo) {
        setApkUploadResult(data.fileInfo);
        // Automatically populate server-verified fields
        setReleaseForm(prev => ({
          ...prev,
          apkFileName: data.fileInfo.fileName,
          apkSize: data.fileInfo.sizeFormatted,
          apkSizeBytes: data.fileInfo.sizeBytes,
          sha256: data.fileInfo.sha256,
          apkDownloadUrl: data.fileInfo.downloadUrl || ''
        }));
      } else {
        setReleaseFormError(`خطأ الخادم (رمز ${res.status}): ${data.error || 'فشل التحقق من ملف APK'}`);
      }
    } catch (err: any) {
      setReleaseFormError(`تعذر الاتصال بالخادم أثناء رفع ملف APK: ${err.message || err}`);
    } finally {
      setApkUploading(false);
    }
  };

  // Handle Save Release
  const handleSaveRelease = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppForRelease) return;

    if (!releaseForm.apkFileName || !releaseForm.sha256 || !apkUploadResult) {
      setReleaseFormError('يرجى رفع ملف APK للتحقق منه وحساب بصمة SHA-256 تلقائياً');
      return;
    }

    setReleaseFormError(null);
    setReleaseFormSubmitting(true);

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
      const res = await fetch('/api/admin/releases', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          appId: selectedAppForRelease.id,
          ...releaseForm,
          packageNameCandidate: apkUploadResult.packageNameCandidate
        })
      });
      const data = await res.json();
      if (data.success) {
        setReleaseModalOpen(false);
        loadDashboardData();
      } else {
        setReleaseFormError(data.error || 'فشل إضافة الإصدار');
      }
    } catch {
      setReleaseFormError('تعذر الاتصال بالخادم');
    } finally {
      setReleaseFormSubmitting(false);
    }
  };

  // Handle Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMessage(null);
    setPwSubmitting(true);

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
      const res = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers,
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw })
      });
      const data = await res.json();
      if (data.success) {
        setPwMessage({ type: 'success', text: 'تم تحديث كلمة المرور بنجاح' });
        setCurrentPw('');
        setNewPw('');
      } else {
        setPwMessage({ type: 'error', text: data.error || 'فشل تحديث كلمة المرور' });
      }
    } catch {
      setPwMessage({ type: 'error', text: 'تعذر الاتصال بالخادم' });
    } finally {
      setPwSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-3 border-sky-600 border-t-transparent mb-4" />
        <p className="text-sm text-slate-500">جاري التحقق من هوية المسؤول...</p>
      </div>
    );
  }

  // If Not Authenticated, render Secure Login Form
  if (!admin) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-start">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xl">
          
          <div className="flex flex-col items-center text-center space-y-3 mb-6 pb-4 border-b border-slate-100">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-600 text-white shadow-sm">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {lang === 'ar' ? 'بوابة إدارة متجر كيان' : 'Kayan Store Admin Portal'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {lang === 'ar' ? 'سجل الدخول لإدارة التطبيقات والإصدارات' : 'Sign in to manage apps, releases and integrity'}
              </p>
            </div>
          </div>

          {loginError && (
            <div className="mb-4 rounded-xl bg-rose-50 p-3 text-xs text-rose-800 border border-rose-200 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                {lang === 'ar' ? 'اسم المستخدم' : 'Username'}
              </label>
              <input
                type="text"
                required
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder="admin"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-sm text-slate-900 focus:bg-white focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                {lang === 'ar' ? 'كلمة المرور' : 'Password'}
              </label>
              <input
                type="password"
                required
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="••••••••••••"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-sm text-slate-900 focus:bg-white focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              />
            </div>

            <button
              type="submit"
              disabled={loginSubmitting}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-sky-600 py-3 text-xs font-bold text-white shadow-sm hover:bg-sky-500 transition-all active:scale-98 disabled:opacity-75"
            >
              {loginSubmitting ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <Key className="h-4 w-4" />
                  <span>{lang === 'ar' ? 'تسجيل الدخول' : 'Sign In'}</span>
                </>
              )}
            </button>
          </form>

        </div>
      </div>
    );
  }

  // Logged-in Admin Dashboard View
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-8 text-start">
      
      {/* Top Admin Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm">
            <Shield className="h-6 w-6 text-sky-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-sky-600">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
              <span>جلسة مسؤول نشطة</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono">{admin.username}</span>
            </div>
            <h1 className="text-xl font-extrabold text-slate-900">
              {lang === 'ar' ? 'لوحة تحكم متجر كيان' : 'Kayan Store Dashboard'}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={openCreateAppModal}
            className="flex items-center gap-1.5 rounded-xl bg-sky-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-sky-500 transition-all active:scale-98"
          >
            <Plus className="h-4 w-4" />
            <span>{lang === 'ar' ? 'إضافة تطبيق جديد' : 'New Application'}</span>
          </button>

          <button
            onClick={loadDashboardData}
            disabled={loadingData}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
            title="تحديث البيانات"
          >
            <RefreshCw className={`h-4 w-4 ${loadingData ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={logout}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 hover:border-rose-200 transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>{lang === 'ar' ? 'خروج' : 'Logout'}</span>
          </button>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
            activeTab === 'overview' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          {lang === 'ar' ? 'نظرة عامة' : 'Overview'}
        </button>
        <button
          onClick={() => setActiveTab('apps')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
            activeTab === 'apps' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          {lang === 'ar' ? 'إدارة التطبيقات' : 'Applications'} ({apps.length})
        </button>
        <button
          onClick={() => setActiveTab('activity')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
            activeTab === 'activity' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          {lang === 'ar' ? 'سجل العمليات' : 'Activity Logs'}
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
            activeTab === 'security' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          {lang === 'ar' ? 'الأمان وكلمة المرور' : 'Security Settings'}
        </button>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">إجمالي التطبيقات</span>
              <div className="mt-2 text-2xl font-mono font-bold text-slate-900">
                {stats?.totalApps || apps.length}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <span className="text-xs text-emerald-600 font-medium">التطبيقات المنشورة</span>
              <div className="mt-2 text-2xl font-mono font-bold text-emerald-700">
                {stats?.publishedApps || apps.filter(a => a.isPublished).length}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <span className="text-xs text-amber-600 font-medium">المسودات غير المنشورة</span>
              <div className="mt-2 text-2xl font-mono font-bold text-amber-700">
                {stats?.draftApps || apps.filter(a => !a.isPublished).length}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <span className="text-xs text-sky-600 font-medium">إجمالي حزم APK المعتمدة</span>
              <div className="mt-2 text-2xl font-mono font-bold text-sky-700">
                {stats?.totalReleases || 1}
              </div>
            </div>
          </div>

          {/* Quick Apps Summary */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">التطبيقات النشطة</h3>
              <button
                onClick={() => setActiveTab('apps')}
                className="text-xs font-semibold text-sky-600 hover:text-sky-700"
              >
                عرض الكل
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {apps.map(appItem => (
                <div key={appItem.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={appItem.iconUrl}
                      alt={appItem.nameAr}
                      className="h-10 w-10 rounded-xl object-contain bg-slate-50 p-1 border border-slate-100"
                    />
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{appItem.nameAr} ({appItem.nameEn})</h4>
                      <p className="text-xs text-slate-500 font-mono">{appItem.packageName}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                      appItem.isPublished ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {appItem.isPublished ? 'منشور' : 'مسودة'}
                    </span>
                    <button
                      onClick={() => openCreateReleaseModal(appItem)}
                      className="flex items-center gap-1 rounded-lg bg-sky-50 text-sky-700 px-2.5 py-1 text-xs font-semibold hover:bg-sky-100 transition-colors"
                    >
                      <Upload className="h-3 w-3" />
                      <span>إصدار جديد</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Applications Table */}
      {activeTab === 'apps' && (
        <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">دليل تطبيقات كيان سوفت</h3>
              <p className="text-xs text-slate-500 mt-0.5">إدارة تفاصيل الحزم، النصوص، والشروط القانونية لكل تطبيق.</p>
            </div>
            <button
              onClick={openCreateAppModal}
              className="flex items-center gap-1.5 rounded-xl bg-sky-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-sky-500 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>إضافة تطبيق</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="p-4 font-semibold text-start">التطبيق</th>
                  <th className="p-4 font-semibold text-start">الحزمة (Package Name)</th>
                  <th className="p-4 font-semibold text-start">القسم</th>
                  <th className="p-4 font-semibold text-start">الحالة</th>
                  <th className="p-4 font-semibold text-start">الإصدار الحالي</th>
                  <th className="p-4 font-semibold text-end">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {apps.map(appItem => (
                  <tr key={appItem.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={appItem.iconUrl}
                          alt={appItem.nameAr}
                          className="h-9 w-9 rounded-xl object-contain bg-slate-50 p-1 border border-slate-200"
                        />
                        <div>
                          <span className="font-bold text-slate-900 block">{appItem.nameAr}</span>
                          <span className="text-[11px] text-slate-500">{appItem.nameEn}</span>
                        </div>
                      </div>
                    </td>

                    <td className="p-4 font-mono text-[11px] text-slate-600">
                      {appItem.packageName}
                    </td>

                    <td className="p-4">
                      <span className="text-slate-700 font-medium">{appItem.category}</span>
                    </td>

                    <td className="p-4">
                      <button
                        onClick={() => handleTogglePublish(appItem.id)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors ${
                          appItem.isPublished
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                            : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                        }`}
                      >
                        {appItem.isPublished ? <Check className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                        <span>{appItem.isPublished ? 'منشور للعامة' : 'مسودة مخفية'}</span>
                      </button>
                    </td>

                    <td className="p-4 font-mono text-[11px]">
                      {appItem.currentRelease ? (
                        <span className="font-semibold text-sky-700">v{appItem.currentRelease.versionName} ({appItem.currentRelease.apkSize})</span>
                      ) : (
                        <span className="text-slate-400">لا يوجد إصدار</span>
                      )}
                    </td>

                    <td className="p-4 text-end">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openCreateReleaseModal(appItem)}
                          className="p-1.5 text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                          title="إضافة إصدار APK جديد"
                        >
                          <Upload className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openEditAppModal(appItem)}
                          className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                          title="تعديل بيانات التطبيق"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteApp(appItem)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="حذف التطبيق"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Activity Logs */}
      {activeTab === 'activity' && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900">سجل تدقيق العمليات والأنشطة (Activity Log)</h3>
          <div className="space-y-3">
            {activityLogs.map(log => (
              <div key={log.id} className="flex items-start justify-between gap-4 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 font-semibold text-slate-900">
                    <span className="font-mono text-sky-700">[{log.action}]</span>
                    <span>{log.details}</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">بواسطة: {log.adminUsername}</span>
                </div>
                <span className="text-[11px] text-slate-400 shrink-0 font-mono">
                  {new Date(log.timestamp).toLocaleString('ar-YE')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Security Settings */}
      {activeTab === 'security' && (
        <div className="max-w-xl rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">تغيير كلمة مرور المسؤول</h3>
            <p className="text-xs text-slate-500 mt-0.5">تحديث كلمة المرور لحساب {admin.username}.</p>
          </div>

          {pwMessage && (
            <div className={`p-3 rounded-xl text-xs border ${
              pwMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}>
              {pwMessage.text}
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">كلمة المرور الحالية</label>
              <input
                type="password"
                required
                value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-900 focus:border-sky-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">كلمة المرور الجديدة (8 أحرف كحد أدنى)</label>
              <input
                type="password"
                required
                minLength={8}
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-900 focus:border-sky-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={pwSubmitting}
              className="rounded-xl bg-sky-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-sky-500 transition-colors disabled:opacity-75"
            >
              {pwSubmitting ? 'جاري الحفظ...' : 'تحديث كلمة المرور'}
            </button>
          </form>
        </div>
      )}

      {/* CREATE / EDIT APPLICATION MODAL */}
      {appModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-slate-100 text-start my-8">
            <button
              onClick={() => setAppModalOpen(false)}
              className="absolute top-5 end-5 text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 mb-1">
              {editingApp ? 'تعديل بيانات التطبيق' : 'إنشاء تطبيق جديد'}
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              أدخل كافة البيانات الوصفية ومواصفات الحزمة.
            </p>

            {appFormError && (
              <div className="mb-4 rounded-xl bg-rose-50 p-3 text-xs text-rose-800 border border-rose-200">
                {appFormError}
              </div>
            )}

            <form onSubmit={handleSaveApp} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">الاسم بالعربية *</label>
                  <input
                    type="text"
                    required
                    value={appForm.nameAr}
                    onChange={(e) => setAppForm({ ...appForm, nameAr: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">الاسم بالإنجليزية *</label>
                  <input
                    type="text"
                    required
                    value={appForm.nameEn}
                    onChange={(e) => setAppForm({ ...appForm, nameEn: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">معرّف الرابط (Slug) *</label>
                  <input
                    type="text"
                    required
                    value={appForm.slug}
                    onChange={(e) => setAppForm({ ...appForm, slug: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 bg-white font-mono"
                    placeholder="kayan-pdf"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">اسم الحزمة (Package Name) *</label>
                  <input
                    type="text"
                    required
                    value={appForm.packageName}
                    onChange={(e) => setAppForm({ ...appForm, packageName: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 bg-white font-mono"
                    placeholder="com.kayansoft.kayanpdf"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">القسم</label>
                  <select
                    value={appForm.category}
                    onChange={(e) => setAppForm({ ...appForm, category: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 bg-white"
                  >
                    <option value="Tools & Documents">أدوات ومستندات (Tools & Documents)</option>
                    <option value="Productivity">الإنتاجية (Productivity)</option>
                    <option value="Utilities">الخدمات العامة (Utilities)</option>
                    <option value="Media">الوسائط والصور (Media)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">الحد الأدنى لنظام أندرويد</label>
                  <input
                    type="text"
                    value={appForm.minAndroid}
                    onChange={(e) => setAppForm({ ...appForm, minAndroid: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 bg-white"
                    placeholder="7.0 / API 24"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">الوصف القصير بالعربية</label>
                <input
                  type="text"
                  value={appForm.shortDescAr}
                  onChange={(e) => setAppForm({ ...appForm, shortDescAr: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 p-2.5 bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">الوصف القصير بالإنجليزية</label>
                <input
                  type="text"
                  value={appForm.shortDescEn}
                  onChange={(e) => setAppForm({ ...appForm, shortDescEn: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 p-2.5 bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">الوصف التفصيلي بالعربية</label>
                <textarea
                  rows={4}
                  value={appForm.fullDescAr}
                  onChange={(e) => setAppForm({ ...appForm, fullDescAr: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 p-2.5 bg-white leading-relaxed"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">الوصف التفصيلي بالإنجليزية</label>
                <textarea
                  rows={4}
                  value={appForm.fullDescEn}
                  onChange={(e) => setAppForm({ ...appForm, fullDescEn: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 p-2.5 bg-white leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">المميزات بالعربية (سطر لكل ميزة)</label>
                  <textarea
                    rows={3}
                    value={appForm.featuresAr}
                    onChange={(e) => setAppForm({ ...appForm, featuresAr: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 bg-white font-sans"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">المميزات بالإنجليزية (سطر لكل ميزة)</label>
                  <textarea
                    rows={3}
                    value={appForm.featuresEn}
                    onChange={(e) => setAppForm({ ...appForm, featuresEn: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 bg-white font-sans"
                  />
                </div>
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={appForm.isPublished}
                    onChange={(e) => setAppForm({ ...appForm, isPublished: e.target.checked })}
                    className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                  />
                  <span className="font-semibold text-slate-800">نشر التطبيق مباشرة للعامة</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={appForm.featured}
                    onChange={(e) => setAppForm({ ...appForm, featured: e.target.checked })}
                    className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                  />
                  <span className="font-semibold text-slate-800">عرض في القسم المميز بالرئيسية</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAppModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={appFormSubmitting}
                  className="rounded-xl bg-sky-600 px-6 py-2 text-xs font-bold text-white hover:bg-sky-500 disabled:opacity-75"
                >
                  {appFormSubmitting ? 'جاري الحفظ...' : 'حفظ التطبيق'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* CREATE RELEASE & APK UPLOAD MODAL */}
      {releaseModalOpen && selectedAppForRelease && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-slate-100 text-start my-8">
            <button
              onClick={() => setReleaseModalOpen(false)}
              className="absolute top-5 end-5 text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 mb-1">
              إضافة إصدار APK جديد لـ {selectedAppForRelease.nameAr}
            </h3>
            <p className="text-xs text-slate-500 mb-5">
              قم برفع حزمة APK وسيتم حساب الحجم الفعلي وتوليد بصمة SHA-256 المشفرة تلقائياً من قبل الخادم.
            </p>

            {releaseFormError && (
              <div className="mb-4 rounded-xl bg-rose-50 p-3 text-xs text-rose-800 border border-rose-200">
                {releaseFormError}
              </div>
            )}

            {/* APK Drag & Drop / Upload Area */}
            <div className="mb-5 rounded-2xl border-2 border-dashed border-sky-300 bg-sky-50/40 p-6 text-center">
              <input
                type="file"
                id="apkFileInput"
                accept=".apk"
                onChange={handleApkFileChange}
                disabled={apkUploading}
                className="hidden"
              />
              <label
                htmlFor="apkFileInput"
                className="cursor-pointer flex flex-col items-center justify-center space-y-2"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-600 text-white shadow-sm">
                  {apkUploading ? <RefreshCw className="h-6 w-6 animate-spin" /> : <Upload className="h-6 w-6" />}
                </div>
                <div>
                  <span className="text-xs font-bold text-sky-700 block">
                    {apkUploading ? 'جاري فحص الحزمة وحساب SHA-256...' : 'اضغط لاختيار ملف APK للرفع والفحص الآلي'}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    يتم التحقق من سلامة الأرشيف واستخراج البصمة المشفرة
                  </span>
                </div>
              </label>

              {/* Upload Result / Computed Checksums */}
              {apkUploadResult && (
                <div className="mt-4 pt-4 border-t border-sky-200 text-start space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-emerald-700 font-bold">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>تم التحقق من بنية حزمة APK بنجاح:</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-700 bg-white p-3 rounded-xl border border-sky-100">
                    <div><strong>الملف:</strong> {apkUploadResult.originalName}</div>
                    <div><strong>الحجم الفعلي:</strong> {apkUploadResult.sizeFormatted} ({apkUploadResult.sizeBytes} بايت)</div>
                    <div className="col-span-2 break-all font-mono">
                      <strong>SHA-256:</strong> {apkUploadResult.sha256}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={handleSaveRelease} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">رقم الإصدار (Version Name) *</label>
                  <input
                    type="text"
                    required
                    value={releaseForm.versionName}
                    onChange={(e) => setReleaseForm({ ...releaseForm, versionName: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 bg-white font-mono"
                    placeholder="1.0.1"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">كود الإصدار (Version Code) *</label>
                  <input
                    type="number"
                    required
                    value={releaseForm.versionCode}
                    onChange={(e) => setReleaseForm({ ...releaseForm, versionCode: parseInt(e.target.value, 10) || 1 })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 bg-white font-mono"
                    placeholder="2"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">ملاحظات الإصدار بالعربية (Changelog)</label>
                <textarea
                  rows={2}
                  value={releaseForm.releaseNotesAr}
                  onChange={(e) => setReleaseForm({ ...releaseForm, releaseNotesAr: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 p-2.5 bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">ملاحظات الإصدار بالإنجليزية</label>
                <textarea
                  rows={2}
                  value={releaseForm.releaseNotesEn}
                  onChange={(e) => setReleaseForm({ ...releaseForm, releaseNotesEn: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 p-2.5 bg-white"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={releaseForm.isCurrent}
                  onChange={(e) => setReleaseForm({ ...releaseForm, isCurrent: e.target.checked })}
                  className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                />
                <span className="font-semibold text-slate-800">تعيين هذا الإصدار كإصدار رئيسي حالي للتطبيق</span>
              </label>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setReleaseModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={releaseFormSubmitting || apkUploading || !releaseForm.apkFileName || !apkUploadResult}
                  className="rounded-xl bg-sky-600 px-6 py-2 text-xs font-bold text-white hover:bg-sky-500 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                >
                  {releaseFormSubmitting ? 'جاري الاعتماد...' : 'اعتماد ونشر الإصدار'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
