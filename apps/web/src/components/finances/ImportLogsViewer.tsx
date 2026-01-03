'use client';

import { useEffect, useState } from 'react';
import type { LogEntry } from '@/lib/monitoring/types';
import { logStore } from '@/lib/monitoring/logs';
import { Badge } from '@/components/ui';
import { CheckCircle2, XCircle, AlertCircle, Info } from 'lucide-react';

export default function ImportLogsViewer() {
  const [logs, setLogs] = useState<LogEntry[]>([]);

  useEffect(() => {
    const updateLogs = () => {
      const filtered = logStore.getLogs({
        service: 'import-transactions',
        limit: 50,
      });
      setLogs(filtered);
    };

    updateLogs();
    const interval = setInterval(updateLogs, 1000); // Update every 1s

    return () => clearInterval(interval);
  }, []);

  const getLogIcon = (level: LogEntry['level']) => {
    switch (level) {
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'warn':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'info':
        return <Info className="w-4 h-4 text-blue-500" />;
      default:
        return <Info className="w-4 h-4 text-gray-500" />;
    }
  };

  const getLevelColor = (level: LogEntry['level']): 'error' | 'warning' | 'info' | 'default' => {
    switch (level) {
      case 'error':
        return 'error';
      case 'warn':
        return 'warning';
      case 'info':
        return 'info';
      default:
        return 'default';
    }
  };

  return (
    <div className="space-y-2 max-h-96 overflow-y-auto">
      {logs.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
          Aucun log d'import pour le moment
        </div>
      ) : (
        logs.map((log) => (
          <div
            key={log.id}
            className="p-2 bg-white dark:bg-gray-800 rounded-lg text-sm border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-start gap-2">
              {getLogIcon(log.level)}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant={getLevelColor(log.level)} className="text-xs">
                    {log.level}
                  </Badge>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div className="text-gray-900 dark:text-gray-100 text-xs">{log.message}</div>
                {log.context && Object.keys(log.context).length > 0 && (
                  <div className="mt-1 text-xs text-gray-600 dark:text-gray-400 font-mono">
                    {JSON.stringify(log.context, null, 2)}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
