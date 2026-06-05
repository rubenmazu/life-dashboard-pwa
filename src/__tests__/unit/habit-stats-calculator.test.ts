import { describe, it, expect } from 'vitest';
import {
  calculateWeeklyHabitStats,
  getWeekStartDate,
  getPreviousWeekStart,
} from '../../utils/habit-stats-calculator';

describe('getWeekStartDate', () => {
  it('returns Monday for a Monday date', () => {
    // 2024-01-08 is a Monday
    const result = getWeekStartDate(new Date(2024, 0, 8));
    expect(result).toBe('2024-01-08');
  });

  it('returns Monday for a Wednesday date', () => {
    // 2024-01-10 is a Wednesday → Monday is 2024-01-08
    const result = getWeekStartDate(new Date(2024, 0, 10));
    expect(result).toBe('2024-01-08');
  });

  it('returns Monday for a Sunday date', () => {
    // 2024-01-14 is a Sunday → Monday is 2024-01-08
    const result = getWeekStartDate(new Date(2024, 0, 14));
    expect(result).toBe('2024-01-08');
  });

  it('returns Monday for a Saturday date', () => {
    // 2024-01-13 is a Saturday → Monday is 2024-01-08
    const result = getWeekStartDate(new Date(2024, 0, 13));
    expect(result).toBe('2024-01-08');
  });

  it('handles month boundary crossing', () => {
    // 2024-02-01 is a Thursday → Monday is 2024-01-29
    const result = getWeekStartDate(new Date(2024, 1, 1));
    expect(result).toBe('2024-01-29');
  });

  it('handles year boundary crossing', () => {
    // 2024-01-01 is a Monday
    const result = getWeekStartDate(new Date(2024, 0, 1));
    expect(result).toBe('2024-01-01');
  });
});

describe('getPreviousWeekStart', () => {
  it('returns the Monday 7 days before', () => {
    const result = getPreviousWeekStart('2024-01-15');
    expect(result).toBe('2024-01-08');
  });

  it('handles month boundary crossing', () => {
    const result = getPreviousWeekStart('2024-02-05');
    expect(result).toBe('2024-01-29');
  });

  it('handles year boundary crossing', () => {
    const result = getPreviousWeekStart('2024-01-01');
    expect(result).toBe('2023-12-25');
  });
});

