'use client';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useState, useEffect, useRef, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageContainer } from '@/components/layout';
import MotionDiv from '@/components/motion/MotionDiv';
import { 
  Send, 
  Sparkles, 
  MessageSquare, 
  Clock, 
  Trash2,
  Plus,
  Zap,
  TrendingUp,
  FileText,
  Users,
  Loader2,
  Search,
  Edit2,
  Copy,
  Check,
  ChevronDown,
  X
} from 'lucide-react';
import { Button, Badge, useToast, Input, Select, Modal } from '@/components/ui';
import { leoAgentAPI, type LeoConversation, type LeoMessage } from '@/lib/api/leo-agent';
import { handleApiError } from '@/lib/errors/api';

const mockSuggestions = [
  {
    icon: TrendingUp,
    text: 'Analyse mes opportunités',
    color: 'purple',
  },
  {
    icon: FileText,
    text: 'Génère un rapport mensuel',
    color: 'blue',
  },
  {
    icon: Users,
    text: 'Liste mes contacts récents',
    color: 'green',
  },
  {
    icon: Zap,
    text: 'Recommandations stratégiques',
    color: 'orange',
  },
];

interface ConversationWithLastMessage extends LeoConversation {
  lastMessage?: string;
}

export default function LeoPage() {
  const [activeConversation, setActiveConversation] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [showSidebar, setShowSidebar] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [provider, setProvider] = useState<'auto' | 'openai' | 'anthropic'>('auto');
  const [skip, setSkip] = useState(0);
  const [conversationsWithLastMessage, setConversationsWithLastMessage] = useState<ConversationWithLastMessage[]>([]);
  const [editingConversationId, setEditingConversationId] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [copiedMessageId, setCopiedMessageId] = useState<number | null>(null);
  const [showMetadata, setShowMetadata] = useState<Record<number, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const limit = 20;

  // Fetch conversations with pagination
  const { data: conversationsData, isLoading: conversationsLoading, refetch: refetchConversations } = useQuery({
    queryKey: ['leo', 'conversations', skip],
    queryFn: () => leoAgentAPI.listConversations({ skip, limit }),
  });

  const conversations = conversationsData?.items || [];
  const totalConversations = conversationsData?.total || 0;
  const hasMore = skip + limit < totalConversations;

  // Load last message for each conversation
  useEffect(() => {
    const loadLastMessages = async () => {
      const conversationsWithLastMsg: ConversationWithLastMessage[] = await Promise.all(
        conversations.map(async (conv) => {
          try {
            const messagesData = await leoAgentAPI.getConversationMessages(conv.id);
            const lastMsg = messagesData.items[messagesData.items.length - 1];
            return {
              ...conv,
              lastMessage: lastMsg?.content || undefined,
            };
          } catch (error) {
            return {
              ...conv,
              lastMessage: undefined,
            };
          }
        })
      );
      setConversationsWithLastMessage(conversationsWithLastMsg);
    };

    if (conversations.length > 0) {
      loadLastMessages();
    } else {
      setConversationsWithLastMessage([]);
    }
  }, [conversations]);

  // Filter conversations by search query
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversationsWithLastMessage;
    const query = searchQuery.toLowerCase();
    return conversationsWithLastMessage.filter(conv =>
      conv.title.toLowerCase().includes(query) ||
      conv.lastMessage?.toLowerCase().includes(query)
    );
  }, [conversationsWithLastMessage, searchQuery]);

  // Fetch messages for active conversation
  const { data: messagesData, isLoading: messagesLoading } = useQuery({
    queryKey: ['leo', 'messages', activeConversation],
    queryFn: () => activeConversation ? leoAgentAPI.getConversationMessages(activeConversation) : null,
    enabled: !!activeConversation,
  });

  const messages = messagesData?.items || [];

  // Update conversation mutation
  const updateConversationMutation = useMutation({
    mutationFn: ({ id, title }: { id: number; title: string }) => 
      leoAgentAPI.updateConversation(id, { title }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leo', 'conversations'] });
      setEditingConversationId(null);
      setEditingTitle('');
      showToast({ message: 'Conversation renommée', type: 'success' });
    },
    onError: (error: any) => {
      const appError = handleApiError(error);
      showToast({ 
        message: appError.message || 'Erreur lors du renommage', 
        type: 'error' 
      });
    },
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: (text: string) => leoAgentAPI.query({
      message: text,
      conversation_id: activeConversation,
      provider,
    }),
    onSuccess: (data) => {
      setActiveConversation(data.conversation_id);
      queryClient.invalidateQueries({ queryKey: ['leo', 'conversations'] });
      queryClient.invalidateQueries({ queryKey: ['leo', 'messages', data.conversation_id] });
      setMessage('');
      scrollToBottom();
    },
    onError: (error: any) => {
      const appError = handleApiError(error);
      showToast({ 
        message: appError.message || 'Erreur lors de l\'envoi du message', 
        type: 'error' 
      });
    },
  });

  // Delete conversation mutation
  const deleteConversationMutation = useMutation({
    mutationFn: (conversationId: number) => leoAgentAPI.deleteConversation(conversationId),
    onSuccess: (_, conversationId) => {
      if (activeConversation === conversationId) {
        setActiveConversation(null);
      }
      queryClient.invalidateQueries({ queryKey: ['leo', 'conversations'] });
      showToast({ message: 'Conversation supprimée', type: 'success' });
    },
    onError: (error: any) => {
      const appError = handleApiError(error);
      showToast({ 
        message: appError.message || 'Erreur lors de la suppression', 
        type: 'error' 
      });
    },
  });

  // Delete all conversations
  const deleteAllConversations = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer toutes les conversations ?')) return;
    
    try {
      const results = await Promise.allSettled(
        conversations.map(conv => leoAgentAPI.deleteConversation(conv.id))
      );
      
      const failed = results.filter(r => r.status === 'rejected').length;
      const succeeded = results.filter(r => r.status === 'fulfilled').length;
      
      setActiveConversation(null);
      queryClient.invalidateQueries({ queryKey: ['leo', 'conversations'] });
      
      if (failed > 0) {
        showToast({ 
          message: `${succeeded} supprimées, ${failed} erreurs`, 
          type: 'warning' 
        });
      } else {
        showToast({ message: 'Toutes les conversations ont été supprimées', type: 'success' });
      }
    } catch (error: any) {
      const appError = handleApiError(error);
      showToast({ 
        message: appError.message || 'Erreur lors de la suppression', 
        type: 'error' 
      });
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (!message.trim() || sendMessageMutation.isPending) return;
    sendMessageMutation.mutate(message.trim());
  };

  const handleNewConversation = () => {
    setActiveConversation(null);
    setMessage('');
  };

  const handleSuggestionClick = (text: string) => {
    setMessage(text);
  };

  const handleRenameStart = (conv: ConversationWithLastMessage) => {
    setEditingConversationId(conv.id);
    setEditingTitle(conv.title);
  };

  const handleRenameSave = () => {
    if (editingConversationId && editingTitle.trim()) {
      updateConversationMutation.mutate({ id: editingConversationId, title: editingTitle.trim() });
    }
  };

  const handleRenameCancel = () => {
    setEditingConversationId(null);
    setEditingTitle('');
  };

  const handleCopyMessage = async (content: string, messageId: number) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(messageId);
      showToast({ message: 'Message copié', type: 'success' });
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (error) {
      showToast({ message: 'Erreur lors de la copie', type: 'error' });
    }
  };

  const loadMoreConversations = () => {
    setSkip(prev => prev + limit);
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (hours < 1) return 'À l\'instant';
    if (hours < 24) return `Il y a ${hours}h`;
    if (days === 1) return 'Hier';
    return `Il y a ${days}j`;
  };

  const getSuggestionColor = (color: string) => {
    switch (color) {
      case 'purple':
        return 'bg-[#523DC9]/10 border-[#523DC9]/30 text-[#523DC9] hover:bg-[#523DC9]/20';
      case 'blue':
        return 'bg-[#3B82F6]/10 border-[#3B82F6]/30 text-[#3B82F6] hover:bg-[#3B82F6]/20';
      case 'green':
        return 'bg-[#10B981]/10 border-[#10B981]/30 text-[#10B981] hover:bg-[#10B981]/20';
      case 'orange':
        return 'bg-[#F59E0B]/10 border-[#F59E0B]/30 text-[#F59E0B] hover:bg-[#F59E0B]/20';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-600 hover:bg-gray-200';
    }
  };

  const getLastMessage = (conv: ConversationWithLastMessage) => {
    if (conv.lastMessage) {
      return conv.lastMessage.length > 50 
        ? conv.lastMessage.substring(0, 50) + '...' 
        : conv.lastMessage;
    }
    return 'Nouvelle conversation';
  };

  return (
    <PageContainer className="flex flex-col h-full">
      {/* Hero Header with Aurora Borealis Gradient */}
      <div className="relative flex-shrink-0">
        <div className="absolute inset-0 bg-gradient-to-br from-[#5F2B75] via-[#523DC9] to-[#6B1817] opacity-90" />
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' /%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' /%3E%3C/svg%3E")',
          backgroundSize: '200px 200px'
        }} />
        
        <div className="relative px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  Leo
                </h1>
                <p className="text-white/80 text-sm">Votre assistant IA intelligent</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-white/20 text-white border-white/30">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span>En ligne</span>
                </div>
              </Badge>
              <Button 
                size="sm" 
                variant="outline" 
                className="text-white border-white/30 hover:bg-white/10"
                onClick={() => setShowSidebar(!showSidebar)}
              >
                <MessageSquare className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Conversations */}
        {showSidebar && (
          <div className="w-80 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex flex-col">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 space-y-3">
              <Button 
                className="w-full bg-[#523DC9] hover:bg-[#523DC9]/90 text-white"
                onClick={handleNewConversation}
              >
                <Plus className="w-4 h-4 mr-2" />
                Nouvelle conversation
              </Button>
              
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-full"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {conversationsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-[#523DC9]" />
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
                  {searchQuery ? 'Aucune conversation trouvée' : 'Aucune conversation'}
                </div>
              ) : (
                <>
                  {filteredConversations.map((conv) => (
                    <div key={conv.id} className="relative group">
                      {editingConversationId === conv.id ? (
                        <div className="w-full p-3 rounded-lg bg-white dark:bg-gray-800 border border-[#523DC9]/30">
                          <Input
                            value={editingTitle}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') handleRenameSave();
                              if (e.key === 'Escape') handleRenameCancel();
                            }}
                            className="mb-2"
                            autoFocus
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={handleRenameSave}
                              disabled={!editingTitle.trim() || updateConversationMutation.isPending}
                            >
                              Enregistrer
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleRenameCancel}
                            >
                              Annuler
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setActiveConversation(conv.id)}
                          className={`w-full p-3 rounded-lg text-left transition-all ${
                            activeConversation === conv.id
                              ? 'bg-[#523DC9]/10 border border-[#523DC9]/30'
                              : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-[#523DC9]/30'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-1">
                            <h3 className="font-semibold text-sm text-gray-900 dark:text-white line-clamp-1 pr-8">
                              {conv.title}
                            </h3>
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                            {getLastMessage(conv)}
                          </p>
                          <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-500">
                            <Clock className="w-3 h-3" />
                            <span>{formatTime(conv.updated_at)}</span>
                          </div>
                        </button>
                      )}
                      {editingConversationId !== conv.id && (
                        <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRenameStart(conv);
                            }}
                            className="p-1.5 rounded-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-blue-50 hover:border-blue-300"
                            title="Renommer"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm('Supprimer cette conversation ?')) {
                                deleteConversationMutation.mutate(conv.id);
                              }
                            }}
                            className="p-1.5 rounded-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-red-50 hover:border-red-300"
                            title="Supprimer"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-600" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {hasMore && !searchQuery && (
                    <div className="pt-2">
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={loadMoreConversations}
                        disabled={conversationsLoading}
                      >
                        {conversationsLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <ChevronDown className="w-4 h-4 mr-2" />
                        )}
                        Charger plus ({totalConversations - skip - limit} restantes)
                      </Button>
                    </div>
                  )}
                  
                  {totalConversations > 0 && (
                    <div className="pt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
                      {totalConversations} conversation{totalConversations > 1 ? 's' : ''} au total
                    </div>
                  )}
                </>
              )}
            </div>

            {conversations.length > 0 && (
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <Button 
                  variant="outline" 
                  className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={deleteAllConversations}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Effacer l'historique
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messagesLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-[#523DC9]" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full">
                <div className="p-4 rounded-2xl bg-[#523DC9]/10 border border-[#523DC9]/30 mb-4">
                  <Sparkles className="w-12 h-12 text-[#523DC9]" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Bonjour ! Je suis Leo
                </h2>
                <p className="text-gray-600 dark:text-gray-400 text-center max-w-md mb-8">
                  Votre assistant IA pour Nukleo ERP. Posez-moi des questions sur vos opportunités, contacts, projets et plus encore.
                </p>

                {/* Provider Selector */}
                <div className="mb-6 max-w-md w-full">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Fournisseur IA
                  </label>
                  <Select
                    value={provider}
                    onChange={(e) => setProvider(e.target.value as any)}
                    options={[
                      { value: 'auto', label: 'Auto (recommandé)' },
                      { value: 'openai', label: 'OpenAI' },
                      { value: 'anthropic', label: 'Anthropic (Claude)' },
                    ]}
                    className="w-full"
                  />
                </div>

                {/* Suggestions */}
                <div className="max-w-2xl w-full">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 text-center">
                    Suggestions pour commencer
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {mockSuggestions.map((suggestion, index) => {
                      const Icon = suggestion.icon;
                      return (
                        <button
                          key={index}
                          onClick={() => handleSuggestionClick(suggestion.text)}
                          className={`p-4 rounded-xl border transition-all text-left ${getSuggestionColor(suggestion.color)}`}
                        >
                          <div className="flex items-center gap-3">
                            <Icon className="w-5 h-5 flex-shrink-0" />
                            <span className="text-sm font-medium">{suggestion.text}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg: LeoMessage) => (
                  <MotionDiv key={msg.id} variant="slideUp" duration="fast">
                    <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-2xl ${msg.role === 'user' ? 'ml-12' : 'mr-12'}`}>
                        {msg.role === 'assistant' && (
                          <div className="flex items-center gap-2 mb-2">
                            <div className="p-1.5 rounded-lg bg-[#523DC9]/10 border border-[#523DC9]/30">
                              <Sparkles className="w-4 h-4 text-[#523DC9]" />
                            </div>
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">Leo</span>
                            <span className="text-xs text-gray-500 dark:text-gray-500">{formatTime(msg.created_at)}</span>
                          </div>
                        )}
                        {msg.role === 'user' && (
                          <div className="flex items-center gap-2 mb-2 justify-end">
                            <span className="text-xs text-gray-500 dark:text-gray-500">{formatTime(msg.created_at)}</span>
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">Vous</span>
                          </div>
                        )}
                        <div className={`relative group ${msg.role === 'user' ? '' : ''}`}>
                          <div className={`p-4 rounded-2xl ${
                            msg.role === 'user'
                              ? 'bg-[#523DC9] text-white'
                              : 'glass-card border border-[#A7A2CF]/20'
                          }`}>
                            <p className={`text-sm leading-relaxed whitespace-pre-line ${
                              msg.role === 'user' ? 'text-white' : 'text-gray-900 dark:text-white'
                            }`}>
                              {msg.content}
                            </p>
                          </div>
                          <button
                            onClick={() => handleCopyMessage(msg.content, msg.id)}
                            className={`absolute top-2 ${
                              msg.role === 'user' ? 'left-2' : 'right-2'
                            } p-1.5 rounded-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-50`}
                            title="Copier"
                          >
                            {copiedMessageId === msg.id ? (
                              <Check className="w-3.5 h-3.5 text-green-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5 text-gray-600" />
                            )}
                          </button>
                          {msg.metadata && Object.keys(msg.metadata).length > 0 && (
                            <button
                              onClick={() => setShowMetadata(prev => ({ ...prev, [msg.id]: !prev[msg.id] }))}
                              className="absolute bottom-2 right-2 p-1 rounded text-xs text-gray-500 hover:text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              Info
                            </button>
                          )}
                        </div>
                        {msg.metadata && showMetadata[msg.id] && (
                          <div className="mt-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs">
                            <div className="space-y-1">
                              {msg.metadata.model && (
                                <div><strong>Modèle:</strong> {String(msg.metadata.model)}</div>
                              )}
                              {msg.metadata.provider && (
                                <div><strong>Provider:</strong> {String(msg.metadata.provider)}</div>
                              )}
                              {msg.metadata.usage && typeof msg.metadata.usage === 'object' && (
                                <div>
                                  <strong>Usage:</strong>{' '}
                                  {Object.entries(msg.metadata.usage).map(([key, value]) => 
                                    `${key}: ${value}`
                                  ).join(', ')}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </MotionDiv>
                ))}
                
                {sendMessageMutation.isPending && (
                  <div className="flex justify-start">
                    <div className="max-w-2xl mr-12">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 rounded-lg bg-[#523DC9]/10 border border-[#523DC9]/30">
                          <Sparkles className="w-4 h-4 text-[#523DC9]" />
                        </div>
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">Leo</span>
                      </div>
                      <div className="glass-card border border-[#A7A2CF]/20 p-4 rounded-2xl">
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-[#523DC9]" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">Leo réfléchit...</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input Area */}
          <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
            <div className="max-w-4xl mx-auto">
              {messages.length > 0 && (
                <div className="mb-3 flex items-center justify-between">
                  <Select
                    value={provider}
                    onChange={(e) => setProvider(e.target.value as any)}
                    options={[
                      { value: 'auto', label: 'Auto (recommandé)' },
                      { value: 'openai', label: 'OpenAI' },
                      { value: 'anthropic', label: 'Anthropic (Claude)' },
                    ]}
                    className="w-48"
                    size="sm"
                  />
                </div>
              )}
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Posez une question à Leo..."
                    className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#523DC9]/50 focus:border-[#523DC9]"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !sendMessageMutation.isPending) {
                        handleSend();
                      }
                    }}
                    disabled={sendMessageMutation.isPending}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Button
                      size="sm"
                      className="bg-[#523DC9] hover:bg-[#523DC9]/90 text-white rounded-lg"
                      disabled={!message.trim() || sendMessageMutation.isPending}
                      onClick={handleSend}
                    >
                      {sendMessageMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-2 text-center">
                Leo peut faire des erreurs. Vérifiez les informations importantes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
