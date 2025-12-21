'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

'use client';

import { useState } from 'react';
import { aiAPI } from '@/lib/api';

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export default function AITestPage() {
  const [mode, setMode] = useState<'simple' | 'chat'>('simple');
  const [simpleMessage, setSimpleMessage] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'user', content: '' }
  ]);
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [model, setModel] = useState('gpt-4o-mini');
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(1000);

  const checkHealth = async () => {
    try {
      const res = await aiAPI.health();
      setHealthStatus(res.data);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to check health');
      setHealthStatus(null);
    }
  };

  const handleSimpleChat = async () => {
    if (!simpleMessage.trim()) {
      setError('Please enter a message');
      return;
    }

    setIsLoading(true);
    setError('');
    setResponse('');

    try {
      const res = await aiAPI.simpleChat(simpleMessage, systemPrompt || undefined, model);
      setResponse(res.data.response);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to get response');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChat = async () => {
    const validMessages = messages.filter(m => m.content.trim());
    if (validMessages.length === 0) {
      setError('Please add at least one message');
      return;
    }

    setIsLoading(true);
    setError('');
    setResponse('');

    try {
      const res = await aiAPI.chat(
        validMessages,
        model,
        temperature,
        maxTokens
      );
      setResponse(res.data.content);
      
      // Add assistant response to messages
      setMessages([...validMessages, { role: 'assistant', content: res.data.content }]);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to get response');
    } finally {
      setIsLoading(false);
    }
  };

  const addMessage = () => {
    setMessages([...messages, { role: 'user', content: '' }]);
  };

  const updateMessage = (index: number, content: string) => {
    const newMessages = [...messages];
    const message = newMessages[index];
    if (message) {
      message.content = content;
      setMessages(newMessages);
    }
  };

  const removeMessage = (index: number) => {
    setMessages(messages.filter((_, i) => i !== index));
  };

  const changeMessageRole = (index: number, role: 'system' | 'user' | 'assistant') => {
    const newMessages = [...messages];
    const message = newMessages[index];
    if (message) {
      message.role = role;
      setMessages(newMessages);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">AI Test Interface</h1>
          
          {/* Health Check */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold">Health Check</h2>
              <button
                onClick={checkHealth}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Check Status
              </button>
            </div>
            {healthStatus && (
              <div className="mt-2 text-sm">
                <p>Configured: {healthStatus.configured ? 'âœ…' : 'âŒ'}</p>
                <p>Model: {healthStatus.model || 'N/A'}</p>
                <p>Available: {healthStatus.available ? 'âœ…' : 'âŒ'}</p>
                {healthStatus.error && (
                  <p className="text-red-600">Error: {healthStatus.error}</p>
                )}
              </div>
            )}
          </div>

          {/* Mode Selection */}
          <div className="mb-6">
            <div className="flex gap-4 mb-4">
              <button
                onClick={() => setMode('simple')}
                className={`px-4 py-2 rounded-lg transition ${
                  mode === 'simple'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Simple Chat
              </button>
              <button
                onClick={() => setMode('chat')}
                className={`px-4 py-2 rounded-lg transition ${
                  mode === 'chat'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Full Chat
              </button>
            </div>
          </div>

          {/* Model Settings */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-3">Model Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Model</label>
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="gpt-4o-mini">gpt-4o-mini</option>
                  <option value="gpt-4o">gpt-4o</option>
                  <option value="gpt-4-turbo">gpt-4-turbo</option>
                  <option value="gpt-3.5-turbo">gpt-3.5-turbo</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Temperature: {temperature}
                </label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Max Tokens</label>
                <input
                  type="number"
                  min="1"
                  max="4000"
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Simple Chat Mode */}
          {mode === 'simple' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  System Prompt (optional)
                </label>
                <textarea
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  placeholder="You are a helpful assistant..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Your Message</label>
                <textarea
                  value={simpleMessage}
                  onChange={(e) => setSimpleMessage(e.target.value)}
                  placeholder="Type your message here..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  rows={4}
                />
              </div>
              <button
                onClick={handleSimpleChat}
                disabled={isLoading}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isLoading ? 'Sending...' : 'Send Message'}
              </button>
            </div>
          )}

          {/* Full Chat Mode */}
          {mode === 'chat' && (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium">Messages</label>
                  <button
                    onClick={addMessage}
                    className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm"
                  >
                    + Add Message
                  </button>
                </div>
                {messages.map((msg, index) => (
                  <div key={index} className="mb-3 p-3 border border-gray-300 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <select
                        value={msg.role}
                        onChange={(e) => changeMessageRole(index, e.target.value as any)}
                        className="px-2 py-1 border border-gray-300 rounded text-sm"
                      >
                        <option value="system">System</option>
                        <option value="user">User</option>
                        <option value="assistant">Assistant</option>
                      </select>
                      {messages.length > 1 && (
                        <button
                          onClick={() => removeMessage(index)}
                          className="px-2 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <textarea
                      value={msg.content}
                      onChange={(e) => updateMessage(index, e.target.value)}
                      placeholder={`${msg.role} message...`}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      rows={2}
                    />
                  </div>
                ))}
              </div>
              <button
                onClick={handleChat}
                disabled={isLoading}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isLoading ? 'Sending...' : 'Send Chat'}
              </button>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          {/* Response Display */}
          {response && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-semibold mb-2 text-green-900">AI Response:</h3>
              <div className="text-gray-800 whitespace-pre-wrap">{response}</div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

