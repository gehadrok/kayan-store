import { COUNTRIES } from '../data/countries.ts';

export function normalizeCategory(cat?: string | null): string {
  if (!cat) return 'general';
  const c = cat.trim().toLowerCase();
  if (['all', 'الكل', 'جميع', 'all_categories'].includes(c)) return 'all';
  if (['general', 'عام', 'أخبار_عامة', 'main'].includes(c)) return 'general';
  if (['business', 'economy', 'اقتصاد', 'اقتصادي', 'مال_وأعمال', 'مالية', 'أسواق', 'تجارة'].includes(c)) return 'business';
  if (['politics', 'political', 'سياسة', 'سياسي', 'شؤون_دولية'].includes(c)) return 'politics';
  if (['technology', 'tech', 'تقنية', 'تكنولوجيا', 'علوم_وتكنولوجيا'].includes(c)) return 'technology';
  if (['sports', 'sport', 'رياضة', 'رياضي'].includes(c)) return 'sports';
  if (['health', 'صحة', 'طبي', 'صحي'].includes(c)) return 'health';
  if (['science', 'علوم', 'علمي'].includes(c)) return 'science';
  return c;
}

export function normalizeCountryCode(code?: string | null): string {
  if (!code) return 'ALL';
  const c = code.trim().toUpperCase();
  if (c === 'ALL' || c === 'GLOBAL' || c === 'الكل' || c === 'عالمي') {
    return c === 'عالمي' ? 'GLOBAL' : (c === 'الكل' ? 'ALL' : c);
  }
  const found = COUNTRIES.find(cntry => 
    cntry.code.toUpperCase() === c ||
    cntry.nameAr === code.trim() ||
    cntry.nameEn.toUpperCase() === c ||
    cntry.aliasesAr.includes(code.trim()) ||
    cntry.aliasesEn.some(a => a.toUpperCase() === c)
  );
  if (found) return found.code.toUpperCase();
  return c;
}

export function getCategoryNameAr(catId: string): string {
  const norm = normalizeCategory(catId);
  switch (norm) {
    case 'all': return 'الكل';
    case 'general': return 'عام';
    case 'business': return 'اقتصاد';
    case 'politics': return 'سياسة';
    case 'technology': return 'تكنولوجيا';
    case 'sports': return 'رياضة';
    case 'health': return 'صحة';
    case 'science': return 'علوم';
    default: return catId;
  }
}

export function getCountryNameAr(code: string): string {
  const norm = normalizeCountryCode(code);
  if (norm === 'ALL') return 'جميع النطاقات';
  if (norm === 'GLOBAL') return 'عالمي';
  const found = COUNTRIES.find(c => c.code.toUpperCase() === norm);
  return found ? found.nameAr : norm;
}
