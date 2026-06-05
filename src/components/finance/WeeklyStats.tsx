import { useState, useMemo, useCallback } from 'react';
import { MonthSelector } from '@/components/shared/MonthSelector';
import { EmptyState } from '@/components/shared';
import { useExpenses } from '@/hooks/useExpenses';
import { useCategories } from '@/hooks/useCategories';
import { getCurrentMonth, type MonthYear } from '@/utils/month-utils';
import { calculateWeeklyStats, type WeekPartition } from '@/utils/week-partitioner';

/**
 * WeeklyStats — Weekly spending breakdown with budget comparison.
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5
 *
 * Displays weekly spending totals, proportional budget comparison,
 * over-budget indicators, and per-week category breakdowns.
 */
export function WeeklyStats() {
  const [selectedMonth, setSelectedMonth] = useState<MonthYear>(getCurrentMonth());
  const [expandedWeek, setExpandedWeek] = useState<number | null>(null);

  const monthStr = `${selectedMonth.year}-${String(selectedMonth.month).padStart(2, '0')}`;
  const { expenses } = useExpenses(monthStr);
  const { categories } = useCategories();

  const weeklyStats = useMemo(
    () => calculateWeeklyStats(expenses, categories, selectedMonth.year, selectedMonth.month),
    [expenses, categories, selectedMonth.year, selectedMonth.month]
  );

  const handleMonthChange = useCallback((newMonth: MonthYear) => {
    setSelectedMonth(newMonth);
    setExpandedWeek(null);
  }, []);

  const handleWeekToggle = useCallback((weekNumber: number) => {
    setExpandedWeek((prev) => (prev === weekNumber ? null : weekNumber));
  }, []);

  const hasExpenses = expenses.length > 0;

  return (
    <div className="flex flex-col h-full">
      {/* Month navigation */}
      <MonthSelector selectedMonth={selectedMonth} onChange={handleMonthChange} />

      {/* Weekly breakdown */}
      <div className="flex-1 overflow-y-auto px-4 pb-24">
        {!hasExpenses ? (
          <EmptyState
            icon={<span>📊</span>}
            title="No expenses this month"
            description="Add expenses to see your weekly spending breakdown."
          />
        ) : (
          <div className="space-y-3">
            {weeklyStats.map((week) => (
              <WeekCard
                key={week.weekNumber}
                week={week}
                isExpanded={expandedWeek === week.weekNumber}
                onToggle={() => handleWeekToggle(week.weekNumber)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface WeekCardProps {
  week: WeekPartition;
  isExpanded: boolean;
  onToggle: () => void;
}

function WeekCard({ week, isExpanded, onToggle }: WeekCardProps) {
  const budgetRatio = week.proportionalBudget > 0
    ? Math.min(week.totalSpending / week.proportionalBudget, 1.5)
    : 0;
  const budgetPercentage = Math.min(budgetRatio * 100, 100);

  const formatDateRange = (startDate: string, endDate: string): string => {
    const startDay = parseInt(startDate.slice(8, 10), 10);
    const endDay = parseInt(endDate.slice(8, 10), 10);
    const monthIdx = parseInt(startDate.slice(5, 7), 10) - 1;
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    return `${monthNames[monthIdx]} ${startDay}–${endDay}`;
  };

  return (
    <div className="ios-card">
      {/* Week header - tappable */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-2 text-left"
        style={{ minHeight: '44px' }}
        aria-expanded={isExpanded}
        aria-label={`Week ${week.weekNumber} details`}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className="text-[15px] font-semibold"
              style={{ color: 'var(--color-ios-text-primary)' }}
            >
              Week {week.weekNumber}
            </span>
            <span
              className="text-[13px]"
              style={{ color: 'var(--color-ios-text-tertiary)' }}
            >
              ({formatDateRange(week.startDate, week.endDate)})
            </span>
          </div>

          {/* Spending vs Budget */}
          <div className="flex items-center gap-2 mt-1">
            <span
              className="text-[15px] font-medium"
              style={{ color: week.isOverBudget ? 'var(--color-ios-red)' : 'var(--color-ios-text-primary)' }}
            >
              {week.totalSpending.toFixed(2)}
            </span>
            <span
              className="text-[13px]"
              style={{ color: 'var(--color-ios-text-tertiary)' }}
            >
              / {week.proportionalBudget.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Over-budget indicator + chevron */}
        <div className="flex items-center gap-2 shrink-0">
          {week.isOverBudget && (
            <span
              className="flex items-center gap-1 text-[12px] font-medium px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: 'rgba(255, 59, 48, 0.1)',
                color: 'var(--color-ios-red)',
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-3 h-3"
              >
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              Over
            </span>
          )}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`w-4 h-4 transition-transform duration-[var(--duration-fast)] ease-[var(--ease-ios)] ${isExpanded ? 'rotate-90' : ''}`}
            style={{ color: 'var(--color-ios-text-tertiary)' }}
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </div>
      </button>

      {/* Progress bar */}
      <div
        className="mt-2 h-2 rounded-full overflow-hidden"
        style={{ backgroundColor: 'var(--color-ios-separator)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-[var(--duration-normal)] ease-[var(--ease-ios)]"
          style={{
            width: `${budgetPercentage}%`,
            backgroundColor: week.isOverBudget
              ? 'var(--color-ios-red)'
              : budgetRatio > 0.8
                ? 'var(--color-ios-orange)'
                : 'var(--color-ios-green)',
          }}
        />
      </div>

      {/* Expanded category breakdown */}
      {isExpanded && (
        <div
          className="mt-3 pt-3"
          style={{ borderTop: '0.5px solid var(--color-ios-separator)' }}
        >
          {week.categoryBreakdown.length === 0 ? (
            <p
              className="text-[13px] text-center py-2"
              style={{ color: 'var(--color-ios-text-tertiary)' }}
            >
              No expenses this week
            </p>
          ) : (
            <div className="space-y-2">
              {week.categoryBreakdown.map((cat) => (
                <CategoryRow
                  key={cat.categoryId}
                  name={cat.categoryName}
                  amount={cat.amount}
                  percentage={cat.percentage}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface CategoryRowProps {
  name: string;
  amount: number;
  percentage: number;
}

function CategoryRow({ name, amount, percentage }: CategoryRowProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span
            className="text-[13px] font-medium truncate"
            style={{ color: 'var(--color-ios-text-primary)' }}
          >
            {name}
          </span>
          <div className="flex items-center gap-2 shrink-0 ml-2">
            <span
              className="text-[13px]"
              style={{ color: 'var(--color-ios-text-secondary)' }}
            >
              {amount.toFixed(2)}
            </span>
            <span
              className="text-[12px] font-medium"
              style={{ color: 'var(--color-ios-blue)' }}
            >
              {percentage}%
            </span>
          </div>
        </div>
        {/* Percentage bar */}
        <div
          className="h-1.5 rounded-full overflow-hidden"
          style={{ backgroundColor: 'var(--color-ios-separator)' }}
        >
          <div
            className="h-full rounded-full"
            style={{
              width: `${percentage}%`,
              backgroundColor: 'var(--color-ios-blue)',
              transition: `width var(--duration-normal) var(--ease-ios)`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
