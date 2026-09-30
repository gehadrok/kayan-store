import React, { useState } from 'react';
import { Image as ImageIcon, Code2, Download, ExternalLink, ShieldCheck, Copy, Check, FileText } from 'lucide-react';
import type { AIAsset } from '../../types.ts';

interface AIAssetGalleryProps {
  assets: AIAsset[];
  isLoading?: boolean;
}

export const AIAssetGallery: React.FC<AIAssetGalleryProps> = ({ assets, isLoading }) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'ALL' | 'IMAGE' | 'CODE'>('ALL');

  if (isLoading) {
    return (
      <div className="p-12 text-center text-slate-400 space-y-3 bg-slate-900/50 rounded-3xl border border-slate-800">
        <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs">جاري تحميل وسائط وأصول المشروع...</p>
      </div>
    );
  }

  const filtered = assets.filter(a => {
    if (filter === 'ALL') return true;
    if (filter === 'IMAGE') return a.assetType === 'image';
    if (filter === 'CODE') return a.assetType === 'code';
    return true;
  });

  const handleCopyLink = (url: string, id: string) => {
    navigator.clipboard.writeText(window.location.origin + url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (assets.length === 0) {
    return (
      <div className="p-12 text-center text-slate-400 space-y-3 bg-slate-900/50 rounded-3xl border border-slate-800">
        <ImageIcon className="w-12 h-12 text-slate-600 mx-auto" />
        <h4 className="text-sm font-bold text-white">لا توجد وسائط أو أصول متولدة لهذا المشروع حتى الآن</h4>
        <p className="text-xs text-slate-400">عند توليد الصور أو الكود، ستظهر جميع الملفات والأصول هنا تلقائياً مع معرّف SHA-256 للتأكد من سلامتها.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-sky-400" />
          <h3 className="text-sm font-bold text-white">معرض الوسائط والأصول ({assets.length})</h3>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${filter === 'ALL' ? 'bg-sky-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
          >
            الكل ({assets.length})
          </button>
          <button
            onClick={() => setFilter('IMAGE')}
            className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${filter === 'IMAGE' ? 'bg-sky-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
          >
            الصور ({assets.filter(a => a.assetType === 'image').length})
          </button>
          <button
            onClick={() => setFilter('CODE')}
            className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${filter === 'CODE' ? 'bg-sky-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
          >
            الكود ({assets.filter(a => a.assetType === 'code').length})
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((asset) => {
          const isCopied = copiedId === asset.id;
          const formattedSize = asset.sizeBytes ? `${(asset.sizeBytes / 1024).toFixed(1)} KB` : 'N/A';

          return (
            <div key={asset.id} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-700 transition-all flex flex-col justify-between group">
              {asset.assetType === 'image' ? (
                <div className="relative aspect-square bg-slate-950 flex items-center justify-center overflow-hidden border-b border-slate-800">
                  <img
                    src={asset.url}
                    alt="AI Asset"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute top-2 right-2 px-2 py-1 rounded-lg bg-slate-950/80 backdrop-blur-md text-[10px] font-mono text-slate-300 border border-slate-800">
                    IMAGE
                  </div>
                </div>
              ) : (
                <div className="p-6 bg-slate-950 flex flex-col items-center justify-center space-y-2 border-b border-slate-800 min-h-[160px]">
                  <Code2 className="w-10 h-10 text-sky-400" />
                  <span className="text-xs font-mono font-bold text-slate-300">ملفات كود متولدة</span>
                </div>
              )}

              <div className="p-4 space-y-3">
                <div className="space-y-1 text-xs">
                  <div className="flex items-center justify-between text-slate-400 text-[10px]">
                    <span>تاريخ الإنشاء:</span>
                    <span>{new Date(asset.createdAt).toLocaleDateString('ar-EG')}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400 text-[10px]">
                    <span>الحجم:</span>
                    <span>{formattedSize}</span>
                  </div>
                  {asset.sha256 && (
                    <div className="flex items-center gap-1 text-[10px] font-mono text-slate-400 bg-slate-950 p-1.5 rounded-lg border border-slate-800 truncate" title={`SHA-256: ${asset.sha256}`}>
                      <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span className="truncate">{asset.sha256}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800">
                  <a
                    href={asset.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold flex items-center gap-1 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>معاينة</span>
                  </a>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleCopyLink(asset.url, asset.id)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                      title="نسخ رابط الرابط"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <a
                      href={asset.url}
                      download={`kayan_ai_asset_${asset.id}.png`}
                      className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-[11px] font-bold flex items-center gap-1 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>تنزيل</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
