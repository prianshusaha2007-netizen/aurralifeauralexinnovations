import { useState, useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Geolocation } from '@capacitor/geolocation';
import { LocalNotifications } from '@capacitor/local-notifications';
import { PushNotifications } from '@capacitor/push-notifications';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { toast } from 'sonner';

export const useNativeCapabilities = () => {
  const [isNative, setIsNative] = useState(false);
  const [pushToken, setPushToken] = useState<string | null>(null);

  useEffect(() => {
    const native = Capacitor.isNativePlatform();
    setIsNative(native);
    
    if (native) {
      initializeNativeFeatures();
    }
  }, []);

  const initializeNativeFeatures = async () => {
    try {
      // Hide splash screen
      await SplashScreen.hide();
      
      // Set status bar style
      if (Capacitor.getPlatform() !== 'web') {
        await StatusBar.setStyle({ style: Style.Dark });
        await StatusBar.setBackgroundColor({ color: '#0a0a0a' });
      }
      
      // Request push notification permissions
      await setupPushNotifications();
    } catch (error) {
      console.error('Native init error:', error);
    }
  };

  const setupPushNotifications = async () => {
    try {
      let permStatus = await PushNotifications.checkPermissions();
      
      if (permStatus.receive === 'prompt') {
        permStatus = await PushNotifications.requestPermissions();
      }
      
      if (permStatus.receive === 'granted') {
        await PushNotifications.register();
        
        PushNotifications.addListener('registration', (token) => {
          setPushToken(token.value);
          console.log('Push registration token:', token.value);
        });
        
        PushNotifications.addListener('registrationError', (error) => {
          console.error('Push registration error:', error);
        });
        
        PushNotifications.addListener('pushNotificationReceived', (notification) => {
          toast.info(notification.title || 'New notification', {
            description: notification.body
          });
        });
        
        PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
          console.log('Push action:', action);
        });
      }
    } catch (error) {
      console.error('Push setup error:', error);
    }
  };

  // Camera
  const takePhoto = useCallback(async () => {
    try {
      const photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera
      });
      
      await hapticFeedback('medium');
      return `data:image/${photo.format};base64,${photo.base64String}`;
    } catch (error) {
      console.error('Camera error:', error);
      toast.error('Could not access camera');
      return null;
    }
  }, []);

  const pickFromGallery = useCallback(async () => {
    try {
      const photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Photos
      });
      
      return `data:image/${photo.format};base64,${photo.base64String}`;
    } catch (error) {
      console.error('Gallery error:', error);
      toast.error('Could not access gallery');
      return null;
    }
  }, []);

  // Location
  const getCurrentLocation = useCallback(async () => {
    try {
      const permission = await Geolocation.checkPermissions();
      
      if (permission.location !== 'granted') {
        const request = await Geolocation.requestPermissions();
        if (request.location !== 'granted') {
          toast.error('Location permission denied');
          return null;
        }
      }
      
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000
      });
      
      return {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy
      };
    } catch (error) {
      console.error('Location error:', error);
      toast.error('Could not get location');
      return null;
    }
  }, []);

  // Local Notifications
  const scheduleNotification = useCallback(async (
    title: string,
    body: string,
    scheduleAt: Date,
    id?: number
  ) => {
    try {
      const permission = await LocalNotifications.checkPermissions();
      
      if (permission.display !== 'granted') {
        const request = await LocalNotifications.requestPermissions();
        if (request.display !== 'granted') {
          toast.error('Notification permission denied');
          return false;
        }
      }
      
      await LocalNotifications.schedule({
        notifications: [{
          id: id || Date.now(),
          title,
          body,
          schedule: { at: scheduleAt },
          sound: 'default',
          actionTypeId: 'AURA_NOTIFICATION'
        }]
      });
      
      await hapticFeedback('light');
      toast.success('Reminder set! ⏰');
      return true;
    } catch (error) {
      console.error('Notification error:', error);
      toast.error('Could not schedule notification');
      return false;
    }
  }, []);

  const cancelNotification = useCallback(async (id: number) => {
    try {
      await LocalNotifications.cancel({ notifications: [{ id }] });
      return true;
    } catch (error) {
      console.error('Cancel notification error:', error);
      return false;
    }
  }, []);

  // Haptics
  const hapticFeedback = useCallback(async (style: 'light' | 'medium' | 'heavy' = 'medium') => {
    if (!isNative) return;
    
    try {
      const impactStyles: Record<string, ImpactStyle> = {
        light: ImpactStyle.Light,
        medium: ImpactStyle.Medium,
        heavy: ImpactStyle.Heavy
      };
      
      await Haptics.impact({ style: impactStyles[style] });
    } catch (error) {
      console.error('Haptic error:', error);
    }
  }, [isNative]);

  const hapticNotification = useCallback(async (type: 'success' | 'warning' | 'error' = 'success') => {
    if (!isNative) return;
    
    try {
      const types: Record<string, NotificationType> = {
        success: NotificationType.Success,
        warning: NotificationType.Warning,
        error: NotificationType.Error
      };
      
      await Haptics.notification({ type: types[type] });
    } catch (error) {
      console.error('Haptic notification error:', error);
    }
  }, [isNative]);

  // File System
  const saveFile = useCallback(async (filename: string, data: string) => {
    try {
      await Filesystem.writeFile({
        path: filename,
        data,
        directory: Directory.Documents
      });
      
      toast.success('File saved!');
      return true;
    } catch (error) {
      console.error('Save file error:', error);
      toast.error('Could not save file');
      return false;
    }
  }, []);

  const readFile = useCallback(async (filename: string) => {
    try {
      const result = await Filesystem.readFile({
        path: filename,
        directory: Directory.Documents
      });
      
      return result.data;
    } catch (error) {
      console.error('Read file error:', error);
      return null;
    }
  }, []);

  return {
    isNative,
    pushToken,
    
    // Camera
    takePhoto,
    pickFromGallery,
    
    // Location
    getCurrentLocation,
    
    // Notifications
    scheduleNotification,
    cancelNotification,
    
    // Haptics
    hapticFeedback,
    hapticNotification,
    
    // File System
    saveFile,
    readFile
  };
};
