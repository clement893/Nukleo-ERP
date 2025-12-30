/**
 * Leo Chat Component
 * Main chat interface for Leo AI assistant
 */

'use client';

import { useState, useRef, useEffect, memo } from 'react';
import { Card, Button, Input } from '@/components/ui';
import { useToast } from '@/components/ui';
import { Loader2, Send, Sparkles, User, Copy, Check } from 'lucide-react';
import { clsx } from 'clsx';
import type { LeoMessage } from '@/lib/api/leo-agent';

/**
 * Enhanced Markdown Content Component
 * Renders markdown formatting with improved support for code blocks, lists, and formatting
 */
function MarkdownContent({ content }: { content: string }) {
  const formatMarkdown = (text: string): React.ReactNode => {
    const elements: React.ReactNode[] = [];
    let inCodeBlock = false;
    let codeBlockContent: string[] = [];
    let codeBlockLanguage = '';
    let listItems: string[] = [];
    let inList = false;
    let keyCounter = 0;

    const processLine = (line: string, index: number) => {
      // Code blocks
      if (line.trim().startsWith('```')) {
        if (inCodeBlock) {
          // End of code block
          const code = codeBlockContent.join('\n');
          elements.push(
            <pre key={`code-${keyCounter++}`} className="bg-gray-900 dark:bg-gray-800 text-gray-100 p-4 rounded-lg overflow-x-auto my-3 text-sm">
              <code className={codeBlockLanguage ? `language-${codeBlockLanguage}` : ''}>
                {code}
              </code>
            </pre>
          );
          codeBlockContent = [];
          codeBlockLanguage = '';
          inCodeBlock = false;
        } else {
          // Start of code block
          inCodeBlock = true;
          codeBlockLanguage = line.trim().replace('```', '').trim();
        }
        return;
      }

      if (inCodeBlock) {
        codeBlockContent.push(line);
        return;
      }

      // Headers
      if (line.startsWith('### ')) {
        if (inList) {
          elements.push(<ul key={`list-${keyCounter++}`} className="list-disc ml-6 mb-2 space-y-1">{listItems.map((item, i) => <li key={i}>{item}</li>)}</ul>);
          listItems = [];
          inList = false;
        }
        elements.push(
          <h3 key={`h3-${keyCounter++}`} className="text-base font-semibold mt-4 mb-2 text-foreground">
            {line.replace('### ', '')}
          </h3>
        );
        return;
      } else if (line.startsWith('## ')) {
        if (inList) {
          elements.push(<ul key={`list-${keyCounter++}`} className="list-disc ml-6 mb-2 space-y-1">{listItems.map((item, i) => <li key={i}>{item}</li>)}</ul>);
          listItems = [];
          inList = false;
        }
        elements.push(
          <h2 key={`h2-${keyCounter++}`} className="text-lg font-semibold mt-4 mb-2 text-foreground">
            {line.replace('## ', '')}
          </h2>
        );
        return;
      } else if (line.startsWith('# ')) {
        if (inList) {
          elements.push(<ul key={`list-${keyCounter++}`} className="list-disc ml-6 mb-2 space-y-1">{listItems.map((item, i) => <li key={i}>{item}</li>)}</ul>);
          listItems = [];
          inList = false;
        }
        elements.push(
          <h1 key={`h1-${keyCounter++}`} className="text-xl font-bold mt-4 mb-2 text-foreground">
            {line.replace('# ', '')}
          </h1>
        );
        return;
      }

      // Lists
      const listMatch = line.match(/^[-*]\s(.+)$/);
      if (listMatch) {
        inList = true;
        listItems.push(listMatch[1]);
        return;
      } else if (inList && line.trim() === '') {
        // End of list
        elements.push(
          <ul key={`list-${keyCounter++}`} className="list-disc ml-6 mb-2 space-y-1">
            {listItems.map((item, i) => (
              <li key={i} className="text-foreground">{item}</li>
            ))}
          </ul>
        );
        listItems = [];
        inList = false;
        return;
      }

      // Process inline formatting (bold, italic, links, code)
      const processInlineFormatting = (text: string): React.ReactNode => {
        const parts: React.ReactNode[] = [];
        let currentIndex = 0;
        let partKey = 0;

        // Code inline `code`
        const codeRegex = /`([^`]+)`/g;
        let codeMatch;
        const codeMatches: Array<{ start: number; end: number; content: string }> = [];
        while ((codeMatch = codeRegex.exec(text)) !== null) {
          codeMatches.push({
            start: codeMatch.index,
            end: codeMatch.index + codeMatch[0].length,
            content: codeMatch[1],
          });
        }

        // Links [text](url)
        const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
        const linkMatches: Array<{ start: number; end: number; text: string; url: string }> = [];
        let linkMatch;
        while ((linkMatch = linkRegex.exec(text)) !== null) {
          linkMatches.push({
            start: linkMatch.index,
            end: linkMatch.index + linkMatch[0].length,
            text: linkMatch[1],
            url: linkMatch[2],
          });
        }

        // Bold **text**
        const boldRegex = /\*\*([^*]+)\*\*/g;
        const boldMatches: Array<{ start: number; end: number; content: string }> = [];
        let boldMatch;
        while ((boldMatch = boldRegex.exec(text)) !== null) {
          boldMatches.push({
            start: boldMatch.index,
            end: boldMatch.index + boldMatch[0].length,
            content: boldMatch[1],
          });
        }

        // Italic *text*
        const italicRegex = /(?<!\*)\*([^*]+)\*(?!\*)/g;
        const italicMatches: Array<{ start: number; end: number; content: string }> = [];
        let italicMatch;
        while ((italicMatch = italicRegex.exec(text)) !== null) {
          italicMatches.push({
            start: italicMatch.index,
            end: italicMatch.index + italicMatch[0].length,
            content: italicMatch[1],
          });
        }

        // Combine all matches and sort by position
        const allMatches = [
          ...codeMatches.map(m => ({ ...m, type: 'code' as const })),
          ...linkMatches.map(m => ({ ...m, type: 'link' as const })),
          ...boldMatches.map(m => ({ ...m, type: 'bold' as const })),
          ...italicMatches.map(m => ({ ...m, type: 'italic' as const })),
        ].sort((a, b) => a.start - b.start);

        let lastIndex = 0;
        for (const match of allMatches) {
          if (match.start > lastIndex) {
            parts.push(text.substring(lastIndex, match.start));
          }
          if (match.type === 'code') {
            parts.push(
              <code key={partKey++} className="bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded text-sm font-mono">
                {match.content}
              </code>
            );
          } else if (match.type === 'link') {
            parts.push(
              <a
                key={partKey++}
                href={match.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 dark:text-primary-400 underline hover:text-primary-700 dark:hover:text-primary-300"
              >
                {match.text}
              </a>
            );
          } else if (match.type === 'bold') {
            parts.push(<strong key={partKey++}>{match.content}</strong>);
          } else if (match.type === 'italic') {
            parts.push(<em key={partKey++}>{match.content}</em>);
          }
          lastIndex = match.end;
        }
        if (lastIndex < text.length) {
          parts.push(text.substring(lastIndex));
        }

        return parts.length > 0 ? <>{parts}</> : text;
      };

      // Regular paragraphs
      if (line.trim()) {
        if (inList) {
          elements.push(
            <ul key={`list-${keyCounter++}`} className="list-disc ml-6 mb-2 space-y-1">
              {listItems.map((item, i) => (
                <li key={i} className="text-foreground">{processInlineFormatting(item)}</li>
              ))}
            </ul>
          );
          listItems = [];
          inList = false;
        }
        elements.push(
          <p key={`p-${keyCounter++}`} className="mb-2 text-foreground">
            {processInlineFormatting(line)}
          </p>
        );
      } else if (!inList) {
        elements.push(<br key={`br-${keyCounter++}`} />);
      }
    };

    const lines = text.split('\n');
    lines.forEach((line, index) => processLine(line, index));

    // Close any open list
    if (inList && listItems.length > 0) {
      elements.push(
        <ul key={`list-${keyCounter++}`} className="list-disc ml-6 mb-2 space-y-1">
          {listItems.map((item, i) => (
            <li key={i} className="text-foreground">{processInlineFormatting(item)}</li>
          ))}
        </ul>
      );
    }

    return <div className="prose prose-sm dark:prose-invert max-w-none">{elements}</div>;
  };
  
  return formatMarkdown(content);
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
  const { success, error } = useToast();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [showSuggestions, setShowSuggestions] = useState(messages.length === 0);
  const [copiedMessageId, setCopiedMessageId] = useState<number | null>(null);

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

  const handleCopyMessage = async (content: string, messageId: number) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(messageId);
      success('Message copié dans le presse-papiers');
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (err) {
      error('Erreur lors de la copie');
    }
  };

  return (
    <Card className="flex flex-col h-full p-0 overflow-hidden">
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
                'max-w-[80%] rounded-lg px-4 py-3 group relative',
                message.role === 'user'
                  ? 'bg-primary-600 text-white'
                  : 'bg-muted text-foreground'
              )}
            >
              {message.role === 'assistant' && (
                <button
                  onClick={() => handleCopyMessage(message.content, message.id)}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded hover:bg-muted-foreground/20"
                  title="Copier le message"
                >
                  {copiedMessageId === message.id ? (
                    <Check className="w-3.5 h-3.5 text-green-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                  )}
                </button>
              )}
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
                  'text-xs mt-2 flex items-center justify-between',
                  message.role === 'user'
                    ? 'text-primary-100'
                    : 'text-muted-foreground'
                )}
              >
                <span>
                  {new Date(message.created_at).toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
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
