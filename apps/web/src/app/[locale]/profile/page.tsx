/**
 * Profile Page
 * 
 * User profile page displaying profile information and edit form.
 * Accessible via dashboard navigation and sitemap.
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { usersAPI } from '@/lib/api';
import { ProfileCard, ProfileForm } from '@/components/profile';
import { PageHeader, PageContainer } from '@/components/layout';
import { Loading } from '@/components/ui';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

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
  const { user: authUser, isAuthenticated } = useAuthStore();
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

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
      console.error('Failed to load user profile:', error);
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
      // Backend expects first_name and last_name separately
      const updateData: { first_name?: string; last_name?: string; email?: string } = {};
      if (data.first_name !== undefined) updateData.first_name = data.first_name;
      if (data.last_name !== undefined) updateData.last_name = data.last_name;
      if (data.email !== undefined) updateData.email = data.email;
      
      const response = await usersAPI.updateMe(updateData);

      if (response.data) {
        setUser((prev) => (prev ? { ...prev, ...response.data } : null));
        // Update auth store
        useAuthStore.getState().setUser({
          ...authUser!,
          ...response.data,
          name: [data.first_name, data.last_name].filter(Boolean).join(' ') || response.data.email?.split('@')[0] || '',
        });
      }
    } catch (error) {
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
          title="Profile"
          description="Manage your profile information and account settings"
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Profile' },
          ]}
        />

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

