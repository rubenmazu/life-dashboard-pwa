import { useEffect, useRef } from 'react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  destructive?: boolean;
}

/**
 * iOS action sheet style confirmation modal.
 * Uses .ios-sheet styles from ios-utilities.css with slide-up animation.
 * Requirements: 16.1, 16.6
 */
export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  destructive = false,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Trap focus inside dialog when open
      dialogRef.current?.focus();
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      className="ios-sheet"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-message"
    >
      {/* Backdrop */}
      <div
        className="ios-sheet-backdrop"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Content */}
      <div
        ref={dialogRef}
        className="ios-sheet-content"
        tabIndex={-1}
      >
        <div className="ios-sheet-handle" />

        <h2
          id="confirm-dialog-title"
          className="text-center text-lg font-semibold mb-2"
          style={{ color: 'var(--color-ios-text-primary)' }}
        >
          {title}
        </h2>

        <p
          id="confirm-dialog-message"
          className="text-center text-sm mb-6"
          style={{ color: 'var(--color-ios-text-secondary)' }}
        >
          {message}
        </p>

        <div className="flex flex-col gap-2">
          <button
            type="button"
            className={`ios-btn w-full ${destructive ? 'ios-btn-destructive' : 'ios-btn-primary'}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>

          <button
            type="button"
            className="ios-btn w-full"
            style={{
              backgroundColor: 'var(--color-ios-separator)',
              color: 'var(--color-ios-text-primary)',
            }}
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
