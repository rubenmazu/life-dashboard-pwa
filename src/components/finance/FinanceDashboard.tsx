import { useState, useMemo } from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { MonthSelector } from '@/components/shared/MonthSelector';
import { EmptyState } from '@/components/shared/EmptyState';
import { useExpenses } from '@/hooks/useExpenses';
import { useIncome } from '@/hooks/useIncome';
import { useCategories } from '@/hooks/useCategories';
import { calculateMonthSummary, calculateCategorySpending } from '@/utils/budget-calculator';
import { getCurrentMonth, type MonthYear } from '@/utils/month-utils';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

/**
 * FinanceDashboard — Visual overview of monthly finances.
 * Displays income/expense summary, spending-per-category doughnut chart,
 * and budget progress bars for each category.
 *
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8
 */
export function FinanceDashboard() {
  const [selectedMonth, setSelectedMonth] = useState<MonthYear>(getCurrentMonth);

  const monthString = `${selectedMonth.year}-${String(selectedMonth.month).padStart(2, '0')}`;

  const { expenses } = useExpenses(monthString);
  const { incomeEntries } = useIncome(monthString);
  const { categories } = useCategories();

  const monthSummary = useMemo(
    () => calculateMonthSummary(incomeEntries, expenses),
    [incomeEntries, expenses]
  );

  const categorySpending = useMemo(
    () => calculateCategorySpending(expenses, categories),
    [expenses, categories]
  );

  const hasData = incomeEntries.length > 0 || expenses.length > 0;

  // Chart colors for categories
  const chartColors = [
    'var(--color-ios-blue)',
    'var(--color-ios-green)',
    'var(--color-ios-orange)',
    'var(--color-ios-red)',
    'var(--color-ios-purple)',
    'var(--color-ios-teal)',
    'var(--color-ios-yellow)',
    '#FF6B6B',
    '#4ECDC4',
    '#45B7D1',
  ];

  // Resolved colors for chart (CSS vars can't be used directly in canvas)
  const resolvedColors = [
    '#007aff', '#34c759', '#ff9500', '#ff3b30',
    '#af52de', '#5ac8fa', '#ffcc00', '#FF6B6B',
    '#4ECDC4', '#45B7D1',
  ];

  const categoriesWithSpending = categorySpending.filter((cs) => cs.totalSpent > 0);

  const doughnutData = {
    labels: categoriesWithSpending.map((cs) => cs.categoryName),
    datasets: [
      {
        data: categoriesWithSpending.map((cs) => cs.totalSpent),
        backgroundColor: categoriesWithSpending.map(
          (_, i) => resolvedColors[i % resolvedColors.length]
        ),
        borderWidth: 0,
        hoverOffset: 4,
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 12,
          usePointStyle: true,
          pointStyleWidth: 8,
          font: { size: 12, family: '-apple-system, BlinkMacSystemFont, sans-serif' },
        },
      },
      tooltip: {
        callbacks: {
          label: (context: { label?: string; parsed: number }) => {
            const value = context.parsed;
            return ` ${context.label}: $${value.toFixed(2)}`;
          },
        },
      },
    },
    animation: {
      duration: 400,
    },
  };

  return (
    <div className="flex flex-col gap-4 pb-4">
      {/* Month Selector */}
      <div
        className="rounded-[var(--radius-lg)] bg-[var(--color-ios-surface)]"
        style={{ boxShadow: 'var(--shadow-sm)' }}
      >
        <MonthSelector selectedMonth={selectedMonth} onChange={setSelectedMonth} />
      </div>

      {/* Empty state */}
      {!hasData && (
        <EmptyState
          icon={<span>📊</span>}
          title="No Financial Data"
          description="No income or expenses recorded for this month. Add entries to see your dashboard."
        />
      )}

      {hasData && (
        <>
          {/* Overview Summary Card */}
          <div
            className="rounded-[var(--radius-lg)] bg-[var(--color-ios-surface)] p-4"
            style={{ boxShadow: 'var(--shadow-sm)' }}
          >
            <h2 className="text-[15px] font-semibold text-[var(--color-ios-text-secondary)] uppercase tracking-wide mb-3">
              Monthly Overview
            </h2>
            <div className="grid grid-cols-3 gap-3">
              {/* Total Income */}
              <div className="flex flex-col items-center">
                <span className="text-[11px] font-medium text-[var(--color-ios-text-tertiary)] uppercase">
                  Income
                </span>
                <span className="text-[17px] font-bold text-[var(--color-ios-green)]">
                  ${monthSummary.totalIncome.toFixed(2)}
                </span>
              </div>
              {/* Total Expenses */}
              <div className="flex flex-col items-center">
                <span className="text-[11px] font-medium text-[var(--color-ios-text-tertiary)] uppercase">
                  Expenses
                </span>
                <span className="text-[17px] font-bold text-[var(--color-ios-red)]">
                  ${monthSummary.totalExpenses.toFixed(2)}
                </span>
              </div>
              {/* Remaining Balance */}
              <div className="flex flex-col items-center">
                <span className="text-[11px] font-medium text-[var(--color-ios-text-tertiary)] uppercase">
                  Balance
                </span>
                <span
                  className={`text-[17px] font-bold ${
                    monthSummary.remainingBalance >= 0
                      ? 'text-[var(--color-ios-blue)]'
                      : 'text-[var(--color-ios-red)]'
                  }`}
                >
                  {monthSummary.remainingBalance < 0 ? '-' : ''}$
                  {Math.abs(monthSummary.remainingBalance).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Spending per Category Chart */}
          {categoriesWithSpending.length > 0 && (
            <div
              className="rounded-[var(--radius-lg)] bg-[var(--color-ios-surface)] p-4"
              style={{ boxShadow: 'var(--shadow-sm)' }}
            >
              <h2 className="text-[15px] font-semibold text-[var(--color-ios-text-secondary)] uppercase tracking-wide mb-3">
                Spending by Category
              </h2>
              <div className="max-w-[240px] mx-auto">
                <Doughnut data={doughnutData} options={doughnutOptions} />
              </div>
            </div>
          )}

          {/* Budget Progress Bars */}
          {categorySpending.length > 0 && (
            <div
              className="rounded-[var(--radius-lg)] bg-[var(--color-ios-surface)] p-4"
              style={{ boxShadow: 'var(--shadow-sm)' }}
            >
              <h2 className="text-[15px] font-semibold text-[var(--color-ios-text-secondary)] uppercase tracking-wide mb-3">
                Budget Progress
              </h2>
              <div className="flex flex-col gap-3">
                {categorySpending.map((cs, idx) => (
                  <BudgetProgressBar
                    key={cs.categoryId}
                    categoryName={cs.categoryName}
                    totalSpent={cs.totalSpent}
                    budgetLimit={cs.budgetLimit}
                    percentUsed={cs.percentUsed}
                    isOverBudget={cs.isOverBudget}
                    color={chartColors[idx % chartColors.length]}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

interface BudgetProgressBarProps {
  categoryName: string;
  totalSpent: number;
  budgetLimit: number;
  percentUsed: number;
  isOverBudget: boolean;
  color: string;
}

function BudgetProgressBar({
  categoryName,
  totalSpent,
  budgetLimit,
  percentUsed,
  isOverBudget,
}: BudgetProgressBarProps) {
  // Color logic: green if <75%, orange if 75-100%, red if >100%
  const barColor =
    percentUsed > 100
      ? 'var(--color-ios-red)'
      : percentUsed >= 75
        ? 'var(--color-ios-orange)'
        : 'var(--color-ios-green)';

  const clampedPercent = Math.min(percentUsed, 100);

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {isOverBudget && (
            <span className="text-[var(--color-ios-red)]" aria-label="Over budget">
              ⚠️
            </span>
          )}
          <span className="text-[13px] font-medium text-[var(--color-ios-text-primary)]">
            {categoryName}
          </span>
        </div>
        <span className="text-[12px] text-[var(--color-ios-text-tertiary)]">
          ${totalSpent.toFixed(2)} / ${budgetLimit.toFixed(2)}
        </span>
      </div>
      <div
        className="h-2 rounded-full overflow-hidden"
        style={{ backgroundColor: 'var(--color-ios-separator)' }}
        role="progressbar"
        aria-valuenow={Math.round(percentUsed)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${categoryName} budget: ${Math.round(percentUsed)}% used`}
      >
        <div
          className="h-full rounded-full transition-all duration-[var(--duration-normal)] ease-[var(--ease-ios)]"
          style={{
            width: `${clampedPercent}%`,
            backgroundColor: barColor,
          }}
        />
      </div>
    </div>
  );
}
