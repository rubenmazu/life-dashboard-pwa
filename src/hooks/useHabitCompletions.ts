import { useLiveQuery } from 'dexie-react-hooks';
import { useCallback, useRef, useEffect, useState } from 'react';
import { useProfile } from '@/context/ProfileContext';
import { cycleStatus, type HabitStatus } from '@/utils/habit-status';
import { calculateStreak } from '@/utils/streak-calculator';
import type { HabitCompletion } from '@/db/schema';

/**
 * Hook for managing daily habit completion data.
 * - Uses useLiveQuery to reactively query today's completions
 * - Provides toggleStatus to cycle habit status with immediate persistence
 * - Handles day boundary (midnight → fresh checklist)
 * - Provides getStatusForDate for streak/history lookups
 * - Automatically recalculates streak on each toggle
 *
 * Requirements: 10.6, 10.7, 10.9, 13.1, 13.5
 */

export interface UseHabitCompletionsResult {
  todayStatuses: Map<string, HabitStatus>;
  isLoading: boolean;
  toggleStatus: (habitId: string) => Promise<void>;
  getStatusForDate: (habitId: string, date: string) => Promise<HabitStatus>;
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

export function useHabitCompletions(): UseHabitCompletionsResult {
  const { db } = useProfile();

  // Track today's date to detect day boundary changes
  const [today, setToday] = useState<string>(getTodayDateString);
  const todayRef = useRef<string>(today);
  todayRef.current = today;

  // Day boundary detection: check every minute if the date has changed
  useEffect(() => {
    const interval = setInterval(() => {
      const currentDate = getTodayDateString();
      if (currentDate !== todayRef.current) {
        setToday(currentDate);
      }
    }, 60_000); // Check every 60 seconds

    return () => clearInterval(interval);
  }, []);

  // Reactively query today's completions using useLiveQuery
  const completions = useLiveQuery(
    async () => {
      if (!db) return [];
      return db.habitCompletions.where('date').equals(today).toArray();
    },
    [db, today],
    [] as HabitCompletion[]
  );

  // Build a Map from habitId → status for today
  const todayStatuses: Map<string, HabitStatus> = new Map();
  if (completions) {
    for (const completion of completions) {
      todayStatuses.set(completion.habitId, completion.status);
    }
  }

  const isLoading = completions === undefined;

  /**
   * Recalculates and upserts the streak record for a habit.
   * Called after each successful status toggle.
   */
  const recalculateStreak = useCallback(
    async (habitId: string, today: string): Promise<void> => {
      if (!db) return;

      // Fetch all completions for this habit
      const allCompletions = await db.habitCompletions
        .where('habitId')
        .equals(habitId)
        .toArray();

      // Calculate streak from completion history
      const result = calculateStreak(allCompletions, today);

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

  /**
   * Toggles the status for a habit on today's date.
   * Cycles: not_started → in_progress → completed → not_started
   * Persists immediately. On error, reverts and throws.
   * Requirement 10.6: persist within 2s
   * Requirement 10.7: revert on failure
   */
  const toggleStatus = useCallback(
    async (habitId: string) => {
      if (!db) {
        throw new Error('Database not available');
      }

      const currentDate = getTodayDateString();
      const currentStatus: HabitStatus =
        todayStatuses.get(habitId) ?? 'not_started';
      const newStatus = cycleStatus(currentStatus);

      try {
        // Check if a record already exists for this habit+date
        const existing = await db.habitCompletions
          .where('[habitId+date]')
          .equals([habitId, currentDate])
          .first();

        if (existing) {
          // If cycling back to not_started, we can either update or delete.
          // We update to keep the record for tracking purposes.
          await db.habitCompletions.update(existing.id!, {
            status: newStatus,
            updatedAt: Date.now(),
          });
        } else {
          // Create new record — cycling from not_started → in_progress
          await db.habitCompletions.add({
            habitId,
            date: currentDate,
            status: newStatus,
            updatedAt: Date.now(),
          });
        }

        // Recalculate streak after successful toggle
        await recalculateStreak(habitId, currentDate);
      } catch (error) {
        // On error: the live query will reflect the DB state (unchanged),
        // so the UI automatically reverts. Re-throw for the caller to handle.
        throw error;
      }
    },
    [db, todayStatuses, recalculateStreak]
  );

  /**
   * Gets the status for a specific habit on a specific date.
   * Used by streak calculations and history views.
   * Returns 'not_started' if no record exists.
   */
  const getStatusForDate = useCallback(
    async (habitId: string, date: string): Promise<HabitStatus> => {
      if (!db) {
        return 'not_started';
      }

      const record = await db.habitCompletions
        .where('[habitId+date]')
        .equals([habitId, date])
        .first();

      return record?.status ?? 'not_started';
    },
    [db]
  );

  return {
    todayStatuses,
    isLoading,
    toggleStatus,
    getStatusForDate,
  };
}
