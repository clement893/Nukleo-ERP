'use client';

/**
 * Opportunity Documents Component
 * Allows adding, viewing, and managing documents for an opportunity
 * Supports file uploads (PDF, JPG) and external links (Google Drive, etc.)
 */

import { useState, useEffect, useRef } from 'react';
import { 
  FileText, 
  Upload, 
  Link as LinkIcon, 
  X, 
  ExternalLink, 
  Image as ImageIcon,
  File,
  Trash2,
  Plus,
  Loader2
} from 'lucide-react';
import { Button, Input, Card, Alert } from '@/components/ui';
import { useToast } from '@/components/ui';
import { opportunitiesAPI, type Opportunity } from '@/lib/api/opportunities';
import { mediaAPI } from '@/lib/api/media';
import { handleApiError } from '@/lib/errors/api';

export interface OpportunityDocument {
  id: string;
  name: string;
  type: 'file' | 'link';
  url: string;
  file_type?: string; // For files: 'pdf', 'jpg', 'png', etc.
  size?: number; // For files: size in bytes
  created_at: string;
  created_by?: string;
}

interface OpportunityDocumentsProps {
  opportunityId: string;
  opportunity: Opportunity | null;
  onUpdate?: () => void;
}

export function OpportunityDocuments({ 
  opportunityId, 
  opportunity,
  onUpdate 
}: OpportunityDocumentsProps) {
  const { showToast } = useToast();
  const [documents, setDocuments] = useState<OpportunityDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [showAddLink, setShowAddLink] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkName, setLinkName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadDocuments();
  }, [opportunityId, opportunity]);

  const loadDocuments = () => {
    try {
      // Load documents from localStorage (temporary solution)
      // In production, you'd want a dedicated API endpoint for opportunity documents
      const storageKey = `opportunity_documents_${opportunityId}`;
      const stored = localStorage.getItem(storageKey);
      
      if (stored) {
        try {
          const docs = JSON.parse(stored) as OpportunityDocument[];
          setDocuments(docs);
        } catch (parseError) {
          console.error('Error parsing stored documents:', parseError);
          setDocuments([]);
        }
      } else {
        setDocuments([]);
      }
    } catch (error) {
      console.error('Error loading documents:', error);
      setDocuments([]);
    } finally {
      setIsLoading(false);
    }
  };

  const saveDocuments = async (newDocuments: OpportunityDocument[]) => {
    try {
      // Save documents to localStorage (temporary solution)
      // In production, you'd want a dedicated API endpoint for opportunity documents
      const storageKey = `opportunity_documents_${opportunityId}`;
      localStorage.setItem(storageKey, JSON.stringify(newDocuments));
      
      setDocuments(newDocuments);
      onUpdate?.();
      showToast({
        message: 'Documents mis à jour avec succès',
        type: 'success',
      });
    } catch (error) {
      const appError = handleApiError(error);
      showToast({
        message: appError.message || 'Erreur lors de la sauvegarde des documents',
        type: 'error',
      });
      throw error;
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      showToast({
        message: 'Type de fichier non supporté. Formats acceptés: PDF, JPG, PNG, GIF, WEBP',
        type: 'error',
      });
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      showToast({
        message: 'Le fichier est trop volumineux. Taille maximale: 10MB',
        type: 'error',
      });
      return;
    }

    setIsUploading(true);
    try {
      // Upload file to media storage
      const uploadResult = await mediaAPI.upload(file, {
        folder: `opportunities/${opportunityId}/documents`,
        is_public: false,
      });

      const fileType = file.type === 'application/pdf' ? 'pdf' : 
                      file.type.startsWith('image/') ? file.type.split('/')[1] : 'file';
      
      const newDocument: OpportunityDocument = {
        id: String(uploadResult.id),
        name: file.name,
        type: 'file',
        url: uploadResult.file_path,
        file_type: fileType,
        size: uploadResult.file_size,
        created_at: uploadResult.created_at,
      };

      const updatedDocuments = [...documents, newDocument];
      await saveDocuments(updatedDocuments);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      const appError = handleApiError(error);
      showToast({
        message: appError.message || 'Erreur lors de l\'upload du fichier',
        type: 'error',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddLink = async () => {
    if (!linkUrl.trim() || !linkName.trim()) {
      showToast({
        message: 'Veuillez remplir tous les champs',
        type: 'error',
      });
      return;
    }

    // Validate URL
    try {
      new URL(linkUrl);
    } catch {
      showToast({
        message: 'URL invalide',
        type: 'error',
      });
      return;
    }

    try {
      const newDocument: OpportunityDocument = {
        id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: linkName,
        type: 'link',
        url: linkUrl,
        created_at: new Date().toISOString(),
      };

      const updatedDocuments = [...documents, newDocument];
      await saveDocuments(updatedDocuments);
      
      // Reset form
      setLinkUrl('');
      setLinkName('');
      setShowAddLink(false);
    } catch (error) {
      console.error('Error adding link:', error);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) {
      return;
    }

    try {
      const document = documents.find(doc => doc.id === documentId);
      
      // If it's a file, delete from media storage
      if (document?.type === 'file') {
        try {
          await mediaAPI.delete(documentId);
        } catch (error) {
          console.warn('Error deleting file from storage:', error);
          // Continue with removing from documents list even if storage delete fails
        }
      }
      
      const updatedDocuments = documents.filter(doc => doc.id !== documentId);
      await saveDocuments(updatedDocuments);
    } catch (error) {
      console.error('Error deleting document:', error);
      const appError = handleApiError(error);
      showToast({
        message: appError.message || 'Erreur lors de la suppression du document',
        type: 'error',
      });
    }
  };

  const getFileIcon = (document: OpportunityDocument) => {
    if (document.type === 'link') {
      return <LinkIcon className="w-5 h-5" />;
    }
    
    if (document.file_type === 'pdf') {
      return <FileText className="w-5 h-5 text-red-500" />;
    }
    
    if (['jpeg', 'jpg', 'png', 'gif', 'webp'].includes(document.file_type || '')) {
      return <ImageIcon className="w-5 h-5 text-blue-500" />;
    }
    
    return <File className="w-5 h-5 text-gray-500" />;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleOpenDocument = (document: OpportunityDocument) => {
    if (document.type === 'link') {
      window.open(document.url, '_blank', 'noopener,noreferrer');
    } else {
      // For files, open in new tab
      window.open(document.url, '_blank', 'noopener,noreferrer');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Add Document Buttons */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="flex items-center gap-2"
        >
          {isUploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Upload en cours...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              Ajouter un fichier
            </>
          )}
        </Button>
        
        <Button
          variant="outline"
          onClick={() => setShowAddLink(!showAddLink)}
          className="flex items-center gap-2"
        >
          <LinkIcon className="w-4 h-4" />
          Ajouter un lien
        </Button>
        
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.gif,.webp"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>

      {/* Add Link Form */}
      {showAddLink && (
        <Card className="p-4 space-y-3">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Nom du lien
            </label>
            <Input
              value={linkName}
              onChange={(e) => setLinkName(e.target.value)}
              placeholder="Ex: Proposition Google Drive"
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              URL
            </label>
            <Input
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://drive.google.com/..."
              className="w-full"
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleAddLink} size="sm">
              Ajouter
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowAddLink(false);
                setLinkUrl('');
                setLinkName('');
              }}
              size="sm"
            >
              Annuler
            </Button>
          </div>
        </Card>
      )}

      {/* Documents List */}
      {documents.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">Aucun document associé à cette opportunité.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((document) => (
            <Card 
              key={document.id} 
              className="p-4 hover:shadow-lg transition-shadow cursor-pointer group"
              onClick={() => handleOpenDocument(document)}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 p-2 bg-muted rounded-lg">
                  {getFileIcon(document)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-foreground truncate group-hover:text-primary-500 transition-colors">
                    {document.name}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    {document.type === 'link' ? (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <LinkIcon className="w-3 h-3" />
                        Lien externe
                      </span>
                    ) : (
                      <>
                        <span className="text-xs text-muted-foreground uppercase">
                          {document.file_type}
                        </span>
                        {document.size && (
                          <span className="text-xs text-muted-foreground">
                            • {formatFileSize(document.size)}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                  {document.created_at && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(document.created_at).toLocaleDateString('fr-FR')}
                    </p>
                  )}
                </div>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteDocument(document.id);
                  }}
                  className="flex-shrink-0 p-1 text-muted-foreground hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                  title="Supprimer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              
              {document.type === 'link' && (
                <div className="mt-2 pt-2 border-t border-border">
                  <a
                    href={document.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-xs text-primary-500 hover:text-primary-600 flex items-center gap-1"
                  >
                    Ouvrir le lien
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
