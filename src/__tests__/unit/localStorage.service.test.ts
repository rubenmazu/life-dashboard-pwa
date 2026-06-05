import { describe, it, expect, beforeEach } from 'vitest';
import {
  getSettings,
  saveSettings,
  getActiveProfileId,
  setActiveProfileId,
  getLockoutState,
  saveLockoutState,
  clearLockoutState,
  getWebAuthnCredentialId,
  setWebAuthnCredentialId,
  getPinHash,
  setPinHash,
  clearProfileData,
  type UserSettings,
  type LockoutState,
} from '../../services/localStorage.service';

describe('localStorage.service', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('getSettings / saveSettings', () => {
    it('returns default settings when no data exists', () => {
      const settings = getSettings('profile-1');
      expect(settings).toEqual({
        habitReminderMorning: null,
        habitReminderEvening: null,
        financeReminder: null,
        notificationsEnabled: false,
        theme: 'system',
      });
    });

    it('returns saved settings', () => {
      const settings: UserSettings = {
        habitReminderMorning: '08:00',
        habitReminderEvening: '20:00',
        financeReminder: '19:00',
        notificationsEnabled: true,
        theme: 'dark',
      };
      saveSettings('profile-1', settings);
      expect(getSettings('profile-1')).toEqual(settings);
    });

    it('returns defaults for invalid JSON', () => {
      localStorage.setItem('settings_profile-1', 'not-json');
      expect(getSettings('profile-1')).toEqual({
        habitReminderMorning: null,
        habitReminderEvening: null,
        financeReminder: null,
        notificationsEnabled: false,
        theme: 'system',
      });
    });

    it('returns defaults for non-object stored value', () => {
      localStorage.setItem('settings_profile-1', JSON.stringify('a string'));
      expect(getSettings('profile-1')).toEqual({
        habitReminderMorning: null,
        habitReminderEvening: null,
        financeReminder: null,
        notificationsEnabled: false,
        theme: 'system',
      });
    });

    it('sanitizes invalid theme to system', () => {
      localStorage.setItem('settings_profile-1', JSON.stringify({ theme: 'invalid-theme' }));
      const settings = getSettings('profile-1');
      expect(settings.theme).toBe('system');
    });

    it('sanitizes non-boolean notificationsEnabled to false', () => {
      localStorage.setItem('settings_profile-1', JSON.stringify({ notificationsEnabled: 'yes' }));
      const settings = getSettings('profile-1');
      expect(settings.notificationsEnabled).toBe(false);
    });

    it('sanitizes non-string reminder values to null', () => {
      localStorage.setItem('settings_profile-1', JSON.stringify({
        habitReminderMorning: 123,
        habitReminderEvening: true,
        financeReminder: {},
      }));
      const settings = getSettings('profile-1');
      expect(settings.habitReminderMorning).toBeNull();
      expect(settings.habitReminderEvening).toBeNull();
      expect(settings.financeReminder).toBeNull();
    });

    it('stores settings per profile', () => {
      const settings1: UserSettings = {
        habitReminderMorning: '07:00',
        habitReminderEvening: null,
        financeReminder: null,
        notificationsEnabled: true,
        theme: 'light',
      };
      const settings2: UserSettings = {
        habitReminderMorning: null,
        habitReminderEvening: '21:00',
        financeReminder: '18:00',
        notificationsEnabled: false,
        theme: 'dark',
      };
      saveSettings('profile-1', settings1);
      saveSettings('profile-2', settings2);
      expect(getSettings('profile-1')).toEqual(settings1);
      expect(getSettings('profile-2')).toEqual(settings2);
    });
  });

  describe('getActiveProfileId / setActiveProfileId', () => {
    it('returns null when no active profile is set', () => {
      expect(getActiveProfileId()).toBeNull();
    });

    it('returns the set active profile id', () => {
      setActiveProfileId('abc-123');
      expect(getActiveProfileId()).toBe('abc-123');
    });

    it('clears the active profile when set to null', () => {
      setActiveProfileId('abc-123');
      setActiveProfileId(null);
      expect(getActiveProfileId()).toBeNull();
    });

    it('returns null for empty string in storage', () => {
      localStorage.setItem('active_profile', '');
      expect(getActiveProfileId()).toBeNull();
    });
  });

  describe('getLockoutState / saveLockoutState / clearLockoutState', () => {
    it('returns default lockout state when no data exists', () => {
      expect(getLockoutState('profile-1')).toEqual({
        failedAttempts: 0,
        lockedUntil: null,
      });
    });

    it('returns saved lockout state', () => {
      const state: LockoutState = { failedAttempts: 2, lockedUntil: 1700000000000 };
      saveLockoutState('profile-1', state);
      expect(getLockoutState('profile-1')).toEqual(state);
    });

    it('clears lockout state', () => {
      saveLockoutState('profile-1', { failedAttempts: 3, lockedUntil: 1700000000000 });
      clearLockoutState('profile-1');
      expect(getLockoutState('profile-1')).toEqual({
        failedAttempts: 0,
        lockedUntil: null,
      });
    });

    it('returns defaults for invalid JSON', () => {
      localStorage.setItem('lockout_profile-1', 'broken');
      expect(getLockoutState('profile-1')).toEqual({
        failedAttempts: 0,
        lockedUntil: null,
      });
    });

    it('sanitizes non-number failedAttempts to 0', () => {
      localStorage.setItem('lockout_profile-1', JSON.stringify({ failedAttempts: 'two' }));
      expect(getLockoutState('profile-1').failedAttempts).toBe(0);
    });

    it('sanitizes non-number lockedUntil to null', () => {
      localStorage.setItem('lockout_profile-1', JSON.stringify({ lockedUntil: 'never' }));
      expect(getLockoutState('profile-1').lockedUntil).toBeNull();
    });
  });

  describe('getWebAuthnCredentialId / setWebAuthnCredentialId', () => {
    it('returns null when no credential is set', () => {
      expect(getWebAuthnCredentialId('profile-1')).toBeNull();
    });

    it('returns the stored credential id', () => {
      setWebAuthnCredentialId('profile-1', 'cred-xyz');
      expect(getWebAuthnCredentialId('profile-1')).toBe('cred-xyz');
    });

    it('stores credentials per profile', () => {
      setWebAuthnCredentialId('profile-1', 'cred-a');
      setWebAuthnCredentialId('profile-2', 'cred-b');
      expect(getWebAuthnCredentialId('profile-1')).toBe('cred-a');
      expect(getWebAuthnCredentialId('profile-2')).toBe('cred-b');
    });
  });

  describe('getPinHash / setPinHash', () => {
    it('returns null when no pin hash is set', () => {
      expect(getPinHash('profile-1')).toBeNull();
    });

    it('returns the stored pin hash', () => {
      setPinHash('profile-1', 'hashed-pin-value');
      expect(getPinHash('profile-1')).toBe('hashed-pin-value');
    });

    it('stores pin hashes per profile', () => {
      setPinHash('profile-1', 'hash-a');
      setPinHash('profile-2', 'hash-b');
      expect(getPinHash('profile-1')).toBe('hash-a');
      expect(getPinHash('profile-2')).toBe('hash-b');
    });
  });

  describe('clearProfileData', () => {
    it('removes all keys for a profile', () => {
      saveSettings('profile-1', {
        habitReminderMorning: '08:00',
        habitReminderEvening: null,
        financeReminder: null,
        notificationsEnabled: true,
        theme: 'light',
      });
      saveLockoutState('profile-1', { failedAttempts: 2, lockedUntil: null });
      setPinHash('profile-1', 'some-hash');
      setWebAuthnCredentialId('profile-1', 'some-cred');

      clearProfileData('profile-1');

      expect(getSettings('profile-1').notificationsEnabled).toBe(false);
      expect(getLockoutState('profile-1').failedAttempts).toBe(0);
      expect(getPinHash('profile-1')).toBeNull();
      expect(getWebAuthnCredentialId('profile-1')).toBeNull();
    });

    it('does not affect other profiles', () => {
      saveSettings('profile-1', {
        habitReminderMorning: null,
        habitReminderEvening: null,
        financeReminder: null,
        notificationsEnabled: true,
        theme: 'dark',
      });
      saveSettings('profile-2', {
        habitReminderMorning: '09:00',
        habitReminderEvening: null,
        financeReminder: null,
        notificationsEnabled: false,
        theme: 'light',
      });

      clearProfileData('profile-1');

      expect(getSettings('profile-2').theme).toBe('light');
      expect(getSettings('profile-2').habitReminderMorning).toBe('09:00');
    });
  });
});
