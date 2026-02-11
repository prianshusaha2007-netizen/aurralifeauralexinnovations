import { useCallback, useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const usePWAPush = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const vapidPublicKeyRef = useRef<string | null>(null);

  // Fetch VAPID public key from backend
  const fetchVapidKey = useCallback(async (): Promise<string | null> => {
    if (vapidPublicKeyRef.current) return vapidPublicKeyRef.current;

    try {
      const { data, error } = await supabase.functions.invoke('generate-vapid-keys');
      if (error) throw error;
      if (data?.publicKey) {
        vapidPublicKeyRef.current = data.publicKey;
        return data.publicKey;
      }
    } catch (err) {
      console.error('Failed to fetch VAPID key:', err);
    }
    return null;
  }, []);

  useEffect(() => {
    const checkSupport = async () => {
      const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
      setIsSupported(supported);

      if (supported) {
        setPermission(Notification.permission);

        try {
          const reg = await navigator.serviceWorker.ready;
          setRegistration(reg);

          const subscription = await (reg as any).pushManager.getSubscription();
          setIsSubscribed(!!subscription);
        } catch (error) {
          console.error('Error checking push subscription:', error);
        }
      }
    };

    checkSupport();
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      toast.error('Push notifications not supported in this browser');
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === 'granted') {
        toast.success('Notifications enabled! 🔔');
        return true;
      } else if (result === 'denied') {
        toast.error('Notification permission denied. Please enable in browser settings.');
        return false;
      }
      return false;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      toast.error('Failed to request notification permission');
      return false;
    }
  }, [isSupported]);

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!registration) {
      toast.error('Service worker not ready');
      return false;
    }

    try {
      if (permission !== 'granted') {
        const granted = await requestPermission();
        if (!granted) return false;
      }

      // Fetch the dynamic VAPID public key
      const vapidKey = await fetchVapidKey();
      if (!vapidKey) {
        toast.error('Failed to get push notification keys');
        return false;
      }

      const applicationServerKey = urlBase64ToUint8Array(vapidKey);
      const subscription = await (registration as any).pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey.buffer as ArrayBuffer,
      });

      const p256dh = subscription.getKey('p256dh');
      const auth = subscription.getKey('auth');

      if (!p256dh || !auth) throw new Error('Failed to get subscription keys');

      const p256dhBase64 = btoa(String.fromCharCode(...new Uint8Array(p256dh)));
      const authBase64 = btoa(String.fromCharCode(...new Uint8Array(auth)));

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please log in to enable push notifications');
        return false;
      }

      const { error } = await supabase.from('push_subscriptions').upsert({
        user_id: user.id,
        endpoint: subscription.endpoint,
        p256dh: p256dhBase64,
        auth: authBase64,
      }, {
        onConflict: 'user_id,endpoint',
      });

      if (error) throw error;

      setIsSubscribed(true);
      toast.success('Push notifications activated! 🎉');
      return true;
    } catch (error) {
      console.error('Error subscribing to push:', error);
      toast.error('Failed to enable push notifications');
      return false;
    }
  }, [registration, permission, requestPermission, fetchVapidKey]);

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!registration) return false;

    try {
      const subscription = await (registration as any).pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();

        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase
            .from('push_subscriptions')
            .delete()
            .eq('user_id', user.id)
            .eq('endpoint', subscription.endpoint);
        }
      }

      setIsSubscribed(false);
      toast.success('Push notifications disabled');
      return true;
    } catch (error) {
      console.error('Error unsubscribing from push:', error);
      toast.error('Failed to disable push notifications');
      return false;
    }
  }, [registration]);

  const showLocalNotification = useCallback(async (
    title: string,
    body: string,
    options?: { icon?: string; tag?: string; data?: any }
  ) => {
    if (permission !== 'granted') {
      const granted = await requestPermission();
      if (!granted) return;
    }

    try {
      if (registration) {
        const notificationOptions: NotificationOptions & { vibrate?: number[] } = {
          body,
          icon: options?.icon || '/pwa-192x192.png',
          badge: '/pwa-192x192.png',
          tag: options?.tag || `aura-${Date.now()}`,
          data: options?.data,
        };
        await registration.showNotification(title, notificationOptions as NotificationOptions);
      } else {
        new Notification(title, {
          body,
          icon: options?.icon || '/pwa-192x192.png',
          tag: options?.tag || `aura-${Date.now()}`,
        });
      }
    } catch (error) {
      console.error('Error showing notification:', error);
      toast(title, { description: body });
    }
  }, [permission, registration, requestPermission]);

  const scheduleNotification = useCallback((
    title: string,
    body: string,
    delayMs: number,
    options?: { icon?: string; tag?: string; data?: any }
  ): NodeJS.Timeout => {
    return setTimeout(() => {
      showLocalNotification(title, body, options);
    }, delayMs);
  }, [showLocalNotification]);

  // Schedule a server-side push notification (persisted, survives page close)
  const scheduleServerPush = useCallback(async (
    title: string,
    body: string,
    scheduledFor: Date,
    notificationType: string = 'push'
  ): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { error } = await supabase.from('scheduled_notifications').insert({
        user_id: user.id,
        title,
        body,
        notification_type: notificationType,
        scheduled_for: scheduledFor.toISOString(),
        sent: false,
      });

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Failed to schedule server push:', err);
      return false;
    }
  }, []);

  return {
    isSupported,
    isSubscribed,
    permission,
    requestPermission,
    subscribe,
    unsubscribe,
    showLocalNotification,
    scheduleNotification,
    scheduleServerPush,
  };
};
