'use client';

import { useState, useEffect } from 'react';
import { Card, Button, Badge, Input, Select, Modal, Textarea, Loading, Heading, Text } from '@/components/ui';
import { 
  DollarSign, Plus, Edit, Trash2, Loader2, PieChart, TrendingUp
} from 'lucide-react';
import { projectBudgetItemsAPI, type ProjectBudgetItem, type ProjectBudgetItemCreate, type BudgetCategory, type ProjectBudgetSummary } from '@/lib/api/projects';
import { useToast } from '@/lib/toast';
import { logger } from '@/lib/logger';

interface ProjectBudgetManagerProps {
  projectId: number;
}

const BUDGET_CATEGORIES: Array<{ value: BudgetCategory; label: string }> = [
  { value: 'main_doeuvre', label: "Main-d'œuvre" },
  { value: 'materiel', label: 'Matériel' },
  { value: 'services', label: 'Services' },
  { value: 'frais_generaux', label: 'Frais généraux' },
  { value: 'autres', label: 'Autres' },
];

const CATEGORY_COLORS: Record<BudgetCategory, string> = {
  main_doeuvre: 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30',
  materiel: 'bg-green-500/20 text-green-700 dark:text-green-300 border-green-500/30',
  services: 'bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-500/30',
  frais_generaux: 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30',
  autres: 'bg-gray-500/20 text-gray-700 dark:text-gray-300 border-gray-500/30',
};

