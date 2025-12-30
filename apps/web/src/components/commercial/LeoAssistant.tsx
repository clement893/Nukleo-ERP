'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, Button, Input } from '@/components/ui';
import { Loader2, Send, Sparkles, X, Maximize2, Minimize2 } from 'lucide-react';
import { clsx } from 'clsx';
import { leoAgentAPI, type LeoMessage } from '@/lib/api/leo-agent';
import { getErrorMessage } from '@/lib/errors';
import { useToast } from '@/components/ui';

interface LeoAssistantProps {
  context?: string; // Contexte de la soumission pour aider Leo
  onTextGenerated?: (text: string) => void; // Callback quand Leo génère du texte
  className?: string;
}

export function LeoAssistant({ context, onTextGenerated, className = '' }: LeoAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<LeoMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isMinimized]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, isMinimized]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);

    // Add user message to UI immediately
    const tempUserMessage: LeoMessage = {
      id: Date.now(),
      conversation_id: conversationId || 0,
      role: 'user',
      content: userMessage,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMessage]);

    try {
      // Build context-aware prompt
      let prompt = userMessage;
      if (context) {
        prompt = `Contexte de la soumission : ${context}\n\nQuestion de l'utilisateur : ${userMessage}\n\nAide-moi à rédiger une réponse professionnelle et pertinente pour cette soumission.`;
      }

      // Send query to Leo
      const response = await leoAgentAPI.query({
        message: prompt,
        conversation_id: conversationId || undefined,
        provider: 'auto',
      });

      // Update conversation ID if it's a new conversation
      if (!conversationId && response.conversation_id) {
        setConversationId(response.conversation_id);
      }

      // Load messages to get the full conversation
      if (response.conversation_id) {
        const messagesResponse = await leoAgentAPI.getConversationMessages(response.conversation_id);
        setMessages(messagesResponse.items);
      }
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      showToast({
        message: errorMessage || 'Erreur lors de la communication avec Leo',
        type: 'error',
      });
      
      // Remove temp user message on error
      setMessages((prev) => prev.filter((msg) => msg.id !== tempUserMessage.id));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleUseText = (text: string) => {
    if (onTextGenerated) {
      onTextGenerated(text);
      showToast({
        message: 'Texte inséré dans le formulaire',
        type: 'success',
      });
    }
  };

  // Quick suggestions for submission writing
  const quickSuggestions = context
    ? [
        `Aide-moi à rédiger le contenu pour : ${context}`,
        'Propose-moi une introduction professionnelle',
        'Suggère-moi des objectifs pertinents',
        'Aide-moi à décrire le processus',
      ]
    : [
        'Aide-moi à rédiger une introduction',
        'Propose-moi des objectifs',
        'Suggère-moi une description de processus',
        'Aide-moi avec le budget',
      ];

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        className={clsx('fixed bottom-6 right-6 z-50 shadow-lg', className)}
        size="lg"
      >
        <Sparkles className="w-5 h-5 mr-2" />
        Assistant Leo
      </Button>
    );
  }

  return (
    <Card
      className={clsx(
        'fixed bottom-6 right-6 z-50 shadow-2xl flex flex-col transition-all duration-300',
        isMinimized ? 'w-80 h-16' : 'w-96 h-[600px]',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary-600 dark:text-primary-400" />
          </div>
          <span className="font-semibold text-sm">Leo - Assistant rédaction</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMinimized(!isMinimized)}
            className="h-8 w-8 p-0"
          >
            {isMinimized ? (
              <Maximize2 className="w-4 h-4" />
            ) : (
              <Minimize2 className="w-4 h-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setIsOpen(false);
              setIsMinimized(false);
            }}
            className="h-8 w-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full py-8">
                <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mb-4">
                  <Sparkles className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                </div>
                <h3 className="text-sm font-semibold text-foreground mb-2 text-center">
                  Je suis Leo, votre assistant pour la rédaction
                </h3>
                <p className="text-xs text-muted-foreground mb-4 text-center">
                  Posez-moi une question ou choisissez une suggestion
                </p>
                <div className="space-y-2 w-full">
                  {quickSuggestions.slice(0, 4).map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setInput(suggestion);
                        setTimeout(() => sendMessage(), 100);
                      }}
                      disabled={isLoading}
                      className="w-full text-left px-3 py-2 rounded-lg border border-border bg-background hover:bg-muted transition-colors text-xs text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={clsx(
                  'flex gap-3',
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {message.role === 'assistant' && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                  </div>
                )}

                <div
                  className={clsx(
                    'max-w-[85%] rounded-lg px-3 py-2 text-sm',
                    message.role === 'user'
                      ? 'bg-primary-600 text-white'
                      : 'bg-muted text-foreground'
                  )}
                >
                  <div className="whitespace-pre-wrap break-words">{message.content}</div>
                  {message.role === 'assistant' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleUseText(message.content)}
                      className="mt-2 h-6 text-xs"
                    >
                      Utiliser ce texte
                    </Button>
                  )}
                </div>

                {message.role === 'user' && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    <span className="text-xs">U</span>
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                </div>
                <div className="bg-muted rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Leo réfléchit...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-border p-3 bg-background">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Demandez à Leo..."
                disabled={isLoading}
                className="flex-1 text-sm"
              />
              <Button
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                size="sm"
                className="flex items-center gap-1"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </>
      )}
    </Card>
  );
}
