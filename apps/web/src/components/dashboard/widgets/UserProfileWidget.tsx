'use client';

/**
 * Widget : Profil Utilisateur
 */

import { UserCircle, Mail } from 'lucide-react';
import type { WidgetProps } from '@/lib/dashboard/types';
import { useAuthStore } from '@/lib/store';
import Link from 'next/link';

export function UserProfileWidget({ }: WidgetProps) {
  const { user } = useAuthStore();

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <UserCircle className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Non connecté
          </p>
        </div>
      </div>
    );
  }

  const userName = user.name || user.email || 'Utilisateur';
  const userEmail = user.email || '';
  const userAvatar = null; // User type doesn't have avatar/image properties

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        {/* Avatar */}
        <div className="mb-4">
          {userAvatar ? (
            <img
              src={userAvatar}
              alt={userName}
              className="w-20 h-20 rounded-full border-2 border-gray-200 dark:border-gray-700"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <UserCircle className="w-12 h-12 text-blue-600 dark:text-blue-400" />
            </div>
          )}
        </div>

        {/* Name */}
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
          {userName}
        </h3>

        {/* Email */}
        {userEmail && (
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
            <Mail className="w-4 h-4" />
            <span>{userEmail}</span>
          </div>
        )}

        {/* Link to profile */}
        <Link
          href="/profile"
          className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
        >
          Voir mon profil →
        </Link>
      </div>
    </div>
  );
}
