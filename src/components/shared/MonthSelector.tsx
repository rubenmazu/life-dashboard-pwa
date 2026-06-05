import { useState, useCallback } from 'react';
import {
  type MonthYear,
  getMonthLabel,
  getNextMonth,
  getPrevMonth,
  isWithinRange,
} from '../../utils/month-utils';

interface MonthSelectorProps {
  selectedMonth: MonthYear;
  onChange: (newMonth: MonthYear) => void;
}

/**
 * MonthSelector — Shared month navigation component.
 * Requirement 5.5: Navigate between months (any past month, up to 12 months in the future).
 * iOS-style design with 44px tap targets and subtle animations on month change.
 */
export function MonthSelector({ selectedMonth, onChange }: MonthSelectorProps) {
  const [animating, setAnimating] = useState<'left' | 'right' | null>(null);

  const { year, month } = selectedMonth;
  const next = getNextMonth(year, month);
  const canGoNext = isWithinRange(next.year, next.month);

  const handlePrev = useCallback(() => {
    const prev = getPrevMonth(year, month);
    setAnimating('right');
    onChange(prev);
    setTimeout(() => setAnimating(null), 200);
  }, [year, month, onChange]);

  const handleNext = useCallback(() => {
    if (!canGoNext) return;
    const next = getNextMonth(year, month);
    setAnimating('left');
    onChange(next);
    setTimeout(() => setAnimating(null), 200);
  }, [year, month, canGoNext, onChange]);

  return (
    <div className="flex items-center justify-between px-4 py-2">
      {/* Previous month button */}
      <button
        type="button"
        onClick={handlePrev}
        aria-label="Previous month"
        className="flex items-center justify-center rounded-full text-[var(--color-ios-blue)] transition-all duration-[var(--duration-fast)] ease-[var(--ease-ios)] active:scale-90 active:opacity-70"
        style={{ width: '44px', height: '44px', minWidth: '44px', minHeight: '44px' }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-5 h-5"
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      {/* Month/Year label */}
      <span
        className={`text-[17px] font-semibold text-[var(--color-ios-text-primary)] select-none transition-all duration-[var(--duration-fast)] ease-[var(--ease-ios)] ${
          animating === 'left'
            ? 'translate-x-[-8px] opacity-0'
            : animating === 'right'
              ? 'translate-x-[8px] opacity-0'
              : 'translate-x-0 opacity-100'
        }`}
      >
        {getMonthLabel(year, month)}
      </span>

      {/* Next month button */}
      <button
        type="button"
        onClick={handleNext}
        disabled={!canGoNext}
        aria-label="Next month"
        className="flex items-center justify-center rounded-full text-[var(--color-ios-blue)] transition-all duration-[var(--duration-fast)] ease-[var(--ease-ios)] active:scale-90 active:opacity-70 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
        style={{ width: '44px', height: '44px', minWidth: '44px', minHeight: '44px' }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-5 h-5"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
    </div>
  );
}
