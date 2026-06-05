/**
 * Storage error handling utilities.
 * Provides typed detection and wrapping for IndexedDB/Dexie storage errors.
 * Requirements: 4.5, 4.7, 4.8
 */

// ─── Typed Storage Errors ─────────────────────────────────────────────────────

export class StorageQuotaError extends Error {
  readonly code = 'QUOTA_EXCEEDED';
  constructor(message = 'Insufficient storage space. Please free up space or export your data.') {
    super(message);
    this.name = 'StorageQuotaError';
  }
}

export class StorageCorruptionError extends Error {
  readonly code = 'DB_CORRUPTED';
  constructor(message = 'Your data may be corrupted.') {
    super(message);
    this.name = 'StorageCorruptionError';
  }
}

// ─── Error Detection ──────────────────────────────────────────────────────────

/**
 * Detects if an error is a QuotaExceededError (storage full).
 * Handles DOMException, Dexie QuotaExceededError, and similar variants.
 */
export function isQuotaExceededError(error: unknown): boolean {
  if (error instanceof DOMException) {
    // Standard QuotaExceededError
    if (error.name === 'QuotaExceededError' || error.code === 22) {
      return true;
    }
    // Firefox variant
    if (error.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
      return true;
    }
  }

  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    if (
      msg.includes('quota') ||
      msg.includes('storage space') ||
      msg.includes('disk full') ||
      error.name === 'QuotaExceededError'
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Detects if an error indicates database corruption.
 * Covers Dexie's DatabaseClosedError, VersionError, and related failures.
 */
export function isCorruptionError(error: unknown): boolean {
  if (error instanceof DOMException) {
    // InvalidStateError can indicate a corrupted/closed DB
    if (error.name === 'InvalidStateError') {
      return true;
    }
    // VersionError indicates schema mismatch / corruption
    if (error.name === 'VersionError') {
      return true;
    }
  }

  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    const name = error.name.toLowerCase();

    if (
      msg.includes('corrupt') ||
      msg.includes('database is closed') ||
      msg.includes('internal error') ||
      msg.includes('not a database') ||
      name.includes('databaseclosed') ||
      name === 'unknownerror' ||
      name === 'aborterror'
    ) {
      return true;
    }
  }

  return false;
}

// ─── Operation Wrapper ────────────────────────────────────────────────────────

/**
 * Wraps any async storage/Dexie operation, catches storage errors
 * and throws typed errors (StorageQuotaError or StorageCorruptionError).
 * Non-storage errors are re-thrown unchanged.
 */
export async function wrapStorageOperation<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (isQuotaExceededError(error)) {
      throw new StorageQuotaError();
    }
    if (isCorruptionError(error)) {
      throw new StorageCorruptionError();
    }
    throw error;
  }
}
