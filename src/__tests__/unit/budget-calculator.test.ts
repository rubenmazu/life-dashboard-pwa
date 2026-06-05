import { describe, it, expect } from 'vitest';
import {
  calculateCategorySpending,
  calculateMonthSummary,
} from '../../utils/budget-calculator';
import type { Expense, ExpenseCategory, IncomeEntry } from '../../db/schema';

describe('budget-calculator', () => {
  describe('calculateCategorySpending', () => {
    const now = Date.now();

    const makeCategory = (
      id: string,
      name: string,
      budgetLimit: number
    ): ExpenseCategory => ({
      id,
      name,
      budgetLimit,
      createdAt: now,
      updatedAt: now,
    });

    const makeExpense = (
      categoryId: string,
      amount: number
    ): Expense => ({
      id: `exp-${Math.random()}`,
      amount,
      categoryId,
      date: '2025-01-15',
      notes: '',
      month: '2025-01',
      createdAt: now,
      updatedAt: now,
    });

    it('returns empty array when no categories exist', () => {
      const result = calculateCategorySpending([], []);
      expect(result).toEqual([]);
    });

    it('returns zero spending for categories with no expenses', () => {
      const categories = [makeCategory('cat-1', 'Food', 500)];
      const result = calculateCategorySpending([], categories);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        categoryId: 'cat-1',
        categoryName: 'Food',
        budgetLimit: 500,
        totalSpent: 0,
        remaining: 500,
        percentUsed: 0,
        isOverBudget: false,
      });
    });

    it('groups expenses by category and sums amounts', () => {
      const categories = [
        makeCategory('cat-1', 'Food', 500),
        makeCategory('cat-2', 'Transport', 200),
      ];
      const expenses = [
        makeExpense('cat-1', 100),
        makeExpense('cat-1', 150),
        makeExpense('cat-2', 50),
      ];

      const result = calculateCategorySpending(expenses, categories);

      expect(result).toHaveLength(2);
      expect(result[0].totalSpent).toBe(250);
      expect(result[1].totalSpent).toBe(50);
    });

    it('calculates remaining budget correctly', () => {
      const categories = [makeCategory('cat-1', 'Food', 500)];
      const expenses = [makeExpense('cat-1', 200)];

      const result = calculateCategorySpending(expenses, categories);

      expect(result[0].remaining).toBe(300);
    });

    it('calculates percentUsed correctly', () => {
      const categories = [makeCategory('cat-1', 'Food', 200)];
      const expenses = [makeExpense('cat-1', 50)];

      const result = calculateCategorySpending(expenses, categories);

      expect(result[0].percentUsed).toBe(25);
    });

    it('percentUsed can exceed 100 when over budget', () => {
      const categories = [makeCategory('cat-1', 'Food', 100)];
      const expenses = [makeExpense('cat-1', 150)];

      const result = calculateCategorySpending(expenses, categories);

      expect(result[0].percentUsed).toBe(150);
    });

    it('marks isOverBudget when spending exceeds budgetLimit', () => {
      const categories = [makeCategory('cat-1', 'Food', 100)];
      const expenses = [
        makeExpense('cat-1', 60),
        makeExpense('cat-1', 50),
      ];

      const result = calculateCategorySpending(expenses, categories);

      expect(result[0].isOverBudget).toBe(true);
      expect(result[0].totalSpent).toBe(110);
      expect(result[0].remaining).toBe(-10);
    });

    it('isOverBudget is false when spending equals budgetLimit', () => {
      const categories = [makeCategory('cat-1', 'Food', 100)];
      const expenses = [makeExpense('cat-1', 100)];

      const result = calculateCategorySpending(expenses, categories);

      expect(result[0].isOverBudget).toBe(false);
      expect(result[0].percentUsed).toBe(100);
    });

    it('handles expenses with categories not in the categories list', () => {
      const categories = [makeCategory('cat-1', 'Food', 500)];
      const expenses = [
        makeExpense('cat-1', 100),
        makeExpense('cat-unknown', 200),
      ];

      const result = calculateCategorySpending(expenses, categories);

      // Only known categories appear in results
      expect(result).toHaveLength(1);
      expect(result[0].totalSpent).toBe(100);
    });

    it('handles zero budgetLimit without division errors', () => {
      const categories = [makeCategory('cat-1', 'Food', 0)];
      const expenses = [makeExpense('cat-1', 50)];

      const result = calculateCategorySpending(expenses, categories);

      expect(result[0].percentUsed).toBe(0);
      expect(result[0].isOverBudget).toBe(true);
    });
  });

  describe('calculateMonthSummary', () => {
    const now = Date.now();

    const makeIncome = (amount: number): IncomeEntry => ({
      id: `inc-${Math.random()}`,
      amount,
      source: 'Salary',
      month: '2025-01',
      createdAt: now,
      updatedAt: now,
    });

    const makeExpense = (amount: number): Expense => ({
      id: `exp-${Math.random()}`,
      amount,
      categoryId: 'cat-1',
      date: '2025-01-15',
      notes: '',
      month: '2025-01',
      createdAt: now,
      updatedAt: now,
    });

    it('returns zeros when no entries exist', () => {
      const result = calculateMonthSummary([], []);

      expect(result).toEqual({
        totalIncome: 0,
        totalExpenses: 0,
        remainingBalance: 0,
      });
    });

    it('sums all income entries', () => {
      const income = [makeIncome(3000), makeIncome(500)];
      const result = calculateMonthSummary(income, []);

      expect(result.totalIncome).toBe(3500);
    });

    it('sums all expenses', () => {
      const expenses = [makeExpense(100), makeExpense(250), makeExpense(75)];
      const result = calculateMonthSummary([], expenses);

      expect(result.totalExpenses).toBe(425);
    });

    it('calculates remainingBalance as income minus expenses', () => {
      const income = [makeIncome(3000)];
      const expenses = [makeExpense(800), makeExpense(1200)];

      const result = calculateMonthSummary(income, expenses);

      expect(result.totalIncome).toBe(3000);
      expect(result.totalExpenses).toBe(2000);
      expect(result.remainingBalance).toBe(1000);
    });

    it('remainingBalance can be negative when expenses exceed income', () => {
      const income = [makeIncome(500)];
      const expenses = [makeExpense(800)];

      const result = calculateMonthSummary(income, expenses);

      expect(result.remainingBalance).toBe(-300);
    });

    it('handles single income entry and single expense', () => {
      const income = [makeIncome(2000)];
      const expenses = [makeExpense(150)];

      const result = calculateMonthSummary(income, expenses);

      expect(result.totalIncome).toBe(2000);
      expect(result.totalExpenses).toBe(150);
      expect(result.remainingBalance).toBe(1850);
    });
  });
});
