'use client';

import { useState } from 'react';
import { 
  Sparkles, Plus, Edit, Trash2, Eye, Users, Settings, 
  FileText, Mail, Calendar, DollarSign, Target, Briefcase,
  AlertCircle, CheckCircle, Info, XCircle, HelpCircle, Save,
  Bell, MessageSquare, Activity, TrendingUp, BarChart, Zap,
  Clock, Tag, Folder, Star, Heart, Share2
} from 'lucide-react';
import Modal, { ConfirmModal } from '@/components/ui/Modal';
import Drawer from '@/components/ui/Drawer';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Select from '@/components/ui/Select';
import Tabs from '@/components/ui/Tabs';
import { useToast } from '@/lib/toast';

export default function ModalsAdvancedDemo() {
  const toast = useToast();

  // Modal states
  const [showCompleteForm, setShowCompleteForm] = useState(false);
  const [showAnimatedModal, setShowAnimatedModal] = useState(false);
  const [showNestedModal, setShowNestedModal] = useState(false);
  const [showNestedModal2, setShowNestedModal2] = useState(false);
  
  // Drawer states
  const [showTabsDrawer, setShowTabsDrawer] = useState(false);
  const [showTopDrawer, setShowTopDrawer] = useState(false);
  const [showBottomDrawer, setShowBottomDrawer] = useState(false);
  const [showFormDrawer, setShowFormDrawer] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    role: 'user',
    department: '',
    startDate: '',
    salary: '',
    notes: '',
    skills: [] as string[],
    agreeTerms: false,
  });

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.firstName) newErrors.firstName = 'Prénom requis';
    if (!formData.lastName) newErrors.lastName = 'Nom requis';
    if (!formData.email) newErrors.email = 'Email requis';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email invalide';
    if (!formData.phone) newErrors.phone = 'Téléphone requis';
    if (!formData.agreeTerms) newErrors.agreeTerms = 'Vous devez accepter les conditions';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmitForm = () => {
    if (validateForm()) {
      toast.success('Formulaire soumis avec succès !', {
        title: 'Succès',
        duration: 3000,
      });
      setShowCompleteForm(false);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        company: '',
        role: 'user',
        department: '',
        startDate: '',
        salary: '',
        notes: '',
        skills: [],
        agreeTerms: false,
      });
      setErrors({});
    } else {
      toast.error('Veuillez corriger les erreurs dans le formulaire', {
        title: 'Erreur de validation',
      });
    }
  };

  // Tabs for drawer
  const drawerTabs = [
    {
      id: 'overview',
      label: 'Vue d\'ensemble',
      icon: <Activity className="w-4 h-4" />,
      badge: '3',
      content: (
        <div className="p-4 space-y-4">
          <h3 className="font-bold text-lg">Statistiques Générales</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-lg bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 border border-violet-200 dark:border-violet-800">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-violet-600" />
                <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Utilisateurs</span>
              </div>
              <p className="text-2xl font-bold">1,234</p>
              <p className="text-xs text-green-600 mt-1">+12% ce mois</p>
            </div>
            <div className="p-4 rounded-lg bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Revenus</span>
              </div>
              <p className="text-2xl font-bold">$45.2k</p>
              <p className="text-xs text-green-600 mt-1">+8% ce mois</p>
            </div>
            <div className="p-4 rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 mb-2">
                <Briefcase className="w-4 h-4 text-green-600" />
                <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Projets</span>
              </div>
              <p className="text-2xl font-bold">87</p>
              <p className="text-xs text-green-600 mt-1">+5 nouveaux</p>
            </div>
            <div className="p-4 rounded-lg bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border border-orange-200 dark:border-orange-800">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-orange-600" />
                <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">En attente</span>
              </div>
              <p className="text-2xl font-bold">23</p>
              <p className="text-xs text-orange-600 mt-1">Action requise</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'activity',
      label: 'Activité',
      icon: <Bell className="w-4 h-4" />,
      badge: '12',
      content: (
        <div className="p-4 space-y-3">
          <h3 className="font-bold text-lg mb-4">Activité Récente</h3>
          {[
            { icon: Users, color: 'violet', text: 'Jean Dupont a rejoint l\'équipe', time: 'Il y a 5 min' },
            { icon: FileText, color: 'blue', text: 'Nouveau document partagé', time: 'Il y a 12 min' },
            { icon: CheckCircle, color: 'green', text: 'Projet "Alpha" terminé', time: 'Il y a 1h' },
            { icon: MessageSquare, color: 'orange', text: '3 nouveaux commentaires', time: 'Il y a 2h' },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <div className={`p-2 rounded-lg bg-${item.color}-100 dark:bg-${item.color}-900/30`}>
                <item.icon className={`w-4 h-4 text-${item.color}-600`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{item.text}</p>
                <p className="text-xs text-gray-500 mt-1">{item.time}</p>
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: 'settings',
      label: 'Paramètres',
      icon: <Settings className="w-4 h-4" />,
      content: (
        <div className="p-4 space-y-4">
          <h3 className="font-bold text-lg mb-4">Paramètres</h3>
          <div className="space-y-3">
            {[
              { label: 'Notifications par email', checked: true },
              { label: 'Notifications push', checked: false },
              { label: 'Mises à jour automatiques', checked: true },
              { label: 'Mode sombre', checked: false },
            ].map((setting, i) => (
              <label key={i} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors">
                <span className="text-sm font-medium">{setting.label}</span>
                <input
                  type="checkbox"
                  defaultChecked={setting.checked}
                  className="w-4 h-4 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                />
              </label>
            ))}
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-xl shadow-lg">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700" />
        <div className="relative px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-white/15 backdrop-blur-sm border border-white/20">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Démo Avancée - Modals & Drawers
              </h1>
              <p className="text-white/80 text-sm">
                Formulaires complets, animations, onglets, notifications
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Formulaires Complets */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          📝 Formulaires Complets avec Validation
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => setShowCompleteForm(true)}
            className="group text-left p-5 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-violet-500 dark:hover:border-violet-500 transition-all hover:shadow-lg"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-gradient-to-r from-violet-600 to-purple-600 group-hover:scale-110 transition-transform">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold">Formulaire d'Inscription</h3>
                <p className="text-xs text-gray-500">Validation en temps réel</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Formulaire complet avec 10+ champs, validation, messages d'erreur, et feedback visuel.
            </p>
          </button>

          <button
            onClick={() => setShowFormDrawer(true)}
            className="group text-left p-5 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-all hover:shadow-lg"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 group-hover:scale-110 transition-transform">
                <Edit className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold">Formulaire dans Drawer</h3>
                <p className="text-xs text-gray-500">Édition rapide</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Formulaire d'édition dans un drawer latéral avec sauvegarde automatique.
            </p>
          </button>
        </div>
      </div>

      {/* Animations */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          ✨ Animations Avancées
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => setShowAnimatedModal(true)}
            className="group p-5 rounded-lg bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800 hover:scale-105 transition-all"
          >
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-purple-600 animate-pulse" />
              <h3 className="font-bold">Zoom & Fade</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Animation zoom-in avec fade
            </p>
          </button>

          <button
            onClick={() => setShowNestedModal(true)}
            className="group p-5 rounded-lg bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border border-blue-200 dark:border-blue-800 hover:scale-105 transition-all"
          >
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-5 h-5 text-blue-600 animate-spin" style={{ animationDuration: '3s' }} />
              <h3 className="font-bold">Modals Imbriqués</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Ouvrir un modal depuis un modal
            </p>
          </button>

          <button
            onClick={() => {
              toast.success('Animation de succès !', { title: 'Succès' });
              setTimeout(() => toast.info('Information importante', { title: 'Info' }), 500);
              setTimeout(() => toast.warning('Attention !', { title: 'Avertissement' }), 1000);
            }}
            className="group p-5 rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 hover:scale-105 transition-all"
          >
            <div className="flex items-center gap-2 mb-2">
              <Bell className="w-5 h-5 text-green-600 animate-bounce" />
              <h3 className="font-bold">Notifications</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Toasts animés en cascade
            </p>
          </button>
        </div>
      </div>

      {/* Drawers avec Onglets */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          📑 Drawers avec Onglets
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button
            onClick={() => setShowTabsDrawer(true)}
            className="p-4 rounded-lg bg-violet-50 dark:bg-violet-900/20 hover:bg-violet-100 dark:hover:bg-violet-900/30 transition-all border border-violet-200 dark:border-violet-800"
          >
            <Activity className="w-5 h-5 mb-2 text-violet-600" />
            <p className="font-bold text-sm">Drawer Droit</p>
            <p className="text-xs text-gray-500">3 onglets</p>
          </button>

          <button
            onClick={() => setShowTopDrawer(true)}
            className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all border border-blue-200 dark:border-blue-800"
          >
            <TrendingUp className="w-5 h-5 mb-2 text-blue-600" />
            <p className="font-bold text-sm">Drawer Haut</p>
            <p className="text-xs text-gray-500">Slide from top</p>
          </button>

          <button
            onClick={() => setShowBottomDrawer(true)}
            className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 transition-all border border-green-200 dark:border-green-800"
          >
            <BarChart className="w-5 h-5 mb-2 text-green-600" />
            <p className="font-bold text-sm">Drawer Bas</p>
            <p className="text-xs text-gray-500">Slide from bottom</p>
          </button>

          <button
            onClick={() => {
              toast.info('Drawer gauche disponible dans la démo principale', { 
                title: 'Info',
                duration: 3000 
              });
            }}
            className="p-4 rounded-lg bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-all border border-orange-200 dark:border-orange-800"
          >
            <Settings className="w-5 h-5 mb-2 text-orange-600" />
            <p className="font-bold text-sm">Drawer Gauche</p>
            <p className="text-xs text-gray-500">Voir démo principale</p>
          </button>
        </div>
      </div>

      {/* Notifications & Feedbacks */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          🔔 Notifications & Feedbacks
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button
            onClick={() => toast.success('Opération réussie !', { title: 'Succès', duration: 3000 })}
            className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 transition-all border border-green-200 dark:border-green-800"
          >
            <CheckCircle className="w-5 h-5 mb-2 text-green-600" />
            <p className="font-bold text-sm">Succès</p>
          </button>

          <button
            onClick={() => toast.error('Une erreur est survenue', { title: 'Erreur', duration: 4000 })}
            className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 transition-all border border-red-200 dark:border-red-800"
          >
            <XCircle className="w-5 h-5 mb-2 text-red-600" />
            <p className="font-bold text-sm">Erreur</p>
          </button>

          <button
            onClick={() => toast.warning('Attention à cette action', { title: 'Avertissement', duration: 5000 })}
            className="p-4 rounded-lg bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-all border border-orange-200 dark:border-orange-800"
          >
            <AlertCircle className="w-5 h-5 mb-2 text-orange-600" />
            <p className="font-bold text-sm">Avertissement</p>
          </button>

          <button
            onClick={() => toast.info('Information utile pour vous', { title: 'Information', duration: 3000 })}
            className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all border border-blue-200 dark:border-blue-800"
          >
            <Info className="w-5 h-5 mb-2 text-blue-600" />
            <p className="font-bold text-sm">Info</p>
          </button>
        </div>
      </div>

      {/* Complete Form Modal */}
      <Modal
        isOpen={showCompleteForm}
        onClose={() => setShowCompleteForm(false)}
        title="Formulaire d'Inscription Complet"
        gradient="violet"
        icon={<FileText className="w-4 h-4 text-white" />}
        size="lg"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setShowCompleteForm(false);
                setErrors({});
              }}
            >
              Annuler
            </Button>
            <Button onClick={handleSubmitForm}>
              Soumettre
            </Button>
          </>
        }
      >
        <form className="space-y-4">
          {/* Personal Info */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Users className="w-4 h-4" />
              Informations Personnelles
            </h3>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Prénom *</label>
                <Input
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="Jean"
                  className={errors.firstName ? 'border-red-500' : ''}
                />
                {errors.firstName && <p className="text-xs text-red-600 mt-1">{errors.firstName}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Nom *</label>
                <Input
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="Dupont"
                  className={errors.lastName ? 'border-red-500' : ''}
                />
                {errors.lastName && <p className="text-xs text-red-600 mt-1">{errors.lastName}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Email *</label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="jean@example.com"
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Téléphone *</label>
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+33 6 12 34 56 78"
                  className={errors.phone ? 'border-red-500' : ''}
                />
                {errors.phone && <p className="text-xs text-red-600 mt-1">{errors.phone}</p>}
              </div>
            </div>
          </div>

          {/* Professional Info */}
          <div className="space-y-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              Informations Professionnelles
            </h3>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Entreprise</label>
                <Input
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  placeholder="Acme Corp"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Rôle</label>
                <Select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                >
                  <option value="user">Utilisateur</option>
                  <option value="admin">Administrateur</option>
                  <option value="manager">Manager</option>
                  <option value="developer">Développeur</option>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Département</label>
                <Input
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  placeholder="Développement"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Date de début</label>
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="space-y-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Informations Complémentaires
            </h3>
            
            <div>
              <label className="block text-sm font-medium mb-1">Notes</label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Informations supplémentaires..."
                rows={3}
              />
            </div>

            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.agreeTerms}
                  onChange={(e) => setFormData({ ...formData, agreeTerms: e.target.checked })}
                  className="w-4 h-4 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                />
                <span className="text-sm">J'accepte les conditions d'utilisation *</span>
              </label>
              {errors.agreeTerms && <p className="text-xs text-red-600 mt-1">{errors.agreeTerms}</p>}
            </div>
          </div>
        </form>
      </Modal>

      {/* Animated Modal */}
      <Modal
        isOpen={showAnimatedModal}
        onClose={() => setShowAnimatedModal(false)}
        title="Modal avec Animations"
        gradient="aurora"
        icon={<Sparkles className="w-4 h-4 text-white" />}
        size="md"
      >
        <div className="space-y-4">
          <div className="animate-in slide-in-from-left duration-500">
            <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
              <h4 className="font-semibold mb-2">Animation Slide Left</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Ce contenu glisse depuis la gauche
              </p>
            </div>
          </div>

          <div className="animate-in slide-in-from-right duration-500 delay-150">
            <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <h4 className="font-semibold mb-2">Animation Slide Right</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Ce contenu glisse depuis la droite avec un délai
              </p>
            </div>
          </div>

          <div className="animate-in zoom-in duration-500 delay-300">
            <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
              <h4 className="font-semibold mb-2">Animation Zoom</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Ce contenu apparaît avec un effet zoom
              </p>
            </div>
          </div>
        </div>
      </Modal>

      {/* Nested Modals */}
      <Modal
        isOpen={showNestedModal}
        onClose={() => setShowNestedModal(false)}
        title="Premier Modal"
        gradient="blue"
        size="md"
      >
        <div className="space-y-4">
          <p>Ceci est le premier modal. Vous pouvez en ouvrir un second depuis ici.</p>
          <Button onClick={() => setShowNestedModal2(true)}>
            Ouvrir un second modal
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={showNestedModal2}
        onClose={() => setShowNestedModal2(false)}
        title="Second Modal (Imbriqué)"
        gradient="green"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm">Ceci est un modal ouvert depuis un autre modal !</p>
          <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
            <p className="text-xs text-green-800 dark:text-green-200">
              ✓ Les modals imbriqués fonctionnent parfaitement
            </p>
          </div>
        </div>
      </Modal>

      {/* Tabs Drawer */}
      <Drawer
        isOpen={showTabsDrawer}
        onClose={() => setShowTabsDrawer(false)}
        title="Dashboard Complet"
        position="right"
        gradient="aurora"
        icon={<Activity className="w-4 h-4 text-white" />}
        size="lg"
      >
        <Tabs tabs={drawerTabs} defaultTab="overview" variant="pills" />
      </Drawer>

      {/* Top Drawer */}
      <Drawer
        isOpen={showTopDrawer}
        onClose={() => setShowTopDrawer(false)}
        title="Notifications Récentes"
        position="top"
        gradient="blue"
        icon={<Bell className="w-4 h-4 text-white" />}
        size="md"
      >
        <div className="p-4 space-y-3">
          {[
            { icon: CheckCircle, color: 'green', text: 'Votre projet a été approuvé', time: 'Il y a 2 min' },
            { icon: AlertCircle, color: 'orange', text: 'Action requise sur le document #123', time: 'Il y a 15 min' },
            { icon: Info, color: 'blue', text: 'Nouvelle mise à jour disponible', time: 'Il y a 1h' },
          ].map((notif, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
              <notif.icon className={`w-5 h-5 text-${notif.color}-600 flex-shrink-0`} />
              <div className="flex-1">
                <p className="text-sm font-medium">{notif.text}</p>
                <p className="text-xs text-gray-500 mt-1">{notif.time}</p>
              </div>
            </div>
          ))}
        </div>
      </Drawer>

      {/* Bottom Drawer */}
      <Drawer
        isOpen={showBottomDrawer}
        onClose={() => setShowBottomDrawer(false)}
        title="Actions Rapides"
        position="bottom"
        gradient="green"
        icon={<Zap className="w-4 h-4 text-white" />}
        size="md"
      >
        <div className="p-4">
          <div className="grid grid-cols-4 gap-3">
            {[
              { icon: Plus, label: 'Créer', color: 'violet' },
              { icon: Edit, label: 'Éditer', color: 'blue' },
              { icon: Share2, label: 'Partager', color: 'green' },
              { icon: Star, label: 'Favoris', color: 'orange' },
              { icon: Folder, label: 'Dossiers', color: 'purple' },
              { icon: Tag, label: 'Tags', color: 'cyan' },
              { icon: Heart, label: 'Likes', color: 'red' },
              { icon: Settings, label: 'Réglages', color: 'gray' },
            ].map((action, i) => (
              <button
                key={i}
                onClick={() => {
                  toast.success(`Action "${action.label}" exécutée !`, { duration: 2000 });
                  setShowBottomDrawer(false);
                }}
                className={`p-4 rounded-lg bg-${action.color}-50 dark:bg-${action.color}-900/20 hover:bg-${action.color}-100 dark:hover:bg-${action.color}-900/30 transition-all border border-${action.color}-200 dark:border-${action.color}-800 flex flex-col items-center gap-2`}
              >
                <action.icon className={`w-5 h-5 text-${action.color}-600`} />
                <span className="text-xs font-medium">{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      </Drawer>

      {/* Form Drawer */}
      <Drawer
        isOpen={showFormDrawer}
        onClose={() => setShowFormDrawer(false)}
        title="Édition Rapide"
        position="right"
        gradient="blue"
        icon={<Edit className="w-4 h-4 text-white" />}
        size="md"
      >
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2">Titre du projet</label>
            <Input placeholder="Mon projet" />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">Description</label>
            <Textarea placeholder="Description..." rows={4} />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">Statut</label>
            <Select>
              <option>En cours</option>
              <option>Terminé</option>
              <option>En attente</option>
            </Select>
          </div>
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              onClick={() => {
                toast.success('Modifications enregistrées !', { title: 'Succès' });
                setShowFormDrawer(false);
              }}
              className="w-full"
            >
              Enregistrer les modifications
            </Button>
          </div>
        </div>
      </Drawer>
    </div>
  );
}
