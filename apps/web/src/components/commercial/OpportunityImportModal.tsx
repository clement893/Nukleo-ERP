'use client';

import { useState, useRef } from 'react';
import { Upload, Download, X, CheckCircle, AlertCircle } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/ui';
import { opportunitiesAPI } from '@/lib/api/opportunities';
import { handleApiError } from '@/lib/errors/api';

interface OpportunityImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete?: () => void;
}

export default function OpportunityImportModal({
  isOpen,
  onClose,
  onImportComplete,
}: OpportunityImportModalProps) {
  const { showToast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    total_rows: number;
    valid_rows: number;
    invalid_rows: number;
    errors: Array<{ row: number; data: unknown; error: string }>;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      if (
        droppedFile.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        droppedFile.type === 'application/vnd.ms-excel' ||
        droppedFile.name.endsWith('.xlsx') ||
        droppedFile.name.endsWith('.xls')
      ) {
        setFile(droppedFile);
        setImportResult(null);
      } else {
        showToast({
          message: 'Veuillez sélectionner un fichier Excel (.xlsx ou .xls)',
          type: 'error',
        });
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (
        selectedFile.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        selectedFile.type === 'application/vnd.ms-excel' ||
        selectedFile.name.endsWith('.xlsx') ||
        selectedFile.name.endsWith('.xls')
      ) {
        setFile(selectedFile);
        setImportResult(null);
      } else {
        showToast({
          message: 'Veuillez sélectionner un fichier Excel (.xlsx ou .xls)',
          type: 'error',
        });
      }
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      await opportunitiesAPI.downloadTemplate();
      showToast({
        message: 'Template téléchargé avec succès',
        type: 'success',
      });
    } catch (err) {
      const appError = handleApiError(err);
      showToast({
        message: appError.message || 'Erreur lors du téléchargement du template',
        type: 'error',
      });
    }
  };

  const handleDownloadZipTemplate = async () => {
    try {
      await opportunitiesAPI.downloadZipTemplate();
      showToast({
        message: 'Template ZIP téléchargé avec succès',
        type: 'success',
      });
    } catch (err) {
      const appError = handleApiError(err);
      showToast({
        message: appError.message || 'Erreur lors du téléchargement du template ZIP',
        type: 'error',
      });
    }
  };

  const handleImport = async () => {
    if (!file) {
      showToast({
        message: 'Veuillez sélectionner un fichier',
        type: 'error',
      });
      return;
    }

    setIsImporting(true);
    setImportResult(null);

    try {
      const result = await opportunitiesAPI.import(file);
      setImportResult(result);

      if (result.invalid_rows > 0) {
        showToast({
          message: `${result.valid_rows} opportunités importées avec succès, ${result.invalid_rows} lignes contenaient des erreurs`,
          type: 'warning',
        });
      } else {
        showToast({
          message: `${result.valid_rows} opportunités importées avec succès`,
          type: 'success',
        });
        onImportComplete?.();
        handleClose();
      }
    } catch (err) {
      const appError = handleApiError(err);
      showToast({
        message: appError.message || 'Erreur lors de l\'import',
        type: 'error',
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setImportResult(null);
    setIsDragging(false);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Importer des opportunités"
      size="lg"
    >
      <div className="space-y-6">
        {/* Download Templates */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Télécharger un template
          </h3>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleDownloadTemplate}
              className="flex-1"
            >
              <Download className="w-4 h-4 mr-2" />
              Template Excel
            </Button>
            <Button
              variant="outline"
              onClick={handleDownloadZipTemplate}
              className="flex-1"
            >
              <Download className="w-4 h-4 mr-2" />
              Template ZIP
            </Button>
          </div>
        </div>

        {/* File Upload Area */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Sélectionner un fichier Excel
          </h3>
          <div
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center transition-colors
              ${isDragging
                ? 'border-[#523DC9] bg-[#523DC9]/10'
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
              }
            `}
          >
            {file ? (
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400">
                  <CheckCircle className="w-6 h-6" />
                  <span className="font-medium">{file.name}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFile(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                >
                  <X className="w-4 h-4 mr-2" />
                  Retirer le fichier
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <Upload className="w-12 h-12 mx-auto text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Glissez-déposez un fichier Excel ici ou
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Sélectionner un fichier
                  </Button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  Formats acceptés: .xlsx, .xls
                </p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        </div>

        {/* Import Results */}
        {importResult && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {importResult.invalid_rows > 0 ? (
                <AlertCircle className="w-5 h-5 text-yellow-500" />
              ) : (
                <CheckCircle className="w-5 h-5 text-green-500" />
              )}
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Résultats de l'import
              </h3>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Total de lignes:</span>
                <span className="font-medium">{importResult.total_rows}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Lignes valides:</span>
                <span className="font-medium text-green-600 dark:text-green-400">
                  {importResult.valid_rows}
                </span>
              </div>
              {importResult.invalid_rows > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Lignes invalides:</span>
                  <span className="font-medium text-red-600 dark:text-red-400">
                    {importResult.invalid_rows}
                  </span>
                </div>
              )}
            </div>
            {importResult.errors.length > 0 && (
              <div className="max-h-48 overflow-y-auto bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <h4 className="text-xs font-semibold text-gray-900 dark:text-white mb-2">
                  Erreurs détaillées:
                </h4>
                <div className="space-y-1">
                  {importResult.errors.slice(0, 10).map((error, index) => (
                    <div key={index} className="text-xs text-red-600 dark:text-red-400">
                      Ligne {error.row}: {error.error}
                    </div>
                  ))}
                  {importResult.errors.length > 10 && (
                    <div className="text-xs text-gray-500">
                      ... et {importResult.errors.length - 10} autres erreurs
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={handleClose} disabled={isImporting}>
            {importResult ? 'Fermer' : 'Annuler'}
          </Button>
          {!importResult && (
            <Button
              onClick={handleImport}
              disabled={!file || isImporting}
            >
              {isImporting ? 'Import en cours...' : 'Importer'}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
