import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme, type ThemePreference } from '@/hooks/useTheme';
import { useProfile } from '@/context/ProfileContext';
import { getSettings, saveSettings } from '@/services/localStorage.service';
import {
  getPermissionStatus,
  requestPermission,
  updateNotificationSettings,
  DEFAULT_MORNING_TIME,
  DEFAULT_EVENING_TIME,
  DEFAULT_FINANCE_TIME,
} from '@/services/notification.service';
import {
  exportProfile,
  downloadExport,
  validateImportFile,
  importProfile,
} from '@/services/export.service';
import {
  isWebAuthnSupported,
  enrollBiometric,
} from '@/services/auth.service';
import { NotificationBanner } from '@/components/shared/NotificationBanner';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';

/**
 * Generate time options in 15-min increments for a given range.
 * @param startHour - Starting hour (inclusive)
 * @param endHour - Ending hour (inclusive, up to :45)
 */
function generateTimeOptions(startHour: number, endHour: number): string[] {
  const options: string[] = [];
  for (let h = startHour; h <= endHour; h++) {
    for (let m = 0; m < 60; m += 15) {
      options.push(
        `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
      );
    }
  }
  return options;
}

const MORNING_TIME_OPTIONS = generateTimeOptions(5, 11);
const EVENING_TIME_OPTIONS = generateTimeOptions(17, 23);
const FINANCE_TIME_OPTIONS = generateTimeOptions(0, 23);

/**
 * Settings screen component.
 * Sections: Theme, Notifications, Data, Account, About.
 * Requirements: 15.4, 15.5, 3.4, 16.3
 */
export function Settings() {
  const navigate = useNavigate();
  const { preference, setPreference } = useTheme();
  const { activeProfileId, db, clearActiveProfile } = useProfile();

  // Load settings from localStorage
  const profileId = activeProfileId ?? '';
  const [settings, setSettingsState] = useState(() => getSettings(profileId));
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>(
    getPermissionStatus()
  );
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [biometricSupported, setBiometricSupported] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(() => {
    try {
      return !!localStorage.getItem(`webauthn_credential_${profileId}`);
    } catch {
      return false;
    }
  });
  const [importConfirmOpen, setImportConfirmOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check biometric support on mount
  useState(() => {
    isWebAuthnSupported().then(setBiometricSupported);
  });

  // --- Theme handlers ---
  const handleThemeChange = (newPref: ThemePreference) => {
    setPreference(newPref);
    const updated = { ...settings, theme: newPref };
    setSettingsState(updated);
    saveSettings(profileId, updated);
  };

  // --- Notification handlers ---
  const handleNotificationsToggle = async () => {
    if (!settings.notificationsEnabled) {
      // Enabling - request permission first
      const result = await requestPermission();
      setPermissionStatus(result);
      if (result !== 'granted') return;
    }

    const enabled = !settings.notificationsEnabled;
    const updated = { ...settings, notificationsEnabled: enabled };
    setSettingsState(updated);
    updateNotificationSettings(profileId, { notificationsEnabled: enabled });
  };

  const handleTimeChange = (
    field: 'habitReminderMorning' | 'habitReminderEvening' | 'financeReminder',
    value: string
  ) => {
    const updated = { ...settings, [field]: value };
    setSettingsState(updated);
    updateNotificationSettings(profileId, { [field]: value });
  };

  // --- Export/Import handlers ---
  const handleExport = async () => {
    if (!db || !activeProfileId) return;
    setIsExporting(true);
    try {
      const blob = await exportProfile(db, activeProfileId);
      downloadExport(blob, activeProfileId);
    } catch {
      // Silent failure
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportError(null);
    const result = await validateImportFile(file);

    if (!result.valid) {
      setImportError(result.error);
      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setImportFile(file);
    setImportConfirmOpen(true);
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleImportConfirm = async () => {
    if (!db || !importFile) return;
    setIsImporting(true);
    setImportConfirmOpen(false);

    try {
      const result = await validateImportFile(importFile);
      if (result.valid && result.data) {
        await importProfile(db, result.data);
      }
    } catch {
      setImportError('Import failed. Please try again.');
    } finally {
      setIsImporting(false);
      setImportFile(null);
    }
  };

  const handleImportCancel = () => {
    setImportConfirmOpen(false);
    setImportFile(null);
  };

  // --- Account handlers ---
  const handleSwitchProfile = useCallback(() => {
    clearActiveProfile();
    navigate('/profiles');
  }, [clearActiveProfile, navigate]);

  const handleBiometricToggle = async () => {
    if (!biometricEnabled) {
      // Enroll
      const success = await enrollBiometric(profileId);
      if (success) setBiometricEnabled(true);
    } else {
      // Disable - remove stored credential
      try {
        localStorage.removeItem(`webauthn_credential_${profileId}`);
      } catch { /* ignore */ }
      setBiometricEnabled(false);
    }
  };

  const handleChangePin = () => {
    navigate('/profiles/auth/' + profileId);
  };

  return (
    <div className="flex flex-col gap-6 pb-8">
      {/* Page Header */}
      <h1
        className="text-2xl font-bold px-4 pt-4"
        style={{ color: 'var(--color-ios-text-primary)' }}
      >
        Settings
      </h1>

      {/* ─── Theme Section ─────────────────────────── */}
      <section className="ios-card mx-4" aria-labelledby="settings-theme-heading">
        <h2
          id="settings-theme-heading"
          className="text-xs font-semibold uppercase tracking-wide mb-3"
          style={{ color: 'var(--color-ios-text-tertiary)' }}
        >
          Appearance
        </h2>

        <div
          className="flex rounded-[var(--radius-md)] overflow-hidden"
          role="radiogroup"
          aria-label="Theme preference"
          style={{ border: '1px solid var(--color-ios-separator)' }}
        >
          {(['light', 'dark', 'system'] as ThemePreference[]).map((option) => (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={preference === option}
              onClick={() => handleThemeChange(option)}
              className="flex-1 py-2.5 text-sm font-medium capitalize transition-colors"
              style={{
                backgroundColor:
                  preference === option
                    ? 'var(--color-ios-blue)'
                    : 'transparent',
                color:
                  preference === option
                    ? '#ffffff'
                    : 'var(--color-ios-text-primary)',
                minHeight: 'var(--spacing-tap-target)',
              }}
            >
              {option}
            </button>
          ))}
        </div>
      </section>

      {/* ─── Notifications Section ─────────────────── */}
      <section className="ios-card mx-4" aria-labelledby="settings-notifications-heading">
        <h2
          id="settings-notifications-heading"
          className="text-xs font-semibold uppercase tracking-wide mb-3"
          style={{ color: 'var(--color-ios-text-tertiary)' }}
        >
          Notifications
        </h2>

        {permissionStatus === 'denied' && !bannerDismissed && (
          <div className="mb-3 -mx-4 -mt-1">
            <NotificationBanner onDismiss={() => setBannerDismissed(true)} />
          </div>
        )}

        {/* Enable toggle */}
        <div className="ios-list-item !px-0">
          <span className="flex-1 text-base" style={{ color: 'var(--color-ios-text-primary)' }}>
            Enable Notifications
          </span>
          <ToggleSwitch
            checked={settings.notificationsEnabled}
            onChange={handleNotificationsToggle}
            label="Enable notifications"
          />
        </div>

        {/* Time pickers (only shown when enabled) */}
        {settings.notificationsEnabled && (
          <div className="flex flex-col gap-0">
            <TimePickerRow
              label="Morning Reminder"
              value={settings.habitReminderMorning ?? DEFAULT_MORNING_TIME}
              options={MORNING_TIME_OPTIONS}
              onChange={(v) => handleTimeChange('habitReminderMorning', v)}
            />
            <TimePickerRow
              label="Evening Reminder"
              value={settings.habitReminderEvening ?? DEFAULT_EVENING_TIME}
              options={EVENING_TIME_OPTIONS}
              onChange={(v) => handleTimeChange('habitReminderEvening', v)}
            />
            <TimePickerRow
              label="Finance Reminder"
              value={settings.financeReminder ?? DEFAULT_FINANCE_TIME}
              options={FINANCE_TIME_OPTIONS}
              onChange={(v) => handleTimeChange('financeReminder', v)}
            />
          </div>
        )}
      </section>

      {/* ─── Data Section ──────────────────────────── */}
      <section className="ios-card mx-4" aria-labelledby="settings-data-heading">
        <h2
          id="settings-data-heading"
          className="text-xs font-semibold uppercase tracking-wide mb-3"
          style={{ color: 'var(--color-ios-text-tertiary)' }}
        >
          Data
        </h2>

        <div className="ios-list-item !px-0">
          <span className="flex-1 text-base" style={{ color: 'var(--color-ios-text-primary)' }}>
            Export Data
          </span>
          <button
            type="button"
            className="ios-btn ios-btn-primary !py-2 !px-4 !text-sm !min-h-[36px]"
            onClick={handleExport}
            disabled={isExporting}
          >
            {isExporting ? 'Exporting…' : 'Export'}
          </button>
        </div>

        <div className="ios-list-item !px-0">
          <span className="flex-1 text-base" style={{ color: 'var(--color-ios-text-primary)' }}>
            Import Data
          </span>
          <button
            type="button"
            className="ios-btn ios-btn-primary !py-2 !px-4 !text-sm !min-h-[36px]"
            onClick={handleImportClick}
            disabled={isImporting}
          >
            {isImporting ? 'Importing…' : 'Import'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={handleFileSelect}
            aria-label="Select import file"
          />
        </div>

        {importError && (
          <p className="text-xs mt-2" style={{ color: 'var(--color-ios-red)' }}>
            {importError}
          </p>
        )}
      </section>

      {/* ─── Account Section ───────────────────────── */}
      <section className="ios-card mx-4" aria-labelledby="settings-account-heading">
        <h2
          id="settings-account-heading"
          className="text-xs font-semibold uppercase tracking-wide mb-3"
          style={{ color: 'var(--color-ios-text-tertiary)' }}
        >
          Account
        </h2>

        <div className="ios-list-item !px-0">
          <span className="flex-1 text-base" style={{ color: 'var(--color-ios-text-primary)' }}>
            Switch Profile
          </span>
          <button
            type="button"
            className="ios-btn !py-2 !px-4 !text-sm !min-h-[36px]"
            style={{
              backgroundColor: 'var(--color-ios-separator)',
              color: 'var(--color-ios-text-primary)',
            }}
            onClick={handleSwitchProfile}
          >
            Switch
          </button>
        </div>

        {biometricSupported && (
          <div className="ios-list-item !px-0">
            <span className="flex-1 text-base" style={{ color: 'var(--color-ios-text-primary)' }}>
              Biometric Lock
            </span>
            <ToggleSwitch
              checked={biometricEnabled}
              onChange={handleBiometricToggle}
              label="Enable biometric lock"
            />
          </div>
        )}

        <div className="ios-list-item !px-0">
          <span className="flex-1 text-base" style={{ color: 'var(--color-ios-text-primary)' }}>
            Change PIN
          </span>
          <button
            type="button"
            className="ios-btn !py-2 !px-4 !text-sm !min-h-[36px]"
            style={{
              backgroundColor: 'var(--color-ios-separator)',
              color: 'var(--color-ios-text-primary)',
            }}
            onClick={handleChangePin}
          >
            Change
          </button>
        </div>
      </section>

      {/* ─── About Section ─────────────────────────── */}
      <section className="ios-card mx-4" aria-labelledby="settings-about-heading">
        <h2
          id="settings-about-heading"
          className="text-xs font-semibold uppercase tracking-wide mb-3"
          style={{ color: 'var(--color-ios-text-tertiary)' }}
        >
          About
        </h2>

        <div className="ios-list-item !px-0">
          <span className="flex-1 text-base" style={{ color: 'var(--color-ios-text-primary)' }}>
            App Name
          </span>
          <span className="text-sm" style={{ color: 'var(--color-ios-text-secondary)' }}>
            Life Dashboard
          </span>
        </div>

        <div className="ios-list-item !px-0 !border-b-0">
          <span className="flex-1 text-base" style={{ color: 'var(--color-ios-text-primary)' }}>
            Version
          </span>
          <span className="text-sm" style={{ color: 'var(--color-ios-text-secondary)' }}>
            1.0.0
          </span>
        </div>
      </section>

      {/* Import Confirm Dialog */}
      <ConfirmDialog
        isOpen={importConfirmOpen}
        title="Import Data"
        message="This will replace all existing data with the imported data. This action cannot be undone."
        confirmLabel="Import"
        cancelLabel="Cancel"
        onConfirm={handleImportConfirm}
        onCancel={handleImportCancel}
        destructive
      />
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface ToggleSwitchProps {
  checked: boolean;
  onChange: () => void;
  label: string;
}

function ToggleSwitch({ checked, onChange, label }: ToggleSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className="relative inline-flex h-[31px] w-[51px] shrink-0 cursor-pointer rounded-full transition-colors"
      style={{
        backgroundColor: checked ? 'var(--color-ios-green)' : 'var(--color-ios-separator)',
        transitionDuration: 'var(--duration-fast)',
      }}
    >
      <span
        className="pointer-events-none inline-block h-[27px] w-[27px] rounded-full bg-white shadow-md transition-transform"
        style={{
          transform: checked ? 'translateX(22px)' : 'translateX(2px)',
          marginTop: '2px',
          transitionDuration: 'var(--duration-fast)',
          transitionTimingFunction: 'var(--ease-ios-spring)',
        }}
      />
    </button>
  );
}

interface TimePickerRowProps {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}

function TimePickerRow({ label, value, options, onChange }: TimePickerRowProps) {
  return (
    <div className="ios-list-item !px-0">
      <span className="flex-1 text-sm" style={{ color: 'var(--color-ios-text-primary)' }}>
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="ios-input !w-auto !min-h-[36px] !py-1 !px-3 !text-sm"
        aria-label={`${label} time`}
      >
        {options.map((time) => (
          <option key={time} value={time}>
            {time}
          </option>
        ))}
      </select>
    </div>
  );
}
