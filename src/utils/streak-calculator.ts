/**
 * Streak Calculation Utilities
 * Requirements 13.1, 13.2, 13.3, 13.4, 13.5, 13.8:
 * - Calculate current and longest streaks from completion history
 * - Only "completed" status counts toward a streak
 * - Detect streak milestones
 */

export interface StreakResult {
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate: string | null;
}

export const STREAK_MILESTONES = [7, 14, 30, 60, 90, 365] as const;

/**
 * Returns the previous calendar day in YYYY-MM-DD format.
 */
function getPreviousDay(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() - 1);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Calculate current and longest streak from a sorted array of completion records.
 *
 * Logic:
 * - Only "completed" status counts toward a streak.
 * - Current streak: consecutive "completed" days counting backward from today
 *   (or the most recent completed day if today is not yet completed).
 * - If today is completed, include today in the streak count.
 * - If today is NOT completed but yesterday was, current streak = 0 (streak broken).
 * - Longest streak: maximum consecutive "completed" run in the entire history.
 * - Handle empty completions: both streaks are 0.
 */
export function calculateStreak(
  completions: { date: string; status: 'not_started' | 'in_progress' | 'completed' }[],
  today: string
): StreakResult {
  // Build a set of completed dates for O(1) lookup
  const completedDates = new Set<string>();
  for (const c of completions) {
    if (c.status === 'completed') {
      completedDates.add(c.date);
    }
  }

  if (completedDates.size === 0) {
    return { currentStreak: 0, longestStreak: 0, lastCompletedDate: null };
  }

  // Sort completed dates chronologically to find longest streak and last completed
  const sortedDates = Array.from(completedDates).sort();
  const lastCompletedDate = sortedDates[sortedDates.length - 1];

  // Calculate longest streak from sorted dates
  let longestStreak = 1;
  let runLength = 1;
  for (let i = 1; i < sortedDates.length; i++) {
    const expectedPrev = getPreviousDay(sortedDates[i]);
    if (expectedPrev === sortedDates[i - 1]) {
      runLength++;
    } else {
      runLength = 1;
    }
    if (runLength > longestStreak) {
      longestStreak = runLength;
    }
  }

  // Calculate current streak
  let currentStreak = 0;
  const todayCompleted = completedDates.has(today);
  const yesterday = getPreviousDay(today);

  if (todayCompleted) {
    // Count backward from today
    currentStreak = 1;
    let checkDate = yesterday;
    while (completedDates.has(checkDate)) {
      currentStreak++;
      checkDate = getPreviousDay(checkDate);
    }
  } else if (completedDates.has(yesterday)) {
    // Today not completed but yesterday was → streak is broken
    currentStreak = 0;
  } else {
    // Neither today nor yesterday completed → streak is 0
    currentStreak = 0;
  }

  return { currentStreak, longestStreak, lastCompletedDate };
}

/**
 * Check if a streak count is a milestone.
 */
export function isStreakMilestone(streak: number): boolean {
  return (STREAK_MILESTONES as readonly number[]).includes(streak);
}

/**
 * Get the next milestone to reach (or null if past all milestones).
 */
export function getNextMilestone(currentStreak: number): number | null {
  for (const milestone of STREAK_MILESTONES) {
    if (milestone > currentStreak) {
      return milestone;
    }
  }
  return null;
}
