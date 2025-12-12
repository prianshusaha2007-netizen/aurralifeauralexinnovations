import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

interface NotificationOptions {
  title: string;
  body?: string;
  icon?: string;
  tag?: string;
  data?: any;
}

export const useNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    setIsSupported('Notification' in window);
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      toast.error('Notifications are not supported in this browser');
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        toast.success('Notifications enabled!');
        return true;
      } else if (result === 'denied') {
        toast.error('Notifications blocked. Please enable them in browser settings.');
        return false;
      }
      return false;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      toast.error('Failed to request notification permission');
      return false;
    }
  }, [isSupported]);

  const sendNotification = useCallback(async (options: NotificationOptions) => {
    if (!isSupported) {
      console.log('Notifications not supported');
      return null;
    }

    if (permission !== 'granted') {
      const granted = await requestPermission();
      if (!granted) return null;
    }

    try {
      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon || '/favicon.ico',
        tag: options.tag,
        data: options.data,
      });

      notification.onclick = (event) => {
        event.preventDefault();
        window.focus();
        notification.close();
      };

      return notification;
    } catch (error) {
      console.error('Error sending notification:', error);
      // Fallback to toast
      toast(options.title, {
        description: options.body,
      });
      return null;
    }
  }, [isSupported, permission, requestPermission]);

  const scheduleNotification = useCallback((options: NotificationOptions, delayMs: number) => {
    const timeoutId = setTimeout(() => {
      sendNotification(options);
    }, delayMs);

    return () => clearTimeout(timeoutId);
  }, [sendNotification]);

  const scheduleReminder = useCallback((
    reminderText: string,
    reminderTime: Date,
  ) => {
    const now = new Date();
    const delay = reminderTime.getTime() - now.getTime();

    if (delay <= 0) {
      console.log('Reminder time has already passed');
      return null;
    }

    return scheduleNotification({
      title: '⏰ AURA Reminder',
      body: reminderText,
      tag: `reminder-${Date.now()}`,
    }, delay);
  }, [scheduleNotification]);

  return {
    isSupported,
    permission,
    requestPermission,
    sendNotification,
    scheduleNotification,
    scheduleReminder,
  };
};
