import React from 'react';
import { useLanguage } from '../context/LanguageContext.tsx';
import { Shield, Award, FileCode, CheckCircle2 } from 'lucide-react';

export const LicensesPage: React.FC = () => {
  const { lang, t } = useLanguage();

  const notices = [
    {
      title: 'Kayan PDF Application & Kayan Native Engine',
      license: 'Proprietary Commercial / Freeware License',
      copyright: '© 2026 المهندس جهاد الصليحي (Kayan Soft). جميع الحقوق محفوظة.',
      description: lang === 'ar'
        ? 'حقوق النشر والتوزيع والملكية الفكرية لتطبيق كيان PDF ومحرك التحويل المحلي محفوظة بالكامل للمهندس جهاد الصليحي.'
        : 'Copyright, distribution, and intellectual property rights for Kayan PDF and its local conversion engine are exclusively held by Eng. Jehad Al-Solihy.'
    },
    {
      title: 'Kayan Store Web Platform',
      license: 'Official Distribution Architecture',
      copyright: '© 2026 المهندس جهاد الصليحي. الضالع – جحاف، اليمن.',
      description: lang === 'ar'
        ? 'الواجهة البرمجية، وهيكلية التوزيع والتحقق الأمني من حزم APK المعتمدة في متجر كيان.'
        : 'The web distribution portal, verification engine, and API architecture for Kayan Store.'
    },
    {
      title: 'Open Source Software Components',
      license: 'MIT & Apache 2.0 Notices',
      copyright: 'Various Open-Source Authors',
      description: lang === 'ar'
        ? 'تعتمد بعض الأدوات المساعدة وحزم البناء على مكونات برمجية مفتوحة المصدر مرخصة بموجب تراخيص MIT و Apache 2.0 القياسية.'
        : 'Certain underlying building toolchains and rendering primitives utilize standard open-source software libraries under MIT and Apache 2.0 licenses.'
    }
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12 space-y-10 text-start">
      
      {/* Header */}
      <div className="border-b border-slate-200 pb-6">
        <div className="flex items-center gap-2 text-xs font-semibold text-sky-700 mb-1">
          <Award className="h-4 w-4" />
          <span>{lang === 'ar' ? 'الإشعارات القانونية والتراخيص البرمجية' : 'Legal Notices & Software Licenses'}</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
          {t('legal.licensesTitle')}
        </h1>
        <p className="text-xs text-slate-500 mt-2 font-mono">
          {t('legal.lastUpdated')} · {lang === 'ar' ? 'المهندس جهاد الصليحي — كيان سوفت' : 'Eng. Jehad Al-Solihy — Kayan Soft'}
        </p>
      </div>

      {/* Notices List */}
      <div className="space-y-6">
        {notices.map((item, idx) => (
          <div
            key={idx}
            className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 space-y-3 shadow-sm"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileCode className="h-4 w-4 text-sky-600" />
                <span>{item.title}</span>
              </h3>
              <span className="font-mono text-xs font-medium text-slate-500 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
                {item.license}
              </span>
            </div>

            <p className="text-xs font-semibold text-slate-800">
              {item.copyright}
            </p>

            <p className="text-sm leading-relaxed text-slate-600">
              {item.description}
            </p>
          </div>
        ))}
      </div>

      {/* Integrity Disclaimer */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-xs text-slate-600 leading-relaxed">
        <p className="font-bold text-slate-900 mb-1">
          {lang === 'ar' ? 'تنويه الشفافية والمصداقية' : 'Transparency & Integrity Notice'}
        </p>
        <p>
          {lang === 'ar'
            ? 'لا يدّعي متجر كيان أو تطبيق كيان PDF أي اعتمادات حكومية، أو براءات اختراع وهمية، أو شهادات أمان خارجية غير حقيقية، أو ارتباطاً بشركة جوجل أو متجر Google Play. جميع المعلومات والحزم البرمجية مقدمة بشفافية تامة وموثقة بشهادات الفحص الرقمية SHA-256.'
            : 'Kayan Store and Kayan PDF do not claim false certifications, imaginary government seals, or Google Play affiliations. All package distributions are transparently provided and verified with cryptographic SHA-256 hashes.'}
        </p>
      </div>

    </div>
  );
};
