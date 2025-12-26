/**
 * Profile Page
 * 
 * User profile page displaying profile information and edit form.
 * Accessible via dashboard navigation and sitemap.
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/lib/store';
import { usersAPI } from '@/lib/api';
import { ProfileCard, ProfileForm } from '@/components/profile';
import { PageHeader, PageContainer } from '@/components/layout';
import { Loading, Alert } from '@/components/ui';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { sanitizeInput } from '@/utils/edgeCaseHandlers';
import { logger } from '@/lib/logger';

interface UserData {
  id: string | number;
  email: string;
  first_name?: string;
  last_name?: string;
  name?: string;
  avatar?: string;
  is_active?: boolean;
  is_admin?: boolean;
  is_verified?: boolean;
  created_at?: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const t = useTranslations('profile');
  const { user: authUser, isAuthenticated } = useAuthStore();
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/auth/login');
      return;
    }

    loadUser();
  }, [isAuthenticated, router]);

  const loadUser = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await usersAPI.getMe();
      if (response.data) {
        setUser({
          ...response.data,
          name: [response.data.first_name, response.data.last_name]
            .filter(Boolean)
            .join(' ') || response.data.email.split('@')[0],
        });
      }
    } catch (error) {
      logger.error('Failed to load user profile', error instanceof Error ? error : new Error(String(error)));
      setError(t('errors.loadFailed') || 'Failed to load profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (data: {
    first_name?: string;
    last_name?: string;
    email?: string;
    avatar?: string;
  }) => {
    try {
      setIsSaving(true);
      setError(null);
      
      // Sanitize input data
      const updateData: { first_name?: string; last_name?: string; email?: string } = {};
      
      if (data.first_name !== undefined) {
        updateData.first_name = sanitizeInput(data.first_name, { maxLength: 100, trim: true });
      }
      if (data.last_name !== undefined) {
        updateData.last_name = sanitizeInput(data.last_name, { maxLength: 100, trim: true });
      }
      if (data.email !== undefined) {
        updateData.email = sanitizeInput(data.email, { maxLength: 255, trim: true }).toLowerCase();
      }
      
      logger.debug('Updating user profile', { fields: Object.keys(updateData) });
      
      const response = await usersAPI.updateMe(updateData);

      if (response.data) {
        const updatedUser = {
          ...response.data,
          name: [response.data.first_name, response.data.last_name]
            .filter(Boolean)
            .join(' ') || response.data.email?.split('@')[0] || '',
        };
        
        setUser(updatedUser);
        
        // Update auth store
        useAuthStore.getState().setUser({
          ...authUser!,
          ...response.data,
          name: updatedUser.name,
        });
        
        logger.info('Profile updated successfully', { email: response.data.email });
      }
    } catch (error: any) {
      logger.error('Failed to update profile', error instanceof Error ? error : new Error(String(error)));
      const errorMessage = error?.response?.data?.detail || error?.message || t('errors.updateFailed') || 'Failed to update profile. Please try again.';
      setError(errorMessage);
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <PageContainer>
          <div className="flex items-center justify-center min-h-[400px]">
            <Loading />
          </div>
        </PageContainer>
      </ProtectedRoute>
    );
  }

  if (!user) {
    return (
      <ProtectedRoute>
        <PageContainer>
          <PageHeader title="Profile" description="User profile page" />
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">Failed to load profile</p>
          </div>
        </PageContainer>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <PageContainer>
        <PageHeader
          title={t('title') || 'Profile'}
          description={t('description') || 'Manage your profile information and account settings'}
          breadcrumbs={[
            { label: t('breadcrumbs.dashboard') || 'Dashboard', href: '/dashboard' },
            { label: t('breadcrumbs.profile') || 'Profile' },
          ]}
        />

        {error && (
          <div className="mt-6">
            <Alert variant="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          </div>
        )}

        <div className="mt-8 space-y-6">
          {/* Profile Card */}
          <ProfileCard
            user={user}
            onEdit={() => {
              // Scroll to form
              document.getElementById('profile-form')?.scrollIntoView({ behavior: 'smooth' });
            }}
          />

          {/* Profile Form */}
          <div id="profile-form">
            <ProfileForm
              user={user}
              onSubmit={handleSubmit}
              isLoading={isSaving}
            />
          </div>
        </div>
      </PageContainer>
    </ProtectedRoute>
  );
}

