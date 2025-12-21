/**
 * Configuration i18n
 * Support multi-langue pour l'application
 */

export const supportedLocales = ['fr', 'en', 'es'] as const;
export type Locale = typeof supportedLocales[number];

export const defaultLocale: Locale = 'fr';

export const localeNames: Record<Locale, string> = {
  fr: 'Français',
  en: 'English',
  es: 'Español',
};

export const localeConfig = {
  defaultLocale,
  supportedLocales,
  localeNames,
} as const;

