import React from 'react';
import { useLanguage } from '../context/LanguageContext.tsx';
import { ShieldCheck, Lock, EyeOff, Server, HardDrive, FileText } from 'lucide-react';

export const PrivacyPage: React.FC = () => {
  const { lang, t } = useLanguage();

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12 space-y-10 text-start">
      
      {/* Header */}
      <div className="border-b border-slate-200 pb-6">
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 mb-1">
          <ShieldCheck className="h-4 w-4" />
          <span>{lang === 'ar' ? 'الأمان والخصوصية المطلقة' : 'Absolute Security & Privacy'}</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
          {t('legal.privacyTitle')}
        </h1>
        <p className="text-xs text-slate-500 mt-2 font-mono">
          {t('legal.lastUpdated')} · {lang === 'ar' ? 'متجر وتطبيقات كيان سوفت' : 'Kayan Soft Applications & Store'}
        </p>
      </div>

      {/* Highlights Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 mb-3">
            <Lock className="h-4 w-4" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 mb-1">
            {lang === 'ar' ? 'معالجة محلية 100%' : '100% On-Device Processing'}
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            {lang === 'ar' ? 'كافة المستندات والصور يتم تحويلها ومعالجتها داخل جهازك دون رفعها إلى أي خادم.' : 'All documents and images are processed strictly on your hardware without cloud uploads.'}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-50 text-sky-600 mb-3">
            <EyeOff className="h-4 w-4" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 mb-1">
            {lang === 'ar' ? 'بدون تتبع أو إعلانات' : 'Zero Tracking & Ad-Free'}
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            {lang === 'ar' ? 'لا نقوم بتضمين حزم تحليلات، أو مكتبات إعلانية، أو معرّفات تتبع النشاط.' : 'No analytics frameworks, advertising SDKs, or user behavior tracking libraries are included.'}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 mb-3">
            <HardDrive className="h-4 w-4" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 mb-1">
            {lang === 'ar' ? 'تحكم كامل ببياناتك' : 'Full Data Sovereignty'}
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            {lang === 'ar' ? 'الملفات المخزنة تبقى في ذاكرة جهازك ويمكنك حذفها أو نقلها في أي وقت.' : 'All generated files reside in your local device storage under your exclusive control.'}
          </p>
        </div>
      </div>

      {/* Main Privacy Body */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 space-y-6 text-sm leading-relaxed text-slate-700 shadow-sm">
        
        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">
            {lang === 'ar' ? '1. التزامنا تجاه الخصوصية' : '1. Our Privacy Commitment'}
          </h2>
          <p>
            {lang === 'ar'
              ? 'يؤمن المهندس جهاد الصليحي وفريق كيان سوفت بأن الخصوصية حق أصيل لكل مستخدم. تم تصميم متجر كيان وجميع التطبيقات الصادرة عنه (مثل تطبيق كيان PDF) لتعمل بمبدأ المعالجة غير المتصلة (Offline-First) بحيث لا تشترط إنشاء حساب، ولا تطلب بريدك الإلكتروني، ولا تجمع أي بيانات شخصية أو سجلات استخدام.'
              : 'Eng. Jehad Al-Solihy and Kayan Soft believe privacy is a fundamental right. Kayan Store and all distributed applications (such as Kayan PDF) are built offline-first. They require no user accounts, email addresses, or telemetry logs.'}
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">
            {lang === 'ar' ? '2. البيانات والمستندات والمنتجات الرقمية' : '2. Data, Documents & Digital Products'}
          </h2>
          <p>
            {lang === 'ar'
              ? 'بالنسبة لتطبيقات الإنتاجية (مثل كيان PDF)، تجري كافة العمليات محلياً على جهازك. أما بالنسبة لخدمات Kayan AI و Kayan News، فقد يتم إرسال استعلامات نصية أو روابط أخبار إلى نماذج ذكاء اصطناعي (مثل Google Gemini) بغرض التحليل والتلخيص فقط. المنتجات الرقمية المشتراة من المتجر يتم تخزين سجلات امتلاكها بشكل آمن ومحمي.'
              : 'For productivity tools like Kayan PDF, all processing is local. For Kayan AI and Kayan News, text queries or news links may be processed via AI models (such as Google Gemini) for analysis and summarization. Digital product ownership records are stored securely.'}
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">
            {lang === 'ar' ? '3. الأذونات المطلوبة في التطبيقات' : '3. Application Permissions'}
          </h2>
          <p>
            {lang === 'ar'
              ? 'تطلب تطبيقاتنا فقط الأذونات الضرورية لتنفيذ الوظيفة المباشرة التي يطلبها المستخدم (مثل إذن الوصول إلى وحدة التخزين لحفظ ملفات PDF الناتجة، أو إذن الكاميرا لمسح المستندات). لا يتم استخدام هذه الأذونات في الخلفية أو لأي غرض خفي.'
              : 'Our applications only request runtime permissions that are strictly necessary to deliver the requested user feature (e.g., storage access to write PDF files, or camera access for scanning). Permissions are never used in the background.'}
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">
            {lang === 'ar' ? '4. ملفات تعريف الارتباط على موقع المتجر' : '4. Web Store Cookies'}
          </h2>
          <p>
            {lang === 'ar'
              ? 'لا يستخدم موقع متجر كيان أي ملفات تتبع أو كوكيز إعلانية للمستخدمين العامين. تقتصر ملفات تعريف الارتباط على جلسة المصادقة المشفرة (HttpOnly) الخاصة بلوحة تحكم المسؤول فقط.'
              : 'Kayan Store website uses zero public tracking cookies. Cookies are strictly confined to secure HttpOnly session tokens for the authenticated admin portal.'}
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">
            {lang === 'ar' ? '5. معلومات الاتصال بالمسؤول' : '5. Contact & Inquiries'}
          </h2>
          <p>
            {lang === 'ar'
              ? 'لأي استفسار بخصوص سياسة الخصوصية أو أمان تطبيقات كيان، يمكنكم التواصل مباشرة مع المهندس جهاد الصليحي عبر البريد الإلكتروني: gehadalsolihy99@gmail.com — الضالع – جحاف، الجمهورية اليمنية.'
              : 'For inquiries regarding this privacy policy or application security, contact Eng. Jehad Al-Solihy directly at: gehadalsolihy99@gmail.com — Al Dhale\'e – Juhaf, Republic of Yemen.'}
          </p>
        </section>

      </div>

    </div>
  );
};
