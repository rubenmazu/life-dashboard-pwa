import { useLiveQuery } from 'dexie-react-hooks';
import { useProfile } from '@/context/ProfileContext';
import { validateIncomeEntry } from '@/utils/validators/income.validator';
import { wrapStorageOperation } from '@/utils/storage-error-handler';
import type { IncomeEntry } from '@/db/schema';

/**
 * Converts a string ID to the appropriate Dexie key type.
 * Dexie's ++id auto-increment produces numeric keys, but the app
 * passes IDs around as strings. This ensures the correct key type is used.
 */
function parseKeyId(id: string): number | string {
  const num = Number(id);
  return Number.isFinite(num) && String(num) === id ? num : id;
}

/**
 * Hook for managing income entries for a given month.
 * Provides reactive data via Dexie's useLiveQuery (auto-updates on DB changes)
 * and CRUD operations wrapped with storage error handling.
 *
 * Requirements: 5.1, 5.2, 5.3, 5.4
 */

export interface UseIncomeResult {
  incomeEntries: IncomeEntry[];
  monthlyTotal: number;
  isLoading: boolean;
  addIncome: (amount: number, source: string) => Promise<void>;
  updateIncome: (id: string, amount: number, source: string) => Promise<void>;
  deleteIncome: (id: string) => Promise<void>;
}

export function useIncome(month: string): UseIncomeResult {
  const { db } = useProfile();

  const incomeEntries = useLiveQuery(
    () => {
      if (!db) return [];
      return db.incomeEntries.where('month').equals(month).toArray();
    },
    [db, month],
    []
  );

  const isLoading = incomeEntries === undefined;
  const entries: IncomeEntry[] = incomeEntries ?? [];

  const monthlyTotal = entries.reduce((sum, entry) => sum + entry.amount, 0);

  const addIncome = async (amount: number, source: string): Promise<void> => {
    if (!db) {
      throw new Error('No active profile database');
    }

    const validation = validateIncomeEntry(amount, source);
    if (!validation.valid) {
      throw new Error(validation.error ?? 'Invalid income entry');
    }

    await wrapStorageOperation(() =>
      db.incomeEntries.add({
        amount,
        source,
        month,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })
    );
  };

  const updateIncome = async (id: string, amount: number, source: string): Promise<void> => {
    if (!db) {
      throw new Error('No active profile database');
    }

    const validation = validateIncomeEntry(amount, source);
    if (!validation.valid) {
      throw new Error(validation.error ?? 'Invalid income entry');
    }

    const key = parseKeyId(id);
    await wrapStorageOperation(() =>
      db.incomeEntries.update(key, {
        amount,
        source,
        updatedAt: Date.now(),
      })
    );
  };

  const deleteIncome = async (id: string): Promise<void> => {
    if (!db) {
      throw new Error('No active profile database');
    }

    const key = parseKeyId(id);
    await wrapStorageOperation(() => db.incomeEntries.delete(key));
  };

  return {
    incomeEntries: entries,
    monthlyTotal,
    isLoading,
    addIncome,
    updateIncome,
    deleteIncome,
  };
}
