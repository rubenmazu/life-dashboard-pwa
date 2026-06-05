/**
 * Weekly Habit Statistics Calculator
 * Requirements 14.1, 14.2, 14.4, 14.6: Weekly completion rates, overall percentage,
 * top/bottom habits, and mid-week habit handling.
 */

import type { HabitStatus } from './habit-status';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface HabitWeeklyRate {
  habitId: string;
  habitName: string;
  completionRate: number;  // 0-100, rounded to nearest whole number
  activeDays: number;      // days since creation within week (for mid-week habits)
  completedDays: number;
}

export interface WeeklyHabitSummary {
  weekStartDate: string;    // "YYYY-MM-DD" (Monday)
  weekEndDate: string;      // "YYYY-MM-DD" (Sunday)
  overallCompletionPercentage: number;  // 0-100
  habitRates: HabitWeeklyRate[];
  topHabits: HabitWeeklyRate[];     // top 3 (or all if < 3)
  bottomHabits: HabitWeeklyRate[];  // bottom 3 (or all if < 3)
}

// ─── Helper Functions ─────────────────────────────────────────────────────────

/**
 * Returns the Monday (week start) of the week containing the given date as "YYYY-MM-DD".
 * Week starts on Monday (ISO 8601).
 */
export function getWeekStartDate(date: Date): string {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dayOfWeek = d.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
  // Calculate offset to Monday: if Sunday (0), go back 6 days; otherwise go back (dayOfWeek - 1)
  const offset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  d.setDate(d.getDate() - offset);
  return formatDate(d);
}

/**
 * Returns the previous week's Monday date string given the current week's Monday.
 */
export function getPreviousWeekStart(currentWeekStart: string): string {
  const d = parseDate(currentWeekStart);
  d.setDate(d.getDate() - 7);
  return formatDate(d);
}

// ─── Main Calculation ─────────────────────────────────────────────────────────

/**
 * Calculates weekly habit statistics for the given week.
 *
 * @param habits - Array of habits with id, name, and createdAt timestamp
 * @param completions - Array of completions with habitId, date, and status
 * @param weekStartDate - The Monday of the week as "YYYY-MM-DD"
 * @returns WeeklyHabitSummary with per-habit rates, overall percentage, and top/bottom lists
 */
export function calculateWeeklyHabitStats(
  habits: { id: string; name: string; createdAt: number }[],
  completions: { habitId: string; date: string; status: HabitStatus }[],
  weekStartDate: string
): WeeklyHabitSummary {
  const weekStart = parseDate(weekStartDate);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6); // Sunday
  const weekEndDate = formatDate(weekEnd);

  // Generate all 7 dates in the week (Monday to Sunday)
  const weekDates = getWeekDates(weekStart);

  // Build a lookup: habitId+date → status
  const completionMap = new Map<string, HabitStatus>();
  for (const completion of completions) {
    completionMap.set(`${completion.habitId}:${completion.date}`, completion.status);
  }

  // Calculate per-habit rates
  const habitRates: HabitWeeklyRate[] = [];

  for (const habit of habits) {
    const createdDate = new Date(habit.createdAt);
    const createdDateStr = formatDate(createdDate);

    // Determine active days: only count days where the habit existed
    // Requirement 14.6: If habit was created mid-week, only count days since creation
    let activeDays = 0;
    let completedDays = 0;

    for (const dateStr of weekDates) {
      // Habit is active on this day if it was created on or before this day
      if (dateStr >= createdDateStr) {
        activeDays++;
        const status = completionMap.get(`${habit.id}:${dateStr}`);
        // Requirement 14.1: Only "completed" counts toward completion rate
        if (status === 'completed') {
          completedDays++;
        }
      }
    }

    // Skip habits with 0 active days (created after the week ended)
    if (activeDays === 0) continue;

    const completionRate = Math.round((completedDays / activeDays) * 100);

    habitRates.push({
      habitId: habit.id,
      habitName: habit.name,
      completionRate,
      activeDays,
      completedDays,
    });
  }

  // Requirement 14.2: Overall = (total completed habit-days / total active habit-days) × 100
  const totalCompletedDays = habitRates.reduce((sum, r) => sum + r.completedDays, 0);
  const totalActiveDays = habitRates.reduce((sum, r) => sum + r.activeDays, 0);
  const overallCompletionPercentage = totalActiveDays > 0
    ? Math.round((totalCompletedDays / totalActiveDays) * 100)
    : 0;

  // Requirement 14.4: Top 3 (highest rate) and bottom 3 (lowest rate)
  const sortedByRate = [...habitRates].sort((a, b) => b.completionRate - a.completionRate);
  const topHabits = sortedByRate.slice(0, 3);
  const bottomHabits = [...habitRates]
    .sort((a, b) => a.completionRate - b.completionRate)
    .slice(0, 3);

  return {
    weekStartDate,
    weekEndDate,
    overallCompletionPercentage,
    habitRates,
    topHabits,
    bottomHabits,
  };
}

// ─── Internal Utilities ───────────────────────────────────────────────────────

/**
 * Formats a Date object as "YYYY-MM-DD".
 */
function formatDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parses a "YYYY-MM-DD" string into a Date object (local time, midnight).
 */
function parseDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Returns an array of 7 date strings (Monday to Sunday) for the week starting on weekStart.
 */
function getWeekDates(weekStart: Date): string[] {
  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    dates.push(formatDate(d));
  }
  return dates;
}
