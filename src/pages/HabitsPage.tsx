import { Link } from 'react-router-dom';
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
      <header className="px-4 pt-4 pb-1 flex items-center justify-between">
        <h1
          className="text-2xl font-semibold"
          style={{ color: 'var(--color-ios-text-primary)' }}
        >
          Daily Habits
        </h1>
        <div className="flex gap-2">
          <Link
            to="/habits/manage"
            className="ios-btn !py-2 !px-3 !text-sm !min-h-[36px] no-underline"
            style={{ backgroundColor: 'var(--color-ios-blue)', color: '#fff' }}
          >
            Manage
          </Link>
          <Link
            to="/habits/stats"
            className="ios-btn !py-2 !px-3 !text-sm !min-h-[36px] no-underline"
            style={{ backgroundColor: 'var(--color-ios-separator)', color: 'var(--color-ios-text-primary)' }}
          >
            Stats
          </Link>
        </div>
      </header>
      <DailyChecklist />
    </div>
  );
}
