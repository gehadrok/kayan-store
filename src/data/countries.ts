export interface Country {
  code: string;
  nameAr: string;
  nameEn: string;
  emoji: string;
  aliasesAr: string[];
  aliasesEn: string[];
  searchTerms: string[];
}

export const COUNTRIES: Country[] = [
  {
    code: 'YE',
    nameAr: 'اليمن',
    nameEn: 'Yemen',
    emoji: '🇾🇪',
    aliasesAr: ['اليمن', 'الجمهورية اليمنية', 'يمني', 'يمنية'],
    aliasesEn: ['Yemen', 'Republic of Yemen', 'Yemeni'],
    searchTerms: ['Yemen', 'اليمن', 'صنعاء', 'عدن']
  },
  {
    code: 'SA',
    nameAr: 'السعودية',
    nameEn: 'Saudi Arabia',
    emoji: '🇸🇦',
    aliasesAr: ['السعودية', 'المملكة العربية السعودية', 'سعودي', 'سعودية', 'الرياض'],
    aliasesEn: ['Saudi Arabia', 'KSA', 'Saudi'],
    searchTerms: ['Saudi Arabia', 'السعودية', 'الرياض']
  },
  {
    code: 'AE',
    nameAr: 'الإمارات',
    nameEn: 'United Arab Emirates',
    emoji: '🇦🇪',
    aliasesAr: ['الإمارات', 'دولة الإمارات العربية المتحدة', 'إماراتي', 'إماراتية', 'أبوظبي', 'دبي'],
    aliasesEn: ['UAE', 'United Arab Emirates', 'Emirates', 'Dubai', 'Abu Dhabi'],
    searchTerms: ['UAE', 'الإمارات', 'دبي', 'أبوظبي']
  },
  {
    code: 'EG',
    nameAr: 'مصر',
    nameEn: 'Egypt',
    emoji: '🇪🇬',
    aliasesAr: ['مصر', 'جمهورية مصر العربية', 'مصري', 'مصرية', 'القاهرة'],
    aliasesEn: ['Egypt', 'Cairo', 'Egyptian'],
    searchTerms: ['Egypt', 'مصر', 'القاهرة']
  },
  {
    code: 'QA',
    nameAr: 'قطر',
    nameEn: 'Qatar',
    emoji: '🇶🇦',
    aliasesAr: ['قطر', 'دولة قطر', 'قطري', 'قطرية', 'الدوحة'],
    aliasesEn: ['Qatar', 'Doha', 'Qatari'],
    searchTerms: ['Qatar', 'قطر', 'الدوحة']
  },
  {
    code: 'KW',
    nameAr: 'الكويت',
    nameEn: 'Kuwait',
    emoji: '🇰🇼',
    aliasesAr: ['الكويت', 'دولة الكويت', 'كويتي', 'كويتية'],
    aliasesEn: ['Kuwait', 'Kuwaiti'],
    searchTerms: ['Kuwait', 'الكويت']
  },
  {
    code: 'OM',
    nameAr: 'عُمان',
    nameEn: 'Oman',
    emoji: '🇴🇲',
    aliasesAr: ['عمان', 'سلطنة عمان', 'عُمان', 'عماني', 'مسقط'],
    aliasesEn: ['Oman', 'Sultanate of Oman', 'Muscat', 'Omani'],
    searchTerms: ['Oman', 'عمان', 'مسقط']
  },
  {
    code: 'BH',
    nameAr: 'البحرين',
    nameEn: 'Bahrain',
    emoji: '🇧🇭',
    aliasesAr: ['البحرين', 'مملكة البحرين', 'بحريني', 'المنامة'],
    aliasesEn: ['Bahrain', 'Kingdom of Bahrain', 'Manama', 'Bahraini'],
    searchTerms: ['Bahrain', 'البحرين', 'المنامة']
  },
  {
    code: 'JO',
    nameAr: 'الأردن',
    nameEn: 'Jordan',
    emoji: '🇯🇴',
    aliasesAr: ['الأردن', 'المملكة الأردنية الهاشمية', 'أردني', 'عمان الأردن'],
    aliasesEn: ['Jordan', 'Hashemite Kingdom of Jordan', 'Amman', 'Jordanian'],
    searchTerms: ['Jordan', 'الأردن', 'عمان']
  },
  {
    code: 'IQ',
    nameAr: 'العراق',
    nameEn: 'Iraq',
    emoji: '🇮🇶',
    aliasesAr: ['العراق', 'جمهورية العراق', 'عراقي', 'بغداد'],
    aliasesEn: ['Iraq', 'Baghdad', 'Iraqi'],
    searchTerms: ['Iraq', 'العراق', 'بغداد']
  },
  {
    code: 'PS',
    nameAr: 'فلسطين',
    nameEn: 'Palestine',
    emoji: '🇵🇸',
    aliasesAr: ['فلسطين', 'دولة فلسطين', 'فلسطيني', 'القدس', 'غزة'],
    aliasesEn: ['Palestine', 'Gaza', 'Jerusalem', 'Palestinian'],
    searchTerms: ['Palestine', 'فلسطين', 'غزة', 'القدس']
  },
  {
    code: 'LB',
    nameAr: 'لبنان',
    nameEn: 'Lebanon',
    emoji: '🇱🇧',
    aliasesAr: ['لبنان', 'الجمهورية اللبنانية', 'لبناني', 'بيروت'],
    aliasesEn: ['Lebanon', 'Beirut', 'Lebanese'],
    searchTerms: ['Lebanon', 'لبنان', 'بيروت']
  },
  {
    code: 'SY',
    nameAr: 'سوريا',
    nameEn: 'Syria',
    emoji: '🇸🇾',
    aliasesAr: ['سوريا', 'الجمهورية العربية السورية', 'سوري', 'دمشق'],
    aliasesEn: ['Syria', 'Damascus', 'Syrian'],
    searchTerms: ['Syria', 'سوريا', 'دمشق']
  },
  {
    code: 'SD',
    nameAr: 'السودان',
    nameEn: 'Sudan',
    emoji: '🇸🇩',
    aliasesAr: ['السودان', 'جمهورية السودان', 'سوداني', 'الخرطوم'],
    aliasesEn: ['Sudan', 'Khartoum', 'Sudanese'],
    searchTerms: ['Sudan', 'السودان', 'الخرطوم']
  },
  {
    code: 'MA',
    nameAr: 'المغرب',
    nameEn: 'Morocco',
    emoji: '🇲🇦',
    aliasesAr: ['المغرب', 'المملكة المغربية', 'مغربي', 'الرباط', 'الدار البيضاء'],
    aliasesEn: ['Morocco', 'Rabat', 'Casablanca', 'Moroccan'],
    searchTerms: ['Morocco', 'المغرب', 'الرباط']
  },
  {
    code: 'DZ',
    nameAr: 'الجزائر',
    nameEn: 'Algeria',
    emoji: '🇩🇿',
    aliasesAr: ['الجزائر', 'الجمهورية الجزائرية الديمقراطية الشعبية', 'جزائري'],
    aliasesEn: ['Algeria', 'Algiers', 'Algerian'],
    searchTerms: ['Algeria', 'الجزائر']
  },
  {
    code: 'TN',
    nameAr: 'تونس',
    nameEn: 'Tunisia',
    emoji: '🇹🇳',
    aliasesAr: ['تونس', 'الجمهورية التونسية', 'تونسي'],
    aliasesEn: ['Tunisia', 'Tunis', 'Tunisian'],
    searchTerms: ['Tunisia', 'تونس']
  },
  {
    code: 'LY',
    nameAr: 'ليبيا',
    nameEn: 'Libya',
    emoji: '🇱🇾',
    aliasesAr: ['ليبيا', 'دولة ليبيا', 'ليبي', 'طرابلس', 'بنغازي'],
    aliasesEn: ['Libya', 'Tripoli', 'Benghazi', 'Libyan'],
    searchTerms: ['Libya', 'ليبيا', 'طرابلس']
  },
  {
    code: 'GLOBAL',
    nameAr: 'عالمي',
    nameEn: 'Global',
    emoji: '🌐',
    aliasesAr: ['عالمي', 'دولي', 'العالم', 'أخبار دولية'],
    aliasesEn: ['Global', 'World', 'International'],
    searchTerms: ['World', 'Global', 'عالمي', 'دولي']
  }
];

export const getCountryByCode = (code: string): Country | undefined => {
  if (!code) return undefined;
  const upper = code.trim().toUpperCase();
  return COUNTRIES.find(c => c.code.toUpperCase() === upper);
};
