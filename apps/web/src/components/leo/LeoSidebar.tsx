/**
 * Leo Sidebar Component
 * Sidebar for displaying and managing conversations
 */

'use client';

import { Button } from '@/components/ui';
import { Plus, MessageSquare } from 'lucide-react';
import { clsx } from 'clsx';
import type { LeoConversation } from '@/lib/api/leo-agent';

interface LeoSidebarProps {
  conversations: LeoConversation[];
  selectedConversationId: number | null;
  onSelectConversation: (conversationId: number) => void;
  onNewConversation: () => void;
  isLoading?: boolean;
}

export function LeoSidebar({
  conversations,
  selectedConversationId,
  onSelectConversation,
  onNewConversation,
  isLoading = false,
}: LeoSidebarProps) {
  return (
    <div className="w-64 border-r border-border p-4 flex flex-col h-full">
      <Button
        onClick={onNewConversation}
        className="w-full mb-4 flex items-center gap-2"
      >
        <Plus className="w-4 h-4" />
        Nouvelle conversation
      </Button>

      <div className="flex-1 overflow-y-auto space-y-2">
        {isLoading && conversations.length === 0 && (
          <div className="text-sm text-muted-foreground text-center py-4">
            Chargement...
          </div>
        )}

        {!isLoading && conversations.length === 0 && (
          <div className="text-sm text-muted-foreground text-center py-4">
            Aucune conversation
          </div>
        )}

        {conversations.map((conv) => (
          <button
            key={conv.id}
            onClick={() => onSelectConversation(conv.id)}
            className={clsx(
              'w-full text-left p-3 rounded-lg transition-colors flex items-start gap-3',
              selectedConversationId === conv.id
                ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-foreground'
                : 'hover:bg-muted text-foreground'
            )}
          >
            <MessageSquare className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate mb-1">{conv.title}</div>
              <div className="text-xs text-muted-foreground">
                {new Date(conv.updated_at).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'short',
                })}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
