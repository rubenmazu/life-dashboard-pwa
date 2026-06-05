import { useState, useCallback } from 'react';
import { MonthSelector } from '@/components/shared/MonthSelector';
import { ConfirmDialog, EmptyState } from '@/components/shared';
import { ExpenseForm } from './ExpenseForm';
import { useExpenses } from '@/hooks/useExpenses';
import { useCategories } from '@/hooks/useCategories';
import { getCurrentMonth, type MonthYear } from '@/utils/month-utils';
import type { Expense } from '@/db/schema';

/**
 * ExpenseList — Lists expenses for selected month with month navigation,
 * edit/delete actions, and a floating "Add Expense" button.
 * Requirements: 7.1, 7.2, 7.3, 7.6, 7.7
 */
export function ExpenseList() {
  const [selectedMonth, setSelectedMonth] = useState<MonthYear>(getCurrentMonth());
  const monthStr = `${selectedMonth.year}-${String(selectedMonth.month).padStart(2, '0')}`;

  const { expenses, addExpense, updateExpense, deleteExpense } = useExpenses(monthStr);
  const { categories } = useCategories();

  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null);

  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

  const handleAdd = useCallback(() => {
    setEditingExpense(null);
    setShowForm(true);
  }, []);

  const handleEdit = useCallback((expense: Expense) => {
    setEditingExpense(expense);
    setShowForm(true);
  }, []);

  const handleSave = useCallback(
    async (amount: number, categoryId: string, date: string, notes: string) => {
      if (editingExpense) {
        await updateExpense(editingExpense.id!, amount, categoryId, date, notes);
      } else {
        await addExpense(amount, categoryId, date, notes);
      }
      setShowForm(false);
      setEditingExpense(null);
    },
    [editingExpense, addExpense, updateExpense]
  );

  const handleDeleteConfirm = useCallback(async () => {
    if (deleteTarget) {
      await deleteExpense(deleteTarget.id!);
      setDeleteTarget(null);
    }
  }, [deleteTarget, deleteExpense]);

  const handleFormCancel = useCallback(() => {
    setShowForm(false);
    setEditingExpense(null);
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Month navigation */}
      <MonthSelector selectedMonth={selectedMonth} onChange={setSelectedMonth} />

      {/* Expense list */}
      <div className="flex-1 overflow-y-auto px-4 pb-24">
        {expenses.length === 0 ? (
          <EmptyState
            icon={<span>💰</span>}
            title="No expenses this month"
            description="Tap the button below to add your first expense."
          />
        ) : (
          <div className="rounded-xl overflow-hidden" style={{ backgroundColor: 'var(--color-ios-surface)' }}>
            {expenses.map((expense) => (
              <div key={expense.id} className="ios-list-item">
                {/* Left: info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span
                      className="text-base font-semibold"
                      style={{ color: 'var(--color-ios-text-primary)' }}
                    >
                      {expense.amount.toFixed(2)}
                    </span>
                    <span
                      className="text-sm truncate"
                      style={{ color: 'var(--color-ios-blue)' }}
                    >
                      {categoryMap.get(expense.categoryId) ?? 'Unknown'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span
                      className="text-xs"
                      style={{ color: 'var(--color-ios-text-tertiary)' }}
                    >
                      {expense.date}
                    </span>
                    {expense.notes && (
                      <span
                        className="text-xs truncate max-w-[160px]"
                        style={{ color: 'var(--color-ios-text-secondary)' }}
                      >
                        {expense.notes}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right: actions */}
                <div className="flex items-center gap-1 ml-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleEdit(expense)}
                    aria-label={`Edit expense ${expense.amount.toFixed(2)}`}
                    className="flex items-center justify-center rounded-full text-[var(--color-ios-blue)] transition-all duration-[var(--duration-fast)] active:scale-90 active:opacity-70"
                    style={{ width: '44px', height: '44px' }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-4.5 h-4.5"
                    >
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(expense)}
                    aria-label={`Delete expense ${expense.amount.toFixed(2)}`}
                    className="flex items-center justify-center rounded-full text-[var(--color-ios-red)] transition-all duration-[var(--duration-fast)] active:scale-90 active:opacity-70"
                    style={{ width: '44px', height: '44px' }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-4.5 h-4.5"
                    >
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating Add button */}
      <button
        type="button"
        onClick={handleAdd}
        aria-label="Add expense"
        className="fixed bottom-24 right-5 flex items-center justify-center rounded-full shadow-lg transition-all duration-[var(--duration-fast)] ease-[var(--ease-ios)] active:scale-90"
        style={{
          width: '56px',
          height: '56px',
          backgroundColor: 'var(--color-ios-blue)',
          color: '#fff',
          boxShadow: '0 4px 12px rgba(0, 122, 255, 0.3)',
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-6 h-6"
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>

      {/* ExpenseForm modal */}
      {showForm && (
        <ExpenseForm
          selectedMonth={monthStr}
          expense={editingExpense}
          onSave={handleSave}
          onCancel={handleFormCancel}
        />
      )}

      {/* Delete confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Expense"
        message={`Are you sure you want to delete this ${deleteTarget?.amount.toFixed(2)} expense?`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
        destructive
      />
    </div>
  );
}
