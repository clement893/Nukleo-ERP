'use client';

import { useState } from 'react';
import { Bug } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { FeedbackForm } from './FeedbackForm';
import Button from '@/components/ui/Button';

/**
 * FeedbackButton Component
 * 
 * Floating action button in bottom-right corner for reporting bugs and feedback.
 * Opens a modal with the FeedbackForm when clicked.
 */
export function FeedbackButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Button - Positioned to avoid conflict with QuickActions */}
      <div className="fixed bottom-6 right-28 z-40">
        <Button
          onClick={() => setIsOpen(true)}
          className="rounded-full shadow-lg h-12 w-12 p-0 bg-gradient-to-br from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 transition-all hover:scale-110"
          aria-label="Signaler un problème ou envoyer un feedback"
          title="Signaler un problème"
        >
          <Bug className="h-5 w-5" />
        </Button>
      </div>

      {/* Feedback Modal */}
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Signaler un problème ou envoyer un feedback"
        size="lg"
      >
        <FeedbackForm
          onSuccess={() => {
            setIsOpen(false);
          }}
        />
      </Modal>
    </>
  );
}
