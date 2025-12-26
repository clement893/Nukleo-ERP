'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import { FileSpreadsheet, FileText, FileJson, FileType } from 'lucide-react';
import { useToast } from '@/components/ui';
import { getErrorMessage } from '@/lib/errors';

interface DataExporterProps {
  data: Record<string, unknown>[];
  filename?: string;
  headers?: string[];
  title?: string;
  className?: string;
}

export function DataExporter({
  data,
  filename,
  headers,
  title,
  className = '',
}: DataExporterProps) {
  const [isExporting, setIsExporting] = useState(false);
  const { showToast } = useToast();

  const handleExport = async (format: 'csv' | 'excel' | 'json' | 'pdf') => {
    if (!data || data.length === 0) {
      showToast({
        message: 'There is no data to export.',
        type: 'error',
      });
      return;
    }

    setIsExporting(true);

    try {
      // Use axios directly for blob response
      const axios = (await import('axios')).default;
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/exports/export`,
        {
          format,
          data,
          headers,
          filename,
          title,
        },
        {
          responseType: 'blob',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
          },
        }
      );

      // Create download link
      const blob = new Blob([response.data as BlobPart], {
        type: response.headers['content-type'] || 'application/octet-stream',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Get filename from Content-Disposition header or use default
      const contentDisposition = response.headers['content-disposition'];
      let downloadFilename = filename || `export_${new Date().toISOString().split('T')[0]}`;
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i);
        if (filenameMatch) {
          downloadFilename = filenameMatch[1];
        }
      } else {
        downloadFilename = `${downloadFilename}.${format === 'excel' ? 'xlsx' : format}`;
      }
      
      link.download = downloadFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      showToast({
        message: `Data exported as ${format.toUpperCase()} successfully.`,
        type: 'success',
      });
    } catch (error: unknown) {
      console.error('Export error:', error);
      showToast({
        message: getErrorMessage(error) || 'Failed to export data.',
        type: 'error',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className={`flex gap-2 ${className}`}>
      <Button
        onClick={() => handleExport('csv')}
        disabled={isExporting || !data || data.length === 0}
        variant="outline"
        size="sm"
      >
        <FileText className="h-4 w-4 mr-2" />
        CSV
      </Button>
      <Button
        onClick={() => handleExport('excel')}
        disabled={isExporting || !data || data.length === 0}
        variant="outline"
        size="sm"
      >
        <FileSpreadsheet className="h-4 w-4 mr-2" />
        Excel
      </Button>
      <Button
        onClick={() => handleExport('json')}
        disabled={isExporting || !data || data.length === 0}
        variant="outline"
        size="sm"
      >
        <FileJson className="h-4 w-4 mr-2" />
        JSON
      </Button>
      <Button
        onClick={() => handleExport('pdf')}
        disabled={isExporting || !data || data.length === 0}
        variant="outline"
        size="sm"
      >
        <FileType className="h-4 w-4 mr-2" />
        PDF
      </Button>
    </div>
  );
}

