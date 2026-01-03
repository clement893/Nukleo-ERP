'use client';

import { useState } from 'react';
import { Plus, Upload, Edit, X, Briefcase, Users, Calendar, DollarSign, Link as LinkIcon, FileText, Target, Sparkles, Download } from 'lucide-react';

export default function CreationProjetDemoPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'ACTIVE',
    client_id: '',
    equipe: '',
    etape: '',
    annee_realisation: '',
    contact: '',
    budget: '',
    proposal_url: '',
    drive_url: '',
    slack_url: '',
    echeancier_url: '',
    start_date: '',
    end_date: '',
    deadline: '',
  });

  const [editData, setEditData] = useState({
    name: 'Refonte Site Web Acme Corp',
    description: 'Refonte complète du site web corporate avec nouveau design et CMS',
    status: 'ACTIVE',
    client_id: '1',
    equipe: 'Le Lab',
    etape: 'Développement',
    annee_realisation: '2026',
    contact: 'Jean Tremblay',
    budget: '75000',
    proposal_url: 'https://drive.google.com/proposal',
    drive_url: 'https://drive.google.com/project',
    slack_url: 'https://slack.com/channel',
    echeancier_url: 'https://docs.google.com/schedule',
    start_date: '2026-01-15',
    end_date: '2026-06-30',
    deadline: '2026-06-30',
  });

  const STATUS_OPTIONS = [
    { value: 'ACTIVE', label: 'Actif' },
    { value: 'COMPLETED', label: 'Terminé' },
    { value: 'ARCHIVED', label: 'Archivé' },
    { value: 'ON_HOLD', label: 'En pause' },
  ];

  const CLIENT_OPTIONS = [
    { value: '1', label: 'Acme Corp' },
    { value: '2', label: 'TechStart Inc' },
    { value: '3', label: 'Global Solutions' },
  ];

  const EQUIPE_OPTIONS = [
    { value: 'Le Lab', label: 'Le Lab' },
    { value: 'Le Studio', label: 'Le Studio' },
    { value: 'Le Bureau', label: 'Le Bureau' },
  ];

  const ETAPE_OPTIONS = [
    { value: 'Découverte', label: 'Découverte' },
    { value: 'Conception', label: 'Conception' },
    { value: 'Développement', label: 'Développement' },
    { value: 'Tests', label: 'Tests' },
    { value: 'Déploiement', label: 'Déploiement' },
  ];

  const ANNEE_OPTIONS = [
    { value: '2024', label: '2024' },
    { value: '2025', label: '2025' },
    { value: '2026', label: '2026' },
  ];

  // Modern Modal Component
  const ModernModal = ({ isOpen, onClose, title, children, gradient }: any) => {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
        <div 
          className="absolute inset-0 bg-black/60 backdrop-blur-md"
          onClick={onClose}
        />
        
        <div className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-3xl shadow-2xl animate-in zoom-in-95 duration-300">
          <div className={`relative overflow-hidden ${gradient}`}>
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
            <div className="relative px-8 py-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 shadow-lg">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-3xl font-black text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  {title}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 transition-all hover:scale-110"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 overflow-y-auto max-h-[calc(90vh-100px)]">
            <div className="p-8">
              {children}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Modern Input Component
  const ModernInput = ({ label, icon: Icon, ...props }: any) => (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300">
        {Icon && <Icon className="w-4 h-4" />}
        {label}
      </label>
      <input
        {...props}
        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/20 transition-all outline-none font-medium"
      />
    </div>
  );

  // Modern Textarea Component
  const ModernTextarea = ({ label, icon: Icon, ...props }: any) => (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300">
        {Icon && <Icon className="w-4 h-4" />}
        {label}
      </label>
      <textarea
        {...props}
        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/20 transition-all outline-none font-medium resize-none"
      />
    </div>
  );

  // Modern Select Component
  const ModernSelect = ({ label, icon: Icon, options, ...props }: any) => (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300">
        {Icon && <Icon className="w-4 h-4" />}
        {label}
      </label>
      <select
        {...props}
        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/20 transition-all outline-none font-medium cursor-pointer"
      >
        {options.map((opt: any) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );

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
                Création de Projets
              </h1>
              <p className="text-white/90 text-xl font-medium">Design ultra-moderne avec glassmorphism avancé</p>
            </div>
          </div>
        </div>
      </div>

      {/* Demo Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Create Card */}
        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 p-[2px] shadow-xl hover:shadow-2xl transition-all hover:scale-105 duration-300">
          <div className="relative h-full bg-white dark:bg-gray-900 rounded-2xl p-6">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-violet-500/20 to-purple-600/20 rounded-full blur-3xl" />
            <div className="relative space-y-4">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 w-fit shadow-lg">
                <Plus className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-black mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  Créer Projet
                </h3>
                <p className="text-gray-600 dark:text-gray-400 font-medium">
                  Nouveau projet avec formulaire vide
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-bold shadow-lg hover:shadow-xl transition-all hover:scale-105 flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Ouvrir
              </button>
            </div>
          </div>
        </div>

        {/* Edit Card */}
        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 p-[2px] shadow-xl hover:shadow-2xl transition-all hover:scale-105 duration-300">
          <div className="relative h-full bg-white dark:bg-gray-900 rounded-2xl p-6">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/20 to-cyan-600/20 rounded-full blur-3xl" />
            <div className="relative space-y-4">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 w-fit shadow-lg">
                <Edit className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-black mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  Éditer Projet
                </h3>
                <p className="text-gray-600 dark:text-gray-400 font-medium">
                  Formulaire pré-rempli avec données
                </p>
              </div>
              <button
                onClick={() => setShowEditModal(true)}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold shadow-lg hover:shadow-xl transition-all hover:scale-105 flex items-center justify-center gap-2"
              >
                <Edit className="w-5 h-5" />
                Ouvrir
              </button>
            </div>
          </div>
        </div>

        {/* Import Card */}
        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 p-[2px] shadow-xl hover:shadow-2xl transition-all hover:scale-105 duration-300">
          <div className="relative h-full bg-white dark:bg-gray-900 rounded-2xl p-6">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-500/20 to-emerald-600/20 rounded-full blur-3xl" />
            <div className="relative space-y-4">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 w-fit shadow-lg">
                <Upload className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-black mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  Importer
                </h3>
                <p className="text-gray-600 dark:text-gray-400 font-medium">
                  Upload CSV ou fichier Excel
                </p>
              </div>
              <button
                onClick={() => setShowImportModal(true)}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold shadow-lg hover:shadow-xl transition-all hover:scale-105 flex items-center justify-center gap-2"
              >
                <Upload className="w-5 h-5" />
                Ouvrir
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Create Modal */}
      <ModernModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Créer un projet"
        gradient="bg-gradient-to-br from-violet-600 via-purple-600 to-pink-600"
      >
        <form className="space-y-8" onSubmit={(e) => { e.preventDefault(); alert('✨ Projet créé avec succès !'); setShowCreateModal(false); }}>
          <div className="space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b-2 border-gray-200 dark:border-gray-700">
              <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg">
                <Briefcase className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-black" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Informations de base
              </h3>
            </div>
            
            <ModernInput
              label="Nom du projet *"
              icon={Target}
              value={formData.name}
              onChange={(e: any) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Refonte Site Web"
              required
            />

            <ModernTextarea
              label="Description"
              icon={FileText}
              value={formData.description}
              onChange={(e: any) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Description détaillée du projet..."
              rows={4}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ModernSelect
                label="Statut"
                icon={Target}
                value={formData.status}
                onChange={(e: any) => setFormData({ ...formData, status: e.target.value })}
                options={STATUS_OPTIONS}
              />

              <ModernSelect
                label="Client"
                icon={Briefcase}
                value={formData.client_id}
                onChange={(e: any) => setFormData({ ...formData, client_id: e.target.value })}
                options={[{ value: '', label: 'Sélectionner...' }, ...CLIENT_OPTIONS]}
              />
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b-2 border-gray-200 dark:border-gray-700">
              <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 shadow-lg">
                <Users className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-black" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Équipe et organisation
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <ModernSelect
                label="Équipe"
                icon={Users}
                value={formData.equipe}
                onChange={(e: any) => setFormData({ ...formData, equipe: e.target.value })}
                options={[{ value: '', label: 'Sélectionner...' }, ...EQUIPE_OPTIONS]}
              />

              <ModernSelect
                label="Étape"
                icon={Target}
                value={formData.etape}
                onChange={(e: any) => setFormData({ ...formData, etape: e.target.value })}
                options={[{ value: '', label: 'Sélectionner...' }, ...ETAPE_OPTIONS]}
              />

              <ModernSelect
                label="Année"
                icon={Calendar}
                value={formData.annee_realisation}
                onChange={(e: any) => setFormData({ ...formData, annee_realisation: e.target.value })}
                options={[{ value: '', label: 'Sélectionner...' }, ...ANNEE_OPTIONS]}
              />
            </div>

            <ModernInput
              label="Contact principal"
              icon={Users}
              value={formData.contact}
              onChange={(e: any) => setFormData({ ...formData, contact: e.target.value })}
              placeholder="Nom du contact"
            />
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b-2 border-gray-200 dark:border-gray-700">
              <div className="p-2 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-black" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Budget et échéances
              </h3>
            </div>

            <ModernInput
              label="Budget ($)"
              icon={DollarSign}
              type="number"
              value={formData.budget}
              onChange={(e: any) => setFormData({ ...formData, budget: e.target.value })}
              placeholder="0"
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <ModernInput
                label="Date de début"
                icon={Calendar}
                type="date"
                value={formData.start_date}
                onChange={(e: any) => setFormData({ ...formData, start_date: e.target.value })}
              />

              <ModernInput
                label="Date de fin"
                icon={Calendar}
                type="date"
                value={formData.end_date}
                onChange={(e: any) => setFormData({ ...formData, end_date: e.target.value })}
              />

              <ModernInput
                label="Deadline"
                icon={Calendar}
                type="date"
                value={formData.deadline}
                onChange={(e: any) => setFormData({ ...formData, deadline: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b-2 border-gray-200 dark:border-gray-700">
              <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 shadow-lg">
                <LinkIcon className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-black" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Liens et ressources
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ModernInput
                label="URL Proposition"
                icon={LinkIcon}
                value={formData.proposal_url}
                onChange={(e: any) => setFormData({ ...formData, proposal_url: e.target.value })}
                placeholder="https://..."
              />

              <ModernInput
                label="URL Drive"
                icon={LinkIcon}
                value={formData.drive_url}
                onChange={(e: any) => setFormData({ ...formData, drive_url: e.target.value })}
                placeholder="https://drive.google.com/..."
              />

              <ModernInput
                label="URL Slack"
                icon={LinkIcon}
                value={formData.slack_url}
                onChange={(e: any) => setFormData({ ...formData, slack_url: e.target.value })}
                placeholder="https://slack.com/..."
              />

              <ModernInput
                label="URL Échéancier"
                icon={LinkIcon}
                value={formData.echeancier_url}
                onChange={(e: any) => setFormData({ ...formData, echeancier_url: e.target.value })}
                placeholder="https://..."
              />
            </div>
          </div>

          <div className="flex gap-4 pt-6 border-t-2 border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="flex-1 py-4 rounded-xl border-2 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 font-bold transition-all hover:scale-105"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-1 py-4 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-bold shadow-lg hover:shadow-xl transition-all hover:scale-105 flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Créer le projet
            </button>
          </div>
        </form>
      </ModernModal>

      {/* Edit Modal */}
      <ModernModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Éditer le projet"
        gradient="bg-gradient-to-br from-blue-600 via-cyan-600 to-teal-600"
      >
        <form className="space-y-8" onSubmit={(e) => { e.preventDefault(); alert('✨ Projet modifié avec succès !'); setShowEditModal(false); }}>
          <div className="space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b-2 border-gray-200 dark:border-gray-700">
              <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 shadow-lg">
                <Briefcase className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-black" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Informations de base
              </h3>
            </div>
            
            <ModernInput
              label="Nom du projet *"
              icon={Target}
              value={editData.name}
              onChange={(e: any) => setEditData({ ...editData, name: e.target.value })}
              required
            />

            <ModernTextarea
              label="Description"
              icon={FileText}
              value={editData.description}
              onChange={(e: any) => setEditData({ ...editData, description: e.target.value })}
              rows={4}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ModernSelect
                label="Statut"
                icon={Target}
                value={editData.status}
                onChange={(e: any) => setEditData({ ...editData, status: e.target.value })}
                options={STATUS_OPTIONS}
              />

              <ModernSelect
                label="Client"
                icon={Briefcase}
                value={editData.client_id}
                onChange={(e: any) => setEditData({ ...editData, client_id: e.target.value })}
                options={CLIENT_OPTIONS}
              />
            </div>
          </div>

          <div className="flex gap-4 pt-6 border-t-2 border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setShowEditModal(false)}
              className="flex-1 py-4 rounded-xl border-2 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 font-bold transition-all hover:scale-105"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-1 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold shadow-lg hover:shadow-xl transition-all hover:scale-105 flex items-center justify-center gap-2"
            >
              <Edit className="w-5 h-5" />
              Enregistrer
            </button>
          </div>
        </form>
      </ModernModal>

      {/* Import Modal */}
      <ModernModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        title="Importer des projets"
        gradient="bg-gradient-to-br from-green-600 via-emerald-600 to-teal-600"
      >
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <div className="inline-flex p-6 rounded-3xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-2xl">
              <Upload className="w-12 h-12 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-black mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Importer depuis un fichier
              </h3>
              <p className="text-gray-600 dark:text-gray-400 font-medium">
                Formats acceptés : CSV, Excel (.xlsx, .xls)
              </p>
            </div>
          </div>

          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity" />
            <div className="relative border-4 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl p-12 text-center hover:border-green-500 transition-all cursor-pointer bg-gray-50 dark:bg-gray-800">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-bold mb-2">Glissez-déposez votre fichier ici</p>
              <p className="text-sm text-gray-500">ou cliquez pour parcourir</p>
              <input type="file" className="hidden" accept=".csv,.xlsx,.xls" />
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-lg font-black" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Format attendu :
            </h4>
            <div className="bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-xl p-4 font-mono text-sm shadow-inner">
              nom, description, client, equipe, etape, annee, budget
            </div>
            <button className="w-full py-4 rounded-xl border-2 border-gray-300 dark:border-gray-600 hover:border-green-500 dark:hover:border-green-500 font-bold transition-all hover:scale-105 flex items-center justify-center gap-2">
              <Download className="w-5 h-5" />
              Télécharger le modèle CSV
            </button>
          </div>

          <div className="flex gap-4 pt-6 border-t-2 border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setShowImportModal(false)}
              className="flex-1 py-4 rounded-xl border-2 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 font-bold transition-all hover:scale-105"
            >
              Annuler
            </button>
            <button
              onClick={() => { alert('✨ Import lancé avec succès !'); setShowImportModal(false); }}
              className="flex-1 py-4 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold shadow-lg hover:shadow-xl transition-all hover:scale-105 flex items-center justify-center gap-2"
            >
              <Upload className="w-5 h-5" />
              Importer
            </button>
          </div>
        </div>
      </ModernModal>
    </div>
  );
}
