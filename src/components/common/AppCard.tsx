import React from 'react';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { Application } from '../../types.ts';
import { Download, ArrowRight, ArrowLeft, ShieldCheck, Smartphone } from 'lucide-react';

interface AppCardProps {
  app: Application;
  onSelect: (slug: string) => void;
  onDownloadClick: (app: Application) => void;
}

export const AppCard: React.FC<AppCardProps> = ({ app, onSelect, onDownloadClick }) => {
  const { lang, dir, t } = useLanguage();

  const name = lang === 'ar' ? app.nameAr : app.nameEn;
  const shortDesc = lang === 'ar' ? app.shortDescAr : app.shortDescEn;
  const currentRelease = app.currentRelease;
  const version = currentRelease ? `v${currentRelease.versionName}` : 'v1.0.0';
  const size = currentRelease?.apkSize || '15 MB';

  return (
    <div className="group relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-sky-300 hover:shadow-md text-start">
      
      {/* Top row: Icon + Names & Category */}
      <div>
        <div className="flex items-start gap-4">
          <div 
            onClick={() => onSelect(app.slug)}
            className="flex h-16 w-16 shrink-0 cursor-pointer items-center justify-center rounded-2xl bg-slate-50 p-2.5 border border-slate-100 transition-transform group-hover:scale-105"
          >
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

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-xs text-sky-700 font-medium mb-1">
              <span>{app.category}</span>
              <span aria-hidden="true" className="text-slate-300">·</span>
              <span className="flex items-center gap-1 text-slate-500">
                <Smartphone className="h-3 w-3" />
                <span>Android</span>
              </span>
            </div>

            <h3 
              onClick={() => onSelect(app.slug)}
              className="cursor-pointer text-base font-bold text-slate-900 group-hover:text-sky-600 transition-colors truncate"
            >
              {name}
            </h3>

            {/* Zero-pill metadata */}
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-1 font-mono">
              <span>{version}</span>
              <span aria-hidden="true" className="text-slate-300">·</span>
              <span>{size}</span>
            </div>
          </div>
        </div>

        {/* Short Description */}
        <p className="mt-3.5 text-xs leading-relaxed text-slate-600 line-clamp-2">
          {shortDesc}
        </p>

        {/* Offline Badge & Security marker */}
        <div className="mt-3 flex items-center gap-1.5 text-[11px] text-emerald-700 font-medium">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>{lang === 'ar' ? 'معالجة محلية بدون إنترنت' : '100% Offline Local Processing'}</span>
        </div>
      </div>

      {/* Card Actions */}
      <div className="mt-5 flex items-center gap-2.5 pt-4 border-t border-slate-100">
        <button
          onClick={() => onDownloadClick(app)}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-sky-600 py-2 text-xs font-bold text-white shadow-sm hover:bg-sky-500 transition-all active:scale-98 whitespace-nowrap"
        >
          <Download className="h-3.5 w-3.5" />
          <span>{t('card.download')}</span>
        </button>

        <button
          onClick={() => onSelect(app.slug)}
          className="flex items-center justify-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors whitespace-nowrap"
          title={t('card.details')}
        >
          <span>{t('card.details')}</span>
          {dir === 'rtl' ? (
            <ArrowLeft className="h-3.5 w-3.5 text-slate-400" />
          ) : (
            <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
          )}
        </button>
      </div>

    </div>
  );
};
