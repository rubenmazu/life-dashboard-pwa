import { useState, useCallback } from 'react';
import type { HabitStatus } from '@/utils/habit-status';

interface HabitItemProps {
  habitId: string;
  name: string;
  status: HabitStatus;
  streak: number;
  onToggle: (habitId: string) => Promise<void>;
  onError: (message: string) => void;
}

/**
 * Single habit row with status indicator, name, and streak badge.
 * Tap on status indicator cycles: not_started → in_progress → completed → not_started.
 * Visual indicators use iOS color palette (gray, orange/blue, green).
 * Minimum 44x44px tap target. Smooth scale bounce animation on status change.
 *
 * Requirements: 10.2, 10.3, 10.4, 10.5, 10.10
 */
export function HabitItem({ habitId, name, status, streak, onToggle, onError }: HabitItemProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const handleToggle = useCallback(async () => {
    if (isToggling) return;

    setIsToggling(true);
    setIsAnimating(true);

    // Reset animation after it completes
    setTimeout(() => setIsAnimating(false), 300);

    try {
      await onToggle(habitId);
    } catch {
      onError('Failed to update habit status. Please try again.');
    } finally {
      setIsToggling(false);
    }
  }, [habitId, isToggling, onToggle, onError]);

  return (
    <div
      className="flex items-center gap-3 px-4 py-2"
      role="listitem"
    >
      {/* Status indicator - minimum 44x44px tap target */}
      <button
        type="button"
        onClick={handleToggle}
        disabled={isToggling}
        aria-label={`${name}: ${getStatusLabel(status)}. Tap to change.`}
        className="flex items-center justify-center shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ios-blue)] rounded-full"
        style={{
          width: '44px',
          height: '44px',
        }}
      >
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '28px',
            height: '28px',
            transition: 'transform var(--duration-normal) var(--ease-ios-spring)',
            transform: isAnimating ? 'scale(1.3)' : 'scale(1)',
          }}
        >
          <StatusIndicator status={status} />
        </span>
      </button>

      {/* Habit name */}
      <span
        className="flex-1 text-[15px] leading-tight"
        style={{
          color: status === 'completed'
            ? 'var(--color-ios-text-tertiary)'
            : 'var(--color-ios-text-primary)',
          textDecoration: status === 'completed' ? 'line-through' : 'none',
        }}
      >
        {name}
      </span>

      {/* Streak badge */}
      {streak > 0 && (
        <span
          className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--color-ios-orange) 15%, transparent)',
            color: 'var(--color-ios-orange)',
          }}
          aria-label={`${streak} day streak`}
        >
          🔥 {streak}
        </span>
      )}
    </div>
  );
}

function StatusIndicator({ status }: { status: HabitStatus }) {
  switch (status) {
    case 'not_started':
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle
            cx="12"
            cy="12"
            r="10.5"
            stroke="var(--color-ios-gray)"
            strokeWidth="1.5"
            fill="none"
          />
        </svg>
      );
    case 'in_progress':
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle
            cx="12"
            cy="12"
            r="10.5"
            stroke="var(--color-ios-blue)"
            strokeWidth="1.5"
            fill="none"
          />
          {/* Half-filled circle */}
          <path
            d="M12 1.5 A10.5 10.5 0 0 1 12 22.5 L12 1.5Z"
            fill="var(--color-ios-blue)"
            opacity="0.3"
          />
          <circle
            cx="12"
            cy="12"
            r="5"
            fill="var(--color-ios-blue)"
          />
        </svg>
      );
    case 'completed':
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle
            cx="12"
            cy="12"
            r="11"
            fill="var(--color-ios-green)"
          />
          {/* Checkmark */}
          <path
            d="M7 12.5l3 3 7-7"
            stroke="#ffffff"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
  }
}

function getStatusLabel(status: HabitStatus): string {
  switch (status) {
    case 'not_started':
      return 'Not started';
    case 'in_progress':
      return 'In progress';
    case 'completed':
      return 'Completed';
  }
}
