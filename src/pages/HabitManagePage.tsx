import { HabitManageScreen } from '@/components/habits/HabitManageScreen';
import { BackButton } from '@/components/shared/BackButton';

export default function HabitManagePage() {
  return (
    <div>
      <BackButton to="/habits" label="Habits" />
      <HabitManageScreen />
    </div>
  );
}
