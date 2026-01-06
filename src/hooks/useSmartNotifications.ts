import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { useMentorship } from './useMentorship';

export interface NotificationPreference {
  category: string;
  enabled: boolean;
  gentleMode: boolean; // Less intrusive notifications
  quietHoursStart: string;
  quietHoursEnd: string;
  maxPerHour: number;
}

export interface SmartNotification {
  id: string;
  title: string;
  body: string;
  category: 'routine' | 'reminder' | 'hydration' | 'focus' | 'motivation' | 'mentorship';
  priority: 'low' | 'medium' | 'high';
  scheduledFor: Date;
  sent: boolean;
  dismissed: boolean;
  snoozedUntil?: Date;
}

interface UserBehavior {
  responseRate: number; // 0-1, how often user responds to notifications
  preferredTimes: string[]; // Times user is most responsive
  dismissPatterns: string[]; // Categories often dismissed
  lastInteraction: Date;
}

const NOTIFICATION_STORAGE_KEY = 'aurra-smart-notifications';
const BEHAVIOR_STORAGE_KEY = 'aurra-notification-behavior';
const PREFS_STORAGE_KEY = 'aurra-notification-prefs';

const DEFAULT_PREFS: NotificationPreference[] = [
  { category: 'routine', enabled: true, gentleMode: false, quietHoursStart: '23:00', quietHoursEnd: '07:00', maxPerHour: 3 },
  { category: 'reminder', enabled: true, gentleMode: false, quietHoursStart: '23:00', quietHoursEnd: '07:00', maxPerHour: 4 },
  { category: 'hydration', enabled: true, gentleMode: true, quietHoursStart: '22:00', quietHoursEnd: '08:00', maxPerHour: 2 },
  { category: 'focus', enabled: true, gentleMode: false, quietHoursStart: '00:00', quietHoursEnd: '06:00', maxPerHour: 2 },
  { category: 'motivation', enabled: true, gentleMode: true, quietHoursStart: '21:00', quietHoursEnd: '09:00', maxPerHour: 1 },
  { category: 'mentorship', enabled: true, gentleMode: true, quietHoursStart: '22:00', quietHoursEnd: '08:00', maxPerHour: 1 },
];

