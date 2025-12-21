/**
 * Locale Switcher Component
 * Composant pour changer de langue
 */

'use client';

import { useSwitchLocale, useLocale } from '@/lib/i18n/hooks';
import { supportedLocales, localeNames } from '@/lib/i18n/config';
import Dropdown from '@/components/ui/Dropdown';
import type { DropdownItem } from '@/components/ui/Dropdown';
import { useRouter } from 'next/navigation';

export default function LocaleSwitcher() {
  const router = useRouter();
  const currentLocale = useLocale();
  const switchLocale = useSwitchLocale();

  const items: DropdownItem[] = supportedLocales.map((locale) => ({
    label: localeNames[locale],
    value: locale,
    onClick: () => {
      const newUrl = switchLocale(locale);
      router.push(newUrl);
    },
  }));

  return (
    <Dropdown
      trigger={
        <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
          <span className="text-sm font-medium">{localeNames[currentLocale]}</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      }
      items={items}
    />
  );
}

