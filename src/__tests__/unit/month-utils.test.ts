import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  getMonthLabel,
  isWithinRange,
  getNextMonth,
  getPrevMonth,
  getCurrentMonth,
} from '../../utils/month-utils';

describe('month-utils', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  describe('getMonthLabel', () => {
    it('returns formatted label for January 2025', () => {
      expect(getMonthLabel(2025, 1)).toBe('January 2025');
    });

    it('returns formatted label for December 2024', () => {
      expect(getMonthLabel(2024, 12)).toBe('December 2024');
    });

    it('returns formatted label for June 2023', () => {
      expect(getMonthLabel(2023, 6)).toBe('June 2023');
    });
  });

  describe('isWithinRange', () => {
    it('allows the current month', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2025, 5, 15)); // June 2025
      expect(isWithinRange(2025, 6)).toBe(true);
    });

    it('allows past months', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2025, 5, 15)); // June 2025
      expect(isWithinRange(2024, 1)).toBe(true);
      expect(isWithinRange(2020, 3)).toBe(true);
    });

    it('allows up to 12 months in the future', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2025, 5, 15)); // June 2025
      // 12 months ahead = June 2026
      expect(isWithinRange(2026, 6)).toBe(true);
    });

    it('disallows more than 12 months in the future', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2025, 5, 15)); // June 2025
      // 13 months ahead = July 2026
      expect(isWithinRange(2026, 7)).toBe(false);
    });

    it('allows exactly 12 months ahead at year boundary', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2025, 0, 1)); // January 2025
      // 12 months ahead = January 2026
      expect(isWithinRange(2026, 1)).toBe(true);
      // 13 months ahead = February 2026
      expect(isWithinRange(2026, 2)).toBe(false);
    });
  });

  describe('getNextMonth', () => {
    it('returns next month within same year', () => {
      expect(getNextMonth(2025, 3)).toEqual({ year: 2025, month: 4 });
    });

    it('wraps from December to January of next year', () => {
      expect(getNextMonth(2025, 12)).toEqual({ year: 2026, month: 1 });
    });
  });

  describe('getPrevMonth', () => {
    it('returns previous month within same year', () => {
      expect(getPrevMonth(2025, 6)).toEqual({ year: 2025, month: 5 });
    });

    it('wraps from January to December of previous year', () => {
      expect(getPrevMonth(2025, 1)).toEqual({ year: 2024, month: 12 });
    });
  });

  describe('getCurrentMonth', () => {
    it('returns current month and year', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2025, 7, 20)); // August 2025
      expect(getCurrentMonth()).toEqual({ year: 2025, month: 8 });
    });
  });
});
