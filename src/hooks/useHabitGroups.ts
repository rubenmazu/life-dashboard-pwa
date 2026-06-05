import { useLiveQuery } from 'dexie-react-hooks';
import { v4 as uuidv4 } from 'uuid';
import { useProfile } from '@/context/ProfileContext';
import { validateHabitGroupName } from '@/utils/validators/habit.validator';
import type { HabitGroup } from '@/db/schema';

export interface UseHabitGroupsResult {
  groups: HabitGroup[];
  isLoading: boolean;
  addGroup: (name: string) => Promise<string>;
  updateGroup: (id: string, name: string) => Promise<void>;
  deleteGroup: (id: string) => Promise<void>;
}

/**
 * Hook for managing habit groups with CRUD operations.
 * Groups are sorted by `order` field.
 * Delete cascades: removes all categories and habits within the group.
 *
 * Requirements: 12.2, 12.8
 */
export function useHabitGroups(): UseHabitGroupsResult {
  const { db } = useProfile();

  const groups = useLiveQuery(
    async () => {
      if (!db) return [];
      return db.habitGroups.orderBy('order').toArray();
    },
    [db],
    []
  );

  const isLoading = groups === undefined;

  async function addGroup(name: string): Promise<string> {
    if (!db) throw new Error('No active profile database');

    // Early validation (no DB access needed)
    if (!name || name.trim().length === 0) {
      throw new Error('Group name is required');
    }
    if (name.length > 50) {
      throw new Error('Group name must be at most 50 characters');
    }

    const existingNames = await db.habitGroups.toArray().then((g) => g.map((x) => x.name));
    const validation = validateHabitGroupName(name, existingNames);
    if (!validation.valid) {
      throw new Error(validation.error!);
    }

    const maxOrder = await db.habitGroups.orderBy('order').last();
    const order = maxOrder ? maxOrder.order + 1 : 0;

    const id = uuidv4();
    const now = Date.now();

    await db.habitGroups.add({
      id,
      name: name.trim(),
      order,
      createdAt: now,
      updatedAt: now,
    });

    return id;
  }

  async function updateGroup(id: string, name: string): Promise<void> {
    if (!db) throw new Error('No active profile database');

    const existing = await db.habitGroups.get(id);
    if (!existing) throw new Error('Group not found');

    // Exclude the current group's name from duplicate check
    const existingNames = await db.habitGroups
      .toArray()
      .then((g) => g.filter((x) => x.id !== id).map((x) => x.name));

    const validation = validateHabitGroupName(name, existingNames);
    if (!validation.valid) {
      throw new Error(validation.error!);
    }

    await db.habitGroups.update(id, {
      name: name.trim(),
      updatedAt: Date.now(),
    });
  }

  async function deleteGroup(id: string): Promise<void> {
    if (!db) throw new Error('No active profile database');

    await db.transaction('rw', [db.habitGroups, db.habitCategories, db.habits], async () => {
      // Find all categories in this group
      const categories = await db.habitCategories.where('groupId').equals(id).toArray();
      const categoryIds = categories.map((c) => c.id!);

      // Find all habits in those categories
      if (categoryIds.length > 0) {
        await db.habits.where('categoryId').anyOf(categoryIds).delete();
      }

      // Delete categories
      await db.habitCategories.where('groupId').equals(id).delete();

      // Delete the group
      await db.habitGroups.delete(id);
    });
  }

  return {
    groups: groups ?? [],
    isLoading,
    addGroup,
    updateGroup,
    deleteGroup,
  };
}
