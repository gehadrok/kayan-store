import React from 'react';
import { useLanguage } from '../context/LanguageContext.tsx';
import { FileText, Shield, CheckCircle2, AlertCircle } from 'lucide-react';

export const TermsPage: React.FC = () => {
  const { lang, t } = useLanguage();

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12 space-y-10 text-start">
      
      {/* Header */}
      <div className="border-b border-slate-200 pb-6">
        <div className="flex items-center gap-2 text-xs font-semibold text-sky-700 mb-1">
          <FileText className="h-4 w-4" />
          <span>{lang === 'ar' ? 'الاتفاقية القانونية والاستخدام' : 'Legal Agreement & Usage Terms'}</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
          {t('legal.termsTitle')}
        </h1>
        <p className="text-xs text-slate-500 mt-2 font-mono">
          {t('legal.lastUpdated')} · {lang === 'ar' ? 'كيان سوفت — المهندس جهاد الصليحي' : 'Kayan Soft — Eng. Jehad Al-Solihy'}
        </p>
      </div>

      {/* Main Terms Body */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 space-y-6 text-sm leading-relaxed text-slate-700 shadow-sm">
        
        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">
            {lang === 'ar' ? '1. القبول والاتفاق' : '1. Acceptance of Terms'}
          </h2>
          <p>
            {lang === 'ar'
              ? 'باستخدامك لمتجر كيان (Kayan Store) أو بتحميلك لأي من التطبيقات البرمجية الصادرة عن كيان سوفت، فإنك توافق على الالتزام بهذه الشروط والأحكام. إذا كنت لا توافق على أي بند منها، يرجى التوقف عن استخدام الموقع والتطبيقات.'
              : 'By accessing Kayan Store or downloading any application software published by Kayan Soft, you agree to be bound by these Terms and Conditions.'}
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">
            {lang === 'ar' ? '2. التوزيع المباشر واستقلالية المنصة' : '2. Direct Distribution & Platform Independence'}
          </h2>
          <p>
            {lang === 'ar'
              ? 'توزع تطبيقات كيان سوفت بصيغة حزم أندرويد (APK) بشكل مباشر عبر هذا الموقع الرسمي لتمكين المستخدمين من الوصول السهل والمستقل دون وسيط. هذا الموقع والتطبيقات الصادرة عنه مستقلة تماماً ولا ترتبط بمتجر Google Play أو شركة جوجل، وتتحمل كيان سوفت مسؤولية إدارة وتحديث هذه الحزم البرمجية مباشرة.'
              : 'Kayan Soft applications are distributed in Android APK package format directly through this official portal. This platform is independent of Google Play and Google LLC. Kayan Soft maintains direct responsibility for release updates and verified APK packages.'}
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">
            {lang === 'ar' ? '3. حقوق الملكية الفكرية' : '3. Intellectual Property Rights'}
          </h2>
          <p>
            {lang === 'ar'
              ? 'جميع التطبيقات، العلامات التجارية، التصاميم، النصوص البرمجية، والواجهات المتوفرة على متجر كيان هي ملك حصري للمهندس جهاد الصليحي وكيان سوفت، ومحمية بموجب قوانين الملكية الفكرية المعمول بها. يمنع تعديل، تفكيك (Reverse Engineering)، إعادة تجميع أو إعادة بيع التطبيقات دون إذن خطي مسبق.'
              : 'All software applications, brand marks, designs, codebases, and assets on Kayan Store are the intellectual property of Eng. Jehad Al-Solihy and Kayan Soft. Decompilation, unauthorized redistribution, or resale without written authorization is prohibited.'}
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">
            {lang === 'ar' ? '4. ترخيص الاستخدام' : '4. License Grant'}
          </h2>
          <p>
            {lang === 'ar'
              ? 'تمنحك كيان سوفت ترخيصاً شخصياً، غير حصري، وغير قابل للتحويل لتثبيت واستخدام التطبيقات المتاحة (مثل تطبيق كيان PDF) على أجهزتك المتوافقة للأغراض الشخصية أو المهنية المعتادة وفق ضوابط الاستخدام المشروع.'
              : 'Kayan Soft grants you a personal, non-exclusive, non-transferable license to install and use the provided software (such as Kayan PDF) on your compatible devices for legitimate personal and professional document processing.'}
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">
            {lang === 'ar' ? '5. حدود المسؤولية' : '5. Limitation of Liability'}
          </h2>
          <p>
            {lang === 'ar'
              ? 'يتم توفير البرمجيات "كما هي" دون ضمانات صريحة أو ضمنية غير منصوص عليها. نظراً لأن المعالجة تتم محلياً على جهاز المستخدم، فإن المستخدم هو المسؤول عن حفظ النسخ الاحتياطية لمستنداته الأصلية.'
              : 'The software is provided on an "as is" basis. Since processing occurs locally on user hardware, users are advised to maintain backups of their important original files.'}
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">
            {lang === 'ar' ? '6. القانون الساري والمقر' : '6. Jurisdiction & Headquarters'}
          </h2>
          <p>
            {lang === 'ar'
              ? 'تخضع هذه الشروط وتفسر وفقاً للأنظمة والقوانين المعمول بها في الجمهورية اليمنية. المقر: الضالع – جحاف، اليمن. البريد الإلكتروني: gehadalsolihy99@gmail.com.'
              : 'These terms are governed by applicable laws. Location: Al Dhale\'e – Juhaf, Republic of Yemen. Contact: gehadalsolihy99@gmail.com.'}
          </p>
        </section>

      </div>

    </div>
  );
};
