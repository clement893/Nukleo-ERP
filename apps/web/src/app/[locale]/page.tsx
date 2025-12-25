/**
 * Home Page with Locale Support
 */

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';

export default function HomePage() {
  const t = useTranslations('common');

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">{t('welcome')}</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
          Full-stack template with Next.js 16 and FastAPI
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/auth/login"
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Get Started
          </Link>
        </div>
      </div>
    </div>
  );
}

