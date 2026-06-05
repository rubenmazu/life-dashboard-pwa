import { WeeklyStats } from '@/components/finance/WeeklyStats';
import { BackButton } from '@/components/shared/BackButton';

export default function WeeklyStatsPage() {
  return (
    <div>
      <BackButton to="/finance" label="Finance" />
      <WeeklyStats />
    </div>
  );
}
