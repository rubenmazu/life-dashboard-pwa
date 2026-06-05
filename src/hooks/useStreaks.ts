import { useLiveQuery } from 'dexie-react-hooks';
import { useCallback } from 'react';
import { useProfile } from '@/context/ProfileContext';
import { calculateStreak } from '@/utils/streak-calculator';
import type { StreakRecord } from '@/db/schema';

/**
 * Hook for managing streak data persistence.
 * - Uses useLiveQuery on the StreakRecord table for reactive updates
 * - Provides updateStreak to recalculate from completion history
 * - Should be called whenever a habit status is toggled
 *
 * Requirements: 13.1, 13.5, 13.6, 13.7
 */

export interface UseStreaksResult {
  getStreak(habitId: string): StreakRecord | null;
  updateStreak(habitId: string): Promise<void>;
  streakRecords: StreakRecord[];
  isLoading: boolean;
}

/**
 * Returns today's date as a YYYY-MM-DD string in local time.
 */
function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function useStreaks(): UseStreaksResult {
  const { db } = useProfile();

  // Reactively query all streak records
  const streakRecords = useLiveQuery(
    async () => {
      if (!db) return [];
      return db.streakRecords.toArray();
    },
    [db],
    [] as StreakRecord[]
  );

  const isLoading = streakRecords === undefined;

  /**
   * Get the streak record for a specific habit.
   */
  const getStreak = useCallback(
    (habitId: string): StreakRecord | null => {
      if (!streakRecords) return null;
      return streakRecords.find((r) => r.habitId === habitId) ?? null;
    },
    [streakRecords]
  );

  /**
   * Recalculates and upserts the streak record for a habit.
   * Fetches all completions for the habit, runs calculateStreak,
   * and persists the result.
   */
  const updateStreak = useCallback(
    async (habitId: string): Promise<void> => {
      if (!db) return;

      const today = getTodayDateString();

      // Fetch all completions for this habit
      const completions = await db.habitCompletions
        .where('habitId')
        .equals(habitId)
        .toArray();

      // Calculate streak from completion history
      const result = calculateStreak(completions, today);

      // Upsert the streak record
      const existing = await db.streakRecords
        .where('habitId')
        .equals(habitId)
        .first();

      if (existing) {
        await db.streakRecords.update(existing.id!, {
          currentStreak: result.currentStreak,
          longestStreak: Math.max(result.longestStreak, existing.longestStreak),
          lastCompletedDate: result.lastCompletedDate,
          updatedAt: Date.now(),
        });
      } else {
        await db.streakRecords.add({
          habitId,
          currentStreak: result.currentStreak,
          longestStreak: result.longestStreak,
          lastCompletedDate: result.lastCompletedDate,
          updatedAt: Date.now(),
        });
      }
    },
    [db]
  );

  return {
    getStreak,
    updateStreak,
    streakRecords: streakRecords ?? [],
    isLoading,
  };
}
