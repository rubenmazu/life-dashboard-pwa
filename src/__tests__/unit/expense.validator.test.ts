import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  validateExpenseAmount,
  validateExpenseCategory,
  validateExpenseDate,
  validateExpenseNotes,
  validateExpense,
} from '../../utils/validators/expense.validator';

describe('expense.validator', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  describe('validateExpenseAmount', () => {
    it('accepts minimum valid amount 0.01', () => {
      expect(validateExpenseAmount(0.01)).toEqual({ valid: true, error: null });
    });

    it('accepts maximum valid amount 9,999,999.99', () => {
      expect(validateExpenseAmount(9_999_999.99)).toEqual({ valid: true, error: null });
    });

    it('accepts a typical amount', () => {
      expect(validateExpenseAmount(42.50)).toEqual({ valid: true, error: null });
    });

    it('rejects zero', () => {
      const result = validateExpenseAmount(0);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Amount must be between 0.01 and 9,999,999.99');
    });

    it('rejects negative amounts', () => {
      const result = validateExpenseAmount(-5);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Amount must be between 0.01 and 9,999,999.99');
    });

    it('rejects amounts exceeding max', () => {
      const result = validateExpenseAmount(10_000_000);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Amount must be between 0.01 and 9,999,999.99');
    });

    it('rejects NaN', () => {
      const result = validateExpenseAmount(NaN);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Amount must be between 0.01 and 9,999,999.99');
    });

    it('rejects Infinity', () => {
      const result = validateExpenseAmount(Infinity);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Amount must be between 0.01 and 9,999,999.99');
    });
  });

  describe('validateExpenseCategory', () => {
    const validIds = ['cat-1', 'cat-2', 'cat-3'];

    it('accepts a valid category ID that exists in the list', () => {
      expect(validateExpenseCategory('cat-1', validIds)).toEqual({ valid: true, error: null });
    });

    it('rejects an empty string', () => {
      const result = validateExpenseCategory('', validIds);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Please select a category');
    });

    it('rejects a category ID not in the valid list', () => {
      const result = validateExpenseCategory('cat-999', validIds);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Please select a category');
    });

    it('rejects when validCategoryIds is empty', () => {
      const result = validateExpenseCategory('cat-1', []);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Please select a category');
    });
  });

  describe('validateExpenseDate', () => {
    it('accepts a valid date within the selected month and not in the future', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2025, 5, 15)); // June 15, 2025
      expect(validateExpenseDate('2025-06-10', '2025-06')).toEqual({ valid: true, error: null });
    });

    it('accepts today as a valid date', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2025, 5, 15)); // June 15, 2025
      expect(validateExpenseDate('2025-06-15', '2025-06')).toEqual({ valid: true, error: null });
    });

    it('accepts the first day of the selected month', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2025, 5, 15)); // June 15, 2025
      expect(validateExpenseDate('2025-06-01', '2025-06')).toEqual({ valid: true, error: null });
    });

    it('rejects a date outside the selected month', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2025, 5, 15)); // June 15, 2025
      const result = validateExpenseDate('2025-05-15', '2025-06');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Date must be within the selected month');
    });

    it('rejects a future date', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2025, 5, 15)); // June 15, 2025
      const result = validateExpenseDate('2025-06-20', '2025-06');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Date cannot be in the future');
    });

    it('rejects an invalid date format', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2025, 5, 15));
      const result = validateExpenseDate('15-06-2025', '2025-06');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Date must be within the selected month');
    });

    it('rejects an invalid date like Feb 30', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2025, 2, 15)); // March 15, 2025
      const result = validateExpenseDate('2025-02-30', '2025-02');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Date must be within the selected month');
    });

    it('accepts a past month date when today is later', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2025, 5, 15)); // June 15, 2025
      expect(validateExpenseDate('2025-05-20', '2025-05')).toEqual({ valid: true, error: null });
    });
  });

  describe('validateExpenseNotes', () => {
    it('accepts empty notes', () => {
      expect(validateExpenseNotes('')).toEqual({ valid: true, error: null });
    });

    it('accepts notes within limit', () => {
      expect(validateExpenseNotes('Grocery shopping')).toEqual({ valid: true, error: null });
    });

    it('accepts notes at exactly 200 characters', () => {
      const notes = 'a'.repeat(200);
      expect(validateExpenseNotes(notes)).toEqual({ valid: true, error: null });
    });

    it('rejects notes exceeding 200 characters', () => {
      const notes = 'a'.repeat(201);
      const result = validateExpenseNotes(notes);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Notes must be at most 200 characters');
    });
  });

  describe('validateExpense', () => {
    const validIds = ['cat-1', 'cat-2'];

    it('accepts a fully valid expense', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2025, 5, 15)); // June 15, 2025
      const result = validateExpense(50, 'cat-1', '2025-06-10', 'Lunch', '2025-06', validIds);
      expect(result).toEqual({ valid: true, error: null });
    });

    it('returns amount error first when amount is invalid', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2025, 5, 15));
      const result = validateExpense(0, 'cat-1', '2025-06-10', 'Lunch', '2025-06', validIds);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Amount must be between 0.01 and 9,999,999.99');
    });

    it('returns category error when category is invalid', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2025, 5, 15));
      const result = validateExpense(50, 'invalid', '2025-06-10', 'Lunch', '2025-06', validIds);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Please select a category');
    });

    it('returns date error when date is outside month', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2025, 5, 15));
      const result = validateExpense(50, 'cat-1', '2025-05-10', 'Lunch', '2025-06', validIds);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Date must be within the selected month');
    });

    it('returns notes error when notes are too long', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2025, 5, 15));
      const longNotes = 'a'.repeat(201);
      const result = validateExpense(50, 'cat-1', '2025-06-10', longNotes, '2025-06', validIds);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Notes must be at most 200 characters');
    });

    it('accepts expense with empty notes', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2025, 5, 15));
      const result = validateExpense(50, 'cat-1', '2025-06-10', '', '2025-06', validIds);
      expect(result).toEqual({ valid: true, error: null });
    });
  });
});
