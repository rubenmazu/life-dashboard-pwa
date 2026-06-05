import { useLiveQuery } from 'dexie-react-hooks';
import { v4 as uuidv4 } from 'uuid';
import { useProfile } from '@/context/ProfileContext';
import {
  validateCategory,
  validateCategoryName,
  validateBudgetLimit,
} from '@/utils/validators/category.validator';
import { wrapStorageOperation } from '@/utils/storage-error-handler';
import type { ExpenseCategory } from '@/db/schema';

/**
 * Reactive hook for expense category CRUD operations.
 * Uses Dexie liveQuery for reactive reads and wrapStorageOperation for error handling.
 * Requirements: 6.1, 6.2, 6.3, 6.4
 */

export interface UseCategoriesResult {
  categories: ExpenseCategory[];
  isLoading: boolean;
  addCategory: (name: string, budgetLimit: number) => Promise<void>;
  updateCategory: (id: string, name: string, budgetLimit: number) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
}

export function useCategories(): UseCategoriesResult {
  const { db } = useProfile();

  const categories = useLiveQuery(
    async () => {
      if (!db) return [];
      const all = await db.expenseCategories.toArray();
      return all.sort((a, b) =>
        a.name.toLowerCase().localeCompare(b.name.toLowerCase())
      );
    },
    [db],
    [] as ExpenseCategory[]
  );

  const isLoading = categories === undefined;

  const addCategory = async (name: string, budgetLimit: number): Promise<void> => {
    if (!db) throw new Error('Database not available');

    // Validate name format and budget before hitting the DB
    const nameFormatResult = validateCategoryName(name, []);
    if (!nameFormatResult.valid) {
      throw new Error(nameFormatResult.error ?? 'Validation failed');
    }

    const budgetResult = validateBudgetLimit(budgetLimit);
    if (!budgetResult.valid) {
      throw new Error(budgetResult.error ?? 'Validation failed');
    }

    // Check uniqueness against existing names
    const existingNames = (await db.expenseCategories.toArray()).map((c) => c.name);
    const validation = validateCategory(name, budgetLimit, existingNames);
    if (!validation.valid) {
      throw new Error(validation.error ?? 'Validation failed');
    }

    await wrapStorageOperation(async () => {
      const now = Date.now();
      await db.expenseCategories.add({
        id: uuidv4(),
        name,
        budgetLimit,
        createdAt: now,
        updatedAt: now,
      });
    });
  };

  const updateCategory = async (
    id: string,
    name: string,
    budgetLimit: number
  ): Promise<void> => {
    if (!db) throw new Error('Database not available');

    // Validate name format and budget before hitting the DB
    const nameFormatResult = validateCategoryName(name, []);
    if (!nameFormatResult.valid) {
      throw new Error(nameFormatResult.error ?? 'Validation failed');
    }

    const budgetResult = validateBudgetLimit(budgetLimit);
    if (!budgetResult.valid) {
      throw new Error(budgetResult.error ?? 'Validation failed');
    }

    // Exclude the current category's name from duplicate check
    const existingNames = (await db.expenseCategories.toArray())
      .filter((c) => c.id !== id)
      .map((c) => c.name);

    const validation = validateCategory(name, budgetLimit, existingNames);
    if (!validation.valid) {
      throw new Error(validation.error ?? 'Validation failed');
    }

    await wrapStorageOperation(async () => {
      await db.expenseCategories.update(id, {
        name,
        budgetLimit,
        updatedAt: Date.now(),
      });
    });
  };

  const deleteCategory = async (id: string): Promise<void> => {
    if (!db) throw new Error('Database not available');

    await wrapStorageOperation(async () => {
      await db.transaction('rw', db.expenseCategories, db.expenses, async () => {
        // Delete all expenses associated with this category
        await db.expenses.where('categoryId').equals(id).delete();
        // Delete the category itself
        await db.expenseCategories.delete(id);
      });
    });
  };

  return {
    categories: categories ?? [],
    isLoading,
    addCategory,
    updateCategory,
    deleteCategory,
  };
}
