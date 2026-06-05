import { WeeklyHabitStats } from '@/components/habits/WeeklyHabitStats';

/**
 * HabitStatsPage - Weekly habit statistics.
 * Renders the WeeklyHabitStats component with full weekly stats view.
 *
 * Requirements: 14.1, 14.2, 14.3, 14.4, 14.5
 */
export default function HabitStatsPage() {
  return (
    <div className="p-4">
      <h1
        className="text-2xl font-semibold mb-4"
        style={{ color: 'var(--color-ios-text-primary)' }}
      >
        Habit Statistics
      </h1>
      <WeeklyHabitStats />
    </div>
  );
}
