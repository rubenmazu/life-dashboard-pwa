import { useState, useEffect, useCallback } from 'react';
import { ValidationError } from '@/components/shared';
import { useCategories } from '@/hooks/useCategories';
import {
  validateExpenseAmount,
  validateExpenseCategory,
  validateExpenseDate,
  validateExpenseNotes,
} from '@/utils/validators/expense.validator';
import type { Expense } from '@/db/schema';

interface ExpenseFormProps {
  selectedMonth: string; // "YYYY-MM"
  expense?: Expense | null;
  onSave: (amount: number, categoryId: string, date: string, notes: string) => Promise<void>;
  onCancel: () => void;
}

/**
 * ExpenseForm — Add/Edit expense form with iOS styling.
 * Amount, category select, date, notes with inline validation.
 * Requirements: 7.1, 7.2, 7.3, 7.6, 7.7
 */
export function ExpenseForm({ selectedMonth, expense, onSave, onCancel }: ExpenseFormProps) {
  const { categories } = useCategories();

  const todayStr = new Date().toISOString().substring(0, 10);
  const todayMonth = todayStr.substring(0, 7);

  // Default date: today if it falls within selectedMonth, otherwise first day of selectedMonth
  const defaultDate = todayMonth === selectedMonth ? todayStr : `${selectedMonth}-01`;

  const [amount, setAmount] = useState(expense ? String(expense.amount) : '');
  const [categoryId, setCategoryId] = useState(expense?.categoryId ?? '');
  const [date, setDate] = useState(expense?.date ?? defaultDate);
  const [notes, setNotes] = useState(expense?.notes ?? '');
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [saving, setSaving] = useState(false);

  // Pre-fill when editing
  useEffect(() => {
    if (expense) {
      setAmount(String(expense.amount));
      setCategoryId(expense.categoryId);
      setDate(expense.date);
      setNotes(expense.notes);
    }
  }, [expense]);

  // Date min/max restricted to selected month
  const dateMin = `${selectedMonth}-01`;
  const lastDay = new Date(
    parseInt(selectedMonth.split('-')[0]),
    parseInt(selectedMonth.split('-')[1]),
    0
  ).getDate();
  const dateMax = `${selectedMonth}-${String(lastDay).padStart(2, '0')}`;

  const validate = useCallback((): boolean => {
    const parsedAmount = parseFloat(amount);
    const validCategoryIds = categories.map((c) => c.id!);

    const amountResult = validateExpenseAmount(parsedAmount);
    const categoryResult = validateExpenseCategory(categoryId, validCategoryIds);
    const dateResult = validateExpenseDate(date, selectedMonth);
    const notesResult = validateExpenseNotes(notes);

    const newErrors: Record<string, string | null> = {
      amount: amountResult.valid ? null : amountResult.error,
      categoryId: categoryResult.valid ? null : categoryResult.error,
      date: dateResult.valid ? null : dateResult.error,
      notes: notesResult.valid ? null : notesResult.error,
    };

    setErrors(newErrors);
    return Object.values(newErrors).every((e) => e === null);
  }, [amount, categoryId, date, notes, selectedMonth, categories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      await onSave(parseFloat(amount), categoryId, date, notes.trim());
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save expense';
      setErrors((prev) => ({ ...prev, form: message }));
    } finally {
      setSaving(false);
    }
  };

  const isEditing = !!expense;

  return (
    <div className="ios-sheet" role="dialog" aria-modal="true" aria-labelledby="expense-form-title">
      <div className="ios-sheet-backdrop" onClick={onCancel} aria-hidden="true" />
      <div className="ios-sheet-content">
        <div className="ios-sheet-handle" />

        <h2
          id="expense-form-title"
          className="text-center text-lg font-semibold mb-4"
          style={{ color: 'var(--color-ios-text-primary)' }}
        >
          {isEditing ? 'Edit Expense' : 'Add Expense'}
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Amount */}
          <div>
            <label
              htmlFor="expense-amount"
              className="block text-sm font-medium mb-1"
              style={{ color: 'var(--color-ios-text-secondary)' }}
            >
              Amount
            </label>
            <input
              id="expense-amount"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0.01"
              className="ios-input"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              autoFocus={!isEditing}
            />
            <ValidationError message={errors.amount} />
          </div>

          {/* Category */}
          <div>
            <label
              htmlFor="expense-category"
              className="block text-sm font-medium mb-1"
              style={{ color: 'var(--color-ios-text-secondary)' }}
            >
              Category
            </label>
            <select
              id="expense-category"
              className="ios-input"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            <ValidationError message={errors.categoryId} />
          </div>

          {/* Date */}
          <div>
            <label
              htmlFor="expense-date"
              className="block text-sm font-medium mb-1"
              style={{ color: 'var(--color-ios-text-secondary)' }}
            >
              Date
            </label>
            <input
              id="expense-date"
              type="date"
              className="ios-input"
              value={date}
              min={dateMin}
              max={dateMax}
              onChange={(e) => setDate(e.target.value)}
            />
            <ValidationError message={errors.date} />
          </div>

          {/* Notes */}
          <div>
            <label
              htmlFor="expense-notes"
              className="block text-sm font-medium mb-1"
              style={{ color: 'var(--color-ios-text-secondary)' }}
            >
              Notes (optional)
            </label>
            <textarea
              id="expense-notes"
              className="ios-input"
              rows={3}
              maxLength={200}
              placeholder="Add a note..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{ resize: 'none' }}
            />
            <div className="flex justify-between items-center mt-1">
              <ValidationError message={errors.notes} />
              <span
                className="text-xs ml-auto"
                style={{ color: 'var(--color-ios-text-tertiary)' }}
              >
                {notes.length}/200
              </span>
            </div>
          </div>

          {/* Form-level error */}
          <ValidationError message={errors.form} />

          {/* Actions */}
          <div className="flex flex-col gap-2 mt-2">
            <button
              type="submit"
              className="ios-btn ios-btn-primary w-full"
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              className="ios-btn w-full"
              style={{
                backgroundColor: 'var(--color-ios-separator)',
                color: 'var(--color-ios-text-primary)',
              }}
              onClick={onCancel}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
