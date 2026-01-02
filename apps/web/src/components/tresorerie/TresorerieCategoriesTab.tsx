'use client';

import { useEffect, useState } from 'react';
import { Card, Button, Badge, Input, Modal, Switch } from '@/components/ui';
import MotionDiv from '@/components/motion/MotionDiv';
import { 
  Tag, Plus, Edit, Trash2, RefreshCw, Loader2, 
  ArrowUpCircle, ArrowDownCircle
} from 'lucide-react';
import { tresorerieAPI, type TransactionCategory, type TransactionCategoryCreate, type Transaction } from '@/lib/api/tresorerie';
import { useToast } from '@/lib/toast';
import { logger } from '@/lib/logger';

export default function TresorerieCategoriesTab() {
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<TransactionCategory[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<TransactionCategory | null>(null);
  const [formData, setFormData] = useState<TransactionCategoryCreate>({
    name: '',
    type: 'entry',
    description: null,
    color: 'var(--color-primary-500)',
    is_active: true
  });
  const { showToast } = useToast();

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const [categoriesData, transactionsData] = await Promise.all([
        tresorerieAPI.listCategories(),
        tresorerieAPI.listTransactions({ limit: 10000 })
      ]);
      setCategories(categoriesData);
      setTransactions(transactionsData);
    } catch (error) {
      logger.error('Erreur lors du chargement des catégories', error);
      showToast({
        title: 'Erreur',
        message: 'Impossible de charger les catégories',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      await tresorerieAPI.createCategory(formData);
      showToast({
        title: 'Succès',
        message: 'Catégorie créée avec succès',
        type: 'success'
      });
      setShowCreateModal(false);
      resetForm();
      await loadCategories();
    } catch (error) {
      logger.error('Erreur lors de la création', error);
      showToast({
        title: 'Erreur',
        message: 'Impossible de créer la catégorie',
        type: 'error'
      });
    }
  };

  const handleUpdate = async () => {
    if (!editingCategory) return;
    try {
      await tresorerieAPI.updateCategory(editingCategory.id, formData);
      showToast({
        title: 'Succès',
        message: 'Catégorie modifiée avec succès',
        type: 'success'
      });
      setEditingCategory(null);
      resetForm();
      await loadCategories();
    } catch (error) {
      logger.error('Erreur lors de la modification', error);
      showToast({
        title: 'Erreur',
        message: 'Impossible de modifier la catégorie',
        type: 'error'
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette catégorie ?')) return;
    try {
      await tresorerieAPI.deleteCategory(id);
      showToast({
        title: 'Succès',
        message: 'Catégorie supprimée avec succès',
        type: 'success'
      });
      await loadCategories();
    } catch (error) {
      logger.error('Erreur lors de la suppression', error);
      showToast({
        title: 'Erreur',
        message: 'Impossible de supprimer la catégorie',
        type: 'error'
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'entry',
      description: null,
      color: 'var(--color-primary-500)',
      is_active: true
    });
  };

  const openEditModal = (category: TransactionCategory) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      type: category.type,
      description: category.description,
      color: category.color || 'var(--color-primary-500)',
      is_active: category.is_active
    });
    setShowCreateModal(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Calculer les statistiques pour chaque catégorie
  const categoriesWithStats = categories.map(category => {
    const categoryTransactions = transactions.filter(t => t.category_id === category.id);
    const total = categoryTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
    const count = categoryTransactions.length;
    
    return { ...category, total, count };
  });

  const entryCategories = categoriesWithStats.filter(c => c.type === 'entry').sort((a, b) => b.total - a.total);
  const exitCategories = categoriesWithStats.filter(c => c.type === 'exit').sort((a, b) => b.total - a.total);

  if (loading) {
    return (
      <MotionDiv variant="slideUp" duration="normal">
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        </div>
      </MotionDiv>
    );
  }

  return (
    <MotionDiv variant="slideUp" duration="normal">
      {/* Actions */}
      <Card className="glass-card p-4 rounded-xl border border-nukleo-lavender/20 mb-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold font-nukleo">
            Catégories ({categories.length})
          </h3>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={loadCategories}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualiser
            </Button>
            <Button variant="primary" size="sm" onClick={() => {
              resetForm();
              setEditingCategory(null);
              setShowCreateModal(true);
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Ajouter une Catégorie
            </Button>
          </div>
        </div>
      </Card>

      {/* Catégories Entrées */}
      <Card className="glass-card p-6 rounded-xl border border-nukleo-lavender/20 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <ArrowUpCircle className="w-5 h-5 text-green-600" />
          <h3 className="text-lg font-bold font-nukleo">
            Catégories d'Entrées ({entryCategories.length})
          </h3>
        </div>
        {entryCategories.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {entryCategories.map((category) => (
              <div
                key={category.id}
                className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-500 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: category.color || 'var(--color-primary-500)' }}
                    />
                    <h4 className="font-semibold">{category.name}</h4>
                  </div>
                  <Badge className={`${category.is_active ? 'bg-green-500/10 text-green-600 border-green-500/30' : 'bg-gray-500/10 text-gray-600 border-gray-500/30'} border`}>
                    {category.is_active ? 'Actif' : 'Inactif'}
                  </Badge>
                </div>
                <div className="space-y-2 mb-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Total:</span>
                    <span className="font-bold text-green-600">{formatCurrency(category.total)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Transactions:</span>
                    <span className="font-medium">{category.count}</span>
                  </div>
                </div>
                {category.description && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">{category.description}</p>
                )}
                <div className="flex gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditModal(category)}
                    className="flex-1"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Modifier
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(category.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Tag className="w-12 h-12 mx-auto mb-2 text-gray-400" />
            <p>Aucune catégorie d'entrée</p>
          </div>
        )}
      </Card>

      {/* Catégories Sorties */}
      <Card className="glass-card p-6 rounded-xl border border-nukleo-lavender/20 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <ArrowDownCircle className="w-5 h-5 text-red-600" />
          <h3 className="text-lg font-bold font-nukleo">
            Catégories de Sorties ({exitCategories.length})
          </h3>
        </div>
        {exitCategories.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {exitCategories.map((category) => (
              <div
                key={category.id}
                className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-500 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: category.color || 'var(--color-primary-500)' }}
                    />
                    <h4 className="font-semibold">{category.name}</h4>
                  </div>
                  <Badge className={`${category.is_active ? 'bg-green-500/10 text-green-600 border-green-500/30' : 'bg-gray-500/10 text-gray-600 border-gray-500/30'} border`}>
                    {category.is_active ? 'Actif' : 'Inactif'}
                  </Badge>
                </div>
                <div className="space-y-2 mb-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Total:</span>
                    <span className="font-bold text-red-600">{formatCurrency(category.total)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Transactions:</span>
                    <span className="font-medium">{category.count}</span>
                  </div>
                </div>
                {category.description && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">{category.description}</p>
                )}
                <div className="flex gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditModal(category)}
                    className="flex-1"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Modifier
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(category.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Tag className="w-12 h-12 mx-auto mb-2 text-gray-400" />
            <p>Aucune catégorie de sortie</p>
          </div>
        )}
      </Card>

      {/* Modal Création/Édition */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setEditingCategory(null);
          resetForm();
        }}
        title={editingCategory ? 'Modifier la Catégorie' : 'Nouvelle Catégorie'}
        size="md"
        footer={
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateModal(false);
                setEditingCategory(null);
                resetForm();
              }}
            >
              Annuler
            </Button>
            <Button
              variant="primary"
              onClick={editingCategory ? handleUpdate : handleCreate}
            >
              {editingCategory ? 'Modifier' : 'Créer'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Nom de la catégorie *</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Salaire, Factures, etc."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Type *</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: 'entry' })}
                className={`p-3 rounded-lg border-2 transition-all ${
                  formData.type === 'entry'
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <ArrowUpCircle className={`w-4 h-4 ${formData.type === 'entry' ? 'text-green-600' : 'text-gray-400'}`} />
                  <span className="font-medium">Entrée</span>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: 'exit' })}
                className={`p-3 rounded-lg border-2 transition-all ${
                  formData.type === 'exit'
                    ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <ArrowDownCircle className={`w-4 h-4 ${formData.type === 'exit' ? 'text-red-600' : 'text-gray-400'}`} />
                  <span className="font-medium">Sortie</span>
                </div>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Couleur</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={formData.color || 'var(--color-primary-500)'}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-12 h-10 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
              />
              <Input
                value={formData.color || 'var(--color-primary-500)'}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                placeholder="var(--color-primary-500)"
                className="flex-1"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <Input
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value || null })}
              placeholder="Description de la catégorie..."
            />
          </div>

          <div>
            <label className="flex items-center gap-2">
              <Switch
                checked={formData.is_active ?? true}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              />
              <span className="text-sm font-medium">Catégorie active</span>
            </label>
          </div>
        </div>
      </Modal>
    </MotionDiv>
  );
}
