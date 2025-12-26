/**
 * Blog Tag Archive Page
 * 
 * Public page displaying blog posts filtered by tag.
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { BlogListing } from '@/components/blog';
import { PageHeader, PageContainer } from '@/components/layout';
import { Alert, Badge } from '@/components/ui';
import { logger } from '@/lib/logger';
import type { BlogPost } from '@/components/content';

export default function BlogTagArchivePage() {
  const t = useTranslations('blog.tag');
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const tagSlug = params?.tag as string;
  const tagName = tagSlug?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || '';
  
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const page = parseInt(searchParams.get('page') || '1', 10);
    setCurrentPage(page);
    loadPosts();
  }, [searchParams, tagSlug]);

  const loadPosts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // TODO: Replace with actual blog posts API endpoint when available
      // Example: const response = await apiClient.get('/v1/blog/posts', { params: { tag: tagSlug, page: currentPage, pageSize: 12, status: 'published' } });
      
      // Placeholder: Empty array for now
      setPosts([]);
      setTotalPages(1);
      
      setIsLoading(false);
    } catch (error) {
      logger.error('Failed to load blog posts by tag', error instanceof Error ? error : new Error(String(error)));
      setError(t('errors.loadFailed') || 'Failed to load blog posts. Please try again.');
      setIsLoading(false);
    }
  }, [tagSlug, currentPage, t]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    router.push(`/blog/tag/${tagSlug}?page=${page}`);
  };

  return (
    <PageContainer>
      <PageHeader
        title={
          <div className="flex items-center gap-3">
            <span>{t('title') || 'Tag'}:</span>
            <Badge variant="default" className="text-lg">
              #{tagName}
            </Badge>
          </div>
        }
        description={t('description', { tag: tagName }) || `Blog posts tagged with: ${tagName}`}
        breadcrumbs={[
          { label: t('breadcrumbs.home') || 'Home', href: '/' },
          { label: t('breadcrumbs.blog') || 'Blog', href: '/blog' },
          { label: `#${tagName}` },
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

