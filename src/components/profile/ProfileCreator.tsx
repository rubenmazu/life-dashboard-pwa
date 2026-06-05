import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createProfile, getProfiles, validateProfileName } from '@/services/profile.service';
import { useProfile } from '@/context/ProfileContext';
import { ValidationError } from '@/components/shared/ValidationError';

/**
 * ProfileCreator — Form for creating a new user profile.
 * Features:
 * - Name input with real-time (debounced) validation
 * - Inline error messages (empty, too long >30, duplicate)
 * - Optional biometric enrollment toggle (placeholder)
 * - "Create Profile" button (ios-btn-primary)
 * - "Back" link to return to profile selector
 * Requirements: 2.4, 2.5
 */
export function ProfileCreator() {
  const navigate = useNavigate();
  const { setActiveProfile } = useProfile();

  const [name, setName] = useState('');
  const [hasAuth, setHasAuth] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Validate name with debounce as user types
  const validateName = useCallback((value: string) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      if (value.length === 0) {
        setValidationError('Profile name must be at least 1 character');
        return;
      }

      const existingProfiles = getProfiles();
      const result = validateProfileName(value, existingProfiles);
      setValidationError(result.error);
    }, 300);
  }, []);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setName(value);
    validateName(value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate immediately on submit (no debounce)
    if (name.trim().length === 0) {
      setValidationError('Profile name must be at least 1 character');
      return;
    }

    const existingProfiles = getProfiles();
    const result = validateProfileName(name.trim(), existingProfiles);
    if (!result.valid) {
      setValidationError(result.error);
      return;
    }

    setIsSubmitting(true);

    try {
      const profile = createProfile(name.trim());

      // If biometric toggle is on, update the profile's hasAuth flag
      // (placeholder — actual WebAuthn enrollment will be added later)
      if (hasAuth) {
        // For now, we just created the profile with hasAuth: false by default.
        // The biometric enrollment flow will be implemented in a future task.
        // We still set active profile and navigate.
      }

      setActiveProfile(profile.id);
      navigate('/finance');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create profile';
      setValidationError(message);
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    navigate('/profiles');
  };

  return (
    <div
      className="flex flex-col min-h-screen px-4 pt-12 pb-8"
      style={{ backgroundColor: 'var(--color-ios-bg)' }}
    >
      {/* Header with back button */}
      <div className="flex items-center mb-8">
        <button
          type="button"
          onClick={handleBack}
          className="flex items-center gap-1 text-[17px] font-normal"
          style={{
            color: 'var(--color-ios-blue)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            minHeight: 'var(--spacing-tap-target)',
            minWidth: 'var(--spacing-tap-target)',
            padding: '0 8px',
          }}
        >
          <svg
            width="12"
            height="20"
            viewBox="0 0 12 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M10 2L2 10L10 18"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Back
        </button>
      </div>

      {/* Title */}
      <h1
        className="text-[28px] font-bold mb-2"
        style={{ color: 'var(--color-ios-text-primary)' }}
      >
        New Profile
      </h1>
      <p
        className="text-[15px] mb-8"
        style={{ color: 'var(--color-ios-text-secondary)' }}
      >
        Create a profile to start tracking your finances and habits.
      </p>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Name input */}
        <div className="flex flex-col gap-1">
          <label
            htmlFor="profile-name"
            className="text-[13px] font-semibold uppercase tracking-wide px-1"
            style={{ color: 'var(--color-ios-text-tertiary)' }}
          >
            Profile Name
          </label>
          <input
            id="profile-name"
            type="text"
            className="ios-input"
            placeholder="Enter a name"
            value={name}
            onChange={handleNameChange}
            maxLength={31}
            autoFocus
            autoComplete="off"
            aria-describedby="profile-name-error"
            aria-invalid={validationError ? 'true' : undefined}
          />
          <div id="profile-name-error">
            <ValidationError message={validationError} />
          </div>
          <p
            className="text-[12px] mt-1 px-1"
            style={{ color: 'var(--color-ios-text-tertiary)' }}
          >
            {name.length}/30 characters
          </p>
        </div>

        {/* Biometric enrollment toggle (placeholder) */}
        <div
          className="ios-card flex items-center justify-between"
          style={{ padding: '12px 16px' }}
        >
          <div className="flex flex-col">
            <span
              className="text-[17px]"
              style={{ color: 'var(--color-ios-text-primary)' }}
            >
              Biometric Lock
            </span>
            <span
              className="text-[13px]"
              style={{ color: 'var(--color-ios-text-tertiary)' }}
            >
              Protect with Face ID or Touch ID
            </span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={hasAuth}
              onChange={(e) => setHasAuth(e.target.checked)}
              aria-label="Enable biometric lock"
            />
            <div
              className="w-[51px] h-[31px] rounded-full peer transition-colors"
              style={{
                backgroundColor: hasAuth
                  ? 'var(--color-ios-green)'
                  : 'var(--color-ios-separator)',
                transition: 'background-color var(--duration-fast) var(--ease-ios)',
              }}
            >
              <div
                className="absolute top-[2px] rounded-full h-[27px] w-[27px] bg-white shadow-sm transition-transform"
                style={{
                  transform: hasAuth ? 'translateX(22px)' : 'translateX(2px)',
                  transition: 'transform var(--duration-fast) var(--ease-ios-spring)',
                }}
              />
            </div>
          </label>
        </div>

        {/* Submit button */}
        <button
          type="submit"
          className="ios-btn ios-btn-primary w-full mt-4"
          disabled={isSubmitting || (validationError !== null && name.length > 0)}
        >
          {isSubmitting ? 'Creating...' : 'Create Profile'}
        </button>
      </form>
    </div>
  );
}
