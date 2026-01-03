# Plan d'Intégration : Leo dans le Wizard de Soumission

## 🎯 Objectif

Intégrer Leo de manière visible, accessible et contextuelle dans le wizard de création de soumission, en améliorant l'expérience utilisateur sur tous les appareils.

## 📋 Problèmes à Résoudre

1. ✅ **Leo est caché sur mobile** (`hidden lg:block`)
2. ✅ **Visibilité réduite** (bouton flottant nécessite un clic)
3. ✅ **Expérience fragmentée** entre desktop et mobile
4. ✅ **Contexte limité** passé à Leo

## 🚀 Solution Proposée

### Architecture en 3 Niveaux

```
┌─────────────────────────────────────────────────────────┐
│  Barre de Progression des Étapes    [🔮 Leo Assistant] │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────────────────┬────────────────────────┐ │
│  │                          │                       │ │
│  │   Contenu de l'Étape     │   Panel Leo (si       │ │
│  │   (Formulaire)           │    ouvert)            │ │
│  │                          │                       │ │
│  │   - Champs du formulaire │   - Suggestions      │ │
│  │   - Textareas            │   - Chat avec Leo    │ │
│  │   - Sélecteurs           │   - Génération auto  │ │
│  │                          │                       │ │
│  └──────────────────────────┴────────────────────────┘ │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  [Précédent]  [Sauvegarder]  [Suivant/Créer]          │
└─────────────────────────────────────────────────────────┘
```

## 📐 Implémentation Détaillée

### Étape 1 : Créer le Composant `LeoWizardPanel`

**Fichier** : `apps/web/src/components/commercial/LeoWizardPanel.tsx`

```tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, Button, Input, Badge } from '@/components/ui';
import { Loader2, Send, Sparkles, X, ChevronLeft, ChevronRight } from 'lucide-react';
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
    if (isOpen) {
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
    const stepNames = ['Page couverture', 'Contexte', 'Introduction', 'Mandate', 'Processus', 'Budget', 'Équipe'];
    const currentStepName = stepNames[currentStep] || '';
    const company = companies.find(c => c.id === formData.companyId);
    
    return {
      step: currentStepName,
      client: company?.name || formData.coverClient || '',
      title: formData.coverTitle || '',
      context: formData.context || '',
      introduction: formData.introduction || '',
      mandate: formData.mandate || '',
      objectives: formData.objectives || [],
      processSteps: formData.processSteps || [],
      budgetTotal: formData.budgetTotal || 0,
      teamMembers: formData.teamMembers || [],
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
      
      const prompt = `Contexte de la soumission : ${contextString}\n\nDonnées actuelles : ${JSON.stringify(context, null, 2)}\n\nQuestion de l'utilisateur : ${text}\n\nAide-moi à rédiger une réponse professionnelle et pertinente pour cette soumission.`;

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

  // Mode floating (mobile) - bouton compact
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
        'flex flex-col transition-all duration-300',
        mode === 'sidebar' && 'w-80 h-full',
        mode === 'panel' && 'w-full h-[500px]',
        mode === 'floating' && 'fixed bottom-6 right-6 z-40 w-96 h-[600px] shadow-2xl',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <span className="font-semibold text-sm">Leo Assistant</span>
            <p className="text-xs text-muted-foreground">
              Étape {currentStep + 1} : {['Couverture', 'Contexte', 'Introduction', 'Mandat', 'Processus', 'Budget', 'Équipe'][currentStep]}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="h-8 w-8 p-0"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full py-8">
            <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
            <h3 className="text-sm font-semibold text-foreground mb-2 text-center">
              Je suis Leo, votre assistant
            </h3>
            <p className="text-xs text-muted-foreground mb-4 text-center">
              Choisissez une suggestion ou posez une question
            </p>
            <div className="space-y-2 w-full">
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
                <span className="text-xs">U</span>
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
          />
          <Button
            onClick={() => sendMessage()}
            disabled={!input.trim() || isLoading}
            size="sm"
            className="flex items-center gap-1"
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
```

### Étape 2 : Modifier `SubmissionWizard.tsx`

**Modifications à apporter** :

1. **Ajouter l'état pour gérer Leo** :
```tsx
const [showLeo, setShowLeo] = useState(true); // Par défaut ouvert sur desktop
```

2. **Ajouter le bouton dans la barre de progression** :
```tsx
{/* Progress Steps */}
<div className="flex items-center justify-between border-b border-border pb-4 flex-shrink-0">
  <div className="flex items-center w-full min-w-max">
    {/* Étapes existantes */}
  </div>
  
  {/* Bouton Leo */}
  <Button
    variant="outline"
    size="sm"
    onClick={() => setShowLeo(!showLeo)}
    className="ml-4 flex-shrink-0"
  >
    <Sparkles className="w-4 h-4 mr-2" />
    <span className="hidden sm:inline">Assistant Leo</span>
    {showLeo && <ChevronRight className="w-4 h-4 ml-2" />}
    {!showLeo && <ChevronLeft className="w-4 h-4 ml-2" />}
  </Button>
