import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language } from '../types.ts';

interface LanguageContextType {
  lang: Language;
  dir: 'rtl' | 'ltr';
  setLang: (lang: Language) => void;
  toggleLang: () => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  ar: {
    // Navigation & Brand
    'brand.name': 'متجر كيان',
    'brand.nameEn': 'Kayan Store',
    'brand.subtitle': 'تطبيقات كيان في مكان واحد',
    'nav.home': 'الرئيسية',
    'nav.apps': 'التطبيقات',
    'nav.about': 'عن المتجر',
    'nav.privacy': 'الخصوصية',
    'nav.terms': 'الشروط والأحكام',
    'nav.licenses': 'التراخيص',
    'nav.admin': 'لوحة الإدارة',
    'nav.adminPortal': 'بوابة المسؤول',

    // Hero
    'hero.title': 'متجر تطبيقات كيان',
    'hero.slogan': 'تطبيقات كيان في مكان واحد',
    'hero.description': 'المنصة الرسمية المعتمدة لتحميل وتحديث تطبيقات كيان سوفت برئاسة المهندس جهاد الصليحي. حزم APK مباشرة وموثوقة ومعالجة محلية بدون تتبع.',
    'hero.btnBrowse': 'استعرض التطبيقات',
    'hero.btnLatest': 'أحدث الإصدارات',
    'hero.verifiedApks': 'حزم APK موثقة بـ SHA-256',
    'hero.independent': 'توزيع مباشر مستقل عن متجر Google Play',

    // Sections
    'section.featured': 'التطبيق المميز',
    'section.featuredDesc': 'أحدث وأبرز تطبيقات كيان سوفت المتاحة للتحميل الفوري.',
    'section.latestReleases': 'أحدث الإصدارات المتاحة',
    'section.latestReleasesDesc': 'تحديثات مستمرة لضمان أعلى مستويات الأداء والأمان على هاتفك.',
    'section.categories': 'أقسام التطبيقات',
    'section.categoriesDesc': 'استكشف مجموعة أدوات كيان المصممة خصيصاً للإنتاجية والعمل اليومي.',
    'section.whyKayan': 'لماذا متجر كيان؟',
    'section.whyKayanDesc': 'مبادئ راسخة في الخصوصية، المعالجة دون إنترنت، والشفافية الكاملة.',

    // Categories
    'cat.all': 'جميع التطبيقات',
    'cat.tools': 'أدوات ومستندات',
    'cat.productivity': 'الإنتاجية',
    'cat.utilities': 'الخدمات العامة',
    'cat.media': 'الوسائط والصور',

    // Search & Filter
    'catalog.title': 'دليل التطبيقات',
    'catalog.subtitle': 'استعرض وحمل جميع تطبيقات كيان سوفت بنقرة واحدة وبأعلى معايير الأمان.',
    'catalog.searchPlaceholder': 'ابحث باسم التطبيق، الميزة، الوصف أو القسم...',
    'catalog.noResults': 'لم يتم العثور على أي تطبيقات مطابقة لبحثك.',
    'catalog.clearFilters': 'إعادة ضبط الفلاتر',
    'catalog.showing': 'عرض',
    'catalog.appsCount': 'تطبيق',

    // App Card
    'card.version': 'الإصدار',
    'card.size': 'الحجم',
    'card.minAndroid': 'الحد الأدنى',
    'card.download': 'تحميل APK',
    'card.details': 'التفاصيل',
    'card.directDownload': 'تحميل مباشر',

    // App Details
    'details.developer': 'المطور',
    'details.developerName': 'المهندس جهاد الصليحي (كيان سوفت)',
    'details.packageName': 'اسم الحزمة',
    'details.versionCode': 'كود الإصدار',
    'details.releaseDate': 'تاريخ الإطلاق',
    'details.minAndroid': 'نظام أندرويد المطلوب',
    'details.sha256': 'بصمة التحقق SHA-256',
    'details.shaCopied': 'تم نسخ بصمة SHA-256 بنجاح',
    'details.copySha': 'نسخ البصمة',
    'details.features': 'المميزات الرئيسية',
    'details.screenshots': 'لقطات الشاشة ومعاينة الواجهة',
    'details.versionHistory': 'سجل الإصدارات والتحديثات',
    'details.releaseNotes': 'ملاحظات الإصدار',
    'details.currentRelease': 'الإصدار الحالي',
    'details.olderRelease': 'إصدار سابق',
    'details.noReleases': 'لا توجد إصدارات متاحة حالياً لهذا التطبيق.',
    'details.backToCatalog': 'العودة لدليل التطبيقات',
    'details.securityNotice': 'معالجة محلية 100% بدون إرسال بياناتك لخوادم خارجية.',

    // Download Modal
    'modal.downloadTitle': 'تأكيد تحميل تطبيق',
    'modal.appName': 'اسم التطبيق',
    'modal.version': 'الإصدار',
    'modal.fileSize': 'حجم الملف',
    'modal.androidReq': 'متطلبات النظام',
    'modal.sha256Label': 'بصمة الأمان (SHA-256)',
    'modal.warningNotice': 'تحتاج إلى السماح بتثبيت التطبيقات من هذا المصدر إذا طلب Android ذلك.',
    'modal.independentNotice': 'هذا الملف موزع وموثق مباشرة عبر متجر كيان، وهو مستقل تماماً عن Google Play.',
    'modal.startDownload': 'بدء تحميل الحزمة الآن',
    'modal.cancel': 'إلغاء',
    'modal.downloading': 'جاري التحميل...',

    // Why Kayan Pillars
    'pillar.offline.title': 'معالجة محلية دون اتصال',
    'pillar.offline.desc': 'تطبيقاتنا تعمل على جهازك بالكامل دون الحاجة لإرسال ملفاتك أو مستنداتك لأي خادم سحابي.',
    'pillar.checksum.title': 'نزاهة وأمان الحزم',
    'pillar.checksum.desc': 'كل ملف APK مصحوب ببصمة SHA-256 محسوبة آلياً من المصدر لضمان سلامة الملف وخلوه من أي تعديل.',
    'pillar.noTracking.title': 'خالٍ من الإعلانات والتتبع',
    'pillar.noTracking.desc': 'نرفض تماماً استخدام برمجيات التتبع أو حزم الإعلانات المزعجة للحفاظ على خصوصيتك وأداء بطاريتك.',
    'pillar.support.title': 'تطوير ودعم مباشر',
    'pillar.support.desc': 'تطبيقات مصممة ومبنية بعناية بواسطة المهندس جهاد الصليحي لخدمة احتياجات المستخدمين بكفاءة.',

    // About Page
    'about.title': 'عن متجر كيان',
    'about.subtitle': 'المنصة الرسمية لتوزيع برمجيات كيان سوفت',
    'about.owner': 'الجهة المطورة والمالكة',
    'about.ownerName': 'المهندس جهاد الصليحي',
    'about.locationLabel': 'المقر الرئيسي',
    'about.location': 'الضالع – جحاف، الجمهورية اليمنية',
    'about.email': 'gehadalsolihy99@gmail.com',
    'about.copyright': '© 2026 المهندس جهاد الصليحي. جميع الحقوق محفوظة.',
    'about.missionTitle': 'رؤيتنا ورسالتنا',
    'about.missionDesc': 'نهدف في كيان سوفت إلى تقديم برمجيات عالية الجودة وسريعة وآمنة تلبي متطلبات المستخدم اليومية دون المساس بخصوصيته أو إلزامه بالاتصال الدائم بالإنترنت.',

    // Legal Pages
    'legal.privacyTitle': 'سياسة الخصوصية',
    'legal.termsTitle': 'الشروط والأحكام',
    'legal.licensesTitle': 'التراخيص والإشعارات',
    'legal.lastUpdated': 'آخر تحديث: سبتمبر 2026',

    // Footer
    'footer.description': 'متجر كيان هو الواجهة الرسمية المعتمدة لتحميل وتحديث حزم تطبيقات أندرويد الصادرة عن كيان سوفت.',
    'footer.quickLinks': 'روابط سريعة',
    'footer.legal': 'المعلومات القانونية',
    'footer.contact': 'معلومات المطور',
    'footer.rights': '© 2026 المهندس جهاد الصليحي. جميع الحقوق محفوظة.',
    'footer.location': 'الضالع – جحاف، اليمن',

    // Common
    'common.copy': 'نسخ',
    'common.copied': 'تم النسخ',
    'common.view': 'عرض',
    'common.loading': 'جاري التحميل...',
    'common.error': 'حدث خطأ غير متوقع',
    'common.retry': 'إعادة المحاولة',
    'common.language': 'English'
  },
  en: {
    // Navigation & Brand
    'brand.name': 'Kayan Store',
    'brand.nameEn': 'Kayan Store',
    'brand.subtitle': 'Kayan Applications in One Place',
    'nav.home': 'Home',
    'nav.apps': 'Applications',
    'nav.about': 'About',
    'nav.privacy': 'Privacy',
    'nav.terms': 'Terms',
    'nav.licenses': 'Licenses',
    'nav.admin': 'Admin Dashboard',
    'nav.adminPortal': 'Admin Portal',

    // Hero
    'hero.title': 'Kayan Store',
    'hero.slogan': 'Kayan Applications in One Place',
    'hero.description': 'The official application distribution website for Kayan Soft, engineered by Jehad Al-Solihy. Verified direct APK downloads with 100% offline local processing.',
    'hero.btnBrowse': 'Browse Applications',
    'hero.btnLatest': 'Latest Releases',
    'hero.verifiedApks': 'SHA-256 Verified APKs',
    'hero.independent': 'Direct distribution independent of Google Play',

    // Sections
    'section.featured': 'Featured Application',
    'section.featuredDesc': 'Our flagship offline-first utility ready for instant download.',
    'section.latestReleases': 'Latest Available Releases',
    'section.latestReleasesDesc': 'Continuous updates to ensure peak performance and uncompromising security.',
    'section.categories': 'App Categories',
    'section.categoriesDesc': 'Explore tailored utilities designed for day-to-day productivity.',
    'section.whyKayan': 'Why Kayan Store?',
    'section.whyKayanDesc': 'Unwavering commitment to offline privacy, package integrity, and transparency.',

    // Categories
    'cat.all': 'All Applications',
    'cat.tools': 'Tools & Documents',
    'cat.productivity': 'Productivity',
    'cat.utilities': 'Utilities',
    'cat.media': 'Media & Photos',

    // Search & Filter
    'catalog.title': 'Application Catalog',
    'catalog.subtitle': 'Browse and download genuine Kayan Soft applications with verified checksums.',
    'catalog.searchPlaceholder': 'Search by app name, feature, description, or category...',
    'catalog.noResults': 'No applications match your search query.',
    'catalog.clearFilters': 'Reset Filters',
    'catalog.showing': 'Showing',
    'catalog.appsCount': 'apps',

    // App Card
    'card.version': 'Version',
    'card.size': 'Size',
    'card.minAndroid': 'Min Android',
    'card.download': 'Download APK',
    'card.details': 'Details',
    'card.directDownload': 'Direct APK',

    // App Details
    'details.developer': 'Developer',
    'details.developerName': 'Eng. Jehad Al-Solihy (Kayan Soft)',
    'details.packageName': 'Package Name',
    'details.versionCode': 'Version Code',
    'details.releaseDate': 'Release Date',
    'details.minAndroid': 'Minimum Android',
    'details.sha256': 'SHA-256 Checksum',
    'details.shaCopied': 'SHA-256 hash copied to clipboard',
    'details.copySha': 'Copy Hash',
    'details.features': 'Key Features',
    'details.screenshots': 'Screenshots & UI Preview',
    'details.versionHistory': 'Version History & Changelog',
    'details.releaseNotes': 'Release Notes',
    'details.currentRelease': 'Current Release',
    'details.olderRelease': 'Older Release',
    'details.noReleases': 'No releases currently available for this application.',
    'details.backToCatalog': 'Back to Catalog',
    'details.securityNotice': '100% on-device processing. No files are ever sent to remote cloud servers.',

    // Download Modal
    'modal.downloadTitle': 'Confirm APK Download',
    'modal.appName': 'App Name',
    'modal.version': 'Version',
    'modal.fileSize': 'File Size',
    'modal.androidReq': 'System Requirement',
    'modal.sha256Label': 'Security Checksum (SHA-256)',
    'modal.warningNotice': 'You will need to allow installation of apps from this source if prompted by Android.',
    'modal.independentNotice': 'This APK package is distributed directly by Kayan Store and is independent of Google Play.',
    'modal.startDownload': 'Download APK Package',
    'modal.cancel': 'Cancel',
    'modal.downloading': 'Downloading...',

    // Why Kayan Pillars
    'pillar.offline.title': '100% Offline Local Processing',
    'pillar.offline.desc': 'Our apps process your data exclusively on your device without sending documents to cloud servers.',
    'pillar.checksum.title': 'Cryptographic APK Integrity',
    'pillar.checksum.desc': 'Every APK file is verified with an automated server-computed SHA-256 checksum to guarantee authenticity.',
    'pillar.noTracking.title': 'Zero Tracking & Ad-Free',
    'pillar.noTracking.desc': 'We do not include analytics SDKs, user telemetry, or intrusive advertising frameworks.',
    'pillar.support.title': 'Direct Engineering & Care',
    'pillar.support.desc': 'Crafted with precision by Eng. Jehad Al-Solihy to deliver dependable, battery-efficient tools.',

    // About Page
    'about.title': 'About Kayan Store',
    'about.subtitle': 'Official distribution portal for Kayan Soft software',
    'about.owner': 'Developer & Owner',
    'about.ownerName': 'Eng. Jehad Al-Solihy',
    'about.locationLabel': 'Headquarters',
    'about.location': "Al Dhale'e – Juhaf, Republic of Yemen",
    'about.email': 'gehadalsolihy99@gmail.com',
    'about.copyright': '© 2026 Eng. Jehad Al-Solihy. All rights reserved.',
    'about.missionTitle': 'Our Vision & Purpose',
    'about.missionDesc': 'Kayan Soft is dedicated to crafting lightweight, reliable, and privacy-respecting Android applications that put user independence and data security first.',

    // Legal Pages
    'legal.privacyTitle': 'Privacy Policy',
    'legal.termsTitle': 'Terms & Conditions',
    'legal.licensesTitle': 'Licenses & Notices',
    'legal.lastUpdated': 'Last updated: September 2026',

    // Footer
    'footer.description': 'Kayan Store is the official direct distribution platform for Android application packages created by Kayan Soft.',
    'footer.quickLinks': 'Quick Links',
    'footer.legal': 'Legal Information',
    'footer.contact': 'Developer Contact',
    'footer.rights': '© 2026 Eng. Jehad Al-Solihy. All rights reserved.',
    'footer.location': "Al Dhale'e – Juhaf, Yemen",

    // Common
    'common.copy': 'Copy',
    'common.copied': 'Copied',
    'common.view': 'View',
    'common.loading': 'Loading...',
    'common.error': 'An unexpected error occurred',
    'common.retry': 'Retry',
    'common.language': 'العربية'
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Language>(() => {
    const saved = localStorage.getItem('kayan_lang');
    return saved === 'en' ? 'en' : 'ar';
  });

  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    document.documentElement.setAttribute('lang', lang);
    document.documentElement.setAttribute('dir', dir);
    localStorage.setItem('kayan_lang', lang);
  }, [lang, dir]);

  const setLang = (newLang: Language) => {
    setLangState(newLang);
  };

  const toggleLang = () => {
    setLangState(prev => (prev === 'ar' ? 'en' : 'ar'));
  };

  const t = (key: string): string => {
    return translations[lang]?.[key] || translations['ar']?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, dir, setLang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
