import { useState } from 'react';
import { useHabitGroups } from '@/hooks/useHabitGroups';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';

/**
 * Manages habit groups: list, add, rename, delete.
 * Delete shows a ConfirmDialog with cascade warning (categories + habits removed).
 *
 * Requirements: 12.2, 12.8
 */
export function GroupManager() {
  const { groups, addGroup, updateGroup, deleteGroup } = useHabitGroups();

  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd() {
    setError(null);
    try {
      await addGroup(newName);
      setNewName('');
      setAdding(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add group');
    }
  }

  async function handleRename(id: string) {
    setError(null);
    try {
      await updateGroup(id, editName);
      setEditingId(null);
      setEditName('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to rename group');
    }
  }

  async function handleDelete() {
    if (!deletingId) return;
    try {
      await deleteGroup(deletingId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete group');
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

      {/* Add form */}
      {adding && (
        <div className="ios-card">
          <div className="flex gap-2">
            <input
              type="text"
              className="ios-input flex-1"
              placeholder="Group name"
              maxLength={50}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAdd();
                if (e.key === 'Escape') setAdding(false);
              }}
              autoFocus
            />
            <button
              type="button"
              className="ios-btn ios-btn-primary"
              style={{ padding: '8px 16px', fontSize: '15px' }}
              onClick={handleAdd}
              disabled={!newName.trim()}
            >
              Save
            </button>
          </div>
        </div>
      )}

      {/* Group list */}
      {groups.length === 0 && !adding && (
        <p className="text-center py-8 text-sm" style={{ color: 'var(--color-ios-text-tertiary)' }}>
          No groups yet. Add a group to organize your habit categories.
        </p>
      )}

      <div className="ios-card p-0 overflow-hidden">
        {groups.map((group) => (
          <div key={group.id} className="ios-list-item">
            {editingId === group.id ? (
              <div className="flex gap-2 flex-1">
                <input
                  type="text"
                  className="ios-input flex-1"
                  maxLength={50}
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRename(group.id!);
                    if (e.key === 'Escape') setEditingId(null);
                  }}
                  autoFocus
                />
                <button
                  type="button"
                  className="ios-btn ios-btn-primary"
                  style={{ padding: '8px 12px', fontSize: '15px' }}
                  onClick={() => handleRename(group.id!)}
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
                  {group.name}
                </span>
                <button
                  type="button"
                  className="text-sm font-medium px-2 py-1"
                  style={{ color: 'var(--color-ios-blue)' }}
                  onClick={() => {
                    setEditingId(group.id!);
                    setEditName(group.name);
                    setError(null);
                  }}
                >
                  Rename
                </button>
                <button
                  type="button"
                  className="text-sm font-medium px-2 py-1"
                  style={{ color: 'var(--color-ios-red)' }}
                  onClick={() => setDeletingId(group.id!)}
                >
                  Delete
                </button>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Add button (when not in add mode) */}
      {!adding && (
        <button
          type="button"
          className="ios-btn ios-btn-primary w-full"
          onClick={() => {
            setAdding(true);
            setNewName('');
            setError(null);
          }}
        >
          + Add Group
        </button>
      )}

      {/* Delete confirmation */}
      <ConfirmDialog
        isOpen={!!deletingId}
        title="Delete Group"
        message="All categories and habits in this group will be permanently removed. This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setDeletingId(null)}
      />
    </div>
  );
}
