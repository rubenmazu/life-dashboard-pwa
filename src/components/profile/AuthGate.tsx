import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProfiles, type ProfileMeta } from '@/services/profile.service';
import {
  authenticateBiometric,
  verifyPin,
  isWebAuthnSupported,
  getLockoutState,
  recordFailedAttempt,
  resetAttempts,
  type LockoutState,
} from '@/services/auth.service';
import { useProfile } from '@/context/ProfileContext';

/**
 * AuthGate — Handles profile authentication.
 * Requirements 3.1, 3.3, 3.5, 3.6:
 * - Biometric prompt via WebAuthn on mount
 * - PIN fallback if WebAuthn unavailable
 * - Lockout countdown after 3 failures (30s)
 * - No-auth profiles skip directly to dashboard
 */
export default function AuthGate() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { setActiveProfile } = useProfile();

  const [profile, setProfile] = useState<ProfileMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pin, setPin] = useState('');
  const [lockout, setLockout] = useState<LockoutState>({ failedAttempts: 0, lockedUntil: null });
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [usePinFallback, setUsePinFallback] = useState(false);
  const [biometricAttempted, setBiometricAttempted] = useState(false);

  const pinInputRef = useRef<HTMLInputElement>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load profile meta and check lockout state
  useEffect(() => {
    if (!id) {
      navigate('/profiles', { replace: true });
      return;
    }

    const profiles = getProfiles();
    const found = profiles.find((p) => p.id === id);

    if (!found) {
      navigate('/profiles', { replace: true });
      return;
    }

    // No-auth flow: immediately set active and redirect (Requirement 3.6)
    if (!found.hasAuth) {
      setActiveProfile(id);
      navigate('/finance', { replace: true });
      return;
    }

    setProfile(found);
    setLockout(getLockoutState(id));
    setLoading(false);
  }, [id, navigate, setActiveProfile]);

  // Countdown timer for lockout
  useEffect(() => {
    if (lockout.lockedUntil === null) {
      setRemainingSeconds(0);
      return;
    }

    const updateCountdown = () => {
      const remaining = Math.max(0, Math.ceil((lockout.lockedUntil! - Date.now()) / 1000));
      setRemainingSeconds(remaining);

      if (remaining <= 0) {
        // Lockout expired
        if (countdownRef.current) {
          clearInterval(countdownRef.current);
          countdownRef.current = null;
        }
        setLockout(getLockoutState(id!));
      }
    };

    updateCountdown();
    countdownRef.current = setInterval(updateCountdown, 1000);

    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
    };
  }, [lockout.lockedUntil, id]);

  // Trigger biometric auth on mount if applicable
  useEffect(() => {
    if (!profile || biometricAttempted) return;
    if (profile.authType !== 'biometric') return;
    if (lockout.lockedUntil !== null && Date.now() < lockout.lockedUntil) return;

    setBiometricAttempted(true);
    triggerBiometric();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, biometricAttempted, lockout.lockedUntil]);

  const handleSuccess = useCallback(() => {
    if (!id) return;
    resetAttempts(id);
    setActiveProfile(id);
    navigate('/finance', { replace: true });
  }, [id, setActiveProfile, navigate]);

  const handleFailure = useCallback(() => {
    if (!id) return;
    const newState = recordFailedAttempt(id);
    setLockout(newState);
    setError(
      newState.lockedUntil
        ? 'Too many failed attempts. Profile locked.'
        : 'Authentication failed. Please try again.'
    );
    setPin('');
  }, [id]);

  const triggerBiometric = useCallback(async () => {
    if (!id) return;

    // Check if still locked
    const currentLockout = getLockoutState(id);
    if (currentLockout.lockedUntil !== null && Date.now() < currentLockout.lockedUntil) {
      setLockout(currentLockout);
      return;
    }

    setError(null);
    const supported = await isWebAuthnSupported();
    if (!supported) {
      setUsePinFallback(true);
      return;
    }

    const success = await authenticateBiometric(id);
    if (success) {
      handleSuccess();
    } else {
      handleFailure();
      // After biometric failure, allow PIN fallback
      setUsePinFallback(true);
    }
  }, [id, handleSuccess, handleFailure]);

  const handlePinSubmit = useCallback(
    async (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      if (!id) return;

      // Check if locked
      const currentLockout = getLockoutState(id);
      if (currentLockout.lockedUntil !== null && Date.now() < currentLockout.lockedUntil) {
        setLockout(currentLockout);
        return;
      }

      setError(null);
      const success = await verifyPin(id, pin);
      if (success) {
        handleSuccess();
      } else {
        handleFailure();
      }
    },
    [id, pin, handleSuccess, handleFailure]
  );

  const handlePinChange = (value: string) => {
    // Only allow numeric digits, 4-6 chars
    const numericOnly = value.replace(/\D/g, '').slice(0, 6);
    setPin(numericOnly);
    setError(null);
  };

  const handleBack = () => {
    navigate('/profiles');
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div
          className="w-8 h-8 rounded-full border-2 border-[var(--color-ios-blue)] border-t-transparent animate-spin"
          aria-label="Loading"
        />
      </div>
    );
  }

  if (!profile) return null;

  const isLocked = lockout.lockedUntil !== null && Date.now() < lockout.lockedUntil;
  const showPinInput = profile.authType === 'pin' || usePinFallback;

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-6">
      {/* Back button */}
      <button
        onClick={handleBack}
        className="absolute top-4 left-4 flex items-center gap-1 text-[var(--color-ios-blue)] font-medium text-base min-h-[44px] min-w-[44px] cursor-pointer"
        aria-label="Back to profile selector"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Back
      </button>

      {/* Profile avatar */}
      <div className="w-20 h-20 rounded-full bg-[var(--color-ios-blue)] flex items-center justify-center text-white text-3xl font-semibold mb-4">
        {profile.name.charAt(0).toUpperCase()}
      </div>

      <h1 className="text-xl font-semibold text-[var(--color-ios-text-primary)] mb-1">
        {profile.name}
      </h1>

      <p className="text-sm text-[var(--color-ios-text-tertiary)] mb-6">
        {isLocked
          ? 'Profile is temporarily locked'
          : showPinInput
            ? 'Enter your PIN to unlock'
            : 'Authenticate to continue'}
      </p>

      {/* Lockout countdown */}
      {isLocked && (
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 rounded-full border-4 border-[var(--color-ios-red)] flex items-center justify-center mb-3">
            <span className="text-2xl font-bold text-[var(--color-ios-red)]">
              {remainingSeconds}
            </span>
          </div>
          <p className="text-sm text-[var(--color-ios-text-secondary)]">
            Try again in {remainingSeconds} {remainingSeconds === 1 ? 'second' : 'seconds'}
          </p>
        </div>
      )}

      {/* PIN Input */}
      {showPinInput && !isLocked && (
        <form onSubmit={handlePinSubmit} className="w-full max-w-[280px]">
          <div className="relative mb-4">
            <input
              ref={pinInputRef}
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={pin}
              onChange={(e) => handlePinChange(e.target.value)}
              placeholder="Enter PIN"
              autoFocus
              className="w-full h-12 text-center text-2xl tracking-[0.5em] font-semibold rounded-[var(--radius-md)] border border-[var(--color-ios-separator)] bg-[var(--color-ios-surface)] text-[var(--color-ios-text-primary)] placeholder:text-[var(--color-ios-text-tertiary)] placeholder:tracking-normal placeholder:text-base placeholder:font-normal focus:outline-none focus:border-[var(--color-ios-blue)] focus:ring-1 focus:ring-[var(--color-ios-blue)] transition-colors"
              aria-label="PIN code"
            />
          </div>

          <button
            type="submit"
            disabled={pin.length < 4}
            className="w-full h-[var(--spacing-tap-target)] rounded-[var(--radius-md)] bg-[var(--color-ios-blue)] text-white font-semibold text-base transition-opacity disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed active:opacity-80"
          >
            Unlock
          </button>
        </form>
      )}

      {/* Biometric retry button (when not locked and biometric is primary) */}
      {profile.authType === 'biometric' && !isLocked && (
        <button
          onClick={triggerBiometric}
          className="mt-4 flex items-center gap-2 text-[var(--color-ios-blue)] font-medium text-base min-h-[var(--spacing-tap-target)] cursor-pointer active:opacity-70 transition-opacity"
        >
          <BiometricIcon />
          Use Biometric
        </button>
      )}

      {/* Error message */}
      {error && (
        <p className="mt-4 text-sm text-[var(--color-ios-red)] text-center" role="alert">
          {error}
        </p>
      )}

      {/* Attempts info (when not locked) */}
      {!isLocked && lockout.failedAttempts > 0 && (
        <p className="mt-3 text-xs text-[var(--color-ios-text-tertiary)] text-center">
          {3 - lockout.failedAttempts} {3 - lockout.failedAttempts === 1 ? 'attempt' : 'attempts'} remaining
        </p>
      )}
    </div>
  );
}

/** Biometric (fingerprint) icon */
function BiometricIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 10v4" />
      <path d="M7.5 7.5C9 6 11 5 12 5s3 1 4.5 2.5" />
      <path d="M4.5 4.5C7 2 9.5 1 12 1s5 1 7.5 3.5" />
      <path d="M12 14c0 2-1 3.5-2 4.5" />
      <path d="M14.5 16c0 1-.5 2.5-1.5 3.5" />
      <path d="M17 12c0 3-1.5 5.5-3 7" />
      <path d="M7 12c0 1.5.5 3 1.5 4" />
    </svg>
  );
}
