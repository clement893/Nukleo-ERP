/**
 * Blog Author Archive Page
 * 
 * Public page displaying blog posts filtered by author.
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { BlogListing } from '@/components/blog';
import { PageHeader, PageContainer } from '@/components/layout';
import { Alert, Badge, Avatar } from '@/components/ui';
import { User } from 'lucide-react';
import { logger } from '@/lib/logger';
import type { BlogPost } from '@/components/content';

export default function BlogAuthorArchivePage() {
  const t = useTranslations('blog.author');
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const authorSlug = params?.author as string;
  const authorName = authorSlug?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || '';
  
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const page = parseInt(searchParams.get('page') || '1', 10);
    setCurrentPage(page);
    loadPosts();
  }, [searchParams, authorSlug]);

  const loadPosts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // TODO: Replace with actual blog posts API endpoint when available
      // Example: const response = await apiClient.get('/v1/blog/posts', { params: { author: authorSlug, page: currentPage, pageSize: 12, status: 'published' } });
      
      // Placeholder: Empty array for now
      setPosts([]);
      setTotalPages(1);
      
      setIsLoading(false);
    } catch (error) {
      logger.error('Failed to load blog posts by author', error instanceof Error ? error : new Error(String(error)));
      setError(t('errors.loadFailed') || 'Failed to load blog posts. Please try again.');
      setIsLoading(false);
    }
  }, [authorSlug, currentPage, t]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    router.push(`/blog/author/${authorSlug}?page=${page}`);
  };

  return (
    <PageContainer>
      <PageHeader
        title={
          <div className="flex items-center gap-3">
            <Avatar className="w-8 h-8">
              <User className="w-5 h-5" />
            </Avatar>
            <span>{t('title') || 'Author'}: {authorName}</span>
          </div>
        }
        description={t('description', { author: authorName }) || `Blog posts by ${authorName}`}
        breadcrumbs={[
          { label: t('breadcrumbs.home') || 'Home', href: '/' },
          { label: t('breadcrumbs.blog') || 'Blog', href: '/blog' },
          { label: authorName },
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

