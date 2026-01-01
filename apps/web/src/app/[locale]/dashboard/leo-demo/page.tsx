'use client';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useState } from 'react';
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
  Users
} from 'lucide-react';
import { Button, Badge } from '@/components/ui';

// Mock data
const mockConversations = [
  {
    id: 1,
    title: 'Analyse des opportunités Q1',
    lastMessage: 'Voici un résumé des opportunités...',
    timestamp: '2024-01-15T10:30:00',
    messageCount: 8,
  },
  {
    id: 2,
    title: 'Rapport mensuel commercial',
    lastMessage: 'Le rapport a été généré avec succès',
    timestamp: '2024-01-14T15:20:00',
    messageCount: 5,
  },
  {
    id: 3,
    title: 'Stratégie pipeline 2024',
    lastMessage: 'Voici mes recommandations...',
    timestamp: '2024-01-13T09:15:00',
    messageCount: 12,
  },
];

const mockMessages = [
  {
    id: 1,
    role: 'assistant' as const,
    content: 'Bonjour ! Je suis Leo, votre assistant IA pour Nukleo ERP. Comment puis-je vous aider aujourd\'hui ?',
    timestamp: '2024-01-15T10:00:00',
  },
  {
    id: 2,
    role: 'user' as const,
    content: 'Peux-tu me donner un résumé de mes opportunités en cours ?',
    timestamp: '2024-01-15T10:01:00',
  },
  {
    id: 3,
    role: 'assistant' as const,
    content: 'Bien sûr ! Voici un résumé de vos opportunités en cours :\n\n**24 opportunités actives**\n- Valeur totale : 1 250 000 $\n- Valeur pondérée : 875 000 $\n- Probabilité moyenne : 70%\n\n**Top 3 opportunités :**\n1. Migration infrastructure cloud - CloudNet (85 000 $, 75%)\n2. Application mobile - InnoSoft (60 000 $, 80%)\n3. Refonte site web - TechCorp (45 000 $, 70%)\n\nSouhaitez-vous plus de détails sur une opportunité spécifique ?',
    timestamp: '2024-01-15T10:01:30',
  },
];

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

export default function LeoDemoPage() {
  const [activeConversation, setActiveConversation] = useState<number | null>(1);
  const [message, setMessage] = useState('');
  const [showSidebar, setShowSidebar] = useState(true);

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
              <Button className="w-full bg-[#523DC9] hover:bg-[#523DC9]/90 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Nouvelle conversation
              </Button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {mockConversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setActiveConversation(conv.id)}
                  className={`w-full p-3 rounded-lg text-left transition-all ${
                    activeConversation === conv.id
                      ? 'bg-[#523DC9]/10 border border-[#523DC9]/30'
                      : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-[#523DC9]/30'
                  }`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="font-semibold text-sm text-gray-900 dark:text-white line-clamp-1">
                      {conv.title}
                    </h3>
                    <Badge className="bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 text-xs">
                      {conv.messageCount}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1 mb-2">
                    {conv.lastMessage}
                  </p>
                  <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-500">
                    <Clock className="w-3 h-3" />
                    <span>{formatTime(conv.timestamp)}</span>
                  </div>
                </button>
              ))}
            </div>

            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <Button variant="outline" className="w-full text-red-600 hover:text-red-700 hover:bg-red-50">
                <Trash2 className="w-4 h-4 mr-2" />
                Effacer l'historique
              </Button>
            </div>
          </div>
        )}

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {mockMessages.map((msg) => (
              <MotionDiv key={msg.id} variant="slideUp" duration="fast">
                <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-2xl ${msg.role === 'user' ? 'ml-12' : 'mr-12'}`}>
                    {msg.role === 'assistant' && (
                      <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 rounded-lg bg-[#523DC9]/10 border border-[#523DC9]/30">
                          <Sparkles className="w-4 h-4 text-[#523DC9]" />
                        </div>
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">Leo</span>
                        <span className="text-xs text-gray-500 dark:text-gray-500">{formatTime(msg.timestamp)}</span>
                      </div>
                    )}
                    {msg.role === 'user' && (
                      <div className="flex items-center gap-2 mb-2 justify-end">
                        <span className="text-xs text-gray-500 dark:text-gray-500">{formatTime(msg.timestamp)}</span>
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

            {/* Suggestions */}
            {mockMessages.length <= 1 && (
              <div className="max-w-2xl mx-auto">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 text-center">
                  Suggestions pour commencer
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {mockSuggestions.map((suggestion, index) => {
                    const Icon = suggestion.icon;
                    return (
                      <button
                        key={index}
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
                      if (e.key === 'Enter' && message.trim()) {
                        // Handle send
                        setMessage('');
                      }
                    }}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Button
                      size="sm"
                      className="bg-[#523DC9] hover:bg-[#523DC9]/90 text-white rounded-lg"
                      disabled={!message.trim()}
                    >
                      <Send className="w-4 h-4" />
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
