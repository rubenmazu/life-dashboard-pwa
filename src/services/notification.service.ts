import { getSettings, saveSettings } from './localStorage.service';

// Default reminder times
export const DEFAULT_MORNING_TIME = '08:00';
export const DEFAULT_EVENING_TIME = '20:00';
export const DEFAULT_FINANCE_TIME = '19:00';

// Store scheduled interval IDs for cancellation
let scheduledIntervals: number[] = [];

/**
 * Checks if the Notification API is available in the current environment.
 */
function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

/**
 * Requests notification permission from the user.
 * Returns 'default' if the Notification API is not available.
 */
export async function requestPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) {
    return 'default';
  }
  try {
    const result = await Notification.requestPermission();
    return result;
  } catch {
    return 'default';
  }
}

/**
 * Returns the current notification permission state.
 * Returns 'default' if the Notification API is not available.
 */
export function getPermissionStatus(): NotificationPermission {
  if (!isNotificationSupported()) {
    return 'default';
  }
  return Notification.permission;
}

/**
 * Validates a reminder time string based on the type.
 * - Morning: 05:00–11:59
 * - Evening: 17:00–23:59
 * - Finance: any time (00:00–23:59)
 * - All times must be in 15-minute increments (minutes divisible by 15)
 *
 * @param time - Time string in "HH:MM" format
 * @param type - Reminder type: 'morning', 'evening', or 'finance'
 * @returns true if the time is valid for the given type
 */
export function validateReminderTime(
  time: string,
  type: 'morning' | 'evening' | 'finance'
): boolean {
  // Validate format: must be "HH:MM"
  const timeRegex = /^(\d{2}):(\d{2})$/;
  const match = time.match(timeRegex);
  if (!match) return false;

  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);

  // Validate basic time bounds
  if (hours < 0 || hours > 23) return false;
  if (minutes < 0 || minutes > 59) return false;

  // Must be in 15-minute increments
  if (minutes % 15 !== 0) return false;

  // Validate time range based on type
  switch (type) {
    case 'morning':
      // 05:00–11:59
      return hours >= 5 && hours <= 11;
    case 'evening':
      // 17:00–23:59
      return hours >= 17 && hours <= 23;
    case 'finance':
      // Any time of day
      return true;
    default:
      return false;
  }
}

/**
 * Calculates the milliseconds until the next occurrence of a given time.
 * If the time has already passed today, returns the ms until tomorrow at that time.
 */
function getMillisecondsUntilTime(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  const now = new Date();
  const target = new Date();
  target.setHours(hours, minutes, 0, 0);

  // If the target time has already passed today, schedule for tomorrow
  if (target.getTime() <= now.getTime()) {
    target.setDate(target.getDate() + 1);
  }

  return target.getTime() - now.getTime();
}

/**
 * Shows a notification with the given title and body.
 * Does nothing if notifications are not supported or permission is not granted.
 */
function showNotification(title: string, body: string): void {
  if (!isNotificationSupported()) return;
  if (Notification.permission !== 'granted') return;

  try {
    new Notification(title, { body });
  } catch {
    // Silent failure — notification delivery is best-effort
  }
}

/**
 * Schedules a daily habit reminder notification.
 * Uses setTimeout for the first occurrence, then setInterval for subsequent daily repeats.
 *
 * @param time - Time in "HH:MM" format
 * @param period - 'morning' or 'evening'
 */
export function scheduleHabitReminder(
  time: string,
  period: 'morning' | 'evening'
): void {
  if (!isNotificationSupported()) return;
  if (Notification.permission !== 'granted') return;

  const msUntilFirst = getMillisecondsUntilTime(time);
  const oneDayMs = 24 * 60 * 60 * 1000;

  const title = period === 'morning'
    ? '🌅 Morning Habits'
    : '🌙 Evening Habits';
  const body = period === 'morning'
    ? 'Time to complete your morning habits!'
    : 'Time to complete your evening habits!';

  // Schedule the first notification
  const timeoutId = window.setTimeout(() => {
    showNotification(title, body);

    // Then schedule daily repeats
    const intervalId = window.setInterval(() => {
      showNotification(title, body);
    }, oneDayMs);
    scheduledIntervals.push(intervalId);
  }, msUntilFirst);

  scheduledIntervals.push(timeoutId);
}

/**
 * Schedules a daily finance reminder notification.
 * Uses setTimeout for the first occurrence, then setInterval for subsequent daily repeats.
 *
 * @param time - Time in "HH:MM" format
 */
export function scheduleFinanceReminder(time: string): void {
  if (!isNotificationSupported()) return;
  if (Notification.permission !== 'granted') return;

  const msUntilFirst = getMillisecondsUntilTime(time);
  const oneDayMs = 24 * 60 * 60 * 1000;

  const title = '💰 Finance Reminder';
  const body = 'Don\'t forget to log your expenses today!';

  // Schedule the first notification
  const timeoutId = window.setTimeout(() => {
    showNotification(title, body);

    // Then schedule daily repeats
    const intervalId = window.setInterval(() => {
      showNotification(title, body);
    }, oneDayMs);
    scheduledIntervals.push(intervalId);
  }, msUntilFirst);

  scheduledIntervals.push(timeoutId);
}

/**
 * Cancels all scheduled notification reminders.
 */
export function cancelAll(): void {
  for (const id of scheduledIntervals) {
    window.clearTimeout(id);
    window.clearInterval(id);
  }
  scheduledIntervals = [];
}

/**
 * Initializes notification reminders based on the stored settings for a profile.
 * Cancels any existing schedules before setting up new ones.
 *
 * @param profileId - The active profile ID
 */
export function initializeReminders(profileId: string): void {
  cancelAll();

  const settings = getSettings(profileId);
  if (!settings.notificationsEnabled) return;
  if (getPermissionStatus() !== 'granted') return;

  // Schedule morning habit reminder
  const morningTime = settings.habitReminderMorning ?? DEFAULT_MORNING_TIME;
  if (validateReminderTime(morningTime, 'morning')) {
    scheduleHabitReminder(morningTime, 'morning');
  }

  // Schedule evening habit reminder
  const eveningTime = settings.habitReminderEvening ?? DEFAULT_EVENING_TIME;
  if (validateReminderTime(eveningTime, 'evening')) {
    scheduleHabitReminder(eveningTime, 'evening');
  }

  // Schedule finance reminder
  const financeTime = settings.financeReminder ?? DEFAULT_FINANCE_TIME;
  if (validateReminderTime(financeTime, 'finance')) {
    scheduleFinanceReminder(financeTime);
  }
}

/**
 * Updates the notification settings for a profile and reschedules reminders.
 *
 * @param profileId - The active profile ID
 * @param updates - Partial settings to merge with existing settings
 */
export function updateNotificationSettings(
  profileId: string,
  updates: {
    notificationsEnabled?: boolean;
    habitReminderMorning?: string | null;
    habitReminderEvening?: string | null;
    financeReminder?: string | null;
  }
): void {
  const current = getSettings(profileId);
  const updated = { ...current, ...updates };
  saveSettings(profileId, updated);

  // Reschedule reminders with new settings
  initializeReminders(profileId);
}
