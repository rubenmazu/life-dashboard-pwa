import { useState } from 'react';
import { useHabitCategories } from '@/hooks/useHabitCategories';
import { useHabitGroups } from '@/hooks/useHabitGroups';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';

/**
 * Manages habit categories: list, add, rename, delete.
 * Categories are displayed grouped by their parent group.
 * Delete shows a ConfirmDialog with warning about habit removal.
 *
 * Requirements: 12.1, 12.6, 12.7
 */
export function CategoryManager() {
  const { categories, addCategory, updateCategory, deleteCategory } = useHabitCategories();
  const { groups } = useHabitGroups();

  const [addingGroupId, setAddingGroupId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd(groupId: string) {
    setError(null);
    try {
      await addCategory(newName, groupId);
      setNewName('');
      setAddingGroupId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add category');
    }
  }

  async function handleRename(id: string) {
    setError(null);
    try {
      await updateCategory(id, editName);
      setEditingId(null);
      setEditName('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to rename category');
    }
  }

  async function handleDelete() {
    if (!deletingId) return;
    try {
      await deleteCategory(deletingId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete category');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <p className="text-sm px-4" style={{ color: 'var(--color-ios-red)' }} role="alert">
          {error}
        </p>
      )}

      {groups.length === 0 && (
        <p className="text-center py-8 text-sm" style={{ color: 'var(--color-ios-text-tertiary)' }}>
          Create a group first before adding categories.
        </p>
      )}

      {groups.map((group) => {
        const groupCategories = categories.filter((c) => c.groupId === group.id);
        return (
          <div key={group.id} className="ios-card">
            <div className="flex items-center justify-between mb-3">
              <h3
                className="text-sm font-semibold uppercase tracking-wide"
                style={{ color: 'var(--color-ios-text-secondary)' }}
              >
                {group.name}
              </h3>
              <button
                type="button"
                className="text-sm font-medium px-2 py-1 rounded-md"
                style={{ color: 'var(--color-ios-blue)' }}
                onClick={() => {
                  setAddingGroupId(group.id!);
                  setNewName('');
                  setError(null);
                }}
              >
                + Add
              </button>
            </div>

            {/* Add form */}
            {addingGroupId === group.id && (
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  className="ios-input flex-1"
                  placeholder="Category name"
                  maxLength={50}
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAdd(group.id!);
                    if (e.key === 'Escape') setAddingGroupId(null);
                  }}
                  autoFocus
                />
                <button
                  type="button"
                  className="ios-btn ios-btn-primary"
                  style={{ padding: '8px 16px', fontSize: '15px' }}
                  onClick={() => handleAdd(group.id!)}
                  disabled={!newName.trim()}
                >
                  Save
                </button>
              </div>
            )}

            {/* Category list */}
            {groupCategories.length === 0 && addingGroupId !== group.id && (
              <p className="text-sm py-2" style={{ color: 'var(--color-ios-text-tertiary)' }}>
                No categories yet
              </p>
            )}

            {groupCategories.map((cat) => (
              <div
                key={cat.id}
                className="ios-list-item"
                style={{ paddingLeft: 0, paddingRight: 0 }}
              >
                {editingId === cat.id ? (
                  <div className="flex gap-2 flex-1">
                    <input
                      type="text"
                      className="ios-input flex-1"
                      maxLength={50}
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRename(cat.id!);
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      autoFocus
                    />
                    <button
                      type="button"
                      className="ios-btn ios-btn-primary"
                      style={{ padding: '8px 12px', fontSize: '15px' }}
                      onClick={() => handleRename(cat.id!)}
                      disabled={!editName.trim()}
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <>
                    <span
                      className="flex-1 text-base truncate"
                      style={{ color: 'var(--color-ios-text-primary)' }}
                    >
                      {cat.name}
                    </span>
                    <button
                      type="button"
                      className="text-sm font-medium px-2 py-1"
                      style={{ color: 'var(--color-ios-blue)' }}
                      onClick={() => {
                        setEditingId(cat.id!);
                        setEditName(cat.name);
                        setError(null);
                      }}
                    >
                      Rename
                    </button>
                    <button
                      type="button"
                      className="text-sm font-medium px-2 py-1"
                      style={{ color: 'var(--color-ios-red)' }}
                      onClick={() => setDeletingId(cat.id!)}
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        );
      })}

      {/* Delete confirmation */}
      <ConfirmDialog
        isOpen={!!deletingId}
        title="Delete Category"
        message="All habits in this category will be permanently removed. This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setDeletingId(null)}
      />
    </div>
  );
}
