import { useLiveQuery } from 'dexie-react-hooks';
import { v4 as uuidv4 } from 'uuid';
import { useProfile } from '@/context/ProfileContext';
import { validateExpense } from '@/utils/validators/expense.validator';
import { wrapStorageOperation } from '@/utils/storage-error-handler';
import type { Expense } from '@/db/schema';

/**
 * Reactive hook for expense CRUD operations filtered by month.
 * Uses Dexie liveQuery for reactive reads sorted by date descending,
 * and wrapStorageOperation for error handling.
 *
 * Requirements: 7.1, 7.2, 7.6, 7.7
 */

export interface UseExpensesResult {
  expenses: Expense[];
  isLoading: boolean;
  addExpense: (amount: number, categoryId: string, date: string, notes: string) => Promise<void>;
  updateExpense: (id: string, amount: number, categoryId: string, date: string, notes: string) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
}

export function useExpenses(month: string): UseExpensesResult {
  const { db } = useProfile();

  const expenses = useLiveQuery(
    async () => {
      if (!db) return [];
      const results = await db.expenses.where('month').equals(month).toArray();
      // Sort by date descending (most recent first)
      return results.sort((a, b) => b.date.localeCompare(a.date));
    },
    [db, month],
    [] as Expense[]
  );

  const isLoading = expenses === undefined;

  const addExpense = async (
    amount: number,
    categoryId: string,
    date: string,
    notes: string
  ): Promise<void> => {
    if (!db) throw new Error('Database not available');

    // Auto-fill date with today if empty
    const effectiveDate = date || new Date().toISOString().substring(0, 10);

    // Derive month from the date
    const derivedMonth = effectiveDate.substring(0, 7);

    // Get valid category IDs for validation
    const validCategoryIds = (await db.expenseCategories.toArray()).map(
      (c) => c.id!
    );

    const validation = validateExpense(
      amount,
      categoryId,
      effectiveDate,
      notes,
      derivedMonth,
      validCategoryIds
    );
    if (!validation.valid) {
      throw new Error(validation.error ?? 'Validation failed');
    }

    await wrapStorageOperation(async () => {
      const now = Date.now();
      await db.expenses.add({
        id: uuidv4(),
        amount,
        categoryId,
        date: effectiveDate,
        notes,
        month: derivedMonth,
        createdAt: now,
        updatedAt: now,
      });
    });
  };

  const updateExpense = async (
    id: string,
    amount: number,
    categoryId: string,
    date: string,
    notes: string
  ): Promise<void> => {
    if (!db) throw new Error('Database not available');

    // Derive month from the date
    const derivedMonth = date.substring(0, 7);

    // Get valid category IDs for validation
    const validCategoryIds = (await db.expenseCategories.toArray()).map(
      (c) => c.id!
    );

    const validation = validateExpense(
      amount,
      categoryId,
      date,
      notes,
      derivedMonth,
      validCategoryIds
    );
    if (!validation.valid) {
      throw new Error(validation.error ?? 'Validation failed');
    }

    await wrapStorageOperation(async () => {
      await db.expenses.update(id, {
        amount,
        categoryId,
        date,
        notes,
        month: derivedMonth,
        updatedAt: Date.now(),
      });
    });
  };

  const deleteExpense = async (id: string): Promise<void> => {
    if (!db) throw new Error('Database not available');

    await wrapStorageOperation(() => db.expenses.delete(id));
  };

  return {
    expenses: expenses ?? [],
    isLoading,
    addExpense,
    updateExpense,
    deleteExpense,
  };
}
