/**
 * Internationalization Setup
 * 
 * Provides i18n utilities and configuration
 * Currently set up for future next-intl integration
 */

import { defaultLocale, type Locale } from './config';

/**
 * Get translations (placeholder for next-intl integration)
 * 
 * @param key - Translation key
 * @param _locale - Locale to use (currently unused, placeholder for next-intl)
 * @returns Translated string
 */
export function t(key: string, _locale: Locale = defaultLocale): string {
  // Placeholder - will be replaced with next-intl when fully integrated
  // For now, returns the key
  // _locale parameter is prefixed with _ to indicate it's intentionally unused
  return key;
}

/**
 * Get current locale from request/cookies
 * 
 * @returns Current locale
 */
export function getLocale(): Locale {
  if (typeof window === 'undefined') {
    return defaultLocale;
  }
  
  // Check localStorage or cookie for locale preference
  const stored = localStorage.getItem('locale') as Locale | null;
  if (stored && ['en', 'fr'].includes(stored)) {
    return stored;
  }
  
  // Check browser language
  const browserLang = navigator.language.split('-')[0];
  if (browserLang && ['en', 'fr'].includes(browserLang)) {
    return browserLang as Locale;
  }
  
  return defaultLocale;
}

/**
 * Set locale preference
 * 
 * @param locale - Locale to set
 */
export function setLocale(locale: Locale): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('locale', locale);
    // Reload page to apply locale
    window.location.reload();
  }
}

