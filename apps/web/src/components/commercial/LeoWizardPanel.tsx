'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, Button, Input, Badge } from '@/components/ui';
import { Loader2, Send, Sparkles, X } from 'lucide-react';
import { clsx } from 'clsx';
import { leoAgentAPI, type LeoMessage } from '@/lib/api/leo-agent';
import { getErrorMessage } from '@/lib/errors';
import { useToast } from '@/components/ui';
import type { SubmissionWizardData } from './SubmissionWizard';
import type { Company } from '@/lib/api/companies';

interface LeoWizardPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  currentStep: number;
  formData: SubmissionWizardData;
  companies: Company[];
  onTextGenerated: (text: string) => void;
  mode?: 'sidebar' | 'panel' | 'floating';
  className?: string;
}

const STEP_SUGGESTIONS: Record<number, string[]> = {
  0: [
    'Génère un titre accrocheur pour cette soumission',
    'Crée un sous-titre professionnel',
    'Suggère une date de présentation appropriée',
  ],
  1: [
    'Rédige une description du contexte du projet',
    'Analyse les besoins du client',
    'Décris la situation actuelle',
  ],
  2: [
    'Écris une introduction engageante',
    'Structure l\'introduction de manière professionnelle',
    'Crée une accroche qui capte l\'attention',
  ],
  3: [
    'Définis les objectifs du projet',
    'Décris le périmètre du mandat',
    'Liste les livrables attendus',
  ],
  4: [
    'Détaille les étapes du processus',
    'Estime les durées pour chaque étape',
    'Décris la méthodologie de travail',
  ],
  5: [
    'Suggère des postes budgétaires pertinents',
    'Calcule les totaux automatiquement',
    'Propose une répartition budgétaire équilibrée',
  ],
  6: [
    'Décris les rôles de l\'équipe',
    'Présente les compétences nécessaires',
    'Suggère une structure d\'équipe optimale',
  ],
};

const STEP_NAMES = ['Couverture', 'Contexte', 'Introduction', 'Mandat', 'Processus', 'Budget', 'Équipe'];