export default function ProjectBudgetManager({ projectId }: ProjectBudgetManagerProps) {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ProjectBudgetItem[]>([]);
  const [summary, setSummary] = useState<ProjectBudgetSummary | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ProjectBudgetItem | null>(null);
  const [formData, setFormData] = useState<ProjectBudgetItemCreate>({
    category: 'main_doeuvre',
    description: '',
    amount: 0,
    quantity: null,
    unit_price: null,
    notes: '',
  });
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    loadData();
  }, [projectId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [itemsData, summaryData] = await Promise.all([
        projectBudgetItemsAPI.list(projectId),
        projectBudgetItemsAPI.getSummary(projectId),
      ]);
      setItems(itemsData);
      setSummary(summaryData);
    } catch (error) {
      logger.error('Error loading budget items', error);
      showToast({
        title: 'Erreur',
        message: 'Impossible de charger les lignes de budget',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined) return '-';
    return new Intl.NumberFormat('fr-CA', {
      style: 'currency',
      currency: 'CAD',
    }).format(amount);
  };

  const handleOpenAddModal = () => {
    setFormData({
      category: 'main_doeuvre',
      description: '',
      amount: 0,
      quantity: null,
      unit_price: null,
      notes: '',
    });
    setEditingItem(null);
    setShowAddModal(true);
  };

  const handleOpenEditModal = (item: ProjectBudgetItem) => {
    setFormData({
      category: item.category,
      description: item.description || '',
      amount: item.amount,
      quantity: item.quantity || null,
      unit_price: item.unit_price || null,
      notes: item.notes || '',
    });
    setEditingItem(item);
    setShowAddModal(true);
  };

  const handleSave = async () => {
    if (!formData.amount || formData.amount <= 0) {
      showToast({
        title: 'Erreur',
        message: 'Le montant doit être supérieur à 0',
        type: 'error'
      });
      return;
    }

    try {
      setSaving(true);
      if (editingItem) {
        await projectBudgetItemsAPI.update(projectId, editingItem.id, formData);
        showToast({
          title: 'Succès',
          message: 'Ligne de budget modifiée avec succès',
          type: 'success'
        });
      } else {
        await projectBudgetItemsAPI.create(projectId, formData);
        showToast({
          title: 'Succès',
          message: 'Ligne de budget créée avec succès',
          type: 'success'
        });
      }
      setShowAddModal(false);
      setEditingItem(null);
      await loadData();
    } catch (error) {
      logger.error('Error saving budget item', error);
      showToast({
        title: 'Erreur',
        message: editingItem ? 'Impossible de modifier la ligne de budget' : 'Impossible de créer la ligne de budget',
        type: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (itemId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette ligne de budget ?')) {
      return;
    }

    try {
      await projectBudgetItemsAPI.delete(projectId, itemId);
      showToast({
        title: 'Succès',
        message: 'Ligne de budget supprimée avec succès',
        type: 'success'
      });
      await loadData();
    } catch (error) {
      logger.error('Error deleting budget item', error);
      showToast({
        title: 'Erreur',
        message: 'Impossible de supprimer la ligne de budget',
        type: 'error'
      });
    }
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + item.amount, 0);
  };

  if (loading) {
    return (
      <Card className="glass-card p-xl">
        <div className="flex items-center justify-center py-12">
          <Loading />
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass-card p-xl rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="glass-badge p-3 rounded-lg bg-green-500/10">
              <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <Text variant="small" className="text-muted-foreground mb-1">
            Budget total
          </Text>
          <p className="text-3xl font-black text-foreground">
            {formatCurrency(summary?.total_budget || calculateTotal())}
          </p>
        </Card>

        <Card className="glass-card p-xl rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="glass-badge p-3 rounded-lg bg-primary/10">
              <PieChart className="w-6 h-6 text-primary" />
            </div>
          </div>
          <Text variant="small" className="text-muted-foreground mb-1">
            Nombre de lignes
          </Text>
          <p className="text-3xl font-black text-foreground">
            {items.length}
          </p>
        </Card>

        <Card className="glass-card p-xl rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="glass-badge p-3 rounded-lg bg-blue-500/10">
              <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <Text variant="small" className="text-muted-foreground mb-1">
            Moyenne par ligne
          </Text>
          <p className="text-3xl font-black text-foreground">
            {items.length > 0 ? formatCurrency(calculateTotal() / items.length) : '-'}
          </p>
        </Card>
      </div>

      {/* Budget by Category Chart */}
      {summary && summary.by_category && Object.keys(summary.by_category).length > 0 && (
        <Card className="glass-card p-xl rounded-xl">
          <Heading level={3} className="mb-4">
            Répartition par catégorie
          </Heading>
          <div className="space-y-3">
            {Object.entries(summary.by_category).map(([category, amount]) => {
              const categoryLabel = BUDGET_CATEGORIES.find(c => c.value === category)?.label || category;
              const percentage = summary.total_budget > 0 
                ? ((amount / summary.total_budget) * 100).toFixed(1) 
                : '0';
              const colorClass = CATEGORY_COLORS[category as BudgetCategory] || CATEGORY_COLORS.autres;
              
              return (
                <div key={category} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge className={colorClass}>
                        {categoryLabel}
                      </Badge>
                      <Text variant="small" className="text-muted-foreground">
                        {percentage}%
                      </Text>
                    </div>
                    <Text variant="body" className="font-semibold">
                      {formatCurrency(amount)}
                    </Text>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="h-2 rounded-full bg-gradient-to-r from-primary to-primary/60" 
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Budget Items List */}
      <Card className="glass-card p-xl rounded-xl">
        <div className="flex items-center justify-between mb-6">
          <Heading level={3}>
            Lignes de budget
          </Heading>
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenAddModal}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Ajouter une ligne
          </Button>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-12">
            <div className="glass-badge p-4 rounded-full bg-muted w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <DollarSign className="w-8 h-8 text-muted-foreground" />
            </div>
            <Heading level={4} className="mb-2">
              Aucune ligne de budget
            </Heading>
            <Text variant="body" className="text-muted-foreground mb-4">
              Commencez par ajouter une ligne de budget pour ce projet.
            </Text>
            <Button variant="primary" onClick={handleOpenAddModal}>
              <Plus className="w-4 h-4 mr-2" />
              Ajouter une ligne
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => {
              const categoryLabel = BUDGET_CATEGORIES.find(c => c.value === item.category)?.label || item.category;
              const colorClass = CATEGORY_COLORS[item.category] || CATEGORY_COLORS.autres;
              
              return (
                <div
                  key={item.id}
                  className="glass-card p-lg rounded-lg border border-border hover:border-primary/30 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge className={colorClass}>
                          {categoryLabel}
                        </Badge>
                        <Text variant="body" className="font-bold text-foreground">
                          {formatCurrency(item.amount)}
                        </Text>
                      </div>
                      {item.description && (
                        <Text variant="body" className="text-foreground mb-2">
                          {item.description}
                        </Text>
                      )}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {item.quantity && item.unit_price && (
                          <span>
                            {item.quantity} × {formatCurrency(item.unit_price)}
                          </span>
                        )}
                        {item.notes && (
                          <span className="italic">{item.notes}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEditModal(item)}
                        className="text-primary hover:text-primary/80"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(item.id)}
                        className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setEditingItem(null);
        }}
        title={editingItem ? 'Modifier la ligne de budget' : 'Ajouter une ligne de budget'}
        size="lg"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowAddModal(false);
                setEditingItem(null);
              }}
              disabled={saving}
            >
              Annuler
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                editingItem ? 'Modifier' : 'Créer'
              )}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Select
            label="Catégorie *"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value as BudgetCategory })}
            fullWidth
            options={BUDGET_CATEGORIES.map(cat => ({ value: cat.value, label: cat.label }))}
          />

          <Textarea
            label="Description"
            value={formData.description || ''}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Description de la ligne de budget..."
            rows={3}
            fullWidth
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Montant total (CAD) *"
              type="number"
              step="0.01"
              min="0"
              value={formData.amount || ''}
              onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
              placeholder="0.00"
              fullWidth
            />

            <Input
              label="Quantité (optionnel)"
              type="number"
              step="0.01"
              min="0"
              value={formData.quantity || ''}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value ? parseFloat(e.target.value) : null })}
              placeholder="0.00"
              fullWidth
            />

            <Input
              label="Prix unitaire (optionnel)"
              type="number"
              step="0.01"
              min="0"
              value={formData.unit_price || ''}
              onChange={(e) => setFormData({ ...formData, unit_price: e.target.value ? parseFloat(e.target.value) : null })}
              placeholder="0.00"
              fullWidth
            />
          </div>

          <Textarea
            label="Notes"
            value={formData.notes || ''}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Notes supplémentaires..."
            rows={2}
            fullWidth
          />
        </div>
      </Modal>
    </div>
  );
}
