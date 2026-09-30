import React from 'react';
import { useLanguage } from '../context/LanguageContext.tsx';
import { Application } from '../types.ts';
import { AppCard } from '../components/common/AppCard.tsx';
import {
  Download, Shield, Cpu, Lock, CheckCircle2,
  ArrowRight, ArrowLeft, Smartphone, FileText,
  Layers, ExternalLink, HardDrive, Check
} from 'lucide-react';
import { getSafeAssetUrl, KAYAN_PDF_ICON, KAYAN_PDF_BANNER } from '../utils/assets.ts';

interface HomePageProps {
  apps: Application[];
  onNavigate: (path: string) => void;
  onDownloadClick: (app: Application) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ apps, onNavigate, onDownloadClick }) => {
  const { lang, dir, t } = useLanguage();

  const featuredApp = apps.find(a => a.featured) || apps[0];
  const latestApps = apps.slice(0, 6);

  const categories = [
    { key: 'Tools & Documents', nameAr: 'أدوات ومستندات', nameEn: 'Tools & Documents', count: 1, icon: FileText },
    { key: 'Productivity', nameAr: 'الإنتاجية والعمل', nameEn: 'Productivity', count: 0, icon: Layers },
    { key: 'Utilities', nameAr: 'الخدمات العامة', nameEn: 'Utilities', count: 0, icon: HardDrive },
    { key: 'Media', nameAr: 'الوسائط والصور', nameEn: 'Media & Photos', count: 0, icon: Smartphone }
  ];

  return (
    <div className="space-y-20 pb-16">

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 md:pt-18 md:pb-24 border-b border-slate-200/60 kayan-gradient-hero">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">

            {/* Left/Start Column: Text & CTAs (7 cols) */}
            <div className="lg:col-span-7 space-y-6 text-start">

              {/* Official Badge - Quiet text kicker */}
              <div className="flex items-center gap-2 text-xs font-semibold text-sky-700">
                <span className="flex h-2 w-2 rounded-full bg-sky-500 animate-pulse" />
                <span>{lang === 'ar' ? 'المتجر الرسمي لتطبيقات كيان سوفت' : 'Official Kayan Soft Distribution Platform'}</span>
                <span aria-hidden="true" className="text-slate-300">·</span>
                <span>© 2026</span>
              </div>

              {/* Main Headline */}
              <div className="space-y-3">
                <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl leading-tight">
                  {lang === 'ar' ? 'منصة كيان الرقمية' : 'Kayan Digital Platform'}
                </h1>
                <p className="text-xl font-semibold text-sky-600">
                  {lang === 'ar' ? '«اكتشف التطبيقات والبرامج والمنتجات الرقمية وأدوات الذكاء الاصطناعي في مكان واحد.»' : '"Discover apps, software, digital products, and AI tools in one place."'}
                </p>
              </div>

              {/* Subtext */}
              <p className="text-base text-slate-600 leading-relaxed max-w-2xl">
                {t('hero.description')}
              </p>

              {/* Trust Markers */}
              <div className="flex flex-wrap items-center gap-y-2 gap-x-5 text-xs text-slate-500 pt-1">
                <div className="flex items-center gap-1.5 font-medium text-slate-700">
                  <CheckCircle2 className="h-4 w-4 text-sky-600" />
                  <span>{t('hero.verifiedApks')}</span>
                </div>
                <div className="flex items-center gap-1.5 font-medium text-slate-700">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>{lang === 'ar' ? 'معالجة محلية 100% دون إنترنت' : '100% Local On-Device Processing'}</span>
                </div>
                <div className="flex items-center gap-1.5 font-medium text-slate-700">
                  <CheckCircle2 className="h-4 w-4 text-sky-600" />
                  <span>{t('hero.independent')}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-4">
                <button
                  onClick={() => onNavigate('/apps')}
                  className="flex items-center gap-2 rounded-xl bg-sky-600 px-6 py-3.5 text-sm font-bold text-white shadow-sm hover:bg-sky-500 transition-all active:scale-98"
                >
                  <Download className="h-4 w-4" />
                  <span>{lang === 'ar' ? 'استعرض المنصة' : 'Explore Platform'}</span>
                </button>

                {featuredApp && (
                  <button
                    onClick={() => onNavigate(`/apps/${featuredApp.slug}`)}
                    className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                  >
                    <span>{lang === 'ar' ? 'استكشف التطبيقات' : 'Explore Apps'}</span>
                    {dir === 'rtl' ? <ArrowLeft className="h-4 w-4 text-slate-400" /> : <ArrowRight className="h-4 w-4 text-slate-400" />}
                  </button>
                )}
              </div>

            </div>

            {/* Right/End Column: Interactive App Hero Visualizer (5 cols) */}
            <div className="lg:col-span-5">
              <div className="relative rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xl shadow-sky-500/5">
                {/* Visual Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 p-2 border border-sky-100">
                      <img
                        src={KAYAN_PDF_ICON}
                        alt="Kayan PDF"
                        className="h-full w-full object-contain rounded-lg"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = KAYAN_PDF_ICON;
                        }}
                      />
                    </div>
                    <div className="text-start">
                      <h4 className="text-base font-bold text-slate-900">
                        {lang === 'ar' ? 'كيان PDF' : 'Kayan PDF'}
                      </h4>
                      <p className="text-xs text-slate-500 font-mono">
                        v1.0.0 · com.kayansoft.kayanpdf
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                    {lang === 'ar' ? 'إصدار رسمي' : 'Official'}
                  </span>
                </div>

                {/* Banner illustration */}
                <div className="mt-4 overflow-hidden rounded-2xl border border-slate-100">
                  <img
                    src={KAYAN_PDF_BANNER}
                    alt="Kayan PDF Features"
                    className="h-44 w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = KAYAN_PDF_BANNER;
                    }}
                  />
                </div>

                {/* Highlights List */}
                <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-600 text-start">
                  <div className="flex items-center gap-1.5 p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <Check className="h-3.5 w-3.5 text-sky-600 shrink-0" />
                    <span className="truncate">{lang === 'ar' ? 'تحويل الصور لـ PDF' : 'Images to PDF'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <Check className="h-3.5 w-3.5 text-sky-600 shrink-0" />
                    <span className="truncate">{lang === 'ar' ? 'مسح بالكاميرا' : 'Camera Scanner'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <Check className="h-3.5 w-3.5 text-sky-600 shrink-0" />
                    <span className="truncate">{lang === 'ar' ? 'ضغط ودمج الملفات' : 'Compress & Merge'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span className="truncate">{lang === 'ar' ? '100% بدون إنترنت' : '100% Offline'}</span>
                  </div>
                </div>

                {/* Direct Action */}
                <div className="mt-5 flex items-center gap-2">
                  <button
                    onClick={() => featuredApp && onDownloadClick(featuredApp)}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-sky-600 py-3 text-xs font-bold text-white shadow-sm hover:bg-sky-500 transition-all active:scale-98"
                  >
                    <Download className="h-4 w-4" />
                    <span>{lang === 'ar' ? 'تحميل مباشر (APK)' : 'Download APK Direct'}</span>
                  </button>
                  <button
                    onClick={() => featuredApp && onNavigate(`/apps/${featuredApp.slug}`)}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    {lang === 'ar' ? 'عرض المواصفات' : 'Specs'}
                  </button>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Featured Application Deep-Dive */}
      {featuredApp && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-slate-200 bg-gradient-to-b from-white to-slate-50/50 p-6 sm:p-10 shadow-sm text-start">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-center">

              <div className="lg:col-span-4 flex flex-col items-center sm:items-start text-center sm:text-start space-y-4">
                <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-white p-3.5 shadow-md border border-slate-100">
                  <img
                    src={getSafeAssetUrl(featuredApp.iconUrl, KAYAN_PDF_ICON)}
                    alt={featuredApp.nameAr}
                    className="h-full w-full object-contain rounded-2xl"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = KAYAN_PDF_ICON;
                    }}
                  />
                </div>
                <div>
                  <div className="text-xs font-semibold text-sky-600 mb-1">
                    {lang === 'ar' ? 'التطبيق المميز' : 'Featured App'} · {featuredApp.category}
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900">
                    {lang === 'ar' ? featuredApp.nameAr : featuredApp.nameEn}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono mt-1">
                    {featuredApp.packageName}
                  </p>
                </div>
                <p className="text-sm leading-relaxed text-slate-600">
                  {lang === 'ar' ? featuredApp.shortDescAr : featuredApp.shortDescEn}
                </p>
                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={() => onDownloadClick(featuredApp)}
                    className="flex items-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-sky-500 transition-all active:scale-98"
                  >
                    <Download className="h-4 w-4" />
                    <span>{t('card.download')}</span>
                  </button>
                  <button
                    onClick={() => onNavigate(`/apps/${featuredApp.slug}`)}
                    className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <span>{t('card.details')}</span>
                    {dir === 'rtl' ? <ArrowLeft className="h-3.5 w-3.5" /> : <ArrowRight className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              {/* Features Grid */}
              <div className="lg:col-span-8 border-t lg:border-t-0 lg:border-s border-slate-200 pt-6 lg:pt-0 lg:ps-8">
                <h4 className="text-sm font-bold uppercase tracking-wider text-slate-900 mb-4">
                  {lang === 'ar' ? 'أبرز مميزات التطبيق' : 'Application Highlights'}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {(lang === 'ar' ? featuredApp.featuresAr : featuredApp.featuresEn).map((feat, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2.5 rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-xs"
                    >
                      <CheckCircle2 className="h-4 w-4 text-sky-600 shrink-0 mt-0.5" />
                      <span className="text-xs font-medium text-slate-700 leading-snug">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </section>
      )}

      {/* Latest Releases Catalog Section */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4 text-start">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              {t('section.latestReleases')}
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              {t('section.latestReleasesDesc')}
            </p>
          </div>
          <button
            onClick={() => onNavigate('/apps')}
            className="flex items-center gap-1.5 text-xs font-semibold text-sky-600 hover:text-sky-700"
          >
            <span>{t('catalog.title')}</span>
            {dir === 'rtl' ? <ArrowLeft className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {latestApps.map(appItem => (
            <AppCard
              key={appItem.id}
              app={appItem}
              onSelect={(slug) => onNavigate(`/apps/${slug}`)}
              onDownloadClick={onDownloadClick}
            />
          ))}
        </div>
      </section>

      {/* Categories Grid */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-start mb-8">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            {t('section.categories')}
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {t('section.categoriesDesc')}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {categories.map(cat => {
            const Icon = cat.icon;
            return (
              <div
                key={cat.key}
                onClick={() => onNavigate('/apps')}
                className="group cursor-pointer rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-all hover:border-sky-300 hover:shadow-md text-start"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600 transition-colors group-hover:bg-sky-600 group-hover:text-white">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-sm font-bold text-slate-900 group-hover:text-sky-600 transition-colors">
                  {lang === 'ar' ? cat.nameAr : cat.nameEn}
                </h3>
                <div className="mt-1 flex items-center justify-between text-xs text-slate-400">
                  <span>{cat.count} {lang === 'ar' ? 'تطبيق متاح' : 'available'}</span>
                  {dir === 'rtl' ? <ArrowLeft className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-sky-600" /> : <ArrowRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-sky-600" />}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Why Kayan Store (Pillars) */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-slate-900 p-8 sm:p-12 text-white text-start">
          <div className="max-w-2xl mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              {t('section.whyKayan')}
            </h2>
            <p className="text-sm text-slate-400 mt-2 leading-relaxed">
              {t('section.whyKayanDesc')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
                <Cpu className="h-5 w-5" />
              </div>
              <h4 className="text-base font-bold text-white">
                {t('pillar.offline.title')}
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                {t('pillar.offline.desc')}
              </p>
            </div>

            <div className="space-y-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <Lock className="h-5 w-5" />
              </div>
              <h4 className="text-base font-bold text-white">
                {t('pillar.checksum.title')}
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                {t('pillar.checksum.desc')}
              </p>
            </div>

            <div className="space-y-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Shield className="h-5 w-5" />
              </div>
              <h4 className="text-base font-bold text-white">
                {t('pillar.noTracking.title')}
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                {t('pillar.noTracking.desc')}
              </p>
            </div>

            <div className="space-y-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <HardDrive className="h-5 w-5" />
              </div>
              <h4 className="text-base font-bold text-white">
                {t('pillar.support.title')}
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                {t('pillar.support.desc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Developer Leadership Banner */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs text-start">
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-sky-600">
              {lang === 'ar' ? 'الجهة المطورة' : 'Engineering & Authorship'}
            </span>
            <h3 className="text-lg font-bold text-slate-900">
              {lang === 'ar' ? 'المهندس جهاد الصليحي – كيان سوفت' : 'Eng. Jehad Al-Solihy – Kayan Soft'}
            </h3>
            <p className="text-xs text-slate-500">
              {lang === 'ar' ? 'الضالع – جحاف، الجمهورية اليمنية' : "Al Dhale'e – Juhaf, Republic of Yemen"}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('/about')}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors whitespace-nowrap"
            >
              {t('nav.about')}
            </button>
            <button
              onClick={() => onNavigate('/apps')}
              className="rounded-xl bg-sky-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-sky-500 transition-colors whitespace-nowrap"
            >
              {t('hero.btnBrowse')}
            </button>
          </div>
        </div>
      </section>

    </div>
  );
};
