import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { ProfileDatabase } from '@/db/schema';
import { useCategories } from '@/hooks/useCategories';

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

describe('useCategories', () => {
  let db: ProfileDatabase;

  beforeEach(async () => {
    db = new ProfileDatabase('test-categories-hook');
    mockDb.current = db;
  });

  afterEach(async () => {
    db.close();
    await db.delete();
    mockDb.current = null;
  });

  it('returns empty categories when no data exists', async () => {
    const { result } = renderHook(() => useCategories());

    await waitFor(() => {
      expect(result.current.categories).toEqual([]);
    });
  });

  it('returns categories sorted alphabetically (case-insensitive)', async () => {
    const now = Date.now();
    await db.expenseCategories.bulkAdd([
      { id: '1', name: 'Groceries', budgetLimit: 500, createdAt: now, updatedAt: now },
      { id: '2', name: 'entertainment', budgetLimit: 200, createdAt: now, updatedAt: now },
      { id: '3', name: 'Bills', budgetLimit: 1000, createdAt: now, updatedAt: now },
    ]);

    const { result } = renderHook(() => useCategories());

    await waitFor(() => {
      expect(result.current.categories).toHaveLength(3);
    });

    expect(result.current.categories[0].name).toBe('Bills');
    expect(result.current.categories[1].name).toBe('entertainment');
    expect(result.current.categories[2].name).toBe('Groceries');
  });

  it('addCategory creates a new category with correct fields', async () => {
    const { result } = renderHook(() => useCategories());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.addCategory('Food', 300);
    });

    await waitFor(() => {
      expect(result.current.categories).toHaveLength(1);
    });

    const category = result.current.categories[0];
    expect(category.name).toBe('Food');
    expect(category.budgetLimit).toBe(300);
    expect(category.id).toBeDefined();
    expect(category.createdAt).toBeGreaterThan(0);
    expect(category.updatedAt).toBeGreaterThan(0);
  });

  it('addCategory throws on empty name', async () => {
    const { result, unmount } = renderHook(() => useCategories());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await expect(
      act(async () => {
        await result.current.addCategory('', 100);
      })
    ).rejects.toThrow('Category name is required');

    unmount();
  });

  it('addCategory throws on duplicate name (case-insensitive)', async () => {
    const now = Date.now();
    await db.expenseCategories.add({
      id: '1', name: 'Food', budgetLimit: 300, createdAt: now, updatedAt: now,
    });

    const { result } = renderHook(() => useCategories());

    await waitFor(() => {
      expect(result.current.categories).toHaveLength(1);
    });

    await expect(
      act(async () => {
        await result.current.addCategory('food', 200);
      })
    ).rejects.toThrow('A category with this name already exists');
  });

  it('addCategory throws on invalid budget limit', async () => {
    const { result, unmount } = renderHook(() => useCategories());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await expect(
      act(async () => {
        await result.current.addCategory('Valid Name', 0);
      })
    ).rejects.toThrow('Budget limit must be between 0.01 and 999,999,999.99');

    unmount();
  });

  it('updateCategory modifies name and budget', async () => {
    const now = Date.now();
    await db.expenseCategories.add({
      id: 'cat-1', name: 'Old Name', budgetLimit: 100, createdAt: now, updatedAt: now,
    });

    const { result } = renderHook(() => useCategories());

    await waitFor(() => {
      expect(result.current.categories).toHaveLength(1);
    });

    await act(async () => {
      await result.current.updateCategory('cat-1', 'New Name', 500);
    });

    await waitFor(() => {
      expect(result.current.categories[0].name).toBe('New Name');
    });

    expect(result.current.categories[0].budgetLimit).toBe(500);
    expect(result.current.categories[0].updatedAt).toBeGreaterThanOrEqual(now);
  });

  it('updateCategory allows keeping the same name for the same category', async () => {
    const now = Date.now();
    await db.expenseCategories.add({
      id: 'cat-1', name: 'Food', budgetLimit: 100, createdAt: now, updatedAt: now,
    });

    const { result } = renderHook(() => useCategories());

    await waitFor(() => {
      expect(result.current.categories).toHaveLength(1);
    });

    // Should NOT throw - same category can keep its own name
    await act(async () => {
      await result.current.updateCategory('cat-1', 'Food', 200);
    });

    await waitFor(() => {
      expect(result.current.categories[0].budgetLimit).toBe(200);
    });
  });

  it('updateCategory throws on duplicate name with another category', async () => {
    const now = Date.now();
    await db.expenseCategories.bulkAdd([
      { id: 'cat-1', name: 'Food', budgetLimit: 100, createdAt: now, updatedAt: now },
      { id: 'cat-2', name: 'Transport', budgetLimit: 200, createdAt: now, updatedAt: now },
    ]);

    const { result } = renderHook(() => useCategories());

    await waitFor(() => {
      expect(result.current.categories).toHaveLength(2);
    });

    await expect(
      act(async () => {
        await result.current.updateCategory('cat-1', 'Transport', 150);
      })
    ).rejects.toThrow('A category with this name already exists');
  });

  it('deleteCategory removes the category', async () => {
    const now = Date.now();
    await db.expenseCategories.add({
      id: 'cat-1', name: 'To Delete', budgetLimit: 100, createdAt: now, updatedAt: now,
    });

    const { result } = renderHook(() => useCategories());

    await waitFor(() => {
      expect(result.current.categories).toHaveLength(1);
    });

    await act(async () => {
      await result.current.deleteCategory('cat-1');
    });

    await waitFor(() => {
      expect(result.current.categories).toHaveLength(0);
    });
  });

  it('deleteCategory cascades to remove all associated expenses', async () => {
    const now = Date.now();
    await db.expenseCategories.add({
      id: 'cat-1', name: 'Food', budgetLimit: 500, createdAt: now, updatedAt: now,
    });
    await db.expenses.bulkAdd([
      { id: 'exp-1', amount: 25, categoryId: 'cat-1', date: '2024-06-10', notes: '', month: '2024-06', createdAt: now, updatedAt: now },
      { id: 'exp-2', amount: 50, categoryId: 'cat-1', date: '2024-06-11', notes: '', month: '2024-06', createdAt: now, updatedAt: now },
      { id: 'exp-3', amount: 30, categoryId: 'cat-2', date: '2024-06-12', notes: '', month: '2024-06', createdAt: now, updatedAt: now },
    ]);

    const { result } = renderHook(() => useCategories());

    await waitFor(() => {
      expect(result.current.categories).toHaveLength(1);
    });

    await act(async () => {
      await result.current.deleteCategory('cat-1');
    });

    await waitFor(() => {
      expect(result.current.categories).toHaveLength(0);
    });

    // Verify expenses for cat-1 are gone
    const remainingExpenses = await db.expenses.toArray();
    expect(remainingExpenses).toHaveLength(1);
    expect(remainingExpenses[0].categoryId).toBe('cat-2');
  });

  it('throws when no active database', async () => {
    mockDb.current = null;

    const { result } = renderHook(() => useCategories());

    await expect(
      act(async () => {
        await result.current.addCategory('Test', 100);
      })
    ).rejects.toThrow('Database not available');
  });
});
