'use client';

import { useState, useEffect } from 'react';
import { History, RotateCcw, GitCompare } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { apiClient } from '@/lib/api/client';
import { useToast } from '@/components/ui';
import { formatDistanceToNow } from '@/lib/utils/dateUtils';
import { getErrorMessage } from '@/lib/errors';

interface Version {
  id: number;
  version_number: number;
  title?: string;
  description?: string;
  change_type?: string;
  is_current: boolean;
  user_id?: number;
  created_at: string;
}

interface VersionHistoryProps {
  entityType: string;
  entityId: number;
  className?: string;
  onRestore?: (version: Version) => void;
}

export function VersionHistory({
  entityType,
  entityId,
  className = '',
  onRestore,
}: VersionHistoryProps) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedVersions, setSelectedVersions] = useState<number[]>([]);
  const { showToast } = useToast();

  useEffect(() => {
    fetchVersions();
  }, [entityType, entityId]);

  const fetchVersions = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get<Version[]>(
        `/api/v1/versions/versions/${entityType}/${entityId}`,
        {
          params: {
            limit: 50,
          },
        }
      );
      if (response.data) {
        setVersions(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch versions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestore = async (version: Version) => {
    if (!confirm(`Are you sure you want to restore to version ${version.version_number}?`)) {
      return;
    }

    try {
      await apiClient.post(`/api/v1/versions/versions/${version.id}/restore`);
      showToast({
        message: `Restored to version ${version.version_number}`,
        type: 'success',
      });
      fetchVersions();
      onRestore?.(version);
    } catch (error: unknown) {
      showToast({
        message: getErrorMessage(error) || 'Failed to restore version',
        type: 'error',
      });
    }
  };

  const handleCompare = async () => {
    if (selectedVersions.length !== 2) {
      showToast({
        message: 'Please select exactly 2 versions to compare',
        type: 'error',
      });
      return;
    }

    try {
      const response = await apiClient.get(
        `/api/v1/versions/versions/${entityType}/${entityId}/compare`,
        {
          params: {
            version1: selectedVersions[0],
            version2: selectedVersions[1],
          },
        }
      );
      // Show comparison in a modal or new page
      console.log('Comparison:', response.data);
      showToast({
        message: 'Comparison loaded (check console)',
        type: 'info',
      });
    } catch (error: unknown) {
      showToast({
        message: getErrorMessage(error) || 'Failed to compare versions',
        type: 'error',
      });
    }
  };

  const toggleVersionSelection = (versionNumber: number) => {
    setSelectedVersions((prev) => {
      if (prev.includes(versionNumber)) {
        return prev.filter((v) => v !== versionNumber);
      } else if (prev.length < 2) {
        return [...prev, versionNumber];
      }
      return prev;
    });
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <div className="text-center py-8 text-gray-500">Loading version history...</div>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-gray-500" />
          <h3 className="text-lg font-semibold">Version History</h3>
        </div>
        {selectedVersions.length === 2 && (
          <Button variant="outline" size="sm" onClick={handleCompare}>
            <GitCompare className="h-4 w-4 mr-2" />
            Compare
          </Button>
        )}
      </div>

      {versions.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <History className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p>No version history</p>
        </div>
      ) : (
        <div className="space-y-3">
          {versions.map((version) => (
            <div
              key={version.id}
              className={`p-3 border rounded-lg ${
                version.is_current
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-gray-200 dark:border-gray-700'
              } ${
                selectedVersions.includes(version.version_number)
                  ? 'ring-2 ring-primary-500'
                  : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <input
                    type="checkbox"
                    checked={selectedVersions.includes(version.version_number)}
                    onChange={() => toggleVersionSelection(version.version_number)}
                    className="mt-1"
                    disabled={version.is_current}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm">
                        Version {version.version_number}
                        {version.is_current && (
                          <span className="ml-2 text-xs bg-primary-500 text-white px-2 py-0.5 rounded">
                            Current
                          </span>
                        )}
                      </span>
                      {version.change_type && (
                        <span className="text-xs text-gray-500 capitalize">
                          {version.change_type}
                        </span>
                      )}
                    </div>
                    {version.title && (
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                        {version.title}
                      </p>
                    )}
                    {version.description && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                        {version.description}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDistanceToNow(new Date(version.created_at))}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1">
                  {!version.is_current && (
                    <button
                      onClick={() => handleRestore(version)}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-primary-600 dark:text-primary-400"
                      title="Restore this version"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

