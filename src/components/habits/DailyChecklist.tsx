import { useState, useCallback, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useProfile } from '@/context/ProfileContext';
import { useHabits } from '@/hooks/useHabits';
import { useHabitGroups } from '@/hooks/useHabitGroups';
import { useHabitCategories } from '@/hooks/useHabitCategories';
import { useHabitCompletions } from '@/hooks/useHabitCompletions';
import { computeCompletionSummary } from '@/utils/habit-status';
import type { HabitStatus } from '@/utils/habit-status';
import type { Habit, HabitCategory, HabitGroup, StreakRecord } from '@/db/schema';
import { EmptyState } from '@/components/shared/EmptyState';
import { Toast } from '@/components/shared/Toast';
import { HabitItem } from './HabitItem';

/**
 * Displays all active habits grouped by group → category hierarchy.
 * Shows completion summary at the top.
 * Groups and categories are collapsible.
 * Empty state when no active habits configured.
 *
 * Requirements: 10.1, 10.5, 10.8, 10.10, 12.3, 12.4, 12.5
 */
export function DailyChecklist() {
  const { db } = useProfile();
  const { activeHabits, isLoading: habitsLoading } = useHabits();
  const { groups, isLoading: groupsLoading } = useHabitGroups();
  const { categories, isLoading: categoriesLoading } = useHabitCategories();
  const { todayStatuses, isLoading: completionsLoading, toggleStatus } = useHabitCompletions();

  // Load streak records
  const streakRecords = useLiveQuery(
    async () => {
      if (!db) return [];
      return db.streakRecords.toArray();
    },
    [db],
    [] as StreakRecord[]
  );

  // Collapsed state for groups and categories
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

  // Toast state for error handling
  const [toast, setToast] = useState<{ message: string; type: 'error' } | null>(null);

  const isLoading = habitsLoading || groupsLoading || categoriesLoading || completionsLoading;

  // Build streak map: habitId → currentStreak
  const streakMap = useMemo(() => {
    const map = new Map<string, number>();
    if (streakRecords) {
      for (const record of streakRecords) {
        map.set(record.habitId, record.currentStreak);
      }
    }
    return map;
  }, [streakRecords]);

  // Compute completion summary
  const summary = useMemo(() => {
    const statuses: HabitStatus[] = activeHabits.map(
      (h) => todayStatuses.get(h.id!) ?? 'not_started'
    );
    return computeCompletionSummary(statuses);
  }, [activeHabits, todayStatuses]);

  // Build hierarchy: group → categories → habits
  const hierarchy = useMemo(() => {
    const categoryMap = new Map<string, HabitCategory[]>();
    for (const cat of categories) {
      const list = categoryMap.get(cat.groupId) || [];
      list.push(cat);
      categoryMap.set(cat.groupId, list);
    }

    const habitMap = new Map<string, Habit[]>();
    for (const habit of activeHabits) {
      const list = habitMap.get(habit.categoryId) || [];
      list.push(habit);
      habitMap.set(habit.categoryId, list);
    }

    return { categoryMap, habitMap };
  }, [categories, activeHabits]);

  // Get group completion count
  const getGroupCompletionCount = useCallback(
    (groupId: string) => {
      const groupCategories = hierarchy.categoryMap.get(groupId) || [];
      let completed = 0;
      let total = 0;
      for (const cat of groupCategories) {
        const habits = hierarchy.habitMap.get(cat.id!) || [];
        for (const h of habits) {
          total++;
          if (todayStatuses.get(h.id!) === 'completed') completed++;
        }
      }
      return { completed, total };
    },
    [hierarchy, todayStatuses]
  );

  // Get category completion count
  const getCategoryCompletionCount = useCallback(
    (categoryId: string) => {
      const habits = hierarchy.habitMap.get(categoryId) || [];
      let completed = 0;
      const total = habits.length;
      for (const h of habits) {
        if (todayStatuses.get(h.id!) === 'completed') completed++;
      }
      return { completed, total };
    },
    [hierarchy, todayStatuses]
  );

  const toggleGroup = useCallback((groupId: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  }, []);

  const toggleCategory = useCallback((categoryId: string) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  }, []);

  const handleError = useCallback((message: string) => {
    setToast({ message, type: 'error' });
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div
          className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: 'var(--color-ios-blue)', borderTopColor: 'transparent' }}
        />
      </div>
    );
  }

  if (activeHabits.length === 0) {
    return (
      <EmptyState
        title="No habits yet"
        description="Add your first habit to get started."
      />
    );
  }

  return (
    <div className="pb-4">
      {/* Toast notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDismiss={() => setToast(null)}
        />
      )}

      {/* Completion summary */}
      <div
        className="px-4 py-3 text-sm font-medium"
        style={{ color: 'var(--color-ios-text-secondary)' }}
        aria-live="polite"
        aria-label={`Today's progress: ${summary.completed} done, ${summary.inProgress} in progress, ${summary.notStarted} remaining`}
      >
        <span style={{ color: 'var(--color-ios-green)' }}>{summary.completed} done</span>
        {' · '}
        <span style={{ color: 'var(--color-ios-blue)' }}>{summary.inProgress} in progress</span>
        {' · '}
        <span style={{ color: 'var(--color-ios-gray)' }}>{summary.notStarted} remaining</span>
      </div>

      {/* Groups → Categories → Habits */}
      {groups.map((group) => {
        const groupCategories = hierarchy.categoryMap.get(group.id!) || [];
        // Only show groups that have active habits
        const groupHasActiveHabits = groupCategories.some(
          (cat) => (hierarchy.habitMap.get(cat.id!) || []).length > 0
        );
        if (!groupHasActiveHabits) return null;

        const isGroupCollapsed = collapsedGroups.has(group.id!);
        const groupCompletion = getGroupCompletionCount(group.id!);

        return (
          <GroupSection
            key={group.id}
            group={group}
            isCollapsed={isGroupCollapsed}
            completionCount={groupCompletion}
            onToggle={toggleGroup}
          >
            {!isGroupCollapsed &&
              groupCategories.map((category) => {
                const categoryHabits = hierarchy.habitMap.get(category.id!) || [];
                if (categoryHabits.length === 0) return null;

                const isCategoryCollapsed = collapsedCategories.has(category.id!);
                const catCompletion = getCategoryCompletionCount(category.id!);

                return (
                  <CategorySection
                    key={category.id}
                    category={category}
                    isCollapsed={isCategoryCollapsed}
                    completionCount={catCompletion}
                    onToggle={toggleCategory}
                  >
                    {!isCategoryCollapsed && (
                      <div role="list" aria-label={`Habits in ${category.name}`}>
                        {categoryHabits.map((habit) => (
                          <HabitItem
                            key={habit.id}
                            habitId={habit.id!}
                            name={habit.name}
                            status={todayStatuses.get(habit.id!) ?? 'not_started'}
                            streak={streakMap.get(habit.id!) ?? 0}
                            onToggle={toggleStatus}
                            onError={handleError}
                          />
                        ))}
                      </div>
                    )}
                  </CategorySection>
                );
              })}
          </GroupSection>
        );
      })}
    </div>
  );
}

