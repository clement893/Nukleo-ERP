/**
 * Admin Media Library Page
 * 
 * Page for managing media files with upload and organization in the admin panel.
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/lib/store';
import { MediaLibrary } from '@/components/content';
import type { MediaItem } from '@/components/content';
import { PageHeader, PageContainer } from '@/components/layout';
import { Loading, Alert } from '@/components/ui';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { logger } from '@/lib/logger';
import { handleApiError } from '@/lib/errors';
import { mediaAPI } from '@/lib/api/media';

export default function AdminMediaLibraryPage() {
  const router = useRouter();
  const t = useTranslations('content.media');
  const { isAuthenticated } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [media, setMedia] = useState<MediaItem[]>([]);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    loadMedia();
  }, [isAuthenticated, router]);

  const loadMedia = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Fetch all media from S3 bucket
      const mediaFiles = await mediaAPI.list(0, 1000, undefined, true);
      
      // Convert API Media to MediaItem format
      const convertedMedia: MediaItem[] = mediaFiles.map((file) => {
        // Determine media type from mime_type or filename extension
        let type: 'image' | 'video' | 'document' | 'audio' | 'other' = 'other';
        if (file.mime_type) {
          if (file.mime_type.startsWith('image/')) {
            type = 'image';
          } else if (file.mime_type.startsWith('video/')) {
            type = 'video';
          } else if (file.mime_type.startsWith('audio/')) {
            type = 'audio';
          } else {
            type = 'document';
          }
        } else {
          // Fallback to filename extension if mime_type is not available
          const ext = file.filename.split('.').pop()?.toLowerCase();
          if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext || '')) {
            type = 'image';
          } else if (['mp4', 'mov', 'webm', 'avi'].includes(ext || '')) {
            type = 'video';
          } else if (['mp3', 'wav', 'ogg'].includes(ext || '')) {
            type = 'audio';
          } else {
            type = 'document';
          }
        }
        
        return {
          id: String(file.id),
          name: file.filename,
          url: file.file_path, // This should be the full URL (presigned URL from S3)
          type,
          mime_type: file.mime_type || 'application/octet-stream',
          size: file.file_size,
          created_at: file.created_at,
          updated_at: file.updated_at,
        };
      });
      
      setMedia(convertedMedia);
    } catch (error: unknown) {
      logger.error('Failed to load media', error instanceof Error ? error : new Error(String(error)));
      const appError = handleApiError(error);
      setError(appError.message || t('errors.loadFailed') || 'Failed to load media. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpload = async (files: File[]) => {
    try {
      setError(null);
      logger.info('Uploading files', { count: files.length });
      
      // Upload each file
      for (const file of files) {
        await mediaAPI.upload(file, { folder: 'media' });
      }
      
      // Reload media list
      await loadMedia();
    } catch (error: unknown) {
      logger.error('Failed to upload files', error instanceof Error ? error : new Error(String(error)));
      const appError = handleApiError(error);
      setError(appError.message || 'Failed to upload files. Please try again.');
      throw error;
    }
  };

  const handleDelete = async (id: string | number) => {
    try {
      setError(null);
      logger.info('Deleting media', { id });
      
      // For S3 files (string IDs), we can't delete via the normal API
      // We'll need to reload the list instead
      // TODO: Implement S3 file deletion if needed
      if (typeof id === 'string') {
        logger.warn('Cannot delete S3 file via API - file_key needed', { id });
        // Just reload the list for now
        await loadMedia();
        return;
      }
      
      await mediaAPI.delete(id as number);
      
      // Reload media list
      await loadMedia();
    } catch (error: unknown) {
      logger.error('Failed to delete media', error instanceof Error ? error : new Error(String(error)));
      const appError = handleApiError(error);
      setError(appError.message || 'Failed to delete media. Please try again.');
      throw error;
    }
  };

  if (isLoading) {
    return (
      <ProtectedRoute requireAdmin>
        <PageContainer>
          <div className="flex items-center justify-center min-h-[400px]">
            <Loading />
          </div>
        </PageContainer>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requireAdmin>
      <PageContainer>
        <PageHeader
          title={t('title') || 'Media Library'}
          description={t('description') || 'Upload and manage your media files'}
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Admin', href: '/admin' },
            { label: 'Media' },
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
          <MediaLibrary
            media={media}
            onUpload={handleUpload}
            onDelete={handleDelete}
          />
        </div>
      </PageContainer>
    </ProtectedRoute>
  );
}
