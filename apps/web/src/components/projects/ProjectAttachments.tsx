'use client';

import { useState, useEffect } from 'react';
import { projectAttachmentsAPI, type ProjectAttachment } from '@/lib/api/project-attachments';
import { handleApiError } from '@/lib/errors/api';
import { useToast } from '@/components/ui';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Loading from '@/components/ui/Loading';
import Alert from '@/components/ui/Alert';
import { Upload, File, Trash2, Download, X } from 'lucide-react';
import { formatFileSize } from '@/lib/utils/format';

interface ProjectAttachmentsProps {
  projectId?: number;
  taskId?: number;
  onAttachmentAdded?: () => void;
}

export default function ProjectAttachments({ projectId, taskId, onAttachmentAdded }: ProjectAttachmentsProps) {
  const { showToast } = useToast();
  const [attachments, setAttachments] = useState<ProjectAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (projectId || taskId) {
      loadAttachments();
    }
  }, [projectId, taskId]);

  const loadAttachments = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await projectAttachmentsAPI.list({ project_id: projectId, task_id: taskId });
      setAttachments(data);
    } catch (err) {
      setError(handleApiError(err).message || 'Erreur lors du chargement des fichiers');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      showToast({ message: 'Veuillez sélectionner un fichier', type: 'error' });
      return;
    }

    if (!projectId && !taskId) {
      showToast({ message: 'Projet ou tâche requis', type: 'error' });
      return;
    }

    setUploading(true);
    setError(null);
    try {
      await projectAttachmentsAPI.upload(selectedFile, {
        project_id: projectId || undefined,
        task_id: taskId || undefined,
        description: description || undefined,
      });
      showToast({ message: 'Fichier uploadé avec succès', type: 'success' });
      setShowUploadModal(false);
      setSelectedFile(null);
      setDescription('');
      await loadAttachments();
      onAttachmentAdded?.();
    } catch (err) {
      setError(handleApiError(err).message || 'Erreur lors de l\'upload du fichier');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (attachmentId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce fichier ?')) return;

    setLoading(true);
    setError(null);
    try {
      await projectAttachmentsAPI.delete(attachmentId);
      showToast({ message: 'Fichier supprimé avec succès', type: 'success' });
      await loadAttachments();
      onAttachmentAdded?.();
    } catch (err) {
      setError(handleApiError(err).message || 'Erreur lors de la suppression du fichier');
    } finally {
      setLoading(false);
    }
  };

  const getFileIcon = (contentType: string) => {
    if (contentType.startsWith('image/')) return '🖼️';
    if (contentType.includes('pdf')) return '📄';
    if (contentType.includes('word') || contentType.includes('document')) return '📝';
    if (contentType.includes('excel') || contentType.includes('spreadsheet')) return '📊';
    if (contentType.includes('zip') || contentType.includes('archive')) return '📦';
    return '📎';
  };

  if (loading && attachments.length === 0) {
    return <Loading />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Fichiers attachés</h3>
        <Button
          size="sm"
          onClick={() => setShowUploadModal(true)}
          disabled={!projectId && !taskId}
        >
          <Upload className="w-4 h-4 mr-2" />
          Ajouter un fichier
        </Button>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      {attachments.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <File className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Aucun fichier attaché</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {attachments.map((attachment) => (
            <Card key={attachment.id} className="p-4">
              <div className="flex items-start gap-3">
                <div className="text-2xl">{getFileIcon(attachment.content_type)}</div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-foreground truncate">{attachment.original_filename}</h4>
                  <p className="text-sm text-muted-foreground">
                    {formatFileSize(attachment.file_size)} • {new Date(attachment.created_at).toLocaleDateString('fr-FR')}
                  </p>
                  {attachment.description && (
                    <p className="text-sm text-muted-foreground mt-1">{attachment.description}</p>
                  )}
                  {attachment.uploaded_by_name && (
                    <p className="text-xs text-muted-foreground mt-1">Par {attachment.uploaded_by_name}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => window.open(attachment.file_url, '_blank')}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(attachment.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Ajouter un fichier</h3>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setShowUploadModal(false);
                  setSelectedFile(null);
                  setDescription('');
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Fichier
                </label>
                <input
                  type="file"
                  onChange={handleFileSelect}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                />
                {selectedFile && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {selectedFile.name} ({formatFileSize(selectedFile.size)})
                  </p>
                )}
              </div>
              <Input
                label="Description (optionnel)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                fullWidth
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowUploadModal(false);
                    setSelectedFile(null);
                    setDescription('');
                  }}
                >
                  Annuler
                </Button>
                <Button onClick={handleUpload} loading={uploading} disabled={!selectedFile}>
                  Uploader
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
