import React from 'react';
import { useLanguage } from '../context/LanguageContext.tsx';
import { Layers, MapPin, Mail, User, ShieldCheck, Cpu, Smartphone, Download, ArrowRight, ArrowLeft } from 'lucide-react';

interface AboutPageProps {
  onNavigate: (path: string) => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onNavigate }) => {
  const { lang, dir, t } = useLanguage();

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12 space-y-12 text-start">

      {/* Header */}
      <div className="border-b border-slate-200 pb-6">
        <div className="flex items-center gap-2 text-xs font-semibold text-sky-700 mb-1">
          <Layers className="h-4 w-4" />
          <span>{lang === 'ar' ? 'عن المنصة والمطور' : 'About Platform & Developer'}</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
          {t('about.title')}
        </h1>
        <p className="text-sm text-slate-500 mt-2 max-w-2xl leading-relaxed">
          {t('about.subtitle')} — {lang === 'ar' ? 'تطبيقات كيان في مكان واحد' : '"Kayan Applications in One Place"'}
        </p>
      </div>

      {/* Profile & Developer Card */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">

          <div className="md:col-span-4 flex flex-col items-center sm:items-start text-center sm:text-start space-y-3">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-sky-600 text-white shadow-md">
              <User className="h-10 w-10" />
            </div>
            <div>
              <span className="text-xs font-semibold text-sky-600">{t('about.owner')}</span>
              <h2 className="text-xl font-bold text-slate-900">{t('about.ownerName')}</h2>
              <p className="text-xs text-slate-500">Kayan Soft Software Engineering</p>
            </div>
          </div>

          <div className="md:col-span-8 border-t md:border-t-0 md:border-s border-slate-200 pt-6 md:pt-0 md:ps-8 space-y-4 text-xs">
            <div className="flex items-start gap-3">
              <MapPin className="h-4 w-4 text-sky-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-900 block">{t('about.locationLabel')}</span>
                <span className="text-slate-600">{t('about.location')}</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Mail className="h-4 w-4 text-sky-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-900 block">{lang === 'ar' ? 'البريد الإلكتروني الرسمي' : 'Official Contact Email'}</span>
                <a href="mailto:gehadalsolihy99@gmail.com" className="text-sky-600 hover:underline font-mono">
                  {t('about.email')}
                </a>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-900 block">{lang === 'ar' ? 'حقوق الملكية والإنتاج' : 'Copyright & Production'}</span>
                <span className="text-slate-600">{t('about.copyright')}</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Vision & Mission Sections */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 space-y-6 text-sm leading-relaxed text-slate-700 shadow-sm">
        <section className="space-y-3">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Cpu className="h-5 w-5 text-sky-600" />
            <span>{t('about.missionTitle')}</span>
          </h3>
          <p>
            {lang === 'ar'
              ? 'كيان منصة رقمية من Kayan Soft تجمع التطبيقات والبرامج والمنتجات الرقمية وأدوات الذكاء الاصطناعي في تجربة واحدة.'
              : 'Kayan is a digital platform by Kayan Soft bringing together applications, software, digital products, and AI tools in one unified experience.'}
          </p>
          <p>
            {lang === 'ar'
              ? 'تطبيق كيان PDF هو باكورة هذه التطبيقات، حيث يمنح المستخدمين القدرة على إنشاء، مسح، دمج، وضغط مستندات PDF بأمان فائق وسرعة متناهية على هواتفهم مباشرة.'
              : 'Kayan PDF is our flagship utility, empowering users to create, scan, merge, and compress PDF documents securely and swiftly directly on their devices.'}
          </p>
        </section>

        <section className="space-y-3 pt-4 border-t border-slate-100">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            <span>{lang === 'ar' ? 'لماذا التوزيع المباشر عبر متجر كيان؟' : 'Why Direct Distribution via Kayan Store?'}</span>
          </h3>
          <p>
            {lang === 'ar'
              ? 'يوفر التوزيع المباشر لحزم APK المرونة للمستخدمين في الحصول على التحديثات فور صدورها، مع الحفاظ على شفافية تامة من خلال إتاحة بصمة التحقق الرقمية (SHA-256) لكل إصدار، مما يتيح للمستخدمين التحقق من سلامة الحزمة ومطابقتها للمصدر الأصلي قبل تثبيتها.'
              : 'Direct APK distribution offers users prompt access to verified updates with transparent cryptographic SHA-256 checksums calculated automatically from the source binaries.'}
          </p>
        </section>
      </div>

      {/* CTA Box */}
      <div className="rounded-3xl bg-slate-900 p-8 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-md">
        <div className="space-y-1 text-center sm:text-start">
          <h4 className="text-lg font-bold text-white">
            {lang === 'ar' ? 'استعرض حزم التطبيقات المتاحة' : 'Explore Available Application Packages'}
          </h4>
          <p className="text-xs text-slate-400">
            {lang === 'ar' ? 'تطبيقات موثوقة بروابط تحميل APK مباشرة' : 'Genuine apps with verified direct APK download links'}
          </p>
        </div>

        <button
          onClick={() => onNavigate('/apps')}
          className="flex items-center gap-2 rounded-xl bg-sky-500 px-6 py-3 text-xs font-bold text-white hover:bg-sky-400 transition-colors whitespace-nowrap"
        >
          <Download className="h-4 w-4" />
          <span>{t('hero.btnBrowse')}</span>
        </button>
      </div>

    </div>
  );
};
