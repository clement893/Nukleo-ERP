/**
 * OverviewSection Component
 * Displays quick status overview of frontend and backend connections
 */

import { Button, Card, Alert, Badge } from '@/components/ui';
import { RefreshCw } from 'lucide-react';
import type { ConnectionStatus } from '../types/health.types';

interface OverviewSectionProps {
  status: ConnectionStatus | null;
  isLoading: boolean;
  onRefresh: () => void;
}

export function OverviewSection({ status, isLoading, onRefresh }: OverviewSectionProps) {
  return (
    <Card className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Quick Status</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isLoading}
          aria-label="Refresh connection status"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {status && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {status.frontend && (
            <div>
              <h3 className="font-medium mb-2">Frontend Connections</h3>
              {status.frontend.error ? (
                <Alert variant="warning" className="mt-2">
                  <p className="text-sm">{status.frontend.error}</p>
                  {status.frontend.message && (
                    <p className="text-xs mt-1 text-gray-600">{status.frontend.message}</p>
                  )}
                </Alert>
              ) : status.frontend.message ? (
                <Alert variant="info" className="mt-2">
                  <p className="text-sm">{status.frontend.message}</p>
                  {status.frontend.note && (
                    <p className="text-xs mt-1 text-gray-600">{status.frontend.note}</p>
                  )}
                </Alert>
              ) : status.frontend.total !== undefined ? (
                <div className="space-y-1 text-sm" role="list">
                  <div className="flex justify-between" role="listitem">
                    <span>Total:</span>
                    <span className="font-medium">{status.frontend.total}</span>
                  </div>
                  <div className="flex justify-between" role="listitem">
                    <span>✅ Connected:</span>
                    <Badge variant="success">{status.frontend.connected}</Badge>
                  </div>
                  <div className="flex justify-between" role="listitem">
                    <span>⚠️ Partial:</span>
                    <Badge variant="warning">{status.frontend.partial}</Badge>
                  </div>
                  <div className="flex justify-between" role="listitem">
                    <span>❌ Needs Integration:</span>
                    <Badge variant="error">{status.frontend.needsIntegration}</Badge>
                  </div>
                  <div className="flex justify-between" role="listitem">
                    <span>🟡 Static:</span>
                    <Badge variant="info">{status.frontend.static}</Badge>
                  </div>
                </div>
              ) : (
                <Alert variant="info" className="mt-2">
                  <p className="text-sm">No frontend data available</p>
                </Alert>
              )}
            </div>
          )}

          {status.backend && (
            <div>
              <h3 className="font-medium mb-2">Backend Endpoints</h3>
              {status.backend.error ? (
                <Alert variant="error" className="mt-2">
                  <p className="text-sm">{status.backend.error}</p>
                  {status.backend.message && (
                    <p className="text-xs mt-1 text-gray-600">{status.backend.message}</p>
                  )}
                </Alert>
              ) : status.backend.message ? (
                <Alert variant="info" className="mt-2">
                  <p className="text-sm">{status.backend.message}</p>
                </Alert>
              ) : status.backend.registered !== undefined ? (
                <div className="space-y-1 text-sm" role="list">
                  <div className="flex justify-between" role="listitem">
                    <span>✅ Registered:</span>
                    <Badge variant="success">{status.backend.registered}</Badge>
                  </div>
                  <div className="flex justify-between" role="listitem">
                    <span>❌ Unregistered:</span>
                    <Badge variant={status.backend.unregistered > 0 ? 'error' : 'success'}>
                      {status.backend.unregistered}
                    </Badge>
                  </div>
                  {status.backend.totalEndpoints !== undefined && (
                    <div className="flex justify-between" role="listitem">
                      <span>📊 Total Endpoints:</span>
                      <span className="font-medium">{status.backend.totalEndpoints}</span>
                    </div>
                  )}
                </div>
              ) : (
                <Alert variant="info" className="mt-2">
                  <p className="text-sm">No backend data available</p>
                </Alert>
              )}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
