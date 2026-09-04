'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
}: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  // Focus trap
  useEffect(() => {
    if (!isOpen) return;

    previousFocusRef.current = document.activeElement as HTMLElement;
    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';

    const focusableSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const modal = modalRef.current;
    if (modal) {
      const focusableElements = modal.querySelectorAll<HTMLElement>(focusableSelector);
      if (focusableElements.length > 0) {
        setTimeout(() => focusableElements[0].focus(), 50);
      }
    }

    const trapFocus = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !modalRef.current) return;
      const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(focusableSelector);
      if (focusableElements.length === 0) return;
      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', trapFocus);

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('keydown', trapFocus);
      document.body.style.overflow = 'unset';
      previousFocusRef.current?.focus();
    };
  }, [isOpen, handleEscape]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-overlay-in"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      <div className="absolute inset-0 bg-navy/60 backdrop-blur-sm" aria-hidden="true" />
      <div
        ref={modalRef}
        className={cn(
          'relative bg-white rounded-xl shadow-2xl w-full animate-modal-in',
          sizes[size]
        )}
      >
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <h2 id="modal-title" className="text-lg font-semibold text-navy">{title}</h2>
            <button
              onClick={onClose}
              className="p-1 text-text-muted hover:text-navy rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Close modal"
            >
              <X size={20} aria-hidden="true" />
            </button>
          </div>
        )}
        <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
