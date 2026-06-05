import { useState, useEffect, useMemo, useCallback } from 'react';
import { useProfile } from '@/context/ProfileContext';
import { isStreakMilestone } from '@/utils/streak-calculator';
import type { StreakRecord, HabitCompletion } from '@/db/schema';

/**
 * StreakDisplay component for a single habit.
 * - Shows current streak (fire emoji + number) and longest streak
 * - 7-day dot grid showing recent completion history (green = completed, gray = not)
 * - Milestone celebration animation (sparkle icon for 3 seconds)
 *
 * Requirements: 13.1, 13.5, 13.6, 13.7
 */

interface StreakDisplayProps {
  habitId: string;
  streakRecord: StreakRecord | null;
}

/**
 * Returns the last 7 days (today + 6 preceding) as YYYY-MM-DD strings.
 */
function getLast7Days(): string[] {
  const days: string[] = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    days.push(`${year}-${month}-${day}`);
  }
  return days;
}

/**
 * Returns a short day label (M, T, W, etc.)
 */
function getDayLabel(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return ['S', 'M', 'T', 'W', 'T', 'F', 'S'][d.getDay()];
}

export function StreakDisplay({ habitId, streakRecord }: StreakDisplayProps) {
  const { db } = useProfile();
  const [completionMap, setCompletionMap] = useState<Map<string, string>>(new Map());
  const [showCelebration, setShowCelebration] = useState(false);
  const [prevStreak, setPrevStreak] = useState<number | null>(null);

  const currentStreak = streakRecord?.currentStreak ?? 0;
  const longestStreak = streakRecord?.longestStreak ?? 0;

  const last7Days = useMemo(() => getLast7Days(), []);

  // Fetch completions for the last 7 days
  const loadCompletions = useCallback(async () => {
    if (!db) return;

    const completions: HabitCompletion[] = await db.habitCompletions
      .where('habitId')
      .equals(habitId)
      .toArray();

    const map = new Map<string, string>();
    for (const c of completions) {
      if (last7Days.includes(c.date)) {
        map.set(c.date, c.status);
      }
    }
    setCompletionMap(map);
  }, [db, habitId, last7Days]);

  useEffect(() => {
    loadCompletions();
  }, [loadCompletions]);

  // Detect milestone celebration
  useEffect(() => {
    if (prevStreak !== null && currentStreak !== prevStreak) {
      if (isStreakMilestone(currentStreak)) {
        setShowCelebration(true);
        const timer = setTimeout(() => setShowCelebration(false), 3000);
        return () => clearTimeout(timer);
      }
    }
    setPrevStreak(currentStreak);
  }, [currentStreak, prevStreak]);

  return (
    <div className="flex flex-col gap-2 px-4 py-3">
      {/* Streak counters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <span className="text-base" aria-hidden="true">🔥</span>
          <span
            className="text-sm font-semibold"
            style={{ color: 'var(--color-ios-orange)' }}
            aria-label={`Current streak: ${currentStreak} days`}
          >
            {currentStreak}
          </span>
          {showCelebration && (
            <span
              className="text-base animate-bounce"
              aria-label={`Milestone reached: ${currentStreak} days!`}
              role="img"
            >
              ✨
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className="text-xs"
            style={{ color: 'var(--color-ios-text-tertiary)' }}
          >
            Best:
          </span>
          <span
            className="text-sm font-medium"
            style={{ color: 'var(--color-ios-text-secondary)' }}
            aria-label={`Longest streak: ${longestStreak} days`}
          >
            {longestStreak}
          </span>
        </div>
      </div>

      {/* 7-day dot grid */}
      <div
        className="flex items-center gap-1.5"
        role="img"
        aria-label={`Last 7 days: ${last7Days.map((d) => completionMap.get(d) === 'completed' ? 'completed' : 'not completed').join(', ')}`}
      >
        {last7Days.map((date) => {
          const status = completionMap.get(date);
          const isCompleted = status === 'completed';
          return (
            <div key={date} className="flex flex-col items-center gap-0.5">
              <span
                className="text-[9px] font-medium"
                style={{ color: 'var(--color-ios-text-tertiary)' }}
                aria-hidden="true"
              >
                {getDayLabel(date)}
              </span>
              <span
                className="block rounded-full"
                style={{
                  width: '8px',
                  height: '8px',
                  backgroundColor: isCompleted
                    ? 'var(--color-ios-green)'
                    : 'var(--color-ios-separator)',
                  transition: 'background-color var(--duration-fast) var(--ease-ios)',
                }}
                aria-hidden="true"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
