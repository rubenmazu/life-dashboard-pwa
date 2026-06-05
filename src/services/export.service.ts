import type { ProfileDatabase } from '@/db/schema';
import type {
  IncomeEntry,
  ExpenseCategory,
  Expense,
  HabitGroup,
  HabitCategory,
  Habit,
  HabitCompletion,
  StreakRecord,
} from '@/db/schema';

// ─── Export Data Interface ────────────────────────────────────────────────────

export interface ExportData {
  version: 1;
  exportedAt: string; // ISO datetime
  profileName: string;
  finance: {
    incomeEntries: IncomeEntry[];
    expenseCategories: ExpenseCategory[];
    expenses: Expense[];
  };
  habits: {
    habitGroups: HabitGroup[];
    habitCategories: HabitCategory[];
    habits: Habit[];
    habitCompletions: HabitCompletion[];
    streakRecords: StreakRecord[];
  };
}

// ─── Validation Result ────────────────────────────────────────────────────────

export interface ValidationResult {
  valid: boolean;
  error: string | null;
  data: ExportData | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_IMPORT_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

// ─── Export Function ──────────────────────────────────────────────────────────

/**
 * Reads all data from the profile database and creates a JSON blob
 * containing the full ExportData structure.
 */
export async function exportProfile(
  db: ProfileDatabase,
  profileName: string
): Promise<Blob> {
  const [
    incomeEntries,
    expenseCategories,
    expenses,
    habitGroups,
    habitCategories,
    habits,
    habitCompletions,
    streakRecords,
  ] = await Promise.all([
    db.incomeEntries.toArray(),
    db.expenseCategories.toArray(),
    db.expenses.toArray(),
    db.habitGroups.toArray(),
    db.habitCategories.toArray(),
    db.habits.toArray(),
    db.habitCompletions.toArray(),
    db.streakRecords.toArray(),
  ]);

  const exportData: ExportData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    profileName,
    finance: {
      incomeEntries,
      expenseCategories,
      expenses,
    },
    habits: {
      habitGroups,
      habitCategories,
      habits,
      habitCompletions,
      streakRecords,
    },
  };

  return new Blob([JSON.stringify(exportData, null, 2)], {
    type: 'application/json',
  });
}

// ─── Download Trigger ─────────────────────────────────────────────────────────

/**
 * Creates a temporary download link and triggers a file download in the browser.
 * Filename format: life-dashboard-{profileName}-{YYYY-MM-DD}.json
 */
export function downloadExport(blob: Blob, profileName: string): void {
  const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const filename = `life-dashboard-${profileName}-${date}.json`;

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ─── Import Validation ────────────────────────────────────────────────────────

/**
 * Validates an import file:
 * - File size ≤ 50 MB
 * - Valid JSON syntax
 * - Correct structure: version field, finance section with required arrays,
 *   habits section with required arrays
 */
export async function validateImportFile(file: File): Promise<ValidationResult> {
  // Check file size
  if (file.size > MAX_IMPORT_SIZE_BYTES) {
    return {
      valid: false,
      error: 'File exceeds the maximum allowed size of 50 MB.',
      data: null,
    };
  }

  // Read file content
  let text: string;
  try {
    text = await file.text();
  } catch {
    return {
      valid: false,
      error: 'Failed to read the file.',
      data: null,
    };
  }

  // Parse JSON
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return {
      valid: false,
      error: 'File contains invalid JSON.',
      data: null,
    };
  }

  // Validate structure
  if (typeof parsed !== 'object' || parsed === null) {
    return {
      valid: false,
      error: 'Invalid export file structure.',
      data: null,
    };
  }

  const data = parsed as Record<string, unknown>;

  // Check version field
  if (data.version !== 1) {
    return {
      valid: false,
      error: 'Unsupported or missing version field. Expected version 1.',
      data: null,
    };
  }

  // Check finance section
  if (!data.finance || typeof data.finance !== 'object') {
    return {
      valid: false,
      error: 'Missing or invalid finance section.',
      data: null,
    };
  }

  const finance = data.finance as Record<string, unknown>;
  if (
    !Array.isArray(finance.incomeEntries) ||
    !Array.isArray(finance.expenseCategories) ||
    !Array.isArray(finance.expenses)
  ) {
    return {
      valid: false,
      error:
        'Finance section must contain incomeEntries, expenseCategories, and expenses arrays.',
      data: null,
    };
  }

  // Check habits section
  if (!data.habits || typeof data.habits !== 'object') {
    return {
      valid: false,
      error: 'Missing or invalid habits section.',
      data: null,
    };
  }

  const habits = data.habits as Record<string, unknown>;
  if (
    !Array.isArray(habits.habitGroups) ||
    !Array.isArray(habits.habitCategories) ||
    !Array.isArray(habits.habits) ||
    !Array.isArray(habits.habitCompletions) ||
    !Array.isArray(habits.streakRecords)
  ) {
    return {
      valid: false,
      error:
        'Habits section must contain habitGroups, habitCategories, habits, habitCompletions, and streakRecords arrays.',
      data: null,
    };
  }

  return {
    valid: true,
    error: null,
    data: data as unknown as ExportData,
  };
}

// ─── Import Function ──────────────────────────────────────────────────────────

/**
 * Imports data into the profile database using a Dexie transaction for atomicity.
 * Clears all existing tables first, then bulk-adds the imported data.
 * On any error, the transaction rolls back automatically.
 */
export async function importProfile(
  db: ProfileDatabase,
  data: ExportData
): Promise<void> {
  await db.transaction(
    'rw',
    [
      db.incomeEntries,
      db.expenseCategories,
      db.expenses,
      db.habitGroups,
      db.habitCategories,
      db.habits,
      db.habitCompletions,
      db.streakRecords,
    ],
    async () => {
      // Clear all existing data
      await Promise.all([
        db.incomeEntries.clear(),
        db.expenseCategories.clear(),
        db.expenses.clear(),
        db.habitGroups.clear(),
        db.habitCategories.clear(),
        db.habits.clear(),
        db.habitCompletions.clear(),
        db.streakRecords.clear(),
      ]);

      // Bulk-add imported data
      await Promise.all([
        db.incomeEntries.bulkAdd(data.finance.incomeEntries),
        db.expenseCategories.bulkAdd(data.finance.expenseCategories),
        db.expenses.bulkAdd(data.finance.expenses),
        db.habitGroups.bulkAdd(data.habits.habitGroups),
        db.habitCategories.bulkAdd(data.habits.habitCategories),
        db.habits.bulkAdd(data.habits.habits),
        db.habitCompletions.bulkAdd(data.habits.habitCompletions),
        db.streakRecords.bulkAdd(data.habits.streakRecords),
      ]);
    }
  );
}
