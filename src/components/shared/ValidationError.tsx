interface ValidationErrorProps {
  message: string | null | undefined;
}

/**
 * Inline form validation error message.
 * Shows below form fields with red text and small font.
 * Animates in with fade/scale. Returns null when message is null/undefined.
 * Requirements: 16.1, 16.6
 */
export function ValidationError({ message }: ValidationErrorProps) {
  if (!message) return null;

  return (
    <p
      role="alert"
      className="mt-1 text-xs font-medium"
      style={{
        color: 'var(--color-ios-red)',
        animation: 'validation-fade-in var(--duration-fast) var(--ease-ios) forwards',
      }}
    >
      {message}
    </p>
  );
}
