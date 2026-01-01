'use client';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useState, useEffect, useRef } from 'react';
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
  Loader2
} from 'lucide-react';
import { Button, Badge, useToast } from '@/components/ui';
import { leoAgentAPI, type LeoMessage, type LeoConversation } from '@/lib/api/leo-agent';

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

export default function LeoPage() {
  const [activeConversation, setActiveConversation] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [showSidebar, setShowSidebar] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  // Fetch conversations
  const { data: conversationsData, isLoading: conversationsLoading } = useQuery({
    queryKey: ['leo', 'conversations'],
    queryFn: () => leoAgentAPI.listConversations({ limit: 50 }),
  });

  const conversations = conversationsData?.items || [];

  // Fetch messages for active conversation
  const { data: messagesData, isLoading: messagesLoading } = useQuery({
    queryKey: ['leo', 'messages', activeConversation],
    queryFn: () => activeConversation ? leoAgentAPI.getConversationMessages(activeConversation) : null,
    enabled: !!activeConversation,
  });

  const messages = messagesData?.items || [];

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: (text: string) => leoAgentAPI.query({
      message: text,
      conversation_id: activeConversation,
    }),
    onSuccess: (data) => {
      setActiveConversation(data.conversation_id);
      queryClient.invalidateQueries({ queryKey: ['leo', 'conversations'] });
      queryClient.invalidateQueries({ queryKey: ['leo', 'messages', data.conversation_id] });
      setMessage('');
      scrollToBottom();
    },
    onError: (error: any) => {
      showToast({ 
        message: error?.message || 'Erreur lors de l\'envoi du message', 
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
      showToast({ 
        message: error?.message || 'Erreur lors de la suppression', 
        type: 'error' 
      });
    },
  });

  // Delete all conversations
  const deleteAllConversations = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer toutes les conversations ?')) return;
    
    try {
      await Promise.all(conversations.map(conv => leoAgentAPI.deleteConversation(conv.id)));
      setActiveConversation(null);
      queryClient.invalidateQueries({ queryKey: ['leo', 'conversations'] });
      showToast({ message: 'Toutes les conversations ont été supprimées', type: 'success' });
    } catch (error: any) {
      showToast({ 
        message: error?.message || 'Erreur lors de la suppression', 
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
  };

  const handleSuggestionClick = (text: string) => {
    setMessage(text);
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

  const getLastMessage = (conv: LeoConversation) => {
    // We don't have last message in conversation object, so we'll use a placeholder
    return 'Conversation avec Leo';
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
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <Button 
                className="w-full bg-[#523DC9] hover:bg-[#523DC9]/90 text-white"
                onClick={handleNewConversation}
              >
                <Plus className="w-4 h-4 mr-2" />
                Nouvelle conversation
              </Button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {conversationsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-[#523DC9]" />
                </div>
              ) : conversations.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
                  Aucune conversation
                </div>
              ) : (
                conversations.map((conv) => (
                  <div key={conv.id} className="relative group">
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
                      <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1 mb-2">
                        {getLastMessage(conv)}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-500">
                        <Clock className="w-3 h-3" />
                        <span>{formatTime(conv.updated_at)}</span>
                      </div>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('Supprimer cette conversation ?')) {
                          deleteConversationMutation.mutate(conv.id);
                        }
                      }}
                      className="absolute top-3 right-3 p-1.5 rounded-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 hover:border-red-300"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-600" />
                    </button>
                  </div>
                ))
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
                {messages.map((msg) => (
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
