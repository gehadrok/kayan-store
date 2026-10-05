import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext.tsx';
import {
  Newspaper,
  Globe,
  MapPin,
  Tag,
  Search,
  ExternalLink,
  Sparkles,
  RefreshCw,
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  AlertCircle,
  Calendar,
  Filter,
  Flame,
  Building2,
  ListFilter
} from 'lucide-react';
import { KAYAN_NEWS_LOGO } from '../../utils/assets.ts';
import { YEMEN_GOVERNORATES, Governorate, District } from '../../data/yemenLocations.ts';
import { normalizeCategory, normalizeCountryCode, getCategoryNameAr, getCountryNameAr } from '../../utils/newsUtils.ts';

interface NewsSectionProps {
  onNavigate?: (path: string) => void;
}

export const NewsSection: React.FC<NewsSectionProps> = ({ onNavigate }) => {
  const { lang, dir, t } = useLanguage();
  // Main Data States
  const [articles, setArticles] = useState<any[]>([]);
  const [breakingNews, setBreakingNews] = useState<any[]>([]);
  const [tickerSpeed, setTickerSpeed] = useState<'slow' | 'medium' | 'fast'>('medium');
  const [sourcesList, setSourcesList] = useState<string[]>([
    'يمن مونيتور',
    'المشهد اليمني',
    'BBC Arabic',
    'الجزيرة نت',
    'سكاي نيوز عربية',
    'فرانس 24',
    'RT Arabic'
  ]);

  // Main Filter States
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedGovernorateId, setSelectedGovernorateId] = useState<string>('');
  const [selectedDistrictName, setSelectedDistrictName] = useState<string>('');
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Pagination, Loading & Error
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [searchingMore, setSearchingMore] = useState<boolean>(false);
  const [selectedArticle, setSelectedArticle] = useState<any | null>(null);

  // Category Tabs Configuration
  const categories = [
    { id: 'all', nameAr: '🌐 الكل', icon: Globe },
    { id: 'general', nameAr: '📰 عام', icon: Newspaper },
    { id: 'politics', nameAr: '🏛️ سياسة', icon: Building2 },
    { id: 'business', nameAr: '📈 اقتصاد', icon: Tag },
    { id: 'technology', nameAr: '💻 تقنية', icon: Sparkles },
    { id: 'sports', nameAr: '⚽ رياضة', icon: Tag }
  ];

  // Countries Configuration
  const countries = [
    { id: 'ALL', nameAr: '🌍 الكل' },
    { id: 'YE', nameAr: '🇾🇪 اليمن' },
    { id: 'SA', nameAr: '🇸🇦 السعودية' },
    { id: 'AE', nameAr: '🇦🇪 الإمارات' },
    { id: 'GLOBAL', nameAr: '🌐 عالمي' }
  ];

  // Main Filter State
  const [filterCountry, setFilterCountry] = useState<string>('ALL');

  // 1. Sync filters from URL on mount and popstate
  useEffect(() => {
    const handleSyncFromUrl = () => {
      const params = new URLSearchParams(window.location.search);
      const rawCat = params.get('category') || 'all';
      const cat = normalizeCategory(rawCat);
      const reg = params.get('region') || '';
      const dist = params.get('district') || '';
      const src = params.get('source') || 'all';
      const q = params.get('q') || '';
      const p = parseInt(params.get('page') || '1', 10);
      const rawCountry = params.get('country') || 'ALL';
      const country = normalizeCountryCode(rawCountry);

      setSelectedCategory(cat);
      setSelectedGovernorateId(reg);
      setSelectedDistrictName(dist);
      setSelectedSource(src);
      setSearchQuery(q);
      setPage(Math.max(1, p));
      setFilterCountry(country);
    };

    handleSyncFromUrl();
    window.addEventListener('popstate', handleSyncFromUrl);
    return () => window.removeEventListener('popstate', handleSyncFromUrl);
  }, []);

  // 2. Update URL when filters change
  const updateUrl = (updates: any) => {
    const params = new URLSearchParams(window.location.search);
    Object.keys(updates).forEach(key => {
      const val = updates[key];
      if (val === null || val === '' || val === 'all' || val === 'ALL' || (key === 'page' && val === 1)) {
        params.delete(key);
      } else {
        params.set(key, String(val));
      }
    });
    
    const queryString = params.toString();
    const newUrl = `/news${queryString ? '?' + queryString : ''}`;
    
    // Only push if URL actually changed to avoid redundant history entries
    if (window.location.pathname + window.location.search !== newUrl) {
      window.history.pushState({}, '', newUrl);
    }
  };

  // Load articles when filters change (triggered by state changes which are synced to URL)
  useEffect(() => {
    const controller = new AbortController();
    fetchArticles(undefined, controller.signal);
    return () => {
      controller.abort();
    };
  }, [
    filterCountry,
    selectedCategory,
    selectedGovernorateId,
    selectedDistrictName,
    selectedSource,
    searchQuery,
    page
  ]);

  // Fetch articles from API
  const fetchArticles = async (extraSearchQuery?: string, signal?: AbortSignal) => {
    setLoading(true);
    setFetchError(null);
    try {
      const params = new URLSearchParams();

      if (filterCountry && filterCountry !== 'ALL') {
        params.set('country', filterCountry);
      }

      if (selectedCategory && selectedCategory !== 'all') {
        params.set('category', selectedCategory);
      }

      // Governorate & District
      if (selectedGovernorateId) {
        params.set('regionId', selectedGovernorateId);
      }

      if (selectedDistrictName) {
        params.set('district', selectedDistrictName);
      }

      // Source Filter
      if (selectedSource && selectedSource !== 'all') {
        params.set('sourceName', selectedSource);
      }

      // Date Range
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);

      // Search Query
      const q = extraSearchQuery !== undefined ? extraSearchQuery : searchQuery;
      if (q) params.set('search', q);

      params.set('page', page.toString());
      params.set('limit', '9');

      const res = await fetch(`/api/news?${params.toString()}`, { signal });
      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }
      const data = await res.json();

      if (data.success) {
        setArticles(data.articles || []);
        if (data.breakingNews && Array.isArray(data.breakingNews)) {
          setBreakingNews(data.breakingNews);
        }
        if (data.pagination) {
          setTotalPages(data.pagination.totalPages || 1);
          setTotalCount(data.pagination.total || 0);
        }
      } else {
        setFetchError(data.error || 'فشل في جلب الأخبار');
      }
    } catch (err: any) {
      if (err.name === 'AbortError' || signal?.aborted) {
        return;
      }
      console.warn('News articles fetch warning:', err?.message || err);
      setFetchError('تعذر الاتصال بالخادم لجلب الأخبار');
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  };

  const handleCountryChange = (countryId: string) => {
    setFilterCountry(countryId);
    setSelectedGovernorateId('');
    setSelectedDistrictName('');
    setPage(1);
    updateUrl({ 
      country: countryId, 
      region: null, 
      district: null, 
      page: 1 
    });
  };

  const handleCategoryChange = (catId: string) => {
    setSelectedCategory(catId);
    setPage(1);
    updateUrl({ category: catId, page: 1 });
  };

  const handleRegionChange = (regId: string) => {
    setSelectedGovernorateId(regId);
    setSelectedDistrictName('');
    setPage(1);
    updateUrl({ region: regId, district: null, page: 1 });
  };

  const handlePageChange = (p: number) => {
    setPage(p);
    updateUrl({ page: p });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle Search Submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    updateUrl({ q: searchQuery, page: 1 });
    fetchArticles();
  };

  // Reset Filters
  const handleResetFilters = () => {
    setFilterCountry('ALL');
    setSelectedCategory('all');
    setSelectedGovernorateId('');
    setSelectedDistrictName('');
    setSelectedSource('all');
    setSearchQuery('');
    setStartDate('');
    setEndDate('');
    setPage(1);
    window.history.pushState({}, '', '/news');
  };

  const handleArticleClick = (art: any) => {
    if (onNavigate) {
      onNavigate(`/news/${art.id}`);
    } else {
      window.history.pushState({}, '', `/news/${art.id}`);
      window.dispatchEvent(new Event('popstate'));
    }
  };

  // Get active governorate object (Hardcoded mapping for Yemen for UI efficiency)
  const yemenRegions = YEMEN_GOVERNORATES;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-slate-100" dir="rtl">
      
      {/* 1. Live Breaking News Ticker */}
      {breakingNews.length > 0 && (
        <div className="mb-8 bg-slate-900/90 border border-red-500/30 rounded-2xl p-2.5 shadow-xl backdrop-blur-md flex items-center gap-3 overflow-hidden">
          <div className="flex items-center gap-2 bg-red-600 text-white px-3 py-1.5 rounded-xl text-xs font-black shrink-0 animate-pulse shadow-md shadow-red-600/30">
            <Flame className="w-4 h-4 text-amber-300" />
            <span>{t('news.breaking')}</span>
          </div>

          <div className="overflow-hidden relative w-full group">
            <div
              className="flex items-center gap-8 whitespace-nowrap animate-marquee group-hover:[animation-play-state:paused]"
              style={{ animationDuration: `${tickerSpeed === 'slow' ? 60 : tickerSpeed === 'fast' ? 15 : 35}s` }}
            >
              {breakingNews.map((item, idx) => (
                <button
                  key={item.id || idx}
                  onClick={() => handleArticleClick(item)}
                  className="text-xs font-bold text-slate-200 hover:text-sky-400 transition-colors inline-flex items-center gap-2 cursor-pointer"
                >
                  <span className="text-red-400 font-mono text-[11px]">• [{item.sourceName || t('news.breaking')}]</span>
                  <span>{item.title}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* RIGHT SIDE: MAIN FEED (Col 1-9) */}
        <div className="lg:col-span-9 space-y-8">
          
          {/* Main Header */}
          <div className="flex flex-col items-center justify-center text-center bg-slate-900/90 border border-slate-800 p-8 rounded-3xl backdrop-blur-xl relative overflow-hidden shadow-2xl">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="w-20 h-20 rounded-2xl overflow-hidden border border-slate-700 bg-slate-950 p-1 mb-4 shadow-xl">
              <img src={KAYAN_NEWS_LOGO} alt={t('news.title')} className="w-full h-full object-cover rounded-xl" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white mb-2">{lang === 'ar' ? 'كيان الإخبارية العالمية' : 'Kayan Global News'}</h1>
            <p className="text-xs text-slate-400 max-w-lg leading-relaxed">
              {lang === 'ar' ? 'تغطية شاملة ومحللة بالذكاء الاصطناعي مع الحفاظ على الحياد التام والمصادر الأصلية الموثوقة.' : 'Comprehensive AI-analyzed coverage maintaining strict neutrality and trusted original sources.'}
            </p>
          </div>

          {/* Advanced Filter UI */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-6 shadow-xl">
            {/* Country Selector */}
            <div className="space-y-3">
              <label className="text-[11px] font-black text-sky-400 uppercase tracking-widest flex items-center gap-2">
                <Globe className="w-3.5 h-3.5" /> اختر الدولة أو النطاق
              </label>
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                {countries.map(c => (
                  <button
                    key={c.id}
                    onClick={() => handleCountryChange(c.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                      filterCountry === c.id 
                        ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/20' 
                        : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {c.nameAr}
                  </button>
                ))}
              </div>
            </div>

            {/* Region Selector (If Yemen is selected) */}
            {filterCountry === 'YE' && (
              <div className="space-y-3 pt-4 border-t border-slate-800 animate-in fade-in">
                <label className="text-[11px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5" /> المحافظات والمدن اليمنية
                </label>
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                  <button
                    onClick={() => handleRegionChange('')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                      !selectedGovernorateId 
                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' 
                        : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    جميع المحافظات
                  </button>
                  {yemenRegions.map(g => (
                    <button
                      key={g.id}
                      onClick={() => handleRegionChange(g.id)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                        selectedGovernorateId === g.id 
                          ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' 
                          : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {g.nameAr}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Category Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pt-4 border-t border-slate-800 pb-2 scrollbar-none">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryChange(cat.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
                    selectedCategory === cat.id 
                      ? 'bg-slate-100 text-slate-900 shadow-xl' 
                      : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <span>{cat.nameAr}</span>
                </button>
              ))}
            </div>

            {/* Search and Source Bar */}
            <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-4 border-t border-slate-800">
              <div className="md:col-span-8 relative">
                <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input 
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ابحث في الأخبار..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl pr-10 pl-4 py-3 text-xs text-white focus:outline-none focus:border-sky-500 transition-all"
                />
              </div>
              <button 
                type="submit"
                className="md:col-span-4 bg-sky-600 hover:bg-sky-500 text-white py-3 rounded-2xl text-xs font-black transition-all shadow-lg shadow-sky-600/20 flex items-center justify-center gap-2"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> تحديث النتائج
              </button>
            </form>
          </div>

          {/* Main Grid Feed */}
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-4 text-slate-500">
              <RefreshCw className="w-10 h-10 animate-spin text-sky-500" />
              <p className="text-sm font-bold">جاري جلب أحدث الأخبار المحللة...</p>
            </div>
          ) : fetchError ? (
            <div className="py-16 text-center bg-red-950/20 border border-red-900/50 rounded-3xl p-8 space-y-5">
              <div className="w-16 h-16 bg-red-900/30 rounded-2xl flex items-center justify-center mx-auto text-red-400">
                <AlertCircle className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-base font-bold text-red-200">تعذر تحميل الأخبار</h3>
                <p className="text-xs text-red-400/80 max-w-md mx-auto">{fetchError}</p>
              </div>
              <button 
                onClick={() => fetchArticles()}
                className="bg-red-600 hover:bg-red-500 text-white px-5 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-lg shadow-red-600/20 inline-flex items-center gap-2"
              >
                <RefreshCw className="w-3.5 h-3.5" /> إعادة المحاولة
              </button>
            </div>
          ) : articles.length === 0 ? (
            <div className="py-20 text-center bg-slate-900/40 border border-slate-800 border-dashed rounded-3xl p-8 space-y-6">
              <div className="w-16 h-16 bg-sky-500/10 border border-sky-500/20 rounded-2xl flex items-center justify-center mx-auto text-sky-400">
                <Newspaper className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-base font-bold text-white">لا توجد أخبار مطابقة حالياً</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                  لم نجد أخباراً لـ <span className="text-sky-400 font-bold">
                    {selectedGovernorateId ? (yemenRegions.find(r => r.id === selectedGovernorateId)?.nameAr || selectedGovernorateId) : getCountryNameAr(filterCountry)}
                  </span>
                  {selectedCategory !== 'all' && (
                    <span> في تصنيف <span className="text-emerald-400 font-bold">{getCategoryNameAr(selectedCategory)}</span></span>
                  )}.
                </p>
                <p className="text-[11px] text-slate-500">يمكنك تجربة تغيير التصنيف أو إعادة ضبط الفلاتر لتصفح جميع الأخبار.</p>
              </div>
              <div className="flex items-center justify-center gap-3">
                <button 
                   onClick={handleResetFilters}
                   className="bg-slate-800 hover:bg-slate-700 text-white px-5 py-2.5 rounded-2xl text-xs font-bold transition-all"
                >
                  عرض جميع الأخبار
                </button>
                <button 
                   onClick={() => fetchArticles()}
                   className="bg-sky-600 hover:bg-sky-500 text-white px-5 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-lg shadow-sky-600/20 flex items-center gap-2"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> تحديث النتائج
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles.map((art) => (
                <div 
                  key={art.id} 
                  onClick={() => handleArticleClick(art)}
                  className="group bg-slate-900 border border-slate-800 hover:border-sky-500/40 rounded-3xl overflow-hidden shadow-xl transition-all duration-300 hover:-translate-y-1.5 cursor-pointer flex flex-col"
                >
                  <div className="h-44 relative bg-slate-950 overflow-hidden">
                    {art.imageUrl ? (
                      <img src={art.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-950 opacity-20"><Newspaper className="w-12 h-12" /></div>
                    )}
                    <div className="absolute top-4 right-4 bg-slate-950/80 backdrop-blur-md border border-slate-700/50 px-3 py-1 rounded-full text-[10px] font-black text-sky-400">
                      {art.sourceName}
                    </div>
                  </div>
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <h3 className="text-sm font-bold text-white leading-snug group-hover:text-sky-400 transition-colors line-clamp-2">
                        {art.title}
                      </h3>
                      <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed opacity-80">
                        {art.description}
                      </p>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-slate-800/60">
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold">
                        <Sparkles className="w-3 h-3 text-sky-500" /> Kayan AI
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(art.publishedAt).toLocaleDateString('ar')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-6 pb-12">
              <button 
                disabled={page === 1}
                onClick={() => handlePageChange(page - 1)}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-1 px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold">
                <span className="text-sky-400">{page}</span>
                <span className="text-slate-600">/</span>
                <span className="text-slate-400">{totalPages}</span>
              </div>

              <button 
                disabled={page === totalPages}
                onClick={() => handlePageChange(page + 1)}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            </div>
          )}

        </div>

        {/* LEFT SIDE: LATEST NEWS SIDEBAR (Col 10-12) */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl sticky top-24">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-black text-white flex items-center gap-2">
                <Filter className="w-4 h-4 text-sky-500" /> {t('news.latest')}
              </h2>
              <span className="text-[10px] bg-sky-500/10 text-sky-400 px-2 py-0.5 rounded-full font-bold">{lang === 'ar' ? 'مباشر' : 'Live'}</span>
            </div>
            
            <div className="space-y-4">
              {breakingNews.length === 0 ? (
                <div className="py-8 text-center text-slate-600 text-[10px]">
                  {t('news.noArticles')}
                </div>
              ) : (
                breakingNews.slice(0, 10).map((art) => (
                  <div 
                    key={art.id} 
                    onClick={() => handleArticleClick(art)}
                    className="group flex gap-3 cursor-pointer hover:bg-slate-800/40 p-2 -mx-2 rounded-2xl transition-all border border-transparent hover:border-slate-700"
                  >
                    <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-slate-800 bg-slate-950 relative">
                      {art.imageUrl ? (
                        <img src={art.imageUrl} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" alt="" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center opacity-20"><Newspaper className="w-6 h-6" /></div>
                      )}
                    </div>
                    <div className="space-y-1 min-w-0 flex-1">
                      <h3 className="text-[11px] font-bold text-slate-300 leading-snug group-hover:text-sky-400 transition-colors line-clamp-2">
                        {art.title}
                      </h3>
                      <div className="flex items-center justify-between text-[9px] text-slate-500 font-bold mt-1">
                        <span className="text-sky-600/80 truncate max-w-[60px]">{art.sourceName}</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-2.5 h-2.5" />
                          {new Date(art.publishedAt).toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-6 pt-5 border-t border-slate-800">
               <button 
                 onClick={() => {
                   setSearchQuery('');
                   setPage(1);
                   updateUrl({ q: null, page: 1 });
                   window.scrollTo({ top: 0, behavior: 'smooth' });
                 }}
                 className="w-full bg-slate-950 border border-slate-800 text-[10px] font-black text-slate-400 py-2.5 rounded-xl hover:text-white hover:border-slate-600 transition-all uppercase tracking-widest flex items-center justify-center gap-2"
               >
                 عرض الكل <ChevronLeft className="w-3 h-3" />
               </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
