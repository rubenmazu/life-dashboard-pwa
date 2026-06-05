const LOCKOUT_DURATION_MS = 30_000; // 30 seconds
const MAX_FAILED_ATTEMPTS = 3;
const PIN_MIN_LENGTH = 4;
const PIN_MAX_LENGTH = 6;

export interface LockoutState {
  failedAttempts: number;
  lockedUntil: number | null;
}

// --- Storage key helpers ---

function lockoutKey(profileId: string): string {
  return `lockout_${profileId}`;
}

function pinKey(profileId: string): string {
  return `pin_${profileId}`;
}

function webauthnCredentialKey(profileId: string): string {
  return `webauthn_credential_${profileId}`;
}

// --- PIN helpers ---

/**
 * Validate that a PIN string is 4-6 numeric digits.
 */
export function isValidPin(pin: string): boolean {
  if (pin.length < PIN_MIN_LENGTH || pin.length > PIN_MAX_LENGTH) {
    return false;
  }
  return /^\d+$/.test(pin);
}

/**
 * Hash a PIN string using SHA-256 via Web Crypto API.
 * Returns the hex-encoded hash.
 */
export async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// --- WebAuthn support detection ---

/**
 * Check if WebAuthn (PublicKeyCredential) is available in the current environment.
 */
export async function isWebAuthnSupported(): Promise<boolean> {
  try {
    return (
      typeof window !== 'undefined' &&
      typeof window.PublicKeyCredential !== 'undefined'
    );
  } catch {
    return false;
  }
}

// --- WebAuthn enrollment ---

/**
 * Enroll biometric credentials for a profile using WebAuthn.
 * Stores the credential ID in localStorage.
 * Returns true on success, false on failure.
 */
export async function enrollBiometric(profileId: string): Promise<boolean> {
  try {
    const supported = await isWebAuthnSupported();
    if (!supported) return false;

    const challenge = crypto.getRandomValues(new Uint8Array(32));
    const userId = new TextEncoder().encode(profileId);

    const credential = (await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: { name: 'Life Dashboard PWA' },
        user: {
          id: userId,
          name: `profile_${profileId}`,
          displayName: `Profile ${profileId}`,
        },
        pubKeyCredParams: [
          { type: 'public-key', alg: -7 }, // ES256
          { type: 'public-key', alg: -257 }, // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
        },
        timeout: 60000,
      },
    })) as PublicKeyCredential | null;

    if (!credential) return false;

    // Store the credential ID as base64
    const credentialId = bufferToBase64(credential.rawId);
    localStorage.setItem(webauthnCredentialKey(profileId), credentialId);
    return true;
  } catch {
    return false;
  }
}

// --- WebAuthn authentication ---

/**
 * Authenticate using stored WebAuthn credential for a profile.
 * Returns true on success, false on failure.
 */
export async function authenticateBiometric(
  profileId: string
): Promise<boolean> {
  try {
    const supported = await isWebAuthnSupported();
    if (!supported) return false;

    const storedCredentialId = localStorage.getItem(
      webauthnCredentialKey(profileId)
    );
    if (!storedCredentialId) return false;

    const credentialIdBuffer = base64ToBuffer(storedCredentialId);
    const challenge = crypto.getRandomValues(new Uint8Array(32));

    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge,
        allowCredentials: [
          {
            type: 'public-key',
            id: credentialIdBuffer,
            transports: ['internal'],
          },
        ],
        userVerification: 'required',
        timeout: 60000,
      },
    });

    return assertion !== null;
  } catch {
    return false;
  }
}

// --- PIN management ---

/**
 * Set a PIN for a profile. Hashes the PIN with SHA-256 and stores it.
 * Throws if PIN format is invalid.
 */
export async function setPin(profileId: string, pin: string): Promise<void> {
  if (!isValidPin(pin)) {
    throw new Error(
      'PIN must be 4-6 numeric digits only'
    );
  }
  const hashed = await hashPin(pin);
  localStorage.setItem(pinKey(profileId), hashed);
}

/**
 * Verify a PIN against the stored hash for a profile.
 * Returns true if the PIN matches, false otherwise.
 */
export async function verifyPin(
  profileId: string,
  pin: string
): Promise<boolean> {
  const storedHash = localStorage.getItem(pinKey(profileId));
  if (!storedHash) return false;

  const inputHash = await hashPin(pin);
  return inputHash === storedHash;
}

// --- Lockout state machine ---

/**
 * Get the current lockout state for a profile.
 * If no state exists, returns the default (0 attempts, not locked).
 */
export function getLockoutState(profileId: string): LockoutState {
  try {
    const raw = localStorage.getItem(lockoutKey(profileId));
    if (!raw) return { failedAttempts: 0, lockedUntil: null };
    const parsed = JSON.parse(raw) as LockoutState;
    return {
      failedAttempts: parsed.failedAttempts ?? 0,
      lockedUntil: parsed.lockedUntil ?? null,
    };
  } catch {
    return { failedAttempts: 0, lockedUntil: null };
  }
}

/**
 * Persist a lockout state to localStorage.
 */
function persistLockoutState(profileId: string, state: LockoutState): void {
  localStorage.setItem(lockoutKey(profileId), JSON.stringify(state));
}

/**
 * Record a failed authentication attempt for a profile.
 * If failures reach 3, locks the profile for 30 seconds.
 * Returns the updated lockout state.
 */
export function recordFailedAttempt(profileId: string): LockoutState {
  const current = getLockoutState(profileId);

  // If currently locked and lock hasn't expired, just return current state
  if (current.lockedUntil !== null && Date.now() < current.lockedUntil) {
    return current;
  }

  // If lock has expired, reset failed attempts before counting new failure
  let failedAttempts: number;
  if (current.lockedUntil !== null && Date.now() >= current.lockedUntil) {
    failedAttempts = 1;
  } else {
    failedAttempts = current.failedAttempts + 1;
  }

  const newState: LockoutState = {
    failedAttempts,
    lockedUntil:
      failedAttempts >= MAX_FAILED_ATTEMPTS
        ? Date.now() + LOCKOUT_DURATION_MS
        : null,
  };

  persistLockoutState(profileId, newState);
  return newState;
}

/**
 * Reset the failed attempts counter for a profile (call on successful auth).
 */
export function resetAttempts(profileId: string): void {
  const state: LockoutState = { failedAttempts: 0, lockedUntil: null };
  persistLockoutState(profileId, state);
}

// --- Utility functions for ArrayBuffer ↔ Base64 conversion ---

function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}
