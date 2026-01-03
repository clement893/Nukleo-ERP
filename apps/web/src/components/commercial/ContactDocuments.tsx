'use client';

/**
 * Contact Documents Component
 * Allows adding, viewing, and managing documents for a contact
 * Supports file uploads (PDF, JPG) and external links (Google Drive, etc.)
 */

import { useState, useEffect, useRef } from 'react';
import { 
  FileText, 
  Upload, 
  Link as LinkIcon, 
  ExternalLink, 
  Image as ImageIcon,
  File,
  Trash2,
  Loader2
} from 'lucide-react';
import { Button, Input, Card } from '@/components/ui';
import { useToast } from '@/components/ui';
import { type Contact } from '@/lib/api/contacts';
import { mediaAPI } from '@/lib/api/media';
import { handleApiError } from '@/lib/errors/api';

export interface ContactDocument {
  id: string;
  name: string;
  type: 'file' | 'link';
  url: string;
  file_type?: string; // For files: 'pdf', 'jpg', 'png', etc.
  size?: number; // For files: size in bytes
  created_at: string;
  created_by?: string;
}

interface ContactDocumentsProps {
  contactId: number;
  contact: Contact | null;
  onUpdate?: () => void;
}

export function ContactDocuments({ 
  contactId, 
  contact,
  onUpdate 
}: ContactDocumentsProps) {
  const { showToast } = useToast();
  const [documents, setDocuments] = useState<ContactDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [showAddLink, setShowAddLink] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkName, setLinkName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadDocuments();
  }, [contactId, contact]);

  const loadDocuments = () => {
    try {
      // Load documents from localStorage (temporary solution)
      // In production, you'd want a dedicated API endpoint for contact documents
      const storageKey = `contact_documents_${contactId}`;
      const stored = localStorage.getItem(storageKey);
      
      if (stored) {
        try {
          const docs = JSON.parse(stored) as ContactDocument[];
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

  const saveDocuments = async (newDocuments: ContactDocument[]) => {
    try {
      // Save documents to localStorage (temporary solution)
      // In production, you'd want a dedicated API endpoint for contact documents
      const storageKey = `contact_documents_${contactId}`;
      localStorage.setItem(storageKey, JSON.stringify(newDocuments));
      
      setDocuments(newDocuments);
      onUpdate?.();
      showToast({
        message: 'Documents mis à jour avec succès',
        type: 'success',
      });
    } catch (error) {
      console.error('Error saving documents:', error);
      showToast({
        message: 'Erreur lors de la sauvegarde des documents',
        type: 'error',
      });
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      showToast({
        message: 'Type de fichier non autorisé. Utilisez PDF, JPG ou PNG.',
        type: 'error',
      });
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      showToast({
        message: 'Fichier trop volumineux. Taille maximale: 10MB',
        type: 'error',
      });
      return;
    }

    setIsUploading(true);

    try {
      // Upload file using mediaAPI
      const uploadedFile = await mediaAPI.upload(file, {
        entity_type: 'contact',
        entity_id: String(contactId),
      });

      // Create document entry
      const newDocument: ContactDocument = {
        id: uploadedFile.id || `doc_${Date.now()}`,
        name: file.name,
        type: 'file',
        url: uploadedFile.url || uploadedFile.file_url || '',
        file_type: file.type.split('/')[1],
        size: file.size,
        created_at: new Date().toISOString(),
      };

      await saveDocuments([...documents, newDocument]);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
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
    if (!linkUrl.trim()) {
      showToast({
        message: 'Veuillez entrer une URL',
        type: 'error',
      });
      return;
    }

    try {
      const newDocument: ContactDocument = {
        id: `link_${Date.now()}`,
        name: linkName.trim() || linkUrl,
        type: 'link',
        url: linkUrl.trim(),
        created_at: new Date().toISOString(),
      };

      await saveDocuments([...documents, newDocument]);
      
      // Reset form
      setLinkUrl('');
      setLinkName('');
      setShowAddLink(false);
    } catch (error) {
      showToast({
        message: 'Erreur lors de l\'ajout du lien',
        type: 'error',
      });
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    try {
      const updatedDocuments = documents.filter(doc => doc.id !== documentId);
      await saveDocuments(updatedDocuments);
    } catch (error) {
      showToast({
        message: 'Erreur lors de la suppression du document',
        type: 'error',
      });
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (fileType?: string) => {
    if (!fileType) return <File className="w-5 h-5" />;
    
    if (fileType.includes('pdf')) {
      return <FileText className="w-5 h-5 text-red-500" />;
    }
    if (fileType.includes('image') || fileType.includes('jpg') || fileType.includes('png')) {
      return <ImageIcon className="w-5 h-5 text-blue-500" />;
    }
    return <File className="w-5 h-5" />;
  };

  if (isLoading) {
    return (
      <Card className="glass-card p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Actions */}
      <div className="flex items-center gap-2 flex-wrap">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={handleFileUpload}
          className="hidden"
        />
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
              Upload un fichier
            </>
          )}
        </Button>
        
        {!showAddLink ? (
          <Button
            variant="outline"
            onClick={() => setShowAddLink(true)}
            className="flex items-center gap-2"
          >
            <LinkIcon className="w-4 h-4" />
            Ajouter un lien
          </Button>
        ) : (
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Input
              placeholder="Nom du lien (optionnel)"
              value={linkName}
              onChange={(e) => setLinkName(e.target.value)}
              className="flex-1 min-w-0"
            />
            <Input
              placeholder="URL (ex: https://drive.google.com/...)"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              className="flex-1 min-w-0"
            />
            <Button
              variant="primary"
              onClick={handleAddLink}
              className="flex items-center gap-2"
            >
              Ajouter
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddLink(false);
                setLinkUrl('');
                setLinkName('');
              }}
            >
              Annuler
            </Button>
          </div>
        )}
      </div>

      {/* Documents List */}
      {documents.length === 0 ? (
        <Card className="glass-card p-6">
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Aucun document pour ce contact.</p>
            <p className="text-sm mt-2">Ajoutez un fichier ou un lien ci-dessus.</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {documents.map((document) => (
            <Card key={document.id} className="glass-card p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex-shrink-0">
                    {document.type === 'link' ? (
                      <LinkIcon className="w-5 h-5 text-primary-500" />
                    ) : (
                      getFileIcon(document.file_type)
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-foreground truncate">
                      {document.name}
                    </h4>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      {document.type === 'file' && document.size && (
                        <span>{formatFileSize(document.size)}</span>
                      )}
                      {document.type === 'link' && (
                        <span className="truncate">{document.url}</span>
                      )}
                      {document.created_at && (
                        <>
                          <span>•</span>
                          <span>
                            {new Date(document.created_at).toLocaleDateString('fr-FR')}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {document.type === 'link' ? (
                    <a
                      href={document.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 hover:bg-muted rounded-lg transition-colors"
                    >
                      <ExternalLink className="w-4 h-4 text-primary-500" />
                    </a>
                  ) : (
                    <a
                      href={document.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 hover:bg-muted rounded-lg transition-colors"
                    >
                      <ExternalLink className="w-4 h-4 text-primary-500" />
                    </a>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteDocument(document.id)}
                    className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
