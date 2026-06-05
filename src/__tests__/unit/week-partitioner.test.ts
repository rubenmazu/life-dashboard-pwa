import { describe, it, expect } from 'vitest';
import { partitionMonthIntoWeeks, calculateWeeklyStats } from '../../utils/week-partitioner';
import type { Expense, ExpenseCategory } from '../../db/schema';

describe('partitionMonthIntoWeeks', () => {
  it('covers every day of the month exactly once', () => {
    // January 2024 has 31 days, starts on Monday
    const weeks = partitionMonthIntoWeeks(2024, 1);
    const totalDays = weeks.reduce((sum, w) => sum + w.daysInWeek, 0);
    expect(totalDays).toBe(31);
  });

  it('handles a month starting on Monday (January 2024)', () => {
    // Jan 1, 2024 is a Monday → first week is full (Mon-Sun)
    const weeks = partitionMonthIntoWeeks(2024, 1);
    expect(weeks[0].startDate).toBe('2024-01-01');
    expect(weeks[0].endDate).toBe('2024-01-07');
    expect(weeks[0].daysInWeek).toBe(7);
  });

  it('handles a month starting mid-week (February 2024)', () => {
    // Feb 1, 2024 is a Thursday → first partial week is Thu-Sun (4 days)
    const weeks = partitionMonthIntoWeeks(2024, 2);
    expect(weeks[0].startDate).toBe('2024-02-01');
    expect(weeks[0].endDate).toBe('2024-02-04');
    expect(weeks[0].daysInWeek).toBe(4);
  });

  it('handles a month ending mid-week (February 2024)', () => {
    // Feb 2024 has 29 days (leap year), ends on Thursday
    const weeks = partitionMonthIntoWeeks(2024, 2);
    const lastWeek = weeks[weeks.length - 1];
    expect(lastWeek.endDate).toBe('2024-02-29');
    // Feb 26 is Monday, Feb 29 is Thursday → 4 days
    expect(lastWeek.startDate).toBe('2024-02-26');
    expect(lastWeek.daysInWeek).toBe(4);
  });

  it('handles a non-leap February (2023)', () => {
    // Feb 2023: starts on Wednesday, has 28 days
    const weeks = partitionMonthIntoWeeks(2023, 2);
    const totalDays = weeks.reduce((sum, w) => sum + w.daysInWeek, 0);
    expect(totalDays).toBe(28);
  });

  it('all weeks start on Monday except the first partial week', () => {
    // March 2024: starts on Friday
    const weeks = partitionMonthIntoWeeks(2024, 3);
    // First week is partial (Friday-Sunday)
    expect(weeks[0].startDate).toBe('2024-03-01');
    expect(weeks[0].daysInWeek).toBe(3); // Fri, Sat, Sun

    // Remaining full weeks start on Monday
    for (let i = 1; i < weeks.length - 1; i++) {
      const startDay = new Date(weeks[i].startDate).getDay();
      expect(startDay).toBe(1); // Monday
    }
  });

  it('weeks are contiguous (no gaps)', () => {
    const weeks = partitionMonthIntoWeeks(2024, 6); // June 2024
    for (let i = 1; i < weeks.length; i++) {
      const prevEnd = new Date(weeks[i - 1].endDate);
      const currStart = new Date(weeks[i].startDate);
      const diffMs = currStart.getTime() - prevEnd.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      expect(diffDays).toBe(1); // Next week starts exactly 1 day after previous ends
    }
  });

  it('handles a month that starts on Sunday (September 2024)', () => {
    // Sep 1, 2024 is a Sunday → first partial week is 1 day
    const weeks = partitionMonthIntoWeeks(2024, 9);
    expect(weeks[0].startDate).toBe('2024-09-01');
    expect(weeks[0].endDate).toBe('2024-09-01');
    expect(weeks[0].daysInWeek).toBe(1);
    // Next week starts on Monday Sep 2
    expect(weeks[1].startDate).toBe('2024-09-02');
  });

  it('handles a month with exactly 4 full weeks + partials (April 2024)', () => {
    // April 2024: starts on Monday, 30 days
    const weeks = partitionMonthIntoWeeks(2024, 4);
    // 4 full weeks (28 days) + 2 days partial
    expect(weeks.length).toBe(5);
    expect(weeks[0].daysInWeek).toBe(7);
    expect(weeks[1].daysInWeek).toBe(7);
    expect(weeks[2].daysInWeek).toBe(7);
    expect(weeks[3].daysInWeek).toBe(7);
    expect(weeks[4].daysInWeek).toBe(2);
  });
});

