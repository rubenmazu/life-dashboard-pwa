import { useEffect, useRef } from 'react';

/**
 * Dialog shown when storage quota is exceeded or DB corruption is detected.
 * Uses iOS sheet style consistent with ConfirmDialog.
 * Requirements: 4.7, 4.8
 */

type StorageErrorType = 'quota_exceeded' | 'corruption';

interface StorageErrorDialogProps {
  isOpen: boolean;
  errorType: StorageErrorType;
  onResetData?: () => void;
  onExportData?: () => void;
  onDismiss: () => void;
}

const errorContent: Record<StorageErrorType, { title: string; message: string }> = {
  quota_exceeded: {
    title: 'Storage Full',
    message: 'Insufficient storage space. Please free up space or export your data.',
  },
  corruption: {
    title: 'Data Error',
    message: 'Your data may be corrupted.',
  },
};

export function StorageErrorDialog({
  isOpen,
  errorType,
  onResetData,
  onExportData,
  onDismiss,
}: StorageErrorDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const content = errorContent[errorType];

  useEffect(() => {
    if (isOpen) {
      dialogRef.current?.focus();
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onDismiss();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onDismiss]);

  if (!isOpen) return null;

  return (
    <div
      className="ios-sheet"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="storage-error-title"
      aria-describedby="storage-error-message"
    >
      {/* Backdrop */}
      <div
        className="ios-sheet-backdrop"
        onClick={onDismiss}
        aria-hidden="true"
      />

      {/* Content */}
      <div
        ref={dialogRef}
        className="ios-sheet-content"
        tabIndex={-1}
      >
        <div className="ios-sheet-handle" />

        {/* Error icon */}
        <div className="flex justify-center mb-3">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'rgba(255, 59, 48, 0.12)' }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="var(--color-ios-red)"
                strokeWidth="2"
              />
              <path
                d="M12 7v6M12 16v1"
                stroke="var(--color-ios-red)"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        <h2
          id="storage-error-title"
          className="text-center text-lg font-semibold mb-2"
          style={{ color: 'var(--color-ios-text-primary)' }}
        >
          {content.title}
        </h2>

        <p
          id="storage-error-message"
          className="text-center text-sm mb-6"
          style={{ color: 'var(--color-ios-text-secondary)' }}
        >
          {content.message}
        </p>

        <div className="flex flex-col gap-2">
          {errorType === 'corruption' && (
            <>
              {onResetData && (
                <button
                  type="button"
                  className="ios-btn w-full ios-btn-destructive"
                  onClick={onResetData}
                >
                  Reset Profile Data
                </button>
              )}
              {onExportData && (
                <button
                  type="button"
                  className="ios-btn w-full ios-btn-primary"
                  onClick={onExportData}
                >
                  Export Recoverable Data
                </button>
              )}
            </>
          )}

          {errorType === 'quota_exceeded' && onExportData && (
            <button
              type="button"
              className="ios-btn w-full ios-btn-primary"
              onClick={onExportData}
            >
              Export Data
            </button>
          )}

          <button
            type="button"
            className="ios-btn w-full"
            style={{
              backgroundColor: 'var(--color-ios-separator)',
              color: 'var(--color-ios-text-primary)',
            }}
            onClick={onDismiss}
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