describe('calculateWeeklyHabitStats', () => {
  // Week: Monday 2024-01-08 to Sunday 2024-01-14

  const weekStart = '2024-01-08';

  it('returns correct summary for a single habit with full week completion', () => {
    const habits = [
      { id: 'h1', name: 'Exercise', createdAt: new Date(2024, 0, 1).getTime() },
    ];
    const completions = [
      { habitId: 'h1', date: '2024-01-08', status: 'completed' as const },
      { habitId: 'h1', date: '2024-01-09', status: 'completed' as const },
      { habitId: 'h1', date: '2024-01-10', status: 'completed' as const },
      { habitId: 'h1', date: '2024-01-11', status: 'completed' as const },
      { habitId: 'h1', date: '2024-01-12', status: 'completed' as const },
      { habitId: 'h1', date: '2024-01-13', status: 'completed' as const },
      { habitId: 'h1', date: '2024-01-14', status: 'completed' as const },
    ];

    const result = calculateWeeklyHabitStats(habits, completions, weekStart);

    expect(result.weekStartDate).toBe('2024-01-08');
    expect(result.weekEndDate).toBe('2024-01-14');
    expect(result.overallCompletionPercentage).toBe(100);
    expect(result.habitRates).toHaveLength(1);
    expect(result.habitRates[0]).toEqual({
      habitId: 'h1',
      habitName: 'Exercise',
      completionRate: 100,
      activeDays: 7,
      completedDays: 7,
    });
  });

  it('only counts "completed" status toward completion rate', () => {
    const habits = [
      { id: 'h1', name: 'Read', createdAt: new Date(2024, 0, 1).getTime() },
    ];
    const completions = [
      { habitId: 'h1', date: '2024-01-08', status: 'completed' as const },
      { habitId: 'h1', date: '2024-01-09', status: 'in_progress' as const },
      { habitId: 'h1', date: '2024-01-10', status: 'not_started' as const },
      { habitId: 'h1', date: '2024-01-11', status: 'completed' as const },
      { habitId: 'h1', date: '2024-01-12', status: 'in_progress' as const },
    ];

    const result = calculateWeeklyHabitStats(habits, completions, weekStart);

    expect(result.habitRates[0].completedDays).toBe(2);
    expect(result.habitRates[0].activeDays).toBe(7);
    expect(result.habitRates[0].completionRate).toBe(29); // round(2/7 * 100) = 29
  });

  it('handles mid-week habit creation (Requirement 14.6)', () => {
    // Habit created on Wednesday 2024-01-10, so active days = 5 (Wed-Sun)
    const habits = [
      { id: 'h1', name: 'Meditate', createdAt: new Date(2024, 0, 10).getTime() },
    ];
    const completions = [
      { habitId: 'h1', date: '2024-01-10', status: 'completed' as const },
      { habitId: 'h1', date: '2024-01-11', status: 'completed' as const },
      { habitId: 'h1', date: '2024-01-12', status: 'completed' as const },
    ];

    const result = calculateWeeklyHabitStats(habits, completions, weekStart);

    expect(result.habitRates[0].activeDays).toBe(5);
    expect(result.habitRates[0].completedDays).toBe(3);
    expect(result.habitRates[0].completionRate).toBe(60); // round(3/5 * 100) = 60
  });

  it('excludes habits created after the week ended', () => {
    const habits = [
      { id: 'h1', name: 'Future Habit', createdAt: new Date(2024, 0, 20).getTime() },
    ];
    const completions: { habitId: string; date: string; status: 'completed' | 'in_progress' | 'not_started' }[] = [];

    const result = calculateWeeklyHabitStats(habits, completions, weekStart);

    expect(result.habitRates).toHaveLength(0);
    expect(result.overallCompletionPercentage).toBe(0);
  });

  it('calculates overall completion percentage across multiple habits', () => {
    const habits = [
      { id: 'h1', name: 'Exercise', createdAt: new Date(2024, 0, 1).getTime() },
      { id: 'h2', name: 'Read', createdAt: new Date(2024, 0, 1).getTime() },
    ];
    const completions = [
      // h1: 5 out of 7
      { habitId: 'h1', date: '2024-01-08', status: 'completed' as const },
      { habitId: 'h1', date: '2024-01-09', status: 'completed' as const },
      { habitId: 'h1', date: '2024-01-10', status: 'completed' as const },
      { habitId: 'h1', date: '2024-01-11', status: 'completed' as const },
      { habitId: 'h1', date: '2024-01-12', status: 'completed' as const },
      // h2: 3 out of 7
      { habitId: 'h2', date: '2024-01-08', status: 'completed' as const },
      { habitId: 'h2', date: '2024-01-09', status: 'completed' as const },
      { habitId: 'h2', date: '2024-01-10', status: 'completed' as const },
    ];

    const result = calculateWeeklyHabitStats(habits, completions, weekStart);

    // Overall: (5+3) / (7+7) = 8/14 = 57.14... → 57
    expect(result.overallCompletionPercentage).toBe(57);
  });

  it('identifies top 3 habits by completion rate', () => {
    const habits = [
      { id: 'h1', name: 'A', createdAt: new Date(2024, 0, 1).getTime() },
      { id: 'h2', name: 'B', createdAt: new Date(2024, 0, 1).getTime() },
      { id: 'h3', name: 'C', createdAt: new Date(2024, 0, 1).getTime() },
      { id: 'h4', name: 'D', createdAt: new Date(2024, 0, 1).getTime() },
    ];
    const completions = [
      // h1: 7/7 = 100%
      ...Array.from({ length: 7 }, (_, i) => ({
        habitId: 'h1', date: `2024-01-${String(8 + i).padStart(2, '0')}`, status: 'completed' as const,
      })),
      // h2: 5/7 = 71%
      ...Array.from({ length: 5 }, (_, i) => ({
        habitId: 'h2', date: `2024-01-${String(8 + i).padStart(2, '0')}`, status: 'completed' as const,
      })),
      // h3: 3/7 = 43%
      ...Array.from({ length: 3 }, (_, i) => ({
        habitId: 'h3', date: `2024-01-${String(8 + i).padStart(2, '0')}`, status: 'completed' as const,
      })),
      // h4: 1/7 = 14%
      { habitId: 'h4', date: '2024-01-08', status: 'completed' as const },
    ];

    const result = calculateWeeklyHabitStats(habits, completions, weekStart);

    expect(result.topHabits).toHaveLength(3);
    expect(result.topHabits[0].habitId).toBe('h1');
    expect(result.topHabits[1].habitId).toBe('h2');
    expect(result.topHabits[2].habitId).toBe('h3');
  });

  it('identifies bottom 3 habits by completion rate', () => {
    const habits = [
      { id: 'h1', name: 'A', createdAt: new Date(2024, 0, 1).getTime() },
      { id: 'h2', name: 'B', createdAt: new Date(2024, 0, 1).getTime() },
      { id: 'h3', name: 'C', createdAt: new Date(2024, 0, 1).getTime() },
      { id: 'h4', name: 'D', createdAt: new Date(2024, 0, 1).getTime() },
    ];
    const completions = [
      // h1: 7/7 = 100%
      ...Array.from({ length: 7 }, (_, i) => ({
        habitId: 'h1', date: `2024-01-${String(8 + i).padStart(2, '0')}`, status: 'completed' as const,
      })),
      // h2: 5/7 = 71%
      ...Array.from({ length: 5 }, (_, i) => ({
        habitId: 'h2', date: `2024-01-${String(8 + i).padStart(2, '0')}`, status: 'completed' as const,
      })),
      // h3: 3/7 = 43%
      ...Array.from({ length: 3 }, (_, i) => ({
        habitId: 'h3', date: `2024-01-${String(8 + i).padStart(2, '0')}`, status: 'completed' as const,
      })),
      // h4: 1/7 = 14%
      { habitId: 'h4', date: '2024-01-08', status: 'completed' as const },
    ];

    const result = calculateWeeklyHabitStats(habits, completions, weekStart);

    expect(result.bottomHabits).toHaveLength(3);
    expect(result.bottomHabits[0].habitId).toBe('h4');
    expect(result.bottomHabits[1].habitId).toBe('h3');
    expect(result.bottomHabits[2].habitId).toBe('h2');
  });

  it('returns all habits as top/bottom when fewer than 3 exist', () => {
    const habits = [
      { id: 'h1', name: 'A', createdAt: new Date(2024, 0, 1).getTime() },
      { id: 'h2', name: 'B', createdAt: new Date(2024, 0, 1).getTime() },
    ];
    const completions = [
      { habitId: 'h1', date: '2024-01-08', status: 'completed' as const },
    ];

    const result = calculateWeeklyHabitStats(habits, completions, weekStart);

    expect(result.topHabits).toHaveLength(2);
    expect(result.bottomHabits).toHaveLength(2);
  });

  it('handles empty habits array', () => {
    const result = calculateWeeklyHabitStats([], [], weekStart);

    expect(result.weekStartDate).toBe('2024-01-08');
    expect(result.weekEndDate).toBe('2024-01-14');
    expect(result.overallCompletionPercentage).toBe(0);
    expect(result.habitRates).toHaveLength(0);
    expect(result.topHabits).toHaveLength(0);
    expect(result.bottomHabits).toHaveLength(0);
  });

  it('handles no completions (all habits at 0%)', () => {
    const habits = [
      { id: 'h1', name: 'A', createdAt: new Date(2024, 0, 1).getTime() },
      { id: 'h2', name: 'B', createdAt: new Date(2024, 0, 1).getTime() },
    ];

    const result = calculateWeeklyHabitStats(habits, [], weekStart);

    expect(result.overallCompletionPercentage).toBe(0);
    expect(result.habitRates[0].completionRate).toBe(0);
    expect(result.habitRates[1].completionRate).toBe(0);
  });

  it('rounds completion rate to nearest whole number', () => {
    // 1 out of 3 active days = 33.33...% → 33
    const habits = [
      { id: 'h1', name: 'A', createdAt: new Date(2024, 0, 12).getTime() }, // Friday → 3 active days
    ];
    const completions = [
      { habitId: 'h1', date: '2024-01-12', status: 'completed' as const },
    ];

    const result = calculateWeeklyHabitStats(habits, completions, weekStart);

    expect(result.habitRates[0].completionRate).toBe(33);
  });

  it('handles habit created on Sunday (last day of week)', () => {
    // Created on Sunday 2024-01-14 → only 1 active day
    const habits = [
      { id: 'h1', name: 'New', createdAt: new Date(2024, 0, 14).getTime() },
    ];
    const completions = [
      { habitId: 'h1', date: '2024-01-14', status: 'completed' as const },
    ];

    const result = calculateWeeklyHabitStats(habits, completions, weekStart);

    expect(result.habitRates[0].activeDays).toBe(1);
    expect(result.habitRates[0].completedDays).toBe(1);
    expect(result.habitRates[0].completionRate).toBe(100);
  });

  it('ignores completions outside the specified week', () => {
    const habits = [
      { id: 'h1', name: 'A', createdAt: new Date(2024, 0, 1).getTime() },
    ];
    const completions = [
      // Previous week
      { habitId: 'h1', date: '2024-01-07', status: 'completed' as const },
      // This week
      { habitId: 'h1', date: '2024-01-08', status: 'completed' as const },
      // Next week
      { habitId: 'h1', date: '2024-01-15', status: 'completed' as const },
    ];

    const result = calculateWeeklyHabitStats(habits, completions, weekStart);

    expect(result.habitRates[0].completedDays).toBe(1);
    expect(result.habitRates[0].activeDays).toBe(7);
  });
});
