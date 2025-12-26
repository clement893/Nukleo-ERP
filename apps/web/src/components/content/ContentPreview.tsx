/**
 * Content Preview Component
 * 
 * Displays a preview of content (blog post, page, etc.) in a modal or page.
 * 
 * @component
 */

'use client';

import { Modal, Card } from '@/components/ui';
import { X } from 'lucide-react';

export interface ContentPreviewProps {
  title: string;
  content: string;
  contentHtml?: string;
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

/**
 * Content Preview Component
 * 
 * Displays content preview in a modal with proper formatting.
 */
export default function ContentPreview({
  title,
  content,
  contentHtml,
  isOpen,
  onClose,
  className,
}: ContentPreviewProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="xl"
      footer={
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
          >
            Close
          </button>
        </div>
      }
    >
      <div className={className}>
        {contentHtml ? (
          <div
            className="prose prose-lg dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: contentHtml }}
          />
        ) : (
          <div className="prose prose-lg dark:prose-invert max-w-none whitespace-pre-wrap">
            {content}
          </div>
        )}
      </div>
    </Modal>
  );
}

