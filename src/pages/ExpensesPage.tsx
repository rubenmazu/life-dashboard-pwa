import { ExpenseList } from '@/components/finance/ExpenseList';
import { BackButton } from '@/components/shared/BackButton';

export default function ExpensesPage() {
  return (
    <div>
      <BackButton to="/finance" label="Finance" />
      <ExpenseList />
    </div>
  );
}
