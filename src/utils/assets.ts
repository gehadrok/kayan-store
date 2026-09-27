/**
 * Kayan Store Production Asset Utilities
 * Ensures all application icons, banners, and screenshots resolve to stable,
 * production-safe Vite public URLs (/assets/images/...).
 */

export const KAYAN_PDF_ICON = '/assets/images/kayan_pdf_icon.jpg';
export const KAYAN_PDF_BANNER = '/assets/images/kayan_pdf_feature_banner.jpg';
export const KAYAN_STORE_LOGO = '/assets/images/kayan_store_logo.jpg';
export const KAYAN_STORE_HERO = '/assets/images/kayan_store_hero_tech.jpg';

/**
 * Normalizes any asset URL (including legacy database records or Vite dev URLs)
 * into a production-safe public URL.
 */
export function getSafeAssetUrl(url: string | null | undefined, fallback: string = KAYAN_PDF_ICON): string {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return fallback;
  }

  const trimmed = url.trim();

  // Handle Kayan PDF icon
  if (trimmed.includes('kayan_pdf_icon')) {
    return KAYAN_PDF_ICON;
  }

  // Handle Kayan PDF feature banner
  if (trimmed.includes('kayan_pdf_feature_banner')) {
    return KAYAN_PDF_BANNER;
  }

  // Handle Kayan Store logo
  if (trimmed.includes('kayan_store_logo')) {
    return KAYAN_STORE_LOGO;
  }

  // Handle Kayan Store hero tech
  if (trimmed.includes('kayan_store_hero_tech')) {
    return KAYAN_STORE_HERO;
  }

  // Strip legacy /src/assets/images/ prefix
  if (trimmed.startsWith('/src/assets/images/')) {
    return trimmed.replace('/src/assets/images/', '/assets/images/');
  }

  // Strip legacy /src/assets/ prefix
  if (trimmed.startsWith('/src/assets/')) {
    return trimmed.replace('/src/assets/', '/assets/');
  }

  return trimmed;
}
