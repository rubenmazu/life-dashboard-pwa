import { describe, it, expect } from 'vitest';
import {
  validateIncomeAmount,
  validateIncomeSource,
  validateIncomeEntry,
} from '../../utils/validators/income.validator';

describe('validateIncomeAmount', () => {
  it('returns valid for minimum amount 0.01', () => {
    const result = validateIncomeAmount(0.01);
    expect(result.valid).toBe(true);
    expect(result.error).toBeNull();
  });

  it('returns valid for maximum amount 999,999,999.99', () => {
    const result = validateIncomeAmount(999_999_999.99);
    expect(result.valid).toBe(true);
    expect(result.error).toBeNull();
  });

  it('returns valid for a typical amount', () => {
    const result = validateIncomeAmount(5000);
    expect(result.valid).toBe(true);
    expect(result.error).toBeNull();
  });

  it('returns invalid for 0', () => {
    const result = validateIncomeAmount(0);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Amount must be between 0.01 and 999,999,999.99');
  });

  it('returns invalid for negative amount -1', () => {
    const result = validateIncomeAmount(-1);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Amount must be between 0.01 and 999,999,999.99');
  });

  it('returns invalid for amount exceeding max (1,000,000,000)', () => {
    const result = validateIncomeAmount(1_000_000_000);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Amount must be between 0.01 and 999,999,999.99');
  });

  it('returns invalid for NaN', () => {
    const result = validateIncomeAmount(NaN);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Amount must be between 0.01 and 999,999,999.99');
  });

  it('returns invalid for Infinity', () => {
    const result = validateIncomeAmount(Infinity);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Amount must be between 0.01 and 999,999,999.99');
  });
});

describe('validateIncomeSource', () => {
  it('returns valid for a single character source', () => {
    const result = validateIncomeSource('A');
    expect(result.valid).toBe(true);
    expect(result.error).toBeNull();
  });

  it('returns valid for exactly 100 characters', () => {
    const source = 'a'.repeat(100);
    const result = validateIncomeSource(source);
    expect(result.valid).toBe(true);
    expect(result.error).toBeNull();
  });

  it('returns valid for a typical source', () => {
    const result = validateIncomeSource('Monthly Salary');
    expect(result.valid).toBe(true);
    expect(result.error).toBeNull();
  });

  it('returns invalid for empty string', () => {
    const result = validateIncomeSource('');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Source description is required');
  });

  it('returns invalid for whitespace-only string', () => {
    const result = validateIncomeSource('   ');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Source description is required');
  });

  it('returns invalid for 101 characters', () => {
    const source = 'a'.repeat(101);
    const result = validateIncomeSource(source);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Source description must be at most 100 characters');
  });
});

describe('validateIncomeEntry', () => {
  it('returns valid for valid amount and source', () => {
    const result = validateIncomeEntry(1500, 'Freelance work');
    expect(result.valid).toBe(true);
    expect(result.error).toBeNull();
  });

  it('returns amount error first when both are invalid', () => {
    const result = validateIncomeEntry(0, '');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Amount must be between 0.01 and 999,999,999.99');
  });

  it('returns source error when amount is valid but source is empty', () => {
    const result = validateIncomeEntry(100, '');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Source description is required');
  });

  it('returns source error when amount is valid but source is too long', () => {
    const result = validateIncomeEntry(100, 'x'.repeat(101));
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Source description must be at most 100 characters');
  });

  it('returns amount error when amount is invalid but source is valid', () => {
    const result = validateIncomeEntry(-5, 'Salary');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Amount must be between 0.01 and 999,999,999.99');
  });
});
