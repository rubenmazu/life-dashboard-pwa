import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { ProfileDatabase } from '@/db/schema';
import { useHabitGroups } from '@/hooks/useHabitGroups';

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

describe('useHabitGroups', () => {
  let db: ProfileDatabase;
  let unmountHook: (() => void) | undefined;
  let testId = 0;

  beforeEach(async () => {
    testId++;
    db = new ProfileDatabase(`test-habit-groups-${testId}-${Date.now()}`);
    mockDb.current = db;
    unmountHook = undefined;
  });

  afterEach(async () => {
    unmountHook?.();
    mockDb.current = null;
    // Allow React and liveQuery to flush pending microtasks before closing DB
    await new Promise((r) => setTimeout(r, 0));
    db.close();
    await db.delete();
  });

  function renderGroupsHook() {
    const rendered = renderHook(() => useHabitGroups());
    unmountHook = rendered.unmount;
    return rendered;
  }

  it('returns empty groups when no data exists', async () => {
    const { result } = renderGroupsHook();

    await waitFor(() => {
      expect(result.current.groups).toEqual([]);
    });
  });

  it('returns groups sorted by order', async () => {
    const now = Date.now();
    await db.habitGroups.bulkAdd([
      { id: 'g1', name: 'Health', order: 2, createdAt: now, updatedAt: now },
      { id: 'g2', name: 'Work', order: 0, createdAt: now, updatedAt: now },
      { id: 'g3', name: 'Personal', order: 1, createdAt: now, updatedAt: now },
    ]);

    const { result } = renderGroupsHook();

    await waitFor(() => {
      expect(result.current.groups).toHaveLength(3);
    });

    expect(result.current.groups[0].name).toBe('Work');
    expect(result.current.groups[1].name).toBe('Personal');
    expect(result.current.groups[2].name).toBe('Health');
  });

  it('addGroup creates a group with correct fields', async () => {
    const { result } = renderGroupsHook();

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    let id: string;
    await act(async () => {
      id = await result.current.addGroup('Morning Routine');
    });

    await waitFor(() => {
      expect(result.current.groups).toHaveLength(1);
    });

    const group = result.current.groups[0];
    expect(group.name).toBe('Morning Routine');
    expect(group.order).toBe(0);
    expect(group.id).toBe(id!);
    expect(group.createdAt).toBeGreaterThan(0);
  });

  it('addGroup assigns sequential order values', async () => {
    const { result } = renderGroupsHook();

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.addGroup('First');
    });
    await act(async () => {
      await result.current.addGroup('Second');
    });

    await waitFor(() => {
      expect(result.current.groups).toHaveLength(2);
    });

    expect(result.current.groups[0].order).toBe(0);
    expect(result.current.groups[1].order).toBe(1);
  });

  it('addGroup throws on empty name', async () => {
    const { result } = renderGroupsHook();

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await expect(
      act(async () => {
        await result.current.addGroup('');
      })
    ).rejects.toThrow('Group name is required');
  });

  it('addGroup throws on duplicate name (case-insensitive)', async () => {
    const now = Date.now();
    await db.habitGroups.add({ id: 'g1', name: 'Health', order: 0, createdAt: now, updatedAt: now });

    const { result } = renderGroupsHook();

    await waitFor(() => {
      expect(result.current.groups).toHaveLength(1);
    });

    await expect(
      act(async () => {
        await result.current.addGroup('health');
      })
    ).rejects.toThrow('A group with this name already exists');
  });

  it('updateGroup modifies the group name', async () => {
    const now = Date.now();
    await db.habitGroups.add({ id: 'g1', name: 'Old Name', order: 0, createdAt: now, updatedAt: now });

    const { result } = renderGroupsHook();

    await waitFor(() => {
      expect(result.current.groups).toHaveLength(1);
    });

    await act(async () => {
      await result.current.updateGroup('g1', 'New Name');
    });

    await waitFor(() => {
      expect(result.current.groups[0].name).toBe('New Name');
    });
  });

  it('updateGroup allows keeping the same name', async () => {
    const now = Date.now();
    await db.habitGroups.add({ id: 'g1', name: 'Health', order: 0, createdAt: now, updatedAt: now });

    const { result } = renderGroupsHook();

    await waitFor(() => {
      expect(result.current.groups).toHaveLength(1);
    });

    await act(async () => {
      await result.current.updateGroup('g1', 'Health');
    });

    expect(result.current.groups[0].name).toBe('Health');
  });

  it('updateGroup throws on duplicate name with another group', async () => {
    const now = Date.now();
    await db.habitGroups.bulkAdd([
      { id: 'g1', name: 'Health', order: 0, createdAt: now, updatedAt: now },
      { id: 'g2', name: 'Work', order: 1, createdAt: now, updatedAt: now },
    ]);

    const { result } = renderGroupsHook();

    await waitFor(() => {
      expect(result.current.groups).toHaveLength(2);
    });

    await expect(
      act(async () => {
        await result.current.updateGroup('g1', 'Work');
      })
    ).rejects.toThrow('A group with this name already exists');
  });

  it('deleteGroup removes the group', async () => {
    const now = Date.now();
    await db.habitGroups.add({ id: 'g1', name: 'Health', order: 0, createdAt: now, updatedAt: now });

    const { result } = renderGroupsHook();

    await waitFor(() => {
      expect(result.current.groups).toHaveLength(1);
    });

    await act(async () => {
      await result.current.deleteGroup('g1');
    });

    await waitFor(() => {
      expect(result.current.groups).toHaveLength(0);
    });
  });

  it('deleteGroup cascades to remove categories and habits', async () => {
    const now = Date.now();
    await db.habitGroups.add({ id: 'g1', name: 'Health', order: 0, createdAt: now, updatedAt: now });
    await db.habitCategories.bulkAdd([
      { id: 'c1', name: 'Exercise', groupId: 'g1', order: 0, createdAt: now, updatedAt: now },
      { id: 'c2', name: 'Diet', groupId: 'g1', order: 1, createdAt: now, updatedAt: now },
    ]);
    await db.habits.bulkAdd([
      { id: 'h1', name: 'Run', categoryId: 'c1', order: 0, isActive: true, createdAt: now, updatedAt: now },
      { id: 'h2', name: 'Gym', categoryId: 'c1', order: 1, isActive: true, createdAt: now, updatedAt: now },
      { id: 'h3', name: 'Water', categoryId: 'c2', order: 0, isActive: true, createdAt: now, updatedAt: now },
    ]);

    const { result } = renderGroupsHook();

    await waitFor(() => {
      expect(result.current.groups).toHaveLength(1);
    });

    await act(async () => {
      await result.current.deleteGroup('g1');
    });

    await waitFor(() => {
      expect(result.current.groups).toHaveLength(0);
    });

    const remainingCategories = await db.habitCategories.toArray();
    expect(remainingCategories).toHaveLength(0);

    const remainingHabits = await db.habits.toArray();
    expect(remainingHabits).toHaveLength(0);
  });

  it('deleteGroup does not affect other groups', async () => {
    const now = Date.now();
    await db.habitGroups.bulkAdd([
      { id: 'g1', name: 'Health', order: 0, createdAt: now, updatedAt: now },
      { id: 'g2', name: 'Work', order: 1, createdAt: now, updatedAt: now },
    ]);
    await db.habitCategories.bulkAdd([
      { id: 'c1', name: 'Exercise', groupId: 'g1', order: 0, createdAt: now, updatedAt: now },
      { id: 'c2', name: 'Tasks', groupId: 'g2', order: 0, createdAt: now, updatedAt: now },
    ]);
    await db.habits.bulkAdd([
      { id: 'h1', name: 'Run', categoryId: 'c1', order: 0, isActive: true, createdAt: now, updatedAt: now },
      { id: 'h2', name: 'Code', categoryId: 'c2', order: 0, isActive: true, createdAt: now, updatedAt: now },
    ]);

    const { result } = renderGroupsHook();

    await waitFor(() => {
      expect(result.current.groups).toHaveLength(2);
    });

    await act(async () => {
      await result.current.deleteGroup('g1');
    });

    await waitFor(() => {
      expect(result.current.groups).toHaveLength(1);
    });

    expect(result.current.groups[0].name).toBe('Work');

    const remainingCategories = await db.habitCategories.toArray();
    expect(remainingCategories).toHaveLength(1);
    expect(remainingCategories[0].name).toBe('Tasks');

    const remainingHabits = await db.habits.toArray();
    expect(remainingHabits).toHaveLength(1);
    expect(remainingHabits[0].name).toBe('Code');
  });

  it('throws when no active database', async () => {
    mockDb.current = null;

    const { result } = renderGroupsHook();

    await expect(
      act(async () => {
        await result.current.addGroup('Test');
      })
    ).rejects.toThrow('No active profile database');
  });
});
