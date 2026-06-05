/**
 * Month Navigation Utilities
 * Requirement 5.5: Navigation allowed for any past month and up to 12 months in the future.
 */

export interface MonthYear {
  year: number;
  month: number; // 1-12
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/**
 * Returns formatted month label, e.g. "January 2025"
 */
export function getMonthLabel(year: number, month: number): string {
  return `${MONTH_NAMES[month - 1]} ${year}`;
}

/**
 * Checks if a given month/year is within the allowed navigation range.
 * Allowed: any past month, current month, or up to 12 months in the future.
 */
export function isWithinRange(year: number, month: number): boolean {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-based

  // Calculate months difference from current month
  const targetMonths = year * 12 + month;
  const currentMonths = currentYear * 12 + currentMonth;
  const diff = targetMonths - currentMonths;

  // Allow any past month (diff <= 0) and up to 12 months in the future (diff <= 12)
  return diff <= 12;
}

/**
 * Returns the next month from a given year/month.
 */
export function getNextMonth(year: number, month: number): MonthYear {
  if (month === 12) {
    return { year: year + 1, month: 1 };
  }
  return { year, month: month + 1 };
}

/**
 * Returns the previous month from a given year/month.
 */
export function getPrevMonth(year: number, month: number): MonthYear {
  if (month === 1) {
    return { year: year - 1, month: 12 };
  }
  return { year, month: month - 1 };
}

/**
 * Returns the current month as a MonthYear object.
 */
export function getCurrentMonth(): MonthYear {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}
