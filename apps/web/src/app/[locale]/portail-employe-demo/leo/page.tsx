'use client';

import { Bot, Send, Sparkles } from 'lucide-react';
import { Card, Button } from '@/components/ui';
import { useState } from 'react';

export default function MonLeoPage() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Bonjour Ricardo ! Je suis Leo, votre assistant IA personnel. Comment puis-je vous aider aujourd\'hui ?' },
    { role: 'user', content: 'Quels sont mes projets en cours ?' },
    { role: 'assistant', content: 'Vous avez 3 projets actifs : Projet Alpha (65%), Projet Beta (40%) et Projet Gamma (85%). Souhaitez-vous plus de détails sur l\'un d\'eux ?' },
  ]);

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-[#5F2B75] via-[#523DC9] to-[#6B1817] opacity-90" />
        <div className="relative p-8">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
              <Bot className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-white mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Mon Leo
              </h1>
              <p className="text-white/80 text-lg">Votre assistant IA personnel</p>
            </div>
          </div>
        </div>
      </div>

      <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20 min-h-[500px] flex flex-col">
        <div className="flex-1 space-y-4 mb-4 overflow-y-auto">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-4 rounded-lg ${
                msg.role === 'user' 
                  ? 'bg-[#523DC9] text-white' 
                  : 'bg-gray-100 dark:bg-gray-800'
              }`}>
                <p className="text-sm">{msg.content}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Posez votre question à Leo..."
            className="flex-1 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
          />
          <Button className="bg-[#523DC9] hover:bg-[#523DC9]/90 text-white">
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass-card p-4 rounded-xl border border-[#A7A2CF]/20 cursor-pointer hover:shadow-lg transition-all">
          <Sparkles className="w-5 h-5 text-[#523DC9] mb-2" />
          <h3 className="font-semibold mb-1">Résumé de la semaine</h3>
          <p className="text-xs text-gray-600 dark:text-gray-400">Obtenez un résumé de votre activité</p>
        </Card>
        <Card className="glass-card p-4 rounded-xl border border-[#A7A2CF]/20 cursor-pointer hover:shadow-lg transition-all">
          <Sparkles className="w-5 h-5 text-[#523DC9] mb-2" />
          <h3 className="font-semibold mb-1">Suggestions de tâches</h3>
          <p className="text-xs text-gray-600 dark:text-gray-400">Priorisez vos tâches efficacement</p>
        </Card>
        <Card className="glass-card p-4 rounded-xl border border-[#A7A2CF]/20 cursor-pointer hover:shadow-lg transition-all">
          <Sparkles className="w-5 h-5 text-[#523DC9] mb-2" />
          <h3 className="font-semibold mb-1">Analyse de performance</h3>
          <p className="text-xs text-gray-600 dark:text-gray-400">Insights sur votre productivité</p>
        </Card>
      </div>
    </div>
  );
}
