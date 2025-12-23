import { useCallback, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications, ScheduleOn } from '@capacitor/local-notifications';
import { Reminder } from './useReminders';
import { toast } from 'sonner';

export const useReminderNotifications = () => {
  const isNative = Capacitor.isNativePlatform();

  // Initialize notification listeners
  useEffect(() => {
    if (!isNative) return;

    const setupListeners = async () => {
      try {
        // Request permissions on mount
        const permission = await LocalNotifications.checkPermissions();
        if (permission.display === 'prompt') {
          await LocalNotifications.requestPermissions();
        }

        // Listen for notification actions
        await LocalNotifications.addListener('localNotificationActionPerformed', (action) => {
          console.log('Notification action:', action);
          const { actionId, notification } = action;
          
          if (actionId === 'snooze') {
            toast.info('Snoozed for 5 minutes');
          } else if (actionId === 'done') {
            toast.success('Marked as done!');
          }
        });

        // Register action types
        await LocalNotifications.registerActionTypes({
          types: [
            {
              id: 'REMINDER_ACTIONS',
              actions: [
                { id: 'snooze', title: 'Snooze 5 min' },
                { id: 'done', title: 'Done', destructive: false }
              ]
            },
            {
              id: 'ALARM_ACTIONS',
              actions: [
                { id: 'snooze', title: 'Snooze' },
                { id: 'stop', title: 'Stop', destructive: true }
              ]
            }
          ]
        });
      } catch (error) {
        console.error('Notification setup error:', error);
      }
    };

    setupListeners();

    return () => {
      LocalNotifications.removeAllListeners();
    };
  }, [isNative]);

  // Schedule a reminder notification
  const scheduleReminderNotification = useCallback(async (reminder: Reminder): Promise<boolean> => {
    try {
      // For web, use browser notifications
      if (!isNative) {
        return scheduleWebNotification(reminder);
      }

      // For native, use Capacitor LocalNotifications
      const permission = await LocalNotifications.checkPermissions();
      if (permission.display !== 'granted') {
        const request = await LocalNotifications.requestPermissions();
        if (request.display !== 'granted') {
          toast.error('Please enable notifications in settings');
          return false;
        }
      }

      const notificationId = generateNotificationId(reminder.id);
      const scheduleAt = new Date(reminder.time);

      // Don't schedule if time has passed
      if (scheduleAt <= new Date()) {
        return false;
      }

      // Build notification config
      const notificationConfig: any = {
        id: notificationId,
        title: getNotificationTitle(reminder),
        body: reminder.title,
        schedule: { at: scheduleAt },
        sound: reminder.category === 'alarm' ? 'alarm.wav' : 'default',
        actionTypeId: reminder.category === 'alarm' ? 'ALARM_ACTIONS' : 'REMINDER_ACTIONS',
        extra: {
          reminderId: reminder.id,
          category: reminder.category
        }
      };

      // Handle repeating reminders
      if (reminder.repeatPattern !== 'none') {
        notificationConfig.schedule = {
          ...notificationConfig.schedule,
          repeats: true,
          every: getRepeatInterval(reminder.repeatPattern)
        };
      }

      await LocalNotifications.schedule({
        notifications: [notificationConfig]
      });

      console.log('Scheduled notification for:', scheduleAt);
      return true;
    } catch (error) {
      console.error('Schedule notification error:', error);
      return false;
    }
  }, [isNative]);

  // Cancel a scheduled notification
  const cancelReminderNotification = useCallback(async (reminderId: string): Promise<boolean> => {
    try {
      if (!isNative) {
        return true; // Web notifications can't be cancelled
      }

      const notificationId = generateNotificationId(reminderId);
      await LocalNotifications.cancel({ notifications: [{ id: notificationId }] });
      return true;
    } catch (error) {
      console.error('Cancel notification error:', error);
      return false;
    }
  }, [isNative]);

  // Get all pending notifications
  const getPendingNotifications = useCallback(async () => {
    try {
      if (!isNative) return [];
      
      const pending = await LocalNotifications.getPending();
      return pending.notifications;
    } catch (error) {
      console.error('Get pending error:', error);
      return [];
    }
  }, [isNative]);

  // Web notification fallback
  const scheduleWebNotification = async (reminder: Reminder): Promise<boolean> => {
    if (!('Notification' in window)) {
      return false;
    }

    if (Notification.permission === 'default') {
      await Notification.requestPermission();
    }

    if (Notification.permission !== 'granted') {
      return false;
    }

    const delay = new Date(reminder.time).getTime() - Date.now();
    if (delay <= 0) return false;

    setTimeout(() => {
      new Notification(getNotificationTitle(reminder), {
        body: reminder.title,
        icon: '/favicon.ico',
        tag: reminder.id,
        requireInteraction: true
      });
    }, delay);

    return true;
  };

  return {
    scheduleReminderNotification,
    cancelReminderNotification,
    getPendingNotifications,
    isNative
  };
};

// Helper functions
function generateNotificationId(reminderId: string): number {
  let hash = 0;
  for (let i = 0; i < reminderId.length; i++) {
    const char = reminderId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

function getNotificationTitle(reminder: Reminder): string {
  const titles: Record<string, string> = {
    'alarm': '⏰ Wake Up!',
    'health': '💊 Health Reminder',
    'productivity': '📚 Time to Focus',
    'repeating': '🔁 Reminder',
    'one-time': '🔔 AURA Reminder'
  };
  return titles[reminder.category] || '🔔 AURA Reminder';
}

function getRepeatInterval(pattern: string): 'day' | 'week' | 'month' {
  switch (pattern) {
    case 'daily':
      return 'day';
    case 'weekly':
      return 'week';
    default:
      return 'day';
  }
}
