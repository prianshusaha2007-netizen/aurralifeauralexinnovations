import { useCallback, useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { PushNotifications, Token } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  type: 'reminder' | 'habit' | 'hydration' | 'routine' | 'morning' | 'system' | 'push';
  read: boolean;
  created_at: string;
  data?: Record<string, any>;
}

interface NotificationOptions {
  title: string;
  body: string;
  type?: AppNotification['type'];
  icon?: string;
  tag?: string;
  data?: Record<string, any>;
  requireInteraction?: boolean;
}

export const useUnifiedNotifications = () => {
  const { user } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);
  const [isNative, setIsNative] = useState(false);
  const [serviceWorkerReady, setServiceWorkerReady] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize on mount
  useEffect(() => {
    const isNativePlatform = Capacitor.isNativePlatform();
    setIsNative(isNativePlatform);
    setIsSupported(isNativePlatform || 'Notification' in window);

    if (!isNativePlatform && 'Notification' in window) {
      setPermission(Notification.permission);
    }

    // Register service worker for web
    if ('serviceWorker' in navigator && !isNativePlatform) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('[Notifications] Service Worker registered:', registration.scope);
          setServiceWorkerReady(true);
        })
        .catch((error) => {
          console.error('[Notifications] Service Worker registration failed:', error);
        });
    }
  }, []);

  // Initialize native push notifications
  useEffect(() => {
    if (!isNative || !user?.id) return;

    const initNativePush = async () => {
      try {
        let permStatus = await PushNotifications.checkPermissions();
        
        if (permStatus.receive === 'prompt') {
          permStatus = await PushNotifications.requestPermissions();
        }
        
        if (permStatus.receive === 'granted') {
          setPermission('granted');
          
          await PushNotifications.addListener('registration', async (token: Token) => {
            console.log('[Notifications] FCM Token:', token.value);
            // Save token to database
            await supabase.from('push_subscriptions').upsert({
              user_id: user.id,
              endpoint: token.value,
              p256dh: 'fcm',
              auth: 'fcm',
            }, { onConflict: 'user_id,endpoint' });
          });

          await PushNotifications.addListener('pushNotificationReceived', (notification) => {
            // Add to in-app notifications
            const newNotif: AppNotification = {
              id: `push-${Date.now()}`,
              title: notification.title || 'Notification',
              body: notification.body || '',
              type: 'push',
              read: false,
              created_at: new Date().toISOString(),
              data: notification.data,
            };
            setNotifications(prev => [newNotif, ...prev]);
            setUnreadCount(prev => prev + 1);
            toast.info(notification.title, { description: notification.body });
          });

          await PushNotifications.register();
        }
      } catch (error) {
        console.error('[Notifications] Native push init error:', error);
      }
    };

    initNativePush();
  }, [isNative, user?.id]);

  // Load notifications from database
  const loadNotifications = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('scheduled_notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const mapped: AppNotification[] = (data || []).map(n => ({
        id: n.id,
        title: n.title,
        body: n.body,
        type: n.notification_type as AppNotification['type'],
        read: n.sent,
        created_at: n.created_at,
      }));

      setNotifications(mapped);
      setUnreadCount(mapped.filter(n => !n.read).length);
    } catch (error) {
      console.error('[Notifications] Failed to load:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Request permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      toast.error('Notifications not supported in this browser');
      return false;
    }

    if (permission === 'granted') return true;

    if (isNative) {
      const permStatus = await PushNotifications.requestPermissions();
      const granted = permStatus.receive === 'granted';
      setPermission(granted ? 'granted' : 'denied');
      if (granted) toast.success('Notifications enabled! 🔔');
      return granted;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result === 'granted') {
        toast.success('Notifications enabled! 🔔');
        return true;
      }
      toast.error('Notification permission denied');
      return false;
    } catch (error) {
      console.error('[Notifications] Permission request failed:', error);
      return false;
    }
  }, [isSupported, isNative, permission]);

  // Show notification (immediate)
  const showNotification = useCallback(async (options: NotificationOptions) => {
    // Always add to in-app notifications
    const newNotif: AppNotification = {
      id: `local-${Date.now()}`,
      title: options.title,
      body: options.body,
      type: options.type || 'system',
      read: false,
      created_at: new Date().toISOString(),
      data: options.data,
    };
    setNotifications(prev => [newNotif, ...prev]);
    setUnreadCount(prev => prev + 1);

    // Try system notification
    if (permission !== 'granted') {
      toast(options.title, { description: options.body });
      return;
    }

    try {
      if (isNative) {
        await LocalNotifications.schedule({
          notifications: [{
            id: Math.floor(Math.random() * 1000000),
            title: options.title,
            body: options.body,
            sound: 'default',
          }],
        });
      } else if (serviceWorkerReady) {
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification(options.title, {
          body: options.body,
          icon: options.icon || '/pwa-192x192.png',
          badge: '/pwa-192x192.png',
          tag: options.tag || `aura-${Date.now()}`,
          requireInteraction: options.requireInteraction ?? false,
        });
      } else {
        new Notification(options.title, {
          body: options.body,
          icon: options.icon || '/favicon.ico',
          tag: options.tag,
        });
      }
    } catch (error) {
      console.error('[Notifications] Failed to show system notification:', error);
      toast(options.title, { description: options.body });
    }
  }, [permission, isNative, serviceWorkerReady]);

  // Schedule notification for later
  const scheduleNotification = useCallback(async (
    options: NotificationOptions,
    scheduledFor: Date
  ): Promise<boolean> => {
    if (!user?.id) return false;

    const delay = scheduledFor.getTime() - Date.now();
    if (delay <= 0) {
      showNotification(options);
      return true;
    }

    // Save to database for persistence
    try {
      await supabase.from('scheduled_notifications').insert({
        user_id: user.id,
        title: options.title,
        body: options.body,
        notification_type: options.type || 'reminder',
        scheduled_for: scheduledFor.toISOString(),
        sent: false,
      });

      // Also set a client-side timer as backup
      if (isNative) {
        await LocalNotifications.schedule({
          notifications: [{
            id: Math.floor(Math.random() * 1000000),
            title: options.title,
            body: options.body,
            schedule: { at: scheduledFor },
            sound: 'default',
          }],
        });
      } else {
        setTimeout(() => showNotification(options), delay);
      }

      return true;
    } catch (error) {
      console.error('[Notifications] Failed to schedule:', error);
      return false;
    }
  }, [user?.id, isNative, showNotification]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === notificationId ? { ...n, read: true } : n
    ));
    setUnreadCount(prev => Math.max(0, prev - 1));

    // Update in database if it's a real ID
    if (!notificationId.startsWith('local-') && !notificationId.startsWith('push-')) {
      await supabase
        .from('scheduled_notifications')
        .update({ sent: true })
        .eq('id', notificationId);
    }
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);

    if (user?.id) {
      await supabase
        .from('scheduled_notifications')
        .update({ sent: true })
        .eq('user_id', user.id)
        .eq('sent', false);
    }
  }, [user?.id]);

  // Clear all notifications
  const clearAll = useCallback(async () => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  return {
    // State
    isSupported,
    isNative,
    permission,
    serviceWorkerReady,
    notifications,
    unreadCount,
    isLoading,

    // Actions
    requestPermission,
    showNotification,
    scheduleNotification,
    markAsRead,
    markAllAsRead,
    clearAll,
    refresh: loadNotifications,
  };
};