export function LeoWizardPanel({
  isOpen,
  onToggle,
  currentStep,
  formData,
  companies,
  onTextGenerated,
  mode = 'sidebar',
  className = '',
}: LeoWizardPanelProps) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<LeoMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  // Auto-scroll to bottom
  useEffect(() => {
    if (isOpen && messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Build enriched context
  const getEnrichedContext = () => {
    const currentStepName = STEP_NAMES[currentStep] || '';
    const company = companies.find(c => c.id === formData.companyId);
    
    return {
      step: currentStepName,
      client: company?.name || formData.coverClient || '',
      companyInfo: company ? {
        name: company.name,
        email: company.email || '',
        phone: company.phone || '',
      } : null,
      title: formData.coverTitle || '',
      context: formData.context || '',
      introduction: formData.introduction || '',
      mandate: formData.mandate || '',
      objectives: formData.objectives || [],
      processSteps: formData.processSteps || [],
      budgetItems: formData.budgetItems || [],
      budgetTotal: formData.budgetTotal || 0,
      teamMembers: formData.teamMembers || [],
      deadline: formData.deadline || null,
    };
  };

  const sendMessage = async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text || isLoading) return;

    setInput('');
    setIsLoading(true);

    const tempUserMessage: LeoMessage = {
      id: Date.now(),
      conversation_id: conversationId || 0,
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMessage]);

    try {
      const context = getEnrichedContext();
      const contextString = `Étape actuelle : ${context.step}${context.client ? ` - Client : ${context.client}` : ''}${context.title ? ` - Titre : ${context.title}` : ''}`;
      
      // Build a more detailed prompt with context
      const prompt = `Contexte de la soumission : ${contextString}\n\nDonnées actuelles du formulaire : ${JSON.stringify(context, null, 2)}\n\nQuestion de l'utilisateur : ${text}\n\nAide-moi à rédiger une réponse professionnelle et pertinente pour cette soumission. Réponds de manière concise et actionnable.`;

      const response = await leoAgentAPI.query({
        message: prompt,
        conversation_id: conversationId || undefined,
        provider: 'auto',
      });

      if (!conversationId && response.conversation_id) {
        setConversationId(response.conversation_id);
      }

      if (response.conversation_id) {
        const messagesResponse = await leoAgentAPI.getConversationMessages(response.conversation_id);
        setMessages(messagesResponse.items);
      }
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      showToast({
        message: errorMessage || 'Erreur lors de la communication avec Leo',
        type: 'error',
      });
      setMessages((prev) => prev.filter((msg) => msg.id !== tempUserMessage.id));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleUseText = (text: string) => {
    onTextGenerated(text);
    showToast({
      message: 'Texte inséré dans le formulaire',
      type: 'success',
    });
  };

  const suggestions = STEP_SUGGESTIONS[currentStep] || [];

  // Mode floating (mobile) - bouton compact quand fermé
  if (mode === 'floating' && !isOpen) {
    return (
      <Button
        onClick={onToggle}
        variant="outline"
        className={clsx('fixed bottom-6 right-6 z-40 shadow-lg', className)}
        size="lg"
      >
        <Sparkles className="w-5 h-5 mr-2" />
        Assistant Leo
        {messages.length > 0 && (
          <Badge variant="default" className="ml-2">
            {messages.length}
          </Badge>
        )}
      </Button>
    );
  }

  // Panel ouvert
  return (
    <Card
      className={clsx(
        'flex flex-col transition-all duration-300 bg-background',
        mode === 'sidebar' && 'w-full h-full border-0 shadow-none',
        mode === 'panel' && 'w-full h-[500px]',
        mode === 'floating' && 'fixed bottom-6 right-6 z-40 w-96 h-[600px] shadow-2xl',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-4 h-4 text-primary-600 dark:text-primary-400" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="font-semibold text-sm block truncate">Leo Assistant</span>
            <p className="text-xs text-muted-foreground truncate">
              Étape {currentStep + 1} : {STEP_NAMES[currentStep]}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="h-8 w-8 p-0 flex-shrink-0"
          aria-label="Fermer l'assistant Leo"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full py-8">
            <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
            <h3 className="text-sm font-semibold text-foreground mb-2 text-center">
              Je suis Leo, votre assistant
            </h3>
            <p className="text-xs text-muted-foreground mb-4 text-center px-4">
              Choisissez une suggestion ou posez une question pour cette étape
            </p>
            <div className="space-y-2 w-full max-w-md">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => sendMessage(suggestion)}
                  disabled={isLoading}
                  className="w-full text-left px-3 py-2 rounded-lg border border-border bg-background hover:bg-muted transition-colors text-xs text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={clsx(
              'flex gap-3',
              message.role === 'user' ? 'justify-end' : 'justify-start'
            )}
          >
            {message.role === 'assistant' && (
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-primary-600 dark:text-primary-400" />
              </div>
            )}

            <div
              className={clsx(
                'max-w-[85%] rounded-lg px-3 py-2 text-sm',
                message.role === 'user'
                  ? 'bg-primary-600 text-white'
                  : 'bg-muted text-foreground'
              )}
            >
              <div className="whitespace-pre-wrap break-words">{message.content}</div>
              {message.role === 'assistant' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleUseText(message.content)}
                  className="mt-2 h-6 text-xs"
                >
                  Utiliser ce texte
                </Button>
              )}
            </div>

            {message.role === 'user' && (
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <span className="text-xs font-medium">U</span>
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary-600 dark:text-primary-400" />
            </div>
            <div className="bg-muted rounded-lg px-3 py-2">
              <div className="flex items-center gap-2">
                <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Leo réfléchit...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-border p-3 bg-background">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Demandez à Leo..."
            disabled={isLoading}
            className="flex-1 text-sm"
            aria-label="Message pour Leo"
          />
          <Button
            onClick={() => sendMessage()}
            disabled={!input.trim() || isLoading}
            size="sm"
            className="flex items-center gap-1"
            aria-label="Envoyer le message"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}
