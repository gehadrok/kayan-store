import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { 
  ChevronRight, 
  Calendar, 
  Globe, 
  MapPin, 
  Tag, 
  ExternalLink, 
  Sparkles, 
  ArrowRight,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

interface NewsDetailPageProps {
  articleId: string;
  onNavigate: (path: string) => void;
}

export const NewsDetailPage: React.FC<NewsDetailPageProps> = ({ articleId, onNavigate }) => {
  const { lang, t } = useLanguage();
  const [article, setArticle] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchArticle();
  }, [articleId]);

  const fetchArticle = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/news/${articleId}`);
      const data = await res.json();
      if (data.success && data.article) {
        setArticle(data.article);
      } else {
        setError(data.error || 'الخبر غير موجود');
      }
    } catch (err) {
      setError('فشل في تحميل تفاصيل الخبر');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-slate-400 gap-4">
        <RefreshCw className="w-10 h-10 animate-spin text-sky-500" />
        <p className="font-bold">{lang === 'ar' ? 'جاري تحميل تفاصيل الخبر...' : 'Loading article details...'}</p>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-slate-400 gap-4 p-8 text-center">
        <AlertCircle className="w-16 h-16 text-rose-500 opacity-50" />
        <h2 className="text-xl font-bold text-white">{error || t('common.error')}</h2>
        <button 
          onClick={() => window.history.back()}
          className="mt-4 px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-bold transition-all flex items-center gap-2"
        >
          <ArrowRight className={`w-4 h-4 ${lang === 'en' ? 'rotate-180' : ''}`} /> {t('news.backToNews')}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-slate-100" dir="rtl">
      {/* Breadcrumbs / Back button */}
      <div className="mb-6 flex items-center gap-3">
        <button 
          onClick={() => window.history.back()}
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all flex items-center gap-2 text-xs font-bold"
        >
          <ArrowRight className="w-4 h-4" /> العودة
        </button>
        <div className="h-4 w-px bg-slate-800" />
        <span className="text-xs text-slate-500 truncate max-w-[200px]">{article.title}</span>
      </div>

      <article className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        {/* Main Image */}
        {article.imageUrl && (
          <div className="w-full h-[300px] sm:h-[450px] relative">
            <img 
              src={article.imageUrl} 
              alt={article.title} 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
            <div className="absolute bottom-6 right-6 left-6">
              <span className="bg-sky-600 text-white px-4 py-1.5 rounded-full text-xs font-black shadow-lg">
                {article.sourceName}
              </span>
            </div>
          </div>
        )}

        <div className="p-6 sm:p-10 space-y-6">
          {/* Metadata */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 border-b border-slate-800 pb-6">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-sky-400" />
              <span>{new Date(article.publishedAt).toLocaleString(lang)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-sky-400" />
              <span>{lang === 'ar' ? 'الدولة:' : 'Country:'} {article.country?.toUpperCase() === 'YE' ? (lang === 'ar' ? 'اليمن' : 'Yemen') : article.country || (lang === 'ar' ? 'عالمي' : 'Global')}</span>
            </div>
            {article.regionName && (
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-sky-400" />
                <span>{article.regionName}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <Tag className="w-4 h-4 text-sky-400" />
              <span>{article.category || (lang === 'ar' ? 'عام' : 'General')}</span>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">
            {article.title}
          </h1>

          {/* Kayan AI Summary Box */}
          <div className="bg-sky-500/5 border border-sky-500/20 rounded-3xl p-6 sm:p-8 space-y-4">
            <div className="flex items-center gap-2 text-sky-400 text-sm font-black">
              <Sparkles className="w-5 h-5" /> {t('news.aiAnalysis')}
            </div>
            <p className="text-sm sm:text-base text-slate-200 leading-relaxed font-medium">
              {article.aiSummary || article.description}
            </p>

            {article.aiKeyPoints && Array.isArray(article.aiKeyPoints) && article.aiKeyPoints.length > 0 && (
              <div className="pt-4 border-t border-sky-500/10">
                <h3 className="text-xs font-black text-sky-300 uppercase tracking-widest mb-3">{t('news.keyPoints')}:</h3>
                <ul className="space-y-3">
                  {article.aiKeyPoints.map((point: string, idx: number) => (
                    <li key={idx} className="flex gap-3 text-sm text-slate-300 leading-relaxed">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0 mt-2" />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Original Content */}
          <div className="text-sm sm:text-base text-slate-300 leading-loose space-y-4 prose prose-invert max-w-none">
            {article.content ? (
               <div dangerouslySetInnerHTML={{ __html: article.content.replace(/\n/g, '<br />') }} />
            ) : (
              <p>{article.description}</p>
            )}
          </div>

          {/* Footer Actions */}
          <div className="pt-10 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="text-xs text-slate-500 italic">
              {lang === 'ar' ? 'المصدر الأصلي للخبر:' : 'Original Source:'} <span className="font-bold text-slate-400">{article.sourceName}</span>
            </div>
            
            <div className="flex items-center gap-3 w-full sm:w-auto">
              {article.url && (
                <a 
                  href={article.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-500 text-white px-6 py-3 rounded-2xl text-sm font-black transition-all shadow-xl shadow-sky-600/20"
                >
                  <ExternalLink className="w-4 h-4" /> {t('news.viewOriginal')} ↗
                </a>
              )}
              <button 
                onClick={() => window.history.back()}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-6 py-3 rounded-2xl text-sm font-black transition-all"
              >
                {lang === 'ar' ? 'العودة للقائمة' : 'Back to list'}
              </button>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
};
