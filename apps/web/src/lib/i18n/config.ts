/**
 * Internationalization Configuration
 * Using next-intl for i18n support
 */

import { notFound } from 'next/navigation';
import { getRequestConfig } from 'next-intl/server';
import type { Locale } from './messages';

// Supported locales
export const locales = ['fr', 'en', 'es'] as const;
export const supportedLocales = locales;

export const defaultLocale: Locale = 'fr';

// Locale display names
export const localeNames: Record<Locale, string> = {
  fr: 'Français',
  en: 'English',
  es: 'Español',
};

export default getRequestConfig(async ({ locale }) => {
  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  return {
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
