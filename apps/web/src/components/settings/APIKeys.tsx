/**
 * API Keys Component
 * Manage API keys and tokens
 */

'use client';

import { useState } from 'react';
import { clsx } from 'clsx';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import { Plus, Key, Copy, Trash2, Eye, EyeOff, Calendar, AlertTriangle } from 'lucide-react';
import { logger } from '@/lib/logger';

export interface APIKey {
  id: string;
  name: string;
  key: string;
  prefix: string;
  lastUsed?: string;
  createdAt: string;
  expiresAt?: string;
  scopes: string[];
}

export interface APIKeysProps {
  apiKeys?: APIKey[];
  onCreate?: (name: string, scopes: string[]) => Promise<APIKey>;
  onDelete?: (id: string) => Promise<void>;
  onRevoke?: (id: string) => Promise<void>;
  className?: string;
}

const availableScopes = [
  { id: 'read', label: 'Read', description: 'Read-only access' },
  { id: 'write', label: 'Write', description: 'Create and update resources' },
  { id: 'delete', label: 'Delete', description: 'Delete resources' },
  { id: 'admin', label: 'Admin', description: 'Full administrative access' },
];

export default function APIKeys({
  apiKeys = [],
  onCreate,
  onDelete,
  onRevoke: _onRevoke,
  className,
}: APIKeysProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [selectedScopes, setSelectedScopes] = useState<string[]>(['read']);
  const [createdKey, setCreatedKey] = useState<APIKey | null>(null);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const maskKey = (key: string, prefix: string) => {
    return `${prefix}${'•'.repeat(20)}${key.slice(-4)}`;
  };

  const toggleKeyVisibility = (id: string) => {
    setVisibleKeys((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      logger.info('API key copied to clipboard');
    } catch (error) {
      logger.error('Failed to copy to clipboard', error instanceof Error ? error : new Error(String(error)));
    }
  };

  const handleCreate = async () => {
    if (!newKeyName.trim() || selectedScopes.length === 0) return;

    setLoading(true);
    try {
      const key = await onCreate?.(newKeyName, selectedScopes);
      if (key) {
        setCreatedKey(key);
        setShowCreateModal(false);
        setShowKeyModal(true);
        setNewKeyName('');
        setSelectedScopes(['read']);
      }
    } catch (error) {
      logger.error('Failed to create API key', error instanceof Error ? error : new Error(String(error)));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this API key?')) return;
    try {
      await onDelete?.(id);
    } catch (error) {
      logger.error('Failed to delete API key', error instanceof Error ? error : new Error(String(error)));
    }
  };

  const isExpired = (expiresAt?: string) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  return (
    <div className={clsx('space-y-6', className)}>
      <Card className="bg-white dark:bg-gray-800">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Key className="w-5 h-5" />
              API Keys
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Manage your API keys for programmatic access
            </p>
          </div>
          <Button
            variant="primary"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create API Key
          </Button>
        </div>

        {apiKeys.length === 0 ? (
          <div className="text-center py-12">
            <Key className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">No API keys created yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {apiKeys.map((key) => (
              <div
                key={key.id}
                className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium text-gray-900 dark:text-gray-100">{key.name}</span>
                      {isExpired(key.expiresAt) && (
                        <Badge variant="error">Expired</Badge>
                      )}
                      {key.expiresAt && !isExpired(key.expiresAt) && (
                        <Badge variant="warning">Expires {new Date(key.expiresAt).toLocaleDateString()}</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <code className="text-sm font-mono bg-white dark:bg-gray-800 px-2 py-1 rounded border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100">
                        {visibleKeys.has(key.id) ? key.key : maskKey(key.key, key.prefix)}
                      </code>
                      <button
                        onClick={() => toggleKeyVisibility(key.id)}
                        className="p-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                      >
                        {visibleKeys.has(key.id) ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => copyToClipboard(key.key)}
                        className="p-1 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
                        title="Copy to clipboard"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Created {new Date(key.createdAt).toLocaleDateString()}
                      </div>
                      {key.lastUsed && (
                        <div>
                          Last used {new Date(key.lastUsed).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      {key.scopes.map((scope) => (
                        <Badge key={scope} variant="info" size="sm">
                          {scope}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(key.id)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Create API Key Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create API Key"
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Key Name"
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            placeholder="My API Key"
            required
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Scopes
            </label>
            <div className="space-y-2">
              {availableScopes.map((scope) => (
                <label
                  key={scope.id}
                  className="flex items-start gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <input
                    type="checkbox"
                    checked={selectedScopes.includes(scope.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedScopes([...selectedScopes, scope.id]);
                      } else {
                        setSelectedScopes(selectedScopes.filter((s) => s !== scope.id));
                      }
                    }}
                    className="mt-0.5"
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {scope.label}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {scope.description}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-end gap-3">
            <Button variant="ghost" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCreate}
              loading={loading}
              disabled={!newKeyName.trim() || selectedScopes.length === 0}
            >
              Create Key
            </Button>
          </div>
        </div>
      </Modal>

      {/* Show Created Key Modal */}
      <Modal
        isOpen={showKeyModal}
        onClose={() => {
          setShowKeyModal(false);
          setCreatedKey(null);
        }}
        title="API Key Created"
        size="md"
      >
        {createdKey && (
          <div className="space-y-4">
            <div className="p-4 bg-warning-50 dark:bg-warning-900/20 rounded-lg border border-warning-200 dark:border-warning-800">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-warning-600 dark:text-warning-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-warning-800 dark:text-warning-200">
                  <div className="font-medium mb-1">Important: Save this key now</div>
                  <div>You won't be able to see this key again. Make sure to copy it to a secure location.</div>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Your API Key
              </label>
              <div className="flex items-center gap-2">
                <code className="flex-1 font-mono text-sm bg-gray-100 dark:bg-gray-900 px-4 py-2 rounded border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 break-all">
                  {createdKey.key}
                </code>
                <Button
                  variant="outline"
                  onClick={() => copyToClipboard(createdKey.key)}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </Button>
              </div>
            </div>
            <div className="flex justify-end">
              <Button variant="primary" onClick={() => {
                setShowKeyModal(false);
                setCreatedKey(null);
              }}>
                I've Saved the Key
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

