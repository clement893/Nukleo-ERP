'use client';

import { useState } from 'react';
import { emailAPI } from '@/lib/api';

export default function EmailTestPage() {
  const [toEmail, setToEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [htmlContent, setHtmlContent] = useState('');
  const [textContent, setTextContent] = useState('');
  const [emailType, setEmailType] = useState<'test' | 'welcome' | 'custom'>('test');
  const [response, setResponse] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [healthStatus, setHealthStatus] = useState<any>(null);

  const checkHealth = async () => {
    try {
      const res = await emailAPI.health();
      setHealthStatus(res.data);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to check health');
      setHealthStatus(null);
    }
  };

  const sendTestEmail = async () => {
    if (!toEmail.trim()) {
      setError('Please enter an email address');
      return;
    }

    setIsLoading(true);
    setError('');
    setResponse(null);

    try {
      const res = await emailAPI.sendTest(toEmail);
      setResponse(res.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to send email');
    } finally {
      setIsLoading(false);
    }
  };

  const sendWelcomeEmail = async () => {
    if (!toEmail.trim()) {
      setError('Please enter an email address');
      return;
    }

    setIsLoading(true);
    setError('');
    setResponse(null);

    try {
      const res = await emailAPI.sendWelcome(toEmail);
      setResponse(res.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to send email');
    } finally {
      setIsLoading(false);
    }
  };

  const sendCustomEmail = async () => {
    if (!toEmail.trim() || !subject.trim() || !htmlContent.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    setError('');
    setResponse(null);

    try {
      const res = await emailAPI.sendCustom({
        to_email: toEmail,
        subject,
        html_content: htmlContent,
        text_content: textContent || undefined,
      });
      setResponse(res.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to send email');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = () => {
    if (emailType === 'test') {
      sendTestEmail();
    } else if (emailType === 'welcome') {
      sendWelcomeEmail();
    } else {
      sendCustomEmail();
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Email Test Interface (SendGrid)</h1>
          
          {/* Health Check */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold">SendGrid Health Check</h2>
              <button
                onClick={checkHealth}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Check Status
              </button>
            </div>
            {healthStatus && (
              <div className="mt-2 text-sm space-y-1">
                <p><strong>Configured:</strong> {healthStatus.configured ? '✅ Yes' : '❌ No'}</p>
                <p><strong>From Email:</strong> {healthStatus.from_email || 'N/A'}</p>
                <p><strong>From Name:</strong> {healthStatus.from_name || 'N/A'}</p>
                <p><strong>Status:</strong> {healthStatus.status || 'N/A'}</p>
                {healthStatus.error && (
                  <p className="text-red-600"><strong>Error:</strong> {healthStatus.error}</p>
                )}
              </div>
            )}
          </div>

          {/* Email Type Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Email Type</label>
            <div className="flex gap-4">
              <button
                onClick={() => setEmailType('test')}
                className={`px-4 py-2 rounded-lg transition ${
                  emailType === 'test'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Test Email
              </button>
              <button
                onClick={() => setEmailType('welcome')}
                className={`px-4 py-2 rounded-lg transition ${
                  emailType === 'welcome'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Welcome Email
              </button>
              <button
                onClick={() => setEmailType('custom')}
                className={`px-4 py-2 rounded-lg transition ${
                  emailType === 'custom'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Custom Email
              </button>
            </div>
          </div>

          {/* Email Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                To Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={toEmail}
                onChange={(e) => setToEmail(e.target.value)}
                placeholder="recipient@example.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>

            {emailType === 'custom' && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Subject <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Email subject"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    HTML Content <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={htmlContent}
                    onChange={(e) => setHtmlContent(e.target.value)}
                    placeholder="<h1>Hello!</h1><p>This is a test email.</p>"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none font-mono text-sm"
                    rows={6}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Text Content (optional)
                  </label>
                  <textarea
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    placeholder="Plain text version of the email"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    rows={4}
                  />
                </div>
              </>
            )}

            {emailType === 'test' && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-700">
                  This will send a test email to verify SendGrid configuration.
                </p>
              </div>
            )}

            {emailType === 'welcome' && (
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-700">
                  This will send a welcome email template to the recipient.
                </p>
              </div>
            )}

            <button
              onClick={handleSend}
              disabled={isLoading}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isLoading ? 'Sending...' : `Send ${emailType === 'test' ? 'Test' : emailType === 'welcome' ? 'Welcome' : 'Custom'} Email`}
            </button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          {/* Response Display */}
          {response && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-semibold mb-2 text-green-900">Email Sent Successfully!</h3>
              <div className="text-sm space-y-1">
                <p><strong>Status:</strong> {response.status}</p>
                {response.status_code && (
                  <p><strong>Status Code:</strong> {response.status_code}</p>
                )}
                {response.message_id && (
                  <p><strong>Message ID:</strong> {response.message_id}</p>
                )}
                <p><strong>To:</strong> {response.to}</p>
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4">How to Test</h2>
          <div className="space-y-3 text-sm text-gray-700">
            <div>
              <h3 className="font-semibold mb-1">1. Health Check</h3>
              <p>Click "Check Status" to verify SendGrid configuration. You should see:</p>
              <ul className="list-disc list-inside ml-4 mt-1">
                <li>Configured: ✅ Yes</li>
                <li>From Email: hello@nukleo.digital</li>
                <li>From Name: Nukleo Digital</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-1">2. Test Email</h3>
              <p>Select "Test Email" and enter your email address. This sends a simple test email.</p>
            </div>
            <div>
              <h3 className="font-semibold mb-1">3. Welcome Email</h3>
              <p>Select "Welcome Email" to send a formatted welcome email template.</p>
            </div>
            <div>
              <h3 className="font-semibold mb-1">4. Custom Email</h3>
              <p>Select "Custom Email" to send a fully customized email with HTML content.</p>
            </div>
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
              <p className="font-semibold text-yellow-800">⚠️ Important:</p>
              <p className="text-yellow-700">
                Make sure SendGrid API key is configured in Railway environment variables.
                The email address "hello@nukleo.digital" must be verified in SendGrid.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

