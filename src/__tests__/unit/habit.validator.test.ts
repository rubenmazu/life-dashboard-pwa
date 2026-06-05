import { describe, it, expect } from 'vitest';
import {
  validateHabitName,
  validateHabitCategoryName,
  validateHabitGroupName,
} from '../../utils/validators/habit.validator';

describe('habit.validator', () => {
  describe('validateHabitName', () => {
    it('returns valid for a normal habit name', () => {
      expect(validateHabitName('Morning Run')).toEqual({ valid: true, error: null });
    });

    it('returns valid for a single character name', () => {
      expect(validateHabitName('A')).toEqual({ valid: true, error: null });
    });

    it('returns valid for exactly 100 characters', () => {
      const name = 'a'.repeat(100);
      expect(validateHabitName(name)).toEqual({ valid: true, error: null });
    });

    it('returns error for an empty string', () => {
      expect(validateHabitName('')).toEqual({
        valid: false,
        error: 'Habit name is required',
      });
    });

    it('returns error for a whitespace-only string', () => {
      expect(validateHabitName('   ')).toEqual({
        valid: false,
        error: 'Habit name is required',
      });
    });

    it('returns error for a name exceeding 100 characters', () => {
      const name = 'a'.repeat(101);
      expect(validateHabitName(name)).toEqual({
        valid: false,
        error: 'Habit name must be at most 100 characters',
      });
    });
  });

  describe('validateHabitCategoryName', () => {
    it('returns valid for a unique category name', () => {
      expect(validateHabitCategoryName('Health', ['Fitness', 'Learning'])).toEqual({
        valid: true,
        error: null,
      });
    });

    it('returns valid for a single character name', () => {
      expect(validateHabitCategoryName('X', [])).toEqual({ valid: true, error: null });
    });

    it('returns valid for exactly 50 characters', () => {
      const name = 'b'.repeat(50);
      expect(validateHabitCategoryName(name, [])).toEqual({ valid: true, error: null });
    });

    it('returns error for an empty string', () => {
      expect(validateHabitCategoryName('', [])).toEqual({
        valid: false,
        error: 'Category name is required',
      });
    });

    it('returns error for a whitespace-only string', () => {
      expect(validateHabitCategoryName('  ', [])).toEqual({
        valid: false,
        error: 'Category name is required',
      });
    });

    it('returns error for a name exceeding 50 characters', () => {
      const name = 'c'.repeat(51);
      expect(validateHabitCategoryName(name, [])).toEqual({
        valid: false,
        error: 'Category name must be at most 50 characters',
      });
    });

    it('returns error for a duplicate name (exact match)', () => {
      expect(validateHabitCategoryName('Health', ['Health', 'Fitness'])).toEqual({
        valid: false,
        error: 'A category with this name already exists in this group',
      });
    });

    it('returns error for a duplicate name (case-insensitive)', () => {
      expect(validateHabitCategoryName('health', ['Health', 'Fitness'])).toEqual({
        valid: false,
        error: 'A category with this name already exists in this group',
      });
    });

    it('returns valid when no existing names', () => {
      expect(validateHabitCategoryName('New Category', [])).toEqual({
        valid: true,
        error: null,
      });
    });
  });

  describe('validateHabitGroupName', () => {
    it('returns valid for a unique group name', () => {
      expect(validateHabitGroupName('Morning Routine', ['Evening Routine'])).toEqual({
        valid: true,
        error: null,
      });
    });

    it('returns valid for a single character name', () => {
      expect(validateHabitGroupName('Z', [])).toEqual({ valid: true, error: null });
    });

    it('returns valid for exactly 50 characters', () => {
      const name = 'd'.repeat(50);
      expect(validateHabitGroupName(name, [])).toEqual({ valid: true, error: null });
    });

    it('returns error for an empty string', () => {
      expect(validateHabitGroupName('', [])).toEqual({
        valid: false,
        error: 'Group name is required',
      });
    });

    it('returns error for a whitespace-only string', () => {
      expect(validateHabitGroupName('   ', [])).toEqual({
        valid: false,
        error: 'Group name is required',
      });
    });

    it('returns error for a name exceeding 50 characters', () => {
      const name = 'e'.repeat(51);
      expect(validateHabitGroupName(name, [])).toEqual({
        valid: false,
        error: 'Group name must be at most 50 characters',
      });
    });

    it('returns error for a duplicate name (exact match)', () => {
      expect(validateHabitGroupName('Morning', ['Morning', 'Evening'])).toEqual({
        valid: false,
        error: 'A group with this name already exists',
      });
    });

    it('returns error for a duplicate name (case-insensitive)', () => {
      expect(validateHabitGroupName('MORNING', ['Morning', 'Evening'])).toEqual({
        valid: false,
        error: 'A group with this name already exists',
      });
    });

    it('returns valid when no existing group names', () => {
      expect(validateHabitGroupName('New Group', [])).toEqual({
        valid: true,
        error: null,
      });
    });
  });
});
