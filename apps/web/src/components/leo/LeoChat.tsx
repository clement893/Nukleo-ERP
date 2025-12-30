/**
 * Leo Chat Component
 * Main chat interface for Leo AI assistant
 */

'use client';

import { useState, useRef, useEffect, memo } from 'react';
import { Card, Button, Input } from '@/components/ui';
import { Loader2, Send, Sparkles, User } from 'lucide-react';
import { clsx } from 'clsx';
import type { LeoMessage } from '@/lib/api/leo-agent';

/**
 * Simple Markdown Content Component
 * Renders basic markdown formatting without external dependencies
 */
function MarkdownContent({ content }: { content: string }) {
  // Simple markdown rendering for basic formatting
  // For full markdown support, consider installing react-markdown
  const formatMarkdown = (text: string): React.ReactNode => {
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    
    lines.forEach((line, index) => {
      // Headers
      if (line.startsWith('### ')) {
        elements.push(
          <h3 key={index} className="text-base font-semibold mt-4 mb-2">
            {line.replace('### ', '')}
          </h3>
        );
      } else if (line.startsWith('## ')) {
        elements.push(
          <h2 key={index} className="text-lg font-semibold mt-4 mb-2">
            {line.replace('## ', '')}
          </h2>
        );
      } else if (line.startsWith('# ')) {
        elements.push(
          <h1 key={index} className="text-xl font-bold mt-4 mb-2">
            {line.replace('# ', '')}
          </h1>
        );
      }
      // Code blocks
      else if (line.startsWith('```')) {
        // Skip code block markers for now
        return;
      }
      // Lists
      else if (line.match(/^[-*]\s/)) {
        elements.push(
          <li key={index} className="ml-4 list-disc">
            {line.replace(/^[-*]\s/, '')}
          </li>
        );
      }
      // Bold
      else if (line.includes('**')) {
        const parts = line.split('**');
        const formatted = parts.map((part, i) => 
          i % 2 === 1 ? <strong key={i}>{part}</strong> : part
        );
        elements.push(<p key={index} className="mb-2">{formatted}</p>);
      }
      // Links
      else if (line.match(/\[([^\]]+)\]\(([^)]+)\)/)) {
        const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
        const parts: React.ReactNode[] = [];
        let lastIndex = 0;
        let match;
        let key = 0;
        
        while ((match = linkRegex.exec(line)) !== null) {
          if (match.index > lastIndex) {
            parts.push(line.substring(lastIndex, match.index));
          }
          parts.push(
            <a
              key={key++}
              href={match[2]}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 dark:text-primary-400 underline"
            >
              {match[1]}
            </a>
          );
          lastIndex = linkRegex.lastIndex;
        }
        if (lastIndex < line.length) {
          parts.push(line.substring(lastIndex));
        }
        elements.push(<p key={index} className="mb-2">{parts}</p>);
      }
      // Regular paragraphs
      else if (line.trim()) {
        elements.push(
          <p key={index} className="mb-2">
            {line}
          </p>
        );
      } else {
        elements.push(<br key={index} />);
      }
    });
    
    return <>{elements}</>;
  };
  
  return <div>{formatMarkdown(content)}</div>;
}

interface LeoChatProps {
  conversationId: number | null;
  messages: LeoMessage[];
  isLoading: boolean;
  onSendMessage: (message: string) => void;
}

// Quick suggestions for new conversations
const QUICK_SUGGESTIONS = [
  "Quels sont mes projets en cours ?",
  "Montre-moi mes tâches à faire",
  "Combien de factures ai-je ?",
  "Quels sont mes contacts clients ?",
  "Comment créer un nouveau projet ?",
  "Aide-moi avec les permissions",
];

export const LeoChat = memo(function LeoChat({ conversationId: _conversationId, messages, isLoading, onSendMessage }: LeoChatProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [showSuggestions, setShowSuggestions] = useState(messages.length === 0);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Show suggestions when conversation is empty
  useEffect(() => {
    setShowSuggestions(messages.length === 0);
  }, [messages.length]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim());
    setInput('');
    setShowSuggestions(false);
  };

  const handleSuggestionClick = (suggestion: string) => {
    onSendMessage(suggestion);
    setShowSuggestions(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Card className="flex flex-col h-[calc(100vh-280px)] min-h-[600px] p-0 overflow-hidden">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {showSuggestions && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full py-12">
            <div className="flex-shrink-0 w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mb-6">
              <Sparkles className="w-8 h-8 text-primary-600 dark:text-primary-400" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Bonjour ! Je suis Leo, votre assistant IA
            </h3>
            <p className="text-sm text-muted-foreground mb-6 text-center max-w-md">
              Posez-moi une question ou choisissez une suggestion ci-dessous pour commencer
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 w-full max-w-2xl">
              {QUICK_SUGGESTIONS.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  disabled={isLoading}
                  className="text-left px-4 py-3 rounded-lg border border-border bg-background hover:bg-muted transition-colors text-sm text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {messages.map((message, index) => (
          <div
            key={message.id}
            className={clsx(
              'flex gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300',
              message.role === 'user' ? 'justify-end' : 'justify-start'
            )}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            {message.role === 'assistant' && (
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              </div>
            )}
            
            <div
              className={clsx(
                'max-w-[80%] rounded-lg px-4 py-3',
                message.role === 'user'
                  ? 'bg-primary-600 text-white'
                  : 'bg-muted text-foreground'
              )}
            >
              {message.role === 'assistant' ? (
                <div className="text-sm prose prose-sm dark:prose-invert max-w-none break-words">
                  <MarkdownContent content={message.content} />
                </div>
              ) : (
                <div className="text-sm whitespace-pre-wrap break-words">
                  {message.content}
                </div>
              )}
              <div
                className={clsx(
                  'text-xs mt-2',
                  message.role === 'user'
                    ? 'text-primary-100'
                    : 'text-muted-foreground'
                )}
              >
                {new Date(message.created_at).toLocaleTimeString('fr-FR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>

            {message.role === 'user' && (
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                <User className="w-5 h-5 text-muted-foreground" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-4 justify-start animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div className="bg-muted rounded-lg px-4 py-3">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Leo réfléchit...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-border p-4 bg-background">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Posez votre question à Leo..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Envoi...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Envoyer
              </>
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Appuyez sur Entrée pour envoyer, Shift+Entrée pour une nouvelle ligne
        </p>
      </div>
    </Card>
  );
});
