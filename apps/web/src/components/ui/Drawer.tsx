/**
 * Drawer Component - Ultra-Modern Design
 * 
 * Slide-out panel with Nukleo design system:
 * - Intense backdrop blur
 * - Aurora Borealis gradient headers
 * - Glassmorphism effects
 * - Smooth slide animations
 * - Space Grotesk typography
 */

'use client';

import { type ReactNode, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { clsx } from 'clsx';
import { X, Sparkles } from 'lucide-react';

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  position?: 'left' | 'right' | 'top' | 'bottom';
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  gradient?: 'aurora' | 'violet' | 'blue' | 'green' | 'orange' | 'none';
  icon?: ReactNode;
  showCloseButton?: boolean;
  overlay?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  className?: string;
  overlayClassName?: string;
}

const positionClasses = {
  left: 'left-0 top-0 bottom-0',
  right: 'right-0 top-0 bottom-0',
  top: 'top-0 left-0 right-0',
  bottom: 'bottom-0 left-0 right-0',
};

const sizeClasses = {
  sm: {
    left: 'w-80',
    right: 'w-80',
    top: 'h-80',
    bottom: 'h-80',
  },
  md: {
    left: 'w-96',
    right: 'w-96',
    top: 'h-96',
    bottom: 'h-96',
  },
  lg: {
    left: 'w-[32rem]',
    right: 'w-[32rem]',
    top: 'h-[32rem]',
    bottom: 'h-[32rem]',
  },
  xl: {
    left: 'w-[40rem]',
    right: 'w-[40rem]',
    top: 'h-[40rem]',
    bottom: 'h-[40rem]',
  },
  full: {
    left: 'w-full',
    right: 'w-full',
    top: 'h-full',
    bottom: 'h-full',
  },
};

const slideAnimations = {
  left: {
    enter: 'translate-x-0',
    exit: '-translate-x-full',
  },
  right: {
    enter: 'translate-x-0',
    exit: 'translate-x-full',
  },
  top: {
    enter: 'translate-y-0',
    exit: '-translate-y-full',
  },
  bottom: {
    enter: 'translate-y-0',
    exit: 'translate-y-full',
  },
};

const gradientClasses = {
  aurora: 'bg-gradient-to-br from-[#5F2B75] via-[#523DC9] to-[#6B1817]',
  violet: 'bg-gradient-to-br from-violet-600 via-purple-600 to-pink-600',
  blue: 'bg-gradient-to-br from-blue-600 via-cyan-600 to-teal-600',
  green: 'bg-gradient-to-br from-green-600 via-emerald-600 to-teal-600',
  orange: 'bg-gradient-to-br from-orange-500 via-red-600 to-pink-600',
  none: 'bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700',
};

export default function Drawer({
  isOpen,
  onClose,
  children,
  title,
  position = 'right',
  size = 'md',
  gradient = 'aurora',
  icon,
  showCloseButton = true,
  overlay = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  className,
  overlayClassName,
}: DrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);
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
    if (isOpen && drawerRef.current) {
      const focusableElements = drawerRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      const firstFocusable = focusableElements[0] || drawerRef.current;
      
      setTimeout(() => {
        firstFocusable.focus();
      }, 0);
    }
  }, [isOpen]);

  // Focus trapping
  useEffect(() => {
    if (!isOpen || !drawerRef.current) return;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const focusableElements = drawerRef.current!.querySelectorAll<HTMLElement>(
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

    drawerRef.current.addEventListener('keydown', handleTabKey);
    return () => {
      drawerRef.current?.removeEventListener('keydown', handleTabKey);
    };
  }, [isOpen]);

  const animation = slideAnimations[position];
  const sizeClass = sizeClasses[size][position];

  if (!isOpen) return null;

  const drawerContent = (
    <div
      className={clsx(
        'fixed inset-0 z-[9999]',
        overlay && 'bg-black/60 backdrop-blur-md',
        overlayClassName,
        'animate-fade-in'
      )}
      onClick={closeOnOverlayClick ? onClose : undefined}
    >
      <div
        ref={drawerRef}
        className={clsx(
          'fixed bg-background shadow-2xl',
          'flex flex-col',
          positionClasses[position],
          sizeClass,
          animation.enter,
          'transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform',
          className
        )}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'drawer-title' : undefined}
        tabIndex={-1}
      >
        {/* Gradient Header */}
        {title && (
          <div className={clsx('relative overflow-hidden', gradientClasses[gradient])}>
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
            <div className="relative px-6 py-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 shadow-lg">
                  {icon || <Sparkles className="w-5 h-5 text-white" />}
                </div>
                <h2 
                  id="drawer-title" 
                  className="text-2xl font-black text-white"
                  style={{ fontFamily: 'Space Grotesk, sans-serif' }}
                >
                  {title}
                </h2>
              </div>
              {showCloseButton && (
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 transition-all hover:scale-110"
                  aria-label="Close drawer"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-white dark:bg-gray-900">
          {children}
        </div>
      </div>
    </div>
  );

  // Use portal to render drawer at body level
  if (typeof window !== 'undefined') {
    return createPortal(drawerContent, document.body);
  }

  return drawerContent;
}
