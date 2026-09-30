import React, { useState, useEffect } from 'react';
import { useUserAuth } from '../../context/UserAuthContext.tsx';
import type { Product, AIProject, Download } from '../../types.ts';
import {
  User as UserIcon,
  BookOpen,
  Heart,
  Download as DownloadIcon,
  Sparkles,
  LogOut,
  ShieldCheck,
  Calendar,
  Mail,
  FileText,
  ExternalLink,
  CheckCircle2,
  Package
} from 'lucide-react';

interface AccountPageProps {
  onNavigate?: (path: string) => void;
  defaultTab?: 'profile' | 'library' | 'favorites' | 'downloads' | 'ai';
}

export const AccountPage: React.FC<AccountPageProps> = ({ onNavigate, defaultTab = 'profile' }) => {
  const { user, logout, loading: authLoading } = useUserAuth();

  const [activeTab, setActiveTab] = useState<'profile' | 'library' | 'favorites' | 'downloads' | 'ai'>(defaultTab);

  const [libraryProducts, setLibraryProducts] = useState<Product[]>([]);
  const [favoriteProducts, setFavoriteProducts] = useState<Product[]>([]);
  const [downloadHistory, setDownloadHistory] = useState<Download[]>([]);
  const [aiProjects, setAiProjects] = useState<AIProject[]>([]);

  const [loadingData, setLoadingData] = useState(false);

  const handleNav = (path: string) => {
    if (onNavigate) {
      onNavigate(path);
    } else {
      window.history.pushState({}, '', path);
      window.dispatchEvent(new Event('popstate'));
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      handleNav('/login');
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (user) {
      fetchAccountData();
    }
  }, [user, activeTab]);

  const fetchAccountData = async () => {
    setLoadingData(true);
    try {
      if (activeTab === 'library') {
        const res = await fetch('/api/me/library');
        const data = await res.json();
        if (data.success) setLibraryProducts(data.products || []);
      } else if (activeTab === 'favorites') {
        const res = await fetch('/api/me/favorites');
        const data = await res.json();
        if (data.success) setFavoriteProducts(data.favorites || []);
      } else if (activeTab === 'downloads') {
        const res = await fetch('/api/me/downloads');
        const data = await res.json();
        if (data.success) setDownloadHistory(data.downloads || []);
      } else if (activeTab === 'ai') {
        const res = await fetch('/api/me/ai/projects');
        const data = await res.json();
        if (data.success) setAiProjects(data.projects || []);
      }
    } catch (err) {
      console.error('Error fetching account tab data:', err);
    } finally {
      setLoadingData(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    handleNav('/');
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-pulse text-xs font-bold text-slate-400">جاري التحقق من بيانات الحساب...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-start">
      {/* Header Banner */}
      <div className="rounded-3xl bg-linear-to-r from-sky-950 via-slate-900 to-sky-900 p-6 sm:p-8 text-white shadow-2xl mb-8 relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-300 font-bold text-2xl shadow-inner">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-white">{user.name}</h1>
                <span className="rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  حساب نشط
                </span>
              </div>
              <p className="text-xs text-sky-200/80 flex items-center gap-1.5 mt-1">
                <Mail className="h-3.5 w-3.5" />
                <span>{user.email}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleNav('/ai')}
              className="rounded-xl bg-sky-500 hover:bg-sky-400 text-white px-4 py-2.5 text-xs font-bold flex items-center gap-2 shadow-lg shadow-sky-500/20 transition-all cursor-pointer"
            >
              <Sparkles className="h-4 w-4" />
              <span>Kayan AI Workspace</span>
            </button>
            <button
              onClick={handleLogout}
              className="rounded-xl bg-white/10 hover:bg-rose-600/80 text-white px-4 py-2.5 text-xs font-bold flex items-center gap-2 border border-white/10 transition-all cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              <span>خروج</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Tabs + Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Navigation */}
        <div className="space-y-2">
          <div className="bg-white rounded-2xl p-3 border border-slate-200/80 shadow-xs space-y-1">
            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all text-start ${
                activeTab === 'profile' ? 'bg-sky-50 text-sky-700 font-black' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <UserIcon className="h-4 w-4" />
              <span>الملف الشخصي</span>
            </button>

            <button
              onClick={() => setActiveTab('library')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all text-start ${
                activeTab === 'library' ? 'bg-sky-50 text-sky-700 font-black' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <BookOpen className="h-4 w-4" />
              <span>مكتبتي الرقمية</span>
            </button>

            <button
              onClick={() => setActiveTab('favorites')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all text-start ${
                activeTab === 'favorites' ? 'bg-sky-50 text-sky-700 font-black' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Heart className="h-4 w-4" />
              <span>المفضلة</span>
            </button>

            <button
              onClick={() => setActiveTab('downloads')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all text-start ${
                activeTab === 'downloads' ? 'bg-sky-50 text-sky-700 font-black' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <DownloadIcon className="h-4 w-4" />
              <span>سجل التنزيلات</span>
            </button>

            <button
              onClick={() => setActiveTab('ai')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all text-start ${
                activeTab === 'ai' ? 'bg-sky-50 text-sky-700 font-black' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Sparkles className="h-4 w-4" />
              <span>مشاريع Kayan AI</span>
            </button>
          </div>
        </div>

        {/* Tab Content Area */}
        <div className="lg:col-span-3">
          {activeTab === 'profile' && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
              <h2 className="text-lg font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
                <UserIcon className="h-5 w-5 text-sky-600" />
                <span>البيانات الشخصية والحساب</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                  <span className="text-slate-400 font-medium">اسم الحساب الكامل</span>
                  <p className="font-bold text-slate-900 text-sm">{user.name}</p>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                  <span className="text-slate-400 font-medium">البريد الإلكتروني المعتمد</span>
                  <p className="font-bold text-slate-900 text-sm">{user.email}</p>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                  <span className="text-slate-400 font-medium">تاريخ الإنشاء</span>
                  <p className="font-bold text-slate-900">{new Date(user.createdAt).toLocaleDateString('ar-EG')}</p>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                  <span className="text-slate-400 font-medium">نوع الحساب والصلاحية</span>
                  <p className="font-bold text-sky-700">عميل متجر كيان الرسمي (Customer)</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'library' && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
              <h2 className="text-lg font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-sky-600" />
                <span>مكتبتي الرقمية والمنتجات المكتسبة</span>
              </h2>

              {loadingData ? (
                <div className="p-8 text-center text-xs text-slate-400 animate-pulse">جاري تحميل المنتجات...</div>
              ) : libraryProducts.length === 0 ? (
                <div className="p-12 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200 space-y-3">
                  <Package className="h-12 w-12 text-slate-300 mx-auto" />
                  <p className="text-xs font-bold text-slate-700">لم تقم بإضافة أي منتجات رقمية إلى مكتبتك بعد</p>
                  <p className="text-xs text-slate-400">تصفح متجر المنتجات الرقمية واحصل على الكتب والأدوات المجانية فوراً</p>
                  <button
                    onClick={() => handleNav('/products')}
                    className="inline-block rounded-xl bg-sky-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-sky-500 shadow-md cursor-pointer"
                  >
                    استكشف المنتجات الرقمية
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {libraryProducts.map(product => (
                    <div key={product.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-white transition-all space-y-3">
                      <div className="flex items-start gap-3">
                        <img
                          src={product.iconUrl || product.coverUrl || '/assets/images/kayan_pdf_icon.jpg'}
                          alt=""
                          className="h-12 w-12 rounded-xl object-cover border border-slate-200 shrink-0"
                        />
                        <div className="overflow-hidden">
                          <h3 className="font-bold text-slate-900 text-xs truncate">{product.nameAr}</h3>
                          <p className="text-[11px] text-slate-500 line-clamp-1">{product.shortDescAr}</p>
                        </div>
                      </div>

                      {product.files && product.files.length > 0 && (
                        <div className="pt-2 border-t border-slate-200/80 space-y-1">
                          <span className="text-[10px] font-bold text-slate-400 block">الملفات المتاحة للتحميل:</span>
                          {product.files.map(file => (
                            <a
                              key={file.id}
                              href={file.fileUrl}
                              download
                              className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200 text-xs hover:border-sky-500 transition-colors"
                            >
                              <span className="font-bold text-slate-800 truncate text-[11px]">{file.title}</span>
                              <DownloadIcon className="h-3.5 w-3.5 text-sky-600 shrink-0" />
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'favorites' && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
              <h2 className="text-lg font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
                <Heart className="h-5 w-5 text-rose-600" />
                <span>المنتجات المفضلة</span>
              </h2>

              {loadingData ? (
                <div className="p-8 text-center text-xs text-slate-400 animate-pulse">جاري تحميل المفضلة...</div>
              ) : favoriteProducts.length === 0 ? (
                <div className="p-12 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200 space-y-2">
                  <Heart className="h-12 w-12 text-slate-300 mx-auto" />
                  <p className="text-xs font-bold text-slate-700">قائمة المفضلة فارغة حالياً</p>
                  <p className="text-xs text-slate-400">يمكنك حفظ المنتجات الرقمية والتطبيقات للرجوع إليها لاحقاً</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {favoriteProducts.map(product => (
                    <div
                      key={product.id}
                      onClick={() => handleNav(`/products/${product.slug}`)}
                      className="p-4 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-white transition-all space-y-2 block cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={product.iconUrl || product.coverUrl || '/assets/images/kayan_pdf_icon.jpg'}
                          alt=""
                          className="h-10 w-10 rounded-xl object-cover border border-slate-200"
                        />
                        <div>
                          <h3 className="font-bold text-slate-900 text-xs">{product.nameAr}</h3>
                          <span className="text-[10px] text-sky-600 font-bold">{product.price === 0 ? 'مجاني' : `$${product.price}`}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'downloads' && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
              <h2 className="text-lg font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
                <DownloadIcon className="h-5 w-5 text-sky-600" />
                <span>سجل التنزيلات والعمليات السابقة</span>
              </h2>

              {loadingData ? (
                <div className="p-8 text-center text-xs text-slate-400 animate-pulse">جاري تحميل السجل...</div>
              ) : downloadHistory.length === 0 ? (
                <div className="p-12 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200 space-y-2">
                  <DownloadIcon className="h-12 w-12 text-slate-300 mx-auto" />
                  <p className="text-xs font-bold text-slate-700">لا توجد تنزيلات مسجلة باسم هذا الحساب</p>
                </div>
              ) : (
                <div className="space-y-2 text-xs">
                  {downloadHistory.map(item => (
                    <div key={item.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-sky-600" />
                        <div>
                          <span className="font-bold text-slate-900 block">تنزيل ملف رقمي</span>
                          <span className="text-[10px] text-slate-400">{new Date(item.downloadedAt).toLocaleString('ar-EG')}</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        مكتمل
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'ai' && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-sky-600" />
                  <span>مشاريع Kayan AI Workspace</span>
                </h2>
                <button
                  onClick={() => handleNav('/ai')}
                  className="rounded-xl bg-sky-600 text-white px-3.5 py-1.5 text-xs font-bold hover:bg-sky-500 shadow-md cursor-pointer"
                >
                  مشروع جديد
                </button>
              </div>

              {loadingData ? (
                <div className="p-8 text-center text-xs text-slate-400 animate-pulse">جاري تحميل المشاريع...</div>
              ) : aiProjects.length === 0 ? (
                <div className="p-12 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200 space-y-3">
                  <Sparkles className="h-12 w-12 text-sky-400 mx-auto" />
                  <p className="text-xs font-bold text-slate-700">لم تقم بإنشاء أي مشاريع ذكاء اصطناعي بعد</p>
                  <button
                    onClick={() => handleNav('/ai')}
                    className="inline-block rounded-xl bg-sky-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-sky-500 shadow-md cursor-pointer"
                  >
                    الانتقال إلى Kayan AI Workspace
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {aiProjects.map(proj => (
                    <div
                      key={proj.id}
                      onClick={() => handleNav('/ai')}
                      className="p-4 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-white transition-all space-y-2 block cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-slate-900 text-xs">{proj.name}</h3>
                        <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
                      </div>
                      {proj.description && <p className="text-[11px] text-slate-500 line-clamp-2">{proj.description}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
