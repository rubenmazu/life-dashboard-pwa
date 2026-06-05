import { describe, it, expect } from 'vitest';
import {
  isQuotaExceededError,
  isCorruptionError,
  wrapStorageOperation,
  StorageQuotaError,
  StorageCorruptionError,
} from '@/utils/storage-error-handler';

describe('storage-error-handler', () => {
  describe('isQuotaExceededError', () => {
    it('detects DOMException with name QuotaExceededError', () => {
      const error = new DOMException('Quota exceeded', 'QuotaExceededError');
      expect(isQuotaExceededError(error)).toBe(true);
    });

    it('detects Error with "quota" in message', () => {
      const error = new Error('The quota has been exceeded');
      expect(isQuotaExceededError(error)).toBe(true);
    });

    it('detects Error with name QuotaExceededError', () => {
      const error = new Error('Storage full');
      error.name = 'QuotaExceededError';
      expect(isQuotaExceededError(error)).toBe(true);
    });

    it('returns false for unrelated errors', () => {
      const error = new Error('Network failed');
      expect(isQuotaExceededError(error)).toBe(false);
    });

    it('returns false for non-error values', () => {
      expect(isQuotaExceededError(null)).toBe(false);
      expect(isQuotaExceededError(undefined)).toBe(false);
      expect(isQuotaExceededError('string')).toBe(false);
      expect(isQuotaExceededError(42)).toBe(false);
    });
  });

  describe('isCorruptionError', () => {
    it('detects DOMException with InvalidStateError', () => {
      const error = new DOMException('DB in invalid state', 'InvalidStateError');
      expect(isCorruptionError(error)).toBe(true);
    });

    it('detects DOMException with VersionError', () => {
      const error = new DOMException('Version mismatch', 'VersionError');
      expect(isCorruptionError(error)).toBe(true);
    });

    it('detects Error with "corrupt" in message', () => {
      const error = new Error('Database file is corrupt');
      expect(isCorruptionError(error)).toBe(true);
    });

    it('detects Error with "database is closed" in message', () => {
      const error = new Error('Database is closed');
      expect(isCorruptionError(error)).toBe(true);
    });

    it('detects Error with name containing "databaseclosed"', () => {
      const error = new Error('closed');
      error.name = 'DatabaseClosedError';
      expect(isCorruptionError(error)).toBe(true);
    });

    it('returns false for unrelated errors', () => {
      const error = new Error('Network timeout');
      expect(isCorruptionError(error)).toBe(false);
    });

    it('returns false for non-error values', () => {
      expect(isCorruptionError(null)).toBe(false);
      expect(isCorruptionError(undefined)).toBe(false);
    });
  });

  describe('wrapStorageOperation', () => {
    it('returns the result of a successful operation', async () => {
      const result = await wrapStorageOperation(async () => 'hello');
      expect(result).toBe('hello');
    });

    it('throws StorageQuotaError for quota-exceeded errors', async () => {
      const operation = () =>
        Promise.reject(new DOMException('Quota exceeded', 'QuotaExceededError'));

      await expect(wrapStorageOperation(operation)).rejects.toBeInstanceOf(StorageQuotaError);
    });

    it('throws StorageCorruptionError for corruption errors', async () => {
      const operation = () =>
        Promise.reject(new DOMException('Invalid state', 'InvalidStateError'));

      await expect(wrapStorageOperation(operation)).rejects.toBeInstanceOf(StorageCorruptionError);
    });

    it('re-throws unrelated errors unchanged', async () => {
      const original = new Error('Network failure');
      const operation = () => Promise.reject(original);

      await expect(wrapStorageOperation(operation)).rejects.toBe(original);
    });

    it('StorageQuotaError has correct code and message', () => {
      const error = new StorageQuotaError();
      expect(error.code).toBe('QUOTA_EXCEEDED');
      expect(error.message).toContain('Insufficient storage space');
    });

    it('StorageCorruptionError has correct code and message', () => {
      const error = new StorageCorruptionError();
      expect(error.code).toBe('DB_CORRUPTED');
      expect(error.message).toContain('corrupted');
    });
  });
});
