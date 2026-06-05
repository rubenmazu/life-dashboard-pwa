import { FinanceDashboard } from '@/components/finance/FinanceDashboard';

/**
 * FinanceDashboardPage - Charts and monthly budget summary.
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8
 */
export default function FinanceDashboardPage() {
  return (
    <div className="p-4">
      <h1 className="text-[22px] font-bold text-[var(--color-ios-text-primary)] mb-4">
        Finance Dashboard
      </h1>
      <FinanceDashboard />
    </div>
  );
}
