import { useState } from 'react';
import { MonthSelector } from '@/components/shared/MonthSelector';
import { ConfirmDialog, EmptyState } from '@/components/shared';
import { IncomeForm } from './IncomeForm';
import { useIncome } from '@/hooks/useIncome';
import { getCurrentMonth, type MonthYear } from '@/utils/month-utils';
import type { IncomeEntry } from '@/db/schema';

/**
 * Displays all income entries for the selected month in a scrollable list.
 * Shows total income at the top, with edit/delete actions on each entry.
 * Uses MonthSelector for month navigation.
 * Requirements: 5.2, 5.3, 5.4, 5.5
 */
export function IncomeList() {
  const [selectedMonth, setSelectedMonth] = useState<MonthYear>(getCurrentMonth);
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<IncomeEntry | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<IncomeEntry | null>(null);

  const monthKey = `${selectedMonth.year}-${String(selectedMonth.month).padStart(2, '0')}`;
  const { incomeEntries, monthlyTotal, addIncome, updateIncome, deleteIncome } = useIncome(monthKey);

  const handleAdd = () => {
    setEditingEntry(undefined);
    setShowForm(true);
  };

  const handleEdit = (entry: IncomeEntry) => {
    setEditingEntry(entry);
    setShowForm(true);
  };

  const handleSave = async (amount: number, source: string) => {
    if (editingEntry?.id) {
      await updateIncome(String(editingEntry.id), amount, source);
    } else {
      await addIncome(amount, source);
    }
    setShowForm(false);
    setEditingEntry(undefined);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingEntry(undefined);
  };

  const handleDeleteConfirm = async () => {
    if (deleteTarget?.id) {
      await deleteIncome(String(deleteTarget.id));
    }
    setDeleteTarget(null);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  // Show form view
  if (showForm) {
    return (
      <div className="p-4 space-y-4">
        <IncomeForm
          editEntry={editingEntry}
          onSave={handleSave}
          onCancel={handleCancelForm}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header with month selector */}
      <div
        className="sticky top-0 z-10"
        style={{ backgroundColor: 'var(--color-ios-background)' }}
      >
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <h1
            className="text-2xl font-bold"
            style={{ color: 'var(--color-ios-text-primary)' }}
          >
            Income
          </h1>
          <button
            type="button"
            className="ios-btn ios-btn-primary"
            style={{ padding: '8px 16px', fontSize: '15px' }}
            onClick={handleAdd}
            aria-label="Add income entry"
          >
            +
          </button>
        </div>

        <MonthSelector selectedMonth={selectedMonth} onChange={setSelectedMonth} />

        {/* Total income display */}
        <div className="px-4 pb-3">
          <div className="ios-card flex items-center justify-between">
            <span
              className="text-sm font-medium"
              style={{ color: 'var(--color-ios-text-secondary)' }}
            >
              Total Income
            </span>
            <span
              className="text-xl font-bold"
              style={{ color: 'var(--color-ios-green)' }}
            >
              {formatCurrency(monthlyTotal)}
            </span>
          </div>
        </div>
      </div>

      {/* Income entries list */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {incomeEntries.length === 0 ? (
          <EmptyState
            icon={<span>💰</span>}
            title="No income entries"
            description="Tap + to add your first income entry for this month."
          />
        ) : (
          <div
            className="rounded-[var(--radius-lg)] overflow-hidden"
            style={{ backgroundColor: 'var(--color-ios-surface)' }}
          >
            {incomeEntries.map((entry) => (
              <div key={String(entry.id)} className="ios-list-item">
                <div className="flex-1 min-w-0">
                  <p
                    className="text-base font-semibold truncate"
                    style={{ color: 'var(--color-ios-text-primary)' }}
                  >
                    {formatCurrency(entry.amount)}
                  </p>
                  <p
                    className="text-sm truncate"
                    style={{ color: 'var(--color-ios-text-secondary)' }}
                  >
                    {entry.source}
                  </p>
                </div>

                <div className="flex items-center gap-2 ml-3">
                  {/* Edit button */}
                  <button
                    type="button"
                    className="ios-btn"
                    style={{
                      padding: '6px 12px',
                      fontSize: '14px',
                      minHeight: '36px',
                      minWidth: '36px',
                      color: 'var(--color-ios-blue)',
                      backgroundColor: 'transparent',
                    }}
                    onClick={() => handleEdit(entry)}
                    aria-label={`Edit income: ${entry.source}`}
                  >
                    Edit
                  </button>

                  {/* Delete button */}
                  <button
                    type="button"
                    className="ios-btn"
                    style={{
                      padding: '6px 12px',
                      fontSize: '14px',
                      minHeight: '36px',
                      minWidth: '36px',
                      color: 'var(--color-ios-red)',
                      backgroundColor: 'transparent',
                    }}
                    onClick={() => setDeleteTarget(entry)}
                    aria-label={`Delete income: ${entry.source}`}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        isOpen={deleteTarget !== null}
        title="Delete Income Entry"
        message={`Are you sure you want to delete "${deleteTarget?.source ?? ''}"? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
        destructive
      />
    </div>
  );
}
