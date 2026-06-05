import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useProfile } from '@/context/ProfileContext';
import { useHabits } from '@/hooks/useHabits';
import {
  calculateWeeklyHabitStats,
  getWeekStartDate,
  getPreviousWeekStart,
} from '@/utils/habit-stats-calculator';
import type { HabitStatus } from '@/utils/habit-status';
import type { HabitCompletion } from '@/db/schema';

/**
 * WeeklyHabitStats — Displays weekly habit completion statistics.
 * Features: week navigation, overall completion %, 7-day calendar grid,
 * per-habit completion rates, top 3 / bottom 3 habits.
 *
 * Requirements: 14.1, 14.2, 14.3, 14.4, 14.5
 */

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function formatDateShort(dateStr: string): string {
  const [, month, day] = dateStr.split('-');
  return `${parseInt(month)}/${parseInt(day)}`;
}

function formatWeekRange(startDate: string, endDate: string): string {
  const start = new Date(startDate + 'T00:00:00');
  const end = new Date(endDate + 'T00:00:00');
  const startMonth = start.toLocaleString('en-US', { month: 'short' });
  const endMonth = end.toLocaleString('en-US', { month: 'short' });

  if (startMonth === endMonth) {
    return `${startMonth} ${start.getDate()} – ${end.getDate()}`;
  }
  return `${startMonth} ${start.getDate()} – ${endMonth} ${end.getDate()}`;
}

function getWeekDatesArray(weekStartDate: string): string[] {
  const [year, month, day] = weekStartDate.split('-').map(Number);
  const start = new Date(year, month - 1, day);
  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    dates.push(`${y}-${m}-${dd}`);
  }
  return dates;
}

