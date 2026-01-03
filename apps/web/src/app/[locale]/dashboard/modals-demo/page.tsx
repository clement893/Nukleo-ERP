'use client';

import { useState } from 'react';
import { 
  Sparkles, Plus, Edit, Trash2, Eye, Users, Settings, 
  FileText, Mail, Calendar, DollarSign, Target, Briefcase,
  AlertCircle, CheckCircle, Info, XCircle
} from 'lucide-react';
import Modal, { ConfirmModal } from '@/components/ui/Modal';
import Drawer from '@/components/ui/Drawer';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Select from '@/components/ui/Select';

export default function ModalsDemo() {
  // Modal states
  const [showBasicModal, setShowBasicModal] = useState(false);
  const [showAuroraModal, setShowAuroraModal] = useState(false);
  const [showVioletModal, setShowVioletModal] = useState(false);
  const [showBlueModal, setShowBlueModal] = useState(false);
  const [showGreenModal, setShowGreenModal] = useState(false);
  const [showOrangeModal, setShowOrangeModal] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showLargeModal, setShowLargeModal] = useState(false);
  const [showSmallModal, setShowSmallModal] = useState(false);
  
  // Drawer states
  const [showRightDrawer, setShowRightDrawer] = useState(false);
  const [showLeftDrawer, setShowLeftDrawer] = useState(false);
  const [showDrawerAurora, setShowDrawerAurora] = useState(false);
  const [showDrawerViolet, setShowDrawerViolet] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'user',
    description: '',
  });

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-[#5F2B75] via-[#523DC9] to-[#6B1817]" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItMnptMC0ydi0yIDJ6bS0yIDB2Mmgydi0yaC0yem0wLTJ2Mmgydi0yaC0yem0yIDB2Mmgydi0yaC0yem0wIDJ2Mmgydi0yaC0yem0tMiAwdjJoMnYtMmgtMnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30" />
        <div className="relative px-10 py-12">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-4 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 shadow-lg">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-5xl font-black text-white mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Modals & Drawers Demo
              </h1>
              <p className="text-white/90 text-xl font-medium">
                Testez tous les styles de modals et drawers ultra-modernes
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modals Section */}
      <div className="space-y-6">
        <h2 className="text-3xl font-black mb-6" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          🎨 Modals avec Gradients
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Aurora Modal */}
          <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#5F2B75] via-[#523DC9] to-[#6B1817] p-[2px] shadow-xl hover:shadow-2xl transition-all hover:scale-105 duration-300">
            <div className="relative h-full bg-white dark:bg-gray-900 rounded-2xl p-6">
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-[#5F2B75] via-[#523DC9] to-[#6B1817] w-fit shadow-lg">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-black mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    Aurora Borealis
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 font-medium">
                    Gradient par défaut du système Nukleo
                  </p>
                </div>
                <button
                  onClick={() => setShowAuroraModal(true)}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-[#5F2B75] via-[#523DC9] to-[#6B1817] hover:opacity-90 text-white font-bold shadow-lg hover:shadow-xl transition-all hover:scale-105"
                >
                  Ouvrir
                </button>
              </div>
            </div>
          </div>

          {/* Violet Modal */}
          <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 p-[2px] shadow-xl hover:shadow-2xl transition-all hover:scale-105 duration-300">
            <div className="relative h-full bg-white dark:bg-gray-900 rounded-2xl p-6">
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 w-fit shadow-lg">
                  <Plus className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-black mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    Violet/Purple
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 font-medium">
                    Parfait pour les actions de création
                  </p>
                </div>
                <button
                  onClick={() => setShowVioletModal(true)}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-bold shadow-lg hover:shadow-xl transition-all hover:scale-105"
                >
                  Ouvrir
                </button>
              </div>
            </div>
          </div>

          {/* Blue Modal */}
          <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 p-[2px] shadow-xl hover:shadow-2xl transition-all hover:scale-105 duration-300">
            <div className="relative h-full bg-white dark:bg-gray-900 rounded-2xl p-6">
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 w-fit shadow-lg">
                  <Edit className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-black mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    Blue/Cyan
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 font-medium">
                    Idéal pour les modifications
                  </p>
                </div>
                <button
                  onClick={() => setShowBlueModal(true)}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold shadow-lg hover:shadow-xl transition-all hover:scale-105"
                >
                  Ouvrir
                </button>
              </div>
            </div>
          </div>

          {/* Green Modal */}
          <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 p-[2px] shadow-xl hover:shadow-2xl transition-all hover:scale-105 duration-300">
            <div className="relative h-full bg-white dark:bg-gray-900 rounded-2xl p-6">
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 w-fit shadow-lg">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-black mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    Green/Emerald
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 font-medium">
                    Pour les confirmations positives
                  </p>
                </div>
                <button
                  onClick={() => setShowGreenModal(true)}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold shadow-lg hover:shadow-xl transition-all hover:scale-105"
                >
                  Ouvrir
                </button>
              </div>
            </div>
          </div>

          {/* Orange Modal */}
          <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 p-[2px] shadow-xl hover:shadow-2xl transition-all hover:scale-105 duration-300">
            <div className="relative h-full bg-white dark:bg-gray-900 rounded-2xl p-6">
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 w-fit shadow-lg">
                  <AlertCircle className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-black mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    Orange/Red
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 font-medium">
                    Pour les alertes et suppressions
                  </p>
                </div>
                <button
                  onClick={() => setShowOrangeModal(true)}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-bold shadow-lg hover:shadow-xl transition-all hover:scale-105"
                >
                  Ouvrir
                </button>
              </div>
            </div>
          </div>

          {/* Form Modal */}
          <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 p-[2px] shadow-xl hover:shadow-2xl transition-all hover:scale-105 duration-300">
            <div className="relative h-full bg-white dark:bg-gray-900 rounded-2xl p-6">
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 w-fit shadow-lg">
                  <FileText className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-black mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    Formulaire
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 font-medium">
                    Modal avec formulaire complet
                  </p>
                </div>
                <button
                  onClick={() => setShowFormModal(true)}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold shadow-lg hover:shadow-xl transition-all hover:scale-105"
                >
                  Ouvrir
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sizes Section */}
      <div className="space-y-6">
        <h2 className="text-3xl font-black mb-6" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          📏 Tailles de Modals
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <button
            onClick={() => setShowSmallModal(true)}
            className="p-6 rounded-2xl border-2 border-gray-300 dark:border-gray-600 hover:border-violet-500 dark:hover:border-violet-500 transition-all hover:scale-105 text-left"
          >
            <h3 className="text-xl font-black mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Small (sm)
            </h3>
            <p className="text-gray-600 dark:text-gray-400">Confirmations rapides</p>
          </button>

          <button
            onClick={() => setShowBasicModal(true)}
            className="p-6 rounded-2xl border-2 border-gray-300 dark:border-gray-600 hover:border-violet-500 dark:hover:border-violet-500 transition-all hover:scale-105 text-left"
          >
            <h3 className="text-xl font-black mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Medium (md)
            </h3>
            <p className="text-gray-600 dark:text-gray-400">Taille par défaut</p>
          </button>

          <button
            onClick={() => setShowLargeModal(true)}
            className="p-6 rounded-2xl border-2 border-gray-300 dark:border-gray-600 hover:border-violet-500 dark:hover:border-violet-500 transition-all hover:scale-105 text-left"
          >
            <h3 className="text-xl font-black mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Large (lg)
            </h3>
            <p className="text-gray-600 dark:text-gray-400">Formulaires complexes</p>
          </button>
        </div>
      </div>

      {/* Drawers Section */}
      <div className="space-y-6">
        <h2 className="text-3xl font-black mb-6" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          📱 Drawers (Panneaux Latéraux)
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <button
            onClick={() => setShowRightDrawer(true)}
            className="p-6 rounded-2xl bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/20 dark:to-purple-900/20 hover:scale-105 transition-all"
          >
            <Users className="w-8 h-8 mb-3 text-violet-600" />
            <h3 className="text-xl font-black mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Drawer Droit
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Position par défaut</p>
          </button>

          <button
            onClick={() => setShowLeftDrawer(true)}
            className="p-6 rounded-2xl bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/20 dark:to-cyan-900/20 hover:scale-105 transition-all"
          >
            <Settings className="w-8 h-8 mb-3 text-blue-600" />
            <h3 className="text-xl font-black mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Drawer Gauche
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Navigation</p>
          </button>

          <button
            onClick={() => setShowDrawerAurora(true)}
            className="p-6 rounded-2xl bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 hover:scale-105 transition-all"
          >
            <Sparkles className="w-8 h-8 mb-3 text-purple-600" />
            <h3 className="text-xl font-black mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Aurora Drawer
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Gradient Aurora</p>
          </button>

          <button
            onClick={() => setShowDrawerViolet(true)}
            className="p-6 rounded-2xl bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 hover:scale-105 transition-all"
          >
            <Eye className="w-8 h-8 mb-3 text-green-600" />
            <h3 className="text-xl font-black mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Violet Drawer
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Gradient Violet</p>
          </button>
        </div>
      </div>

      {/* Special Modals */}
      <div className="space-y-6">
        <h2 className="text-3xl font-black mb-6" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          ⚡ Modals Spéciaux
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button
            onClick={() => setShowConfirmModal(true)}
            className="p-6 rounded-2xl border-2 border-red-300 dark:border-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all hover:scale-105 text-left"
          >
            <Trash2 className="w-8 h-8 mb-3 text-red-600" />
            <h3 className="text-xl font-black mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              ConfirmModal
            </h3>
            <p className="text-gray-600 dark:text-gray-400">Modal de confirmation avec actions</p>
          </button>
        </div>
      </div>

      {/* Modal Implementations */}
      
      {/* Aurora Modal */}
      <Modal
        isOpen={showAuroraModal}
        onClose={() => setShowAuroraModal(false)}
        title="Aurora Borealis"
        gradient="aurora"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-lg">
            Ceci est un modal avec le gradient <strong>Aurora Borealis</strong>, le gradient par défaut du système Nukleo.
          </p>
          <div className="p-4 rounded-xl bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20">
            <p className="font-semibold">✨ Caractéristiques :</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Backdrop blur intense (60% + blur-md)</li>
              <li>Gradient Aurora Borealis dans le header</li>
              <li>Icône Sparkles par défaut</li>
              <li>Animations fluides</li>
              <li>Border radius généreux (rounded-3xl)</li>
            </ul>
          </div>
        </div>
      </Modal>

      {/* Violet Modal */}
      <Modal
        isOpen={showVioletModal}
        onClose={() => setShowVioletModal(false)}
        title="Créer un élément"
        gradient="violet"
        icon={<Plus className="w-6 h-6 text-white" />}
        size="md"
      >
        <div className="space-y-4">
          <p className="text-lg">
            Modal avec gradient <strong>Violet/Purple</strong>, parfait pour les actions de création.
          </p>
          <div className="p-4 rounded-xl bg-violet-50 dark:bg-violet-900/20">
            <p className="font-semibold">🎨 Utilisation recommandée :</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Création de projets</li>
              <li>Ajout d'utilisateurs</li>
              <li>Nouveau document</li>
              <li>Toute action "Créer"</li>
            </ul>
          </div>
        </div>
      </Modal>

      {/* Blue Modal */}
      <Modal
        isOpen={showBlueModal}
        onClose={() => setShowBlueModal(false)}
        title="Modifier l'élément"
        gradient="blue"
        icon={<Edit className="w-6 h-6 text-white" />}
        size="md"
      >
        <div className="space-y-4">
          <p className="text-lg">
            Modal avec gradient <strong>Blue/Cyan</strong>, idéal pour les modifications.
          </p>
          <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20">
            <p className="font-semibold">✏️ Utilisation recommandée :</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Édition de profil</li>
              <li>Modification de projet</li>
              <li>Mise à jour de données</li>
              <li>Toute action "Éditer"</li>
            </ul>
          </div>
        </div>
      </Modal>

      {/* Green Modal */}
      <Modal
        isOpen={showGreenModal}
        onClose={() => setShowGreenModal(false)}
        title="Succès !"
        gradient="green"
        icon={<CheckCircle className="w-6 h-6 text-white" />}
        size="md"
      >
        <div className="space-y-4">
          <p className="text-lg">
            Modal avec gradient <strong>Green/Emerald</strong>, pour les confirmations positives.
          </p>
          <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20">
            <p className="font-semibold">✅ Utilisation recommandée :</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Confirmation de succès</li>
              <li>Validation d'action</li>
              <li>Import de fichiers</li>
              <li>Opération réussie</li>
            </ul>
          </div>
        </div>
      </Modal>

      {/* Orange Modal */}
      <Modal
        isOpen={showOrangeModal}
        onClose={() => setShowOrangeModal(false)}
        title="Attention !"
        gradient="orange"
        icon={<AlertCircle className="w-6 h-6 text-white" />}
        size="md"
      >
        <div className="space-y-4">
          <p className="text-lg">
            Modal avec gradient <strong>Orange/Red</strong>, pour les alertes et suppressions.
          </p>
          <div className="p-4 rounded-xl bg-orange-50 dark:bg-orange-900/20">
            <p className="font-semibold">⚠️ Utilisation recommandée :</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Suppression d'éléments</li>
              <li>Alertes importantes</li>
              <li>Actions irréversibles</li>
              <li>Avertissements</li>
            </ul>
          </div>
        </div>
      </Modal>

      {/* Form Modal */}
      <Modal
        isOpen={showFormModal}
        onClose={() => setShowFormModal(false)}
        title="Formulaire d'inscription"
        gradient="violet"
        icon={<Users className="w-6 h-6 text-white" />}
        size="lg"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setShowFormModal(false)}
              className="flex-1 py-3 rounded-xl border-2 hover:scale-105 transition-all"
            >
              Annuler
            </Button>
            <Button
              onClick={() => {
                alert('Formulaire soumis !');
                setShowFormModal(false);
              }}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 shadow-lg hover:shadow-xl hover:scale-105 transition-all"
            >
              Enregistrer
            </Button>
          </>
        }
      >
        <form className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold mb-2">Nom complet *</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Jean Dupont"
                className="w-full px-4 py-3 rounded-xl border-2 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/20"
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-2">Email *</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="jean@example.com"
                className="w-full px-4 py-3 rounded-xl border-2 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/20"
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-2">Rôle</label>
              <Select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border-2 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/20"
              >
                <option value="user">Utilisateur</option>
                <option value="admin">Administrateur</option>
                <option value="manager">Manager</option>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-bold mb-2">Description</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Décrivez votre profil..."
                rows={4}
                className="w-full px-4 py-3 rounded-xl border-2 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/20 resize-none"
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* Small Modal */}
      <Modal
        isOpen={showSmallModal}
        onClose={() => setShowSmallModal(false)}
        title="Petit modal"
        gradient="blue"
        size="sm"
      >
        <p>Ceci est un modal de taille <strong>small (sm)</strong>, parfait pour les confirmations rapides.</p>
      </Modal>

      {/* Basic Modal */}
      <Modal
        isOpen={showBasicModal}
        onClose={() => setShowBasicModal(false)}
        title="Modal medium"
        gradient="aurora"
        size="md"
      >
        <p>Ceci est un modal de taille <strong>medium (md)</strong>, la taille par défaut.</p>
      </Modal>

      {/* Large Modal */}
      <Modal
        isOpen={showLargeModal}
        onClose={() => setShowLargeModal(false)}
        title="Grand modal"
        gradient="green"
        size="lg"
      >
        <div className="space-y-4">
          <p>Ceci est un modal de taille <strong>large (lg)</strong>, idéal pour les formulaires complexes.</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-gray-100 dark:bg-gray-800">
              <h4 className="font-bold mb-2">Colonne 1</h4>
              <p className="text-sm">Contenu de la première colonne</p>
            </div>
            <div className="p-4 rounded-xl bg-gray-100 dark:bg-gray-800">
              <h4 className="font-bold mb-2">Colonne 2</h4>
              <p className="text-sm">Contenu de la deuxième colonne</p>
            </div>
          </div>
        </div>
      </Modal>

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={() => {
          alert('Action confirmée !');
        }}
        title="Supprimer l'élément ?"
        message="Cette action est irréversible. Êtes-vous sûr de vouloir supprimer cet élément ?"
        confirmText="Supprimer"
        cancelText="Annuler"
        variant="danger"
        gradient="orange"
      />

      {/* Right Drawer */}
      <Drawer
        isOpen={showRightDrawer}
        onClose={() => setShowRightDrawer(false)}
        title="Détails utilisateur"
        position="right"
        gradient="none"
        icon={<Users className="w-5 h-5 text-white" />}
      >
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
              JD
            </div>
            <div>
              <h3 className="text-xl font-bold">Jean Dupont</h3>
              <p className="text-gray-600 dark:text-gray-400">jean@example.com</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-gray-100 dark:bg-gray-800">
              <p className="text-sm font-bold mb-1">Rôle</p>
              <p>Administrateur</p>
            </div>
            <div className="p-4 rounded-xl bg-gray-100 dark:bg-gray-800">
              <p className="text-sm font-bold mb-1">Département</p>
              <p>Développement</p>
            </div>
            <div className="p-4 rounded-xl bg-gray-100 dark:bg-gray-800">
              <p className="text-sm font-bold mb-1">Date d'inscription</p>
              <p>15 janvier 2026</p>
            </div>
          </div>
        </div>
      </Drawer>

      {/* Left Drawer */}
      <Drawer
        isOpen={showLeftDrawer}
        onClose={() => setShowLeftDrawer(false)}
        title="Navigation"
        position="left"
        gradient="blue"
        icon={<Settings className="w-5 h-5 text-white" />}
      >
        <div className="space-y-2">
          {['Dashboard', 'Projets', 'Équipes', 'Rapports', 'Paramètres'].map((item) => (
            <button
              key={item}
              className="w-full p-4 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-left transition-all"
            >
              {item}
            </button>
          ))}
        </div>
      </Drawer>

      {/* Aurora Drawer */}
      <Drawer
        isOpen={showDrawerAurora}
        onClose={() => setShowDrawerAurora(false)}
        title="Aurora Drawer"
        position="right"
        gradient="aurora"
        size="lg"
      >
        <div className="space-y-4">
          <p className="text-lg">
            Drawer avec le gradient <strong>Aurora Borealis</strong>.
          </p>
          <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-900/20">
            <p className="font-semibold mb-2">✨ Caractéristiques :</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Backdrop blur intense</li>
              <li>Gradient Aurora dans le header</li>
              <li>Slide animation fluide</li>
              <li>Taille large (lg)</li>
            </ul>
          </div>
        </div>
      </Drawer>

      {/* Violet Drawer */}
      <Drawer
        isOpen={showDrawerViolet}
        onClose={() => setShowDrawerViolet(false)}
        title="Violet Drawer"
        position="right"
        gradient="violet"
        icon={<Eye className="w-5 h-5 text-white" />}
      >
        <div className="space-y-4">
          <p className="text-lg">
            Drawer avec le gradient <strong>Violet/Purple</strong>.
          </p>
          <div className="p-4 rounded-xl bg-violet-50 dark:bg-violet-900/20">
            <p className="font-semibold mb-2">🎨 Parfait pour :</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Détails de projets</li>
              <li>Informations utilisateur</li>
              <li>Prévisualisation</li>
            </ul>
          </div>
        </div>
      </Drawer>
    </div>
  );
}
