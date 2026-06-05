export interface ValidationResult {
  valid: boolean;
  error: string | null;
}

const MIN_AMOUNT = 0.01;
const MAX_AMOUNT = 999_999_999.99;
const MAX_SOURCE_LENGTH = 100;

/**
 * Validates an income amount.
 * Valid if between 0.01 and 999,999,999.99 (inclusive).
 */
export function validateIncomeAmount(amount: number): ValidationResult {
  if (amount < MIN_AMOUNT || amount > MAX_AMOUNT || !Number.isFinite(amount)) {
    return { valid: false, error: 'Amount must be between 0.01 and 999,999,999.99' };
  }
  return { valid: true, error: null };
}

/**
 * Validates an income source description.
 * Valid if length is between 1 and 100 characters (inclusive), non-empty.
 */
export function validateIncomeSource(source: string): ValidationResult {
  if (!source || source.trim().length === 0) {
    return { valid: false, error: 'Source description is required' };
  }
  if (source.length > MAX_SOURCE_LENGTH) {
    return { valid: false, error: 'Source description must be at most 100 characters' };
  }
  return { valid: true, error: null };
}

/**
 * Validates both amount and source for an income entry.
 * Returns the first error found.
 */
export function validateIncomeEntry(amount: number, source: string): ValidationResult {
  const amountResult = validateIncomeAmount(amount);
  if (!amountResult.valid) {
    return amountResult;
  }

  const sourceResult = validateIncomeSource(source);
  if (!sourceResult.valid) {
    return sourceResult;
  }

  return { valid: true, error: null };
}
