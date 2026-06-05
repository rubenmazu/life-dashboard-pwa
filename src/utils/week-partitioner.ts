/**
 * Weekly Partitioning Algorithm
 * Requirements 9.1, 9.2, 9.3, 9.4: Partition month into weeks (Monday start),
 * calculate proportional budgets, per-category spending, and percentages.
 */

import type { Expense, ExpenseCategory } from '@/db/schema';

export interface CategoryBreakdownItem {
  categoryId: string;
  categoryName: string;
  amount: number;
  percentage: number;
}

export interface WeekPartition {
  weekNumber: number;         // 1-based
  startDate: string;          // "YYYY-MM-DD"
  endDate: string;            // "YYYY-MM-DD"
  daysInWeek: number;         // can be < 7 for partial weeks
  totalSpending: number;
  proportionalBudget: number;
  isOverBudget: boolean;
  categoryBreakdown: CategoryBreakdownItem[];
}

export interface WeekRange {
  startDate: string;  // "YYYY-MM-DD"
  endDate: string;    // "YYYY-MM-DD"
  daysInWeek: number;
}

/**
 * Returns the ISO day of the week (1 = Monday, 7 = Sunday).
 */
function getISODayOfWeek(year: number, month: number, day: number): number {
  const date = new Date(year, month - 1, day);
  const jsDay = date.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  return jsDay === 0 ? 7 : jsDay;
}

/**
 * Returns the number of days in a given month.
 */
function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/**
 * Formats a date as "YYYY-MM-DD".
 */
function formatDate(year: number, month: number, day: number): string {
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}

/**
 * Partitions a month into week ranges. Weeks start on Monday.
 * Partial weeks at the start/end of the month are their own entries.
 */
export function partitionMonthIntoWeeks(year: number, month: number): WeekRange[] {
  const totalDays = getDaysInMonth(year, month);
  const weeks: WeekRange[] = [];

  let currentDay = 1;

  while (currentDay <= totalDays) {
    const dayOfWeek = getISODayOfWeek(year, month, currentDay);

    // Calculate how many days until Sunday (end of ISO week)
    const daysUntilSunday = 7 - dayOfWeek; // days remaining in this ISO week (0 if Sunday)
    const daysRemaining = totalDays - currentDay; // days remaining in month (0-indexed from currentDay)

    // The week ends either at the end of the ISO week or the end of the month
    const weekLength = Math.min(daysUntilSunday + 1, daysRemaining + 1);

    const startDay = currentDay;
    const endDay = currentDay + weekLength - 1;

    weeks.push({
      startDate: formatDate(year, month, startDay),
      endDate: formatDate(year, month, endDay),
      daysInWeek: weekLength,
    });

    currentDay = endDay + 1;
  }

  return weeks;
}

/**
 * Calculates weekly statistics for a given month including spending totals,
 * proportional budgets, over-budget status, and category breakdowns.
 */
export function calculateWeeklyStats(
  expenses: Expense[],
  categories: ExpenseCategory[],
  year: number,
  month: number
): WeekPartition[] {
  const weeks = partitionMonthIntoWeeks(year, month);
  const totalDays = getDaysInMonth(year, month);

  // Sum of all category budget limits
  const totalBudget = categories.reduce((sum, cat) => sum + cat.budgetLimit, 0);

  // Create a map of categoryId → categoryName for lookup
  const categoryMap = new Map<string, string>();
  for (const cat of categories) {
    if (cat.id) {
      categoryMap.set(cat.id, cat.name);
    }
  }

  return weeks.map((week, index) => {
    // Filter expenses that fall within this week's date range
    const weekExpenses = expenses.filter(
      (exp) => exp.date >= week.startDate && exp.date <= week.endDate
    );

    // Total spending for this week
    const totalSpending = weekExpenses.reduce((sum, exp) => sum + exp.amount, 0);

    // Proportional budget: (totalBudget / daysInMonth) × daysInWeek
    const proportionalBudget = totalDays > 0
      ? (totalBudget / totalDays) * week.daysInWeek
      : 0;

    // Over-budget check
    const isOverBudget = totalSpending > proportionalBudget;

    // Category breakdown
    const categorySpending = new Map<string, number>();
    for (const exp of weekExpenses) {
      const current = categorySpending.get(exp.categoryId) || 0;
      categorySpending.set(exp.categoryId, current + exp.amount);
    }

    // Build category breakdown with percentages
    const categoryBreakdown: CategoryBreakdownItem[] = [];
    for (const [categoryId, amount] of categorySpending.entries()) {
      categoryBreakdown.push({
        categoryId,
        categoryName: categoryMap.get(categoryId) || 'Unknown',
        amount,
        percentage: totalSpending > 0 ? Math.round((amount / totalSpending) * 100) : 0,
      });
    }

    // Adjust percentages to sum to 100 if there are items and totalSpending > 0
    if (categoryBreakdown.length > 0 && totalSpending > 0) {
      const percentageSum = categoryBreakdown.reduce((sum, item) => sum + item.percentage, 0);
      if (percentageSum !== 100) {
        // Find the item with the largest amount and adjust its percentage
        const maxItem = categoryBreakdown.reduce((max, item) =>
          item.amount > max.amount ? item : max
        );
        maxItem.percentage += 100 - percentageSum;
      }
    }

    // Sort breakdown by amount descending for consistent display
    categoryBreakdown.sort((a, b) => b.amount - a.amount);

    return {
      weekNumber: index + 1,
      startDate: week.startDate,
      endDate: week.endDate,
      daysInWeek: week.daysInWeek,
      totalSpending,
      proportionalBudget,
      isOverBudget,
      categoryBreakdown,
    };
  });
}
