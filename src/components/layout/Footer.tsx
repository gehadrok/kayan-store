import React from 'react';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { Layers, MapPin, Mail, ShieldCheck, Heart } from 'lucide-react';
import { KAYAN_PLATFORM_LOGO } from '../../utils/assets.ts';

interface FooterProps {
  onNavigate: (path: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const { lang, t } = useLanguage();

  return (
    <footer className="border-t border-slate-200/80 bg-slate-900 text-slate-300">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-12">
          
          {/* Col 1: Brand & Identity (5 cols) */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl overflow-hidden shadow-sm border border-slate-700 bg-white p-0.5">
                <img src={KAYAN_PLATFORM_LOGO} alt="منصة كيان" className="h-full w-full object-cover rounded-lg" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold tracking-tight text-white">
                  {t('brand.name')}
                </span>
                <span className="text-xs text-slate-400">
                  {t('brand.subtitle')}
                </span>
              </div>
            </div>
            
            <p className="text-sm leading-relaxed text-slate-400 max-w-sm">
              {t('footer.description')}
            </p>

            <div className="flex flex-col gap-2 pt-1 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-sky-400 shrink-0" />
                <span>{t('about.location')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-sky-400 shrink-0" />
                <span>{t('about.email')}</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>{t('details.developerName')}</span>
              </div>
            </div>
          </div>

          {/* Col 2: Navigation (3 cols) */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              {t('footer.quickLinks')}
            </h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <button
                  onClick={() => onNavigate('/')}
                  className="hover:text-white transition-colors"
                >
                  {t('nav.home')}
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/apps')}
                  className="hover:text-white transition-colors"
                >
                  {t('nav.apps')}
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/products')}
                  className="hover:text-white transition-colors"
                >
                  {t('nav.products')}
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/news')}
                  className="hover:text-white transition-colors"
                >
                  {t('nav.news')}
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/ai')}
                  className="hover:text-white transition-colors"
                >
                  {t('nav.ai')}
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/about')}
                  className="hover:text-white transition-colors"
                >
                  {t('nav.about')}
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Legal & Standards (4 cols) */}
          <div className="md:col-span-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              {t('footer.legal')}
            </h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <button
                  onClick={() => onNavigate('/privacy')}
                  className="hover:text-white transition-colors"
                >
                  {t('legal.privacyTitle')}
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/terms')}
                  className="hover:text-white transition-colors"
                >
                  {t('legal.termsTitle')}
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/licenses')}
                  className="hover:text-white transition-colors"
                >
                  {t('legal.licensesTitle')}
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/admin')}
                  className="hover:text-white transition-colors text-slate-500 hover:text-slate-300"
                >
                  {t('nav.admin')}
                </button>
              </li>
            </ul>

            <div className="pt-2">
              <p className="text-xs text-slate-500 leading-relaxed">
                {lang === 'ar'
                  ? 'جميع حزم التطبيقات الموزعة عبر متجر كيان تخضع لفحص النزاهة التلقائي ببصمات SHA-256 المشفرة وتعمل دون اتصال بالإنترنت.'
                  : 'All APK packages distributed on Kayan Store undergo automated cryptographic SHA-256 verification and run offline.'}
              </p>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="mt-10 border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>
            {t('footer.rights')}
          </p>
          <div className="flex items-center gap-4 text-slate-500">
            <span>{t('footer.location')}</span>
            <span aria-hidden="true">·</span>
            <span>Kayan Soft</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
