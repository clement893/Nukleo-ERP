/**
 * FileUpload Component
 * File upload component
 */

'use client';

import { forwardRef, type InputHTMLAttributes, useState } from 'react';
import { clsx } from 'clsx';

interface FileUploadProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // Max file size in MB
  onFileChange?: (files: FileList | null) => void;
  onFileSelect?: (files: File[]) => void; // Alternative callback that receives File[]
}

const FileUpload = forwardRef<HTMLInputElement, FileUploadProps>(
  (
    {
      label,
      error,
      helperText,
      className,
      fullWidth = false,
      accept,
      multiple = false,
      maxSize,
      onFileChange,
      onFileSelect,
      id,
      onChange,
      ...props
    },
    ref
  ) => {
    const [fileName, setFileName] = useState<string>('');
    const fileId = id || `file-${Math.random().toString(36).substring(7)}`;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        // Validate file sizes if maxSize is provided
        if (maxSize) {
          const maxSizeBytes = maxSize * 1024 * 1024; // Convert MB to bytes
          const fileArray = Array.from(files);
          const oversizedFiles = fileArray.filter(file => file.size > maxSizeBytes);
          
          if (oversizedFiles.length > 0) {
            setFileName(`Erreur: ${oversizedFiles.length} fichier(s) trop volumineux (>${maxSize}MB)`);
            return;
          }
        }
        
        if (multiple) {
          setFileName(`${files.length} fichier(s) sélectionné(s)`);
        } else {
          setFileName(files[0]?.name || '');
        }
        
        // Call onFileSelect with File[] if provided
        if (onFileSelect) {
          onFileSelect(Array.from(files));
        }
      } else {
        setFileName('');
      }
      onChange?.(e);
      onFileChange?.(files);
    };

    return (
      <div className={clsx('flex flex-col', fullWidth && 'w-full')}>
        {label && (
          <label
            htmlFor={fileId}
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            type="file"
            id={fileId}
            accept={accept}
            multiple={multiple}
            onChange={handleChange}
            className="hidden"
            {...props}
          />
          <label
            htmlFor={fileId}
            className={clsx(
              'flex flex-col items-center justify-center w-full h-32',
              'border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-lg',
              'cursor-pointer bg-gray-100 dark:bg-gray-800',
              'hover:bg-gray-200 dark:hover:bg-gray-700',
              'transition-colors',
              error && 'border-error-500 dark:border-error-400',
              className
            )}
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <svg
                className="w-10 h-10 mb-3 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <p className="mb-2 text-sm text-gray-700 dark:text-gray-300">
                <span className="font-semibold">Cliquez pour télécharger</span> ou glissez-déposez
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {accept ? `Types acceptés: ${accept}` : 'Tous les types de fichiers'}
              </p>
              {fileName && (
                <p className="mt-2 text-sm text-gray-900 dark:text-gray-100 font-medium">
                  {fileName}
                </p>
              )}
            </div>
          </label>
        </div>
        {error && (
          <p className="mt-1 text-sm text-error-600 dark:text-error-400" role="alert">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{helperText}</p>
        )}
      </div>
    );
  }
);

FileUpload.displayName = 'FileUpload';

export default FileUpload;
