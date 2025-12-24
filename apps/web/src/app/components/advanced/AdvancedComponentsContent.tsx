/**
 * Advanced Components Showcase Page
 */

'use client';

import { PageHeader, PageContainer, Section } from '@/components/layout';
import {
  FileManager,
  ImageEditor,
  CodeEditor,
  MarkdownEditor,
} from '@/components/advanced';
import { logger } from '@/lib/logger';

export default function AdvancedComponentsContent() {
  const sampleFiles = [
    {
      id: '1',
      name: 'Documents',
      type: 'folder' as const,
      modified: '2024-03-20T10:00:00Z',
      path: '/Documents',
    },
    {
      id: '2',
      name: 'Images',
      type: 'folder' as const,
      modified: '2024-03-19T10:00:00Z',
      path: '/Images',
    },
    {
      id: '3',
      name: 'report.pdf',
      type: 'file' as const,
      size: 1024000,
      modified: '2024-03-20T14:30:00Z',
      mimeType: 'application/pdf',
      path: '/Documents/report.pdf',
    },
    {
      id: '4',
      name: 'photo.jpg',
      type: 'file' as const,
      size: 2048000,
      modified: '2024-03-19T10:00:00Z',
      mimeType: 'image/jpeg',
      path: '/Images/photo.jpg',
    },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Composants Avancés"
        description="Composants avancés pour la gestion de fichiers, édition d'images, code et markdown"
        breadcrumbs={[
          { label: 'Accueil', href: '/' },
          { label: 'Composants', href: '/components' },
          { label: 'Avancés' },
        ]}
      />

      <div className="space-y-8 mt-8">
        <Section title="File Manager">
          <FileManager
            files={sampleFiles}
            currentPath="/"
            onNavigate={(path) => {
              logger.info('Navigate to:', { path });
            }}
            onUpload={async (files) => {
              logger.info('Files uploaded:', { count: files.length });
              await new Promise((resolve) => setTimeout(resolve, 1000));
            }}
            onDownload={async (file) => {
              logger.info('Download file:', { fileName: file.name });
              await new Promise((resolve) => setTimeout(resolve, 1000));
            }}
            onDelete={async (file) => {
              logger.info('Delete file:', { fileName: file.name });
              await new Promise((resolve) => setTimeout(resolve, 1000));
            }}
            onRename={async (file, newName) => {
              logger.info('Rename file:', { oldName: file.name, newName });
              await new Promise((resolve) => setTimeout(resolve, 1000));
            }}
          />
        </Section>

        <Section title="Image Editor">
          <ImageEditor
            onSave={async (imageData) => {
              logger.info('Image saved:', { dataLength: imageData.length });
              await new Promise((resolve) => setTimeout(resolve, 1000));
            }}
          />
        </Section>

        <Section title="Code Editor">
          <CodeEditor
            language="javascript"
            value={`function greet(name) {
  return \`Hello, \${name}!\`;
}

console.log(greet('World'));`}
            onChange={(value) => {
              logger.info('Code changed:', { length: value.length });
            }}
            onSave={async (value) => {
              logger.info('Code saved:', { length: value.length });
              await new Promise((resolve) => setTimeout(resolve, 1000));
            }}
          />
        </Section>

        <Section title="Markdown Editor">
          <MarkdownEditor
            onChange={(value) => {
              logger.info('Markdown changed:', { length: value.length });
            }}
            onSave={async (value) => {
              logger.info('Markdown saved:', { length: value.length });
              await new Promise((resolve) => setTimeout(resolve, 1000));
            }}
          />
        </Section>
      </div>
    </PageContainer>
  );
}