export const useSmartNotifications = () => {
  const { isInQuietHours: isMentorshipQuietHours, profile: mentorshipProfile } = useMentorship();
  const [notifications, setNotifications] = useState<SmartNotification[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreference[]>(DEFAULT_PREFS);
  const [behavior, setBehavior] = useState<UserBehavior>({
    responseRate: 0.7,
    preferredTimes: ['09:00', '12:00', '18:00'],
    dismissPatterns: [],
    lastInteraction: new Date()
  });
  const [permission, setPermission] = useState<NotificationPermission>('default');

  // Load data from localStorage
  useEffect(() => {
    const storedNotifications = localStorage.getItem(NOTIFICATION_STORAGE_KEY);
    const storedBehavior = localStorage.getItem(BEHAVIOR_STORAGE_KEY);
    const storedPrefs = localStorage.getItem(PREFS_STORAGE_KEY);

    if (storedNotifications) {
      try {
        setNotifications(JSON.parse(storedNotifications).map((n: any) => ({
          ...n,
          scheduledFor: new Date(n.scheduledFor),
          snoozedUntil: n.snoozedUntil ? new Date(n.snoozedUntil) : undefined
        })));
      } catch (e) {
        console.error('Error parsing notifications:', e);
      }
    }

    if (storedBehavior) {
      try {
        const parsed = JSON.parse(storedBehavior);
        setBehavior({
          ...parsed,
          lastInteraction: new Date(parsed.lastInteraction)
        });
      } catch (e) {
        console.error('Error parsing behavior:', e);
      }
    }

    if (storedPrefs) {
      try {
        setPreferences(JSON.parse(storedPrefs));
      } catch (e) {
        console.error('Error parsing preferences:', e);
      }
    }

    // Check notification permission
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  // Save data to localStorage
  useEffect(() => {
    localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem(BEHAVIOR_STORAGE_KEY, JSON.stringify(behavior));
  }, [behavior]);

  useEffect(() => {
    localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(preferences));
  }, [preferences]);

  const requestPermission = useCallback(async () => {
    if ('Notification' in window) {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === 'granted';
    }
    return false;
  }, []);

  const isQuietHours = useCallback((category: string) => {
    const pref = preferences.find(p => p.category === category);
    if (!pref) return false;

    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    // Handle overnight quiet hours
    if (pref.quietHoursStart > pref.quietHoursEnd) {
      return currentTime >= pref.quietHoursStart || currentTime <= pref.quietHoursEnd;
    }
    
    return currentTime >= pref.quietHoursStart && currentTime <= pref.quietHoursEnd;
  }, [preferences]);

  const shouldSendNotification = useCallback((notification: SmartNotification) => {
    const pref = preferences.find(p => p.category === notification.category);
    
    if (!pref?.enabled) return false;
    
    // Check category-specific quiet hours
    if (isQuietHours(notification.category)) return false;

    // IMPORTANT: Also check mentorship quiet hours for all notifications
    // This respects the user's "do not disturb" preferences from mentorship setup
    if (isMentorshipQuietHours()) {
      // Only allow high priority notifications during mentorship quiet hours
      if (notification.priority !== 'high') return false;
    }

    // If user set "only if user messages first", block non-essential notifications
    if (mentorshipProfile.only_if_user_messages_first && notification.priority !== 'high') {
      return false;
    }

    // Check rate limiting
    const now = new Date();
    const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const recentCount = notifications.filter(
      n => n.category === notification.category && 
           n.sent && 
           new Date(n.scheduledFor) >= hourAgo
    ).length;

    if (recentCount >= pref.maxPerHour) return false;

    // Adaptive behavior: reduce notifications if user often dismisses this category
    if (behavior.dismissPatterns.includes(notification.category)) {
      // 50% chance to skip if often dismissed
      if (Math.random() > 0.5) return false;
    }

    return true;
  }, [preferences, notifications, behavior, isQuietHours, isMentorshipQuietHours, mentorshipProfile]);

  const scheduleNotification = useCallback((notification: Omit<SmartNotification, 'id' | 'sent' | 'dismissed'>) => {
    const newNotification: SmartNotification = {
      ...notification,
      id: crypto.randomUUID(),
      sent: false,
      dismissed: false
    };

    setNotifications(prev => [...prev, newNotification]);
    return newNotification;
  }, []);

  const sendNotification = useCallback(async (notification: SmartNotification) => {
    if (!shouldSendNotification(notification)) {
      return false;
    }

    const pref = preferences.find(p => p.category === notification.category);
    
    // Use gentle mode if enabled
    if (pref?.gentleMode) {
      // Just show a subtle toast instead of system notification
      toast(notification.title, {
        description: notification.body,
        duration: 4000,
      });
    } else if (permission === 'granted') {
      // Full system notification
      new Notification(notification.title, {
        body: notification.body,
        icon: '/favicon.jpeg',
        tag: notification.id,
        requireInteraction: notification.priority === 'high'
      });
    }

    setNotifications(prev => prev.map(n => 
      n.id === notification.id ? { ...n, sent: true } : n
    ));

    return true;
  }, [shouldSendNotification, preferences, permission]);

  const dismissNotification = useCallback((id: string) => {
    const notification = notifications.find(n => n.id === id);
    
    if (notification) {
      // Track dismiss pattern
      setBehavior(prev => {
        const category = notification.category;
        const dismissCount = prev.dismissPatterns.filter(c => c === category).length;
        
        // If dismissed more than 3 times recently, add to patterns
        if (dismissCount >= 2) {
          if (!prev.dismissPatterns.includes(category)) {
            return {
              ...prev,
              dismissPatterns: [...prev.dismissPatterns, category],
              lastInteraction: new Date()
            };
          }
        }
        
        return {
          ...prev,
          dismissPatterns: [...prev.dismissPatterns, category],
          lastInteraction: new Date()
        };
      });
    }

    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, dismissed: true } : n
    ));
  }, [notifications]);

  const snoozeNotification = useCallback((id: string, minutes: number) => {
    const snoozedUntil = new Date();
    snoozedUntil.setMinutes(snoozedUntil.getMinutes() + minutes);
    
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, snoozedUntil, sent: false } : n
    ));

    toast('Snoozed', { description: `Reminder in ${minutes} minutes` });
  }, []);

  const updatePreference = useCallback((category: string, updates: Partial<NotificationPreference>) => {
    setPreferences(prev => prev.map(p => 
      p.category === category ? { ...p, ...updates } : p
    ));
  }, []);

  const getGentleReminder = useCallback((title: string, body: string): string => {
    // Transform notification text to be gentler
    const gentlePrefixes = [
      'When you have a moment: ',
      'Gentle reminder: ',
      'No rush, but: ',
      'Whenever you\'re ready: ',
    ];
    const prefix = gentlePrefixes[Math.floor(Math.random() * gentlePrefixes.length)];
    return prefix + body.charAt(0).toLowerCase() + body.slice(1);
  }, []);

  // Periodic check for scheduled notifications
  useEffect(() => {
    const checkNotifications = () => {
      const now = new Date();
      
      notifications.forEach(notification => {
        if (notification.sent || notification.dismissed) return;
        
        // Check if snoozed
        if (notification.snoozedUntil && now < notification.snoozedUntil) return;
        
        // Check if time to send
        if (now >= new Date(notification.scheduledFor)) {
          sendNotification(notification);
        }
      });
    };

    const interval = setInterval(checkNotifications, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [notifications, sendNotification]);

  return {
    notifications,
    preferences,
    behavior,
    permission,
    requestPermission,
    scheduleNotification,
    sendNotification,
    dismissNotification,
    snoozeNotification,
    updatePreference,
    getGentleReminder,
    isQuietHours,
    isMentorshipQuietHours,
  };
};
