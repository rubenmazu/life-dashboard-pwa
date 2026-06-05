import { useState, useEffect } from 'react';
import { useHabits } from '@/hooks/useHabits';
import { useHabitCategories } from '@/hooks/useHabitCategories';
import type { Habit } from '@/db/schema';

interface HabitFormProps {
  /** If provided, the form edits an existing habit */
  habit?: Habit;
  /** Called after successful save */
  onSaved?: () => void;
  /** Called when cancelling */
  onCancel?: () => void;
}

/**
 * Add/edit habit form with name input (max 100 chars), category selector,
 * inline validation errors, and save button.
 *
 * Requirements: 11.1, 11.3
 */
export function HabitForm({ habit, onSaved, onCancel }: HabitFormProps) {
  const { addHabit, updateHabit } = useHabits();
  const { categories } = useHabitCategories();

  const [name, setName] = useState(habit?.name ?? '');
  const [categoryId, setCategoryId] = useState(habit?.categoryId ?? '');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Set default category if none selected
  useEffect(() => {
    if (!categoryId && categories.length > 0) {
      setCategoryId(categories[0].id!);
    }
  }, [categoryId, categories]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Habit name is required');
      return;
    }
    if (name.length > 100) {
      setError('Habit name must be at most 100 characters');
      return;
    }
    if (!categoryId) {
      setError('Please select a category');
      return;
    }

    setSaving(true);
    try {
      if (habit?.id) {
        await updateHabit(habit.id, name.trim(), categoryId);
      } else {
        await addHabit(name.trim(), categoryId);
      }
      onSaved?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save habit');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-4">
      {/* Name input */}
      <div>
        <label
          htmlFor="habit-name"
          className="block text-sm font-medium mb-1"
          style={{ color: 'var(--color-ios-text-secondary)' }}
        >
          Habit Name
        </label>
        <input
          id="habit-name"
          type="text"
          className="ios-input"
          placeholder="e.g. Morning meditation"
          maxLength={100}
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (error) setError(null);
          }}
          autoFocus
        />
        <div
          className="text-xs mt-1 text-right"
          style={{ color: 'var(--color-ios-text-tertiary)' }}
        >
          {name.length}/100
        </div>
      </div>

      {/* Category selector */}
      <div>
        <label
          htmlFor="habit-category"
          className="block text-sm font-medium mb-1"
          style={{ color: 'var(--color-ios-text-secondary)' }}
        >
          Category
        </label>
        <select
          id="habit-category"
          className="ios-input"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
        >
          {categories.length === 0 && (
            <option value="" disabled>No categories available</option>
          )}
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Validation error */}
      {error && (
        <p
          className="text-sm"
          style={{ color: 'var(--color-ios-red)' }}
          role="alert"
        >
          {error}
        </p>
      )}

      {/* Action buttons */}
      <div className="flex gap-3 mt-2">
        {onCancel && (
          <button
            type="button"
            className="ios-btn flex-1"
            style={{
              backgroundColor: 'var(--color-ios-separator)',
              color: 'var(--color-ios-text-primary)',
            }}
            onClick={onCancel}
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          className="ios-btn ios-btn-primary flex-1"
          disabled={saving || categories.length === 0}
        >
          {saving ? 'Saving...' : habit ? 'Update' : 'Add Habit'}
        </button>
      </div>
    </form>
  );
}
