import { Link } from 'react-router-dom';
import { FinanceDashboard } from '@/components/finance/FinanceDashboard';

/**
 * FinanceDashboardPage - Charts and monthly budget summary.
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8
 */
export default function FinanceDashboardPage() {
  return (
    <div className="p-4 pb-24">
      <h1 className="text-[22px] font-bold text-[var(--color-ios-text-primary)] mb-4">
        Finance
      </h1>

      {/* Quick navigation to sub-pages */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <NavLink to="/finance/income" icon="💵" label="Income" />
        <NavLink to="/finance/categories" icon="📁" label="Categories" />
        <NavLink to="/finance/expenses" icon="🧾" label="Expenses" />
        <NavLink to="/finance/weekly" icon="📊" label="Weekly" />
      </div>

      <FinanceDashboard />
    </div>
  );
}

function NavLink({ to, icon, label }: { to: string; icon: string; label: string }) {
  return (
    <Link
      to={to}
      className="ios-card flex flex-col items-center justify-center gap-1 py-3 no-underline active:scale-95 transition-transform"
      style={{ minHeight: '44px' }}
    >
      <span className="text-xl">{icon}</span>
      <span className="text-[11px] font-medium text-[var(--color-ios-text-secondary)]">
        {label}
      </span>
    </Link>
  );
}
