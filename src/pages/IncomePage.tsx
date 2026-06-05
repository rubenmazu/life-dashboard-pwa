import { IncomeList } from '@/components/finance/IncomeList';
import { BackButton } from '@/components/shared/BackButton';

export default function IncomePage() {
  return (
    <div>
      <BackButton to="/finance" label="Finance" />
      <IncomeList />
    </div>
  );
}
