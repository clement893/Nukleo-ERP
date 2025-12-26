/**
 * Blog Year Archive Page
 * 
 * Public page displaying blog posts filtered by year.
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { BlogListing } from '@/components/blog';
import { PageHeader, PageContainer } from '@/components/layout';
import { Alert, Badge } from '@/components/ui';
import { Calendar } from 'lucide-react';
import { logger } from '@/lib/logger';
import type { BlogPost } from '@/components/content';

export default function BlogYearArchivePage() {
  const t = useTranslations('blog.archive');
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const year = params?.year as string;
  
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const page = parseInt(searchParams.get('page') || '1', 10);
    setCurrentPage(page);
    loadPosts();
  }, [searchParams, year]);

  const loadPosts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // TODO: Replace with actual blog posts API endpoint when available
      // Example: const response = await apiClient.get('/v1/blog/posts', { params: { year: year, page: currentPage, pageSize: 12, status: 'published' } });
      
      // Placeholder: Empty array for now
      setPosts([]);
      setTotalPages(1);
      
      setIsLoading(false);
    } catch (error) {
      logger.error('Failed to load blog posts by year', error instanceof Error ? error : new Error(String(error)));
      setError(t('errors.loadFailed') || 'Failed to load blog posts. Please try again.');
      setIsLoading(false);
    }
  }, [year, currentPage, t]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    router.push(`/blog/archive/${year}?page=${page}`);
  };

  return (
    <PageContainer>
      <PageHeader
        title={
          <div className="flex items-center gap-3">
            <Calendar className="w-6 h-6 text-gray-400" />
            <span>{t('title') || 'Archive'}:</span>
            <Badge variant="default" className="text-lg">
              {year}
            </Badge>
          </div>
        }
        description={t('description', { year }) || `Blog posts from ${year}`}
        breadcrumbs={[
          { label: t('breadcrumbs.home') || 'Home', href: '/' },
          { label: t('breadcrumbs.blog') || 'Blog', href: '/blog' },
          { label: year },
        ]}
      />

      {error && (
        <div className="mt-6">
          <Alert variant="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        </div>
      )}

      <div className="mt-8">
        <BlogListing
          posts={posts}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          isLoading={isLoading}
        />
      </div>
    </PageContainer>
  );
}

