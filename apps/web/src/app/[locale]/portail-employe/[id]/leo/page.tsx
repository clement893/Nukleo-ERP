'use client';

import { Bot, Send } from 'lucide-react';
import { Card, Button } from '@/components/ui';

export default function MonLeo() {
  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-[#5F2B75] via-[#523DC9] to-[#6B1817] opacity-90" />
        <div className="relative p-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
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

      <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20 h-[600px] flex flex-col">
        <div className="flex-1 overflow-y-auto space-y-4 mb-4">
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-[#523DC9] flex items-center justify-center flex-shrink-0">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
                <p>Bonjour ! Je suis Leo, votre assistant IA. Comment puis-je vous aider aujourd'hui ?</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Posez-moi une question..."
            className="flex-1 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-[#523DC9]"
          />
          <Button className="bg-[#523DC9] hover:bg-[#5F2B75] text-white">
            <Send className="w-5 h-5" />
          </Button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button className="px-4 py-2 text-sm rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
            Résumé de mes tâches
          </button>
          <button className="px-4 py-2 text-sm rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
            Mes deadlines cette semaine
          </button>
          <button className="px-4 py-2 text-sm rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
            Analyse de ma productivité
          </button>
        </div>
      </Card>
    </div>
  );
}