</div>
```

3. **Modifier le layout pour intégrer Leo** :
```tsx
{/* Main Content Area */}
{isPageMode ? (
  <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-6">
    {/* Step Content */}
    <div className={clsx(
      'flex-1 min-h-0 flex flex-col transition-all duration-300',
      showLeo && 'lg:mr-6'
    )}>
      <div className="flex-1 overflow-y-auto pr-0 lg:pr-4">
        {renderStep()}
      </div>
    </div>

    {/* Leo Panel - Desktop Sidebar */}
    {showLeo && (
      <div className="hidden lg:block w-80 flex-shrink-0 border-l border-border pl-6">
        <div className="sticky top-6">
          <LeoWizardPanel
            isOpen={showLeo}
            onToggle={() => setShowLeo(!showLeo)}
            currentStep={currentStep}
            formData={formData}
            companies={companies}
            onTextGenerated={handleTextGenerated}
            mode="sidebar"
          />
        </div>
      </div>
    )}

    {/* Leo Panel - Mobile/Tablet */}
    <div className="lg:hidden">
      <LeoWizardPanel
        isOpen={showLeo}
        onToggle={() => setShowLeo(!showLeo)}
        currentStep={currentStep}
        formData={formData}
        companies={companies}
        onTextGenerated={handleTextGenerated}
        mode={showLeo ? 'panel' : 'floating'}
      />
    </div>
  </div>
) : (
  // Mode modal existant
)}
```

### Étape 3 : Améliorer le Contexte

**Fonction enrichie** :
```tsx
const getEnrichedContext = () => {
  const stepNames = ['Page couverture', 'Contexte', 'Introduction', 'Mandat', 'Processus', 'Budget', 'Équipe'];
  const company = companies.find(c => c.id === formData.companyId);
  
  return {
    step: stepNames[currentStep],
    client: company?.name || formData.coverClient || '',
    companyInfo: company ? {
      name: company.name,
      email: company.email,
      phone: company.phone,
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
```

## 📱 Responsive Design

### Desktop (≥1024px)
- Layout 2 colonnes : Formulaire (flex-1) | Leo (w-80)
- Leo toujours visible dans sidebar
- Panel collapsible avec animation

### Tablet (768px - 1023px)
- Layout colonne unique
- Leo en panneau coulissant depuis la droite
- Overlay pour le focus

### Mobile (<768px)
- Layout colonne unique
- Leo en accordéon en bas
- Bouton sticky pour ouvrir/fermer

## ✅ Checklist d'Implémentation

- [ ] Créer le composant `LeoWizardPanel.tsx`
- [ ] Modifier `SubmissionWizard.tsx` pour intégrer Leo
- [ ] Ajouter le bouton dans la barre de progression
- [ ] Implémenter le layout responsive
- [ ] Ajouter les suggestions contextuelles par étape
- [ ] Enrichir le contexte passé à Leo
- [ ] Tester sur différentes tailles d'écran
- [ ] Tester l'accessibilité
- [ ] Optimiser les performances
- [ ] Documenter les nouvelles fonctionnalités

## 🎨 Design Tokens

- **Couleur Leo** : `primary-600` / `primary-400` (dark)
- **Largeur sidebar** : `w-80` (320px)
- **Hauteur panel mobile** : `h-[500px]`
- **Animation** : `transition-all duration-300`
- **Z-index** : `z-40` pour le panel flottant

## 📊 Métriques à Suivre

1. Taux d'ouverture de Leo (% d'utilisateurs qui ouvrent Leo)
2. Nombre de suggestions utilisées
3. Temps moyen de création de soumission
4. Satisfaction utilisateur (feedback)
