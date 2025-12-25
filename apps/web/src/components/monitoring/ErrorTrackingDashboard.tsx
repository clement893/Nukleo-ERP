/**
 * Error Tracking Dashboard Component
 * Displays error statistics and recent errors
 * Uses abstraction layers (service and hook) for business logic
 */

'use client';

import { useMemo } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { AlertCircle, TrendingUp, RefreshCw, XCircle, AlertTriangle } from '@/lib/icons';
import { useErrorTracking } from '@/hooks/monitoring/useErrorTracking';
import { ErrorStatisticsService } from '@/services/errorStatisticsService';
import { getErrorLevelConfig } from '@/utils/errorLevelUtils';

export default function ErrorTrackingDashboard() {
  // Use custom hook for data fetching and statistics
  const { errors, stats, isLoading, refresh } = useErrorTracking();

  // Get recent errors using the service
  const recentErrors = useMemo(
    () => ErrorStatisticsService.getRecentErrors(errors, 10),
    [errors]
  );

  const handleRefresh = () => {
    refresh();
  };

  const handleClearErrors = () => {
    if (confirm('Are you sure you want to clear all error logs?')) {
      localStorage.removeItem('error_tracking');
      refresh(); // Refresh to update UI
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Error Tracking Dashboard
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Monitor application errors and performance issues
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="secondary" onClick={handleClearErrors}>
            Clear Logs
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Errors</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {stats.totalErrors}
              </p>
            </div>
            <AlertCircle className="w-8 h-8 text-gray-400" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Last 24h</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {stats.errorsLast24h}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-blue-400" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Last 7 Days</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {stats.errorsLast7d}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-400" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Critical</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {stats.criticalErrors}
              </p>
            </div>
            <XCircle className="w-8 h-8 text-red-400" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Warnings</p>
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {stats.warningErrors}
              </p>
            </div>
            <AlertTriangle className="w-8 h-8 text-yellow-400" />
          </div>
        </Card>
      </div>

      {/* Recent Errors */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Recent Errors
          </h3>
        </div>

        {recentErrors.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No errors recorded</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentErrors.map((error) => {
              const levelConfig = getErrorLevelConfig(error.level);
              const LevelIcon = levelConfig.icon;
              
              return (
                <div
                  key={error.id}
                  className="flex items-start justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <LevelIcon className="w-4 h-4" />
                      <Badge variant={levelConfig.color}>{error.level}</Badge>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(error.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-900 dark:text-gray-100 font-medium">
                      {error.message}
                    </p>
                    {error.url && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {error.url}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Sentry Integration Note */}
      <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
              Sentry Integration
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
              For production error tracking, configure Sentry DSN in your environment variables.
              Errors will be automatically sent to Sentry for detailed analysis.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

