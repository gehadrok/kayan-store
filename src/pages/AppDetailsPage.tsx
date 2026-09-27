import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext.tsx';
import { Application, Release, Screenshot } from '../types.ts';
import { 
  Download, ShieldCheck, Copy, Check, Smartphone, 
  Hash, Calendar, Layers, HardDrive, ArrowLeft, 
  ArrowRight, FileText, CheckCircle2, ChevronRight, 
  Info, ExternalLink, AlertTriangle 
} from 'lucide-react';

interface AppDetailsPageProps {
  slug: string;
  onNavigate: (path: string) => void;
  onDownloadClick: (app: Application, release?: Release) => void;
}

export const AppDetailsPage: React.FC<AppDetailsPageProps> = ({
  slug,
  onNavigate,
  onDownloadClick
}) => {
  const { lang, dir, t } = useLanguage();
  const [app, setApp] = useState<Application | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [shaCopied, setShaCopied] = useState<boolean>(false);
  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(null);

  useEffect(() => {
    async function fetchApp() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/apps/${slug}`);
        const data = await res.json();
        if (data.success && data.app) {
          setApp(data.app);
          const appName = lang === 'ar' ? data.app.nameAr : data.app.nameEn;
          document.title = `${appName} - ${lang === 'ar' ? 'متجر كيان | متجر تطبيقات كيان سوفت' : 'Kayan Store | Kayan Soft'}`;
        } else {
          setError(data.error || 'التطبيق المطلوب غير متوفر حالياً');
        }
      } catch (err: any) {
        setError('تعذر الاتصال بالخادم لتحميل بيانات التطبيق');
      } finally {
        setLoading(false);
      }
    }
    fetchApp();
  }, [slug]);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-3 border-sky-600 border-t-transparent mb-4" />
        <p className="text-sm text-slate-500">{t('common.loading')}</p>
      </div>
    );
  }

  if (error || !app) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <div className="rounded-2xl border border-slate-200 bg-white p-8">
          <Info className="mx-auto h-10 w-10 text-amber-500 mb-3" />
          <h2 className="text-lg font-bold text-slate-900 mb-1">{error || 'التطبيق غير موجود'}</h2>
          <p className="text-xs text-slate-500 mb-6">يرجى التأكد من صحة الرابط أو تصفح دليل التطبيقات.</p>
          <button
            onClick={() => onNavigate('/apps')}
            className="rounded-xl bg-sky-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-sky-500 transition-colors"
          >
            {t('details.backToCatalog')}
          </button>
        </div>
      </div>
    );
  }

  const name = lang === 'ar' ? app.nameAr : app.nameEn;
  const shortDesc = lang === 'ar' ? app.shortDescAr : app.shortDescEn;
  const fullDesc = lang === 'ar' ? app.fullDescAr : app.fullDescEn;
  const features = lang === 'ar' ? app.featuresAr : app.featuresEn;
  const currentRel = app.currentRelease;
  const releases = app.releases || [];
  const screenshots = app.screenshots || [];

  const handleCopySha = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setShaCopied(true);
    setTimeout(() => setShaCopied(false), 2500);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10 space-y-10 text-start">
      
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <button onClick={() => onNavigate('/')} className="hover:text-slate-900 transition-colors">
          {t('nav.home')}
        </button>
        <span aria-hidden="true">/</span>
        <button onClick={() => onNavigate('/apps')} className="hover:text-slate-900 transition-colors">
          {t('nav.apps')}
        </button>
        <span aria-hidden="true">/</span>
        <span className="font-semibold text-slate-900">{name}</span>
      </div>

      {/* Main Header / App Hero Showcase */}
      <div className="relative rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          
          {/* App Identity */}
          <div className="flex items-start gap-5">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-slate-50 p-2.5 border border-slate-100 shadow-xs">
              <img
                src={app.iconUrl || '/src/assets/images/kayan_pdf_icon_1790438337873.jpg'}
                alt={name}
                referrerPolicy="no-referrer"
                className="h-full w-full object-contain rounded-xl"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/src/assets/images/kayan_pdf_icon_1790438337873.jpg';
                }}
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-sky-700 font-medium">
                <span>{app.category}</span>
                <span aria-hidden="true" className="text-slate-300">·</span>
                <span>Android APK</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                {name}
              </h1>
              <p className="text-xs text-slate-500 font-mono">
                {app.packageName}
              </p>
            </div>
          </div>

          {/* Primary Action Button */}
          <div className="w-full md:w-auto flex flex-col sm:flex-row md:flex-col gap-2">
            <button
              onClick={() => onDownloadClick(app, currentRel)}
              className="flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-7 py-3 text-sm font-bold text-white shadow-sm hover:bg-sky-500 transition-all active:scale-98"
            >
              <Download className="h-4 w-4" />
              <span>{t('card.download')}</span>
            </button>
            <span className="text-[11px] text-center text-slate-400 font-mono">
              {currentRel ? `v${currentRel.versionName} · ${currentRel.apkSize}` : 'v1.0.0'}
            </span>
          </div>

        </div>

        {/* Essential Specs Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 text-xs">
          <div className="space-y-0.5">
            <span className="text-slate-400 block">{t('details.developer')}</span>
            <span className="font-semibold text-slate-900">{t('details.developerName')}</span>
          </div>

          <div className="space-y-0.5">
            <span className="text-slate-400 block">{t('details.versionCode')}</span>
            <span className="font-mono font-semibold text-slate-900">
              v{currentRel?.versionName || '1.0.0'} (Code {currentRel?.versionCode || 1})
            </span>
          </div>

          <div className="space-y-0.5">
            <span className="text-slate-400 block">{t('details.minAndroid')}</span>
            <span className="font-semibold text-slate-900">{app.minAndroid}</span>
          </div>

          <div className="space-y-0.5">
            <span className="text-slate-400 block">{t('details.releaseDate')}</span>
            <span className="font-mono font-semibold text-slate-900">{currentRel?.releaseDate || '2026-09-20'}</span>
          </div>
        </div>

      </div>

      {/* SHA-256 Integrity Verification Box */}
      {currentRel?.sha256 && (
        <div className="rounded-2xl border border-sky-200/80 bg-sky-50/40 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-bold text-sky-900">
              <Hash className="h-4 w-4 text-sky-600 shrink-0" />
              <span>{t('details.sha256')}</span>
              <span className="text-[11px] font-normal text-sky-700 font-sans">({lang === 'ar' ? 'محسوبة آلياً من ملف الحزمة' : 'Server-verified cryptographic checksum'})</span>
            </div>

            <button
              onClick={() => handleCopySha(currentRel.sha256)}
              className="flex items-center gap-1.5 self-start sm:self-auto rounded-lg border border-sky-200 bg-white px-3 py-1.5 text-xs font-semibold text-sky-700 hover:bg-sky-50 transition-colors shadow-2xs"
            >
              {shaCopied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="text-emerald-700">{t('details.shaCopied')}</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>{t('details.copySha')}</span>
                </>
              )}
            </button>
          </div>

          <div className="mt-2.5 font-mono text-[11px] text-slate-700 bg-white/80 p-2.5 rounded-lg border border-sky-100 break-all select-all leading-relaxed">
            {currentRel.sha256}
          </div>
        </div>
      )}

      {/* Feature graphic banner if present */}
      {app.bannerUrl && (
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-900 shadow-sm">
          <img
            src={app.bannerUrl}
            alt={`${name} feature graphic`}
            referrerPolicy="no-referrer"
            className="w-full max-h-96 object-cover"
          />
        </div>
      )}

      {/* Grid: Description & Key Features */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left/Start Column: Full Description (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 space-y-4 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900">
              {lang === 'ar' ? 'وصف التطبيق' : 'About Application'}
            </h3>
            <div className="text-sm leading-relaxed text-slate-700 space-y-4 whitespace-pre-line">
              {fullDesc || shortDesc}
            </div>
          </div>

          {/* Privacy & Security Affirmation */}
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 flex items-start gap-3.5">
            <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-950 space-y-1">
              <h4 className="font-bold">{lang === 'ar' ? 'خصوصية وأمان 100%' : '100% Privacy & Security'}</h4>
              <p className="leading-relaxed text-emerald-900">
                {t('details.securityNotice')} {lang === 'ar' ? 'التطبيق لا يحتوي على أي برمجيات تتبع، إعلانات، أو تسجيل بيانات مستخدمين.' : 'The app contains no telemetry trackers, ads, or remote tracking frameworks.'}
              </p>
            </div>
          </div>
        </div>

        {/* Right/End Column: Key Features List (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 space-y-4 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900">
              {t('details.features')}
            </h3>
            <ul className="space-y-3">
              {features?.map((feat, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 leading-relaxed">
                  <CheckCircle2 className="h-4 w-4 text-sky-600 shrink-0 mt-0.5" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal & Notice Links */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 space-y-3 text-xs">
            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
              {t('footer.legal')}
            </h4>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => onNavigate('/privacy')}
                className="flex items-center justify-between text-slate-600 hover:text-sky-600 transition-colors"
              >
                <span>{t('legal.privacyTitle')}</span>
                {dir === 'rtl' ? <ArrowLeft className="h-3 w-3" /> : <ArrowRight className="h-3 w-3" />}
              </button>
              <button
                onClick={() => onNavigate('/terms')}
                className="flex items-center justify-between text-slate-600 hover:text-sky-600 transition-colors"
              >
                <span>{t('legal.termsTitle')}</span>
                {dir === 'rtl' ? <ArrowLeft className="h-3 w-3" /> : <ArrowRight className="h-3 w-3" />}
              </button>
              <button
                onClick={() => onNavigate('/licenses')}
                className="flex items-center justify-between text-slate-600 hover:text-sky-600 transition-colors"
              >
                <span>{t('legal.licensesTitle')}</span>
                {dir === 'rtl' ? <ArrowLeft className="h-3 w-3" /> : <ArrowRight className="h-3 w-3" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-200/60">
              {app.copyright}
            </p>
          </div>
        </div>

      </div>

      {/* Screenshots Preview Gallery */}
      {screenshots.length > 0 && (
        <section className="space-y-4">
          <h3 className="text-xl font-bold tracking-tight text-slate-900">
            {t('details.screenshots')}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {screenshots.map((ss) => (
              <div 
                key={ss.id}
                onClick={() => setSelectedScreenshot(ss.url)}
                className="group cursor-pointer overflow-hidden rounded-2xl border border-slate-200 bg-slate-900 shadow-sm transition-all hover:border-sky-300"
              >
                <img
                  src={ss.url}
                  alt={lang === 'ar' ? ss.captionAr : ss.captionEn}
                  referrerPolicy="no-referrer"
                  className="h-56 w-full object-cover transition-transform group-hover:scale-102"
                />
                <div className="bg-white p-3 text-xs font-medium text-slate-700">
                  {lang === 'ar' ? ss.captionAr : ss.captionEn}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Version History (Changelog) */}
      <section className="space-y-4">
        <h3 className="text-xl font-bold tracking-tight text-slate-900">
          {t('details.versionHistory')}
        </h3>

        {releases.length > 0 ? (
          <div className="space-y-4">
            {releases.map((rel) => (
              <div
                key={rel.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-base font-bold text-slate-900">
                      v{rel.versionName}
                    </span>
                    {rel.isCurrent && (
                      <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {t('details.currentRelease')}
                      </span>
                    )}
                    <span className="text-xs text-slate-400 font-mono">
                      (Code {rel.versionCode})
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-500 font-mono">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{rel.releaseDate}</span>
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{rel.apkSize}</span>
                  </div>
                </div>

                <div className="text-xs leading-relaxed text-slate-600">
                  {lang === 'ar' ? rel.releaseNotesAr : rel.releaseNotesEn}
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                  <div className="font-mono text-[11px] text-slate-400 max-w-md truncate">
                    SHA-256: {rel.sha256}
                  </div>

                  <button
                    onClick={() => onDownloadClick(app, rel)}
                    className="flex items-center gap-1.5 rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-600 hover:text-white px-3 py-1.5 text-xs font-semibold transition-colors border border-sky-100"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>{t('card.download')} (v{rel.versionName})</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center text-xs text-slate-500">
            {t('details.noReleases')}
          </div>
        )}
      </section>

      {/* Android Install Helper Alert */}
      <div className="rounded-2xl bg-amber-50 p-4 border border-amber-200 flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900 leading-relaxed">
          <p className="font-bold mb-0.5">{t('modal.warningNotice')}</p>
          <p className="text-amber-800">{t('modal.independentNotice')}</p>
        </div>
      </div>

    </div>
  );
};
