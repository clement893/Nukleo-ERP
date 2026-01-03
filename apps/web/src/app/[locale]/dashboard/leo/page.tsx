'use client';

import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageContainer } from '@/components/layout';
import NukleoPageHeader from '@/components/nukleo/NukleoPageHeader';
import { Button, Input } from '@/components/ui';
import { apiClient } from '@/lib/api/client';
import { extractApiData } from '@/lib/api/utils';
import { Loader2, Send, Bot, User, Sparkles, Trash2, Settings } from 'lucide-react';
import { getErrorMessage } from '@/lib/errors';
import { useToast } from '@/components/ui';
import { leoSettingsAPI } from '@/lib/api/leo-settings';
import Link from 'next/link';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  provider?: string;
}

export default function LeoPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentProvider, setCurrentProvider] = useState<string>('auto');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  // Load Leo settings to get provider preference and system prompt
  const { data: leoSettings } = useQuery({
    queryKey: ['leo-settings'],
    queryFn: () => leoSettingsAPI.getSettings(),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Update provider from settings if available
  useEffect(() => {
    if (leoSettings?.provider_preference && leoSettings.provider_preference !== 'auto') {
      setCurrentProvider(leoSettings.provider_preference);
    }
  }, [leoSettings]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      // Prepare messages for API
      const apiMessages = [...messages, userMessage].map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      interface ChatResponse {
        content: string;
        model: string;
        provider: string;
        usage: {
          prompt_tokens?: number;
          completion_tokens?: number;
          total_tokens?: number;
          input_tokens?: number;
          output_tokens?: number;
        };
        finish_reason: string;
      }

      // Use Leo settings system prompt if available, otherwise use default
      // The backend will automatically use Leo settings if no system_prompt is provided
      const response = await apiClient.post<ChatResponse>('/v1/ai/chat', {
        messages: apiMessages,
        provider: currentProvider,
        // Don't pass system_prompt - let backend use Leo settings automatically
      });

      // FastAPI returns data directly, apiClient.post returns response.data from axios
      const chatResponse = extractApiData<ChatResponse>(response) as ChatResponse;

      if (!chatResponse || typeof chatResponse !== 'object' || !('content' in chatResponse) || !chatResponse.content) {
        console.error('AI Response structure:', { response, chatResponse });
        throw new Error('No data received from AI service');
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: chatResponse.content,
        timestamp: new Date(),
        provider: chatResponse.provider,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err) || 'Erreur lors de l\'envoi du message';
      setError(errorMessage);
      showToast({
        message: errorMessage,
        type: 'error',
      });
      
      // Add error message to chat
      const errorMsg: Message = {
        role: 'assistant',
        content: `Erreur: ${errorMessage}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setError(null);
  };

  return (
    <PageContainer>
      {/* Nukleo Header */}
      <NukleoPageHeader
        title="Leo"
        description="Votre assistant IA intelligent"
        actions={
          <div className="flex items-center gap-2">
            <select
              value={currentProvider}
              onChange={(e) => setCurrentProvider(e.target.value)}
              className="text-sm px-3 py-1.5 border border-white/30 rounded-lg bg-white/20 backdrop-blur-sm text-white focus:outline-none focus:ring-2 focus:ring-white/50 disabled:opacity-50"
              disabled={isLoading}
            >
              <option value="auto" className="text-gray-900">Auto</option>
              <option value="openai" className="text-gray-900">OpenAI</option>
              <option value="anthropic" className="text-gray-900">Anthropic</option>
            </select>
            <Link href="/settings/leo">
              <Button
                variant="outline"
                size="sm"
                className="text-white border-white/30 hover:bg-white/10"
                title="Paramètres Leo"
              >
                <Settings className="w-4 h-4" />
              </Button>
            </Link>
            {messages.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearChat}
                disabled={isLoading}
                className="text-white border-white/30 hover:bg-white/10"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Effacer
              </Button>
            )}
          </div>
        }
      />

      {/* Chat Container */}
      <div className="mt-6 h-[calc(100vh-4rem-8rem)] min-h-[600px]">
        <div className="glass-card border border-nukleo-lavender/20 rounded-2xl overflow-hidden flex flex-col h-full">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 min-h-0">
            {messages.length === 0 && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="p-4 rounded-2xl bg-primary-500/10 border border-primary-500/30 mb-4 inline-block">
                    <Sparkles className="w-12 h-12 text-primary-500" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Bonjour ! Je suis Leo
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 text-center max-w-md">
                    Votre assistant IA pour Nukleo ERP. Posez-moi des questions et je vous aiderai.
                  </p>
                </div>
              </div>
            )}

            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-4 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary-500/10 border border-primary-500/30 flex items-center justify-center">
                    <Bot className="h-5 w-5 text-primary-500" />
                  </div>
                )}
                
                <div
                  className={`max-w-[75%] rounded-2xl p-4 ${
                    message.role === 'user'
                      ? 'bg-primary-500 text-white'
                      : 'glass-card border border-nukleo-lavender/20 text-gray-900 dark:text-white'
                  }`}
                >
                  <div className="whitespace-pre-wrap break-words leading-relaxed">
                    {(() => {
                      // Parse markdown links [text](url) and plain URLs
                      const content = message.content;
                      const parts: (string | { type: 'link'; text: string; url: string })[] = [];
                      let lastIndex = 0;
                      
                      // First, find all markdown links [text](url)
                      const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
                      let match;
                      
                      while ((match = markdownLinkRegex.exec(content)) !== null) {
                        // Add text before the link
                        if (match.index > lastIndex) {
                          parts.push(content.substring(lastIndex, match.index));
                        }
                        // Add the link
                        if (match[1] && match[2]) {
                          parts.push({ type: 'link', text: match[1], url: match[2] });
                        }
                        lastIndex = match.index + match[0].length;
                      }
                      
                      // Add remaining text
                      if (lastIndex < content.length) {
                        parts.push(content.substring(lastIndex));
                      }
                      
                      // If no markdown links found, try to detect plain URLs
                      if (parts.length === 1 && typeof parts[0] === 'string') {
                        const urlRegex = /(https?:\/\/[^\s]+|(?:\/[a-z]{2})?\/dashboard\/[^\s]+|\/settings\/[^\s]+)/gi;
                        const textParts: (string | { type: 'link'; text: string; url: string })[] = [];
                        let urlLastIndex = 0;
                        let urlMatch;
                        
                        while ((urlMatch = urlRegex.exec(parts[0])) !== null) {
                          if (urlMatch.index > urlLastIndex) {
                            textParts.push(parts[0].substring(urlLastIndex, urlMatch.index));
                          }
                          textParts.push({ type: 'link', text: urlMatch[0], url: urlMatch[0] });
                          urlLastIndex = urlMatch.index + urlMatch[0].length;
                        }
                        
                        if (urlLastIndex < parts[0].length) {
                          textParts.push(parts[0].substring(urlLastIndex));
                        }
                        
                        return textParts.length > 1 ? textParts : parts;
                      }
                      
                      return parts;
                    })().map((part, idx) => {
                      if (typeof part === 'string') {
                        return <span key={idx}>{part}</span>;
                      } else {
                        return (
                          <a
                            key={idx}
                            href={part.url}
                            className="text-primary-500 hover:text-primary-600 underline font-medium"
                            onClick={(e) => {
                              // Handle internal links
                              if (part.url.startsWith('/')) {
                                e.preventDefault();
                                window.location.href = part.url;
                              }
                            }}
                          >
                            {part.text}
                          </a>
                        );
                      }
                    })}
                  </div>
                  {message.provider && message.role === 'assistant' && (
                    <p className="text-xs mt-2 opacity-70 capitalize">
                      via {message.provider}
                    </p>
                  )}
                </div>

                {message.role === 'user' && (
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    <User className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-4 justify-start">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary-500/10 border border-primary-500/30 flex items-center justify-center">
                  <Bot className="h-5 w-5 text-primary-500" />
                </div>
                <div className="glass-card border border-nukleo-lavender/20 rounded-2xl p-4">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-primary-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Leo réfléchit...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
            {error && (
              <div className="mb-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
                {error}
              </div>
            )}
            <div className="flex gap-3 max-w-4xl mx-auto">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Posez une question à Leo..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                className="bg-primary-500 hover:bg-primary-600 text-white"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2 text-center">
              Leo peut faire des erreurs. Vérifiez les informations importantes.
            </p>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