describe('calculateWeeklyStats', () => {
  const categories: ExpenseCategory[] = [
    { id: 'cat1', name: 'Food', budgetLimit: 600, createdAt: 0, updatedAt: 0 },
    { id: 'cat2', name: 'Transport', budgetLimit: 300, createdAt: 0, updatedAt: 0 },
  ];

  it('returns correct number of week partitions', () => {
    const result = calculateWeeklyStats([], categories, 2024, 1);
    const expectedWeeks = partitionMonthIntoWeeks(2024, 1);
    expect(result.length).toBe(expectedWeeks.length);
  });

  it('week numbers are 1-based and sequential', () => {
    const result = calculateWeeklyStats([], categories, 2024, 3);
    for (let i = 0; i < result.length; i++) {
      expect(result[i].weekNumber).toBe(i + 1);
    }
  });

  it('returns zero spending when no expenses', () => {
    const result = calculateWeeklyStats([], categories, 2024, 1);
    for (const week of result) {
      expect(week.totalSpending).toBe(0);
      expect(week.isOverBudget).toBe(false);
      expect(week.categoryBreakdown).toEqual([]);
    }
  });

  it('calculates proportional budget correctly', () => {
    // January 2024: 31 days, total budget = 600 + 300 = 900
    // First week (7 days): proportional = (900 / 31) * 7
    const result = calculateWeeklyStats([], categories, 2024, 1);
    const expected = (900 / 31) * 7;
    expect(result[0].proportionalBudget).toBeCloseTo(expected, 10);
  });

  it('assigns expenses to the correct week', () => {
    const expenses: Expense[] = [
      { id: 'e1', amount: 50, categoryId: 'cat1', date: '2024-01-01', notes: '', month: '2024-01', createdAt: 0, updatedAt: 0 },
      { id: 'e2', amount: 30, categoryId: 'cat1', date: '2024-01-08', notes: '', month: '2024-01', createdAt: 0, updatedAt: 0 },
    ];
    const result = calculateWeeklyStats(expenses, categories, 2024, 1);
    // First expense on Jan 1 → week 1 (Jan 1-7)
    expect(result[0].totalSpending).toBe(50);
    // Second expense on Jan 8 → week 2 (Jan 8-14)
    expect(result[1].totalSpending).toBe(30);
  });

  it('detects over-budget week correctly', () => {
    // January 2024: 31 days, total budget = 900
    // Proportional budget for week 1 (7 days) = (900 / 31) * 7 ≈ 203.23
    const expenses: Expense[] = [
      { id: 'e1', amount: 250, categoryId: 'cat1', date: '2024-01-01', notes: '', month: '2024-01', createdAt: 0, updatedAt: 0 },
    ];
    const result = calculateWeeklyStats(expenses, categories, 2024, 1);
    expect(result[0].isOverBudget).toBe(true);
  });

  it('marks week as not over-budget when spending equals proportional budget', () => {
    // Total budget = 900, days in month = 31, week 1 has 7 days
    // proportional = (900 / 31) * 7 ≈ 203.226
    // Spending exactly at proportional should not be over budget
    const proportional = (900 / 31) * 7;
    const expenses: Expense[] = [
      { id: 'e1', amount: proportional, categoryId: 'cat1', date: '2024-01-01', notes: '', month: '2024-01', createdAt: 0, updatedAt: 0 },
    ];
    const result = calculateWeeklyStats(expenses, categories, 2024, 1);
    expect(result[0].isOverBudget).toBe(false);
  });

  it('calculates category breakdown correctly', () => {
    const expenses: Expense[] = [
      { id: 'e1', amount: 100, categoryId: 'cat1', date: '2024-01-02', notes: '', month: '2024-01', createdAt: 0, updatedAt: 0 },
      { id: 'e2', amount: 50, categoryId: 'cat2', date: '2024-01-03', notes: '', month: '2024-01', createdAt: 0, updatedAt: 0 },
    ];
    const result = calculateWeeklyStats(expenses, categories, 2024, 1);
    const week1 = result[0];

    expect(week1.totalSpending).toBe(150);
    expect(week1.categoryBreakdown.length).toBe(2);

    const foodItem = week1.categoryBreakdown.find(b => b.categoryId === 'cat1');
    const transportItem = week1.categoryBreakdown.find(b => b.categoryId === 'cat2');

    expect(foodItem).toBeDefined();
    expect(foodItem!.amount).toBe(100);
    expect(foodItem!.categoryName).toBe('Food');

    expect(transportItem).toBeDefined();
    expect(transportItem!.amount).toBe(50);
    expect(transportItem!.categoryName).toBe('Transport');
  });

  it('percentages sum to 100 within ±1', () => {
    const expenses: Expense[] = [
      { id: 'e1', amount: 33.33, categoryId: 'cat1', date: '2024-01-01', notes: '', month: '2024-01', createdAt: 0, updatedAt: 0 },
      { id: 'e2', amount: 33.33, categoryId: 'cat2', date: '2024-01-02', notes: '', month: '2024-01', createdAt: 0, updatedAt: 0 },
      { id: 'e3', amount: 33.34, categoryId: 'cat1', date: '2024-01-03', notes: '', month: '2024-01', createdAt: 0, updatedAt: 0 },
    ];
    const result = calculateWeeklyStats(expenses, categories, 2024, 1);
    const week1 = result[0];
    const percentageSum = week1.categoryBreakdown.reduce((sum, item) => sum + item.percentage, 0);
    expect(percentageSum).toBe(100);
  });

  it('handles a single category with 100% percentage', () => {
    const expenses: Expense[] = [
      { id: 'e1', amount: 75, categoryId: 'cat1', date: '2024-01-05', notes: '', month: '2024-01', createdAt: 0, updatedAt: 0 },
    ];
    const result = calculateWeeklyStats(expenses, categories, 2024, 1);
    const week1 = result[0];
    expect(week1.categoryBreakdown.length).toBe(1);
    expect(week1.categoryBreakdown[0].percentage).toBe(100);
  });

  it('sum of all weekly spending equals total monthly spending', () => {
    const expenses: Expense[] = [
      { id: 'e1', amount: 100, categoryId: 'cat1', date: '2024-01-01', notes: '', month: '2024-01', createdAt: 0, updatedAt: 0 },
      { id: 'e2', amount: 200, categoryId: 'cat2', date: '2024-01-15', notes: '', month: '2024-01', createdAt: 0, updatedAt: 0 },
      { id: 'e3', amount: 50, categoryId: 'cat1', date: '2024-01-25', notes: '', month: '2024-01', createdAt: 0, updatedAt: 0 },
    ];
    const result = calculateWeeklyStats(expenses, categories, 2024, 1);
    const totalWeeklySpending = result.reduce((sum, w) => sum + w.totalSpending, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    expect(totalWeeklySpending).toBeCloseTo(totalExpenses, 10);
  });

  it('handles empty categories array (zero budget)', () => {
    const expenses: Expense[] = [
      { id: 'e1', amount: 100, categoryId: 'cat1', date: '2024-01-01', notes: '', month: '2024-01', createdAt: 0, updatedAt: 0 },
    ];
    const result = calculateWeeklyStats(expenses, [], 2024, 1);
    expect(result[0].proportionalBudget).toBe(0);
    expect(result[0].isOverBudget).toBe(true); // 100 > 0
  });

  it('handles expenses on the last day of the month', () => {
    const expenses: Expense[] = [
      { id: 'e1', amount: 42, categoryId: 'cat1', date: '2024-01-31', notes: '', month: '2024-01', createdAt: 0, updatedAt: 0 },
    ];
    const result = calculateWeeklyStats(expenses, categories, 2024, 1);
    const lastWeek = result[result.length - 1];
    expect(lastWeek.totalSpending).toBe(42);
  });
});
