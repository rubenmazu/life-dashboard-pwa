import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { ProfileDatabase } from '@/db/schema';
import { useHabitCategories } from '@/hooks/useHabitCategories';

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

describe('useHabitCategories', () => {
  let db: ProfileDatabase;
  let unmountHook: (() => void) | undefined;
  let testId = 0;

  beforeEach(async () => {
    testId++;
    db = new ProfileDatabase(`test-habit-categories-${testId}-${Date.now()}`);
    mockDb.current = db;
    unmountHook = undefined;

    // Seed groups for category tests
    const now = Date.now();
    await db.habitGroups.add({ id: 'group-1', name: 'Health', order: 0, createdAt: now, updatedAt: now });
    await db.habitGroups.add({ id: 'group-2', name: 'Work', order: 1, createdAt: now, updatedAt: now });
  });

  afterEach(async () => {
    unmountHook?.();
    mockDb.current = null;
    // Allow React and liveQuery to flush pending microtasks before closing DB
    await new Promise((r) => setTimeout(r, 10));
    db.close();
    await db.delete();
  });

  function renderCategoriesHook() {
    const rendered = renderHook(() => useHabitCategories());
    unmountHook = rendered.unmount;
    return rendered;
  }

  it('returns empty categories when no data exists', async () => {
    const { result } = renderCategoriesHook();

    await waitFor(() => {
      expect(result.current.categories).toEqual([]);
    });
  });

  it('returns categories sorted by order', async () => {
    const now = Date.now();
    await db.habitCategories.bulkAdd([
      { id: 'c1', name: 'Exercise', groupId: 'group-1', order: 2, createdAt: now, updatedAt: now },
      { id: 'c2', name: 'Diet', groupId: 'group-1', order: 0, createdAt: now, updatedAt: now },
      { id: 'c3', name: 'Sleep', groupId: 'group-1', order: 1, createdAt: now, updatedAt: now },
    ]);

    const { result } = renderCategoriesHook();

    await waitFor(() => {
      expect(result.current.categories).toHaveLength(3);
    });

    expect(result.current.categories[0].name).toBe('Diet');
    expect(result.current.categories[1].name).toBe('Sleep');
    expect(result.current.categories[2].name).toBe('Exercise');
  });

  it('addCategory creates a category with correct fields', async () => {
    const { result } = renderCategoriesHook();

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    let id: string;
    await act(async () => {
      id = await result.current.addCategory('Exercise', 'group-1');
    });

    await waitFor(() => {
      expect(result.current.categories).toHaveLength(1);
    });

    const cat = result.current.categories[0];
    expect(cat.name).toBe('Exercise');
    expect(cat.groupId).toBe('group-1');
    expect(cat.order).toBe(0);
    expect(cat.id).toBe(id!);
  });

  it('addCategory throws on empty name', async () => {
    const { result } = renderCategoriesHook();

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await expect(
      act(async () => {
        await result.current.addCategory('', 'group-1');
      })
    ).rejects.toThrow('Category name is required');
  });

  it('addCategory throws on duplicate name within same group', async () => {
    const now = Date.now();
    await db.habitCategories.add({
      id: 'c1', name: 'Exercise', groupId: 'group-1', order: 0, createdAt: now, updatedAt: now,
    });

    const { result } = renderCategoriesHook();

    await waitFor(() => {
      expect(result.current.categories).toHaveLength(1);
    });

    await expect(
      act(async () => {
        await result.current.addCategory('exercise', 'group-1');
      })
    ).rejects.toThrow('A category with this name already exists in this group');
  });

  it('addCategory allows same name in different groups', async () => {
    const now = Date.now();
    await db.habitCategories.add({
      id: 'c1', name: 'Tasks', groupId: 'group-1', order: 0, createdAt: now, updatedAt: now,
    });

    const { result } = renderCategoriesHook();

    await waitFor(() => {
      expect(result.current.categories).toHaveLength(1);
    });

    await act(async () => {
      await result.current.addCategory('Tasks', 'group-2');
    });

    await waitFor(() => {
      expect(result.current.categories).toHaveLength(2);
    });
  });

  it('addCategory throws when group does not exist', async () => {
    const { result } = renderCategoriesHook();

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await expect(
      act(async () => {
        await result.current.addCategory('Test', 'nonexistent-group');
      })
    ).rejects.toThrow('Group not found');
  });

  it('updateCategory modifies the category name', async () => {
    const now = Date.now();
    await db.habitCategories.add({
      id: 'c1', name: 'Old Name', groupId: 'group-1', order: 0, createdAt: now, updatedAt: now,
    });

    const { result } = renderCategoriesHook();

    await waitFor(() => {
      expect(result.current.categories).toHaveLength(1);
    });

    await act(async () => {
      await result.current.updateCategory('c1', 'New Name');
    });

    await waitFor(() => {
      expect(result.current.categories[0].name).toBe('New Name');
    });
  });

  it('updateCategory throws on duplicate name within same group', async () => {
    const now = Date.now();
    await db.habitCategories.bulkAdd([
      { id: 'c1', name: 'Exercise', groupId: 'group-1', order: 0, createdAt: now, updatedAt: now },
      { id: 'c2', name: 'Diet', groupId: 'group-1', order: 1, createdAt: now, updatedAt: now },
    ]);

    const { result } = renderCategoriesHook();

    await waitFor(() => {
      expect(result.current.categories).toHaveLength(2);
    });

    await expect(
      act(async () => {
        await result.current.updateCategory('c1', 'Diet');
      })
    ).rejects.toThrow('A category with this name already exists in this group');
  });

  it('deleteCategory removes the category and its habits', async () => {
    const now = Date.now();
    await db.habitCategories.add({
      id: 'c1', name: 'Exercise', groupId: 'group-1', order: 0, createdAt: now, updatedAt: now,
    });
    await db.habits.bulkAdd([
      { id: 'h1', name: 'Run', categoryId: 'c1', order: 0, isActive: true, createdAt: now, updatedAt: now },
      { id: 'h2', name: 'Swim', categoryId: 'c1', order: 1, isActive: true, createdAt: now, updatedAt: now },
    ]);

    const { result } = renderCategoriesHook();

    await waitFor(() => {
      expect(result.current.categories).toHaveLength(1);
    });

    await act(async () => {
      await result.current.deleteCategory('c1');
    });

    await waitFor(() => {
      expect(result.current.categories).toHaveLength(0);
    });

    const remainingHabits = await db.habits.toArray();
    expect(remainingHabits).toHaveLength(0);
  });

  it('moveCategory changes groupId and order', async () => {
    const now = Date.now();
    await db.habitCategories.add({
      id: 'c1', name: 'Exercise', groupId: 'group-1', order: 0, createdAt: now, updatedAt: now,
    });

    const { result } = renderCategoriesHook();

    await waitFor(() => {
      expect(result.current.categories).toHaveLength(1);
    });

    await act(async () => {
      await result.current.moveCategory('c1', 'group-2');
    });

    await waitFor(() => {
      expect(result.current.categories[0].groupId).toBe('group-2');
    });
  });

  it('moveCategory throws when target group does not exist', async () => {
    const now = Date.now();
    await db.habitCategories.add({
      id: 'c1', name: 'Exercise', groupId: 'group-1', order: 0, createdAt: now, updatedAt: now,
    });

    const { result } = renderCategoriesHook();

    await waitFor(() => {
      expect(result.current.categories).toHaveLength(1);
    });

    await expect(
      act(async () => {
        await result.current.moveCategory('c1', 'nonexistent');
      })
    ).rejects.toThrow('Target group not found');
  });

  it('moveCategory throws on duplicate name in target group', async () => {
    const now = Date.now();
    await db.habitCategories.bulkAdd([
      { id: 'c1', name: 'Exercise', groupId: 'group-1', order: 0, createdAt: now, updatedAt: now },
      { id: 'c2', name: 'Exercise', groupId: 'group-2', order: 0, createdAt: now, updatedAt: now },
    ]);

    const { result } = renderCategoriesHook();

    await waitFor(() => {
      expect(result.current.categories).toHaveLength(2);
    });

    await expect(
      act(async () => {
        await result.current.moveCategory('c1', 'group-2');
      })
    ).rejects.toThrow('A category with this name already exists in this group');
  });

  it('throws when no active database', async () => {
    mockDb.current = null;

    const { result } = renderCategoriesHook();

    await expect(
      act(async () => {
        await result.current.addCategory('Test', 'group-1');
      })
    ).rejects.toThrow('No active profile database');
  });
});
