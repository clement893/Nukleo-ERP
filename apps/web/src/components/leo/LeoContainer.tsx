/**
 * Leo Container Component
 * Container component that manages state and integrates with API
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useToast } from '@/components/ui';
import { getErrorMessage } from '@/lib/errors';
import { leoAgentAPI, type LeoConversation, type LeoMessage } from '@/lib/api/leo-agent';
import { LeoChat } from './LeoChat';
import { LeoSidebar } from './LeoSidebar';

export function LeoContainer() {
  const [conversations, setConversations] = useState<LeoConversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<LeoMessage[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const { error: showError } = useToast();

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, []);

  // Load messages when conversation is selected
  useEffect(() => {
    if (selectedConversationId) {
      loadMessages(selectedConversationId);
    } else {
      setMessages([]);
    }
  }, [selectedConversationId]);

  const loadConversations = useCallback(async () => {
    setIsLoadingConversations(true);
    try {
      const response = await leoAgentAPI.listConversations({ limit: 50 });
      setConversations(response.items);
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      showError(errorMessage);
      console.error('Failed to load conversations:', err);
    } finally {
      setIsLoadingConversations(false);
    }
  }, [showError]);

  const loadMessages = useCallback(async (conversationId: number) => {
    setIsLoadingMessages(true);
    try {
      const response = await leoAgentAPI.getConversationMessages(conversationId);
      setMessages(response.items);
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      showError(errorMessage);
      console.error('Failed to load messages:', err);
    } finally {
      setIsLoadingMessages(false);
    }
  }, [showError]);

  const handleNewConversation = useCallback(() => {
    setSelectedConversationId(null);
    setMessages([]);
  }, []);

  const handleSelectConversation = useCallback((conversationId: number) => {
    setSelectedConversationId(conversationId);
  }, []);

  const handleDeleteConversation = useCallback(async (conversationId: number) => {
    try {
      await leoAgentAPI.deleteConversation(conversationId);
      
      // Remove from local state
      setConversations((prev) => prev.filter((c) => c.id !== conversationId));
      
      // If deleted conversation was selected, clear selection
      if (selectedConversationId === conversationId) {
        setSelectedConversationId(null);
        setMessages([]);
      }
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      showError(errorMessage);
      console.error('Failed to delete conversation:', err);
    }
  }, [selectedConversationId, showError]);

  const handleRenameConversation = useCallback(async (conversationId: number, newTitle: string) => {
    try {
      const updated = await leoAgentAPI.updateConversation(conversationId, { title: newTitle });
      
      // Update local state
      setConversations((prev) =>
        prev.map((c) => (c.id === conversationId ? updated : c))
      );
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      showError(errorMessage);
      console.error('Failed to rename conversation:', err);
    }
  }, [showError]);

  const handleSendMessage = useCallback(async (message: string) => {
    if (!message.trim() || isSending) return;

    setIsSending(true);
    
    try {
      // Send query to Leo
      const response = await leoAgentAPI.query({
        message,
        conversation_id: selectedConversationId || undefined,
        provider: 'auto',
      });

      // Update conversation ID if it's a new conversation
      if (!selectedConversationId && response.conversation_id) {
        setSelectedConversationId(response.conversation_id);
        // Reload conversations to include the new one
        await loadConversations();
      }

      // Reload messages to get the updated conversation
      if (response.conversation_id) {
        await loadMessages(response.conversation_id);
      }
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      showError(errorMessage);
      console.error('Failed to send message:', err);
    } finally {
      setIsSending(false);
    }
  }, [selectedConversationId, isSending, showError, loadConversations, loadMessages]);

  // Memoize loading state
  const isLoading = useMemo(() => isSending || isLoadingMessages, [isSending, isLoadingMessages]);

  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-full w-full">
      <LeoSidebar
        conversations={conversations}
        selectedConversationId={selectedConversationId}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
        onDeleteConversation={handleDeleteConversation}
        onRenameConversation={handleRenameConversation}
        isLoading={isLoadingConversations}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />
      <div className="flex-1 flex flex-col min-w-0 h-full">
        <LeoChat
          conversationId={selectedConversationId}
          messages={messages}
          isLoading={isLoading}
          onSendMessage={handleSendMessage}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          sidebarOpen={sidebarOpen}
        />
      </div>
    </div>
  );
}
