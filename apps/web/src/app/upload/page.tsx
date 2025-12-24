'use client';

// Force dynamic rendering to avoid prerendering issues
export const dynamic = 'force-dynamic';

import { useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Container from '@/components/ui/Container';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import FileUploadWithPreview from '@/components/ui/FileUploadWithPreview';
import Alert from '@/components/ui/Alert';
import Badge from '@/components/ui/Badge';
import { Upload, CheckCircle, XCircle, File, Image, FileText } from 'lucide-react';
import { logger } from '@/lib/logger';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  uploadedAt: string;
  status: 'uploading' | 'success' | 'error';
}

function UploadContent() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleFileSelect = (files: File[]) => {
    logger.debug('Files selected', { count: files.length, names: files.map(f => f.name) });
    setSelectedFiles(files);
    setError(null);
    setSuccess(null);
  };

  const handleUpload = async () => {
    logger.debug('handleUpload called', { selectedFilesCount: selectedFiles.length });
    
    if (selectedFiles.length === 0) {
      setError('Veuillez sélectionner au moins un fichier');
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      logger.info('Starting upload', { fileCount: selectedFiles.length });
      
      // Simulate S3 upload - Replace with actual API call
      const uploadPromises = selectedFiles.map(async (file, index) => {
        logger.debug('Uploading file', { index: index + 1, total: selectedFiles.length, fileName: file.name });
        
        // Simulate upload delay
        await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 2000));

        // Simulate success/error (90% success rate)
        const success = Math.random() > 0.1;

        const result = {
          id: `file-${Date.now()}-${Math.random().toString(36).substring(7)}`,
          name: file.name,
          size: file.size,
          type: file.type,
          url: success ? `https://s3.example.com/uploads/${file.name}` : undefined,
          uploadedAt: new Date().toISOString(),
          status: success ? ('success' as const) : ('error' as const),
        };
        
        logger.debug('File upload result', { fileName: file.name, success });
        return result;
      });

      const results = await Promise.all(uploadPromises);
      logger.info('Upload completed', { results });
      
      setUploadedFiles((prev) => [...prev, ...results]);
      setSelectedFiles([]);
      setSuccess(`${results.filter((r) => r.status === 'success').length} fichier(s) uploadé(s) avec succès`);
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'upload des fichiers');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = (fileId: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) {
      return <Image className="w-5 h-5" />;
    }
    if (type.includes('pdf')) {
      return <FileText className="w-5 h-5" />;
    }
    return <File className="w-5 h-5" />;
  };

  return (
    <Container className="py-8 lg:py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Test S3 Upload
        </h1>
        <p className="text-gray-700 dark:text-gray-300">
          Testez l'upload de fichiers vers AWS S3
        </p>
      </div>

      {error && (
        <Alert variant="error" title="Erreur" onClose={() => setError(null)} className="mb-6">
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant="success" title="Succès" onClose={() => setSuccess(null)} className="mb-6">
          {success}
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Section */}
        <Card title="Upload de fichiers" className="lg:col-span-2">
          <div className="space-y-6">
            <FileUploadWithPreview
              label="Sélectionner des fichiers"
              accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx"
              multiple
              onFileSelect={handleFileSelect}
              maxSize={10}
              helperText="Taille maximale: 10MB par fichier"
              fullWidth
            />

            {selectedFiles.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Fichiers sélectionnés ({selectedFiles.length}):
                </p>
                <div className="space-y-2">
                  {selectedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-800 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {getFileIcon(file.type)}
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {file.name}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {formatFileSize(file.size)}
                          </p>
                        </div>
                      </div>
                      <Badge variant="default">{file.type}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col gap-3">
              {selectedFiles.length === 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                  Sélectionnez des fichiers ci-dessus pour activer le bouton d'upload
                </p>
              )}
              <div className="flex gap-3">
                <Button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Button clicked', { selectedFilesCount: selectedFiles.length, uploading, files: selectedFiles.map(f => f.name) });
                    if (selectedFiles.length === 0) {
                      setError('Veuillez sélectionner au moins un fichier avant de cliquer sur Uploader');
                      return;
                    }
                    handleUpload();
                  }}
                  loading={uploading}
                  disabled={selectedFiles.length === 0 || uploading}
                  type="button"
                >
                  <span className="flex items-center gap-2">
                    <Upload className="w-5 h-5" />
                    {uploading ? 'Upload en cours...' : selectedFiles.length > 0 ? `Uploader ${selectedFiles.length} fichier(s)` : 'Sélectionnez des fichiers'}
                  </span>
                </Button>
                {selectedFiles.length > 0 && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      console.log('Clearing selection');
                      setSelectedFiles([]);
                    }}
                    disabled={uploading}
                    type="button"
                  >
                    Effacer la sélection
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Uploaded Files List */}
        {uploadedFiles.length > 0 && (
          <Card title="Fichiers uploadés" className="lg:col-span-2">
            <div className="space-y-3">
              {uploadedFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-4 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {file.status === 'success' ? (
                      <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {file.name}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {formatFileSize(file.size)}
                        </p>
                        <span className="text-gray-400 dark:text-gray-500">•</span>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {new Date(file.uploadedAt).toLocaleString('fr-FR')}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge variant={file.status === 'success' ? 'success' : 'error'}>
                      {file.status === 'success' ? 'Uploadé' : 'Erreur'}
                    </Badge>
                    {file.url && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(file.url, '_blank')}
                      >
                        Voir
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(file.id)}
                      className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-500"
                    >
                      Supprimer
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Instructions */}
        <Card title="Instructions">
          <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
            <div>
              <h3 className="font-semibold mb-2">Types de fichiers acceptés:</h3>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Images (JPG, PNG, GIF, etc.)</li>
                <li>Documents PDF</li>
                <li>Documents Word (.doc, .docx)</li>
                <li>Fichiers Excel (.xls, .xlsx)</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Limites:</h3>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Taille maximale: 10MB par fichier</li>
                <li>Upload multiple supporté</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Note:</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Cette page simule l'upload vers S3. Dans un environnement de production,
                vous devrez configurer les credentials AWS et utiliser l'API backend
                pour générer les URLs de pré-signature S3.
              </p>
            </div>
          </div>
        </Card>

        {/* Status */}
        <Card title="Statut du service">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Connexion S3
              </span>
              <Badge variant="success">Connecté</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Bucket configuré
              </span>
              <Badge variant="success">Actif</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Permissions
              </span>
              <Badge variant="success">OK</Badge>
            </div>
          </div>
        </Card>
      </div>
    </Container>
  );
}

export default function UploadPage() {
  return (
    <ProtectedRoute>
      <UploadContent />
    </ProtectedRoute>
  );
}

