import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../../context/LanguageContext.tsx';
import type { Product } from '../../types.ts';
import {
  Search, Filter, ShoppingBag, BookOpen, Smartphone, Laptop,
  FileCode, Video, Music, Palette, FileText, ChevronRight,
  Sparkles, Check, ArrowRight, ArrowLeft, RefreshCw
} from 'lucide-react';

interface ProductCatalogPageProps {
  onNavigate: (path: string) => void;
}

export const ProductCatalogPage: React.FC<ProductCatalogPageProps> = ({ onNavigate }) => {
  const { lang, dir, t } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [priceFilter, setPriceFilter] = useState<'all' | 'free' | 'paid'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'price_low' | 'price_high'>('newest');

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      if (data.success && Array.isArray(data.products)) {
        setProducts(data.products);
      } else {
        setProducts([]);
      }
    } catch (err: any) {
      console.error('Failed to load digital products:', err);
      setError(lang === 'ar' ? 'فشل تحميل المنتجات الرقمية' : 'Failed to load digital products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const productTypes = [
    { id: 'all', labelAr: 'جميع المنتجات', labelEn: 'All Products', icon: ShoppingBag },
    { id: 'android_app', labelAr: 'تطبيق', labelEn: 'App', icon: Smartphone },
    { id: 'desktop_software', labelAr: 'برنامج', labelEn: 'Software', icon: Laptop },
    { id: 'ebook', labelAr: 'كتاب إلكتروني', labelEn: 'Ebook', icon: BookOpen },
    { id: 'template', labelAr: 'قالب', labelEn: 'Template', icon: FileCode },
    { id: 'course', labelAr: 'دورة', labelEn: 'Course', icon: Video },
    { id: 'audio', labelAr: 'صوتيات', labelEn: 'Audio', icon: Music },
    { id: 'design', labelAr: 'تصميم', labelEn: 'Design', icon: Palette },
    { id: 'file', labelAr: 'ملف رقمي', labelEn: 'Digital File', icon: FileText },
    { id: 'other', labelAr: 'أخرى', labelEn: 'Other', icon: Sparkles }
  ];

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      // Type filter
      if (selectedType !== 'all' && product.type !== selectedType) {
        return false;
      }
      // Price filter
      if (priceFilter === 'free' && product.price > 0) {
        return false;
      }
      if (priceFilter === 'paid' && (!product.price || product.price === 0)) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchesAr = product.nameAr?.toLowerCase().includes(q) || product.shortDescAr?.toLowerCase().includes(q);
        const matchesEn = product.nameEn?.toLowerCase().includes(q) || product.shortDescEn?.toLowerCase().includes(q);
        const matchesCategory = product.category?.toLowerCase().includes(q);
        const matchesAuthor = product.author?.toLowerCase().includes(q);
        const matchesTags = product.tags?.some(tag => tag.toLowerCase().includes(q));
        if (!matchesAr && !matchesEn && !matchesCategory && !matchesAuthor && !matchesTags) {
          return false;
        }
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === 'price_low') return a.price - b.price;
      if (sortBy === 'price_high') return b.price - a.price;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [products, selectedType, priceFilter, searchQuery, sortBy]);

  const getTypeLabel = (type: string) => {
    const item = productTypes.find(t => t.id === type);
    return item ? (lang === 'ar' ? item.labelAr : item.labelEn) : type;
  };

  const getTypeIcon = (type: string) => {
    const item = productTypes.find(t => t.id === type);
    const IconComponent = item ? item.icon : FileText;
    return <IconComponent className="h-4 w-4" />;
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10" dir={dir}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* Header Banner */}
        <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-sky-950 to-slate-900 p-8 sm:p-12 text-white shadow-xl mb-10 relative overflow-hidden">
          <div className="absolute -top-24 -end-24 w-96 h-96 rounded-full bg-sky-500/10 blur-3xl pointer-events-none" />
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/20 border border-sky-400/30 text-sky-300 text-xs font-semibold mb-4">
              <Sparkles className="h-3.5 w-3.5" />
              <span>{lang === 'ar' ? 'سوق المنتجات الرقمية' : 'Digital Marketplace'}</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4">
              {lang === 'ar' ? 'المنتجات والحلول الرقمية' : 'Digital Products & Solutions'}
            </h1>
            <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
              {lang === 'ar'
                ? 'استكشف منصة كيان الموحدة للمنتجات الرقمية: تطبيقات أندرويد، برمجيات، كتب، قوالب وأدوات إنتاجية معتمدة وموثوقة.'
                : 'Explore Kayan’s unified marketplace: official Android utilities, software, books, templates, and high-standard digital resources.'}
            </p>
          </div>
        </div>

        {/* Search & Filters Control Bar */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-200/80 mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            {/* Search Input */}
            <div className="relative w-full sm:w-96">
              <Search className={`absolute ${lang === 'ar' ? 'right-3.5' : 'left-3.5'} top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400`} />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={lang === 'ar' ? 'ابحث باسم المنتج، الكاتب، أو القسم...' : 'Search products, author, tags...'}
                className={`w-full rounded-xl border border-slate-200 bg-slate-50 ${lang === 'ar' ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition-all`}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className={`absolute ${lang === 'ar' ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600`}
                >
                  ✕
                </button>
              )}
            </div>

            {/* Filter Controls (Price & Sort) */}
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-medium text-slate-700">
                <button
                  onClick={() => setPriceFilter('all')}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${priceFilter === 'all' ? 'bg-white shadow-xs font-semibold text-slate-900' : 'hover:text-slate-900'}`}
                >
                  {lang === 'ar' ? 'الكل' : 'All'}
                </button>
                <button
                  onClick={() => setPriceFilter('free')}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${priceFilter === 'free' ? 'bg-white shadow-xs font-semibold text-emerald-700' : 'hover:text-slate-900'}`}
                >
                  {lang === 'ar' ? 'مجاني' : 'Free'}
                </button>
                <button
                  onClick={() => setPriceFilter('paid')}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${priceFilter === 'paid' ? 'bg-white shadow-xs font-semibold text-sky-700' : 'hover:text-slate-900'}`}
                >
                  {lang === 'ar' ? 'مدفوع' : 'Paid'}
                </button>
              </div>

              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:border-sky-500 focus:outline-none"
              >
                <option value="newest">{lang === 'ar' ? 'الأحدث أولاً' : 'Newest'}</option>
                <option value="price_low">{lang === 'ar' ? 'السعر: من الأقل للأعلى' : 'Price: Low to High'}</option>
                <option value="price_high">{lang === 'ar' ? 'السعر: من الأعلى للأقل' : 'Price: High to Low'}</option>
              </select>
            </div>
          </div>

          {/* Product Type Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-2 scrollbar-none">
            {productTypes.map(typeItem => {
              const Icon = typeItem.icon;
              const isSelected = selectedType === typeItem.id;
              return (
                <button
                  key={typeItem.id}
                  onClick={() => setSelectedType(typeItem.id)}
                  className={`flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
                    isSelected
                      ? 'bg-sky-600 text-white shadow-sm shadow-sky-600/20'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{lang === 'ar' ? typeItem.labelAr : typeItem.labelEn}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Results Info & Count */}
        <div className="flex items-center justify-between text-xs text-slate-500 mb-6 px-1">
          <span>
            {lang === 'ar'
              ? `عرض ${filteredProducts.length} منتج${filteredProducts.length === 1 ? '' : 'اً'}`
              : `Showing ${filteredProducts.length} product${filteredProducts.length === 1 ? '' : 's'}`}
          </span>
          {(selectedType !== 'all' || priceFilter !== 'all' || searchQuery) && (
            <button
              onClick={() => {
                setSelectedType('all');
                setPriceFilter('all');
                setSearchQuery('');
              }}
              className="text-sky-600 hover:underline font-medium"
            >
              {lang === 'ar' ? 'إعادة ضبط الفلاتر' : 'Reset filters'}
            </button>
          )}
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
              <div key={n} className="rounded-2xl border border-slate-200 bg-white p-5 animate-pulse">
                <div className="h-44 bg-slate-100 rounded-xl mb-4" />
                <div className="h-4 bg-slate-200 rounded w-2/3 mb-2" />
                <div className="h-3 bg-slate-100 rounded w-full mb-4" />
                <div className="h-8 bg-slate-100 rounded-lg" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center text-rose-700">
            <p className="font-semibold mb-3">{error}</p>
            <button
              onClick={fetchProducts}
              className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>{lang === 'ar' ? 'إعادة المحاولة' : 'Try again'}</span>
            </button>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
            <ShoppingBag className="mx-auto h-12 w-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-bold text-slate-800 mb-2">
              {lang === 'ar' ? 'لم يتم العثور على منتجات مطابقة' : 'No matching products found'}
            </h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
              {lang === 'ar'
                ? 'جرب تغيير شروط البحث أو الفلاتر المختارة للعثور على ما تبحث عنه.'
                : 'Try adjusting your search query or filters to discover available digital items.'}
            </p>
            <button
              onClick={() => {
                setSelectedType('all');
                setPriceFilter('all');
                setSearchQuery('');
              }}
              className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition-colors"
            >
              {lang === 'ar' ? 'عرض جميع المنتجات' : 'View all products'}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map(product => {
              const isFree = !product.price || product.price === 0;
              const title = (lang === 'ar' ? product.nameAr : product.nameEn) || product.nameEn;
              const desc = (lang === 'ar' ? product.shortDescAr : product.shortDescEn) || product.shortDescEn;

              return (
                <div
                  key={product.id}
                  onClick={() => onNavigate(`/products/${product.slug}`)}
                  className="group flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs hover:shadow-xl hover:border-sky-300 transition-all cursor-pointer relative"
                >
                  {/* Top Badges: Type & Price */}
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-sky-50 px-2.5 py-1 text-[11px] font-semibold text-sky-700">
                        {getTypeIcon(product.type)}
                        <span>{getTypeLabel(product.type)}</span>
                      </span>

                      {isFree ? (
                        <span className="rounded-lg bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                          {lang === 'ar' ? 'مجاني' : 'Free'}
                        </span>
                      ) : (
                        <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-800">
                          {product.price} {product.currency || 'USD'}
                        </span>
                      )}
                    </div>

                    {/* Media Image / Icon Banner */}
                    <div className="relative h-40 w-full overflow-hidden rounded-xl bg-slate-100 mb-4 border border-slate-100 flex items-center justify-center">
                      {product.coverUrl || product.bannerUrl || product.iconUrl ? (
                        <img
                          src={product.coverUrl || product.bannerUrl || product.iconUrl}
                          alt={title}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          onError={(e: any) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = '/assets/images/kayan_pdf_icon.jpg';
                          }}
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-slate-400 gap-2">
                          <ShoppingBag className="h-10 w-10 text-slate-300" />
                          <span className="text-[10px] font-medium uppercase tracking-wider">{product.type}</span>
                        </div>
                      )}
                      {product.featured && (
                        <div className="absolute top-2 start-2 rounded-md bg-amber-500/90 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
                          {lang === 'ar' ? 'مميز' : 'Featured'}
                        </div>
                      )}
                    </div>

                    {/* Title & Author */}
                    <h3 className="font-bold text-slate-900 group-hover:text-sky-600 transition-colors text-base line-clamp-1 mb-1">
                      {title}
                    </h3>
                    {product.author && (
                      <p className="text-xs text-slate-500 mb-2 font-medium">
                        {lang === 'ar' ? `بواسطة: ${product.author}` : `By: ${product.author}`}
                      </p>
                    )}

                    {/* Short Description */}
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-4">
                      {desc}
                    </p>
                  </div>

                  {/* Card Footer: Metadata info & Action */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div className="text-[11px] text-slate-500">
                      {product.type === 'android_app' && product.versionName && (
                        <span>v{product.versionName}</span>
                      )}
                      {product.type === 'ebook' && product.pages && (
                        <span>{product.pages} {lang === 'ar' ? 'صفحة' : 'pages'}</span>
                      )}
                      {product.category && (
                        <span className="capitalize">{product.category}</span>
                      )}
                    </div>

                    <div className="inline-flex items-center gap-1 text-xs font-semibold text-sky-600 group-hover:text-sky-700">
                      <span>{lang === 'ar' ? 'التفاصيل' : 'Details'}</span>
                      {dir === 'rtl' ? <ArrowLeft className="h-3.5 w-3.5" /> : <ArrowRight className="h-3.5 w-3.5" />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
};
