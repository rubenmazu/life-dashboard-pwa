import { describe, it, expect } from 'vitest';
import {
  calculateStreak,
  isStreakMilestone,
  getNextMilestone,
  STREAK_MILESTONES,
} from '../../utils/streak-calculator';

describe('calculateStreak', () => {
  it('returns 0/0 for empty completions', () => {
    const result = calculateStreak([], '2024-01-15');
    expect(result).toEqual({
      currentStreak: 0,
      longestStreak: 0,
      lastCompletedDate: null,
    });
  });

  it('returns 0/0 when all completions are non-completed statuses', () => {
    const completions = [
      { date: '2024-01-14', status: 'in_progress' as const },
      { date: '2024-01-15', status: 'not_started' as const },
    ];
    const result = calculateStreak(completions, '2024-01-15');
    expect(result).toEqual({
      currentStreak: 0,
      longestStreak: 0,
      lastCompletedDate: null,
    });
  });

  it('returns 1/1 for a single day completed (today)', () => {
    const completions = [{ date: '2024-01-15', status: 'completed' as const }];
    const result = calculateStreak(completions, '2024-01-15');
    expect(result).toEqual({
      currentStreak: 1,
      longestStreak: 1,
      lastCompletedDate: '2024-01-15',
    });
  });

  it('returns 1/1 for a single day completed in the past (not consecutive to today)', () => {
    const completions = [{ date: '2024-01-10', status: 'completed' as const }];
    const result = calculateStreak(completions, '2024-01-15');
    expect(result).toEqual({
      currentStreak: 0,
      longestStreak: 1,
      lastCompletedDate: '2024-01-10',
    });
  });

  it('counts consecutive completed days correctly when today is completed', () => {
    const completions = [
      { date: '2024-01-13', status: 'completed' as const },
      { date: '2024-01-14', status: 'completed' as const },
      { date: '2024-01-15', status: 'completed' as const },
    ];
    const result = calculateStreak(completions, '2024-01-15');
    expect(result).toEqual({
      currentStreak: 3,
      longestStreak: 3,
      lastCompletedDate: '2024-01-15',
    });
  });

  it('a gap breaks the streak', () => {
    const completions = [
      { date: '2024-01-12', status: 'completed' as const },
      { date: '2024-01-13', status: 'completed' as const },
      // gap on 2024-01-14
      { date: '2024-01-15', status: 'completed' as const },
    ];
    const result = calculateStreak(completions, '2024-01-15');
    expect(result.currentStreak).toBe(1);
    expect(result.longestStreak).toBe(2);
  });

  it('today not completed means current streak is 0', () => {
    const completions = [
      { date: '2024-01-13', status: 'completed' as const },
      { date: '2024-01-14', status: 'completed' as const },
      { date: '2024-01-15', status: 'not_started' as const },
    ];
    const result = calculateStreak(completions, '2024-01-15');
    expect(result.currentStreak).toBe(0);
    expect(result.longestStreak).toBe(2);
  });

  it('preserves historical longer streak even if current is shorter', () => {
    const completions = [
      // Historical 5-day streak
      { date: '2024-01-05', status: 'completed' as const },
      { date: '2024-01-06', status: 'completed' as const },
      { date: '2024-01-07', status: 'completed' as const },
      { date: '2024-01-08', status: 'completed' as const },
      { date: '2024-01-09', status: 'completed' as const },
      // Gap
      { date: '2024-01-11', status: 'completed' as const },
      // Current 2-day streak
      { date: '2024-01-14', status: 'completed' as const },
      { date: '2024-01-15', status: 'completed' as const },
    ];
    const result = calculateStreak(completions, '2024-01-15');
    expect(result.currentStreak).toBe(2);
    expect(result.longestStreak).toBe(5);
  });

  it('only counts "completed" status toward streak, ignoring in_progress', () => {
    const completions = [
      { date: '2024-01-13', status: 'completed' as const },
      { date: '2024-01-14', status: 'in_progress' as const },
      { date: '2024-01-15', status: 'completed' as const },
    ];
    const result = calculateStreak(completions, '2024-01-15');
    // 14th was in_progress (not completed), so current streak is just 1
    expect(result.currentStreak).toBe(1);
    expect(result.longestStreak).toBe(1);
  });

  it('handles month boundary correctly', () => {
    const completions = [
      { date: '2024-01-30', status: 'completed' as const },
      { date: '2024-01-31', status: 'completed' as const },
      { date: '2024-02-01', status: 'completed' as const },
    ];
    const result = calculateStreak(completions, '2024-02-01');
    expect(result.currentStreak).toBe(3);
    expect(result.longestStreak).toBe(3);
  });

  it('handles year boundary correctly', () => {
    const completions = [
      { date: '2023-12-30', status: 'completed' as const },
      { date: '2023-12-31', status: 'completed' as const },
      { date: '2024-01-01', status: 'completed' as const },
    ];
    const result = calculateStreak(completions, '2024-01-01');
    expect(result.currentStreak).toBe(3);
    expect(result.longestStreak).toBe(3);
  });

  it('current streak is 0 when yesterday was completed but today is not', () => {
    const completions = [
      { date: '2024-01-13', status: 'completed' as const },
      { date: '2024-01-14', status: 'completed' as const },
    ];
    const result = calculateStreak(completions, '2024-01-15');
    expect(result.currentStreak).toBe(0);
    expect(result.longestStreak).toBe(2);
  });
});

describe('isStreakMilestone', () => {
  it('returns true for all defined milestones', () => {
    for (const milestone of STREAK_MILESTONES) {
      expect(isStreakMilestone(milestone)).toBe(true);
    }
  });

  it('returns false for non-milestone values', () => {
    expect(isStreakMilestone(0)).toBe(false);
    expect(isStreakMilestone(1)).toBe(false);
    expect(isStreakMilestone(5)).toBe(false);
    expect(isStreakMilestone(10)).toBe(false);
    expect(isStreakMilestone(15)).toBe(false);
    expect(isStreakMilestone(100)).toBe(false);
    expect(isStreakMilestone(366)).toBe(false);
  });
});

describe('getNextMilestone', () => {
  it('returns 7 when current streak is 0', () => {
    expect(getNextMilestone(0)).toBe(7);
  });

  it('returns 7 when current streak is 5', () => {
    expect(getNextMilestone(5)).toBe(7);
  });

  it('returns 14 when current streak is 7', () => {
    expect(getNextMilestone(7)).toBe(14);
  });

  it('returns 30 when current streak is 14', () => {
    expect(getNextMilestone(14)).toBe(30);
  });

  it('returns 365 when current streak is 90', () => {
    expect(getNextMilestone(90)).toBe(365);
  });

  it('returns null when past all milestones', () => {
    expect(getNextMilestone(365)).toBe(null);
    expect(getNextMilestone(500)).toBe(null);
  });
});
