'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { apiClient } from '@/lib/api/client';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Button, Card, Alert, Badge } from '@/components/ui';
import { getErrorMessage } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { RefreshCw, CheckCircle, Download, FileText, ExternalLink, Eye, XCircle, Loader2, Copy, Check } from 'lucide-react';
import { PageHeader, PageContainer } from '@/components/layout';
import type { ConnectionStatus, EndpointTestResult, CheckResult, TestProgress } from './types/health.types';
import { checkStatus, checkFrontend, checkBackend } from './services/healthChecker';
import { testCriticalEndpoints } from './services/endpointTester';
import { generateCompleteReport, generateReportPath } from './services/reportGenerator';

function APIConnectionTestContent() {
  // Mounted check to prevent memory leaks
  const isMountedRef = useRef(true);
  // AbortController for request cancellation
  const abortControllerRef = useRef<AbortController | null>(null);

  const [status, setStatus] = useState<ConnectionStatus | null>(null);
  const [frontendCheck, setFrontendCheck] = useState<CheckResult | null>(null);
  const [backendCheck, setBackendCheck] = useState<CheckResult | null>(null);
  const [report, setReport] = useState<CheckResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  const [error, setError] = useState('');
  const [endpointTests, setEndpointTests] = useState<EndpointTestResult[]>([]);
  const [isTestingEndpoints, setIsTestingEndpoints] = useState(false);
  const [testProgress, setTestProgress] = useState<TestProgress | null>(null);
  const [copiedTestId, setCopiedTestId] = useState<string | null>(null);
  const [componentTests, setComponentTests] = useState<Array<{ name: string; status: 'pending' | 'success' | 'error'; message?: string }>>([]);
  const [isTestingComponents, setIsTestingComponents] = useState(false);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      // Cancel any pending requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleCheckStatus = async () => {
    // Cancel previous request if any
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new AbortController
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setIsLoadingStatus(true);
    setError('');

    try {
      const data = await checkStatus(signal);
      
      // Check if component is still mounted before updating state
      if (!isMountedRef.current) return;
      
      setStatus(data);
    } catch (err: unknown) {
      // Don't update state if request was aborted or component unmounted
      if (signal.aborted || !isMountedRef.current) return;
      
      const errorMessage = err instanceof Error ? err.message : 'Failed to check API connection status';
      setError(errorMessage);
      setStatus(null);
    } finally {
      if (isMountedRef.current) {
        setIsLoadingStatus(false);
      }
    }
  };

  const handleCheckFrontend = async (detailed = false) => {
    // Cancel previous request if any
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new AbortController
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setIsLoading(true);
    setError('');
    setFrontendCheck(null);

    try {
      const data = await checkFrontend(detailed, signal);
      
      // Check if component is still mounted before updating state
      if (!isMountedRef.current) return;
      
      setFrontendCheck(data);
      // If the response indicates failure, also set error for visibility
      if (data && !data.success && data.error) {
        setError(data.error);
      }
    } catch (err: unknown) {
      // Don't update state if request was aborted or component unmounted
      if (signal.aborted || !isMountedRef.current) return;
      
      const errorMessage = err instanceof Error ? err.message : 'Failed to check frontend connections';
      setError(errorMessage);
      setFrontendCheck({
        success: false,
        error: errorMessage,
      });
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  const handleCheckBackend = async () => {
    // Cancel previous request if any
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new AbortController
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setIsLoading(true);
    setError('');
    setBackendCheck(null);

    try {
      const data = await checkBackend(signal);
      
      // Check if component is still mounted before updating state
      if (!isMountedRef.current) return;
      
      setBackendCheck(data);
      // If the response indicates failure, also set error for visibility
      if (data && !data.success && data.error) {
        setError(data.error);
      }
    } catch (err: unknown) {
      // Don't update state if request was aborted or component unmounted
      if (signal.aborted || !isMountedRef.current) return;
      
      const errorMessage = err instanceof Error ? err.message : 'Failed to check backend endpoints';
      setError(errorMessage);
      setBackendCheck({
        success: false,
        error: errorMessage,
      });
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  };


  const handleTestCriticalEndpoints = async () => {
    // Cancel previous request if any
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new AbortController
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setIsTestingEndpoints(true);
    setError('');
    setEndpointTests([]);
    setTestProgress(null);

    try {
      const results = await testCriticalEndpoints(
        signal,
        (updatedResults) => {
          // Check if component is still mounted before updating state
          if (isMountedRef.current) {
            setEndpointTests([...updatedResults]);
          }
        },
        (progress) => {
          // Update progress indicator
          if (isMountedRef.current) {
            setTestProgress(progress);
          }
        }
      );
      
      // Check if component is still mounted before updating state
      if (!isMountedRef.current) return;
      
      setEndpointTests(results);
    } catch (err: unknown) {
      // Don't update state if request was aborted or component unmounted
      if (signal.aborted || !isMountedRef.current) return;
      
      const errorMessage = err instanceof Error ? err.message : 'Failed to test endpoints';
      setError(errorMessage);
    } finally {
      if (isMountedRef.current) {
        setIsTestingEndpoints(false);
        // Keep progress visible even after completion
      }
    }
  };


  const copyTestResult = useCallback(async (test: EndpointTestResult) => {
    const testText = `${test.method} ${test.endpoint}\nStatus: ${test.status}\n${test.message ? `Message: ${test.message}` : ''}${test.responseTime ? `\nResponse Time: ${test.responseTime}ms` : ''}`;
    try {
      await navigator.clipboard.writeText(testText);
      const testId = `${test.endpoint}-${test.method}`;
      setCopiedTestId(testId);
      setTimeout(() => setCopiedTestId(null), 2000);
    } catch (err) {
      logger.error('Failed to copy test result', { error: err });
    }
  }, []);

  const testFrontendComponents = async () => {
    setIsTestingComponents(true);
    setComponentTests([]);

    const tests = [
      { name: 'API Client - Token Refresh', test: async () => {
        try {
          await apiClient.get('/v1/auth/me');
          return { status: 'success' as const, message: 'Token refresh working' };
        } catch (err) {
          return { status: 'error' as const, message: getErrorMessage(err) };
        }
      }},
      { name: 'API Client - Error Handling', test: async () => {
        try {
          await apiClient.get('/v1/nonexistent-endpoint-12345');
          return { status: 'error' as const, message: 'Should have failed' };
        } catch (err) {
          const errorMsg = getErrorMessage(err);
          if (errorMsg.includes('404') || errorMsg.includes('not found')) {
            return { status: 'success' as const, message: 'Error handling working correctly' };
          }
          return { status: 'success' as const, message: 'Error caught: ' + errorMsg.substring(0, 50) };
        }
      }},
      { name: 'API Client - GET Request', test: async () => {
        try {
          await apiClient.get('/v1/health/health');
          return { status: 'success' as const, message: 'GET request successful' };
        } catch (err) {
          return { status: 'error' as const, message: getErrorMessage(err) };
        }
      }},
      { name: 'API Client - POST Request', test: async () => {
        try {
          await apiClient.post('/v1/media/validate', { name: 'test.jpg', size: 1024, type: 'image/jpeg' });
          return { status: 'success' as const, message: 'POST request successful' };
        } catch (err) {
          const errorMsg = getErrorMessage(err);
          if (errorMsg.includes('422') || errorMsg.includes('400') || errorMsg.includes('validation')) {
            return { status: 'success' as const, message: 'POST endpoint exists (validation error expected)' };
          }
          return { status: 'error' as const, message: errorMsg };
        }
      }},
    ];

    const results: Array<{ name: string; status: 'pending' | 'success' | 'error'; message?: string }> = [];
    for (const { name, test } of tests) {
      const result: { name: string; status: 'pending' | 'success' | 'error'; message?: string } = { name, status: 'pending', message: undefined };
      results.push(result);
      setComponentTests([...results]);

      try {
        const testResult = await test();
        result.status = testResult.status;
        result.message = testResult.message;
      } catch (err) {
        result.status = 'error';
        result.message = getErrorMessage(err);
      }

      results[results.length - 1] = result;
      setComponentTests([...results]);
    }

    setIsTestingComponents(false);
  };

  const generateCompleteReport = async () => {
    setIsLoading(true);
    setError('');
    setReport(null);

    try {
      const reportData: string[] = [];
      reportData.push('# API Connection Test Report\n');
      reportData.push(`Generated: ${new Date().toISOString()}\n`);
      reportData.push('---\n\n');

      if (status) {
        reportData.push('## Quick Status\n\n');
        if (status.frontend) {
          reportData.push('### Frontend Connections\n');
          if (status.frontend.total !== undefined) {
            reportData.push(`- Total: ${status.frontend.total}\n`);
            reportData.push(`- Connected: ${status.frontend.connected}\n`);
            reportData.push(`- Partial: ${status.frontend.partial}\n`);
            reportData.push(`- Needs Integration: ${status.frontend.needsIntegration}\n`);
            reportData.push(`- Static: ${status.frontend.static}\n`);
          } else {
            reportData.push(`- Status: ${status.frontend.message || 'No data available'}\n`);
          }
          reportData.push('\n');
        }
        if (status.backend) {
          reportData.push('### Backend Endpoints\n');
          reportData.push(`- Registered: ${status.backend.registered}\n`);
          reportData.push(`- Unregistered: ${status.backend.unregistered}\n`);
          if (status.backend.totalEndpoints !== undefined) {
            reportData.push(`- Total Endpoints: ${status.backend.totalEndpoints}\n`);
          }
          reportData.push('\n');
        }
      }

      if (frontendCheck) {
        reportData.push('## Frontend API Connections Check\n\n');
        if (frontendCheck.summary) {
          reportData.push('### Summary\n');
          Object.entries(frontendCheck.summary).forEach(([key, value]) => {
            reportData.push(`- ${key}: ${String(value)}\n`);
          });
          reportData.push('\n');
        }
        if (frontendCheck.output) {
          reportData.push('### Detailed Output\n\n```\n');
          reportData.push(frontendCheck.output);
          reportData.push('\n```\n\n');
        }
      }

      if (backendCheck) {
        reportData.push('## Backend Endpoints Check\n\n');
        if (backendCheck.summary) {
          reportData.push('### Summary\n');
          Object.entries(backendCheck.summary).forEach(([key, value]) => {
            reportData.push(`- ${key}: ${value}\n`);
          });
          reportData.push('\n');
        }
        if (backendCheck.output) {
          reportData.push('### Detailed Output\n\n```\n');
          reportData.push(backendCheck.output);
          reportData.push('\n```\n\n');
        }
      }

      if (endpointTests.length > 0) {
        reportData.push('## Critical Endpoints Test Results\n\n');
        reportData.push(`Total Tests: ${endpointTests.length}\n`);
        reportData.push(`Success: ${endpointTests.filter(t => t.status === 'success').length}\n`);
        reportData.push(`Errors: ${endpointTests.filter(t => t.status === 'error').length}\n`);
        reportData.push(`Pending: ${endpointTests.filter(t => t.status === 'pending').length}\n\n`);

        const categories = Array.from(new Set(endpointTests.map(t => t.category).filter(Boolean)));
        categories.forEach(category => {
          reportData.push(`### ${category}\n\n`);
          const categoryTests = endpointTests.filter(t => t.category === category);
          reportData.push('| Method | Endpoint | Status | Message | Response Time |\n');
          reportData.push('|--------|----------|--------|---------|---------------|\n');
          categoryTests.forEach(test => {
            reportData.push(`| ${test.method} | ${test.endpoint} | ${test.status} | ${test.message || '-'} | ${test.responseTime ? test.responseTime + 'ms' : '-'} |\n`);
          });
          reportData.push('\n');
        });

        const uncategorizedTests = endpointTests.filter(t => !t.category);
        if (uncategorizedTests.length > 0) {
          reportData.push('### Other\n\n');
          reportData.push('| Method | Endpoint | Status | Message | Response Time |\n');
          reportData.push('|--------|----------|--------|---------|---------------|\n');
          uncategorizedTests.forEach(test => {
            reportData.push(`| ${test.method} | ${test.endpoint} | ${test.status} | ${test.message || '-'} | ${test.responseTime ? test.responseTime + 'ms' : '-'} |\n`);
          });
          reportData.push('\n');
        }
      }

      if (componentTests.length > 0) {
        reportData.push('## Frontend Components & Hooks Test Results\n\n');
        reportData.push('| Test Name | Status | Message |\n');
        reportData.push('|-----------|--------|---------|\n');
        componentTests.forEach(test => {
          reportData.push(`| ${test.name} | ${test.status} | ${test.message || '-'} |\n`);
        });
        reportData.push('\n');
      }

      reportData.push('---\n\n');
      reportData.push('*Report generated by API Connection Test Page*\n');

      const reportContent = reportData.join('');
      
      setReport({
        success: true,
        reportContent,
        reportPath: `API_CONNECTION_REPORT_${Date.now()}.md`,
      });
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err) || 'Failed to generate report';
      setError(errorMessage);
      setReport({
        success: false,
        error: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Auto-check status on mount (only on client)
    if (typeof window !== 'undefined') {
      handleCheckStatus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const openReportInNewTab = () => {
    if (report?.reportContent) {
      // Create HTML from markdown
      const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>API Connection Report</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      background: #fff;
      color: #333;
    }
    pre {
      background: #f5f5f5;
      padding: 15px;
      border-radius: 5px;
      overflow-x: auto;
      border: 1px solid #ddd;
    }
    code {
      background: #f5f5f5;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: 'Courier New', monospace;
    }
    pre code {
      background: none;
      padding: 0;
    }
    h1, h2, h3, h4, h5, h6 {
      margin-top: 24px;
      margin-bottom: 16px;
      font-weight: 600;
      line-height: 1.25;
    }
    h1 { font-size: 2em; border-bottom: 1px solid #eaecef; padding-bottom: 10px; }
    h2 { font-size: 1.5em; border-bottom: 1px solid #eaecef; padding-bottom: 8px; }
    h3 { font-size: 1.25em; }
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 16px 0;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 8px 12px;
      text-align: left;
    }
    th {
      background-color: #f5f5f5;
      font-weight: 600;
    }
    tr:nth-child(even) {
      background-color: #f9f9f9;
    }
    ul, ol {
      padding-left: 30px;
    }
    blockquote {
      border-left: 4px solid #ddd;
      padding-left: 16px;
      margin: 16px 0;
      color: #666;
    }
    .markdown-body {
      box-sizing: border-box;
      min-width: 200px;
      max-width: 980px;
      margin: 0 auto;
      padding: 45px;
    }
    @media (max-width: 767px) {
      .markdown-body {
        padding: 15px;
      }
    }
  </style>
</head>
<body>
  <div class="markdown-body">
    <pre>${report.reportContent.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
  </div>
</body>
</html>`;
      
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      // Clean up after a delay
      setTimeout(() => URL.revokeObjectURL(url), 100);
    }
  };

  const openReportAsMarkdown = () => {
    if (report?.reportContent) {
      const blob = new Blob([report.reportContent], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      // Clean up after a delay
      setTimeout(() => URL.revokeObjectURL(url), 100);
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
            onClick={handleCheckStatus}
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
                {status.frontend.error ? (
                  <Alert variant="warning" className="mt-2">
                    <p className="text-sm">{status.frontend.error}</p>
                    {status.frontend.message && <p className="text-xs mt-1 text-gray-600">{status.frontend.message}</p>}
                  </Alert>
                ) : status.frontend.message ? (
                  <Alert variant="info" className="mt-2">
                    <p className="text-sm">{status.frontend.message}</p>
                    {status.frontend.note && <p className="text-xs mt-1 text-gray-600">{status.frontend.note}</p>}
                    <div className="mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCheckFrontend(false)}
                        disabled={isLoading}
                      >
                        <RefreshCw className={`h-3 w-3 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                        Check Frontend
                      </Button>
                    </div>
                  </Alert>
                ) : status.frontend.total !== undefined ? (
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
                    {status.backend.message && <p className="text-xs mt-1 text-gray-600">{status.backend.message}</p>}
                  </Alert>
                ) : status.backend.message ? (
                  <Alert variant="info" className="mt-2">
                    <p className="text-sm">{status.backend.message}</p>
                  </Alert>
                ) : status.backend.registered !== undefined ? (
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
                    {status.backend.totalEndpoints !== undefined && (
                      <div className="flex justify-between">
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

      {/* Frontend Check */}
      <Card className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Frontend API Connections</h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleCheckFrontend(false)}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Check Basic
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleCheckFrontend(true)}
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
            onClick={handleCheckBackend}
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
                  {backendCheck.hint && (
                    <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-200">💡 Hint:</p>
                      <p className="text-sm text-blue-800 dark:text-blue-300 mt-1">{backendCheck.hint}</p>
                    </div>
                  )}
                </div>
              </Alert>
            ) : backendCheck.summary && Object.keys(backendCheck.summary).length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {backendCheck.summary.totalEndpoints !== undefined && (
                    <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                        {backendCheck.summary.totalEndpoints}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Total Endpoints</div>
                    </div>
                  )}
                  <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                      {backendCheck.summary.registered}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">✅ Registered Modules</div>
                    {backendCheck.summary.registered !== undefined && backendCheck.summary.unregistered !== undefined && (
                      <div className="text-xs text-gray-500 mt-1">
                        {Math.round((backendCheck.summary.registered / (backendCheck.summary.registered + backendCheck.summary.unregistered)) * 100)}% coverage
                      </div>
                    )}
                  </div>
                  <div className={`text-center p-4 rounded-lg border ${
                    (backendCheck.summary.unregistered || 0) > 0
                      ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                      : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                  }`}>
                    <div className={`text-3xl font-bold ${
                      (backendCheck.summary.unregistered || 0) > 0 
                        ? 'text-red-600 dark:text-red-400' 
                        : 'text-gray-600 dark:text-gray-400'
                    }`}>
                      {backendCheck.summary.unregistered || 0}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">❌ Unregistered Modules</div>
                    {backendCheck.summary.registered !== undefined && backendCheck.summary.unregistered !== undefined && (backendCheck.summary.unregistered || 0) > 0 && (
                      <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                        {Math.round((backendCheck.summary.unregistered / (backendCheck.summary.registered + backendCheck.summary.unregistered)) * 100)}% missing
                      </div>
                    )}
                  </div>
                </div>
                
                {(backendCheck.summary.unregistered || 0) > 0 && (
                  <Alert variant="error" className="mt-4">
                    <p className="font-medium">
                      {backendCheck.summary.unregistered} module{(backendCheck.summary.unregistered || 0) > 1 ? 's' : ''} not registered
                    </p>
                    <p className="text-sm mt-1">
                      Some backend modules are not registered in the API router. Check the detailed output below to see which modules need to be added to <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">backend/app/api/v1/router.py</code>.
                    </p>
                  </Alert>
                )}
                
                {(backendCheck.summary.unregistered || 0) === 0 && backendCheck.summary.registered !== undefined && backendCheck.summary.registered > 0 && (
                  <Alert variant="success" className="mt-4">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    <p className="font-medium">All modules are properly registered!</p>
                    <p className="text-sm mt-1">
                      All {backendCheck.summary.registered} backend module{backendCheck.summary.registered > 1 ? 's' : ''} {backendCheck.summary.registered > 1 ? 'are' : 'is'} registered in the API router.
                    </p>
                  </Alert>
                )}
              </>
            ) : backendCheck.success ? (
              <Alert variant="info">
                <p>Check completed successfully, but no summary data available.</p>
                {backendCheck.message && <p className="text-sm mt-1">{backendCheck.message}</p>}
              </Alert>
            ) : null}

            {backendCheck.output && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">Detailed Output</h3>
                  <Badge variant="info">{backendCheck.output.length} characters</Badge>
                </div>
                <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg text-xs overflow-auto max-h-96 border border-gray-200 dark:border-gray-700">
                  {backendCheck.output}
                </pre>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Critical Endpoints Test */}
      <Card className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1">
            <h2 className="text-xl font-semibold">Critical Endpoints Test</h2>
            <p className="text-sm text-gray-500 mt-1">
              Test all critical endpoints that were created/fixed in the API alignment batches
            </p>
            {testProgress && (
              <div className="mt-3">
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    Progress: {testProgress.completed}/{testProgress.total} ({testProgress.percentage}%)
                  </span>
                  <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 max-w-md">
                    <div
                      className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${testProgress.percentage}%` }}
                    />
                  </div>
                  <span className="text-green-600 dark:text-green-400">✓ {testProgress.success}</span>
                  <span className="text-red-600 dark:text-red-400">✗ {testProgress.error}</span>
                  {testProgress.pending > 0 && (
                    <span className="text-gray-400">⏳ {testProgress.pending}</span>
                  )}
                </div>
              </div>
            )}
          </div>
          <Button
            variant="primary"
            onClick={handleTestCriticalEndpoints}
            disabled={isTestingEndpoints}
            className="ml-4"
          >
            {isTestingEndpoints ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Test All Endpoints
              </>
            )}
          </Button>
        </div>

        {endpointTests.length > 0 && (
          <div className="space-y-4">
            {/* Group by category */}
            {Array.from(new Set(endpointTests.map(t => t.category).filter(Boolean))).map(category => {
              const categoryTests = endpointTests.filter(t => t.category === category);
              const successCount = categoryTests.filter(t => t.status === 'success').length;
              const errorCount = categoryTests.filter(t => t.status === 'error').length;
              const pendingCount = categoryTests.filter(t => t.status === 'pending').length;
              
              return (
                <div key={category} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{category}</h3>
                    <div className="flex gap-4 text-sm">
                      <span className="text-green-600">✓ {successCount}</span>
                      <span className="text-red-600">✗ {errorCount}</span>
                      {pendingCount > 0 && <span className="text-gray-400">⏳ {pendingCount}</span>}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {categoryTests.map((test, index) => {
                      const testId = `${test.endpoint}-${test.method}`;
                      const isCopied = copiedTestId === testId;
                      return (
                        <div
                          key={`${category}-${index}`}
                          className={`p-3 rounded-lg border ${
                            test.status === 'success'
                              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                              : test.status === 'error'
                              ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                              : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                {test.status === 'success' ? (
                                  <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                                ) : test.status === 'error' ? (
                                  <XCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                                ) : (
                                  <Loader2 className="h-4 w-4 text-gray-400 animate-spin flex-shrink-0" />
                                )}
                                <span className="font-mono text-xs font-medium truncate">
                                  {test.method} {test.endpoint}
                                </span>
                              </div>
                              {test.message && (
                                <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                                  {test.message}
                                </p>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyTestResult(test)}
                              className="flex-shrink-0 h-6 w-6 p-0"
                              title="Copy test result"
                            >
                              {isCopied ? (
                                <Check className="h-3 w-3 text-green-600" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            
            {/* Tests without category - memoized */}
            {useMemo(() => endpointTests.filter(t => !t.category), [endpointTests]).length > 0 && (
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Other</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {useMemo(() => endpointTests.filter(t => !t.category), [endpointTests]).map((test, index) => {
                    const testId = `${test.endpoint}-${test.method}`;
                    const isCopied = copiedTestId === testId;
                    return (
                      <div
                        key={`other-${index}`}
                        className={`p-3 rounded-lg border ${
                          test.status === 'success'
                            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                            : test.status === 'error'
                            ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                            : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              {test.status === 'success' ? (
                                <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                              ) : test.status === 'error' ? (
                                <XCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                              ) : (
                                <Loader2 className="h-4 w-4 text-gray-400 animate-spin flex-shrink-0" />
                              )}
                              <span className="font-mono text-xs font-medium truncate">
                                {test.method} {test.endpoint}
                              </span>
                            </div>
                            {test.message && (
                              <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                                {test.message}
                              </p>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyTestResult(test)}
                            className="flex-shrink-0 h-6 w-6 p-0"
                            title="Copy test result"
                          >
                            {isCopied ? (
                              <Check className="h-3 w-3 text-green-600" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {useMemo(() => {
              const successCount = endpointTests.filter(t => t.status === 'success').length;
              const errorCount = endpointTests.filter(t => t.status === 'error').length;
              const pendingCount = endpointTests.filter(t => t.status === 'pending').length;
              const testsWithResponseTime = endpointTests.filter(t => t.responseTime);
              const avgResponseTime = testsWithResponseTime.length > 0
                ? Math.round(
                    testsWithResponseTime.reduce((sum, t) => sum + (t.responseTime || 0), 0) /
                    testsWithResponseTime.length
                  )
                : null;

              return (
                <div className="mt-4 flex gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Success: {successCount}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-600" />
                    <span>Errors: {errorCount}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 text-gray-400" />
                    <span>Pending: {pendingCount}</span>
                  </div>
                  {avgResponseTime !== null && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600 dark:text-gray-400">
                        Avg Response: {avgResponseTime}ms
                      </span>
                    </div>
                  )}
                </div>
              );
            }, [endpointTests])}
          </div>
        )}

        {endpointTests.length === 0 && !isTestingEndpoints && (
          <Alert variant="info">
            <p>Click "Test All Endpoints" to test all critical endpoints that were created or fixed.</p>
          </Alert>
        )}
      </Card>

      {/* Frontend Components & Hooks Test */}
      <Card className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold">Frontend Components & Hooks Test</h2>
            <p className="text-sm text-gray-500 mt-1">
              Test critical React hooks, services, and API client functionality
            </p>
          </div>
          <Button
            variant="primary"
            onClick={testFrontendComponents}
            disabled={isTestingComponents}
          >
            {isTestingComponents ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Run Tests
              </>
            )}
          </Button>
        </div>

        <div className="space-y-4">
          {componentTests.length > 0 ? (
            <div className="space-y-2">
              {componentTests.map((test, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${
                    test.status === 'success'
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                      : test.status === 'error'
                      ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                      : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {test.status === 'success' ? (
                          <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                        ) : test.status === 'error' ? (
                          <XCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                        ) : (
                          <Loader2 className="h-4 w-4 text-gray-400 animate-spin flex-shrink-0" />
                        )}
                        <span className="font-semibold">{test.name}</span>
                      </div>
                      {test.message && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {test.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              <Alert variant="info">
                <div>
                  <p className="font-medium mb-2">Available Tests:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li><strong>API Client - Token Refresh:</strong> Tests automatic token refresh mechanism</li>
                    <li><strong>API Client - Error Handling:</strong> Tests error handling and parsing</li>
                    <li><strong>API Client - GET Request:</strong> Tests GET request functionality</li>
                    <li><strong>API Client - POST Request:</strong> Tests POST request functionality</li>
                  </ul>
                  <p className="text-sm mt-2 text-gray-600 dark:text-gray-400">
                    💡 <strong>Note:</strong> Click "Run Tests" to execute these tests. For comprehensive testing, use the test suite: <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">pnpm test</code>
                  </p>
                </div>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2">API Client</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Core API client with automatic token refresh and error handling
                  </p>
                  <Badge variant="info">Click "Run Tests" to test</Badge>
                </div>

                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2">Error Handling</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    API error parsing and user-friendly messages
                  </p>
                  <Badge variant="info">Click "Run Tests" to test</Badge>
                </div>
              </div>
            </>
          )}

          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">
              📋 Component Testing Recommendations:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-blue-800 dark:text-blue-300">
              <li>Run unit tests: <code className="text-xs bg-blue-100 dark:bg-blue-900 px-1 py-0.5 rounded">pnpm test</code></li>
              <li>Run integration tests: <code className="text-xs bg-blue-100 dark:bg-blue-900 px-1 py-0.5 rounded">pnpm test:integration</code></li>
              <li>Test components manually in development environment</li>
              <li>Use React DevTools to inspect hook states and API calls</li>
              <li>Monitor Network tab for API request/response validation</li>
            </ul>
          </div>
        </div>
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
              onClick={handleGenerateCompleteReport}
              disabled={isLoading}
            >
              <FileText className="h-4 w-4 mr-2" />
              {isLoading ? 'Generating...' : 'Generate Complete Report'}
            </Button>
            {report?.reportContent && (
              <>
                <Button
                  variant="outline"
                  onClick={openReportInNewTab}
                  title="Open report in new tab (HTML)"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View
                </Button>
                <Button
                  variant="outline"
                  onClick={openReportAsMarkdown}
                  title="Open report as Markdown in new tab"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open MD
                </Button>
                <Button
                  variant="outline"
                  onClick={downloadReport}
                  title="Download report as file"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </>
            )}
          </div>
        </div>

        {report && (
          <div className="space-y-4">
            {!report.success && report.error ? (
              <Alert variant="error">
                <div>
                  <p className="font-medium">{report.error || 'Report generation failed'}</p>
                  {report.message && <p className="text-sm mt-1">{report.message}</p>}
                  {report.hint && <p className="text-sm mt-1 text-gray-600">{report.hint}</p>}
                </div>
              </Alert>
            ) : (
              <>
                {report.reportPath && (
                  <Alert variant="success">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Report generated successfully: {report.reportPath}
                  </Alert>
                )}

                {report.reportContent && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium mb-2">Report Preview</h3>
                      <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg max-h-96 overflow-auto">
                        <pre className="text-xs whitespace-pre-wrap font-mono">
                          {report.reportContent.substring(0, 3000)}
                        </pre>
                        {report.reportContent.length > 3000 && (
                          <p className="text-xs text-gray-500 mt-2">
                            ... (truncated, use "View" or "Download" button for full report)
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 text-sm text-gray-600">
                      <span>📄 Report length: {report.reportContent.length.toLocaleString()} characters</span>
                      {report.reportPath && <span>• Path: {report.reportPath}</span>}
                    </div>
                  </div>
                )}
              </>
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

