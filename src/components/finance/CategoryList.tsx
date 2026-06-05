import { useState } from 'react';
import { useCategories } from '@/hooks/useCategories';
import { ConfirmDialog, EmptyState } from '@/components/shared';
import { CategoryForm } from './CategoryForm';
import type { ExpenseCategory } from '@/db/schema';

/**
 * Scrollable list of expense categories sorted alphabetically.
 * Each item shows category name, budget limit, edit and delete buttons.
 * Includes "Add Category" action and CategoryForm in a sheet modal.
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.6
 */
export function CategoryList() {
  const { categories, isLoading, addCategory, updateCategory, deleteCategory } =
    useCategories();

  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ExpenseCategory | undefined>(
    undefined
  );
  const [deleteTarget, setDeleteTarget] = useState<ExpenseCategory | null>(null);

  const handleAdd = () => {
    setEditingCategory(undefined);
    setShowForm(true);
  };

  const handleEdit = (category: ExpenseCategory) => {
    setEditingCategory(category);
    setShowForm(true);
  };

  const handleFormSave = async (name: string, budgetLimit: number) => {
    if (editingCategory?.id) {
      await updateCategory(editingCategory.id, name, budgetLimit);
    } else {
      await addCategory(name, budgetLimit);
    }
    setShowForm(false);
    setEditingCategory(undefined);
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingCategory(undefined);
  };

  const handleDeleteConfirm = async () => {
    if (deleteTarget?.id) {
      await deleteCategory(deleteTarget.id);
    }
    setDeleteTarget(null);
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <p style={{ color: 'var(--color-ios-text-tertiary)' }}>Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header with Add button */}
      <div className="flex items-center justify-between px-4 py-3">
        <h1
          className="text-2xl font-semibold"
          style={{ color: 'var(--color-ios-text-primary)' }}
        >
          Categories
        </h1>
        <button
          type="button"
          className="ios-btn ios-btn-primary"
          style={{ padding: '8px 16px', fontSize: '15px' }}
          onClick={handleAdd}
        >
          + Add
        </button>
      </div>

      {/* Category list */}
      <div className="flex-1 overflow-y-auto">
        {categories.length === 0 ? (
          <EmptyState
            icon={<span>📁</span>}
            title="No Categories"
            description="Create expense categories to organize your spending and set budget limits."
          />
        ) : (
          <div
            className="mx-4 rounded-xl overflow-hidden"
            style={{ backgroundColor: 'var(--color-ios-surface)' }}
          >
            {categories.map((category) => (
              <div key={category.id} className="ios-list-item">
                {/* Category info */}
                <div className="flex-1 min-w-0">
                  <p
                    className="text-base font-medium truncate"
                    style={{ color: 'var(--color-ios-text-primary)' }}
                  >
                    {category.name}
                  </p>
                  <p
                    className="text-sm"
                    style={{ color: 'var(--color-ios-text-secondary)' }}
                  >
                    Budget: {formatCurrency(category.budgetLimit)}
                  </p>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2 ml-3">
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
                    onClick={() => handleEdit(category)}
                    aria-label={`Edit ${category.name}`}
                  >
                    Edit
                  </button>
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
                    onClick={() => setDeleteTarget(category)}
                    aria-label={`Delete ${category.name}`}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Category form sheet */}
      {showForm && (
        <div className="ios-sheet" role="dialog" aria-modal="true">
          <div
            className="ios-sheet-backdrop"
            onClick={handleFormCancel}
            aria-hidden="true"
          />
          <div className="ios-sheet-content">
            <div className="ios-sheet-handle" />
            <CategoryForm
              category={editingCategory}
              existingNames={categories.map((c) => c.name)}
              onSave={handleFormSave}
              onCancel={handleFormCancel}
            />
          </div>
        </div>
      )}

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Category"
        message={`This will also delete all expenses in "${deleteTarget?.name ?? ''}". This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
        destructive
      />
    </div>
  );
}
