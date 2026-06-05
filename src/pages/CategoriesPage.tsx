import { CategoryList } from '@/components/finance/CategoryList';
import { BackButton } from '@/components/shared/BackButton';

export default function CategoriesPage() {
  return (
    <div>
      <BackButton to="/finance" label="Finance" />
      <CategoryList />
    </div>
  );
}
