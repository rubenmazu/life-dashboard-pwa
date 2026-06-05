interface NotificationBannerProps {
  onDismiss: () => void;
  message?: string;
}

/**
 * Dismissible notification permission banner.
 * Appears at the top with yellow/warning background.
 * Explains how to enable notifications in iOS Settings.
 * Requirements: 16.1, 16.6
 */
export function NotificationBanner({
  onDismiss,
  message = 'Notifications are disabled. To enable them, go to Settings → Safari → Notifications on your device.',
}: NotificationBannerProps) {
  return (
    <div
      role="status"
      className="relative flex items-start gap-3 px-4 py-3 rounded-[var(--radius-md)] mx-4 mt-2"
      style={{
        backgroundColor: 'color-mix(in srgb, var(--color-ios-yellow) 20%, var(--color-ios-surface))',
        border: '1px solid var(--color-ios-yellow)',
        animation: 'ios-fade-in var(--duration-normal) var(--ease-ios) forwards',
      }}
    >
      {/* Warning icon */}
      <span
        className="text-base shrink-0 mt-0.5"
        aria-hidden="true"
      >
        ⚠️
      </span>

      <p
        className="text-xs leading-relaxed flex-1"
        style={{ color: 'var(--color-ios-text-primary)' }}
      >
        {message}
      </p>

      {/* Dismiss button */}
      <button
        type="button"
        onClick={onDismiss}
        className="shrink-0 flex items-center justify-center w-6 h-6 rounded-full"
        style={{ color: 'var(--color-ios-text-secondary)' }}
        aria-label="Dismiss notification banner"
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <line x1="1" y1="1" x2="11" y2="11" />
          <line x1="11" y1="1" x2="1" y2="11" />
        </svg>
      </button>
    </div>
  );
}
