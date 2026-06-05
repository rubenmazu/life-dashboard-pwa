import { useState, useEffect } from 'react';
import { ValidationError } from '@/components/shared';
import {
  validateCategoryName,
  validateBudgetLimit,
} from '@/utils/validators/category.validator';
import type { ExpenseCategory } from '@/db/schema';

interface CategoryFormProps {
  /** Existing category to edit, or undefined for create mode */
  category?: ExpenseCategory;
  /** Names of existing categories (for uniqueness validation) */
  existingNames: string[];
  /** Called with name and budgetLimit on successful save */
  onSave: (name: string, budgetLimit: number) => Promise<void>;
  /** Called when user cancels the form */
  onCancel: () => void;
}

/**
 * Add/edit expense category form.
 * Shows name input (max 50 chars) and budget limit input (numeric currency).
 * Uses ios-input styling with inline validation errors below each field.
 * Requirements: 6.1, 6.2, 6.6
 */
export function CategoryForm({
  category,
  existingNames,
  onSave,
  onCancel,
}: CategoryFormProps) {
  const [name, setName] = useState(category?.name ?? '');
  const [budgetLimitStr, setBudgetLimitStr] = useState(
    category ? String(category.budgetLimit) : ''
  );
  const [nameError, setNameError] = useState<string | null>(null);
  const [budgetError, setBudgetError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Pre-fill when category changes (edit mode)
  useEffect(() => {
    if (category) {
      setName(category.name);
      setBudgetLimitStr(String(category.budgetLimit));
    }
  }, [category]);

  const handleNameChange = (value: string) => {
    // Enforce max 50 chars
    const trimmed = value.slice(0, 50);
    setName(trimmed);
    if (nameError) setNameError(null);
  };

  const handleBudgetChange = (value: string) => {
    setBudgetLimitStr(value);
    if (budgetError) setBudgetError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate name — exclude current category name from duplicate check when editing
    const namesToCheck = category
      ? existingNames.filter(
          (n) => n.toLowerCase() !== category.name.toLowerCase()
        )
      : existingNames;

    const nameResult = validateCategoryName(name.trim(), namesToCheck);
    if (!nameResult.valid) {
      setNameError(nameResult.error);
      return;
    }

    // Validate budget limit
    const budgetNum = parseFloat(budgetLimitStr);
    if (isNaN(budgetNum)) {
      setBudgetError('Budget limit must be a valid number');
      return;
    }

    const budgetResult = validateBudgetLimit(budgetNum);
    if (!budgetResult.valid) {
      setBudgetError(budgetResult.error);
      return;
    }

    setIsSaving(true);
    try {
      await onSave(name.trim(), budgetNum);
    } catch (err) {
      // Display server/hook-level validation errors
      const message = err instanceof Error ? err.message : 'Save failed';
      if (message.toLowerCase().includes('name') || message.toLowerCase().includes('category')) {
        setNameError(message);
      } else {
        setBudgetError(message);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const isEditing = !!category;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-4">
      <h2
        className="text-lg font-semibold text-center"
        style={{ color: 'var(--color-ios-text-primary)' }}
      >
        {isEditing ? 'Edit Category' : 'New Category'}
      </h2>

      {/* Name field */}
      <div>
        <label
          htmlFor="category-name"
          className="block text-sm font-medium mb-1"
          style={{ color: 'var(--color-ios-text-secondary)' }}
        >
          Name
        </label>
        <input
          id="category-name"
          type="text"
          className="ios-input"
          placeholder="e.g. Groceries"
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          maxLength={50}
          autoFocus
        />
        <ValidationError message={nameError} />
      </div>

      {/* Budget limit field */}
      <div>
        <label
          htmlFor="category-budget"
          className="block text-sm font-medium mb-1"
          style={{ color: 'var(--color-ios-text-secondary)' }}
        >
          Budget Limit
        </label>
        <input
          id="category-budget"
          type="number"
          className="ios-input"
          placeholder="0.00"
          value={budgetLimitStr}
          onChange={(e) => handleBudgetChange(e.target.value)}
          min="0.01"
          max="999999999.99"
          step="0.01"
          inputMode="decimal"
        />
        <ValidationError message={budgetError} />
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2 mt-2">
        <button
          type="submit"
          className="ios-btn ios-btn-primary w-full"
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : 'Save'}
        </button>
        <button
          type="button"
          className="ios-btn w-full"
          style={{
            backgroundColor: 'var(--color-ios-separator)',
            color: 'var(--color-ios-text-primary)',
          }}
          onClick={onCancel}
          disabled={isSaving}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
