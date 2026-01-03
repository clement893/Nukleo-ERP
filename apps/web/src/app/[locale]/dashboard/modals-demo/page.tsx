'use client';

import { useState } from 'react';
import { 
  Sparkles, Plus, Edit, Trash2, Eye, Users, Settings, 
  FileText, Mail, Calendar, DollarSign, Target, Briefcase,
  AlertCircle, CheckCircle, Info, XCircle, HelpCircle, Save
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
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Compact Hero Header */}
      <div className="relative overflow-hidden rounded-xl shadow-lg">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700" />
        <div className="relative px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-white/15 backdrop-blur-sm border border-white/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Modals & Drawers - Guide Complet
              </h1>
              <p className="text-white/80 text-sm">
                Design raffiné, couleurs subtiles, tailles compactes
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Introduction Card */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-2 text-sm">
            <p className="font-semibold text-blue-900 dark:text-blue-100">
              Les composants Modal et Drawer ont été modernisés avec :
            </p>
            <ul className="space-y-1 text-blue-800 dark:text-blue-200">
              <li>• <strong>Couleurs subtiles</strong> : Gradients raffinés et professionnels</li>
              <li>• <strong>Tailles compactes</strong> : Padding et spacing réduits</li>
              <li>• <strong>Backdrop léger</strong> : 40% opacité + blur subtil</li>
              <li>• <strong>Icônes 16px</strong> : Plus discrètes et élégantes</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Gradients Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            🎨 Variantes de Gradients
          </h2>
          <span className="text-sm text-gray-500">5 options disponibles</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Aurora */}
          <button
            onClick={() => setShowAuroraModal(true)}
            className="group text-left p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-purple-500 dark:hover:border-purple-500 transition-all hover:shadow-md"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-bold">Aurora</h3>
                <p className="text-xs text-gray-500">gradient="aurora"</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Par défaut. Pour actions générales et vues principales.
            </p>
          </button>

          {/* Violet */}
          <button
            onClick={() => setShowVioletModal(true)}
            className="group text-left p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-violet-500 dark:hover:border-violet-500 transition-all hover:shadow-md"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-gradient-to-r from-violet-600 to-purple-600">
                <Plus className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-bold">Violet</h3>
                <p className="text-xs text-gray-500">gradient="violet"</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Création. Ajouter projet, utilisateur, document.
            </p>
          </button>

          {/* Blue */}
          <button
            onClick={() => setShowBlueModal(true)}
            className="group text-left p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-all hover:shadow-md"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600">
                <Edit className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-bold">Blue</h3>
                <p className="text-xs text-gray-500">gradient="blue"</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Édition. Modifier profil, projet, paramètres.
            </p>
          </button>

          {/* Green */}
          <button
            onClick={() => setShowGreenModal(true)}
            className="group text-left p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-green-500 dark:hover:border-green-500 transition-all hover:shadow-md"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600">
                <CheckCircle className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-bold">Green</h3>
                <p className="text-xs text-gray-500">gradient="green"</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Succès. Confirmation, validation, import réussi.
            </p>
          </button>

          {/* Orange */}
          <button
            onClick={() => setShowOrangeModal(true)}
            className="group text-left p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-orange-500 dark:hover:border-orange-500 transition-all hover:shadow-md"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-gradient-to-r from-orange-600 to-red-600">
                <AlertCircle className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-bold">Orange</h3>
                <p className="text-xs text-gray-500">gradient="orange"</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Alerte. Suppression, avertissement, danger.
            </p>
          </button>

          {/* Form Example */}
          <button
            onClick={() => setShowFormModal(true)}
            className="group text-left p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-indigo-500 dark:hover:border-indigo-500 transition-all hover:shadow-md"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-gradient-to-r from-violet-600 to-purple-600">
                <FileText className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-bold">Formulaire</h3>
                <p className="text-xs text-gray-500">Exemple complet</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Modal avec formulaire et footer personnalisé.
            </p>
          </button>
        </div>
      </div>

      {/* Usage Guide */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          📖 Guide d'Utilisation
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Basic Usage */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded bg-purple-100 dark:bg-purple-900/30">
                <HelpCircle className="w-4 h-4 text-purple-600" />
              </div>
              <h3 className="font-bold text-sm">Usage Basique</h3>
            </div>
            <pre className="text-xs bg-white dark:bg-gray-900 p-3 rounded border border-gray-200 dark:border-gray-700 overflow-x-auto">
{`<Modal
  isOpen={show}
  onClose={() => setShow(false)}
  title="Mon Modal"
  gradient="violet"
>
  <p>Contenu du modal</p>
</Modal>`}
            </pre>
          </div>

          {/* With Icon */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded bg-blue-100 dark:bg-blue-900/30">
                <Sparkles className="w-4 h-4 text-blue-600" />
              </div>
              <h3 className="font-bold text-sm">Avec Icône Personnalisée</h3>
            </div>
            <pre className="text-xs bg-white dark:bg-gray-900 p-3 rounded border border-gray-200 dark:border-gray-700 overflow-x-auto">
{`<Modal
  isOpen={show}
  onClose={() => setShow(false)}
  title="Éditer"
  gradient="blue"
  icon={<Edit className="w-4 h-4 text-white" />}
>
  <form>...</form>
</Modal>`}
            </pre>
          </div>

          {/* With Footer */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded bg-green-100 dark:bg-green-900/30">
                <Save className="w-4 h-4 text-green-600" />
              </div>
              <h3 className="font-bold text-sm">Avec Footer</h3>
            </div>
            <pre className="text-xs bg-white dark:bg-gray-900 p-3 rounded border border-gray-200 dark:border-gray-700 overflow-x-auto">
{`<Modal
  isOpen={show}
  onClose={() => setShow(false)}
  title="Confirmer"
  gradient="green"
  footer={
    <>
      <Button onClick={onCancel}>
        Annuler
      </Button>
      <Button onClick={onSave}>
        Enregistrer
      </Button>
    </>
  }
>
  <p>Contenu</p>
</Modal>`}
            </pre>
          </div>

          {/* ConfirmModal */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded bg-orange-100 dark:bg-orange-900/30">
                <Trash2 className="w-4 h-4 text-orange-600" />
              </div>
              <h3 className="font-bold text-sm">Modal de Confirmation</h3>
            </div>
            <pre className="text-xs bg-white dark:bg-gray-900 p-3 rounded border border-gray-200 dark:border-gray-700 overflow-x-auto">
{`<ConfirmModal
  isOpen={show}
  onClose={() => setShow(false)}
  onConfirm={handleDelete}
  title="Supprimer ?"
  message="Action irréversible"
  confirmText="Supprimer"
  gradient="orange"
/>`}
            </pre>
          </div>
        </div>
      </div>

      {/* Sizes */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          📏 Tailles Disponibles
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <button
            onClick={() => setShowSmallModal(true)}
            className="p-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-purple-500 transition-all text-center"
          >
            <p className="font-bold text-sm">Small</p>
            <p className="text-xs text-gray-500">size="sm"</p>
          </button>
          <button
            onClick={() => setShowBasicModal(true)}
            className="p-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-purple-500 transition-all text-center"
          >
            <p className="font-bold text-sm">Medium</p>
            <p className="text-xs text-gray-500">size="md"</p>
          </button>
          <button
            onClick={() => setShowLargeModal(true)}
            className="p-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-purple-500 transition-all text-center"
          >
            <p className="font-bold text-sm">Large</p>
            <p className="text-xs text-gray-500">size="lg"</p>
          </button>
          <button
            onClick={() => setShowConfirmModal(true)}
            className="p-3 rounded-lg border-2 border-orange-200 dark:border-orange-700 hover:border-orange-500 transition-all text-center"
          >
            <p className="font-bold text-sm">Confirm</p>
            <p className="text-xs text-gray-500">ConfirmModal</p>
          </button>
        </div>
      </div>

      {/* Drawers */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          📱 Drawers (Panneaux Latéraux)
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button
            onClick={() => setShowRightDrawer(true)}
            className="p-4 rounded-lg bg-violet-50 dark:bg-violet-900/20 hover:bg-violet-100 dark:hover:bg-violet-900/30 transition-all"
          >
            <Users className="w-5 h-5 mb-2 text-violet-600" />
            <p className="font-bold text-sm">Droit</p>
            <p className="text-xs text-gray-500">position="right"</p>
          </button>
          <button
            onClick={() => setShowLeftDrawer(true)}
            className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all"
          >
            <Settings className="w-5 h-5 mb-2 text-blue-600" />
            <p className="font-bold text-sm">Gauche</p>
            <p className="text-xs text-gray-500">position="left"</p>
          </button>
          <button
            onClick={() => setShowDrawerAurora(true)}
            className="p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-all"
          >
            <Sparkles className="w-5 h-5 mb-2 text-purple-600" />
            <p className="font-bold text-sm">Aurora</p>
            <p className="text-xs text-gray-500">gradient="aurora"</p>
          </button>
          <button
            onClick={() => setShowDrawerViolet(true)}
            className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 transition-all"
          >
            <Eye className="w-5 h-5 mb-2 text-green-600" />
            <p className="font-bold text-sm">Détails</p>
            <p className="text-xs text-gray-500">gradient="violet"</p>
          </button>
        </div>
      </div>

      {/* Best Practices */}
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-2 text-sm">
            <p className="font-semibold text-green-900 dark:text-green-100">
              Bonnes Pratiques
            </p>
            <ul className="space-y-1 text-green-800 dark:text-green-200">
              <li>• Utiliser <code className="px-1 py-0.5 bg-green-100 dark:bg-green-900/40 rounded text-xs">gradient="violet"</code> pour les créations</li>
              <li>• Utiliser <code className="px-1 py-0.5 bg-green-100 dark:bg-green-900/40 rounded text-xs">gradient="blue"</code> pour les éditions</li>
              <li>• Utiliser <code className="px-1 py-0.5 bg-green-100 dark:bg-green-900/40 rounded text-xs">gradient="orange"</code> pour les suppressions</li>
              <li>• Ajouter une icône contextuelle avec la prop <code className="px-1 py-0.5 bg-green-100 dark:bg-green-900/40 rounded text-xs">icon</code></li>
              <li>• Préférer <code className="px-1 py-0.5 bg-green-100 dark:bg-green-900/40 rounded text-xs">ConfirmModal</code> pour les confirmations simples</li>
            </ul>
          </div>
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
        <div className="space-y-3">
          <p>
            Gradient <strong>Aurora</strong> (purple → indigo → purple). Utilisé par défaut pour les actions générales.
          </p>
          <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-sm">
            <p className="font-semibold mb-2">Quand l'utiliser :</p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Actions générales et vues principales</li>
              <li>Dashboards et statistiques</li>
              <li>Informations importantes</li>
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
        icon={<Plus className="w-4 h-4 text-white" />}
        size="md"
      >
        <div className="space-y-3">
          <p>
            Gradient <strong>Violet</strong> (violet → purple). Parfait pour les actions de création.
          </p>
          <div className="p-3 rounded-lg bg-violet-50 dark:bg-violet-900/20 text-sm">
            <p className="font-semibold mb-2">Exemples d'utilisation :</p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Créer un projet</li>
              <li>Ajouter un utilisateur</li>
              <li>Nouveau document</li>
              <li>Inviter un membre</li>
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
        icon={<Edit className="w-4 h-4 text-white" />}
        size="md"
      >
        <div className="space-y-3">
          <p>
            Gradient <strong>Blue</strong> (blue → cyan). Idéal pour les modifications.
          </p>
          <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-sm">
            <p className="font-semibold mb-2">Exemples d'utilisation :</p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Éditer un profil</li>
              <li>Modifier un projet</li>
              <li>Mettre à jour des paramètres</li>
              <li>Changer des informations</li>
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
        icon={<CheckCircle className="w-4 h-4 text-white" />}
        size="md"
      >
        <div className="space-y-3">
          <p>
            Gradient <strong>Green</strong> (green → emerald). Pour les confirmations positives.
          </p>
          <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 text-sm">
            <p className="font-semibold mb-2">Exemples d'utilisation :</p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Confirmation de succès</li>
              <li>Validation d'action</li>
              <li>Import réussi</li>
              <li>Sauvegarde effectuée</li>
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
        icon={<AlertCircle className="w-4 h-4 text-white" />}
        size="md"
      >
        <div className="space-y-3">
          <p>
            Gradient <strong>Orange</strong> (orange → red). Pour les alertes et suppressions.
          </p>
          <div className="p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20 text-sm">
            <p className="font-semibold mb-2">Exemples d'utilisation :</p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Supprimer un élément</li>
              <li>Actions irréversibles</li>
              <li>Avertissements importants</li>
              <li>Confirmations de danger</li>
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
        icon={<Users className="w-4 h-4 text-white" />}
        size="lg"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setShowFormModal(false)}
            >
              Annuler
            </Button>
            <Button
              onClick={() => {
                alert('Formulaire soumis !');
                setShowFormModal(false);
              }}
            >
              Enregistrer
            </Button>
          </>
        }
      >
        <form className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-1.5">Nom complet *</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Jean Dupont"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1.5">Email *</label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="jean@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1.5">Rôle</label>
            <Select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            >
              <option value="user">Utilisateur</option>
              <option value="admin">Administrateur</option>
              <option value="manager">Manager</option>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1.5">Description</label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Décrivez votre profil..."
              rows={3}
            />
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
        <p className="text-sm">Modal de taille <strong>small (sm)</strong>, parfait pour les confirmations rapides.</p>
      </Modal>

      {/* Basic Modal */}
      <Modal
        isOpen={showBasicModal}
        onClose={() => setShowBasicModal(false)}
        title="Modal medium"
        gradient="aurora"
        size="md"
      >
        <p className="text-sm">Modal de taille <strong>medium (md)</strong>, la taille par défaut.</p>
      </Modal>

      {/* Large Modal */}
      <Modal
        isOpen={showLargeModal}
        onClose={() => setShowLargeModal(false)}
        title="Grand modal"
        gradient="green"
        size="lg"
      >
        <div className="space-y-3">
          <p className="text-sm">Modal de taille <strong>large (lg)</strong>, idéal pour les formulaires complexes.</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-gray-100 dark:bg-gray-800">
              <h4 className="font-semibold text-sm mb-1">Colonne 1</h4>
              <p className="text-xs">Contenu de la première colonne</p>
            </div>
            <div className="p-3 rounded-lg bg-gray-100 dark:bg-gray-800">
              <h4 className="font-semibold text-sm mb-1">Colonne 2</h4>
              <p className="text-xs">Contenu de la deuxième colonne</p>
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
        icon={<Users className="w-4 h-4 text-white" />}
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-lg font-bold">
              JD
            </div>
            <div>
              <h3 className="font-bold">Jean Dupont</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">jean@example.com</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="p-3 rounded-lg bg-gray-100 dark:bg-gray-800">
              <p className="text-xs font-semibold mb-1">Rôle</p>
              <p className="text-sm">Administrateur</p>
            </div>
            <div className="p-3 rounded-lg bg-gray-100 dark:bg-gray-800">
              <p className="text-xs font-semibold mb-1">Département</p>
              <p className="text-sm">Développement</p>
            </div>
            <div className="p-3 rounded-lg bg-gray-100 dark:bg-gray-800">
              <p className="text-xs font-semibold mb-1">Date d'inscription</p>
              <p className="text-sm">15 janvier 2026</p>
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
        icon={<Settings className="w-4 h-4 text-white" />}
      >
        <div className="space-y-1">
          {['Dashboard', 'Projets', 'Équipes', 'Rapports', 'Paramètres'].map((item) => (
            <button
              key={item}
              className="w-full p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-left transition-all text-sm"
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
        <div className="space-y-3">
          <p className="text-sm">
            Drawer avec le gradient <strong>Aurora</strong>.
          </p>
          <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-sm">
            <p className="font-semibold mb-2">Caractéristiques :</p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Backdrop blur subtil</li>
              <li>Gradient raffiné dans le header</li>
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
        title="Détails"
        position="right"
        gradient="violet"
        icon={<Eye className="w-4 h-4 text-white" />}
      >
        <div className="space-y-3">
          <p className="text-sm">
            Drawer avec le gradient <strong>Violet</strong>.
          </p>
          <div className="p-3 rounded-lg bg-violet-50 dark:bg-violet-900/20 text-sm">
            <p className="font-semibold mb-2">Parfait pour :</p>
            <ul className="list-disc list-inside space-y-1 text-sm">
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
