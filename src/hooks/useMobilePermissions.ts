import { useState, useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { Camera } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';
import { LocalNotifications } from '@capacitor/local-notifications';
import { toast } from 'sonner';

export interface PermissionStatus {
  microphone: 'granted' | 'denied' | 'prompt' | 'unavailable';
  camera: 'granted' | 'denied' | 'prompt' | 'unavailable';
  notifications: 'granted' | 'denied' | 'default' | 'unavailable';
  geolocation: 'granted' | 'denied' | 'prompt' | 'unavailable';
  storage: 'granted' | 'unavailable'; // Storage is always available in web
}

export const useMobilePermissions = () => {
  const isNative = Capacitor.isNativePlatform();
  const [permissions, setPermissions] = useState<PermissionStatus>({
    microphone: 'prompt',
    camera: 'prompt',
    notifications: 'default',
    geolocation: 'prompt',
    storage: 'granted',
  });
  const [isChecking, setIsChecking] = useState(true);

  // Check all permissions on mount
  useEffect(() => {
    checkAllPermissions();
  }, []);

  const checkAllPermissions = async () => {
    setIsChecking(true);
    const newPermissions: PermissionStatus = {
      microphone: 'unavailable',
      camera: 'unavailable',
      notifications: 'unavailable',
      geolocation: 'unavailable',
      storage: 'granted',
    };

    try {
      // Check camera (works for both native and web)
      if (isNative) {
        try {
          const camPerm = await Camera.checkPermissions();
          newPermissions.camera = camPerm.camera as 'granted' | 'denied' | 'prompt';
        } catch {
          newPermissions.camera = 'prompt';
        }
      } else if (navigator.permissions) {
        try {
          const cam = await navigator.permissions.query({ name: 'camera' as PermissionName });
          newPermissions.camera = cam.state as 'granted' | 'denied' | 'prompt';
        } catch {
          newPermissions.camera = 'prompt';
        }
      }

      // Check microphone (web only for now)
      if (navigator.permissions) {
        try {
          const mic = await navigator.permissions.query({ name: 'microphone' as PermissionName });
          newPermissions.microphone = mic.state as 'granted' | 'denied' | 'prompt';
        } catch {
          newPermissions.microphone = 'prompt';
        }
      }

      // Check notifications
      if (isNative) {
        try {
          const notifPerm = await LocalNotifications.checkPermissions();
          newPermissions.notifications = notifPerm.display as 'granted' | 'denied' | 'default';
        } catch {
          newPermissions.notifications = 'default';
        }
      } else if ('Notification' in window) {
        newPermissions.notifications = Notification.permission as 'granted' | 'denied' | 'default';
      }

      // Check geolocation
      if (isNative) {
        try {
          const geoPerm = await Geolocation.checkPermissions();
          newPermissions.geolocation = geoPerm.location as 'granted' | 'denied' | 'prompt';
        } catch {
          newPermissions.geolocation = 'prompt';
        }
      } else if (navigator.permissions) {
        try {
          const geo = await navigator.permissions.query({ name: 'geolocation' });
          newPermissions.geolocation = geo.state as 'granted' | 'denied' | 'prompt';
        } catch {
          newPermissions.geolocation = 'prompt';
        }
      }

    } catch (error) {
      console.error('Permission check error:', error);
    }

    setPermissions(newPermissions);
    setIsChecking(false);
  };

  const requestMicrophone = useCallback(async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      setPermissions(prev => ({ ...prev, microphone: 'granted' }));
      toast.success('Microphone access granted! 🎤');
      return true;
    } catch (error) {
      console.error('Microphone permission error:', error);
      setPermissions(prev => ({ ...prev, microphone: 'denied' }));
      toast.error('Microphone access denied');
      return false;
    }
  }, []);

  const requestCamera = useCallback(async (): Promise<boolean> => {
    try {
      if (isNative) {
        const perm = await Camera.requestPermissions({ permissions: ['camera'] });
        if (perm.camera === 'granted') {
          setPermissions(prev => ({ ...prev, camera: 'granted' }));
          toast.success('Camera access granted! 📷');
          return true;
        }
        setPermissions(prev => ({ ...prev, camera: 'denied' }));
        toast.error('Camera access denied');
        return false;
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      setPermissions(prev => ({ ...prev, camera: 'granted' }));
      toast.success('Camera access granted! 📷');
      return true;
    } catch (error) {
      console.error('Camera permission error:', error);
      setPermissions(prev => ({ ...prev, camera: 'denied' }));
      toast.error('Camera access denied');
      return false;
    }
  }, [isNative]);

  const requestNotifications = useCallback(async (): Promise<boolean> => {
    try {
      if (isNative) {
        const perm = await LocalNotifications.requestPermissions();
        if (perm.display === 'granted') {
          setPermissions(prev => ({ ...prev, notifications: 'granted' }));
          toast.success('Notifications enabled! 🔔');
          return true;
        }
        setPermissions(prev => ({ ...prev, notifications: 'denied' }));
        toast.error('Notifications denied');
        return false;
      }
      
      if (!('Notification' in window)) {
        toast.error('Notifications not supported');
        return false;
      }

      const result = await Notification.requestPermission();
      setPermissions(prev => ({ ...prev, notifications: result as 'granted' | 'denied' | 'default' }));
      
      if (result === 'granted') {
        toast.success('Notifications enabled! 🔔');
        new Notification('AURA', {
          body: 'Notifications are now enabled! 🎉',
          icon: '/favicon.ico'
        });
        return true;
      } else {
        toast.error('Notifications denied');
        return false;
      }
    } catch (error) {
      console.error('Notification permission error:', error);
      return false;
    }
  }, [isNative]);

  const requestGeolocation = useCallback(async (): Promise<boolean> => {
    try {
      if (isNative) {
        const perm = await Geolocation.requestPermissions();
        if (perm.location === 'granted') {
          setPermissions(prev => ({ ...prev, geolocation: 'granted' }));
          toast.success('Location access granted! 📍');
          return true;
        }
        setPermissions(prev => ({ ...prev, geolocation: 'denied' }));
        toast.error('Location access denied');
        return false;
      }
      
      return new Promise((resolve) => {
        if (!navigator.geolocation) {
          toast.error('Location not supported');
          resolve(false);
          return;
        }

        navigator.geolocation.getCurrentPosition(
          () => {
            setPermissions(prev => ({ ...prev, geolocation: 'granted' }));
            toast.success('Location access granted! 📍');
            resolve(true);
          },
          (error) => {
            console.error('Geolocation error:', error);
            setPermissions(prev => ({ ...prev, geolocation: 'denied' }));
            toast.error('Location access denied');
            resolve(false);
          }
        );
      });
    } catch (error) {
      console.error('Geolocation error:', error);
      return false;
    }
  }, [isNative]);

  const requestAllPermissions = useCallback(async () => {
    toast.info('Requesting permissions...');
    
    await requestNotifications();
    await requestMicrophone();
    await requestCamera();
    await requestGeolocation();
    
    await checkAllPermissions();
    toast.success('Permissions updated!');
  }, [requestNotifications, requestMicrophone, requestCamera, requestGeolocation]);

  // Schedule a local notification
  const scheduleNotification = useCallback((title: string, body: string, delayMs: number) => {
    if (permissions.notifications !== 'granted') {
      toast.error('Enable notifications first');
      return;
    }

    setTimeout(() => {
      new Notification(title, {
        body,
        icon: '/favicon.ico',
        tag: `aura-${Date.now()}`,
      });
    }, delayMs);
  }, [permissions.notifications]);

  // Set an alarm (using notification)
  const setAlarm = useCallback((title: string, time: Date) => {
    const now = new Date();
    const delay = time.getTime() - now.getTime();
    
    if (delay <= 0) {
      toast.error('Alarm time must be in the future');
      return false;
    }

    scheduleNotification(`⏰ ${title}`, 'Your alarm is ringing!', delay);
    toast.success(`Alarm set for ${time.toLocaleTimeString()}`);
    return true;
  }, [scheduleNotification]);

  return {
    permissions,
    isChecking,
    requestMicrophone,
    requestCamera,
    requestNotifications,
    requestGeolocation,
    requestAllPermissions,
    checkAllPermissions,
    scheduleNotification,
    setAlarm,
  };
};
