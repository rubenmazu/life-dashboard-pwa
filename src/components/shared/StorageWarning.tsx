/**
 * Persistent warning banner shown when IndexedDB is unavailable
 * and the app falls back to LocalStorage.
 * Requirements: 4.5
 */

interface StorageWarningProps {
  message: string;
}

export function StorageWarning({ message }: StorageWarningProps) {
  return (
    <div
      role="alert"
      aria-live="polite"
      className="w-full px-4 py-3 text-sm font-medium"
      style={{
        backgroundColor: 'var(--color-ios-orange)',
        color: '#ffffff',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-md)',
      }}
    >
      <div className="flex items-start gap-2">
        {/* Warning icon */}
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          aria-hidden="true"
          className="shrink-0 mt-0.5"
        >
          <path
            d="M10 2L1 18h18L10 2z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path
            d="M10 8v4M10 14.5v.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
        <span>{message}</span>
      </div>
    </div>
  );
}
