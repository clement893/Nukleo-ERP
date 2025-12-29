'use client';

// Force dynamic rendering to avoid static generation
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { getErrorMessage, getErrorDetail } from '@/lib/errors';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Alert from '@/components/ui/Alert';
import Loading from '@/components/ui/Loading';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Select from '@/components/ui/Select';
import { 
  leoDocumentationAPI, 
  type LeoDocumentation, 
  type LeoDocumentationCreate,
  DocumentationCategory,
  DocumentationPriority 
} from '@/lib/api/leo-documentation';
import { logger } from '@/lib/logger';
import { PageHeader, PageContainer } from '@/components/layout';
import { useToast } from '@/components/ui';
import { Plus, Edit, Trash2, BookOpen, Eye, EyeOff } from 'lucide-react';
import { clsx } from 'clsx';
import { checkMySuperAdminStatus } from '@/lib/api/admin';

const CATEGORY_LABELS: Record<DocumentationCategory, string> = {
  [DocumentationCategory.GENERAL]: 'Général',
  [DocumentationCategory.ERP_FEATURES]: 'Fonctionnalités ERP',
  [DocumentationCategory.PROJECTS]: 'Projets',
  [DocumentationCategory.COMMERCIAL]: 'Commercial',
  [DocumentationCategory.TEAMS]: 'Équipes',
  [DocumentationCategory.CLIENTS]: 'Clients',
  [DocumentationCategory.PROCEDURES]: 'Procédures',
  [DocumentationCategory.POLICIES]: 'Politiques',
  [DocumentationCategory.CUSTOM]: 'Personnalisé',
};

const PRIORITY_LABELS: Record<DocumentationPriority, string> = {
  [DocumentationPriority.LOW]: 'Basse',
  [DocumentationPriority.MEDIUM]: 'Moyenne',
  [DocumentationPriority.HIGH]: 'Haute',
  [DocumentationPriority.CRITICAL]: 'Critique',
};

const PRIORITY_COLORS: Record<DocumentationPriority, string> = {
  [DocumentationPriority.LOW]: 'bg-gray-500',
  [DocumentationPriority.MEDIUM]: 'bg-blue-500',
  [DocumentationPriority.HIGH]: 'bg-orange-500',
  [DocumentationPriority.CRITICAL]: 'bg-red-500',
};

