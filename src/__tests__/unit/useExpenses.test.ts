import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { ProfileDatabase } from '@/db/schema';
import { useExpenses } from '@/hooks/useExpenses';

// Mock the ProfileContext to provide a test database
const mockDb: { current: ProfileDatabase | null } = { current: null };

vi.mock('@/context/ProfileContext', () => ({
  useProfile: () => ({
    activeProfileId: 'test-profile',
    isAuthenticated: true,
    db: mockDb.current,
    setActiveProfile: vi.fn(),
    clearActiveProfile: vi.fn(),
  }),
}));

describe('useExpenses', () => {
  let db: ProfileDatabase;

  beforeEach(async () => {
    db = new ProfileDatabase('test-expenses-hook');
    mockDb.current = db;

    // Seed a category for validation purposes
    const now = Date.now();
    await db.expenseCategories.add({
      id: 'cat-1',
      name: 'Food',
      budgetLimit: 500,
      createdAt: now,
      updatedAt: now,
    });
  });

  afterEach(async () => {
    db.close();
    await db.delete();
    mockDb.current = null;
  });

  it('returns empty expenses for a month with no data', async () => {
    const { result } = renderHook(() => useExpenses('2024-06'));

    await waitFor(() => {
      expect(result.current.expenses).toEqual([]);
    });

    expect(result.current.isLoading).toBe(false);
  });

  it('returns expenses filtered by the specified month', async () => {
    const now = Date.now();
    await db.expenses.bulkAdd([
      { id: 'e1', amount: 50, categoryId: 'cat-1', date: '2024-06-15', notes: 'Lunch', month: '2024-06', createdAt: now, updatedAt: now },
      { id: 'e2', amount: 30, categoryId: 'cat-1', date: '2024-06-10', notes: 'Snack', month: '2024-06', createdAt: now, updatedAt: now },
      { id: 'e3', amount: 100, categoryId: 'cat-1', date: '2024-07-01', notes: 'Dinner', month: '2024-07', createdAt: now, updatedAt: now },
    ]);

    const { result } = renderHook(() => useExpenses('2024-06'));

    await waitFor(() => {
      expect(result.current.expenses).toHaveLength(2);
    });
  });

  it('sorts expenses by date descending', async () => {
    const now = Date.now();
    await db.expenses.bulkAdd([
      { id: 'e1', amount: 50, categoryId: 'cat-1', date: '2024-06-10', notes: 'Earlier', month: '2024-06', createdAt: now, updatedAt: now },
      { id: 'e2', amount: 30, categoryId: 'cat-1', date: '2024-06-20', notes: 'Later', month: '2024-06', createdAt: now, updatedAt: now },
    ]);

    const { result } = renderHook(() => useExpenses('2024-06'));

    await waitFor(() => {
      expect(result.current.expenses).toHaveLength(2);
    });

    expect(result.current.expenses[0].date).toBe('2024-06-20');
    expect(result.current.expenses[1].date).toBe('2024-06-10');
  });

  it('addExpense creates a new expense with derived month', async () => {
    // Use a past date to avoid future-date validation failure
    const { result } = renderHook(() => useExpenses('2024-01'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.addExpense(25.50, 'cat-1', '2024-01-15', 'Coffee');
    });

    await waitFor(() => {
      expect(result.current.expenses).toHaveLength(1);
    });

    const expense = result.current.expenses[0];
    expect(expense.amount).toBe(25.50);
    expect(expense.categoryId).toBe('cat-1');
    expect(expense.date).toBe('2024-01-15');
    expect(expense.notes).toBe('Coffee');
    expect(expense.month).toBe('2024-01');
    expect(expense.createdAt).toBeGreaterThan(0);
    expect(expense.updatedAt).toBeGreaterThan(0);
  });

  it('addExpense auto-fills date with today when empty', async () => {
    const today = new Date().toISOString().substring(0, 10);
    const currentMonth = today.substring(0, 7);

    const { result } = renderHook(() => useExpenses(currentMonth));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.addExpense(10, 'cat-1', '', 'Auto date');
    });

    await waitFor(() => {
      expect(result.current.expenses).toHaveLength(1);
    });

    expect(result.current.expenses[0].date).toBe(today);
    expect(result.current.expenses[0].month).toBe(currentMonth);
  });

  it('addExpense throws on invalid amount', async () => {
    const { result } = renderHook(() => useExpenses('2024-06'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await expect(
      act(async () => {
        await result.current.addExpense(0, 'cat-1', '2024-06-15', '');
      })
    ).rejects.toThrow('Amount must be between 0.01 and 9,999,999.99');
  });

  it('addExpense throws on invalid category', async () => {
    const { result } = renderHook(() => useExpenses('2024-06'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await expect(
      act(async () => {
        await result.current.addExpense(10, 'nonexistent-cat', '2024-06-15', '');
      })
    ).rejects.toThrow('Please select a category');
  });

  it('updateExpense modifies an existing expense', async () => {
    const now = Date.now();
    await db.expenses.add({
      id: 'e1',
      amount: 50,
      categoryId: 'cat-1',
      date: '2024-01-10',
      notes: 'Original',
      month: '2024-01',
      createdAt: now,
      updatedAt: now,
    });

    const { result } = renderHook(() => useExpenses('2024-01'));

    await waitFor(() => {
      expect(result.current.expenses).toHaveLength(1);
    });

    await act(async () => {
      await result.current.updateExpense('e1', 75, 'cat-1', '2024-01-12', 'Updated');
    });

    await waitFor(() => {
      expect(result.current.expenses[0].amount).toBe(75);
    });

    expect(result.current.expenses[0].notes).toBe('Updated');
    expect(result.current.expenses[0].date).toBe('2024-01-12');
    expect(result.current.expenses[0].updatedAt).toBeGreaterThanOrEqual(now);
  });

  it('updateExpense throws on invalid data', async () => {
    const now = Date.now();
    await db.expenses.add({
      id: 'e1',
      amount: 50,
      categoryId: 'cat-1',
      date: '2024-01-10',
      notes: '',
      month: '2024-01',
      createdAt: now,
      updatedAt: now,
    });

    const { result } = renderHook(() => useExpenses('2024-01'));

    await waitFor(() => {
      expect(result.current.expenses).toHaveLength(1);
    });

    await expect(
      act(async () => {
        await result.current.updateExpense('e1', -5, 'cat-1', '2024-01-10', '');
      })
    ).rejects.toThrow('Amount must be between 0.01 and 9,999,999.99');
  });

  it('deleteExpense removes the entry', async () => {
    const now = Date.now();
    await db.expenses.add({
      id: 'e1',
      amount: 50,
      categoryId: 'cat-1',
      date: '2024-06-15',
      notes: 'To delete',
      month: '2024-06',
      createdAt: now,
      updatedAt: now,
    });

    const { result } = renderHook(() => useExpenses('2024-06'));

    await waitFor(() => {
      expect(result.current.expenses).toHaveLength(1);
    });

    await act(async () => {
      await result.current.deleteExpense('e1');
    });

    await waitFor(() => {
      expect(result.current.expenses).toHaveLength(0);
    });
  });

  it('throws when no active database', async () => {
    mockDb.current = null;

    const { result } = renderHook(() => useExpenses('2024-06'));

    await expect(
      act(async () => {
        await result.current.addExpense(10, 'cat-1', '2024-06-15', '');
      })
    ).rejects.toThrow('Database not available');
  });
});
