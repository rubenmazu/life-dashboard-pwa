import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { ProfileDatabase } from '@/db/schema';
import { useHabits } from '@/hooks/useHabits';

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

describe('useHabits', () => {
  let db: ProfileDatabase;
  let unmountHook: (() => void) | undefined;
  let testId = 0;

  beforeEach(async () => {
    testId++;
    db = new ProfileDatabase(`test-habits-${testId}-${Date.now()}`);
    mockDb.current = db;
    unmountHook = undefined;

    // Seed group and categories for habit tests
    const now = Date.now();
    await db.habitGroups.add({ id: 'group-1', name: 'Health', order: 0, createdAt: now, updatedAt: now });
    await db.habitCategories.add({ id: 'cat-1', name: 'Exercise', groupId: 'group-1', order: 0, createdAt: now, updatedAt: now });
    await db.habitCategories.add({ id: 'cat-2', name: 'Diet', groupId: 'group-1', order: 1, createdAt: now, updatedAt: now });
  });

  afterEach(async () => {
    unmountHook?.();
    mockDb.current = null;
    // Allow React and liveQuery to flush pending microtasks before closing DB
    await new Promise((r) => setTimeout(r, 0));
    db.close();
    await db.delete();
  });

  function renderHabitsHook() {
    const rendered = renderHook(() => useHabits());
    unmountHook = rendered.unmount;
    return rendered;
  }

  it('returns empty habits when no data exists', async () => {
    const { result } = renderHabitsHook();

    await waitFor(() => {
      expect(result.current.habits).toEqual([]);
      expect(result.current.activeHabits).toEqual([]);
    });
  });

  it('returns all habits sorted by order', async () => {
    const now = Date.now();
    await db.habits.bulkAdd([
      { id: 'h1', name: 'Run', categoryId: 'cat-1', order: 2, isActive: true, createdAt: now, updatedAt: now },
      { id: 'h2', name: 'Swim', categoryId: 'cat-1', order: 0, isActive: true, createdAt: now, updatedAt: now },
      { id: 'h3', name: 'Yoga', categoryId: 'cat-1', order: 1, isActive: true, createdAt: now, updatedAt: now },
    ]);

    const { result } = renderHabitsHook();

    await waitFor(() => {
      expect(result.current.habits).toHaveLength(3);
    });

    expect(result.current.habits[0].name).toBe('Swim');
    expect(result.current.habits[1].name).toBe('Yoga');
    expect(result.current.habits[2].name).toBe('Run');
  });

  it('activeHabits filters out inactive habits', async () => {
    const now = Date.now();
    await db.habits.bulkAdd([
      { id: 'h1', name: 'Run', categoryId: 'cat-1', order: 0, isActive: true, createdAt: now, updatedAt: now },
      { id: 'h2', name: 'Swim', categoryId: 'cat-1', order: 1, isActive: false, createdAt: now, updatedAt: now },
      { id: 'h3', name: 'Yoga', categoryId: 'cat-1', order: 2, isActive: true, createdAt: now, updatedAt: now },
    ]);

    const { result } = renderHabitsHook();

    await waitFor(() => {
      expect(result.current.habits).toHaveLength(3);
    });

    expect(result.current.activeHabits).toHaveLength(2);
    expect(result.current.activeHabits.map((h) => h.name)).toEqual(['Run', 'Yoga']);
  });

  it('addHabit creates a habit with correct fields', async () => {
    const { result } = renderHabitsHook();

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    let id: string;
    await act(async () => {
      id = await result.current.addHabit('Morning Run', 'cat-1');
    });

    await waitFor(() => {
      expect(result.current.habits).toHaveLength(1);
    });

    const habit = result.current.habits[0];
    expect(habit.name).toBe('Morning Run');
    expect(habit.categoryId).toBe('cat-1');
    expect(habit.order).toBe(0);
    expect(habit.isActive).toBe(true);
    expect(habit.id).toBe(id!);
  });

  it('addHabit throws on empty name', async () => {
    const { result } = renderHabitsHook();

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await expect(
      act(async () => {
        await result.current.addHabit('', 'cat-1');
      })
    ).rejects.toThrow('Habit name is required');
  });

  it('addHabit throws on name exceeding 100 characters', async () => {
    const { result } = renderHabitsHook();

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const longName = 'a'.repeat(101);
    await expect(
      act(async () => {
        await result.current.addHabit(longName, 'cat-1');
      })
    ).rejects.toThrow('Habit name must be at most 100 characters');
  });

  it('addHabit throws when category does not exist', async () => {
    const { result } = renderHabitsHook();

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await expect(
      act(async () => {
        await result.current.addHabit('Test', 'nonexistent');
      })
    ).rejects.toThrow('Category not found');
  });

  it('updateHabit modifies name and category', async () => {
    const now = Date.now();
    await db.habits.add({
      id: 'h1', name: 'Old Run', categoryId: 'cat-1', order: 0, isActive: true, createdAt: now, updatedAt: now,
    });

    const { result } = renderHabitsHook();

    await waitFor(() => {
      expect(result.current.habits).toHaveLength(1);
    });

    await act(async () => {
      await result.current.updateHabit('h1', 'Evening Swim', 'cat-2');
    });

    await waitFor(() => {
      expect(result.current.habits[0].name).toBe('Evening Swim');
    });

    expect(result.current.habits[0].categoryId).toBe('cat-2');
  });

  it('deleteHabit soft-deletes by setting isActive to false', async () => {
    const now = Date.now();
    await db.habits.add({
      id: 'h1', name: 'Run', categoryId: 'cat-1', order: 0, isActive: true, createdAt: now, updatedAt: now,
    });

    const { result } = renderHabitsHook();

    await waitFor(() => {
      expect(result.current.activeHabits).toHaveLength(1);
    });

    await act(async () => {
      await result.current.deleteHabit('h1');
    });

    await waitFor(() => {
      expect(result.current.activeHabits).toHaveLength(0);
    });

    // Habit still exists in the database (soft-deleted)
    expect(result.current.habits).toHaveLength(1);
    expect(result.current.habits[0].isActive).toBe(false);
  });

  it('moveHabit changes categoryId', async () => {
    const now = Date.now();
    await db.habits.add({
      id: 'h1', name: 'Run', categoryId: 'cat-1', order: 0, isActive: true, createdAt: now, updatedAt: now,
    });

    const { result } = renderHabitsHook();

    await waitFor(() => {
      expect(result.current.habits).toHaveLength(1);
    });

    await act(async () => {
      await result.current.moveHabit('h1', 'cat-2');
    });

    await waitFor(() => {
      expect(result.current.habits[0].categoryId).toBe('cat-2');
    });
  });

  it('moveHabit throws when target category does not exist', async () => {
    const now = Date.now();
    await db.habits.add({
      id: 'h1', name: 'Run', categoryId: 'cat-1', order: 0, isActive: true, createdAt: now, updatedAt: now,
    });

    const { result } = renderHabitsHook();

    await waitFor(() => {
      expect(result.current.habits).toHaveLength(1);
    });

    await expect(
      act(async () => {
        await result.current.moveHabit('h1', 'nonexistent');
      })
    ).rejects.toThrow('Target category not found');
  });

  it('reorderHabits updates order values based on array position', async () => {
    const now = Date.now();
    await db.habits.bulkAdd([
      { id: 'h1', name: 'Run', categoryId: 'cat-1', order: 0, isActive: true, createdAt: now, updatedAt: now },
      { id: 'h2', name: 'Swim', categoryId: 'cat-1', order: 1, isActive: true, createdAt: now, updatedAt: now },
      { id: 'h3', name: 'Yoga', categoryId: 'cat-1', order: 2, isActive: true, createdAt: now, updatedAt: now },
    ]);

    const { result } = renderHabitsHook();

    await waitFor(() => {
      expect(result.current.habits).toHaveLength(3);
    });

    // Reverse the order
    await act(async () => {
      await result.current.reorderHabits(['h3', 'h2', 'h1']);
    });

    await waitFor(() => {
      expect(result.current.habits[0].name).toBe('Yoga');
    });

    expect(result.current.habits[0].order).toBe(0);
    expect(result.current.habits[1].order).toBe(1);
    expect(result.current.habits[2].order).toBe(2);
  });

  it('throws when no active database', async () => {
    mockDb.current = null;

    const { result } = renderHabitsHook();

    await expect(
      act(async () => {
        await result.current.addHabit('Test', 'cat-1');
      })
    ).rejects.toThrow('No active profile database');
  });
});
