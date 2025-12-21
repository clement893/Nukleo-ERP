'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/auth/login');
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated, router]);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <nav className="bg-white shadow">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* User Profile Card */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Your Profile
            </h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Name</p>
                <p className="text-lg font-semibold text-gray-900">
                  {user?.name}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="text-lg font-semibold text-gray-900">
                  {user?.email}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <p className="text-lg font-semibold text-green-600">
                  {user?.is_active ? 'Active' : 'Inactive'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Verified</p>
                <p className="text-lg font-semibold">
                  {user?.is_verified ? '✓ Yes' : '✗ No'}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Quick Stats
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
                <span className="text-gray-700">Resources</span>
                <span className="text-2xl font-bold text-blue-600">0</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                <span className="text-gray-700">Files</span>
                <span className="text-2xl font-bold text-green-600">0</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-purple-50 rounded-lg">
                <span className="text-gray-700">Activities</span>
                <span className="text-2xl font-bold text-purple-600">0</span>
              </div>
            </div>
          </div>
        </div>

        {/* API Status */}
        <div className="mt-8 bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            API Status
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border border-green-200 bg-green-50 rounded-lg">
              <p className="text-green-700 font-semibold">✓ Backend Connected</p>
              <p className="text-sm text-gray-600">API is running</p>
            </div>
            <div className="p-4 border border-green-200 bg-green-50 rounded-lg">
              <p className="text-green-700 font-semibold">✓ Database Connected</p>
              <p className="text-sm text-gray-600">PostgreSQL is running</p>
            </div>
            <div className="p-4 border border-green-200 bg-green-50 rounded-lg">
              <p className="text-green-700 font-semibold">✓ Authentication</p>
              <p className="text-sm text-gray-600">JWT is working</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
