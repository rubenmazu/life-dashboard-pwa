import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getProfileDb,
  deleteProfileDb,
  closeProfileDb,
  checkStorageQuota,
} from '@/services/db.service';
import { ProfileDatabase } from '@/db/schema';

describe('db.service', () => {
  const testProfileId = 'test-profile-123';
  const testProfileId2 = 'test-profile-456';

  afterEach(async () => {
    // Clean up any open databases
    closeProfileDb(testProfileId);
    closeProfileDb(testProfileId2);
    // Delete test databases
    try {
      await ProfileDatabase.delete(`life_dash_profile_${testProfileId}`);
    } catch { /* ignore */ }
    try {
      await ProfileDatabase.delete(`life_dash_profile_${testProfileId2}`);
    } catch { /* ignore */ }
  });

  describe('getProfileDb', () => {
    it('returns a ProfileDatabase instance for a given profile ID', () => {
      const db = getProfileDb(testProfileId);
      expect(db).toBeInstanceOf(ProfileDatabase);
    });

    it('returns the same instance for repeated calls with the same profile ID', () => {
      const db1 = getProfileDb(testProfileId);
      const db2 = getProfileDb(testProfileId);
      expect(db1).toBe(db2);
    });

    it('returns different instances for different profile IDs', () => {
      const db1 = getProfileDb(testProfileId);
      const db2 = getProfileDb(testProfileId2);
      expect(db1).not.toBe(db2);
    });
  });

  describe('closeProfileDb', () => {
    it('closes the database and removes it from cache', () => {
      const db1 = getProfileDb(testProfileId);
      closeProfileDb(testProfileId);
      // After closing, getting it again should return a new instance
      const db2 = getProfileDb(testProfileId);
      expect(db2).not.toBe(db1);
    });

    it('does nothing if profile is not in cache', () => {
      // Should not throw
      expect(() => closeProfileDb('nonexistent-id')).not.toThrow();
    });
  });

  describe('deleteProfileDb', () => {
    it('deletes the database and removes from cache', async () => {
      const db1 = getProfileDb(testProfileId);
      await deleteProfileDb(testProfileId);
      // After deletion, getting it again should return a new instance
      const db2 = getProfileDb(testProfileId);
      expect(db2).not.toBe(db1);
    });

    it('works even if profile was not in cache', async () => {
      // Should not throw
      await expect(deleteProfileDb('nonexistent-id')).resolves.not.toThrow();
    });
  });

  describe('checkStorageQuota', () => {
    it('returns storage quota info when StorageManager is available', async () => {
      const result = await checkStorageQuota();
      expect(result).toHaveProperty('usage');
      expect(result).toHaveProperty('quota');
      expect(result).toHaveProperty('percentUsed');
      expect(typeof result.usage).toBe('number');
      expect(typeof result.quota).toBe('number');
      expect(typeof result.percentUsed).toBe('number');
    });

    it('returns zeros when StorageManager is unavailable', async () => {
      const originalStorage = navigator.storage;
      // Temporarily mock navigator.storage as undefined
      Object.defineProperty(navigator, 'storage', {
        value: undefined,
        writable: true,
        configurable: true,
      });

      const result = await checkStorageQuota();
      expect(result).toEqual({ usage: 0, quota: 0, percentUsed: 0 });

      // Restore
      Object.defineProperty(navigator, 'storage', {
        value: originalStorage,
        writable: true,
        configurable: true,
      });
    });
  });
});
