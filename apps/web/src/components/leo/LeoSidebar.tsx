/**
 * Leo Sidebar Component
 * Sidebar for displaying and managing conversations
 */

'use client';

import { Button } from '@/components/ui';
import { Plus, MessageSquare, Pencil, Trash2 } from 'lucide-react';
import { clsx } from 'clsx';
import { useState } from 'react';
import type { LeoConversation } from '@/lib/api/leo-agent';

interface LeoSidebarProps {
  conversations: LeoConversation[];
  selectedConversationId: number | null;
  onSelectConversation: (conversationId: number) => void;
  onNewConversation: () => void;
  onDeleteConversation?: (conversationId: number) => void;
  onRenameConversation?: (conversationId: number, newTitle: string) => void;
  isLoading?: boolean;
}

export function LeoSidebar({
  conversations,
  selectedConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  onRenameConversation,
  isLoading = false,
}: LeoSidebarProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState<string>('');

  const handleStartEdit = (conv: LeoConversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(conv.id);
    setEditTitle(conv.title);
  };

  const handleSaveEdit = async (conversationId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (editTitle.trim() && onRenameConversation) {
      await onRenameConversation(conversationId, editTitle.trim());
    }
    setEditingId(null);
    setEditTitle('');
  };

  const handleCancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
    setEditTitle('');
  };

  const handleDelete = (conversationId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDeleteConversation && confirm('Êtes-vous sûr de vouloir supprimer cette conversation ?')) {
      onDeleteConversation(conversationId);
    }
  };

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
          <div
            key={conv.id}
            className={clsx(
              'group relative rounded-lg transition-colors',
              selectedConversationId === conv.id
                ? 'bg-primary-100 dark:bg-primary-900/30'
                : 'hover:bg-muted'
            )}
          >
            {editingId === conv.id ? (
              <div className="p-3 flex flex-col gap-2">
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSaveEdit(conv.id, e as any);
                    } else if (e.key === 'Escape') {
                      handleCancelEdit(e as any);
                    }
                  }}
                  className="w-full px-2 py-1 text-sm rounded border border-border bg-background"
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={(e) => handleSaveEdit(conv.id, e)}
                    className="flex-1"
                  >
                    Enregistrer
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCancelEdit}
                    className="flex-1"
                  >
                    Annuler
                  </Button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => onSelectConversation(conv.id)}
                className={clsx(
                  'w-full text-left p-3 rounded-lg transition-colors flex items-start gap-3',
                  selectedConversationId === conv.id
                    ? 'text-primary-foreground'
                    : 'text-foreground'
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
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {onRenameConversation && (
                    <button
                      onClick={(e) => handleStartEdit(conv, e)}
                      className="p-1 hover:bg-muted rounded"
                      aria-label="Renommer"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {onDeleteConversation && (
                    <button
                      onClick={(e) => handleDelete(conv.id, e)}
                      className="p-1 hover:bg-danger/20 rounded text-danger"
                      aria-label="Supprimer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
