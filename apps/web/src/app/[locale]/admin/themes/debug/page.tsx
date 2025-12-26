'use client';

import { useState, useEffect } from 'react';
import { getActiveTheme, listThemes } from '@/lib/api/theme';
import { TokenStorage } from '@/lib/auth/tokenStorage';
import { Card, Button, Alert, Loading } from '@/components/ui';
import ProtectedSuperAdminRoute from '@/components/auth/ProtectedSuperAdminRoute';
import Container from '@/components/ui/Container';

export default function ThemeDebugPage() {
  const [activeTheme, setActiveTheme] = useState<any>(null);
  const [allThemes, setAllThemes] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get active theme (public endpoint)
      const active = await getActiveTheme();
      setActiveTheme(active);

      // Get all themes (requires auth)
      const token = TokenStorage.getToken();
      if (token) {
        const themes = await listThemes(token);
        setAllThemes(themes);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load theme data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <ProtectedSuperAdminRoute>
        <Container className="py-8">
          <Loading />
        </Container>
      </ProtectedSuperAdminRoute>
    );
  }

  return (
    <ProtectedSuperAdminRoute>
      <Container className="py-8">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Theme Debug Information</h1>
            <Button onClick={loadData}>Refresh</Button>
          </div>

          {error && (
            <Alert variant="error">
              {error}
            </Alert>
          )}

          {/* Active Theme Info */}
          <Card title="Active Theme (from /api/v1/themes/active)">
            <div className="space-y-2">
              <div><strong>ID:</strong> {activeTheme?.id ?? 'N/A'}</div>
              <div><strong>Name:</strong> {activeTheme?.name ?? 'N/A'}</div>
              <div><strong>Display Name:</strong> {activeTheme?.display_name ?? 'N/A'}</div>
              <div><strong>Updated At:</strong> {activeTheme?.updated_at ? new Date(activeTheme.updated_at).toLocaleString() : 'N/A'}</div>
              <div className="mt-4">
                <strong>Config:</strong>
                <pre className="mt-2 p-4 bg-gray-100 dark:bg-gray-800 rounded overflow-auto text-sm">
                  {JSON.stringify(activeTheme?.config || {}, null, 2)}
                </pre>
              </div>
            </div>
          </Card>

          {/* All Themes List */}
          {allThemes && (
            <Card title={`All Themes (${allThemes.total} total)`}>
              <div className="space-y-4">
                {allThemes.themes.map((theme: any) => (
                  <div
                    key={theme.id}
                    className={`p-4 border rounded-lg ${
                      theme.is_active
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-semibold">
                          {theme.display_name}
                          {theme.is_active && (
                            <span className="ml-2 px-2 py-1 bg-green-500 text-white text-xs rounded">
                              ACTIVE
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          ID: {theme.id} | Name: {theme.name}
                        </div>
                        {theme.description && (
                          <div className="text-sm text-gray-500 mt-1">{theme.description}</div>
                        )}
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-gray-400">
                      Created: {new Date(theme.created_at).toLocaleString()} | 
                      Updated: {new Date(theme.updated_at).toLocaleString()}
                    </div>
                    <div className="mt-2">
                      <strong>Config:</strong>
                      <pre className="mt-1 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs overflow-auto">
                        {JSON.stringify(theme.config || {}, null, 2)}
                      </pre>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Summary */}
          <Card title="Summary">
            <div className="space-y-2">
              <div>
                <strong>Active Theme ID:</strong> {activeTheme?.id ?? 'None (virtual theme)'}
              </div>
              <div>
                <strong>Active Theme Name:</strong> {activeTheme?.name ?? 'default'}
              </div>
              <div>
                <strong>Total Themes in DB:</strong> {allThemes?.total ?? 'Unknown'}
              </div>
              <div>
                <strong>Themes with is_active=True:</strong>{' '}
                {allThemes?.themes?.filter((t: any) => t.is_active).length ?? 0}
              </div>
              {activeTheme?.id === 0 && (
                <Alert variant="warning" className="mt-4">
                  ⚠️ The active theme has ID=0, which means it's a virtual theme not stored in the database.
                  This should not happen - a default theme should be created automatically.
                </Alert>
              )}
            </div>
          </Card>
        </div>
      </Container>
    </ProtectedSuperAdminRoute>
  );
}

