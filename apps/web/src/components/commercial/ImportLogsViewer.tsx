'use client';

import { useEffect, useState, useRef } from 'react';
import { Card } from '@/components/ui';
import { CheckCircle2, XCircle, AlertCircle, Info, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { getApiUrl } from '@/lib/api';
import { TokenStorage } from '@/lib/auth/tokenStorage';

interface LogEntry {
  timestamp: string;
  level: 'info' | 'success' | 'warning' | 'error';
  message: string;
  data?: Record<string, any>;
}

interface ImportStatus {
  status: 'started' | 'processing' | 'completed' | 'failed';
  progress?: number;
  total?: number;
  created_at?: string;
  updated_at?: string;
}

interface ImportLogsViewerProps {
  importId: string;
  onComplete?: () => void;
}

export default function ImportLogsViewer({ importId, onComplete }: ImportLogsViewerProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [status, setStatus] = useState<ImportStatus | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!importId) return;

    // Get API URL dynamically
    const apiUrl = getApiUrl().replace(/\/$/, '');
    // Try réseau endpoint first, fallback to commercial
    const sseUrl = `${apiUrl}/api/v1/reseau/contacts/import/${importId}/logs`;
    
    // Add authentication token to URL if available (EventSource doesn't support custom headers)
    const token = TokenStorage.getToken();
    const urlWithAuth = token ? `${sseUrl}?token=${encodeURIComponent(token)}` : sseUrl;

    // Create EventSource for SSE
    const eventSource = new EventSource(urlWithAuth);

    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setIsConnected(true);
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // Handle different message types
        if (data.type === 'status') {
          setStatus(data.data);
        } else if (data.type === 'done') {
          setIsConnected(false);
          eventSource.close();
          onComplete?.();
        } else {
          // Regular log entry
          setLogs((prev) => [...prev, data]);
        }
      } catch (e) {
        console.error('Error parsing SSE message:', e);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE error:', error);
      setIsConnected(false);
      eventSource.close();
    };

    return () => {
      eventSource.close();
      eventSourceRef.current = null;
    };
  }, [importId, onComplete]);

  const getLogIcon = (level: string) => {
    switch (level) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default:
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const getLogColor = (level: string) => {
    switch (level) {
      case 'success':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default:
        return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  const progressPercentage = status?.total && status?.progress
    ? Math.round((status.progress / status.total) * 100)
    : 0;

  return (
    <Card className="p-4">
      <div className="space-y-4">
        {/* Status Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isConnected ? (
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
            ) : (
              <div className={clsx(
                "w-2 h-2 rounded-full",
                status?.status === 'completed' ? "bg-green-500" :
                status?.status === 'failed' ? "bg-red-500" :
                "bg-gray-400"
              )} />
            )}
            <span className="font-medium">
              {status?.status === 'completed' ? 'Import terminé' :
               status?.status === 'failed' ? 'Import échoué' :
               status?.status === 'processing' ? 'Import en cours...' :
               'Import démarré'}
            </span>
          </div>
          {status?.total && (
            <span className="text-sm text-muted-foreground">
              {status.progress || 0} / {status.total}
            </span>
          )}
        </div>

        {/* Progress Bar */}
        {status?.total && status?.progress !== undefined && (
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        )}

        {/* Logs Container */}
        <div className="max-h-96 overflow-y-auto space-y-2 border rounded-lg p-3 bg-background">
          {logs.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              En attente des logs...
            </div>
          ) : (
            logs.map((log, index) => (
              <div
                key={index}
                className={clsx(
                  "flex items-start gap-2 p-2 rounded border text-sm",
                  getLogColor(log.level)
                )}
              >
                {getLogIcon(log.level)}
                <div className="flex-1">
                  <div className="font-medium">{log.message}</div>
                  {log.data && Object.keys(log.data).length > 0 && (
                    <div className="text-xs mt-1 opacity-75">
                      {JSON.stringify(log.data, null, 2)}
                    </div>
                  )}
                </div>
                <div className="text-xs opacity-50">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Card>
  );
}
