import { useLiveQuery } from 'dexie-react-hooks';
import { v4 as uuidv4 } from 'uuid';
import { useProfile } from '@/context/ProfileContext';
import { validateHabitName } from '@/utils/validators/habit.validator';
import type { Habit } from '@/db/schema';

export interface UseHabitsResult {
  habits: Habit[];
  activeHabits: Habit[];
  isLoading: boolean;
  addHabit: (name: string, categoryId: string) => Promise<string>;
  updateHabit: (id: string, name: string, categoryId: string) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  moveHabit: (id: string, newCategoryId: string) => Promise<void>;
  reorderHabits: (habitIds: string[]) => Promise<void>;
}

/**
 * Hook for managing habits with CRUD, move, and reorder operations.
 * Habits are sorted by `order` within their category.
 * Delete is a soft-delete (isActive=false) to preserve streak/completion history.
 *
 * Requirements: 11.1, 11.3, 11.4, 12.6, 12.9
 */
export function useHabits(): UseHabitsResult {
  const { db } = useProfile();

  const habits = useLiveQuery(
    async () => {
      if (!db) return [];
      return db.habits.orderBy('order').toArray();
    },
    [db],
    []
  );

  const isLoading = habits === undefined;

  const allHabits = habits ?? [];
  const activeHabits = allHabits.filter((h) => h.isActive);

  async function addHabit(name: string, categoryId: string): Promise<string> {
    if (!db) throw new Error('No active profile database');

    // Early validation (no DB access needed)
    const validation = validateHabitName(name);
    if (!validation.valid) {
      throw new Error(validation.error!);
    }

    // Verify category exists
    const category = await db.habitCategories.get(categoryId);
    if (!category) throw new Error('Category not found');

    // Determine order (append to end within category)
    const habitsInCategory = await db.habits
      .where('categoryId')
      .equals(categoryId)
      .sortBy('order');
    const maxOrder = habitsInCategory.length > 0
      ? habitsInCategory[habitsInCategory.length - 1].order
      : -1;

    const id = uuidv4();
    const now = Date.now();

    await db.habits.add({
      id,
      name: name.trim(),
      categoryId,
      order: maxOrder + 1,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    return id;
  }

  async function updateHabit(id: string, name: string, categoryId: string): Promise<void> {
    if (!db) throw new Error('No active profile database');

    // Early validation (no DB access needed)
    const validation = validateHabitName(name);
    if (!validation.valid) {
      throw new Error(validation.error!);
    }

    const existing = await db.habits.get(id);
    if (!existing) throw new Error('Habit not found');

    // Verify category exists
    const category = await db.habitCategories.get(categoryId);
    if (!category) throw new Error('Category not found');

    await db.habits.update(id, {
      name: name.trim(),
      categoryId,
      updatedAt: Date.now(),
    });
  }

  async function deleteHabit(id: string): Promise<void> {
    if (!db) throw new Error('No active profile database');

    const existing = await db.habits.get(id);
    if (!existing) throw new Error('Habit not found');

    // Soft-delete: set isActive to false to preserve streak/completion history
    await db.habits.update(id, {
      isActive: false,
      updatedAt: Date.now(),
    });
  }

  async function moveHabit(id: string, newCategoryId: string): Promise<void> {
    if (!db) throw new Error('No active profile database');

    const existing = await db.habits.get(id);
    if (!existing) throw new Error('Habit not found');

    // Verify new category exists
    const newCategory = await db.habitCategories.get(newCategoryId);
    if (!newCategory) throw new Error('Target category not found');

    // Determine new order (append to end of new category)
    const habitsInNewCategory = await db.habits
      .where('categoryId')
      .equals(newCategoryId)
      .sortBy('order');
    const maxOrder = habitsInNewCategory.length > 0
      ? habitsInNewCategory[habitsInNewCategory.length - 1].order
      : -1;

    await db.habits.update(id, {
      categoryId: newCategoryId,
      order: maxOrder + 1,
      updatedAt: Date.now(),
    });
  }

  async function reorderHabits(habitIds: string[]): Promise<void> {
    if (!db) throw new Error('No active profile database');

    const now = Date.now();

    await db.transaction('rw', db.habits, async () => {
      const updates = habitIds.map((id, index) =>
        db.habits.update(id, { order: index, updatedAt: now })
      );
      await Promise.all(updates);
    });
  }

  return {
    habits: allHabits,
    activeHabits,
    isLoading,
    addHabit,
    updateHabit,
    deleteHabit,
    moveHabit,
    reorderHabits,
  };
}
