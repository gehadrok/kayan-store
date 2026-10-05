import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { Application, Release, DashboardStats, ActivityLog, Product, ProductFile, Media } from '../../types.ts';
import { AIAdminSection } from '../../components/admin/AIAdminSection.tsx';
import { AnnouncementsAdminSection } from '../../components/admin/AnnouncementsAdminSection.tsx';
import { NewsAdminSection } from '../../components/admin/NewsAdminSection.tsx';
import { NewsAndTickerCenter } from '../../components/admin/NewsAndTickerCenter.tsx';
import { 
  Shield, Key, Lock, LogOut, Plus, Edit3, Trash2, 
  Upload, FileText, Smartphone, Hash, CheckCircle2, 
  AlertTriangle, RefreshCw, Eye, EyeOff, Layers, 
  HardDrive, Calendar, ArrowRight, ArrowLeft, Clock,
  X, Check, AlertCircle, ShoppingBag, BookOpen, Laptop,
  FileCode, Video, Music, Palette, Image, Play, Download,
  Brain, Megaphone, Newspaper
} from 'lucide-react';
import { getSafeAssetUrl, KAYAN_PDF_ICON, KAYAN_PDF_BANNER } from '../../utils/assets.ts';

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
  const [activeTab, setActiveTab] = useState<'overview' | 'apps' | 'products' | 'releases' | 'activity' | 'security' | 'ai' | 'announcements' | 'news'>('overview');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [apps, setApps] = useState<Application[]>([]);
  const [products, setProducts] = useState<Product[]>([]); // Need to define Product type in imports
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
    iconUrl: KAYAN_PDF_ICON,
    bannerUrl: KAYAN_PDF_BANNER,
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

  // Product Modal State
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    nameAr: '',
    nameEn: '',
    slug: '',
    type: 'ebook' as Product['type'],
    category: 'General',
    author: '',
    publisher: '',
    pages: 0,
    language: 'ar',
    isbn: '',
    shortDescAr: '',
    shortDescEn: '',
    fullDescAr: '',
    fullDescEn: '',
    featuresAr: '',
    featuresEn: '',
    versionName: '',
    versionCode: 1,
    packageName: '',
    minAndroid: '',
    price: 0,
    currency: 'USD',
    tags: '',
    license: 'Free',
    isPublished: true,
    featured: false,
    status: 'published' as 'published' | 'draft',
    iconUrl: '',
    coverUrl: '',
    bannerUrl: '',
    videoUrl: '',
    videoTitle: ''
  });
  const [productFormError, setProductFormError] = useState<string | null>(null);
  const [productFormSubmitting, setProductFormSubmitting] = useState(false);

  // Product Media Modal State
  const [productMediaModalOpen, setProductMediaModalOpen] = useState(false);
  const [selectedProductForMedia, setSelectedProductForMedia] = useState<Product | null>(null);
  const [productMediaList, setProductMediaList] = useState<Media[]>([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [mediaUploading, setMediaUploading] = useState(false);
  const [mediaTypeInput, setMediaTypeInput] = useState<'gallery' | 'cover' | 'banner' | 'screenshot' | 'video'>('gallery');
  const [mediaTitleAr, setMediaTitleAr] = useState('');
  const [mediaTitleEn, setMediaTitleEn] = useState('');
  const [mediaVideoUrl, setMediaVideoUrl] = useState('');
  const [mediaError, setMediaError] = useState<string | null>(null);

  // Product Files Modal State
  const [productFilesModalOpen, setProductFilesModalOpen] = useState(false);
  const [selectedProductForFiles, setSelectedProductForFiles] = useState<Product | null>(null);
  const [productFilesList, setProductFilesList] = useState<ProductFile[]>([]);
  const [filesLoading, setFilesLoading] = useState(false);
  const [fileUploading, setFileUploading] = useState(false);
  const [fileTitleInput, setFileTitleInput] = useState('');
  const [fileTypeInput, setFileTypeInput] = useState('MAIN');
  const [fileIsMainInput, setFileIsMainInput] = useState(true);
  const [fileError, setFileError] = useState<string | null>(null);

  // Load Admin Data
  const loadDashboardData = async () => {
    if (!admin) return;
    setLoadingData(true);
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
      const [statsRes, appsRes, prodsRes, logsRes] = await Promise.all([
        fetch('/api/admin/dashboard-stats', { headers }),
        fetch('/api/admin/apps', { headers }),
        fetch('/api/admin/products', { headers }),
        fetch('/api/admin/activity', { headers })
      ]);

      const [statsData, appsData, prodsData, logsData] = await Promise.all([
        statsRes.json(),
        appsRes.json(),
        prodsRes.json(),
        logsRes.json()
      ]);

      if (statsData.success) setStats(statsData.stats);
      if (appsData.success) setApps(appsData.apps);
      if (prodsData.success) setProducts(prodsData.products || []);
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
      iconUrl: KAYAN_PDF_ICON,
      bannerUrl: KAYAN_PDF_BANNER,
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

  // ==========================================
  // DIGITAL PRODUCTS CRUD HANDLERS
  // ==========================================

  const openCreateProductModal = () => {
    setEditingProduct(null);
    setProductForm({
      nameAr: '',
      nameEn: '',
      slug: '',
      type: 'ebook',
      category: 'General',
      author: '',
      publisher: '',
      pages: 0,
      language: 'ar',
      isbn: '',
      shortDescAr: '',
      shortDescEn: '',
      fullDescAr: '',
      fullDescEn: '',
      featuresAr: 'محتوى رقمي متكامل\nترخيص موثق ومعتمد\nتحميل مباشر فوري',
      featuresEn: 'Complete digital asset\nVerified license\nInstant direct download',
      versionName: '',
      versionCode: 1,
      packageName: '',
      minAndroid: '',
      price: 0,
      currency: 'USD',
      tags: 'digital, product',
      license: 'Free',
      isPublished: true,
      featured: false,
      status: 'published',
      iconUrl: '',
      coverUrl: '',
      bannerUrl: '',
      videoUrl: '',
      videoTitle: ''
    });
    setProductFormError(null);
    setProductModalOpen(true);
  };

  const openEditProductModal = (prod: Product) => {
    setEditingProduct(prod);
    setProductForm({
      nameAr: prod.nameAr || '',
      nameEn: prod.nameEn || '',
      slug: prod.slug || '',
      type: prod.type || 'other',
      category: prod.category || 'General',
      author: prod.author || '',
      publisher: prod.publisher || '',
      pages: prod.pages || 0,
      language: prod.language || '',
      isbn: prod.isbn || '',
      shortDescAr: prod.shortDescAr || '',
      shortDescEn: prod.shortDescEn || '',
      fullDescAr: prod.fullDescAr || '',
      fullDescEn: prod.fullDescEn || '',
      featuresAr: Array.isArray(prod.featuresAr) ? prod.featuresAr.join('\n') : '',
      featuresEn: Array.isArray(prod.featuresEn) ? prod.featuresEn.join('\n') : '',
      versionName: prod.versionName || '',
      versionCode: prod.versionCode || 1,
      packageName: prod.packageName || '',
      minAndroid: prod.minAndroid || '',
      price: prod.price || 0,
      currency: prod.currency || 'USD',
      tags: Array.isArray(prod.tags) ? prod.tags.join(', ') : '',
      license: prod.license || 'Free',
      isPublished: prod.isPublished !== false,
      featured: prod.featured === true,
      status: (prod.status as any) || 'published',
      iconUrl: prod.iconUrl || '',
      coverUrl: prod.coverUrl || '',
      bannerUrl: prod.bannerUrl || '',
      videoUrl: prod.videoUrl || '',
      videoTitle: prod.videoTitle || ''
    });
    setProductFormError(null);
    setProductModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setProductFormError(null);
    setProductFormSubmitting(true);

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const payload = {
      ...productForm,
      price: parseFloat(productForm.price as any) || 0,
      pages: parseInt(productForm.pages as any, 10) || undefined,
      versionCode: parseInt(productForm.versionCode as any, 10) || undefined,
      featuresAr: productForm.featuresAr.split('\n').map(s => s.trim()).filter(Boolean),
      featuresEn: productForm.featuresEn.split('\n').map(s => s.trim()).filter(Boolean),
      tags: productForm.tags.split(',').map(s => s.trim()).filter(Boolean)
    };

    try {
      const url = editingProduct ? `/api/admin/products/${editingProduct.id}` : '/api/admin/products';
      const method = editingProduct ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setProductModalOpen(false);
        loadDashboardData();
      } else {
        setProductFormError(data.error || 'فشل حفظ المنتج');
      }
    } catch {
      setProductFormError('تعذر الاتصال بالخادم أثناء حفظ المنتج');
    } finally {
      setProductFormSubmitting(false);
    }
  };

  const handleTogglePublishProduct = async (productId: string, currentStatus: boolean) => {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const endpoint = currentStatus
      ? `/api/admin/products/${productId}/unpublish`
      : `/api/admin/products/${productId}/publish`;

    try {
      const res = await fetch(endpoint, { method: 'POST', headers });
      const data = await res.json();
      if (data.success) {
        setProducts(prev => prev.map(p => p.id === productId ? { ...p, isPublished: !currentStatus, status: !currentStatus ? 'published' : 'draft' } : p));
      }
    } catch (err) {
      console.error('Failed to toggle publish status for product', err);
    }
  };

  const handleDeleteProduct = async (product: Product) => {
    const confirmName = window.prompt(`لتأكيد حذف المنتج (${product.nameAr})، يرجى كتابة اسم المنتج أو كلمة "حذف":`);
    if (!confirmName) return;

    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
      const res = await fetch(`/api/admin/products/${product.id}`, { method: 'DELETE', headers });
      const data = await res.json();
      if (data.success) {
        loadDashboardData();
      } else {
        alert(data.error || 'فشل حذف المنتج');
      }
    } catch {
      alert('تعذر الاتصال بالخادم');
    }
  };

  // ==========================================
  // MEDIA MANAGEMENT HANDLERS
  // ==========================================

  const openManageMediaModal = async (prod: Product) => {
    setSelectedProductForMedia(prod);
    setProductMediaModalOpen(true);
    setMediaLoading(true);
    setMediaError(null);
    setMediaVideoUrl('');
    setMediaTitleAr('');
    setMediaTitleEn('');

    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
      const res = await fetch(`/api/admin/products/${prod.id}/media`, { headers });
      const data = await res.json();
      if (data.success && Array.isArray(data.media)) {
        setProductMediaList(data.media);
      } else {
        setProductMediaList([]);
      }
    } catch {
      setMediaError('فشل تحميل وسائط المنتج');
    } finally {
      setMediaLoading(false);
    }
  };

  const handleUploadMediaFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedProductForMedia) return;

    setMediaUploading(true);
    setMediaError(null);

    const formData = new FormData();
    formData.append('mediaFile', file);
    formData.append('mediaType', mediaTypeInput);
    if (mediaTitleAr) formData.append('titleAr', mediaTitleAr);
    if (mediaTitleEn) formData.append('titleEn', mediaTitleEn);

    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
      const res = await fetch(`/api/admin/products/${selectedProductForMedia.id}/media/upload`, {
        method: 'POST',
        headers,
        body: formData
      });
      const data = await res.json();
      if (data.success && data.media) {
        setProductMediaList(prev => [...prev, data.media]);
        setMediaTitleAr('');
        setMediaTitleEn('');
      } else {
        setMediaError(data.error || 'فشل رفع ملف الوسائط');
      }
    } catch {
      setMediaError('تعذر الاتصال بالخادم أثناء رفع الوسائط');
    } finally {
      setMediaUploading(false);
      e.target.value = '';
    }
  };

  const handleAddVideoMedia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductForMedia || !mediaVideoUrl.trim()) return;

    setMediaUploading(true);
    setMediaError(null);

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
      const res = await fetch(`/api/admin/products/${selectedProductForMedia.id}/media`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          mediaType: 'video',
          externalUrl: mediaVideoUrl.trim(),
          titleAr: mediaTitleAr.trim() || 'فيديو توضيحي',
          titleEn: mediaTitleEn.trim() || 'Product Video'
        })
      });
      const data = await res.json();
      if (data.success && data.media) {
        setProductMediaList(prev => [...prev, data.media]);
        setMediaVideoUrl('');
        setMediaTitleAr('');
        setMediaTitleEn('');
      } else {
        setMediaError(data.error || 'فشل إضافة رابط الفيديو');
      }
    } catch {
      setMediaError('تعذر الاتصال بالخادم أثناء إضافة الفيديو');
    } finally {
      setMediaUploading(false);
    }
  };

  const handleDeleteMedia = async (mediaId: string) => {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
      const res = await fetch(`/api/admin/media/${mediaId}`, { method: 'DELETE', headers });
      const data = await res.json();
      if (data.success) {
        setProductMediaList(prev => prev.filter(m => m.id !== mediaId));
      } else {
        alert(data.error || 'فشل حذف الوسيط');
      }
    } catch {
      alert('تعذر الاتصال بالخادم');
    }
  };

  // ==========================================
  // FILES MANAGEMENT HANDLERS
  // ==========================================

  const openManageFilesModal = async (prod: Product) => {
    setSelectedProductForFiles(prod);
    setProductFilesModalOpen(true);
    setFilesLoading(true);
    setFileError(null);
    setFileTitleInput('');
    setFileTypeInput('MAIN');
    setFileIsMainInput(true);

    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
      const res = await fetch(`/api/admin/products/${prod.id}/files`, { headers });
      const data = await res.json();
      if (data.success && Array.isArray(data.files)) {
        setProductFilesList(data.files);
      } else {
        setProductFilesList([]);
      }
    } catch {
      setFileError('فشل تحميل ملفات المنتج');
    } finally {
      setFilesLoading(false);
    }
  };

  const handleUploadProductFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedProductForFiles) return;

    setFileUploading(true);
    setFileError(null);

    const formData = new FormData();
    formData.append('productFile', file);
    formData.append('title', fileTitleInput.trim() || file.name);
    formData.append('fileType', fileTypeInput);
    formData.append('isMain', String(fileIsMainInput));

    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
      const res = await fetch(`/api/admin/products/${selectedProductForFiles.id}/files/upload`, {
        method: 'POST',
        headers,
        body: formData
      });
      const data = await res.json();
      if (data.success && data.file) {
        setProductFilesList(prev => [...prev, data.file]);
        setFileTitleInput('');
      } else {
        setFileError(data.error || 'فشل رفع الملف الرقمي');
      }
    } catch {
      setFileError('تعذر الاتصال بالخادم أثناء رفع الملف');
    } finally {
      setFileUploading(false);
      e.target.value = '';
    }
  };

  const handleDeleteProductFile = async (fileId: string) => {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
      const res = await fetch(`/api/admin/product-files/${fileId}`, { method: 'DELETE', headers });
      const data = await res.json();
      if (data.success) {
        setProductFilesList(prev => prev.filter(f => f.id !== fileId));
      } else {
        alert(data.error || 'فشل حذف الملف');
      }
    } catch {
      alert('تعذر الاتصال بالخادم');
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
          {activeTab === 'products' ? (
            <button
              onClick={openCreateProductModal}
              className="flex items-center gap-1.5 rounded-xl bg-sky-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-sky-500 transition-all active:scale-98"
            >
              <Plus className="h-4 w-4" />
              <span>{lang === 'ar' ? 'إضافة منتج رقمي' : 'New Digital Product'}</span>
            </button>
          ) : activeTab === 'apps' || activeTab === 'overview' ? (
            <button
              onClick={openCreateAppModal}
              className="flex items-center gap-1.5 rounded-xl bg-sky-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-sky-500 transition-all active:scale-98"
            >
              <Plus className="h-4 w-4" />
              <span>{lang === 'ar' ? 'إضافة تطبيق جديد' : 'New Application'}</span>
            </button>
          ) : null}

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
          onClick={() => setActiveTab('products')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
            activeTab === 'products' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          {lang === 'ar' ? 'المنتجات' : 'Products'} ({products.length})
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
        <button
          onClick={() => setActiveTab('ai')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
            activeTab === 'ai' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          {lang === 'ar' ? 'الذكاء الاصطناعي' : 'AI Intelligence'}
        </button>
        <button
          onClick={() => setActiveTab('news')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'news' || activeTab === 'announcements' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Newspaper className="w-3.5 h-3.5 text-sky-500" />
          {lang === 'ar' ? 'إدارة الأخبار وشريط الأخبار' : 'News & News Ticker'}
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
                      src={getSafeAssetUrl(appItem.iconUrl, KAYAN_PDF_ICON)}
                      alt={appItem.nameAr}
                      className="h-10 w-10 rounded-xl object-contain bg-slate-50 p-1 border border-slate-100"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = KAYAN_PDF_ICON;
                      }}
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
                          src={getSafeAssetUrl(appItem.iconUrl, KAYAN_PDF_ICON)}
                          alt={appItem.nameAr}
                          className="h-9 w-9 rounded-xl object-contain bg-slate-50 p-1 border border-slate-200"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = KAYAN_PDF_ICON;
                          }}
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

      {/* Tab: Digital Products Management */}
      {activeTab === 'products' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">إدارة المنتجات الرقمية (Digital Products)</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                إدارة الكتب، البرمجيات، النماذج، الدورات والملفات الرقمية المتاحة في المتجر.
              </p>
            </div>
            <button
              onClick={openCreateProductModal}
              className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-xs font-bold text-white hover:bg-sky-500 transition-colors shadow-sm self-start sm:self-auto"
            >
              <Plus className="h-4 w-4" />
              <span>إضافة منتج رقمي جديد</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-start text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600">
                  <th className="p-4 font-semibold text-start">المنتج</th>
                  <th className="p-4 font-semibold text-start">النوع (Type)</th>
                  <th className="p-4 font-semibold text-start">التصنيف</th>
                  <th className="p-4 font-semibold text-start">السعر</th>
                  <th className="p-4 font-semibold text-start">الحالة</th>
                  <th className="p-4 font-semibold text-end">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      لا توجد أي منتجات رقمية مسجلة حالياً. اضغط "إضافة منتج رقمي جديد" للبدء.
                    </td>
                  </tr>
                ) : (
                  products.map(prod => (
                    <tr key={prod.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={prod.iconUrl || prod.coverUrl || '/assets/images/kayan_pdf_icon.jpg'}
                            alt={prod.nameAr}
                            className="h-10 w-10 rounded-xl object-cover bg-slate-50 border border-slate-200"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/assets/images/kayan_pdf_icon.jpg';
                            }}
                          />
                          <div>
                            <span className="font-bold text-slate-900 block">{prod.nameAr}</span>
                            <span className="text-[11px] text-slate-500">{prod.nameEn} ({prod.slug})</span>
                          </div>
                        </div>
                      </td>

                      <td className="p-4">
                        <span className="inline-flex items-center gap-1 rounded-md bg-sky-50 px-2 py-0.5 text-[11px] font-semibold text-sky-700 uppercase">
                          {prod.type}
                        </span>
                      </td>

                      <td className="p-4 font-medium text-slate-700">
                        {prod.category}
                      </td>

                      <td className="p-4">
                        {prod.price === 0 ? (
                          <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">مجاني</span>
                        ) : (
                          <span className="font-semibold text-slate-900">{prod.price} {prod.currency || 'USD'}</span>
                        )}
                      </td>

                      <td className="p-4">
                        <button
                          onClick={() => handleTogglePublishProduct(prod.id, prod.isPublished)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors ${
                            prod.isPublished
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                              : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                          }`}
                        >
                          {prod.isPublished ? <Check className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                          <span>{prod.isPublished ? 'منشور' : 'مسودة'}</span>
                        </button>
                      </td>

                      <td className="p-4 text-end">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openManageMediaModal(prod)}
                            className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                            title="إدارة الوسائط والصور والفيديو"
                          >
                            <Image className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => openManageFilesModal(prod)}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="إدارة الملفات القابلة للتحميل"
                          >
                            <FileText className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => openEditProductModal(prod)}
                            className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                            title="تعديل بيانات المنتج"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(prod)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="حذف المنتج"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
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

      {/* Tab 6: AI Control Center */}
      {activeTab === 'ai' && (
        <AIAdminSection token={token} />
      )}

      {/* Tab: News & News Ticker Management Center */}
      {(activeTab === 'news' || activeTab === 'announcements') && (
        <NewsAndTickerCenter
          token={token}
          initialTab={activeTab === 'announcements' ? 'ticker' : 'news'}
        />
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

      {/* CREATE / EDIT DIGITAL PRODUCT MODAL */}
      {productModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-slate-100 text-start my-8">
            <button
              onClick={() => setProductModalOpen(false)}
              className="absolute top-5 end-5 text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 mb-1">
              {editingProduct ? 'تعديل بيانات المنتج الرقمي' : 'إضافة منتج رقمي جديد'}
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              أدخل كافة البيانات والمواصفات الرقمية للمنتج.
            </p>

            {productFormError && (
              <div className="mb-4 rounded-xl bg-rose-50 p-3 text-xs text-rose-800 border border-rose-200">
                {productFormError}
              </div>
            )}

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">نوع المنتج (Product Type) *</label>
                  <select
                    value={productForm.type}
                    onChange={(e) => setProductForm({ ...productForm, type: e.target.value as any })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 bg-white font-medium"
                  >
                    <option value="android_app">تطبيق أندرويد (Android App)</option>
                    <option value="desktop_software">برمجيات حاسوب (Desktop Software)</option>
                    <option value="ebook">كتاب إلكتروني / PDF (Ebook)</option>
                    <option value="template">قالب / نموذج (Template)</option>
                    <option value="course">دورة / مادة مرئية (Course)</option>
                    <option value="audio">مقطع / ألبوم صوتي (Audio)</option>
                    <option value="design">أصل تصميم وجرافيك (Design)</option>
                    <option value="file">ملف رقمي عام (Digital File)</option>
                    <option value="other">أخرى (Other)</option>
                  </select>
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label className="font-semibold text-slate-700">التصنيف (Category) *</label>
                  <input
                    type="text"
                    required
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 bg-white"
                    placeholder="كتب تقنية، أدوات برمجية، تصميم..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">الاسم بالعربية *</label>
                  <input
                    type="text"
                    required
                    value={productForm.nameAr}
                    onChange={(e) => setProductForm({ ...productForm, nameAr: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">الاسم بالإنجليزية *</label>
                  <input
                    type="text"
                    required
                    value={productForm.nameEn}
                    onChange={(e) => setProductForm({ ...productForm, nameEn: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">معرّف الرابط (Slug) *</label>
                  <input
                    type="text"
                    required
                    value={productForm.slug}
                    onChange={(e) => setProductForm({ ...productForm, slug: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 bg-white font-mono"
                    placeholder="my-ebook-slug"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">المؤلف / الناشر (Author) *</label>
                  <input
                    type="text"
                    required
                    value={productForm.author}
                    onChange={(e) => setProductForm({ ...productForm, author: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 bg-white"
                    placeholder="المهندس جهاد الصليحي"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">دار النشر (اختياري)</label>
                  <input
                    type="text"
                    value={productForm.publisher}
                    onChange={(e) => setProductForm({ ...productForm, publisher: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 bg-white"
                    placeholder="Kayan Soft"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">السعر (0 = مجاني)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">العملة</label>
                  <input
                    type="text"
                    value={productForm.currency}
                    onChange={(e) => setProductForm({ ...productForm, currency: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">نوع الترخيص</label>
                  <input
                    type="text"
                    value={productForm.license}
                    onChange={(e) => setProductForm({ ...productForm, license: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 bg-white"
                    placeholder="Free / MIT / Proprietary"
                  />
                </div>
              </div>

              {/* Specific metadata fields depending on type */}
              {(productForm.type === 'ebook' || productForm.type === 'file') && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">عدد الصفحات</label>
                    <input
                      type="number"
                      min="0"
                      value={productForm.pages || 0}
                      onChange={(e) => setProductForm({ ...productForm, pages: parseInt(e.target.value, 10) || 0 })}
                      className="w-full rounded-xl border border-slate-200 p-2 bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">اللغة</label>
                    <input
                      type="text"
                      value={productForm.language}
                      onChange={(e) => setProductForm({ ...productForm, language: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 p-2 bg-white"
                      placeholder="العربية / English"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">الرقم المعياري (ISBN)</label>
                    <input
                      type="text"
                      value={productForm.isbn}
                      onChange={(e) => setProductForm({ ...productForm, isbn: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 p-2 bg-white font-mono"
                    />
                  </div>
                </div>
              )}

              {(productForm.type === 'android_app' || productForm.type === 'desktop_software') && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">رقم الإصدار (Version Name)</label>
                    <input
                      type="text"
                      value={productForm.versionName}
                      onChange={(e) => setProductForm({ ...productForm, versionName: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 p-2 bg-white font-mono"
                      placeholder="1.0.0"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">كود الإصدار (Version Code)</label>
                    <input
                      type="number"
                      value={productForm.versionCode}
                      onChange={(e) => setProductForm({ ...productForm, versionCode: parseInt(e.target.value, 10) || 1 })}
                      className="w-full rounded-xl border border-slate-200 p-2 bg-white font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">الحزمة أو المعرف</label>
                    <input
                      type="text"
                      value={productForm.packageName}
                      onChange={(e) => setProductForm({ ...productForm, packageName: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 p-2 bg-white font-mono"
                      placeholder="com.kayan.app"
                    />
                  </div>
                </div>
              )}

              {/* Video URL support (YouTube / Vimeo) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">رابط الفيديو التوضيحي (YouTube أو Vimeo)</label>
                  <input
                    type="url"
                    value={productForm.videoUrl}
                    onChange={(e) => setProductForm({ ...productForm, videoUrl: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 bg-white font-mono text-xs"
                    placeholder="https://www.youtube.com/watch?v=..."
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">عنوان الفيديو</label>
                  <input
                    type="text"
                    value={productForm.videoTitle}
                    onChange={(e) => setProductForm({ ...productForm, videoTitle: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 bg-white"
                    placeholder="نظرة عامة على محتوى المنتج"
                  />
                </div>
              </div>

              {/* Image URLs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">رابط الأيقونة (Icon URL)</label>
                  <input
                    type="text"
                    value={productForm.iconUrl}
                    onChange={(e) => setProductForm({ ...productForm, iconUrl: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2 bg-white"
                    placeholder="/assets/images/kayan_pdf_icon.jpg"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">رابط الغلاف (Cover URL)</label>
                  <input
                    type="text"
                    value={productForm.coverUrl}
                    onChange={(e) => setProductForm({ ...productForm, coverUrl: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2 bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">رابط البنر (Banner URL)</label>
                  <input
                    type="text"
                    value={productForm.bannerUrl}
                    onChange={(e) => setProductForm({ ...productForm, bannerUrl: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2 bg-white"
                  />
                </div>
              </div>

              {/* Descriptions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">الوصف القصير بالعربية *</label>
                  <textarea
                    rows={2}
                    required
                    value={productForm.shortDescAr}
                    onChange={(e) => setProductForm({ ...productForm, shortDescAr: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">الوصف القصير بالإنجليزية *</label>
                  <textarea
                    rows={2}
                    required
                    value={productForm.shortDescEn}
                    onChange={(e) => setProductForm({ ...productForm, shortDescEn: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">الوصف الكامل بالعربية</label>
                  <textarea
                    rows={3}
                    value={productForm.fullDescAr}
                    onChange={(e) => setProductForm({ ...productForm, fullDescAr: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">الوصف الكامل بالإنجليزية</label>
                  <textarea
                    rows={3}
                    value={productForm.fullDescEn}
                    onChange={(e) => setProductForm({ ...productForm, fullDescEn: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">الميزات (سطر لكل ميزة) بالعربية</label>
                  <textarea
                    rows={3}
                    value={productForm.featuresAr}
                    onChange={(e) => setProductForm({ ...productForm, featuresAr: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">الميزات بالإنجليزية</label>
                  <textarea
                    rows={3}
                    value={productForm.featuresEn}
                    onChange={(e) => setProductForm({ ...productForm, featuresEn: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 bg-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">الوسوم (Tags) مفصولة بفواصل</label>
                <input
                  type="text"
                  value={productForm.tags}
                  onChange={(e) => setProductForm({ ...productForm, tags: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 p-2 bg-white"
                  placeholder="pdf, ebook, productivity"
                />
              </div>

              <div className="flex flex-wrap items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={productForm.isPublished}
                    onChange={(e) => setProductForm({ ...productForm, isPublished: e.target.checked })}
                    className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                  />
                  <span className="font-semibold text-slate-800">نشر المنتج للعامة فوراً</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={productForm.featured}
                    onChange={(e) => setProductForm({ ...productForm, featured: e.target.checked })}
                    className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                  />
                  <span className="font-semibold text-slate-800">تمييز كمنتج بارز (Featured)</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setProductModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={productFormSubmitting}
                  className="rounded-xl bg-sky-600 px-6 py-2 text-xs font-bold text-white hover:bg-sky-500 disabled:opacity-50"
                >
                  {productFormSubmitting ? 'جاري الحفظ...' : (editingProduct ? 'تحديث المنتج' : 'حفظ ونشر المنتج')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MANAGE PRODUCT MEDIA MODAL */}
      {productMediaModalOpen && selectedProductForMedia && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-slate-100 text-start my-8">
            <button
              onClick={() => setProductMediaModalOpen(false)}
              className="absolute top-5 end-5 text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 mb-1">
              إدارة وسائط المنتج: {selectedProductForMedia.nameAr}
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              رفع لقطات الشاشة، أغلفة المنتج، وبنرات العرض أو إضافة روابط فيديو YouTube / Vimeo.
            </p>

            {mediaError && (
              <div className="mb-4 rounded-xl bg-rose-50 p-3 text-xs text-rose-800 border border-rose-200">
                {mediaError}
              </div>
            )}

            {/* Current Media Items */}
            <div className="mb-6 space-y-3">
              <h4 className="font-bold text-xs text-slate-800">الوسائط الحالية ({productMediaList.length})</h4>
              {mediaLoading ? (
                <div className="p-4 text-center text-xs text-slate-400 animate-pulse">جاري تحميل الوسائط...</div>
              ) : productMediaList.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl">
                  لا توجد وسائط مسجلة لهذا المنتج حتى الآن.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {productMediaList.map(item => (
                    <div key={item.id} className="relative group rounded-xl border border-slate-200 bg-slate-50 overflow-hidden">
                      <div className="aspect-video w-full bg-slate-100 flex items-center justify-center overflow-hidden">
                        {item.mediaType === 'video' ? (
                          <div className="flex flex-col items-center justify-center gap-1 text-sky-700">
                            <Play className="h-8 w-8" />
                            <span className="text-[10px] font-bold">فيديو معتمد</span>
                          </div>
                        ) : (
                          <img
                            src={item.thumbnailUrl || item.fileUrl || ''}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div className="p-2 flex items-center justify-between text-[11px]">
                        <span className="font-medium text-slate-700 truncate">{item.titleAr || item.mediaType}</span>
                        <button
                          type="button"
                          onClick={() => handleDeleteMedia(item.id)}
                          className="text-rose-600 hover:text-rose-800 p-1"
                          title="حذف الوسيط"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add Image Upload Section */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 mb-4 space-y-3 text-xs">
              <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                <Image className="h-4 w-4 text-sky-600" />
                <span>رفع صورة جديدة (JPG, PNG, WebP)</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-600 block mb-1">نوع الوسيط</label>
                  <select
                    value={mediaTypeInput}
                    onChange={(e) => setMediaTypeInput(e.target.value as any)}
                    className="w-full rounded-xl border border-slate-200 p-2 bg-white"
                  >
                    <option value="gallery">معرض الصور (Gallery)</option>
                    <option value="screenshot">لقطة شاشة (Screenshot)</option>
                    <option value="cover">غلاف المنتج (Cover)</option>
                    <option value="banner">بنر عريض (Banner)</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-600 block mb-1">العنوان بالعربية</label>
                  <input
                    type="text"
                    value={mediaTitleAr}
                    onChange={(e) => setMediaTitleAr(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2 bg-white"
                    placeholder="لقطة من داخل التطبيق"
                  />
                </div>
                <div>
                  <label className="text-slate-600 block mb-1">ملف الصورة</label>
                  <input
                    type="file"
                    accept="image/*"
                    disabled={mediaUploading}
                    onChange={handleUploadMediaFile}
                    className="w-full rounded-xl border border-slate-200 p-1.5 bg-white text-[11px]"
                  />
                </div>
              </div>
              {mediaUploading && <p className="text-sky-600 text-[11px] animate-pulse">جاري الرفع والمعالجة...</p>}
            </div>

            {/* Add Video Embed Section */}
            <form onSubmit={handleAddVideoMedia} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 text-xs">
              <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                <Play className="h-4 w-4 text-rose-600" />
                <span>إضافة فيديو (YouTube أو Vimeo فقط)</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-600 block mb-1">رابط الفيديو</label>
                  <input
                    type="url"
                    required
                    value={mediaVideoUrl}
                    onChange={(e) => setMediaVideoUrl(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2 bg-white font-mono"
                    placeholder="https://www.youtube.com/watch?v=..."
                  />
                </div>
                <div>
                  <label className="text-slate-600 block mb-1">عنوان الفيديو بالعربية</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={mediaTitleAr}
                      onChange={(e) => setMediaTitleAr(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 p-2 bg-white"
                      placeholder="استعراض الميزات"
                    />
                    <button
                      type="submit"
                      disabled={mediaUploading || !mediaVideoUrl.trim()}
                      className="rounded-xl bg-sky-600 px-4 py-2 font-bold text-white hover:bg-sky-500 disabled:opacity-50 shrink-0"
                    >
                      إضافة
                    </button>
                  </div>
                </div>
              </div>
            </form>

            <div className="flex justify-end pt-4 border-t border-slate-100 mt-6">
              <button
                type="button"
                onClick={() => setProductMediaModalOpen(false)}
                className="rounded-xl border border-slate-200 px-5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MANAGE PRODUCT FILES MODAL */}
      {productFilesModalOpen && selectedProductForFiles && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-slate-100 text-start my-8">
            <button
              onClick={() => setProductFilesModalOpen(false)}
              className="absolute top-5 end-5 text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 mb-1">
              إدارة ملفات المنتج: {selectedProductForFiles.nameAr}
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              رفع الملفات الرقمية الأساسية، الأدلة، النماذج، وملفات المعاينة مع حساب تلقائي لبصمة SHA-256.
            </p>

            {fileError && (
              <div className="mb-4 rounded-xl bg-rose-50 p-3 text-xs text-rose-800 border border-rose-200">
                {fileError}
              </div>
            )}

            {/* Current Files */}
            <div className="mb-6 space-y-3">
              <h4 className="font-bold text-xs text-slate-800">الملفات الحالية المرفوعة ({productFilesList.length})</h4>
              {filesLoading ? (
                <div className="p-4 text-center text-xs text-slate-400 animate-pulse">جاري تحميل الملفات...</div>
              ) : productFilesList.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl">
                  لا توجد أي ملفات مرفوعة لهذا المنتج حتى الآن.
                </div>
              ) : (
                <div className="space-y-2">
                  {productFilesList.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{item.title}</span>
                            {item.isMain && (
                              <span className="rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
                                رئيسي
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-2">
                            <span>{item.size}</span>
                            <span>•</span>
                            <span>{item.fileType}</span>
                            {item.sha256 && (
                              <>
                                <span>•</span>
                                <span className="font-mono text-[10px]">SHA: {item.sha256.slice(0, 8)}...</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteProductFile(item.id)}
                        className="p-1.5 text-rose-600 hover:bg-rose-100/50 rounded-lg transition-colors"
                        title="حذف الملف"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Upload New Product File */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 text-xs">
              <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                <Upload className="h-4 w-4 text-sky-600" />
                <span>رفع ملف رقمي جديد (PDF, ZIP, APK, MP3, DOCX...)</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-600 block mb-1">عنوان الملف المعروض</label>
                  <input
                    type="text"
                    value={fileTitleInput}
                    onChange={(e) => setFileTitleInput(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2 bg-white"
                    placeholder="الكتاب بصيغة PDF"
                  />
                </div>
                <div>
                  <label className="text-slate-600 block mb-1">نوع الملف</label>
                  <select
                    value={fileTypeInput}
                    onChange={(e) => setFileTypeInput(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2 bg-white font-medium"
                  >
                    <option value="MAIN">ملف رئيسي (MAIN)</option>
                    <option value="PREVIEW">معاينة / عينة (PREVIEW)</option>
                    <option value="GUIDE">دليل استخدام (GUIDE)</option>
                    <option value="README">ملف إرشادات (README)</option>
                    <option value="SUPPLEMENTARY">ملف إضافي (SUPPLEMENTARY)</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-600 block mb-1">اختر الملف</label>
                  <input
                    type="file"
                    disabled={fileUploading}
                    onChange={handleUploadProductFile}
                    className="w-full rounded-xl border border-slate-200 p-1.5 bg-white text-[11px]"
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={fileIsMainInput}
                  onChange={(e) => setFileIsMainInput(e.target.checked)}
                  className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                />
                <span className="font-semibold text-slate-800">تعيين كملف التحميل الرئيسي للمنتج</span>
              </label>
              {fileUploading && <p className="text-sky-600 text-[11px] animate-pulse">جاري الرفع وحساب البصمة الرقمية...</p>}
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100 mt-6">
              <button
                type="button"
                onClick={() => setProductFilesModalOpen(false)}
                className="rounded-xl border border-slate-200 px-5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
