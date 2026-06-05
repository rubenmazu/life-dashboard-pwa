import type { ValidationResult } from './income.validator';

const MAX_HABIT_NAME_LENGTH = 100;
const MAX_CATEGORY_NAME_LENGTH = 50;
const MAX_GROUP_NAME_LENGTH = 50;

/**
 * Validates a habit name.
 * Valid if length is between 1 and 100 characters (inclusive).
 */
export function validateHabitName(name: string): ValidationResult {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: 'Habit name is required' };
  }
  if (name.length > MAX_HABIT_NAME_LENGTH) {
    return { valid: false, error: 'Habit name must be at most 100 characters' };
  }
  return { valid: true, error: null };
}

/**
 * Validates a habit category name.
 * Valid if length is between 1 and 50 characters and unique (case-insensitive) within the group.
 */
export function validateHabitCategoryName(
  name: string,
  existingNamesInGroup: string[]
): ValidationResult {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: 'Category name is required' };
  }
  if (name.length > MAX_CATEGORY_NAME_LENGTH) {
    return { valid: false, error: 'Category name must be at most 50 characters' };
  }
  const lowerName = name.toLowerCase();
  const isDuplicate = existingNamesInGroup.some(
    (existing) => existing.toLowerCase() === lowerName
  );
  if (isDuplicate) {
    return { valid: false, error: 'A category with this name already exists in this group' };
  }
  return { valid: true, error: null };
}

/**
 * Validates a habit group name.
 * Valid if length is between 1 and 50 characters and unique (case-insensitive) within the profile.
 */
export function validateHabitGroupName(
  name: string,
  existingGroupNames: string[]
): ValidationResult {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: 'Group name is required' };
  }
  if (name.length > MAX_GROUP_NAME_LENGTH) {
    return { valid: false, error: 'Group name must be at most 50 characters' };
  }
  const lowerName = name.toLowerCase();
  const isDuplicate = existingGroupNames.some(
    (existing) => existing.toLowerCase() === lowerName
  );
  if (isDuplicate) {
    return { valid: false, error: 'A group with this name already exists' };
  }
  return { valid: true, error: null };
}
