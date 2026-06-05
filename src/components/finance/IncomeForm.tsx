import { useState, useEffect, type FormEvent } from 'react';
import { ValidationError } from '@/components/shared';
import { validateIncomeAmount, validateIncomeSource } from '@/utils/validators/income.validator';
import type { IncomeEntry } from '@/db/schema';

interface IncomeFormProps {
  /** Entry to edit, or undefined for add mode */
  editEntry?: IncomeEntry;
  onSave: (amount: number, source: string) => Promise<void>;
  onCancel: () => void;
}

/**
 * Form for adding/editing income entries.
 * Amount input (numeric, with currency formatting) and source description (max 100 chars).
 * Uses ios-input and ios-btn-primary styles. Inline ValidationError display.
 * Requirements: 5.2, 5.3, 5.6, 5.7
 */
export function IncomeForm({ editEntry, onSave, onCancel }: IncomeFormProps) {
  const [amount, setAmount] = useState('');
  const [source, setSource] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Pre-fill when editing
  useEffect(() => {
    if (editEntry) {
      setAmount(editEntry.amount.toString());
      setSource(editEntry.source);
    }
  }, [editEntry]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedAmount = parseFloat(amount);

    // Validate amount
    const amountResult = validateIncomeAmount(parsedAmount);
    if (!amountResult.valid) {
      setError(amountResult.error);
      return;
    }

    // Validate source
    const sourceResult = validateIncomeSource(source);
    if (!sourceResult.valid) {
      setError(sourceResult.error);
      return;
    }

    setSaving(true);
    try {
      await onSave(parsedAmount, source.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save income entry');
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="ios-card space-y-4">
      <h2
        className="text-lg font-semibold"
        style={{ color: 'var(--color-ios-text-primary)' }}
      >
        {editEntry ? 'Edit Income' : 'Add Income'}
      </h2>

      {/* Amount input */}
      <div>
        <label
          htmlFor="income-amount"
          className="block text-sm font-medium mb-1"
          style={{ color: 'var(--color-ios-text-secondary)' }}
        >
          Amount
        </label>
        <input
          id="income-amount"
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0.01"
          max="999999999.99"
          className="ios-input"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          disabled={saving}
          autoFocus={!editEntry}
        />
      </div>

      {/* Source description input */}
      <div>
        <label
          htmlFor="income-source"
          className="block text-sm font-medium mb-1"
          style={{ color: 'var(--color-ios-text-secondary)' }}
        >
          Source Description
        </label>
        <input
          id="income-source"
          type="text"
          className="ios-input"
          placeholder="e.g., Salary, Freelance work"
          maxLength={100}
          value={source}
          onChange={(e) => setSource(e.target.value)}
          disabled={saving}
        />
        <p
          className="mt-1 text-xs text-right"
          style={{ color: 'var(--color-ios-text-tertiary)' }}
        >
          {source.length}/100
        </p>
      </div>

      {/* Validation error */}
      <ValidationError message={error} />

      {/* Action buttons */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          className="ios-btn flex-1"
          style={{
            backgroundColor: 'var(--color-ios-separator)',
            color: 'var(--color-ios-text-primary)',
          }}
          onClick={onCancel}
          disabled={saving}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="ios-btn ios-btn-primary flex-1"
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </form>
  );
}