// ─── Group Section ────────────────────────────────────────────────────────────

interface GroupSectionProps {
  group: HabitGroup;
  isCollapsed: boolean;
  completionCount: { completed: number; total: number };
  onToggle: (id: string) => void;
  children: React.ReactNode;
}

function GroupSection({ group, isCollapsed, completionCount, onToggle, children }: GroupSectionProps) {
  return (
    <section className="mt-3" aria-label={`Group: ${group.name}`}>
      <button
        type="button"
        onClick={() => onToggle(group.id!)}
        className="flex items-center justify-between w-full px-4 py-2.5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ios-blue)]"
        aria-expanded={!isCollapsed}
        aria-controls={`group-content-${group.id}`}
      >
        <div className="flex items-center gap-2">
          <ChevronIcon isExpanded={!isCollapsed} />
          <span
            className="text-[13px] font-semibold uppercase tracking-wide"
            style={{ color: 'var(--color-ios-text-secondary)' }}
          >
            {group.name}
          </span>
        </div>
        {isCollapsed && (
          <span
            className="text-xs font-medium"
            style={{ color: 'var(--color-ios-text-tertiary)' }}
          >
            {completionCount.completed}/{completionCount.total}
          </span>
        )}
      </button>
      <div id={`group-content-${group.id}`}>
        {children}
      </div>
    </section>
  );
}

// ─── Category Section ─────────────────────────────────────────────────────────

interface CategorySectionProps {
  category: HabitCategory;
  isCollapsed: boolean;
  completionCount: { completed: number; total: number };
  onToggle: (id: string) => void;
  children: React.ReactNode;
}

function CategorySection({ category, isCollapsed, completionCount, onToggle, children }: CategorySectionProps) {
  return (
    <div className="ml-2" aria-label={`Category: ${category.name}`}>
      <button
        type="button"
        onClick={() => onToggle(category.id!)}
        className="flex items-center justify-between w-full px-4 py-2 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ios-blue)]"
        aria-expanded={!isCollapsed}
        aria-controls={`category-content-${category.id}`}
      >
        <div className="flex items-center gap-2">
          <ChevronIcon isExpanded={!isCollapsed} size={12} />
          <span
            className="text-sm font-medium"
            style={{ color: 'var(--color-ios-text-primary)' }}
          >
            {category.name}
          </span>
        </div>
        {isCollapsed && (
          <span
            className="text-xs"
            style={{ color: 'var(--color-ios-text-tertiary)' }}
          >
            {completionCount.completed}/{completionCount.total} completed
          </span>
        )}
      </button>
      <div id={`category-content-${category.id}`}>
        {children}
      </div>
    </div>
  );
}

// ─── Chevron Icon ─────────────────────────────────────────────────────────────

function ChevronIcon({ isExpanded, size = 14 }: { isExpanded: boolean; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden="true"
      style={{
        transition: 'transform var(--duration-fast) var(--ease-ios)',
        transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
      }}
    >
      <path
        d="M4.5 2.5L8 6L4.5 9.5"
        stroke="var(--color-ios-text-tertiary)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
