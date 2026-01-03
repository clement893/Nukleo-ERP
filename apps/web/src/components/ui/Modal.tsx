/**
 * Modal Component - Ultra-Modern Design (Refined)
 * 
 * Full-featured modal dialog with Nukleo design system:
 * - Subtle backdrop blur
 * - Refined gradient headers
 * - Glassmorphism effects
 * - Smooth animations
 * - Compact, professional sizing
 * 
 * @example
 * ```tsx
 * // Basic modal
 * <Modal isOpen={isOpen} onClose={handleClose} title="Confirm">
 *   <p>Are you sure?</p>
 * </Modal>
 * 
 * // Modal with gradient variant
 * <Modal
 *   isOpen={isOpen}
 *   onClose={handleClose}
 *   title="Create Project"
 *   gradient="violet"
 * >
 *   <form>...</form>
 * </Modal>
 * 
 * // Modal with custom icon
 * <Modal
 *   isOpen={isOpen}
 *   onClose={handleClose}
 *   title="Edit User"
 *   gradient="blue"
 *   icon={<Edit className="w-4 h-4 text-white" />}
 * >
 *   <form>...</form>
 * </Modal>
 * ```
 */

'use client';

import { type ReactNode, useEffect, useRef } from 'react';
import { clsx } from 'clsx';
import { X, Sparkles } from 'lucide-react';
import Button from './Button';

export interface ModalProps {
  /** Control modal visibility */
  isOpen: boolean;
  /** Close handler */
  onClose: () => void;
  /** Modal title */
  title?: string;
  /** Modal content */
  children: ReactNode;
  /** Footer content (buttons, actions, etc.) */
  footer?: ReactNode;
  /** Modal size */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  /** Gradient variant for header */
  gradient?: 'aurora' | 'violet' | 'blue' | 'green' | 'orange' | 'none';
  /** Custom icon for header (replaces Sparkles) */
  icon?: ReactNode;
  /** Close modal when clicking overlay */
  closeOnOverlayClick?: boolean;
  /** Close modal on Escape key */
  closeOnEscape?: boolean;
  /** Show close button in header */
  showCloseButton?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Overlay CSS classes */
  overlayClassName?: string;
  /** ARIA label ID */
  'aria-labelledby'?: string;
  /** ARIA description ID */
  'aria-describedby'?: string;
}

const sizeClasses = {
  sm: 'md:max-w-md',
  md: 'md:max-w-lg',
  lg: 'md:max-w-2xl',
  xl: 'md:max-w-4xl',
  full: 'md:max-w-[calc(100%-2rem)] md:w-full',
};

// Gradients plus subtils et raffinés
const gradientClasses = {
  aurora: 'bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700',
  violet: 'bg-gradient-to-r from-violet-600 to-purple-600',
  blue: 'bg-gradient-to-r from-blue-600 to-cyan-600',
  green: 'bg-gradient-to-r from-green-600 to-emerald-600',
  orange: 'bg-gradient-to-r from-orange-600 to-red-600',
  none: 'bg-gradient-to-r from-gray-700 to-gray-800 dark:from-gray-800 dark:to-gray-900',
};