export default function LeoDocumentationPage() {
  const router = useRouter();
  const { isAuthenticated, user, token } = useAuthStore();
  const { showToast } = useToast();
  const [documentation, setDocumentation] = useState<LeoDocumentation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<LeoDocumentation | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState<LeoDocumentationCreate>({
    title: '',
    content: '',
    category: DocumentationCategory.GENERAL,
    priority: DocumentationPriority.MEDIUM,
    is_active: true,
    order: 0,
  });

  useEffect(() => {
    const checkAccess = async () => {
      if (!isAuthenticated()) {
        router.push('/auth/login');
        return;
      }

      // Check if user is superadmin
      try {
        const status = await checkMySuperAdminStatus(token || undefined);
        if (!status.is_superadmin) {
          router.push('/dashboard');
          return;
        }
      } catch (err) {
        logger.error('Failed to check superadmin status', err instanceof Error ? err : new Error(String(err)));
        router.push('/dashboard');
        return;
      }

      loadDocumentation();
    };

    checkAccess();
  }, [isAuthenticated, user, token, router]);

  const loadDocumentation = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await leoDocumentationAPI.list();
      setDocumentation(response.items);
    } catch (err) {
      logger.error('Failed to load documentation', err instanceof Error ? err : new Error(String(err)));
      setError(getErrorDetail(err) || getErrorMessage(err, 'Erreur lors du chargement de la documentation'));
      showToast({
        message: getErrorMessage(err, 'Erreur lors du chargement de la documentation'),
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      setError(null);
      await leoDocumentationAPI.create(formData);
      setShowCreateModal(false);
      resetForm();
      await loadDocumentation();
      showToast({
        message: 'Documentation créée avec succès',
        type: 'success',
      });
    } catch (err) {
      logger.error('Failed to create documentation', err instanceof Error ? err : new Error(String(err)));
      setError(getErrorDetail(err) || getErrorMessage(err, 'Erreur lors de la création'));
      showToast({
        message: getErrorMessage(err, 'Erreur lors de la création'),
        type: 'error',
      });
    }
  };

  const handleUpdate = async () => {
    if (!selectedDoc) return;
    
    try {
      setError(null);
      await leoDocumentationAPI.update(selectedDoc.id, formData);
      setShowEditModal(false);
      setSelectedDoc(null);
      resetForm();
      await loadDocumentation();
      showToast({
        message: 'Documentation modifiée avec succès',
        type: 'success',
      });
    } catch (err) {
      logger.error('Failed to update documentation', err instanceof Error ? err : new Error(String(err)));
      setError(getErrorDetail(err) || getErrorMessage(err, 'Erreur lors de la modification'));
      showToast({
        message: getErrorMessage(err, 'Erreur lors de la modification'),
        type: 'error',
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedDoc) return;
    
    try {
      setDeleting(true);
      setError(null);
      await leoDocumentationAPI.delete(selectedDoc.id);
      setShowDeleteModal(false);
      setSelectedDoc(null);
      await loadDocumentation();
      showToast({
        message: 'Documentation supprimée avec succès',
        type: 'success',
      });
    } catch (err) {
      logger.error('Failed to delete documentation', err instanceof Error ? err : new Error(String(err)));
      setError(getErrorDetail(err) || getErrorMessage(err, 'Erreur lors de la suppression'));
      showToast({
        message: getErrorMessage(err, 'Erreur lors de la suppression'),
        type: 'error',
      });
    } finally {
      setDeleting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      category: DocumentationCategory.GENERAL,
      priority: DocumentationPriority.MEDIUM,
      is_active: true,
      order: 0,
    });
  };

  const openCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const openEditModal = (doc: LeoDocumentation) => {
    setSelectedDoc(doc);
    setFormData({
      title: doc.title,
      content: doc.content,
      category: doc.category,
      priority: doc.priority,
      is_active: doc.is_active,
      order: doc.order,
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (doc: LeoDocumentation) => {
    setSelectedDoc(doc);
    setShowDeleteModal(true);
  };

  const openPreviewModal = (doc: LeoDocumentation) => {
    setSelectedDoc(doc);
    setShowPreviewModal(true);
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="py-12 text-center">
          <Loading />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Documentation Leo"
        description="Gérez la documentation et le contexte pour l'assistant IA Leo"
        actions={
          <Button onClick={openCreateModal} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Nouvelle documentation
          </Button>
        }
      />

      {error && (
        <div className="mb-4">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      <Card>
        {documentation.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">Aucune documentation pour le moment</p>
            <Button onClick={openCreateModal}>Créer la première documentation</Button>
          </div>
        ) : (
          <div className="space-y-4">
            {documentation.map((doc) => (
              <div
                key={doc.id}
                className={clsx(
                  'p-4 border rounded-lg hover:shadow-md transition-shadow',
                  !doc.is_active && 'opacity-60'
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{doc.title}</h3>
                      <Badge variant={doc.is_active ? 'success' : 'default'}>
                        {doc.is_active ? (
                          <>
                            <Eye className="w-3 h-3 mr-1" />
                            Actif
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3 h-3 mr-1" />
                            Inactif
                          </>
                        )}
                      </Badge>
                      <Badge className={clsx('text-white', PRIORITY_COLORS[doc.priority])}>
                        {PRIORITY_LABELS[doc.priority]}
                      </Badge>
                      <Badge variant="default" className="border">
                        {CATEGORY_LABELS[doc.category]}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                      {doc.content.substring(0, 200)}...
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Ordre: {doc.order}</span>
                      <span>Créé le: {new Date(doc.created_at).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openPreviewModal(doc)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditModal(doc)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openDeleteModal(doc)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Nouvelle documentation"
        size="lg"
      >
        <DocumentationForm
          formData={formData}
          onChange={setFormData}
          onSubmit={handleCreate}
          onCancel={() => setShowCreateModal(false)}
          submitLabel="Créer"
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedDoc(null);
          resetForm();
        }}
        title="Modifier la documentation"
        size="lg"
      >
        <DocumentationForm
          formData={formData}
          onChange={setFormData}
          onSubmit={handleUpdate}
          onCancel={() => {
            setShowEditModal(false);
            setSelectedDoc(null);
            resetForm();
          }}
          submitLabel="Enregistrer"
        />
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedDoc(null);
        }}
        title="Supprimer la documentation"
      >
        <div className="space-y-4">
          <p>Êtes-vous sûr de vouloir supprimer la documentation "{selectedDoc?.title}" ?</p>
          <p className="text-sm text-muted-foreground">
            Cette action est irréversible.
          </p>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteModal(false);
                setSelectedDoc(null);
              }}
            >
              Annuler
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? 'Suppression...' : 'Supprimer'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Preview Modal */}
      <Modal
        isOpen={showPreviewModal}
        onClose={() => {
          setShowPreviewModal(false);
          setSelectedDoc(null);
        }}
        title={selectedDoc?.title || 'Aperçu'}
        size="lg"
      >
        {selectedDoc && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant={selectedDoc.is_active ? 'success' : 'default'}>
                {selectedDoc.is_active ? 'Actif' : 'Inactif'}
              </Badge>
              <Badge className={clsx('text-white', PRIORITY_COLORS[selectedDoc.priority])}>
                {PRIORITY_LABELS[selectedDoc.priority]}
              </Badge>
              <Badge variant="default" className="border">
                {CATEGORY_LABELS[selectedDoc.category]}
              </Badge>
            </div>
            <div className="prose dark:prose-invert max-w-none">
              <pre className="whitespace-pre-wrap bg-muted p-4 rounded-lg">
                {selectedDoc.content}
              </pre>
            </div>
          </div>
        )}
      </Modal>
    </PageContainer>
  );
}

interface DocumentationFormProps {
  formData: LeoDocumentationCreate;
  onChange: (data: LeoDocumentationCreate) => void;
  onSubmit: () => void;
  onCancel: () => void;
  submitLabel: string;
}

function DocumentationForm({ formData, onChange, onSubmit, onCancel, submitLabel }: DocumentationFormProps) {
  return (
    <div className="space-y-4">
      <Input
        label="Titre"
        value={formData.title}
        onChange={(e) => onChange({ ...formData, title: e.target.value })}
        required
      />

      <Textarea
        label="Contenu (Markdown)"
        value={formData.content}
        onChange={(e) => onChange({ ...formData, content: e.target.value })}
        rows={10}
        required
      />

      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Catégorie"
          value={formData.category}
          onChange={(e) => onChange({ ...formData, category: e.target.value as DocumentationCategory })}
          options={Object.entries(CATEGORY_LABELS).map(([value, label]) => ({
            value,
            label,
          }))}
        />

        <Select
          label="Priorité"
          value={formData.priority}
          onChange={(e) => onChange({ ...formData, priority: e.target.value as DocumentationPriority })}
          options={Object.entries(PRIORITY_LABELS).map(([value, label]) => ({
            value,
            label,
          }))}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Ordre"
          type="number"
          value={formData.order?.toString() || '0'}
          onChange={(e) => onChange({ ...formData, order: parseInt(e.target.value) || 0 })}
        />

        <div className="flex items-center gap-2 pt-6">
          <input
            type="checkbox"
            id="is_active"
            checked={formData.is_active}
            onChange={(e) => onChange({ ...formData, is_active: e.target.checked })}
            className="w-4 h-4"
          />
          <label htmlFor="is_active" className="text-sm font-medium">
            Documentation active
          </label>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button onClick={onSubmit} disabled={!formData.title || !formData.content}>
          {submitLabel}
        </Button>
      </div>
    </div>
  );
}
