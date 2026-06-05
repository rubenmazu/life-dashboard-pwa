import { WeeklyHabitStats } from '@/components/habits/WeeklyHabitStats';
import { BackButton } from '@/components/shared/BackButton';

export default function HabitStatsPage() {
  return (
    <div className="p-4">
      <BackButton to="/habits" label="Habits" />
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
