import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { Application, Release } from '../../types.ts';
import { Download, ShieldCheck, Copy, Check, AlertTriangle, X, Smartphone, Hash, HardDrive, Info } from 'lucide-react';

interface DownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  app: Application;
  release?: Release;
}

export const DownloadModal: React.FC<DownloadModalProps> = ({
  isOpen,
  onClose,
  app,
  release
}) => {
  const { lang, t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  if (!isOpen) return null;

  const currentRel = release || app.currentRelease;
  const appName = lang === 'ar' ? app.nameAr : app.nameEn;
  const sha256 = currentRel?.sha256 || 'Calculated on server-side upload';
  const size = currentRel?.apkSize || '15 MB';
  const version = currentRel ? `v${currentRel.versionName} (${currentRel.versionCode})` : 'v1.0.0';
  const minAndroid = currentRel?.minAndroid || app.minAndroid || '7.0 / API 24';
  const downloadUrl = `/api/download/${currentRel?.id || 'rel_kayan_pdf_v1_0_0'}`;

  const handleCopySha = () => {
    if (sha256) {
      navigator.clipboard.writeText(sha256);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleStartDownload = () => {
    setDownloading(true);
    // Create an invisible anchor tag to trigger the actual APK download
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', `${app.slug}-v${currentRel?.versionName || '1.0.0'}.apk`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      setDownloading(false);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 text-start"
        role="dialog"
        aria-modal="true"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 end-4 flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          aria-label="Close modal"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3.5 mb-5 pb-4 border-b border-slate-100">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-50 p-2 border border-sky-100 shrink-0">
            <img
              src={app.iconUrl || '/src/assets/images/kayan_pdf_icon_1790438337873.jpg'}
              alt={appName}
              referrerPolicy="no-referrer"
              className="h-full w-full object-contain rounded-lg"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/src/assets/images/kayan_pdf_icon_1790438337873.jpg';
              }}
            />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {t('modal.downloadTitle')}
            </h3>
            <p className="text-xs text-slate-500">
              {appName} · {app.packageName}
            </p>
          </div>
        </div>

        {/* Details Grid */}
        <div className="space-y-3 bg-slate-50 rounded-xl p-4 border border-slate-200/70 mb-5 text-xs">
          <div className="flex items-center justify-between py-1 border-b border-slate-200/50">
            <span className="text-slate-500 flex items-center gap-1.5 font-medium">
              <Smartphone className="h-3.5 w-3.5 text-slate-400" />
              {t('modal.appName')}
            </span>
            <span className="font-semibold text-slate-900">{appName}</span>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-slate-200/50">
            <span className="text-slate-500 flex items-center gap-1.5 font-medium">
              <Info className="h-3.5 w-3.5 text-slate-400" />
              {t('modal.version')}
            </span>
            <span className="font-mono font-medium text-slate-800">{version}</span>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-slate-200/50">
            <span className="text-slate-500 flex items-center gap-1.5 font-medium">
              <HardDrive className="h-3.5 w-3.5 text-slate-400" />
              {t('modal.fileSize')}
            </span>
            <span className="font-semibold text-slate-900">{size}</span>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-slate-200/50">
            <span className="text-slate-500 flex items-center gap-1.5 font-medium">
              <Smartphone className="h-3.5 w-3.5 text-slate-400" />
              {t('modal.androidReq')}
            </span>
            <span className="font-medium text-slate-800">{minAndroid}</span>
          </div>

          {/* SHA-256 Section */}
          <div className="pt-1">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                <Hash className="h-3.5 w-3.5 text-sky-600" />
                {t('modal.sha256Label')}
              </span>
              <button
                onClick={handleCopySha}
                className="flex items-center gap-1 text-[11px] font-semibold text-sky-600 hover:text-sky-700 bg-white px-2 py-0.5 rounded border border-slate-200 transition-colors"
                title={t('details.copySha')}
              >
                {copied ? (
                  <>
                    <Check className="h-3 w-3 text-emerald-600" />
                    <span className="text-emerald-700">{t('common.copied')}</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    <span>{t('common.copy')}</span>
                  </>
                )}
              </button>
            </div>
            <div className="font-mono text-[11px] text-slate-600 bg-white p-2 rounded-lg border border-slate-200 break-all leading-tight select-all">
              {sha256}
            </div>
          </div>
        </div>

        {/* Android Security Guidance Notice */}
        <div className="rounded-xl bg-amber-50 p-3.5 border border-amber-200/80 mb-4 flex items-start gap-2.5">
          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 leading-relaxed space-y-1">
            <p className="font-bold">
              {t('modal.warningNotice')}
            </p>
            <p className="text-[11px] text-amber-800">
              {t('modal.independentNotice')}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            {t('modal.cancel')}
          </button>
          
          <button
            onClick={handleStartDownload}
            disabled={downloading}
            className="flex-[2] flex items-center justify-center gap-2 rounded-xl bg-sky-600 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-sky-500 transition-all active:scale-98 disabled:opacity-75"
          >
            {downloading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>{t('modal.downloading')}</span>
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                <span>{t('modal.startDownload')}</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
