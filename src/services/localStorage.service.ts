// Storage keys
const ACTIVE_PROFILE_KEY = 'active_profile';
const SETTINGS_PREFIX = 'settings_';
const LOCKOUT_PREFIX = 'lockout_';
const PIN_PREFIX = 'pin_';
const WEBAUTHN_CREDENTIAL_PREFIX = 'webauthn_credential_';

export interface UserSettings {
  habitReminderMorning: string | null; // "HH:MM" or null
  habitReminderEvening: string | null;
  financeReminder: string | null;
  notificationsEnabled: boolean;
  theme: 'light' | 'dark' | 'system';
}

export interface LockoutState {
  failedAttempts: number;
  lockedUntil: number | null; // Unix timestamp or null
}

const DEFAULT_USER_SETTINGS: UserSettings = {
  habitReminderMorning: null,
  habitReminderEvening: null,
  financeReminder: null,
  notificationsEnabled: false,
  theme: 'system',
};

const DEFAULT_LOCKOUT_STATE: LockoutState = {
  failedAttempts: 0,
  lockedUntil: null,
};

/**
 * Get user settings for a profile. Returns defaults if missing or invalid.
 */
export function getSettings(profileId: string): UserSettings {
  try {
    const raw = localStorage.getItem(`${SETTINGS_PREFIX}${profileId}`);
    if (!raw) return { ...DEFAULT_USER_SETTINGS };
    const parsed = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return { ...DEFAULT_USER_SETTINGS };
    return {
      habitReminderMorning: typeof parsed.habitReminderMorning === 'string' ? parsed.habitReminderMorning : null,
      habitReminderEvening: typeof parsed.habitReminderEvening === 'string' ? parsed.habitReminderEvening : null,
      financeReminder: typeof parsed.financeReminder === 'string' ? parsed.financeReminder : null,
      notificationsEnabled: typeof parsed.notificationsEnabled === 'boolean' ? parsed.notificationsEnabled : false,
      theme: ['light', 'dark', 'system'].includes(parsed.theme) ? parsed.theme : 'system',
    };
  } catch {
    return { ...DEFAULT_USER_SETTINGS };
  }
}

/**
 * Save user settings for a profile.
 */
export function saveSettings(profileId: string, settings: UserSettings): void {
  try {
    localStorage.setItem(`${SETTINGS_PREFIX}${profileId}`, JSON.stringify(settings));
  } catch {
    // Storage unavailable or quota exceeded — silently fail
  }
}

/**
 * Get the active profile ID. Returns null if not set.
 */
export function getActiveProfileId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_PROFILE_KEY) || null;
  } catch {
    return null;
  }
}

/**
 * Set the active profile ID. Pass null to clear.
 */
export function setActiveProfileId(id: string | null): void {
  try {
    if (id === null) {
      localStorage.removeItem(ACTIVE_PROFILE_KEY);
    } else {
      localStorage.setItem(ACTIVE_PROFILE_KEY, id);
    }
  } catch {
    // Storage unavailable — silently fail
  }
}

/**
 * Get lockout state for a profile. Returns defaults if missing or invalid.
 */
export function getLockoutState(profileId: string): LockoutState {
  try {
    const raw = localStorage.getItem(`${LOCKOUT_PREFIX}${profileId}`);
    if (!raw) return { ...DEFAULT_LOCKOUT_STATE };
    const parsed = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return { ...DEFAULT_LOCKOUT_STATE };
    return {
      failedAttempts: typeof parsed.failedAttempts === 'number' ? parsed.failedAttempts : 0,
      lockedUntil: typeof parsed.lockedUntil === 'number' ? parsed.lockedUntil : null,
    };
  } catch {
    return { ...DEFAULT_LOCKOUT_STATE };
  }
}

/**
 * Save lockout state for a profile.
 */
export function saveLockoutState(profileId: string, state: LockoutState): void {
  try {
    localStorage.setItem(`${LOCKOUT_PREFIX}${profileId}`, JSON.stringify(state));
  } catch {
    // Storage unavailable — silently fail
  }
}

/**
 * Clear lockout state for a profile (reset failed attempts).
 */
export function clearLockoutState(profileId: string): void {
  try {
    localStorage.removeItem(`${LOCKOUT_PREFIX}${profileId}`);
  } catch {
    // Storage unavailable — silently fail
  }
}

/**
 * Get WebAuthn credential ID for a profile. Returns null if not set.
 */
export function getWebAuthnCredentialId(profileId: string): string | null {
  try {
    return localStorage.getItem(`${WEBAUTHN_CREDENTIAL_PREFIX}${profileId}`) || null;
  } catch {
    return null;
  }
}

/**
 * Set WebAuthn credential ID for a profile.
 */
export function setWebAuthnCredentialId(profileId: string, credentialId: string): void {
  try {
    localStorage.setItem(`${WEBAUTHN_CREDENTIAL_PREFIX}${profileId}`, credentialId);
  } catch {
    // Storage unavailable — silently fail
  }
}

/**
 * Get the stored PIN hash for a profile. Returns null if not set.
 */
export function getPinHash(profileId: string): string | null {
  try {
    return localStorage.getItem(`${PIN_PREFIX}${profileId}`) || null;
  } catch {
    return null;
  }
}

/**
 * Set the PIN hash for a profile.
 */
export function setPinHash(profileId: string, hash: string): void {
  try {
    localStorage.setItem(`${PIN_PREFIX}${profileId}`, hash);
  } catch {
    // Storage unavailable — silently fail
  }
}

/**
 * Clear all localStorage data associated with a profile.
 */
export function clearProfileData(profileId: string): void {
  try {
    localStorage.removeItem(`${SETTINGS_PREFIX}${profileId}`);
    localStorage.removeItem(`${LOCKOUT_PREFIX}${profileId}`);
    localStorage.removeItem(`${PIN_PREFIX}${profileId}`);
    localStorage.removeItem(`${WEBAUTHN_CREDENTIAL_PREFIX}${profileId}`);
  } catch {
    // Storage unavailable — silently fail
  }
}
