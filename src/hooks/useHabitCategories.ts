import { useLiveQuery } from 'dexie-react-hooks';
import { v4 as uuidv4 } from 'uuid';
import { useProfile } from '@/context/ProfileContext';
import { validateHabitCategoryName } from '@/utils/validators/habit.validator';
import type { HabitCategory } from '@/db/schema';

export interface UseHabitCategoriesResult {
  categories: HabitCategory[];
  isLoading: boolean;
  addCategory: (name: string, groupId: string) => Promise<string>;
  updateCategory: (id: string, name: string) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  moveCategory: (id: string, newGroupId: string) => Promise<void>;
}

/**
 * Hook for managing habit categories with CRUD and move operations.
 * Categories are sorted by `order` within their group.
 * Delete cascades: removes all habits within the category.
 *
 * Requirements: 12.1, 12.6, 12.7
 */
export function useHabitCategories(): UseHabitCategoriesResult {
  const { db } = useProfile();

  const categories = useLiveQuery(
    async () => {
      if (!db) return [];
      return db.habitCategories.orderBy('order').toArray();
    },
    [db],
    []
  );

  const isLoading = categories === undefined;

  async function addCategory(name: string, groupId: string): Promise<string> {
    if (!db) throw new Error('No active profile database');

    // Early validation (no DB access needed)
    if (!name || name.trim().length === 0) {
      throw new Error('Category name is required');
    }
    if (name.length > 50) {
      throw new Error('Category name must be at most 50 characters');
    }

    // Verify group exists
    const group = await db.habitGroups.get(groupId);
    if (!group) throw new Error('Group not found');

    // Get existing category names within the same group for uniqueness check
    const existingNamesInGroup = await db.habitCategories
      .where('groupId')
      .equals(groupId)
      .toArray()
      .then((cats) => cats.map((c) => c.name));

    const validation = validateHabitCategoryName(name, existingNamesInGroup);
    if (!validation.valid) {
      throw new Error(validation.error!);
    }

    // Determine order (append to end within group)
    const maxInGroup = await db.habitCategories
      .where('groupId')
      .equals(groupId)
      .sortBy('order')
      .then((cats) => (cats.length > 0 ? cats[cats.length - 1].order : -1));

    const order = maxInGroup + 1;
    const id = uuidv4();
    const now = Date.now();

    await db.habitCategories.add({
      id,
      name: name.trim(),
      groupId,
      order,
      createdAt: now,
      updatedAt: now,
    });

    return id;
  }

  async function updateCategory(id: string, name: string): Promise<void> {
    if (!db) throw new Error('No active profile database');

    const existing = await db.habitCategories.get(id);
    if (!existing) throw new Error('Category not found');

    // Get existing category names in the same group, excluding current
    const existingNamesInGroup = await db.habitCategories
      .where('groupId')
      .equals(existing.groupId)
      .toArray()
      .then((cats) => cats.filter((c) => c.id !== id).map((c) => c.name));

    const validation = validateHabitCategoryName(name, existingNamesInGroup);
    if (!validation.valid) {
      throw new Error(validation.error!);
    }

    await db.habitCategories.update(id, {
      name: name.trim(),
      updatedAt: Date.now(),
    });
  }

  async function deleteCategory(id: string): Promise<void> {
    if (!db) throw new Error('No active profile database');

    await db.transaction('rw', [db.habitCategories, db.habits], async () => {
      // Delete all habits in this category
      await db.habits.where('categoryId').equals(id).delete();

      // Delete the category
      await db.habitCategories.delete(id);
    });
  }

  async function moveCategory(id: string, newGroupId: string): Promise<void> {
    if (!db) throw new Error('No active profile database');

    const existing = await db.habitCategories.get(id);
    if (!existing) throw new Error('Category not found');

    // Verify new group exists
    const newGroup = await db.habitGroups.get(newGroupId);
    if (!newGroup) throw new Error('Target group not found');

    // Check name uniqueness in the new group
    const existingNamesInNewGroup = await db.habitCategories
      .where('groupId')
      .equals(newGroupId)
      .toArray()
      .then((cats) => cats.map((c) => c.name));

    const validation = validateHabitCategoryName(existing.name, existingNamesInNewGroup);
    if (!validation.valid) {
      throw new Error(validation.error!);
    }

    // Determine new order (append to end of new group)
    const maxInNewGroup = await db.habitCategories
      .where('groupId')
      .equals(newGroupId)
      .sortBy('order')
      .then((cats) => (cats.length > 0 ? cats[cats.length - 1].order : -1));

    await db.habitCategories.update(id, {
      groupId: newGroupId,
      order: maxInNewGroup + 1,
      updatedAt: Date.now(),
    });
  }

  return {
    categories: categories ?? [],
    isLoading,
    addCategory,
    updateCategory,
    deleteCategory,
    moveCategory,
  };
}
