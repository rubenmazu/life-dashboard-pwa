import { useEffect, useState } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  duration?: number;
  onDismiss: () => void;
}

const typeStyles: Record<ToastType, { bg: string; text: string }> = {
  success: { bg: 'var(--color-ios-green)', text: '#ffffff' },
  error: { bg: 'var(--color-ios-red)', text: '#ffffff' },
  info: { bg: 'var(--color-ios-blue)', text: '#ffffff' },
};

/**
 * Transient success/error/info notification toast.
 * Appears at the top with slide-down animation.
 * Auto-dismisses after duration (default 3000ms).
 * Requirements: 16.1, 16.6
 */
export function Toast({ message, type, duration = 3000, onDismiss }: ToastProps) {
  const [isExiting, setIsExiting] = useState(false);
  const styles = typeStyles[type];

  useEffect(() => {
    const dismissTimer = setTimeout(() => {
      setIsExiting(true);
    }, duration);

    return () => clearTimeout(dismissTimer);
  }, [duration]);

  useEffect(() => {
    if (!isExiting) return;

    const exitTimer = setTimeout(() => {
      onDismiss();
    }, 300); // Match exit animation duration

    return () => clearTimeout(exitTimer);
  }, [isExiting, onDismiss]);

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 flex justify-center px-4"
      style={{ paddingTop: 'calc(env(safe-area-inset-top, 8px) + 8px)' }}
    >
      <div
        role="alert"
        aria-live="polite"
        className="max-w-[430px] w-full rounded-[var(--radius-md)] px-4 py-3 shadow-[var(--shadow-md)] text-sm font-medium"
        style={{
          backgroundColor: styles.bg,
          color: styles.text,
          animation: isExiting
            ? 'toast-slide-out var(--duration-normal) var(--ease-ios) forwards'
            : 'toast-slide-in var(--duration-normal) var(--ease-ios-spring) forwards',
        }}
      >
        {message}
      </div>
    </div>
  );
}
