export interface ValidationResult {
  valid: boolean;
  error: string | null;
}

const MIN_NAME_LENGTH = 1;
const MAX_NAME_LENGTH = 50;
const MIN_BUDGET = 0.01;
const MAX_BUDGET = 999_999_999.99;

/**
 * Validate a category name against length and uniqueness rules.
 * - Name must be between 1 and 50 characters.
 * - Name must be unique (case-insensitive) among existingNames.
 */
export function validateCategoryName(
  name: string,
  existingNames: string[]
): ValidationResult {
  if (name.length < MIN_NAME_LENGTH) {
    return { valid: false, error: 'Category name is required' };
  }

  if (name.length > MAX_NAME_LENGTH) {
    return { valid: false, error: 'Category name must be at most 50 characters' };
  }

  const nameLower = name.toLowerCase();
  const isDuplicate = existingNames.some(
    (existing) => existing.toLowerCase() === nameLower
  );

  if (isDuplicate) {
    return { valid: false, error: 'A category with this name already exists' };
  }

  return { valid: true, error: null };
}

/**
 * Validate a budget limit value.
 * - Must be between 0.01 and 999,999,999.99 inclusive.
 */
export function validateBudgetLimit(budgetLimit: number): ValidationResult {
  if (budgetLimit < MIN_BUDGET || budgetLimit > MAX_BUDGET) {
    return {
      valid: false,
      error: 'Budget limit must be between 0.01 and 999,999,999.99',
    };
  }

  return { valid: true, error: null };
}

/**
 * Validate both category name and budget limit together.
 * Returns the first validation error encountered (name checked first).
 */
export function validateCategory(
  name: string,
  budgetLimit: number,
  existingNames: string[]
): ValidationResult {
  const nameResult = validateCategoryName(name, existingNames);
  if (!nameResult.valid) {
    return nameResult;
  }

  const budgetResult = validateBudgetLimit(budgetLimit);
  if (!budgetResult.valid) {
    return budgetResult;
  }

  return { valid: true, error: null };
}