function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  gradient = 'aurora',
  icon,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  showCloseButton = true,
  className,
  overlayClassName,
  'aria-labelledby': ariaLabelledBy,
  'aria-describedby': ariaDescribedBy,
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);
  const mainContentRef = useRef<HTMLElement | null>(null);

  // Handle Escape key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeOnEscape, onClose]);

  // Handle body overflow and aria-hidden on main content
  useEffect(() => {
    if (isOpen) {
      previousActiveElementRef.current = document.activeElement as HTMLElement;
      
      const mainContent = document.querySelector('main') || 
                         document.querySelector('[role="main"]') ||
                         document.body.querySelector(':not([role="dialog"]):not([aria-modal="true"])') as HTMLElement;
      
      if (mainContent) {
        mainContentRef.current = mainContent as HTMLElement;
        mainContent.setAttribute('aria-hidden', 'true');
      }

      document.body.style.overflow = 'hidden';
    } else {
      if (mainContentRef.current) {
        mainContentRef.current.removeAttribute('aria-hidden');
      }

      document.body.style.overflow = '';

      if (previousActiveElementRef.current) {
        setTimeout(() => {
          previousActiveElementRef.current?.focus();
        }, 0);
      }
    }

    return () => {
      if (mainContentRef.current) {
        mainContentRef.current.removeAttribute('aria-hidden');
      }
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Focus management
  useEffect(() => {
    if (isOpen && modalRef.current) {
      const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      const firstFocusable = focusableElements[0] || modalRef.current;
      
      setTimeout(() => {
        firstFocusable.focus();
      }, 0);
    }
  }, [isOpen]);

  // Focus trapping
  useEffect(() => {
    if (!isOpen || !modalRef.current) return;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const focusableElements = modalRef.current!.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      if (focusableElements.length === 0) return;

      const firstFocusable = focusableElements[0];
      const lastFocusable = focusableElements[focusableElements.length - 1];

      if (!firstFocusable || !lastFocusable) return;

      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable.focus();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable.focus();
        }
      }
    };

    modalRef.current.addEventListener('keydown', handleTabKey);
    return () => {
      modalRef.current?.removeEventListener('keydown', handleTabKey);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className={clsx(
        'fixed inset-0 z-50 flex items-center justify-center p-4',
        'bg-black/40 backdrop-blur-sm',
        'animate-in fade-in duration-200',
        overlayClassName
      )}
      style={{ overflow: 'auto' }}
      onClick={closeOnOverlayClick ? onClose : undefined}
    >
      <div
        ref={modalRef}
        className={clsx(
          'relative w-full max-h-[90vh] overflow-hidden',
          'rounded-2xl shadow-xl',
          'animate-in zoom-in-95 duration-300',
          sizeClasses[size],
          className
        )}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={ariaLabelledBy}
        aria-describedby={ariaDescribedBy}
        tabIndex={-1}
      >
        {/* Refined Gradient Header */}
        {title && (
          <div className={clsx('relative overflow-hidden', gradientClasses[gradient])}>
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
            <div className="relative px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {(icon || gradient !== 'none') && (
                  <div className="p-2 rounded-lg bg-white/15 backdrop-blur-sm border border-white/20">
                    {icon || <Sparkles className="w-4 h-4 text-white" />}
                  </div>
                )}
                <h2 
                  className="text-xl font-bold text-white" 
                  style={{ fontFamily: 'Space Grotesk, sans-serif' }}
                >
                  {title}
                </h2>
              </div>
              {showCloseButton && (
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 transition-all"
                  aria-label="Close"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="bg-white dark:bg-gray-900 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="p-5">
            {children}
          </div>
        </div>

        {/* Footer */}
        {footer && (
          <div className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-5 py-4">
            <div className="flex gap-3 justify-end">
              {footer}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Modal variants
export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirmer l\'action',
  message,
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  variant = 'primary',
  gradient = 'aurora',
  loading = false,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'primary' | 'danger';
  gradient?: 'aurora' | 'violet' | 'blue' | 'green' | 'orange';
  loading?: boolean;
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      gradient={gradient}
      footer={
        <>
          <Button 
            variant="outline" 
            onClick={onClose} 
            disabled={loading}
            className="px-4 py-2"
          >
            {cancelText}
          </Button>
          <Button
            variant={variant}
            onClick={async () => {
              await onConfirm();
              onClose();
            }}
            disabled={loading}
            className="px-4 py-2"
          >
            {loading ? 'Chargement...' : confirmText}
          </Button>
        </>
      }
    >
      <p className="text-foreground">{message}</p>
    </Modal>
  );
}

// Export Modal as both default and named export for compatibility
export default Modal;
export { Modal };
