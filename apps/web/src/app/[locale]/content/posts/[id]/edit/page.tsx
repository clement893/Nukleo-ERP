/**
 * Blog Post Editor Page
 * 
 * Page for editing blog posts with rich text editor.
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/lib/store';
import { RichTextEditor } from '@/components/ui';
import { PageHeader, PageContainer } from '@/components/layout';
import { Card, Input, Textarea, Button, Select, Alert } from '@/components/ui';
import { Save, Eye, ArrowLeft } from 'lucide-react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { logger } from '@/lib/logger';
import { Link } from '@/i18n/routing';
import type { BlogPost } from '@/components/content';

export default function BlogPostEditPage() {
  const t = useTranslations('content.posts');
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const postId = params?.id as string;
  const isNew = postId === 'new';

  const [post, setPost] = useState<Partial<BlogPost>>({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    content_html: '',
    status: 'draft',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/auth/login');
      return;
    }

    if (!isNew) {
      loadPost();
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated, router, postId, isNew]);

  const loadPost = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // TODO: Replace with actual blog post API endpoint when available
      // const response = await apiClient.get(`/v1/blog/posts/${postId}`);
      // setPost(response.data);
      
      setIsLoading(false);
    } catch (error) {
      logger.error('Failed to load blog post', error instanceof Error ? error : new Error(String(error)));
      setError(t('errors.loadFailed') || 'Failed to load blog post. Please try again.');
      setIsLoading(false);
    }
  }, [postId, t]);

  const handleSave = async (publish: boolean = false) => {
    try {
      setIsSaving(true);
      setError(null);

      const postData = {
        ...post,
        status: publish ? 'published' : post.status,
      };

      if (isNew) {
        // TODO: Create post via API
        // await apiClient.post('/v1/blog/posts', postData);
        logger.info('Creating post', postData);
      } else {
        // TODO: Update post via API
        // await apiClient.put(`/v1/blog/posts/${postId}`, postData);
        logger.info('Updating post', { id: postId, data: postData });
      }

      router.push('/content/posts');
    } catch (error) {
      logger.error('Failed to save blog post', error instanceof Error ? error : new Error(String(error)));
      setError(t('errors.saveFailed') || 'Failed to save blog post. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleTitleChange = (value: string) => {
    setPost({
      ...post,
      title: value,
      slug: post.slug || generateSlug(value),
    });
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <PageContainer>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading...</p>
            </div>
          </div>
        </PageContainer>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <PageContainer>
        <PageHeader
          title={isNew ? (t('createPost') || 'Create New Post') : (t('editPost') || 'Edit Post')}
          description={t('description') || 'Edit your blog post content'}
          breadcrumbs={[
            { label: t('breadcrumbs.dashboard') || 'Dashboard', href: '/dashboard' },
            { label: t('breadcrumbs.content') || 'Content', href: '/content' },
            { label: t('breadcrumbs.posts') || 'Posts', href: '/content/posts' },
            { label: isNew ? (t('breadcrumbs.new') || 'New') : (t('breadcrumbs.edit') || 'Edit') },
          ]}
          actions={
            <div className="flex items-center gap-2">
              <Link href="/content/posts">
                <Button variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
              <Button
                variant="outline"
                onClick={() => setPreviewMode(!previewMode)}
              >
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </Button>
              <Button
                variant="outline"
                onClick={() => handleSave(false)}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save Draft'}
              </Button>
              <Button
                variant="primary"
                onClick={() => handleSave(true)}
                disabled={isSaving}
              >
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? 'Publishing...' : 'Publish'}
              </Button>
            </div>
          }
        />

        {error && (
          <div className="mt-6">
            <Alert variant="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          </div>
        )}

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Editor */}
          <div className="lg:col-span-2">
            <Card>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Title *
                  </label>
                  <Input
                    value={post.title || ''}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="Post title"
                    required
                    className="text-2xl font-bold"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Excerpt
                  </label>
                  <Textarea
                    value={post.excerpt || ''}
                    onChange={(e) => setPost({ ...post, excerpt: e.target.value })}
                    placeholder="Short excerpt for preview..."
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Content *
                  </label>
                  <RichTextEditor
                    value={(post.content_html || post.content || '') as string}
                    onChange={(html) => setPost({ ...post, content_html: html, content: html })}
                    placeholder="Write your post content..."
                    minHeight="500px"
                  />
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Publish Settings */}
            <Card title="Publish">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Status
                  </label>
                  <Select
                    options={[
                      { label: 'Draft', value: 'draft' },
                      { label: 'Published', value: 'published' },
                      { label: 'Archived', value: 'archived' },
                    ]}
                    value={post.status || 'draft'}
                    onChange={(e) => setPost({ ...post, status: e.target.value as BlogPost['status'] })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Slug *
                  </label>
                  <Input
                    value={post.slug || ''}
                    onChange={(e) => setPost({ ...post, slug: e.target.value })}
                    placeholder="post-slug"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    URL-friendly identifier
                  </p>
                </div>
              </div>
            </Card>

            {/* Categories & Tags */}
            <Card title="Categories & Tags">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Category
                  </label>
                  <Select
                    options={[
                      { label: 'Uncategorized', value: '' },
                      // TODO: Load categories from API
                    ]}
                    value={post.category_id?.toString() || ''}
                    onChange={(e) => setPost({ ...post, category_id: e.target.value ? parseInt(e.target.value, 10) : undefined })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Tags
                  </label>
                  <Input
                    placeholder="Add tags (comma-separated)"
                    // TODO: Implement tag input component
                  />
                </div>
              </div>
            </Card>
          </div>
        </div>
      </PageContainer>
    </ProtectedRoute>
  );
}

