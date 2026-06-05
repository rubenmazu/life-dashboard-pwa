import { useState } from 'react';
import { useHabits } from '@/hooks/useHabits';
import { useHabitCategories } from '@/hooks/useHabitCategories';
import { DragSortableList } from './DragSortableList';
import { HabitForm } from './HabitForm';
import { CategoryManager } from './CategoryManager';
import { GroupManager } from './GroupManager';
import type { Habit } from '@/db/schema';

type Tab = 'habits' | 'categories' | 'groups';

/**
 * Tab-based management screen for habits, categories, and groups.
 * - Habits tab: reorderable list per category using DragSortableList
 * - Categories tab: CategoryManager
 * - Groups tab: GroupManager
 *
 * Requirements: 11.1, 11.3, 11.5, 11.6, 12.1, 12.2, 12.6, 12.7, 12.8
 */
export function HabitManageScreen() {
  const [activeTab, setActiveTab] = useState<Tab>('habits');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

  const tabs: { key: Tab; label: string }[] = [
    { key: 'habits', label: 'Habits' },
    { key: 'categories', label: 'Categories' },
    { key: 'groups', label: 'Groups' },
  ];

  return (
    <div className="flex flex-col min-h-full pb-4">
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <h1
          className="text-2xl font-bold"
          style={{ color: 'var(--color-ios-text-primary)' }}
        >
          Manage
        </h1>
      </div>

      {/* Tab bar */}
      <div className="px-4 mb-4">
        <div
          className="flex rounded-lg p-1"
          style={{ backgroundColor: 'var(--color-ios-separator)' }}
          role="tablist"
        >
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.key}
              className="flex-1 py-2 px-3 rounded-md text-sm font-semibold transition-colors"
              style={{
                backgroundColor: activeTab === tab.key ? 'var(--color-ios-surface)' : 'transparent',
                color: activeTab === tab.key ? 'var(--color-ios-blue)' : 'var(--color-ios-text-secondary)',
                boxShadow: activeTab === tab.key ? 'var(--shadow-sm)' : 'none',
              }}
              onClick={() => {
                setActiveTab(tab.key);
                setShowAddForm(false);
                setEditingHabit(null);
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 px-4">
        {activeTab === 'habits' && (
          <HabitsTab
            showAddForm={showAddForm}
            setShowAddForm={setShowAddForm}
            editingHabit={editingHabit}
            setEditingHabit={setEditingHabit}
          />
        )}
        {activeTab === 'categories' && <CategoryManager />}
        {activeTab === 'groups' && <GroupManager />}
      </div>
    </div>
  );
}

// ─── Habits Tab ───────────────────────────────────────────────────────────────

function HabitsTab({
  showAddForm,
  setShowAddForm,
  editingHabit,
  setEditingHabit,
}: {
  showAddForm: boolean;
  setShowAddForm: (v: boolean) => void;
  editingHabit: Habit | null;
  setEditingHabit: (h: Habit | null) => void;
}) {
  const { activeHabits, reorderHabits, deleteHabit } = useHabits();
  const { categories } = useHabitCategories();

  // Show add/edit form
  if (showAddForm || editingHabit) {
    return (
      <div className="ios-card p-0 overflow-hidden">
        <HabitForm
          habit={editingHabit ?? undefined}
          onSaved={() => {
            setShowAddForm(false);
            setEditingHabit(null);
          }}
          onCancel={() => {
            setShowAddForm(false);
            setEditingHabit(null);
          }}
        />
      </div>
    );
  }

  // Group habits by category
  const habitsByCategory = categories.map((cat) => ({
    category: cat,
    habits: activeHabits.filter((h) => h.categoryId === cat.id),
  })).filter((group) => group.habits.length > 0);

  return (
    <div className="flex flex-col gap-4">
      {habitsByCategory.length === 0 && (
        <p className="text-center py-8 text-sm" style={{ color: 'var(--color-ios-text-tertiary)' }}>
          No habits yet. Add a habit to get started.
        </p>
      )}

      {habitsByCategory.map(({ category, habits }) => (
        <div key={category.id}>
          <h3
            className="text-xs font-semibold uppercase tracking-wide mb-2 px-1"
            style={{ color: 'var(--color-ios-text-secondary)' }}
          >
            {category.name}
          </h3>
          <DragSortableList
            items={habits}
            onReorder={(ids) => reorderHabits(ids)}
            renderItem={(habit) => (
              <div className="flex items-center justify-between w-full">
                <span
                  className="truncate text-base"
                  style={{ color: 'var(--color-ios-text-primary)' }}
                >
                  {habit.name}
                </span>
                <div className="flex gap-1 shrink-0 ml-2">
                  <button
                    type="button"
                    className="text-xs font-medium px-2 py-1 rounded"
                    style={{ color: 'var(--color-ios-blue)' }}
                    onClick={() => setEditingHabit(habit)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="text-xs font-medium px-2 py-1 rounded"
                    style={{ color: 'var(--color-ios-red)' }}
                    onClick={() => deleteHabit(habit.id!)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          />
        </div>
      ))}

      {/* Add button */}
      <button
        type="button"
        className="ios-btn ios-btn-primary w-full"
        onClick={() => setShowAddForm(true)}
      >
        + Add Habit
      </button>
    </div>
  );
}
