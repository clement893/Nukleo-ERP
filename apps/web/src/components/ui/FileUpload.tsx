'use client';

import { InputHTMLAttributes, useRef, useState } from 'react';
import { clsx } from 'clsx';

interface FileUploadProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  label?: string;
  accept?: string;
  multiple?: boolean;
  onFileSelect?: (files: File[]) => void;
  maxSize?: number; // in MB
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  dragAndDrop?: boolean;
}

export default function FileUpload({
  label,
  accept,
  multiple = false,
  onFileSelect,
  maxSize,
  error,
  helperText,
  fullWidth = false,
  dragAndDrop = true,
  className,
  ...props
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const fileArray = Array.from(files);
    
    if (maxSize) {
      const invalidFiles = fileArray.filter(
        (file) => file.size > maxSize * 1024 * 1024
      );
      if (invalidFiles.length > 0) {
        alert(`Some files exceed the maximum size of ${maxSize}MB`);
        return;
      }
    }

    const filesToSet = multiple ? [...selectedFiles, ...fileArray] : fileArray;
    setSelectedFiles(filesToSet);
    onFileSelect?.(filesToSet);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (dragAndDrop) setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (dragAndDrop) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    onFileSelect?.(newFiles);
  };

  return (
    <div className={clsx('flex flex-col', fullWidth && 'w-full')}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={clsx(
          'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors',
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : error
            ? 'border-red-300'
            : 'border-gray-300 hover:border-gray-400',
          className
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
          {...props}
        />
        <div className="flex flex-col items-center">
          <svg
            className="w-12 h-12 text-gray-400 mb-2"
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
          <p className="text-sm text-gray-600 mb-1">
            {dragAndDrop ? 'Drag and drop files here, or click to select' : 'Click to select files'}
          </p>
          {accept && (
            <p className="text-xs text-gray-500">Accepted: {accept}</p>
          )}
          {maxSize && (
            <p className="text-xs text-gray-500">Max size: {maxSize}MB</p>
          )}
        </div>
      </div>
      {selectedFiles.length > 0 && (
        <div className="mt-4 space-y-2">
          {selectedFiles.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-2 bg-gray-50 rounded"
            >
              <span className="text-sm text-gray-700 truncate flex-1">
                {file.name} ({(file.size / 1024).toFixed(2)} KB)
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(index);
                }}
                className="ml-2 text-red-600 hover:text-red-800"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
}

