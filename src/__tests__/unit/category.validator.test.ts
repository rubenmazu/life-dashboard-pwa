import { describe, it, expect } from 'vitest';
import {
  validateCategoryName,
  validateBudgetLimit,
  validateCategory,
} from '../../utils/validators/category.validator';

describe('category.validator', () => {
  describe('validateCategoryName', () => {
    it('rejects empty name', () => {
      const result = validateCategoryName('', []);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Category name is required');
    });

    it('accepts a single character name', () => {
      const result = validateCategoryName('A', []);
      expect(result.valid).toBe(true);
      expect(result.error).toBeNull();
    });

    it('accepts a name at the 50 character limit', () => {
      const name = 'a'.repeat(50);
      const result = validateCategoryName(name, []);
      expect(result.valid).toBe(true);
      expect(result.error).toBeNull();
    });

    it('rejects a name exceeding 50 characters', () => {
      const name = 'a'.repeat(51);
      const result = validateCategoryName(name, []);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Category name must be at most 50 characters');
    });

    it('accepts a unique name', () => {
      const result = validateCategoryName('Food', ['Transport', 'Housing']);
      expect(result.valid).toBe(true);
      expect(result.error).toBeNull();
    });

    it('rejects a duplicate name (exact match)', () => {
      const result = validateCategoryName('Food', ['Food', 'Transport']);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('A category with this name already exists');
    });

    it('rejects a duplicate name (case-insensitive)', () => {
      const result = validateCategoryName('food', ['Food', 'Transport']);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('A category with this name already exists');
    });

    it('rejects a duplicate name (uppercase vs lowercase)', () => {
      const result = validateCategoryName('FOOD', ['food']);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('A category with this name already exists');
    });

    it('accepts name when existingNames is empty', () => {
      const result = validateCategoryName('Groceries', []);
      expect(result.valid).toBe(true);
      expect(result.error).toBeNull();
    });
  });

  describe('validateBudgetLimit', () => {
    it('accepts the minimum budget (0.01)', () => {
      const result = validateBudgetLimit(0.01);
      expect(result.valid).toBe(true);
      expect(result.error).toBeNull();
    });

    it('accepts the maximum budget (999,999,999.99)', () => {
      const result = validateBudgetLimit(999_999_999.99);
      expect(result.valid).toBe(true);
      expect(result.error).toBeNull();
    });

    it('accepts a typical budget value', () => {
      const result = validateBudgetLimit(500);
      expect(result.valid).toBe(true);
      expect(result.error).toBeNull();
    });

    it('rejects zero', () => {
      const result = validateBudgetLimit(0);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Budget limit must be between 0.01 and 999,999,999.99');
    });

    it('rejects negative values', () => {
      const result = validateBudgetLimit(-1);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Budget limit must be between 0.01 and 999,999,999.99');
    });

    it('rejects values exceeding the maximum', () => {
      const result = validateBudgetLimit(1_000_000_000);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Budget limit must be between 0.01 and 999,999,999.99');
    });
  });

  describe('validateCategory', () => {
    it('passes when both name and budget are valid', () => {
      const result = validateCategory('Food', 500, []);
      expect(result.valid).toBe(true);
      expect(result.error).toBeNull();
    });

    it('fails with name error when name is empty', () => {
      const result = validateCategory('', 500, []);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Category name is required');
    });

    it('fails with name error when name is too long', () => {
      const name = 'x'.repeat(51);
      const result = validateCategory(name, 500, []);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Category name must be at most 50 characters');
    });

    it('fails with name error when name is a duplicate', () => {
      const result = validateCategory('Food', 500, ['food']);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('A category with this name already exists');
    });

    it('fails with budget error when budget is zero', () => {
      const result = validateCategory('Food', 0, []);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Budget limit must be between 0.01 and 999,999,999.99');
    });

    it('fails with budget error when budget exceeds maximum', () => {
      const result = validateCategory('Food', 1_000_000_000, []);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Budget limit must be between 0.01 and 999,999,999.99');
    });

    it('returns name error before budget error when both are invalid', () => {
      const result = validateCategory('', 0, []);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Category name is required');
    });
  });
});
