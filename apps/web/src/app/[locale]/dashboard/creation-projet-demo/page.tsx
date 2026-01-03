'use client';

import { useState } from 'react';
import { Plus, Upload, Edit, Briefcase, Users, DollarSign, Link as LinkIcon, FileText, Download } from 'lucide-react';
import { Button, Card, Input, Select, Textarea, Modal } from '@/components/ui';

export default function CreationProjetDemoPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  // Form data
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

  // Edit form (pre-filled)
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-[#5F2B75] via-[#523DC9] to-[#6B1817] opacity-90" />
        <div className="relative p-8">
          <h1 className="text-4xl font-black text-white mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Démo Création de Projets
          </h1>
          <p className="text-white/80 text-lg">Cliquez sur les boutons pour voir les popups</p>
        </div>
      </div>

      {/* Demo Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-lg bg-violet-500/10 border border-violet-500/30">
              <Plus className="w-6 h-6 text-violet-600" />
            </div>
            <div>
              <h3 className="font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Créer Projet</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Nouveau projet vide</p>
            </div>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Ouvrir Modal
          </Button>
        </Card>

        <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
              <Edit className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Éditer Projet</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Formulaire pré-rempli</p>
            </div>
          </div>
          <Button
            onClick={() => setShowEditModal(true)}
            className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
          >
            <Edit className="w-4 h-4 mr-2" />
            Ouvrir Modal
          </Button>
        </Card>

        <Card className="glass-card p-6 rounded-xl border border-[#A7A2CF]/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
              <Upload className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Importer</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">CSV / Excel</p>
            </div>
          </div>
          <Button
            onClick={() => setShowImportModal(true)}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
          >
            <Upload className="w-4 h-4 mr-2" />
            Ouvrir Modal
          </Button>
        </Card>
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Créer un nouveau projet"
        size="lg"
      >
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); alert('Projet créé !'); setShowCreateModal(false); }}>
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              <Briefcase className="w-5 h-5 text-violet-600" />
              Informations de base
            </h3>
            
            <Input
              label="Nom du projet *"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Refonte Site Web"
              required
            />

            <Textarea
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Description détaillée du projet..."
              rows={3}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Statut"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                options={STATUS_OPTIONS}
              />

              <Select
                label="Client"
                value={formData.client_id}
                onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                options={[{ value: '', label: 'Sélectionner...' }, ...CLIENT_OPTIONS]}
              />
            </div>
          </div>

          {/* Team & Stage */}
          <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold flex items-center gap-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              <Users className="w-5 h-5 text-blue-600" />
              Équipe et étape
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select
                label="Équipe"
                value={formData.equipe}
                onChange={(e) => setFormData({ ...formData, equipe: e.target.value })}
                options={[{ value: '', label: 'Sélectionner...' }, ...EQUIPE_OPTIONS]}
              />

              <Select
                label="Étape"
                value={formData.etape}
                onChange={(e) => setFormData({ ...formData, etape: e.target.value })}
                options={[{ value: '', label: 'Sélectionner...' }, ...ETAPE_OPTIONS]}
              />

              <Select
                label="Année"
                value={formData.annee_realisation}
                onChange={(e) => setFormData({ ...formData, annee_realisation: e.target.value })}
                options={[{ value: '', label: 'Sélectionner...' }, ...ANNEE_OPTIONS]}
              />
            </div>

            <Input
              label="Contact"
              value={formData.contact}
              onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
              placeholder="Nom du contact principal"
            />
          </div>

          {/* Budget & Dates */}
          <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold flex items-center gap-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              <DollarSign className="w-5 h-5 text-green-600" />
              Budget et dates
            </h3>

            <Input
              label="Budget"
              type="number"
              value={formData.budget}
              onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
              placeholder="0"
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Date de début"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              />

              <Input
                label="Date de fin"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              />

              <Input
                label="Deadline"
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              />
            </div>
          </div>

          {/* URLs */}
          <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold flex items-center gap-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              <LinkIcon className="w-5 h-5 text-orange-600" />
              Liens et documents
            </h3>

            <Input
              label="URL Proposition"
              value={formData.proposal_url}
              onChange={(e) => setFormData({ ...formData, proposal_url: e.target.value })}
              placeholder="https://..."
            />

            <Input
              label="URL Drive"
              value={formData.drive_url}
              onChange={(e) => setFormData({ ...formData, drive_url: e.target.value })}
              placeholder="https://drive.google.com/..."
            />

            <Input
              label="URL Slack"
              value={formData.slack_url}
              onChange={(e) => setFormData({ ...formData, slack_url: e.target.value })}
              placeholder="https://slack.com/..."
            />

            <Input
              label="URL Échéancier"
              value={formData.echeancier_url}
              onChange={(e) => setFormData({ ...formData, echeancier_url: e.target.value })}
              placeholder="https://..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowCreateModal(false)}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Créer le projet
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal (Pre-filled) */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Éditer le projet"
        size="lg"
      >
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); alert('Projet modifié !'); setShowEditModal(false); }}>
          {/* Same structure but with editData */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              <Briefcase className="w-5 h-5 text-blue-600" />
              Informations de base
            </h3>
            
            <Input
              label="Nom du projet *"
              value={editData.name}
              onChange={(e) => setEditData({ ...editData, name: e.target.value })}
              required
            />

            <Textarea
              label="Description"
              value={editData.description}
              onChange={(e) => setEditData({ ...editData, description: e.target.value })}
              rows={3}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Statut"
                value={editData.status}
                onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                options={STATUS_OPTIONS}
              />

              <Select
                label="Client"
                value={editData.client_id}
                onChange={(e) => setEditData({ ...editData, client_id: e.target.value })}
                options={CLIENT_OPTIONS}
              />
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold flex items-center gap-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              <Users className="w-5 h-5 text-blue-600" />
              Équipe et étape
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select
                label="Équipe"
                value={editData.equipe}
                onChange={(e) => setEditData({ ...editData, equipe: e.target.value })}
                options={EQUIPE_OPTIONS}
              />

              <Select
                label="Étape"
                value={editData.etape}
                onChange={(e) => setEditData({ ...editData, etape: e.target.value })}
                options={ETAPE_OPTIONS}
              />

              <Select
                label="Année"
                value={editData.annee_realisation}
                onChange={(e) => setEditData({ ...editData, annee_realisation: e.target.value })}
                options={ANNEE_OPTIONS}
              />
            </div>

            <Input
              label="Contact"
              value={editData.contact}
              onChange={(e) => setEditData({ ...editData, contact: e.target.value })}
            />
          </div>

          <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold flex items-center gap-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              <DollarSign className="w-5 h-5 text-green-600" />
              Budget et dates
            </h3>

            <Input
              label="Budget"
              type="number"
              value={editData.budget}
              onChange={(e) => setEditData({ ...editData, budget: e.target.value })}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Date de début"
                type="date"
                value={editData.start_date}
                onChange={(e) => setEditData({ ...editData, start_date: e.target.value })}
              />

              <Input
                label="Date de fin"
                type="date"
                value={editData.end_date}
                onChange={(e) => setEditData({ ...editData, end_date: e.target.value })}
              />

              <Input
                label="Deadline"
                type="date"
                value={editData.deadline}
                onChange={(e) => setEditData({ ...editData, deadline: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold flex items-center gap-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              <LinkIcon className="w-5 h-5 text-orange-600" />
              Liens et documents
            </h3>

            <Input
              label="URL Proposition"
              value={editData.proposal_url}
              onChange={(e) => setEditData({ ...editData, proposal_url: e.target.value })}
            />

            <Input
              label="URL Drive"
              value={editData.drive_url}
              onChange={(e) => setEditData({ ...editData, drive_url: e.target.value })}
            />

            <Input
              label="URL Slack"
              value={editData.slack_url}
              onChange={(e) => setEditData({ ...editData, slack_url: e.target.value })}
            />

            <Input
              label="URL Échéancier"
              value={editData.echeancier_url}
              onChange={(e) => setEditData({ ...editData, echeancier_url: e.target.value })}
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowEditModal(false)}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
            >
              <Edit className="w-4 h-4 mr-2" />
              Enregistrer
            </Button>
          </div>
        </form>
      </Modal>

      {/* Import Modal */}
      <Modal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        title="Importer des projets"
        size="md"
      >
        <div className="space-y-6">
          <div className="text-center">
            <div className="inline-flex p-4 rounded-full bg-green-500/10 border border-green-500/30 mb-4">
              <Upload className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-bold mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Importer depuis un fichier
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Formats acceptés : CSV, Excel (.xlsx, .xls)
            </p>
          </div>

          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-green-500 transition-colors cursor-pointer">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-sm font-medium mb-1">Glissez-déposez votre fichier ici</p>
            <p className="text-xs text-gray-500">ou cliquez pour parcourir</p>
            <input type="file" className="hidden" accept=".csv,.xlsx,.xls" />
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-bold">Format attendu :</h4>
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 text-xs font-mono">
              <div className="text-gray-600 dark:text-gray-400">
                nom, description, client, equipe, etape, annee, budget
              </div>
            </div>
            <Button variant="outline" className="w-full">
              <Download className="w-4 h-4 mr-2" />
              Télécharger le modèle CSV
            </Button>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowImportModal(false)}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              onClick={() => { alert('Import lancé !'); setShowImportModal(false); }}
              className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            >
              <Upload className="w-4 h-4 mr-2" />
              Importer
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
