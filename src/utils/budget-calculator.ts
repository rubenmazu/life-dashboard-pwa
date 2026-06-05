import type { Expense, ExpenseCategory, IncomeEntry } from '@/db/schema';

/**
 * Budget calculation utilities for the Finance Dashboard.
 * Provides functions to compute category-level spending summaries
 * and monthly income/expense summaries.
 *
 * Requirements: 8.1, 8.2, 8.3, 8.4
 */

export interface CategorySpending {
  categoryId: string;
  categoryName: string;
  budgetLimit: number;
  totalSpent: number;
  remaining: number;
  percentUsed: number; // 0-100+
  isOverBudget: boolean;
}

export interface MonthSummary {
  totalIncome: number;
  totalExpenses: number;
  remainingBalance: number;
}

/**
 * Groups expenses by category and calculates spending metrics for each.
 *
 * For each category:
 * - totalSpent = sum of all expense amounts in that category
 * - remaining = budgetLimit - totalSpent
 * - percentUsed = (totalSpent / budgetLimit) * 100
 * - isOverBudget = totalSpent > budgetLimit
 *
 * Categories with no expenses will still appear with totalSpent = 0.
 */
export function calculateCategorySpending(
  expenses: Expense[],
  categories: ExpenseCategory[]
): CategorySpending[] {
  // Build a map of categoryId -> total spent
  const spendingMap = new Map<string, number>();

  for (const expense of expenses) {
    const current = spendingMap.get(expense.categoryId) ?? 0;
    spendingMap.set(expense.categoryId, current + expense.amount);
  }

  return categories.map((category) => {
    const categoryId = category.id ?? '';
    const totalSpent = spendingMap.get(categoryId) ?? 0;
    const budgetLimit = category.budgetLimit;
    const remaining = budgetLimit - totalSpent;
    const percentUsed = budgetLimit > 0 ? (totalSpent / budgetLimit) * 100 : 0;
    const isOverBudget = totalSpent > budgetLimit;

    return {
      categoryId,
      categoryName: category.name,
      budgetLimit,
      totalSpent,
      remaining,
      percentUsed,
      isOverBudget,
    };
  });
}

/**
 * Calculates the monthly financial summary.
 *
 * - totalIncome = sum of all income entry amounts
 * - totalExpenses = sum of all expense amounts
 * - remainingBalance = totalIncome - totalExpenses
 */
export function calculateMonthSummary(
  incomeEntries: IncomeEntry[],
  expenses: Expense[]
): MonthSummary {
  const totalIncome = incomeEntries.reduce((sum, entry) => sum + entry.amount, 0);
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const remainingBalance = totalIncome - totalExpenses;

  return {
    totalIncome,
    totalExpenses,
    remainingBalance,
  };
}
