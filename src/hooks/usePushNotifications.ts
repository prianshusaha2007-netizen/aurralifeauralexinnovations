import { useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

// VAPID public key from environment variable
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';

export const usePushNotifications = () => {
  const { user } = useAuth();

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      toast.error('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }, []);

  const subscribeToPush = useCallback(async (): Promise<boolean> => {
    if (!user) return false;

    // Validate VAPID key is configured
    if (!VAPID_PUBLIC_KEY) {
      console.warn('VAPID public key not configured. Push notifications unavailable.');
      toast.error('Push notifications not configured');
      return false;
    }

    try {
      const hasPermission = await requestPermission();
      if (!hasPermission) {
        toast.error('Notification permission denied');
        return false;
      }

      if (!('serviceWorker' in navigator)) {
        toast.error('Service workers not supported');
        return false;
      }

      // Register service worker
      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      // Check if already subscribed
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        // Subscribe to push
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });
      }

      // Save subscription to database
      const subscriptionJson = subscription.toJSON();
      
      const { error } = await supabase.from('push_subscriptions').upsert({
        user_id: user.id,
        endpoint: subscriptionJson.endpoint!,
        p256dh: subscriptionJson.keys?.p256dh || '',
        auth: subscriptionJson.keys?.auth || '',
      }, {
        onConflict: 'user_id,endpoint',
      });

      if (error) throw error;

      toast.success('Push notifications enabled!');
      return true;
    } catch (error) {
      console.error('Push subscription error:', error);
      toast.error('Failed to enable push notifications');
      return false;
    }
  }, [user, requestPermission]);

  const unsubscribeFromPush = useCallback(async () => {
    if (!user) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
        
        // Remove from database
        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('user_id', user.id)
          .eq('endpoint', subscription.endpoint);
      }

      toast.success('Push notifications disabled');
    } catch (error) {
      console.error('Unsubscribe error:', error);
    }
  }, [user]);

  const checkSubscription = useCallback(async (): Promise<boolean> => {
    try {
      if (!('serviceWorker' in navigator)) return false;
      
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      return !!subscription;
    } catch {
      return false;
    }
  }, []);

  // Schedule a local notification (works when app is open)
  const scheduleLocalNotification = useCallback((
    title: string,
    body: string,
    delayMs: number,
    tag?: string
  ) => {
    if (Notification.permission !== 'granted') return;

    setTimeout(() => {
      new Notification(title, {
        body,
        icon: '/favicon.ico',
        tag: tag || `notification-${Date.now()}`,
        requireInteraction: true,
      });
    }, delayMs);
  }, []);

  return {
    requestPermission,
    subscribeToPush,
    unsubscribeFromPush,
    checkSubscription,
    scheduleLocalNotification,
    isSupported: 'Notification' in window && 'serviceWorker' in navigator,
  };
};
