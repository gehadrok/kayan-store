import React, { useState, useEffect } from 'react';
import {
  Newspaper,
  Globe,
  MapPin,
  Settings,
  RefreshCw,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Layers,
  Activity,
  Megaphone,
  ExternalLink,
  Search,
  Sparkles,
  Edit3,
  Tag,
  Eye,
  EyeOff
} from 'lucide-react';
import { YEMEN_GOVERNORATES } from '../../data/yemenLocations.ts';

interface NewsAdminSectionProps {
  token: string | null;
  onSwitchToTickerTab?: () => void;
}

export const NewsAdminSection: React.FC<NewsAdminSectionProps> = ({ token, onSwitchToTickerTab }) => {
  const [activeTab, setActiveTab] = useState<'articles' | 'sources' | 'locations' | 'settings' | 'jobs'>('articles');
  
  // Stats & Core States
  const [sources, setSources] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [aliases, setAliases] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({ updateIntervalMinutes: 180, enabled: true });
  const [jobs, setJobs] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);

  // Articles Management States
  const [articles, setArticles] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCountry, setFilterCountry] = useState('ALL');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterSource, setFilterSource] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Edit Article Modal State
  const [editArticleModalOpen, setEditArticleModalOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<any | null>(null);
  const [editCategory, setEditCategory] = useState('general');
  const [editRegionId, setEditRegionId] = useState('');

  // UI Feedback States
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Forms
  const [newSourceName, setNewSourceName] = useState('');
  const [newSourceUrl, setNewSourceUrl] = useState('');
  const [newSourceType, setNewSourceType] = useState('rss');
  const [newSourceCountry, setNewSourceCountry] = useState('ye');

  useEffect(() => {
    fetchData();
  }, [activeTab, token]);

  useEffect(() => {
    if (activeTab === 'articles') {
      fetchArticles();
    }
  }, [activeTab, filterCountry, filterCategory, filterSource, page]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
      const [srcRes, statsRes] = await Promise.all([
        fetch('/api/admin/news/sources', { headers, credentials: 'include' }),
        fetch('/api/admin/news/stats', { headers, credentials: 'include' })
      ]);
      const srcData = await srcRes.json();
      const statsData = await statsRes.json();
      if (srcData.success) setSources(srcData.sources || []);
      if (statsData.success) setStats(statsData.stats || null);

      if (activeTab === 'locations') {
        const locRes = await fetch('/api/admin/news/locations', { headers, credentials: 'include' });
        const locData = await locRes.json();
        if (locData.success) {
          setLocations(locData.locations || []);
          setAliases(locData.aliases || []);
        }
      } else if (activeTab === 'settings') {
        const setRes = await fetch('/api/admin/news/settings', { headers, credentials: 'include' });
        const setData = await setRes.json();
        if (setData.success) setSettings(setData.settings || {});
      } else if (activeTab === 'jobs') {
        const jobRes = await fetch('/api/admin/news/jobs', { headers, credentials: 'include' });
        const jobData = await jobRes.json();
        if (jobData.success) setJobs(jobData.jobs || []);
      }
    } catch (err: any) {
      setError(err?.message || 'فشل في تحميل بيانات الأخبار الإدارية');
    } finally {
      setLoading(false);
    }
  };

  // Fetch articles with search & filters
  const fetchArticles = async (customQuery?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterCountry && filterCountry !== 'ALL') params.set('country', filterCountry);
      if (filterCategory && filterCategory !== 'all') params.set('category', filterCategory);
      if (filterSource && filterSource !== 'all') params.set('sourceName', filterSource);
      
      const q = customQuery !== undefined ? customQuery : searchQuery;
      if (q) params.set('search', q);

      params.set('page', page.toString());
      params.set('limit', '8');

      const res = await fetch(`/api/news?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setArticles(data.articles || []);
        if (data.pagination) {
          setTotalPages(data.pagination.totalPages || 1);
          setTotalCount(data.pagination.total || 0);
        }
      }
    } catch (err) {
      setError('فشل في تحميل الأخبار الحالية');
    } finally {
      setLoading(false);
    }
  };

  // 📢 CRITICAL: Add Article to Store Announcements Ticker Bar
  const handleAddToTicker = async (article: any) => {
    setSuccessMsg(null);
    setError(null);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const payload = {
        title: article.title,
        message: article.description || article.title,
        type: 'info',
        icon: 'Sparkles',
        link: article.canonicalUrl || article.url,
        startAt: new Date().toISOString(),
        endAt: new Date(Date.now() + 86400000 * 30).toISOString(),
        priority: 10,
        displayOrder: 1,
        active: true,
        dismissible: true
      };

      const res = await fetch('/api/admin/announcements', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(`📢 تم إدراج الخبر "${article.title.slice(0, 35)}..." بنجاح في شريط الإعلانات والأخبار!`);
        if (onSwitchToTickerTab) {
          setTimeout(() => {
            onSwitchToTickerTab();
          }, 1500);
        }
      } else {
        setError(data.error || 'فشل إدراج الخبر في شريط الأخبار');
      }
    } catch (err: any) {
      setError('حدث خطأ أثناء إضافة الخبر إلى شريط الأخبار');
    }
  };

  // Delete Article
  const handleDeleteArticle = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الخبر نهائياً؟')) return;
    try {
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`/api/admin/news/articles/${id}`, { method: 'DELETE', headers, credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg('تم حذف الخبر بنجاح');
        fetchArticles();
      } else {
        setError(data.error || 'فشل حذف الخبر');
      }
    } catch {
      setError('فشل حذف الخبر');
    }
  };

  // Save edited article location / category
  const handleSaveEditArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingArticle) return;
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/admin/news/articles/${editingArticle.id}`, {
        method: 'PUT',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          category: editCategory,
          regionId: editRegionId,
          regionName: editRegionId ? (YEMEN_GOVERNORATES.find(g => g.id === editRegionId)?.nameAr || editRegionId) : ''
        })
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMsg('تم تحديث تصنيف وموقع الخبر بنجاح');
        setEditArticleModalOpen(false);
        fetchArticles();
      } else {
        setError(data.error || 'فشل تحديث البيانات');
      }
    } catch {
      setError('حدث خطأ أثناء حفظ التعديلات');
    }
  };

  // Manual Fetch Trigger
  const handleManualFetch = async () => {
    try {
      setSuccessMsg('جاري تشغيل دورة تحديث الأخبار وسحب المصادر...');
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch('/api/admin/news/fetch-manual', { method: 'POST', headers, credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg(`تم التحديث بنجاح! تم جلب ${data.result.summary.articlesNew} خبر جديد.`);
        fetchData();
        if (activeTab === 'articles') fetchArticles();
      } else {
        setError(data.error);
      }
    } catch {
      setError('فشل تشغيل التحديث اليدوي');
    }
  };

  // Add News Source
  const handleAddSource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSourceName || !newSourceUrl) return;
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/admin/news/sources', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({ name: newSourceName, url: newSourceUrl, providerType: newSourceType, country: newSourceCountry })
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg('تم إضافة المصدر بنجاح');
        setNewSourceName('');
        setNewSourceUrl('');
        fetchData();
      } else {
        setError(data.error);
      }
    } catch {
      setError('حدث خطأ أثناء إضافة المصدر');
    }
  };

  const handleDeleteSource = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المصدر؟')) return;
    try {
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      await fetch(`/api/admin/news/sources/${id}`, { method: 'DELETE', headers, credentials: 'include' });
      fetchData();
    } catch {
      setError('فشل حذف المصدر');
    }
  };

  const handleToggleSource = async (id: string) => {
    try {
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      await fetch(`/api/admin/news/sources/${id}/toggle`, { method: 'POST', headers, credentials: 'include' });
      fetchData();
    } catch {
      setError('فشل تغيير حالة المصدر');
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch('/api/admin/news/settings', {
        method: 'PUT',
        headers,
        credentials: 'include',
        body: JSON.stringify(settings)
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg('تم حفظ إعدادات المجدول التلقائي بنجاح');
      } else {
        setError(data.error);
      }
    } catch {
      setError('فشل حفظ الإعدادات');
    }
  };

  return (
    <div className="space-y-6 text-slate-100" dir="rtl">
      
      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-3xl">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
            <Newspaper className="w-6 h-6 text-sky-400" />
            مركز إدارة الأخبار الحقيقية (News Engine Center)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            إدارة ومتابعة الأخبار الحقيقية المجلوبة من المصادر، وإدراجها بضغطة زر في شريط الإعلانات والأخبار.
          </p>
        </div>

        <button
          onClick={handleManualFetch}
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-2xl text-xs font-bold transition-colors shadow-lg shadow-emerald-600/20 cursor-pointer shrink-0"
        >
          <RefreshCw className="w-4 h-4" />
          تشغيل تحديث الأخبار الآن
        </button>
      </div>

      {/* Stats Summary */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
            <div className="text-xs text-slate-400">إجمالي الأخبار المخزنة</div>
            <div className="text-2xl font-black text-white mt-1 font-mono">{stats.totalArticles}</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
            <div className="text-xs text-slate-400">المصادر الإخبارية الفعالة</div>
            <div className="text-2xl font-black text-white mt-1 font-mono">{stats.totalSources}</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
            <div className="text-xs text-slate-400">آخر تحديث ناجح للمحرك</div>
            <div className="text-xs font-bold text-emerald-400 mt-2">
              {stats.lastJob?.finished_at ? new Date(stats.lastJob.finished_at).toLocaleString('ar') : 'مكتمل حالياً'}
            </div>
          </div>
        </div>
      )}

      {/* Feedback Banners */}
      {successMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-bold flex items-center gap-2 shadow-md">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          {successMsg}
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-bold flex items-center gap-2 shadow-md">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          {error}
        </div>
      )}

      {/* Sub Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 text-xs overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('articles')}
          className={`px-4 py-2.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'articles' ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20' : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <Newspaper className="w-4 h-4" />
          <span>الأخبار الحقيقية ({totalCount})</span>
        </button>

        <button
          onClick={() => setActiveTab('sources')}
          className={`px-4 py-2.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'sources' ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20' : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>حالة المصادر ({sources.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('locations')}
          className={`px-4 py-2.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'locations' ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20' : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>المناطق والبدائل</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'settings' ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20' : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>إعدادات المجدول</span>
        </button>

        <button
          onClick={() => setActiveTab('jobs')}
          className={`px-4 py-2.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'jobs' ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20' : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>سجلات التحديث</span>
        </button>
      </div>

      {/* Tab 1: Articles List with Search, Filters & "Add to Ticker" button */}
      {activeTab === 'articles' && (
        <div className="space-y-6">
          
          {/* Filter Bar */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs">
            
            {/* Search */}
            <div className="sm:col-span-4 relative">
              <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="ابحث في الأخبار المخزنة..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') fetchArticles(); }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-10 pl-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>

            {/* Country */}
            <div className="sm:col-span-2">
              <select
                value={filterCountry}
                onChange={(e) => { setFilterCountry(e.target.value); setPage(1); }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500"
              >
                <option value="ALL">جميع الدول</option>
                <option value="YE">اليمن 🇾🇪</option>
                <option value="SA">السعودية 🇸🇦</option>
                <option value="AE">الإمارات 🇦🇪</option>
                <option value="GLOBAL">عالمي 🌍</option>
              </select>
            </div>

            {/* Category */}
            <div className="sm:col-span-3">
              <select
                value={filterCategory}
                onChange={(e) => { setFilterCategory(e.target.value); setPage(1); }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500"
              >
                <option value="all">جميع التصنيفات</option>
                <option value="general">عام</option>
                <option value="politics">سياسة</option>
                <option value="business">اقتصاد</option>
                <option value="technology">تقنية</option>
                <option value="sports">رياضة</option>
              </select>
            </div>

            {/* Source */}
            <div className="sm:col-span-3">
              <select
                value={filterSource}
                onChange={(e) => { setFilterSource(e.target.value); setPage(1); }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500"
              >
                <option value="all">جميع المصادر</option>
                {sources.map(s => (
                  <option key={s.id} value={s.name}>{s.name}</option>
                ))}
              </select>
            </div>

          </div>

          {/* Articles Grid */}
          {loading ? (
            <div className="py-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
              <RefreshCw className="w-5 h-5 text-sky-400 animate-spin" />
              <span>جاري تحميل قائمة الأخبار الحقيقية...</span>
            </div>
          ) : articles.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-400">
              <Newspaper className="w-12 h-12 mx-auto mb-3 opacity-30 text-sky-400" />
              <p className="text-sm font-bold text-white mb-1">لا توجد أخبار مطابقة للفلاتر</p>
              <p className="text-xs text-slate-500">اختر "جميع الدول" أو اضغط على تشغيل تحديث الأخبار الآن.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {articles.map((art) => (
                <div
                  key={art.id}
                  className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-3xl p-5 space-y-4 flex flex-col justify-between shadow-xl transition-all"
                >
                  <div className="space-y-3">
                    
                    {/* Header Badges */}
                    <div className="flex items-center justify-between gap-2 text-[11px]">
                      <span className="bg-sky-500/10 text-sky-400 px-3 py-1 rounded-full font-bold border border-sky-500/20">
                        {art.sourceName || 'مصدر إخباري'}
                      </span>
                      <span className="text-slate-500 font-mono">
                        نشر: {new Date(art.publishedAt).toLocaleDateString('ar')}
                      </span>
                    </div>

                    {/* Image Banner & Title */}
                    <div className="flex gap-3">
                      {art.imageUrl && (
                        <img
                          src={art.imageUrl}
                          alt={art.title}
                          className="w-20 h-20 rounded-2xl object-cover border border-slate-800 shrink-0 bg-slate-950"
                          onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                        />
                      )}
                      <div>
                        <h3 className="text-sm font-bold text-white leading-snug line-clamp-2">
                          {art.title}
                        </h3>
                        <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                          {art.aiSummary || art.description}
                        </p>
                      </div>
                    </div>

                    {/* Metadata Badges */}
                    <div className="flex items-center gap-2 flex-wrap text-[10px] text-slate-400 pt-2 border-t border-slate-800/60">
                      {art.regionName && (
                        <span className="bg-slate-950 px-2.5 py-0.5 rounded-full border border-slate-800 text-sky-300">
                          الموقع: {art.regionName}
                        </span>
                      )}
                      <span className="bg-slate-950 px-2.5 py-0.5 rounded-full border border-slate-800 text-slate-300">
                        التصنيف: {art.category || 'عام'}
                      </span>
                      <span className="bg-emerald-500/10 text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                        AI: {art.aiProcessed ? 'معالج بنجاح' : 'نص أصلي'}
                      </span>
                    </div>

                  </div>

                  {/* Actions Bar */}
                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2 flex-wrap">
                    
                    {/* 📢 Add to News Ticker Button */}
                    <button
                      onClick={() => handleAddToTicker(art)}
                      className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
                      title="إدراج هذا الخبر فوراً في شريط إعلانات المتجر"
                    >
                      <Megaphone className="w-3.5 h-3.5 text-amber-400" />
                      <span>📢 إضافة إلى شريط الأخبار</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      {/* Open Original Source Link */}
                      {art.canonicalUrl || art.url ? (
                        <a
                          href={art.canonicalUrl || art.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                          title="فتح المصدر الأصلي"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      ) : null}

                      {/* Edit Category/Region */}
                      <button
                        onClick={() => {
                          setEditingArticle(art);
                          setEditCategory(art.category || 'general');
                          setEditRegionId(art.regionId || '');
                          setEditArticleModalOpen(true);
                        }}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                        title="تعديل التصنيف والموقع"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete Article */}
                      <button
                        onClick={() => handleDeleteArticle(art.id)}
                        className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
                        title="حذف الخبر"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                  </div>

                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-4">
              <button
                onClick={() => setPage(p => Math.max(p - 1, 1))}
                disabled={page === 1}
                className="p-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-40 cursor-pointer"
              >
                السابق
              </button>
              <span className="text-xs font-bold text-slate-300">
                صفحة {page} من {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                disabled={page === totalPages}
                className="p-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-40 cursor-pointer"
              >
                التالي
              </button>
            </div>
          )}

        </div>
      )}

      {/* Tab 2: Sources Health */}
      {activeTab === 'sources' && (
        <div className="space-y-6">
          <form onSubmit={handleAddSource} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 text-xs">
            <h3 className="font-bold text-white text-sm">إضافة مصدر أخبار جديد</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <input
                type="text"
                placeholder="اسم المصدر (مثال: وكالة الأنباء اليمنية)"
                value={newSourceName}
                onChange={(e) => setNewSourceName(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white"
                required
              />
              <input
                type="url"
                placeholder="رابط RSS أو API"
                value={newSourceUrl}
                onChange={(e) => setNewSourceUrl(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white"
                required
              />
              <select
                value={newSourceType}
                onChange={(e) => setNewSourceType(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white"
              >
                <option value="rss">RSS Feed</option>
                <option value="gnews">GNews API</option>
                <option value="newsapi">NewsAPI</option>
              </select>
              <button
                type="submit"
                className="bg-sky-600 hover:bg-sky-500 text-white px-4 py-2 rounded-xl font-bold transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" /> إضافة مصدر
              </button>
            </div>
          </form>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
            <table className="w-full text-start border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold">
                  <th className="p-4 text-start">المصدر</th>
                  <th className="p-4 text-start">النوع</th>
                  <th className="p-4 text-start">الحالة</th>
                  <th className="p-4 text-start">أخطاء الجلب</th>
                  <th className="p-4 text-end">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {sources.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-800/30">
                    <td className="p-4">
                      <div className="font-bold text-white">{s.name}</div>
                      <div className="text-[10px] text-slate-400 truncate max-w-xs">{s.url}</div>
                    </td>
                    <td className="p-4 uppercase font-bold text-sky-400">{s.provider_type}</td>
                    <td className="p-4">
                      {s.enabled ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">فعال</span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/25">متوقف</span>
                      )}
                    </td>
                    <td className="p-4 font-bold text-rose-400">{s.error_count || 0}</td>
                    <td className="p-4 text-end space-x-2 space-x-reverse">
                      <button
                        onClick={() => handleToggleSource(s.id)}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                      >
                        {s.enabled ? 'إيقاف' : 'تفعيل'}
                      </button>
                      <button
                        onClick={() => handleDeleteSource(s.id)}
                        className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Locations */}
      {activeTab === 'locations' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
          <h3 className="font-bold text-white text-sm mb-4">المناطق والبدائل المسجلة (Locations & Aliases)</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            {locations.map((loc) => (
              <div key={loc.id} className="bg-slate-950 border border-slate-800 p-4 rounded-2xl">
                <div className="font-bold text-white text-sm">{loc.name_ar} ({loc.name_en})</div>
                <div className="text-[11px] text-sky-400 mt-1">الدولة: {loc.country_code} | النوع: {loc.type}</div>
                <div className="mt-3 text-[11px] text-slate-400">
                  <span className="font-bold text-slate-300">المرادفات:</span>{' '}
                  {aliases.filter(a => a.location_id === loc.id).map(a => a.alias).join(', ') || 'لا توجد'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Scheduler Settings */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSaveSettings} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-xl space-y-4 text-xs">
          <h3 className="font-bold text-white text-sm">إعدادات المجدول التلقائي (Scheduler Settings)</h3>
          <div>
            <label className="block font-bold text-slate-300 mb-1">فترة التحديث (بالدقائق)</label>
            <input
              type="number"
              value={settings.updateIntervalMinutes || 180}
              onChange={(e) => setSettings({ ...settings, updateIntervalMinutes: parseInt(e.target.value, 10) || 180 })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white"
              min={15}
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer pt-2">
            <input
              type="checkbox"
              checked={settings.enabled !== false}
              onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
              className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-sky-600"
            />
            <span className="font-bold text-slate-300">تفعيل التحديث التلقائي في الخلفية</span>
          </label>

          <button
            type="submit"
            className="bg-sky-600 hover:bg-sky-500 text-white px-5 py-2.5 rounded-xl font-bold transition-colors cursor-pointer"
          >
            حفظ الإعدادات
          </button>
        </form>
      )}

      {/* Tab 5: Jobs */}
      {activeTab === 'jobs' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
          <table className="w-full text-start border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold">
                <th className="p-4 text-start">رقم المهمة</th>
                <th className="p-4 text-start">وقت البدء</th>
                <th className="p-4 text-start">الحالة</th>
                <th className="p-4 text-start">تم العثور عليه</th>
                <th className="p-4 text-start">جديد</th>
                <th className="p-4 text-start">مكرر</th>
                <th className="p-4 text-start">معالجة AI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {jobs.map((job) => (
                <tr key={job.id} className="hover:bg-slate-800/30">
                  <td className="p-4 font-mono text-sky-400">{job.id}</td>
                  <td className="p-4">{new Date(job.started_at).toLocaleString('ar')}</td>
                  <td className="p-4">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                      {job.status}
                    </span>
                  </td>
                  <td className="p-4 font-bold">{job.articles_found}</td>
                  <td className="p-4 font-bold text-emerald-400">{job.articles_new}</td>
                  <td className="p-4 text-slate-400">{job.articles_duplicate}</td>
                  <td className="p-4 text-sky-400">{job.articles_ai_processed}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Article Modal */}
      {editArticleModalOpen && editingArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl text-slate-100 relative space-y-4">
            <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-3">
              تعديل موقع وتصنيف الخبر
            </h3>
            <p className="text-xs text-slate-400 line-clamp-2">{editingArticle.title}</p>

            <form onSubmit={handleSaveEditArticle} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1">التصنيف</label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white"
                >
                  <option value="general">عام</option>
                  <option value="politics">سياسة</option>
                  <option value="business">اقتصاد</option>
                  <option value="technology">تقنية</option>
                  <option value="sports">رياضة</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">المحافظة / المدينة</label>
                <select
                  value={editRegionId}
                  onChange={(e) => setEditRegionId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white"
                >
                  <option value="">-- بدون تحديد موقع --</option>
                  {YEMEN_GOVERNORATES.map(g => (
                    <option key={g.id} value={g.id}>{g.nameAr}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditArticleModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white bg-slate-800"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-white bg-sky-600 font-bold"
                >
                  حفظ التعديلات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
