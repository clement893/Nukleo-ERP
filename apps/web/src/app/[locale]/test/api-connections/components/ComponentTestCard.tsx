/**
 * ComponentTestCard Component
 * Displays frontend components and hooks test results
 */

import { Button, Card, Alert } from '@/components/ui';
import { RefreshCw, Loader2, CheckCircle, XCircle } from 'lucide-react';
import type { ComponentTestResult } from '../types/health.types';

interface ComponentTestCardProps {
  componentTests: ComponentTestResult[];
  isTestingComponents: boolean;
  onTest: () => void;
}

export function ComponentTestCard({
  componentTests,
  isTestingComponents,
  onTest,
}: ComponentTestCardProps) {
  return (
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
          onClick={onTest}
          disabled={isTestingComponents}
          aria-label="Run frontend components tests"
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
          <div className="space-y-2" role="list">
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
                role="listitem"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {test.status === 'success' ? (
                        <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" aria-hidden="true" />
                      ) : test.status === 'error' ? (
                        <XCircle className="h-4 w-4 text-red-600 flex-shrink-0" aria-hidden="true" />
                      ) : (
                        <Loader2 className="h-4 w-4 text-gray-400 animate-spin flex-shrink-0" aria-hidden="true" />
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
          <Alert variant="info">
            <div>
              <p className="font-medium mb-2">Available Tests:</p>
              <ul className="list-disc list-inside space-y-1 text-sm" role="list">
                <li role="listitem">
                  <strong>API Client - Token Refresh:</strong> Tests automatic token refresh mechanism
                </li>
                <li role="listitem">
                  <strong>API Client - Error Handling:</strong> Tests error handling and parsing
                </li>
                <li role="listitem">
                  <strong>API Client - GET Request:</strong> Tests GET request functionality
                </li>
                <li role="listitem">
                  <strong>API Client - POST Request:</strong> Tests POST request functionality
                </li>
              </ul>
              <p className="text-sm mt-2 text-gray-600 dark:text-gray-400">
                💡 <strong>Note:</strong> Click "Run Tests" to execute these tests. For comprehensive testing, use the test suite: <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">pnpm test</code>
              </p>
            </div>
          </Alert>
        )}
      </div>
    </Card>
  );
}
