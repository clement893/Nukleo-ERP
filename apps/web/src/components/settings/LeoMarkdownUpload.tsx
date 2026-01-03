/**
 * Leo Markdown Upload Component
 * 
 * Component for uploading, downloading, and managing markdown instruction files
 */

'use client';

import { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Upload, Download, Trash2, FileText, Loader2 } from 'lucide-react';
import { leoSettingsAPI } from '@/lib/api/leo-settings';
import { useToast } from '@/components/ui';
import Alert from '@/components/ui/Alert';

export interface LeoMarkdownUploadProps {
  fileName: string | null;
  onUploadSuccess?: () => void;
}

export default function LeoMarkdownUpload({
  fileName,
  onUploadSuccess,
}: LeoMarkdownUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: (file: File) => leoSettingsAPI.uploadMarkdown(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leo-settings'] });
      queryClient.invalidateQueries({ queryKey: ['leo-system-prompt'] });
      showToast({
        message: 'Fichier Markdown uploadé avec succès',
        type: 'success',
      });
      onUploadSuccess?.();
    },
    onError: (error: Error) => {
      showToast({
        message: `Erreur lors de l'upload: ${error.message}`,
        type: 'error',
      });
    },
  });

  // Download mutation
  const downloadMutation = useMutation({
    mutationFn: () => leoSettingsAPI.downloadMarkdown(),
    onSuccess: async (blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName || 'leo-instructions.md';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showToast({
        message: 'Fichier téléchargé avec succès',
        type: 'success',
      });
    },
    onError: (error: Error) => {
      showToast({
        message: `Erreur lors du téléchargement: ${error.message}`,
        type: 'error',
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: () => leoSettingsAPI.deleteMarkdown(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leo-settings'] });
      queryClient.invalidateQueries({ queryKey: ['leo-system-prompt'] });
      showToast({
        message: 'Fichier Markdown supprimé avec succès',
        type: 'success',
      });
    },
    onError: (error: Error) => {
      showToast({
        message: `Erreur lors de la suppression: ${error.message}`,
        type: 'error',
      });
    },
  });

  const validateFile = (file: File): boolean => {
    if (!file.name.endsWith('.md')) {
      showToast({
        message: 'Le fichier doit être au format Markdown (.md)',
        type: 'error',
      });
      return false;
    }
    if (file.size > 500 * 1024) {
      showToast({
        message: 'Le fichier est trop volumineux (maximum 500KB)',
        type: 'error',
      });
      return false;
    }
    return true;
  };

  const handleFileSelect = (file: File) => {
    if (validateFile(file)) {
      uploadMutation.mutate(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDelete = () => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce fichier Markdown ?')) {
      deleteMutation.mutate();
    }
  };

  return (
    <Card className="glass-card border border-nukleo-lavender/20">
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Fichier Markdown
        </h3>
        <p className="text-sm text-muted-foreground mb-6">
          Téléchargez un fichier Markdown contenant des instructions détaillées pour Leo
        </p>

        {fileName ? (
          <div className="space-y-4">
            <Alert variant="info">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                <span>Fichier actuel : {fileName}</span>
              </div>
            </Alert>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => downloadMutation.mutate()}
                disabled={downloadMutation.isPending}
              >
                {downloadMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                Télécharger
              </Button>
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadMutation.isPending}
              >
                <Upload className="w-4 h-4 mr-2" />
                Remplacer
              </Button>
              <Button
                variant="outline"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="text-red-600 hover:text-red-700"
              >
                {deleteMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4 mr-2" />
                )}
                Supprimer
              </Button>
            </div>
          </div>
        ) : (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                : 'border-gray-300 dark:border-gray-700 hover:border-primary-400'
            }`}
          >
            <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-2">
              Glissez-déposez un fichier Markdown ici
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              ou
            </p>
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadMutation.isPending}
              className="bg-primary-500 hover:bg-primary-600 text-white"
            >
              {uploadMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Upload className="w-4 h-4 mr-2" />
              )}
              Choisir un fichier
            </Button>
            <p className="text-xs text-muted-foreground mt-4">
              Format : .md | Taille max : 500KB
            </p>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept=".md"
          onChange={handleFileInputChange}
          className="hidden"
        />
      </div>
    </Card>
  );
}
