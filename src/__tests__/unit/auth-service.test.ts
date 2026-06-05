import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  isValidPin,
  hashPin,
  setPin,
  verifyPin,
  getLockoutState,
  recordFailedAttempt,
  resetAttempts,
  isWebAuthnSupported,
} from '../../services/auth.service';

describe('AuthService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('isValidPin', () => {
    it('accepts 4-digit numeric PIN', () => {
      expect(isValidPin('1234')).toBe(true);
    });

    it('accepts 5-digit numeric PIN', () => {
      expect(isValidPin('12345')).toBe(true);
    });

    it('accepts 6-digit numeric PIN', () => {
      expect(isValidPin('123456')).toBe(true);
    });

    it('rejects PIN shorter than 4 digits', () => {
      expect(isValidPin('123')).toBe(false);
    });

    it('rejects PIN longer than 6 digits', () => {
      expect(isValidPin('1234567')).toBe(false);
    });

    it('rejects empty string', () => {
      expect(isValidPin('')).toBe(false);
    });

    it('rejects non-numeric characters', () => {
      expect(isValidPin('12ab')).toBe(false);
      expect(isValidPin('abcd')).toBe(false);
      expect(isValidPin('12.4')).toBe(false);
      expect(isValidPin('12 4')).toBe(false);
    });

    it('rejects PIN with special characters', () => {
      expect(isValidPin('12-4')).toBe(false);
      expect(isValidPin('1!34')).toBe(false);
    });
  });

  describe('hashPin', () => {
    it('produces a consistent hash for the same input', async () => {
      const hash1 = await hashPin('1234');
      const hash2 = await hashPin('1234');
      expect(hash1).toBe(hash2);
    });

    it('produces different hashes for different inputs', async () => {
      const hash1 = await hashPin('1234');
      const hash2 = await hashPin('5678');
      expect(hash1).not.toBe(hash2);
    });

    it('produces a 64-character hex string (SHA-256)', async () => {
      const hash = await hashPin('1234');
      expect(hash).toHaveLength(64);
      expect(/^[0-9a-f]{64}$/.test(hash)).toBe(true);
    });
  });

  describe('setPin / verifyPin', () => {
    const profileId = 'test-profile-1';

    it('stores and verifies a valid PIN', async () => {
      await setPin(profileId, '1234');
      const result = await verifyPin(profileId, '1234');
      expect(result).toBe(true);
    });

    it('rejects incorrect PIN', async () => {
      await setPin(profileId, '1234');
      const result = await verifyPin(profileId, '5678');
      expect(result).toBe(false);
    });

    it('throws if PIN format is invalid', async () => {
      await expect(setPin(profileId, 'abc')).rejects.toThrow(
        'PIN must be 4-6 numeric digits only'
      );
    });

    it('returns false when no PIN is stored', async () => {
      const result = await verifyPin(profileId, '1234');
      expect(result).toBe(false);
    });

    it('allows updating the PIN', async () => {
      await setPin(profileId, '1234');
      await setPin(profileId, '5678');
      expect(await verifyPin(profileId, '1234')).toBe(false);
      expect(await verifyPin(profileId, '5678')).toBe(true);
    });
  });

  describe('Lockout state machine', () => {
    const profileId = 'lockout-test-profile';

    it('starts with zero failed attempts and no lock', () => {
      const state = getLockoutState(profileId);
      expect(state.failedAttempts).toBe(0);
      expect(state.lockedUntil).toBeNull();
    });

    it('increments failed attempts on each call', () => {
      recordFailedAttempt(profileId);
      expect(getLockoutState(profileId).failedAttempts).toBe(1);

      recordFailedAttempt(profileId);
      expect(getLockoutState(profileId).failedAttempts).toBe(2);
    });

    it('locks after 3 failed attempts', () => {
      recordFailedAttempt(profileId);
      recordFailedAttempt(profileId);
      const state = recordFailedAttempt(profileId);

      expect(state.failedAttempts).toBe(3);
      expect(state.lockedUntil).not.toBeNull();
      expect(state.lockedUntil!).toBeGreaterThan(Date.now() - 1000);
    });

    it('lock duration is 30 seconds', () => {
      const before = Date.now();
      recordFailedAttempt(profileId);
      recordFailedAttempt(profileId);
      const state = recordFailedAttempt(profileId);

      const expectedMin = before + 30_000;
      const expectedMax = before + 31_000; // small tolerance
      expect(state.lockedUntil!).toBeGreaterThanOrEqual(expectedMin);
      expect(state.lockedUntil!).toBeLessThanOrEqual(expectedMax);
    });

    it('does not increment when currently locked', () => {
      recordFailedAttempt(profileId);
      recordFailedAttempt(profileId);
      recordFailedAttempt(profileId); // now locked

      const stateBeforeExtra = getLockoutState(profileId);
      recordFailedAttempt(profileId); // should not increment
      const stateAfterExtra = getLockoutState(profileId);

      expect(stateAfterExtra.failedAttempts).toBe(
        stateBeforeExtra.failedAttempts
      );
    });

    it('resets attempts on successful auth', () => {
      recordFailedAttempt(profileId);
      recordFailedAttempt(profileId);

      resetAttempts(profileId);
      const state = getLockoutState(profileId);
      expect(state.failedAttempts).toBe(0);
      expect(state.lockedUntil).toBeNull();
    });

    it('persists lockout state in localStorage', () => {
      recordFailedAttempt(profileId);
      recordFailedAttempt(profileId);
      recordFailedAttempt(profileId);

      // Simulate reading from localStorage directly
      const raw = localStorage.getItem(`lockout_${profileId}`);
      expect(raw).not.toBeNull();
      const parsed = JSON.parse(raw!);
      expect(parsed.failedAttempts).toBe(3);
      expect(parsed.lockedUntil).not.toBeNull();
    });

    it('resets failed attempts after lock expires', () => {
      // Mock Date.now to control time
      const realNow = Date.now;
      let currentTime = realNow();
      vi.spyOn(Date, 'now').mockImplementation(() => currentTime);

      recordFailedAttempt(profileId);
      recordFailedAttempt(profileId);
      recordFailedAttempt(profileId); // locked

      // Move time forward past lockout
      currentTime += 31_000;

      // Next failure should reset and start fresh count at 1
      const state = recordFailedAttempt(profileId);
      expect(state.failedAttempts).toBe(1);
      expect(state.lockedUntil).toBeNull();

      vi.spyOn(Date, 'now').mockRestore();
    });
  });

  describe('isWebAuthnSupported', () => {
    it('returns false when PublicKeyCredential is not defined', async () => {
      // jsdom does not define PublicKeyCredential
      const result = await isWebAuthnSupported();
      expect(result).toBe(false);
    });
  });
});
