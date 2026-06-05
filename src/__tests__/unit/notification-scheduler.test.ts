import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  requestPermission,
  getPermissionStatus,
  validateReminderTime,
  scheduleHabitReminder,
  scheduleFinanceReminder,
  cancelAll,
  initializeReminders,
  updateNotificationSettings,
  DEFAULT_MORNING_TIME,
  DEFAULT_EVENING_TIME,
  DEFAULT_FINANCE_TIME,
} from '../../services/notification.service';
import * as localStorageService from '../../services/localStorage.service';

describe('NotificationService', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    cancelAll();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('Default times', () => {
    it('should have correct default morning time', () => {
      expect(DEFAULT_MORNING_TIME).toBe('08:00');
    });

    it('should have correct default evening time', () => {
      expect(DEFAULT_EVENING_TIME).toBe('20:00');
    });

    it('should have correct default finance time', () => {
      expect(DEFAULT_FINANCE_TIME).toBe('19:00');
    });
  });

  describe('validateReminderTime', () => {
    describe('format validation', () => {
      it('should reject empty string', () => {
        expect(validateReminderTime('', 'finance')).toBe(false);
      });

      it('should reject invalid format', () => {
        expect(validateReminderTime('8:00', 'finance')).toBe(false);
        expect(validateReminderTime('08:0', 'finance')).toBe(false);
        expect(validateReminderTime('abc', 'finance')).toBe(false);
        expect(validateReminderTime('24:00', 'finance')).toBe(false);
      });

      it('should reject invalid hour values', () => {
        expect(validateReminderTime('25:00', 'finance')).toBe(false);
      });

      it('should reject invalid minute values', () => {
        expect(validateReminderTime('08:60', 'finance')).toBe(false);
      });
    });

    describe('15-minute increment validation', () => {
      it('should accept times at 15-minute increments', () => {
        expect(validateReminderTime('08:00', 'morning')).toBe(true);
        expect(validateReminderTime('08:15', 'morning')).toBe(true);
        expect(validateReminderTime('08:30', 'morning')).toBe(true);
        expect(validateReminderTime('08:45', 'morning')).toBe(true);
      });

      it('should reject times not at 15-minute increments', () => {
        expect(validateReminderTime('08:01', 'morning')).toBe(false);
        expect(validateReminderTime('08:10', 'morning')).toBe(false);
        expect(validateReminderTime('08:20', 'morning')).toBe(false);
        expect(validateReminderTime('08:55', 'morning')).toBe(false);
      });
    });

    describe('morning time range (05:00–11:59)', () => {
      it('should accept valid morning times', () => {
        expect(validateReminderTime('05:00', 'morning')).toBe(true);
        expect(validateReminderTime('08:00', 'morning')).toBe(true);
        expect(validateReminderTime('11:00', 'morning')).toBe(true);
        expect(validateReminderTime('11:45', 'morning')).toBe(true);
      });

      it('should reject times before 05:00', () => {
        expect(validateReminderTime('04:45', 'morning')).toBe(false);
        expect(validateReminderTime('00:00', 'morning')).toBe(false);
      });

      it('should reject times at or after 12:00', () => {
        expect(validateReminderTime('12:00', 'morning')).toBe(false);
        expect(validateReminderTime('17:00', 'morning')).toBe(false);
      });
    });

    describe('evening time range (17:00–23:59)', () => {
      it('should accept valid evening times', () => {
        expect(validateReminderTime('17:00', 'evening')).toBe(true);
        expect(validateReminderTime('20:00', 'evening')).toBe(true);
        expect(validateReminderTime('23:00', 'evening')).toBe(true);
        expect(validateReminderTime('23:45', 'evening')).toBe(true);
      });

      it('should reject times before 17:00', () => {
        expect(validateReminderTime('16:45', 'evening')).toBe(false);
        expect(validateReminderTime('08:00', 'evening')).toBe(false);
      });
    });

    describe('finance time range (any time)', () => {
      it('should accept any valid time for finance', () => {
        expect(validateReminderTime('00:00', 'finance')).toBe(true);
        expect(validateReminderTime('08:00', 'finance')).toBe(true);
        expect(validateReminderTime('12:30', 'finance')).toBe(true);
        expect(validateReminderTime('23:45', 'finance')).toBe(true);
      });
    });
  });

  describe('getPermissionStatus', () => {
    it('should return "default" when Notification API is not available', () => {
      const originalNotification = global.Notification;
      // @ts-expect-error - testing missing API
      delete global.Notification;
      expect(getPermissionStatus()).toBe('default');
      global.Notification = originalNotification;
    });

    it('should return the current Notification.permission', () => {
      // Set up a mock Notification object with the permission property
      global.Notification = Object.assign(
        function MockNotification() {},
        { permission: 'granted', requestPermission: vi.fn() }
      ) as unknown as typeof Notification;
      expect(getPermissionStatus()).toBe('granted');
    });
  });

  describe('requestPermission', () => {
    it('should return "default" when Notification API is not available', async () => {
      const originalNotification = global.Notification;
      // @ts-expect-error - testing missing API
      delete global.Notification;
      const result = await requestPermission();
      expect(result).toBe('default');
      global.Notification = originalNotification;
    });

    it('should call Notification.requestPermission and return the result', async () => {
      const mockRequestPermission = vi.fn().mockResolvedValue('granted');
      global.Notification = {
        ...global.Notification,
        requestPermission: mockRequestPermission,
      } as unknown as typeof Notification;

      const result = await requestPermission();
      expect(result).toBe('granted');
      expect(mockRequestPermission).toHaveBeenCalled();
    });
  });

  describe('scheduleHabitReminder', () => {
    beforeEach(() => {
      global.Notification = Object.assign(
        function MockNotification() {},
        { permission: 'granted' as NotificationPermission, requestPermission: vi.fn() }
      ) as unknown as typeof Notification;
    });

    it('should not schedule when permission is not granted', () => {
      global.Notification = Object.assign(
        function MockNotification() {},
        { permission: 'denied' as NotificationPermission, requestPermission: vi.fn() }
      ) as unknown as typeof Notification;
      const spy = vi.spyOn(global, 'setTimeout');
      scheduleHabitReminder('08:00', 'morning');
      expect(spy).not.toHaveBeenCalled();
    });

    it('should schedule a timeout when permission is granted', () => {
      const spy = vi.spyOn(global, 'setTimeout');
      scheduleHabitReminder('08:00', 'morning');
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('scheduleFinanceReminder', () => {
    beforeEach(() => {
      global.Notification = Object.assign(
        function MockNotification() {},
        { permission: 'granted' as NotificationPermission, requestPermission: vi.fn() }
      ) as unknown as typeof Notification;
    });

    it('should schedule a timeout when permission is granted', () => {
      const spy = vi.spyOn(global, 'setTimeout');
      scheduleFinanceReminder('19:00');
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('cancelAll', () => {
    beforeEach(() => {
      global.Notification = Object.assign(
        function MockNotification() {},
        { permission: 'granted' as NotificationPermission, requestPermission: vi.fn() }
      ) as unknown as typeof Notification;
    });

    it('should clear all scheduled timers', () => {
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval');

      scheduleHabitReminder('08:00', 'morning');
      scheduleFinanceReminder('19:00');
      cancelAll();

      expect(clearTimeoutSpy.mock.calls.length + clearIntervalSpy.mock.calls.length).toBeGreaterThan(0);
    });
  });

  describe('initializeReminders', () => {
    beforeEach(() => {
      global.Notification = Object.assign(
        function MockNotification() {},
        { permission: 'granted' as NotificationPermission, requestPermission: vi.fn() }
      ) as unknown as typeof Notification;
    });

    it('should not schedule reminders when notifications are disabled', () => {
      vi.spyOn(localStorageService, 'getSettings').mockReturnValue({
        habitReminderMorning: '08:00',
        habitReminderEvening: '20:00',
        financeReminder: '19:00',
        notificationsEnabled: false,
        theme: 'system',
      });
      const spy = vi.spyOn(global, 'setTimeout');
      initializeReminders('profile-1');
      expect(spy).not.toHaveBeenCalled();
    });

    it('should schedule all reminders with default times when enabled', () => {
      vi.spyOn(localStorageService, 'getSettings').mockReturnValue({
        habitReminderMorning: null,
        habitReminderEvening: null,
        financeReminder: null,
        notificationsEnabled: true,
        theme: 'system',
      });
      const spy = vi.spyOn(global, 'setTimeout');
      initializeReminders('profile-1');
      // Should schedule morning, evening, and finance (3 setTimeout calls)
      expect(spy).toHaveBeenCalledTimes(3);
    });

    it('should use custom times from settings when available', () => {
      vi.spyOn(localStorageService, 'getSettings').mockReturnValue({
        habitReminderMorning: '09:00',
        habitReminderEvening: '21:00',
        financeReminder: '18:00',
        notificationsEnabled: true,
        theme: 'system',
      });
      const spy = vi.spyOn(global, 'setTimeout');
      initializeReminders('profile-1');
      expect(spy).toHaveBeenCalledTimes(3);
    });
  });

  describe('updateNotificationSettings', () => {
    it('should save updated settings and reinitialize reminders', () => {
      const saveSpy = vi.spyOn(localStorageService, 'saveSettings');
      vi.spyOn(localStorageService, 'getSettings').mockReturnValue({
        habitReminderMorning: '08:00',
        habitReminderEvening: '20:00',
        financeReminder: '19:00',
        notificationsEnabled: false,
        theme: 'system',
      });

      updateNotificationSettings('profile-1', { notificationsEnabled: true });

      expect(saveSpy).toHaveBeenCalledWith('profile-1', expect.objectContaining({
        notificationsEnabled: true,
      }));
    });
  });
});
