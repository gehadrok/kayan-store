import React, { useState, useMemo } from 'react';
import { useLanguage } from '../context/LanguageContext.tsx';
import { Application } from '../types.ts';
import { AppCard } from '../components/common/AppCard.tsx';
import { Search, Filter, X, Smartphone, Layers, Check } from 'lucide-react';

interface CatalogPageProps {
  apps: Application[];
  onNavigate: (path: string) => void;
  onDownloadClick: (app: Application) => void;
}

export const CatalogPage: React.FC<CatalogPageProps> = ({ apps, onNavigate, onDownloadClick }) => {
  const { lang, t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = [
    { key: 'All', labelAr: 'الكل', labelEn: 'All' },
    { key: 'Tools & Documents', labelAr: 'أدوات ومستندات', labelEn: 'Tools & Documents' },
    { key: 'Productivity', labelAr: 'الإنتاجية', labelEn: 'Productivity' },
    { key: 'Utilities', labelAr: 'الخدمات العامة', labelEn: 'Utilities' },
    { key: 'Media', labelAr: 'الوسائط', labelEn: 'Media' }
  ];

  // Robust Search filtering in Arabic and English
  const filteredApps = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return apps.filter(app => {
      // Category match
      if (selectedCategory !== 'All' && app.category !== selectedCategory) {
        return false;
      }

      if (!q) return true;

      // Check names
      const matchNameAr = app.nameAr.toLowerCase().includes(q);
      const matchNameEn = app.nameEn.toLowerCase().includes(q);

      // Check descriptions
      const matchShortAr = app.shortDescAr.toLowerCase().includes(q);
      const matchShortEn = app.shortDescEn.toLowerCase().includes(q);
      const matchFullAr = app.fullDescAr.toLowerCase().includes(q);
      const matchFullEn = app.fullDescEn.toLowerCase().includes(q);

      // Check category
      const matchCategory = app.category.toLowerCase().includes(q);

      // Check package name
      const matchPkg = app.packageName.toLowerCase().includes(q);

      // Check features
      const matchFeatureAr = app.featuresAr?.some(f => f.toLowerCase().includes(q));
      const matchFeatureEn = app.featuresEn?.some(f => f.toLowerCase().includes(q));

      return (
        matchNameAr ||
        matchNameEn ||
        matchShortAr ||
        matchShortEn ||
        matchFullAr ||
        matchFullEn ||
        matchCategory ||
        matchPkg ||
        matchFeatureAr ||
        matchFeatureEn
      );
    });
  }, [apps, searchQuery, selectedCategory]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-8 text-start">

      {/* Header */}
      <div className="border-b border-slate-200 pb-6">
        <div className="flex items-center gap-2 text-xs font-semibold text-sky-600 mb-1">
          <Layers className="h-4 w-4" />
          <span>{lang === 'ar' ? 'متجر تطبيقات كيان المباشر' : 'Official Kayan App Store'}</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
          {t('catalog.title')}
        </h1>
        <p className="text-sm text-slate-500 mt-1 max-w-2xl">
          {t('catalog.subtitle')}
        </p>
      </div>

      {/* Search & Category Filter Controls */}
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative max-w-2xl">
          <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-3.5 text-slate-400">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('catalog.searchPlaceholder')}
            className="w-full rounded-xl border border-slate-200 bg-white py-3 ps-10 pe-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 shadow-xs transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 end-0 flex items-center pe-3 text-slate-400 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Category Segmented Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {categories.map(cat => {
            const isSelected = selectedCategory === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key)}
                className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all ${
                  isSelected
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <span>{lang === 'ar' ? cat.labelAr : cat.labelEn}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Filter Metrics (Zero-Pill rule) */}
      <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
        <div className="flex items-center gap-2">
          <span>{t('catalog.showing')} <strong className="font-semibold text-slate-900">{filteredApps.length}</strong> {t('catalog.appsCount')}</span>
          {searchQuery && (
            <>
              <span aria-hidden="true">·</span>
              <span>«{searchQuery}»</span>
            </>
          )}
        </div>
        {(searchQuery || selectedCategory !== 'All') && (
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('All');
            }}
            className="text-sky-600 hover:text-sky-700 font-medium"
          >
            {t('catalog.clearFilters')}
          </button>
        )}
      </div>

      {/* Applications Grid */}
      {filteredApps.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
          {filteredApps.map(appItem => (
            <AppCard
              key={appItem.id}
              app={appItem}
              onSelect={(slug) => onNavigate(`/apps/${slug}`)}
              onDownloadClick={onDownloadClick}
            />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 text-slate-400">
            <Search className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-base font-bold text-slate-900">
            {t('catalog.noResults')}
          </h3>
          <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
            {lang === 'ar'
              ? 'يرجى تجربة كلمات بحث أخرى أو إعادة ضبط الفلاتر للاطلاع على التطبيقات المتاحة.'
              : 'Try using different keywords or resetting filters to browse all available applications.'}
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('All');
            }}
            className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition-colors"
          >
            {t('catalog.clearFilters')}
          </button>
        </div>
      )}

      {/* Security Statement Footer */}
      <div className="rounded-2xl bg-sky-50/60 border border-sky-100 p-4 text-xs text-sky-900 flex items-center justify-between gap-4">
        <span>
          {lang === 'ar'
            ? 'تطبيق كيان PDF وجميع تطبيقات كيان سوفت يتم نشرها وتوزيع حزمها مباشرة عبر هذا الموقع.'
            : 'All Kayan Soft applications and updates are published and distributed directly through this official portal.'}
        </span>
        <span className="font-mono text-sky-700 shrink-0 font-medium">Android APK</span>
      </div>

    </div>
  );
};
