/**
 * Theme Manager Component - Admin interface for managing platform themes.
 */
'use client';

import { useState, useEffect } from 'react';
import {
  listThemes,
  createTheme,
  updateTheme,
  activateTheme,
  deleteTheme,
} from '@/lib/api/theme';
import type { Theme, ThemeCreate, ThemeUpdate } from '@modele/types';

interface ThemeManagerProps {
  authToken: string;
}

export function ThemeManager({ authToken }: ThemeManagerProps) {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [activeThemeId, setActiveThemeId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingTheme, setEditingTheme] = useState<Theme | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    loadThemes();
  }, []);

  const loadThemes = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await listThemes(authToken);
      setThemes(response.themes);
      setActiveThemeId(response.active_theme_id || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load themes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTheme = async (themeData: ThemeCreate) => {
    try {
      setError(null);
      await createTheme(themeData, authToken);
      await loadThemes();
      setShowCreateForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create theme');
    }
  };

  const handleUpdateTheme = async (themeId: number, themeData: ThemeUpdate) => {
    try {
      setError(null);
      await updateTheme(themeId, themeData, authToken);
      await loadThemes();
      setEditingTheme(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update theme');
    }
  };

  const handleActivateTheme = async (themeId: number) => {
    try {
      setError(null);
      await activateTheme(themeId, authToken);
      await loadThemes();
      // Refresh the page to apply the new theme
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to activate theme');
    }
  };

  const handleDeleteTheme = async (themeId: number) => {
    if (!confirm('Are you sure you want to delete this theme?')) {
      return;
    }

    try {
      setError(null);
      await deleteTheme(themeId, authToken);
      await loadThemes();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete theme');
    }
  };

  if (isLoading) {
    return <div className="p-4">Loading themes...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Theme Management</h1>
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Create New Theme
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {showCreateForm && (
        <ThemeForm
          onSubmit={handleCreateTheme}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      {editingTheme && (
        <ThemeForm
          theme={editingTheme}
          onSubmit={(data) => handleUpdateTheme(editingTheme.id, data)}
          onCancel={() => setEditingTheme(null)}
        />
      )}

      <div className="grid gap-4">
        {themes.map((theme) => (
          <div
            key={theme.id}
            className="p-4 border rounded-lg space-y-2"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold">{theme.display_name}</h3>
                <p className="text-sm text-gray-600">{theme.name}</p>
                {theme.description && (
                  <p className="text-sm text-gray-500 mt-1">{theme.description}</p>
                )}
              </div>
              <div className="flex gap-2">
                {theme.is_active && (
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">
                    Active
                  </span>
                )}
                {!theme.is_active && (
                  <button
                    onClick={() => handleActivateTheme(theme.id)}
                    className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                  >
                    Activate
                  </button>
                )}
                <button
                  onClick={() => setEditingTheme(theme)}
                  className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                >
                  Edit
                </button>
                {!theme.is_active && (
                  <button
                    onClick={() => handleDeleteTheme(theme.id)}
                    className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
            <div className="text-xs text-gray-400">
              Updated: {new Date(theme.updated_at).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface ThemeFormProps {
  theme?: Theme;
  onSubmit: (data: ThemeCreate | ThemeUpdate) => void;
  onCancel: () => void;
}

function ThemeForm({ theme, onSubmit, onCancel }: ThemeFormProps) {
  const [name, setName] = useState(theme?.name || '');
  const [displayName, setDisplayName] = useState(theme?.display_name || '');
  const [description, setDescription] = useState(theme?.description || '');
  const [config, setConfig] = useState(
    JSON.stringify(theme?.config || {}, null, 2)
  );
  const [isActive, setIsActive] = useState(theme?.is_active || false);
  const [configError, setConfigError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let parsedConfig;
    try {
      parsedConfig = JSON.parse(config);
      setConfigError(null);
    } catch (err) {
      setConfigError('Invalid JSON configuration');
      return;
    }

    if (theme) {
      onSubmit({
        display_name: displayName,
        description: description || null,
        config: parsedConfig,
        is_active: isActive,
      });
    } else {
      onSubmit({
        name,
        display_name: displayName,
        description: description || null,
        config: parsedConfig,
        is_active: isActive,
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border rounded-lg space-y-4">
      <h2 className="text-xl font-semibold">
        {theme ? 'Edit Theme' : 'Create Theme'}
      </h2>

      {!theme && (
        <div>
          <label className="block text-sm font-medium mb-1">Theme Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-3 py-2 border rounded"
            placeholder="my-theme"
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1">Display Name</label>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          required
          className="w-full px-3 py-2 border rounded"
          placeholder="My Theme"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-3 py-2 border rounded"
          rows={3}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Configuration (JSON)</label>
        <textarea
          value={config}
          onChange={(e) => setConfig(e.target.value)}
          required
          className="w-full px-3 py-2 border rounded font-mono text-sm"
          rows={10}
        />
        {configError && (
          <p className="text-red-600 text-sm mt-1">{configError}</p>
        )}
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="isActive"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          className="mr-2"
        />
        <label htmlFor="isActive" className="text-sm">
          Activate this theme immediately
        </label>
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          {theme ? 'Update' : 'Create'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

