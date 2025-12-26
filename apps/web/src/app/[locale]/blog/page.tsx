/**
 * Blog Listing Page
 * 
 * Public page displaying all published blog posts.
 */

'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { BlogListing } from '@/components/blog';
import { PageHeader, PageContainer } from '@/components/layout';
import { Alert } from '@/components/ui';
import { logger } from '@/lib/logger';
import type { BlogPost } from '@/components/content';

export default function BlogPage() {
  const t = useTranslations('blog');
  const searchParams = useSearchParams();
  const router = useRouter();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const page = parseInt(searchParams.get('page') || '1', 10);
    setCurrentPage(page);
    loadPosts();
  }, [searchParams]);

  const loadPosts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // TODO: Replace with actual blog posts API endpoint when available
      // For now, we'll use a placeholder that can be replaced later
      // Example: const response = await apiClient.get('/v1/blog/posts', { params: { page: currentPage, pageSize: 12, status: 'published' } });
      
      // Placeholder: Empty array for now
      setPosts([]);
      setTotalPages(1);
      
      setIsLoading(false);
    } catch (error) {
      logger.error('Failed to load blog posts', error instanceof Error ? error : new Error(String(error)));
      setError(t('errors.loadFailed') || 'Failed to load blog posts. Please try again.');
      setIsLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    router.push(`/blog?page=${page}`);
  };

  return (
    <PageContainer>
      <PageHeader
        title={t('title') || 'Blog'}
        description={t('description') || 'Read our latest articles and updates'}
        breadcrumbs={[
          { label: t('breadcrumbs.home') || 'Home', href: '/' },
          { label: t('breadcrumbs.blog') || 'Blog' },
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

