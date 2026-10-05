import React from 'react';
import { useLanguage } from '../context/LanguageContext.tsx';
import { AlertCircle, Home, ArrowRight } from 'lucide-react';

export const NotFoundPage: React.FC<{ onNavigate: (path: string) => void }> = ({ onNavigate }) => {
  const { lang, dir } = useLanguage();

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-8 text-center" dir={dir}>
      <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6">
        <AlertCircle className="w-12 h-12 text-slate-400" />
      </div>
      
      <h1 className="text-4xl font-black text-slate-900 mb-4">
        {lang === 'ar' ? '404 - الصفحة غير موجودة' : '404 - Page Not Found'}
      </h1>
      
      <p className="text-slate-500 max-w-md mb-8 leading-relaxed">
        {lang === 'ar' 
          ? 'عذراً، الصفحة التي تحاول الوصول إليها قد تم نقلها أو أنها لم تعد موجودة في منصة كيان.'
          : 'Sorry, the page you are looking for has been moved or no longer exists in Kayan Platform.'}
      </p>
      
      <div className="flex flex-wrap items-center justify-center gap-4">
        <button
          onClick={() => onNavigate('/')}
          className="flex items-center gap-2 px-6 py-3 bg-sky-600 hover:bg-sky-500 text-white rounded-2xl font-bold transition-all shadow-lg shadow-sky-600/20"
        >
          <Home className="w-4 h-4" />
          <span>{lang === 'ar' ? 'العودة للرئيسية' : 'Back to Home'}</span>
        </button>
        
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-bold transition-all"
        >
          <ArrowRight className={`w-4 h-4 ${lang === 'en' ? 'rotate-180' : ''}`} />
          <span>{lang === 'ar' ? 'العودة للخلف' : 'Go Back'}</span>
        </button>
      </div>
    </div>
  );
};
