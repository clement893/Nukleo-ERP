'use client';

import { useState } from 'react';
import { 
  Palette,
  Type,
  Sparkles,
  Check,
  AlertCircle,
  Info,
  AlertTriangle,
  Star,
  Heart,
  Zap,
  Copy
} from 'lucide-react';

export default function BrandDemoPage() {
  const [copiedColor, setCopiedColor] = useState<string | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedColor(label);
    setTimeout(() => setCopiedColor(null), 2000);
  };

  return (
    <div className="min-h-screen p-6">
      {/* Hero Header with Aurora Borealis */}
      <div className="relative mb-8 rounded-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#5F2B75] via-[#523DC9] to-[#6B1817] opacity-90" />
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' /%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' /%3E%3C/svg%3E")',
          backgroundSize: '200px 200px'
        }} />
        
        <div className="relative p-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Nukleo Brand System
              </h1>
              <p className="text-white/80 text-lg mt-1">
                L'identité de l'Intelligence - Guide complet pour l'application du brand
              </p>
            </div>
          </div>
          
          <div className="mt-6 flex flex-wrap gap-3">
            <div className="px-4 py-2 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 text-white text-sm">
              ✨ Design System v1.0
            </div>
            <div className="px-4 py-2 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 text-white text-sm">
              🎨 6 Couleurs principales
            </div>
            <div className="px-4 py-2 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 text-white text-sm">
              🔤 2 Typographies
            </div>
            <div className="px-4 py-2 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 text-white text-sm">
              🌌 Gradients Aurora
            </div>
          </div>
        </div>
      </div>

      {/* Section 1: Palette de Couleurs */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-6">
          <Palette className="w-6 h-6 text-[#523DC9]" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Palette de Couleurs</h2>
        </div>

        {/* Couleurs Principales */}
        <div className="glass-card p-6 rounded-xl mb-6 border border-[#A7A2CF]/20">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Couleurs Principales</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Nukleo Purple */}
            <div className="space-y-3">
              <div 
                className="h-32 rounded-xl border-2 border-gray-200 dark:border-gray-700 cursor-pointer hover:scale-105 transition-all relative overflow-hidden group"
                style={{ backgroundColor: '#523DC9' }}
                onClick={() => copyToClipboard('#523DC9', 'Nukleo Purple')}
              >
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-all">
                  <Copy className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-all" />
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Nukleo Purple</h4>
                <div className="flex items-center justify-between text-sm">
                  <code className="text-[#523DC9] font-mono">#523DC9</code>
                  {copiedColor === 'Nukleo Purple' && (
                    <span className="text-green-600 dark:text-green-400 flex items-center gap-1">
                      <Check className="w-4 h-4" /> Copié
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Boutons, liens, accents majeurs
                </p>
              </div>
            </div>

            {/* Deep Violet */}
            <div className="space-y-3">
              <div 
                className="h-32 rounded-xl border-2 border-gray-200 dark:border-gray-700 cursor-pointer hover:scale-105 transition-all relative overflow-hidden group"
                style={{ backgroundColor: '#5F2B75' }}
                onClick={() => copyToClipboard('#5F2B75', 'Deep Violet')}
              >
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-all">
                  <Copy className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-all" />
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Deep Violet</h4>
                <div className="flex items-center justify-between text-sm">
                  <code className="text-[#5F2B75] font-mono">#5F2B75</code>
                  {copiedColor === 'Deep Violet' && (
                    <span className="text-green-600 dark:text-green-400 flex items-center gap-1">
                      <Check className="w-4 h-4" /> Copié
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Gradients, fonds riches
                </p>
              </div>
            </div>

            {/* Dark Matter */}
            <div className="space-y-3">
              <div 
                className="h-32 rounded-xl border-2 border-gray-200 dark:border-gray-700 cursor-pointer hover:scale-105 transition-all relative overflow-hidden group"
                style={{ backgroundColor: '#291919' }}
                onClick={() => copyToClipboard('#291919', 'Dark Matter')}
              >
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-all">
                  <Copy className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-all" />
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Dark Matter</h4>
                <div className="flex items-center justify-between text-sm">
                  <code className="text-gray-600 dark:text-gray-400 font-mono">#291919</code>
                  {copiedColor === 'Dark Matter' && (
                    <span className="text-green-600 dark:text-green-400 flex items-center gap-1">
                      <Check className="w-4 h-4" /> Copié
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Fond principal, surfaces sombres
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Couleurs Secondaires */}
        <div className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Couleurs Secondaires</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Crimson Red */}
            <div className="space-y-3">
              <div 
                className="h-32 rounded-xl border-2 border-gray-200 dark:border-gray-700 cursor-pointer hover:scale-105 transition-all relative overflow-hidden group"
                style={{ backgroundColor: '#6B1817' }}
                onClick={() => copyToClipboard('#6B1817', 'Crimson Red')}
              >
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-all">
                  <Copy className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-all" />
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Crimson Red</h4>
                <div className="flex items-center justify-between text-sm">
                  <code className="text-[#6B1817] font-mono">#6B1817</code>
                  {copiedColor === 'Crimson Red' && (
                    <span className="text-green-600 dark:text-green-400 flex items-center gap-1">
                      <Check className="w-4 h-4" /> Copié
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Accents forts, alertes, énergie
                </p>
              </div>
            </div>

            {/* Soft Lavender */}
            <div className="space-y-3">
              <div 
                className="h-32 rounded-xl border-2 border-gray-200 dark:border-gray-700 cursor-pointer hover:scale-105 transition-all relative overflow-hidden group"
                style={{ backgroundColor: '#A7A2CF' }}
                onClick={() => copyToClipboard('#A7A2CF', 'Soft Lavender')}
              >
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-all">
                  <Copy className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-all" />
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Soft Lavender</h4>
                <div className="flex items-center justify-between text-sm">
                  <code className="text-[#A7A2CF] font-mono">#A7A2CF</code>
                  {copiedColor === 'Soft Lavender' && (
                    <span className="text-green-600 dark:text-green-400 flex items-center gap-1">
                      <Check className="w-4 h-4" /> Copié
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Texte secondaire, bordures subtiles
                </p>
              </div>
            </div>

            {/* Pure White */}
            <div className="space-y-3">
              <div 
                className="h-32 rounded-xl border-2 border-gray-200 dark:border-gray-700 cursor-pointer hover:scale-105 transition-all relative overflow-hidden group"
                style={{ backgroundColor: '#FFFFFF' }}
                onClick={() => copyToClipboard('#FFFFFF', 'Pure White')}
              >
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-all">
                  <Copy className="w-6 h-6 text-gray-900 opacity-0 group-hover:opacity-100 transition-all" />
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Pure White</h4>
                <div className="flex items-center justify-between text-sm">
                  <code className="text-gray-600 dark:text-gray-400 font-mono">#FFFFFF</code>
                  {copiedColor === 'Pure White' && (
                    <span className="text-green-600 dark:text-green-400 flex items-center gap-1">
                      <Check className="w-4 h-4" /> Copié
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Texte principal, icônes, contraste
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Gradients */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Gradients Signature</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Aurora Borealis */}
          <div className="glass-card rounded-xl overflow-hidden border border-[#A7A2CF]/20">
            <div className="h-48 bg-gradient-to-br from-[#5F2B75] via-[#523DC9] to-[#6B1817] relative">
              <div className="absolute inset-0 opacity-20" style={{
                backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' /%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' /%3E%3C/svg%3E")',
                backgroundSize: '200px 200px'
              }} />
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Aurora Borealis</h3>
              <code className="text-xs text-gray-600 dark:text-gray-400 font-mono block mb-2">
                bg-gradient-to-br from-[#5F2B75] via-[#523DC9] to-[#6B1817]
              </code>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Arrière-plans héro, couvertures, headers
              </p>
            </div>
          </div>

          {/* Texture Grain */}
          <div className="glass-card rounded-xl overflow-hidden border border-[#A7A2CF]/20">
            <div className="h-48 bg-gradient-to-br from-[#523DC9] to-[#5F2B75] relative">
              <div className="absolute inset-0 opacity-30" style={{
                backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' /%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' /%3E%3C/svg%3E")',
                backgroundSize: '200px 200px'
              }} />
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Texture Grain</h3>
              <code className="text-xs text-gray-600 dark:text-gray-400 font-mono block mb-2">
                bg-gradient + SVG noise filter
              </code>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Profondeur tactile, surfaces larges
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Typographie */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-6">
          <Type className="w-6 h-6 text-[#523DC9]" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Typographie</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Space Grotesk */}
          <div className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Space Grotesk</h3>
            <div className="space-y-4">
              <div>
                <p className="text-4xl font-black text-[#523DC9]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  Nukleo
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  Titres, headings, emphase forte
                </p>
              </div>
              <div className="pt-4 border-t border-[#A7A2CF]/20">
                <p className="text-2xl font-bold text-gray-900 dark:text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  L'identité de l'Intelligence
                </p>
              </div>
            </div>
          </div>

          {/* Inter */}
          <div className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Inter</h3>
            <div className="space-y-4">
              <div>
                <p className="text-lg text-gray-900 dark:text-white">
                  Notre identité visuelle n'est pas juste une décoration. C'est le reflet de notre mission.
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  Corps de texte, paragraphes, descriptions
                </p>
              </div>
              <div className="pt-4 border-t border-[#A7A2CF]/20">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Lisible, neutre, professionnel. Poids: Regular, Medium, SemiBold
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 4: Composants */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Composants UI</h2>

        {/* Boutons */}
        <div className="glass-card p-6 rounded-xl mb-6 border border-[#A7A2CF]/20">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Boutons</h3>
          
          <div className="flex flex-wrap gap-4">
            <button className="px-6 py-3 rounded-xl bg-[#523DC9] text-white hover:bg-[#5F2B75] transition-all hover:scale-105 font-medium">
              Primaire
            </button>
            
            <button className="px-6 py-3 rounded-xl bg-[#523DC9]/10 text-[#523DC9] hover:bg-[#523DC9]/20 transition-all hover:scale-105 font-medium border border-[#523DC9]/30">
              Secondaire
            </button>
            
            <button className="px-6 py-3 rounded-xl bg-white/10 backdrop-blur-sm text-gray-900 dark:text-white hover:bg-white/20 transition-all hover:scale-105 font-medium border border-[#A7A2CF]/30">
              Ghost
            </button>
            
            <button className="px-6 py-3 rounded-xl bg-[#6B1817] text-white hover:bg-[#6B1817]/90 transition-all hover:scale-105 font-medium">
              Danger
            </button>
            
            <button className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#5F2B75] to-[#523DC9] text-white hover:opacity-90 transition-all hover:scale-105 font-medium">
              Gradient
            </button>
          </div>
        </div>

        {/* Badges */}
        <div className="glass-card p-6 rounded-xl mb-6 border border-[#A7A2CF]/20">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Badges</h3>
          
          <div className="flex flex-wrap gap-3">
            <span className="px-3 py-1 rounded-lg bg-[#523DC9]/10 text-[#523DC9] border border-[#523DC9]/30 text-sm font-medium">
              Primaire
            </span>
            
            <span className="px-3 py-1 rounded-lg bg-[#5F2B75]/10 text-[#5F2B75] border border-[#5F2B75]/30 text-sm font-medium">
              Secondaire
            </span>
            
            <span className="px-3 py-1 rounded-lg bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/30 text-sm font-medium flex items-center gap-1">
              <Check className="w-4 h-4" /> Succès
            </span>
            
            <span className="px-3 py-1 rounded-lg bg-[#6B1817]/10 text-[#6B1817] border border-[#6B1817]/30 text-sm font-medium flex items-center gap-1">
              <AlertCircle className="w-4 h-4" /> Erreur
            </span>
            
            <span className="px-3 py-1 rounded-lg bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/30 text-sm font-medium flex items-center gap-1">
              <AlertTriangle className="w-4 h-4" /> Attention
            </span>
            
            <span className="px-3 py-1 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30 text-sm font-medium flex items-center gap-1">
              <Info className="w-4 h-4" /> Info
            </span>
          </div>
        </div>

        {/* Cards */}
        <div className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Cards</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card Standard */}
            <div className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20 hover:scale-[1.02] transition-all">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-xl bg-[#523DC9]/10 border border-[#523DC9]/30">
                  <Star className="w-6 h-6 text-[#523DC9]" />
                </div>
                <h4 className="font-semibold text-gray-900 dark:text-white">Card Standard</h4>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Glassmorphism avec bordure Soft Lavender
              </p>
            </div>

            {/* Card avec Gradient */}
            <div className="relative rounded-xl overflow-hidden hover:scale-[1.02] transition-all">
              <div className="absolute inset-0 bg-gradient-to-br from-[#5F2B75] to-[#523DC9] opacity-90" />
              <div className="relative p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30">
                    <Heart className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="font-semibold text-white">Card Gradient</h4>
                </div>
                <p className="text-sm text-white/80">
                  Aurora Borealis pour impact visuel fort
                </p>
              </div>
            </div>

            {/* Card Hover Effect */}
            <div className="glass-card p-6 rounded-xl border border-[#523DC9]/30 hover:border-[#523DC9] hover:shadow-lg hover:shadow-[#523DC9]/20 transition-all group">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-xl bg-[#523DC9]/10 border border-[#523DC9]/30 group-hover:bg-[#523DC9] transition-all">
                  <Zap className="w-6 h-6 text-[#523DC9] group-hover:text-white transition-all" />
                </div>
                <h4 className="font-semibold text-gray-900 dark:text-white">Card Interactive</h4>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Hover pour voir l'effet
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Section 5: Guide d'Application */}
      <div className="glass-card p-8 rounded-xl border border-[#A7A2CF]/20">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Guide d'Application</h2>
        
        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-lg bg-[#523DC9]/10 border border-[#523DC9]/30 flex-shrink-0">
              <Check className="w-5 h-5 text-[#523DC9]" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">1. Remplacer la palette bleue par les violets Nukleo</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Utiliser <code className="px-2 py-1 rounded bg-[#523DC9]/10 text-[#523DC9] font-mono">#523DC9</code> pour tous les boutons primaires et liens. 
                Remplacer les bleus génériques par les violets du brand.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="p-2 rounded-lg bg-[#523DC9]/10 border border-[#523DC9]/30 flex-shrink-0">
              <Check className="w-5 h-5 text-[#523DC9]" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">2. Ajouter le gradient Aurora Borealis aux headers</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Utiliser <code className="px-2 py-1 rounded bg-[#523DC9]/10 text-[#523DC9] font-mono">bg-gradient-to-br from-[#5F2B75] via-[#523DC9] to-[#6B1817]</code> pour les sections héro et headers de page.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="p-2 rounded-lg bg-[#523DC9]/10 border border-[#523DC9]/30 flex-shrink-0">
              <Check className="w-5 h-5 text-[#523DC9]" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">3. Utiliser Space Grotesk pour les titres</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Appliquer <code className="px-2 py-1 rounded bg-[#523DC9]/10 text-[#523DC9] font-mono">font-family: 'Space Grotesk', sans-serif</code> aux h1, h2, h3 pour un look moderne et tech.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="p-2 rounded-lg bg-[#523DC9]/10 border border-[#523DC9]/30 flex-shrink-0">
              <Check className="w-5 h-5 text-[#523DC9]" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">4. Bordures en Soft Lavender pour le glassmorphism</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Utiliser <code className="px-2 py-1 rounded bg-[#523DC9]/10 text-[#523DC9] font-mono">border-[#A7A2CF]/20</code> pour des bordures subtiles sur les glass-cards.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="p-2 rounded-lg bg-[#523DC9]/10 border border-[#523DC9]/30 flex-shrink-0">
              <Check className="w-5 h-5 text-[#523DC9]" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">5. Crimson Red pour les alertes et urgences</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Utiliser <code className="px-2 py-1 rounded bg-[#6B1817]/10 text-[#6B1817] font-mono">#6B1817</code> pour les deadlines urgentes, erreurs et actions destructives.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="p-2 rounded-lg bg-[#523DC9]/10 border border-[#523DC9]/30 flex-shrink-0">
              <Check className="w-5 h-5 text-[#523DC9]" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">6. Ajouter la texture grain aux grandes surfaces</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Appliquer le SVG noise filter sur les gradients pour ajouter de la profondeur tactile et éviter les aplats trop lisses.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
