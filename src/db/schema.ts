import Dexie, { type Table } from 'dexie';

// ─── Finance Tracker Interfaces ───────────────────────────────────────────────

export interface IncomeEntry {
  id?: string;
  amount: number;
  source: string;
  month: string; // "YYYY-MM" format
  createdAt: number;
  updatedAt: number;
}

export interface ExpenseCategory {
  id?: string;
  name: string;
  budgetLimit: number;
  createdAt: number;
  updatedAt: number;
}

export interface Expense {
  id?: string;
  amount: number;
  categoryId: string;
  date: string; // "YYYY-MM-DD" format
  notes: string;
  month: string; // "YYYY-MM" derived from date, indexed for queries
  createdAt: number;
  updatedAt: number;
}

// ─── Habit Tracker Interfaces ─────────────────────────────────────────────────

export interface HabitGroup {
  id?: string;
  name: string;
  order: number;
  createdAt: number;
  updatedAt: number;
}

export interface HabitCategory {
  id?: string;
  name: string;
  groupId: string;
  order: number;
  createdAt: number;
  updatedAt: number;
}

export interface Habit {
  id?: string;
  name: string;
  categoryId: string;
  order: number;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface HabitCompletion {
  id?: string;
  habitId: string;
  date: string; // "YYYY-MM-DD"
  status: 'not_started' | 'in_progress' | 'completed';
  updatedAt: number;
}

export interface StreakRecord {
  id?: string;
  habitId: string;
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate: string | null;
  updatedAt: number;
}

// ─── Dexie Database Class ─────────────────────────────────────────────────────

export class ProfileDatabase extends Dexie {
  incomeEntries!: Table<IncomeEntry>;
  expenseCategories!: Table<ExpenseCategory>;
  expenses!: Table<Expense>;
  habitGroups!: Table<HabitGroup>;
  habitCategories!: Table<HabitCategory>;
  habits!: Table<Habit>;
  habitCompletions!: Table<HabitCompletion>;
  streakRecords!: Table<StreakRecord>;

  constructor(profileId: string) {
    super(`life_dash_profile_${profileId}`);
    this.version(1).stores({
      incomeEntries: '++id, month, createdAt',
      expenseCategories: '++id, &name, createdAt',
      expenses: '++id, categoryId, month, date',
      habitGroups: '++id, &name, order',
      habitCategories: '++id, groupId, order',
      habits: '++id, categoryId, order, isActive',
      habitCompletions: '++id, habitId, date, [habitId+date]',
      streakRecords: '++id, &habitId',
    });
  }
}
