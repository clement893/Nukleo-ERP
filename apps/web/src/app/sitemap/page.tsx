import Link from 'next/link';
import { Metadata } from 'next';
import { sitePages, BASE_URL } from '@/config/sitemap';

export const metadata: Metadata = {
  title: 'Plan du Site - Sitemap',
  description: 'Plan du site complet avec tous les liens et pages disponibles',
};

export default function SitemapPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Plan du Site
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Retrouvez tous les liens et pages disponibles sur le site. Utilisez ce plan pour naviguer facilement.
            </p>
          </div>

          <div className="space-y-8">
            {Object.entries(sitePages).map(([category, pages]) => (
              <div key={category} className="border-b border-gray-200 dark:border-gray-700 pb-6 last:border-b-0">
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
                  {category}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pages.map((page) => (
                    <Link
                      key={page.path}
                      href={page.path}
                      className="block p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-md transition-all group"
                    >
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition mb-2">
                        {page.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {page.description}
                      </p>
                      <span className="text-xs text-blue-600 dark:text-blue-400 font-mono">
                        {page.path}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
              Sitemap XML
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Pour les moteurs de recherche, vous pouvez également accéder au sitemap XML :
            </p>
            <Link
              href="/sitemap.xml"
              className="inline-block text-blue-600 dark:text-blue-400 hover:underline font-mono"
            >
              {BASE_URL}/sitemap.xml
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