export function WeeklyHabitStats() {
  const { db } = useProfile();
  const { activeHabits } = useHabits();

  // Week navigation state
  const [weekStart, setWeekStart] = useState<string>(() =>
    getWeekStartDate(new Date())
  );

  // Compute week end date (Sunday)
  const weekEnd = useMemo(() => {
    const [year, month, day] = weekStart.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    d.setDate(d.getDate() + 6);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
  }, [weekStart]);

  const weekDates = useMemo(() => getWeekDatesArray(weekStart), [weekStart]);

  // Load completions for the selected week from Dexie
  const completions = useLiveQuery(
    async () => {
      if (!db) return [];
      return db.habitCompletions
        .where('date')
        .between(weekStart, weekEnd, true, true)
        .toArray();
    },
    [db, weekStart, weekEnd],
    [] as HabitCompletion[]
  );

  // Calculate stats using the utility
  const stats = useMemo(() => {
    if (!activeHabits.length) return null;

    const habitsData = activeHabits.map((h) => ({
      id: h.id!,
      name: h.name,
      createdAt: h.createdAt,
    }));

    const completionsData = (completions ?? []).map((c) => ({
      habitId: c.habitId,
      date: c.date,
      status: c.status as HabitStatus,
    }));

    return calculateWeeklyHabitStats(habitsData, completionsData, weekStart);
  }, [activeHabits, completions, weekStart]);

  // Build a completion map for the calendar grid
  const completionMap = useMemo(() => {
    const map = new Map<string, HabitStatus>();
    if (completions) {
      for (const c of completions) {
        map.set(`${c.habitId}:${c.date}`, c.status);
      }
    }
    return map;
  }, [completions]);

  // Check if we're on the current week
  const currentWeekStart = getWeekStartDate(new Date());
  const isCurrentWeek = weekStart === currentWeekStart;

  const handlePreviousWeek = () => {
    setWeekStart(getPreviousWeekStart(weekStart));
  };

  const handleNextWeek = () => {
    if (!isCurrentWeek) {
      const [year, month, day] = weekStart.split('-').map(Number);
      const d = new Date(year, month - 1, day);
      d.setDate(d.getDate() + 7);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      setWeekStart(`${y}-${m}-${dd}`);
    }
  };

  if (!stats) {
    return (
      <div className="p-4 text-center" style={{ color: 'var(--color-ios-text-tertiary)' }}>
        <p className="text-[15px]">No active habits to display statistics for.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 pb-4">
      {/* Week Navigation */}
      <div
        className="ios-card flex items-center justify-between"
        role="navigation"
        aria-label="Week navigation"
      >
        <button
          type="button"
          onClick={handlePreviousWeek}
          className="ios-btn p-2"
          aria-label="Previous week"
          style={{ minWidth: '44px', minHeight: '44px' }}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path
              d="M12.5 15L7.5 10L12.5 5"
              stroke="var(--color-ios-blue)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <span
          className="text-[15px] font-semibold"
          style={{ color: 'var(--color-ios-text-primary)' }}
        >
          {formatWeekRange(stats.weekStartDate, stats.weekEndDate)}
        </span>

        <button
          type="button"
          onClick={handleNextWeek}
          disabled={isCurrentWeek}
          className="ios-btn p-2"
          aria-label="Next week"
          style={{ minWidth: '44px', minHeight: '44px' }}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path
              d="M7.5 5L12.5 10L7.5 15"
              stroke={isCurrentWeek ? 'var(--color-ios-gray)' : 'var(--color-ios-blue)'}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {/* Overall Completion Percentage */}
      <div className="ios-card flex flex-col items-center py-6">
        <span
          className="text-[48px] font-bold leading-none"
          style={{ color: 'var(--color-ios-blue)' }}
        >
          {stats.overallCompletionPercentage}%
        </span>
        <span
          className="text-[13px] mt-1"
          style={{ color: 'var(--color-ios-text-tertiary)' }}
        >
          Weekly Completion
        </span>
      </div>

      {/* 7-Day Calendar Grid */}
      <div className="ios-card overflow-x-auto">
        <h3
          className="text-[13px] font-semibold uppercase mb-3"
          style={{ color: 'var(--color-ios-text-tertiary)' }}
        >
          Weekly Overview
        </h3>

        <div className="min-w-[480px]">
          {/* Day headers */}
          <div className="grid grid-cols-[120px_repeat(7,1fr)] gap-1 mb-2">
            <div /> {/* Empty cell for habit name column */}
            {weekDates.map((date, i) => (
              <div key={date} className="flex flex-col items-center">
                <span
                  className="text-[11px] font-medium"
                  style={{ color: 'var(--color-ios-text-tertiary)' }}
                >
                  {DAY_LABELS[i]}
                </span>
                <span
                  className="text-[10px]"
                  style={{ color: 'var(--color-ios-text-tertiary)' }}
                >
                  {formatDateShort(date)}
                </span>
              </div>
            ))}
          </div>

          {/* Habit rows */}
          {activeHabits.map((habit) => (
            <div
              key={habit.id}
              className="grid grid-cols-[120px_repeat(7,1fr)] gap-1 items-center py-1.5"
              style={{ borderTop: '0.5px solid var(--color-ios-separator)' }}
            >
              <span
                className="text-[13px] truncate pr-2"
                style={{ color: 'var(--color-ios-text-primary)' }}
                title={habit.name}
              >
                {habit.name}
              </span>
              {weekDates.map((date) => {
                const status = completionMap.get(`${habit.id}:${date}`) ?? 'not_started';
                return (
                  <div key={date} className="flex justify-center">
                    <MiniStatusIndicator status={status} />
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Per-Habit Completion Rates */}
      <div className="ios-card">
        <h3
          className="text-[13px] font-semibold uppercase mb-3"
          style={{ color: 'var(--color-ios-text-tertiary)' }}
        >
          Completion Rates
        </h3>

        <div className="flex flex-col gap-3">
          {stats.habitRates.map((rate) => (
            <div key={rate.habitId} className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span
                  className="text-[14px]"
                  style={{ color: 'var(--color-ios-text-primary)' }}
                >
                  {rate.habitName}
                </span>
                <span
                  className="text-[13px] font-medium"
                  style={{ color: 'var(--color-ios-text-secondary)' }}
                >
                  {rate.completionRate}%
                </span>
              </div>
              {/* Progress bar */}
              <div
                className="h-2 rounded-full overflow-hidden"
                style={{ backgroundColor: 'var(--color-ios-separator)' }}
              >
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${rate.completionRate}%`,
                    backgroundColor: getRateColor(rate.completionRate),
                    transition: 'width var(--duration-normal) var(--ease-ios)',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top 3 / Bottom 3 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Most Consistent */}
        <div className="ios-card">
          <h3
            className="text-[13px] font-semibold uppercase mb-3"
            style={{ color: 'var(--color-ios-green)' }}
          >
            🏆 Most Consistent
          </h3>
          <div className="flex flex-col gap-2">
            {stats.topHabits.map((habit, index) => (
              <div
                key={habit.habitId}
                className="flex items-center justify-between py-1.5 px-2 rounded-lg"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--color-ios-green) 8%, transparent)',
                }}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="text-[12px] font-bold w-5 h-5 flex items-center justify-center rounded-full"
                    style={{
                      backgroundColor: 'var(--color-ios-green)',
                      color: '#ffffff',
                    }}
                  >
                    {index + 1}
                  </span>
                  <span
                    className="text-[14px]"
                    style={{ color: 'var(--color-ios-text-primary)' }}
                  >
                    {habit.habitName}
                  </span>
                </div>
                <span
                  className="text-[13px] font-semibold"
                  style={{ color: 'var(--color-ios-green)' }}
                >
                  {habit.completionRate}%
                </span>
              </div>
            ))}
            {stats.topHabits.length === 0 && (
              <span
                className="text-[13px]"
                style={{ color: 'var(--color-ios-text-tertiary)' }}
              >
                No data yet
              </span>
            )}
          </div>
        </div>

        {/* Needs Improvement */}
        <div className="ios-card">
          <h3
            className="text-[13px] font-semibold uppercase mb-3"
            style={{ color: 'var(--color-ios-orange)' }}
          >
            📈 Needs Improvement
          </h3>
          <div className="flex flex-col gap-2">
            {stats.bottomHabits.map((habit, index) => (
              <div
                key={habit.habitId}
                className="flex items-center justify-between py-1.5 px-2 rounded-lg"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--color-ios-orange) 8%, transparent)',
                }}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="text-[12px] font-bold w-5 h-5 flex items-center justify-center rounded-full"
                    style={{
                      backgroundColor: 'var(--color-ios-orange)',
                      color: '#ffffff',
                    }}
                  >
                    {index + 1}
                  </span>
                  <span
                    className="text-[14px]"
                    style={{ color: 'var(--color-ios-text-primary)' }}
                  >
                    {habit.habitName}
                  </span>
                </div>
                <span
                  className="text-[13px] font-semibold"
                  style={{ color: 'var(--color-ios-orange)' }}
                >
                  {habit.completionRate}%
                </span>
              </div>
            ))}
            {stats.bottomHabits.length === 0 && (
              <span
                className="text-[13px]"
                style={{ color: 'var(--color-ios-text-tertiary)' }}
              >
                No data yet
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Mini status indicator for the calendar grid (smaller version of HabitItem indicators).
 * Uses the same visual style: empty circle, half-filled, checkmark.
 */
function MiniStatusIndicator({ status }: { status: HabitStatus }) {
  switch (status) {
    case 'not_started':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle
            cx="12"
            cy="12"
            r="10.5"
            stroke="var(--color-ios-gray)"
            strokeWidth="1.5"
            fill="none"
          />
        </svg>
      );
    case 'in_progress':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle
            cx="12"
            cy="12"
            r="10.5"
            stroke="var(--color-ios-blue)"
            strokeWidth="1.5"
            fill="none"
          />
          <path
            d="M12 1.5 A10.5 10.5 0 0 1 12 22.5 L12 1.5Z"
            fill="var(--color-ios-blue)"
            opacity="0.3"
          />
          <circle cx="12" cy="12" r="5" fill="var(--color-ios-blue)" />
        </svg>
      );
    case 'completed':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="11" fill="var(--color-ios-green)" />
          <path
            d="M7 12.5l3 3 7-7"
            stroke="#ffffff"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
  }
}

/**
 * Returns a color based on completion rate for progress bars.
 */
function getRateColor(rate: number): string {
  if (rate >= 80) return 'var(--color-ios-green)';
  if (rate >= 50) return 'var(--color-ios-blue)';
  if (rate >= 25) return 'var(--color-ios-orange)';
  return 'var(--color-ios-red)';
}
