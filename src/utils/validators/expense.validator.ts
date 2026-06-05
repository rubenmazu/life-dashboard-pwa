import type { ValidationResult } from './income.validator';

const MIN_AMOUNT = 0.01;
const MAX_AMOUNT = 9_999_999.99;
const MAX_NOTES_LENGTH = 200;

/**
 * Validates an expense amount.
 * Valid if between 0.01 and 9,999,999.99 (inclusive).
 * Requirements: 7.1, 7.5
 */
export function validateExpenseAmount(amount: number): ValidationResult {
  if (!Number.isFinite(amount) || amount < MIN_AMOUNT || amount > MAX_AMOUNT) {
    return { valid: false, error: 'Amount must be between 0.01 and 9,999,999.99' };
  }
  return { valid: true, error: null };
}

/**
 * Validates an expense category selection.
 * Must be non-empty and exist in the provided valid category IDs.
 * Requirements: 7.4
 */
export function validateExpenseCategory(
  categoryId: string,
  validCategoryIds: string[]
): ValidationResult {
  if (!categoryId || !validCategoryIds.includes(categoryId)) {
    return { valid: false, error: 'Please select a category' };
  }
  return { valid: true, error: null };
}

/**
 * Validates an expense date.
 * Must be in "YYYY-MM-DD" format, fall within the selectedMonth ("YYYY-MM"),
 * and not be in the future.
 * Requirements: 7.3
 */
export function validateExpenseDate(
  date: string,
  selectedMonth: string
): ValidationResult {
  // Validate format: YYYY-MM-DD
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) {
    return { valid: false, error: 'Date must be within the selected month' };
  }

  // Parse and validate it's a real date
  const [yearStr, monthStr, dayStr] = date.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);
  const parsed = new Date(year, month - 1, day);

  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return { valid: false, error: 'Date must be within the selected month' };
  }

  // Validate date falls within selected month (YYYY-MM)
  const dateMonth = date.substring(0, 7); // "YYYY-MM"
  if (dateMonth !== selectedMonth) {
    return { valid: false, error: 'Date must be within the selected month' };
  }

  // Validate not in the future
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  parsed.setHours(0, 0, 0, 0);
  if (parsed > today) {
    return { valid: false, error: 'Date cannot be in the future' };
  }

  return { valid: true, error: null };
}

/**
 * Validates expense notes.
 * Valid if 0-200 characters (notes are optional).
 * Requirements: 7.1
 */
export function validateExpenseNotes(notes: string): ValidationResult {
  if (notes.length > MAX_NOTES_LENGTH) {
    return { valid: false, error: 'Notes must be at most 200 characters' };
  }
  return { valid: true, error: null };
}

/**
 * Validates all expense fields.
 * Returns the first validation error found.
 * Requirements: 7.1, 7.3, 7.4, 7.5
 */
export function validateExpense(
  amount: number,
  categoryId: string,
  date: string,
  notes: string,
  selectedMonth: string,
  validCategoryIds: string[]
): ValidationResult {
  const amountResult = validateExpenseAmount(amount);
  if (!amountResult.valid) {
    return amountResult;
  }

  const categoryResult = validateExpenseCategory(categoryId, validCategoryIds);
  if (!categoryResult.valid) {
    return categoryResult;
  }

  const dateResult = validateExpenseDate(date, selectedMonth);
  if (!dateResult.valid) {
    return dateResult;
  }

  const notesResult = validateExpenseNotes(notes);
  if (!notesResult.valid) {
    return notesResult;
  }

  return { valid: true, error: null };
}
