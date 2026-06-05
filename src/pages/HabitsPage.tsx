import { DailyChecklist } from '@/components/habits/DailyChecklist';

/**
 * HabitsPage - Daily habit checklist.
 * Renders DailyChecklist which shows all active habits grouped by category and group hierarchy.
 *
 * Requirements: 10.1, 10.8, 10.10, 12.3
 */
export default function HabitsPage() {
  return (
    <div className="pb-20">
      <header className="px-4 pt-4 pb-1">
        <h1
          className="text-2xl font-semibold"
          style={{ color: 'var(--color-ios-text-primary)' }}
        >
          Daily Habits
        </h1>
      </header>
      <DailyChecklist />
    </div>
  );
}
