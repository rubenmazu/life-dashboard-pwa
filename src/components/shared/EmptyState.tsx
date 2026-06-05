import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
}

/**
 * Centered message for empty lists.
 * Displays with muted styling using iOS text-tertiary color.
 * Requirements: 16.1, 16.6
 */
export function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      {icon && (
        <div
          className="mb-4 text-4xl"
          style={{ color: 'var(--color-ios-text-tertiary)' }}
          aria-hidden="true"
        >
          {icon}
        </div>
      )}

      <h3
        className="text-base font-semibold mb-1"
        style={{ color: 'var(--color-ios-text-tertiary)' }}
      >
        {title}
      </h3>

      {description && (
        <p
          className="text-sm max-w-[260px]"
          style={{ color: 'var(--color-ios-text-tertiary)' }}
        >
          {description}
        </p>
      )}
    </div>
  );
}
