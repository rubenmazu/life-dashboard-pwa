import { describe, it, expect, afterEach } from 'vitest';
import { ProfileDatabase } from '../../db/schema';
import type {
  IncomeEntry,
  ExpenseCategory,
  Expense,
  HabitGroup,
  HabitCategory,
  Habit,
  HabitCompletion,
  StreakRecord,
} from '../../db/schema';

describe('ProfileDatabase', () => {
  const dbs: ProfileDatabase[] = [];

  function createDb(profileId: string) {
    const db = new ProfileDatabase(profileId);
    dbs.push(db);
    return db;
  }

  afterEach(async () => {
    for (const db of dbs) {
      db.close();
      await db.delete();
    }
    dbs.length = 0;
  });

  it('creates database with profile-specific name', () => {
    const db = createDb('test-user-1');
    expect(db.name).toBe('life_dash_profile_test-user-1');
  });

  it('exposes all required tables', () => {
    const db = createDb('test-user-2');
    expect(db.incomeEntries).toBeDefined();
    expect(db.expenseCategories).toBeDefined();
    expect(db.expenses).toBeDefined();
    expect(db.habitGroups).toBeDefined();
    expect(db.habitCategories).toBeDefined();
    expect(db.habits).toBeDefined();
    expect(db.habitCompletions).toBeDefined();
    expect(db.streakRecords).toBeDefined();
  });

  it('can add and retrieve an income entry', async () => {
    const db = createDb('income-test');
    const entry: IncomeEntry = {
      amount: 5000,
      source: 'Salary',
      month: '2024-06',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const id = await db.incomeEntries.add(entry);
    const retrieved = await db.incomeEntries.get(id);

    expect(retrieved).toBeDefined();
    expect(retrieved!.amount).toBe(5000);
    expect(retrieved!.source).toBe('Salary');
    expect(retrieved!.month).toBe('2024-06');
  });

  it('can add and retrieve an expense category', async () => {
    const db = createDb('category-test');
    const category: ExpenseCategory = {
      name: 'Groceries',
      budgetLimit: 500,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const id = await db.expenseCategories.add(category);
    const retrieved = await db.expenseCategories.get(id);

    expect(retrieved).toBeDefined();
    expect(retrieved!.name).toBe('Groceries');
    expect(retrieved!.budgetLimit).toBe(500);
  });

  it('enforces unique category name index', async () => {
    const db = createDb('unique-category-test');
    const now = Date.now();

    await db.expenseCategories.add({
      name: 'Food',
      budgetLimit: 300,
      createdAt: now,
      updatedAt: now,
    });

    await expect(
      db.expenseCategories.add({
        name: 'Food',
        budgetLimit: 400,
        createdAt: now,
        updatedAt: now,
      })
    ).rejects.toThrow();
  });

  it('can add and query expenses by month', async () => {
    const db = createDb('expense-test');
    const now = Date.now();

    await db.expenses.bulkAdd([
      { amount: 50, categoryId: 'cat1', date: '2024-06-01', notes: '', month: '2024-06', createdAt: now, updatedAt: now },
      { amount: 75, categoryId: 'cat1', date: '2024-06-15', notes: 'lunch', month: '2024-06', createdAt: now, updatedAt: now },
      { amount: 100, categoryId: 'cat2', date: '2024-07-01', notes: '', month: '2024-07', createdAt: now, updatedAt: now },
    ] as Expense[]);

    const juneExpenses = await db.expenses.where('month').equals('2024-06').toArray();
    expect(juneExpenses).toHaveLength(2);
  });

  it('can add and query habit completions by compound index', async () => {
    const db = createDb('completion-test');
    const now = Date.now();

    await db.habitCompletions.bulkAdd([
      { habitId: 'h1', date: '2024-06-01', status: 'completed', updatedAt: now },
      { habitId: 'h1', date: '2024-06-02', status: 'in_progress', updatedAt: now },
      { habitId: 'h2', date: '2024-06-01', status: 'not_started', updatedAt: now },
    ] as HabitCompletion[]);

    const result = await db.habitCompletions
      .where('[habitId+date]')
      .equals(['h1', '2024-06-01'])
      .first();

    expect(result).toBeDefined();
    expect(result!.status).toBe('completed');
  });

  it('enforces unique habitId on streak records', async () => {
    const db = createDb('streak-test');
    const now = Date.now();

    await db.streakRecords.add({
      habitId: 'h1',
      currentStreak: 5,
      longestStreak: 10,
      lastCompletedDate: '2024-06-01',
      updatedAt: now,
    } as StreakRecord);

    await expect(
      db.streakRecords.add({
        habitId: 'h1',
        currentStreak: 3,
        longestStreak: 10,
        lastCompletedDate: '2024-06-02',
        updatedAt: now,
      } as StreakRecord)
    ).rejects.toThrow();
  });

  it('can add and query habits by categoryId', async () => {
    const db = createDb('habit-query-test');
    const now = Date.now();

    await db.habits.bulkAdd([
      { name: 'Meditate', categoryId: 'c1', order: 0, isActive: true, createdAt: now, updatedAt: now },
      { name: 'Exercise', categoryId: 'c1', order: 1, isActive: true, createdAt: now, updatedAt: now },
      { name: 'Read', categoryId: 'c2', order: 0, isActive: true, createdAt: now, updatedAt: now },
    ] as Habit[]);

    const c1Habits = await db.habits.where('categoryId').equals('c1').toArray();
    expect(c1Habits).toHaveLength(2);
  });

  it('isolates data between different profile databases', async () => {
    const db1 = createDb('profile-a');
    const db2 = createDb('profile-b');
    const now = Date.now();

    await db1.incomeEntries.add({ amount: 1000, source: 'Job A', month: '2024-06', createdAt: now, updatedAt: now });
    await db2.incomeEntries.add({ amount: 2000, source: 'Job B', month: '2024-06', createdAt: now, updatedAt: now });

    const db1Entries = await db1.incomeEntries.toArray();
    const db2Entries = await db2.incomeEntries.toArray();

    expect(db1Entries).toHaveLength(1);
    expect(db1Entries[0].source).toBe('Job A');
    expect(db2Entries).toHaveLength(1);
    expect(db2Entries[0].source).toBe('Job B');
  });

  it('can add and query habit groups with unique name index', async () => {
    const db = createDb('group-test');
    const now = Date.now();

    await db.habitGroups.add({ name: 'Morning', order: 0, createdAt: now, updatedAt: now } as HabitGroup);

    await expect(
      db.habitGroups.add({ name: 'Morning', order: 1, createdAt: now, updatedAt: now } as HabitGroup)
    ).rejects.toThrow();
  });

  it('can add and query habit categories by groupId', async () => {
    const db = createDb('habit-cat-test');
    const now = Date.now();

    await db.habitCategories.bulkAdd([
      { name: 'Health', groupId: 'g1', order: 0, createdAt: now, updatedAt: now },
      { name: 'Learning', groupId: 'g1', order: 1, createdAt: now, updatedAt: now },
      { name: 'Work', groupId: 'g2', order: 0, createdAt: now, updatedAt: now },
    ] as HabitCategory[]);

    const g1Categories = await db.habitCategories.where('groupId').equals('g1').toArray();
    expect(g1Categories).toHaveLength(2);
  });
});
