'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api/client';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Button, Card, Alert, Badge } from '@/components/ui';
import { getErrorMessage } from '@/lib/errors';
import { RefreshCw, CheckCircle, Download, FileText } from 'lucide-react';
import { PageHeader, PageContainer } from '@/components/layout';

interface ConnectionStatus {
  success: boolean;
  frontend?: {
    total: number;
    connected: number;
    partial: number;
    needsIntegration: number;
    static: number;
  };
  backend?: {
    registered: number;
    unregistered: number;
  };
  timestamp?: number;
}

interface CheckResult {
  success: boolean;
  summary?: {
    total?: number;
    connected?: number;
    partial?: number;
    needsIntegration?: number;
    static?: number;
    registered?: number;
    unregistered?: number;
  };
  output?: string;
  reportPath?: string;
  reportContent?: string;
  error?: string;
  message?: string;
  hint?: string;
}

function APIConnectionTestContent() {
  const [status, setStatus] = useState<ConnectionStatus | null>(null);
  const [frontendCheck, setFrontendCheck] = useState<CheckResult | null>(null);
  const [backendCheck, setBackendCheck] = useState<CheckResult | null>(null);
  const [report, setReport] = useState<CheckResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  const [error, setError] = useState('');

  const checkStatus = async () => {
    setIsLoadingStatus(true);
    setError('');

    try {
      const response = await apiClient.get<ConnectionStatus>('/v1/api-connection-check/status');
      setStatus(response.data ?? null);
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err) || 'Failed to check API connection status';
      setError(errorMessage);
    } finally {
      setIsLoadingStatus(false);
    }
  };

  const checkFrontend = async (detailed = false) => {
    setIsLoading(true);
    setError('');
    setFrontendCheck(null);

    try {
      const params = detailed ? { detailed: 'true' } : {};
      const response = await apiClient.get<CheckResult>('/v1/api-connection-check/frontend', { params });
      const data = response.data ?? null;
      setFrontendCheck(data);
      // If the response indicates failure, also set error for visibility
      if (data && !data.success && data.error) {
        setError(data.error);
      }
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err) || 'Failed to check frontend connections';
      setError(errorMessage);
      setFrontendCheck({
        success: false,
        error: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const checkBackend = async () => {
    setIsLoading(true);
    setError('');
    setBackendCheck(null);

    try {
      const response = await apiClient.get<CheckResult>('/v1/api-connection-check/backend');
      const data = response.data ?? null;
      setBackendCheck(data);
      // If the response indicates failure, also set error for visibility
      if (data && !data.success && data.error) {
        setError(data.error);
      }
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err) || 'Failed to check backend endpoints';
      setError(errorMessage);
      setBackendCheck({
        success: false,
        error: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateReport = async () => {
    setIsLoading(true);
    setError('');
    setReport(null);

    try {
      const response = await apiClient.get<CheckResult>('/v1/api-connection-check/report', {
        params: { output_name: `API_CONNECTION_REPORT_${Date.now()}` },
      });
      setReport(response.data ?? null);
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err) || 'Failed to generate report';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Auto-check status on mount
    checkStatus();
  }, []);

  const downloadReport = () => {
    if (report?.reportContent) {
      const blob = new Blob([report.reportContent], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = report.reportPath || 'API_CONNECTION_REPORT.md';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="API Connection Test"
        description="Test and verify API connections between frontend pages and backend endpoints"
      />

      {error && (
        <Alert variant="error" className="mb-6">
          {error}
        </Alert>
      )}

      {/* Quick Status */}
      <Card className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Quick Status</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={checkStatus}
            disabled={isLoadingStatus}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingStatus ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {status && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {status.frontend && (
              <div>
                <h3 className="font-medium mb-2">Frontend Connections</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Total:</span>
                    <span className="font-medium">{status.frontend.total}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>✅ Connected:</span>
                    <Badge variant="success">{status.frontend.connected}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>⚠️ Partial:</span>
                    <Badge variant="warning">{status.frontend.partial}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>❌ Needs Integration:</span>
                    <Badge variant="error">{status.frontend.needsIntegration}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>🟡 Static:</span>
                    <Badge variant="info">{status.frontend.static}</Badge>
                  </div>
                </div>
              </div>
            )}

            {status.backend && (
              <div>
                <h3 className="font-medium mb-2">Backend Endpoints</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>✅ Registered:</span>
                    <Badge variant="success">{status.backend.registered}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>❌ Unregistered:</span>
                    <Badge variant={status.backend.unregistered > 0 ? 'error' : 'success'}>
                      {status.backend.unregistered}
                    </Badge>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Frontend Check */}
      <Card className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Frontend API Connections</h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => checkFrontend(false)}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Check Basic
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => checkFrontend(true)}
              disabled={isLoading}
            >
              <FileText className="h-4 w-4 mr-2" />
              Check Detailed
            </Button>
          </div>
        </div>

        {frontendCheck && (
          <div className="space-y-4">
            {!frontendCheck.success ? (
              <Alert variant="error">
                <div>
                  <p className="font-medium">{frontendCheck.error || 'Check failed'}</p>
                  {frontendCheck.message && <p className="text-sm mt-1">{frontendCheck.message}</p>}
                  {frontendCheck.hint && <p className="text-sm mt-1 text-gray-600">{frontendCheck.hint}</p>}
                </div>
              </Alert>
            ) : frontendCheck.summary && Object.keys(frontendCheck.summary).length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {frontendCheck.summary.total !== undefined && (
                  <div className="text-center">
                    <div className="text-2xl font-bold">{frontendCheck.summary.total}</div>
                    <div className="text-sm text-gray-500">Total Pages</div>
                  </div>
                )}
                {frontendCheck.summary.connected !== undefined && (
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {frontendCheck.summary.connected}
                    </div>
                    <div className="text-sm text-gray-500">✅ Connected</div>
                  </div>
                )}
                {frontendCheck.summary.partial !== undefined && (
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {frontendCheck.summary.partial}
                    </div>
                    <div className="text-sm text-gray-500">⚠️ Partial</div>
                  </div>
                )}
                {frontendCheck.summary.needsIntegration !== undefined && (
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {frontendCheck.summary.needsIntegration}
                    </div>
                    <div className="text-sm text-gray-500">❌ Needs Integration</div>
                  </div>
                )}
                {frontendCheck.summary.static !== undefined && (
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-600">
                      {frontendCheck.summary.static}
                    </div>
                    <div className="text-sm text-gray-500">🟡 Static</div>
                  </div>
                )}
              </div>
            ) : frontendCheck.success ? (
              <Alert variant="info">
                <p>Check completed successfully, but no summary data available.</p>
              </Alert>
            ) : null}

            {frontendCheck.output && (
              <div className="mt-4">
                <h3 className="font-medium mb-2">Detailed Output</h3>
                <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg text-xs overflow-auto max-h-96">
                  {frontendCheck.output}
                </pre>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Backend Check */}
      <Card className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Backend Endpoints</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={checkBackend}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Check Backend
          </Button>
        </div>

        {backendCheck && (
          <div className="space-y-4">
            {!backendCheck.success ? (
              <Alert variant="error">
                <div>
                  <p className="font-medium">{backendCheck.error || 'Check failed'}</p>
                  {backendCheck.message && <p className="text-sm mt-1">{backendCheck.message}</p>}
                  {backendCheck.hint && <p className="text-sm mt-1 text-gray-600">{backendCheck.hint}</p>}
                </div>
              </Alert>
            ) : backendCheck.summary && Object.keys(backendCheck.summary).length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-3xl font-bold text-green-600">
                    {backendCheck.summary.registered}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">✅ Registered Modules</div>
                </div>
                <div className={`text-center p-4 rounded-lg ${
                  (backendCheck.summary.unregistered || 0) > 0
                    ? 'bg-red-50 dark:bg-red-900/20'
                    : 'bg-gray-50 dark:bg-gray-800'
                }`}>
                  <div className={`text-3xl font-bold ${
                    (backendCheck.summary.unregistered || 0) > 0 ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {backendCheck.summary.unregistered || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">❌ Unregistered Modules</div>
                </div>
              </div>
            ) : backendCheck.success ? (
              <Alert variant="info">
                <p>Check completed successfully, but no summary data available.</p>
              </Alert>
            ) : null}

            {backendCheck.output && (
              <div className="mt-4">
                <h3 className="font-medium mb-2">Detailed Output</h3>
                <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg text-xs overflow-auto max-h-96">
                  {backendCheck.output}
                </pre>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Report Generation */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold">Generate Report</h2>
            <p className="text-sm text-gray-500 mt-1">
              Generate a comprehensive markdown report of all API connections
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="primary"
              onClick={generateReport}
              disabled={isLoading}
            >
              <FileText className="h-4 w-4 mr-2" />
              Generate Report
            </Button>
            {report?.reportContent && (
              <Button
                variant="outline"
                onClick={downloadReport}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            )}
          </div>
        </div>

        {report && (
          <div className="space-y-4">
            {report.reportPath && (
              <Alert variant="success">
                <CheckCircle className="h-4 w-4 mr-2" />
                Report generated successfully: {report.reportPath}
              </Alert>
            )}

            {report.reportContent && (
              <div>
                <h3 className="font-medium mb-2">Report Preview</h3>
                <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg max-h-96 overflow-auto">
                  <pre className="text-xs whitespace-pre-wrap">{report.reportContent.substring(0, 2000)}</pre>
                  {report.reportContent.length > 2000 && (
                    <p className="text-xs text-gray-500 mt-2">
                      ... (truncated, use download button for full report)
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </Card>
    </PageContainer>
  );
}

export default function APIConnectionTestPage() {
  return (
    <ProtectedRoute>
      <APIConnectionTestContent />
    </ProtectedRoute>
  );
}

