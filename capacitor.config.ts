import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.d5612d77366d4faf9366ed086292bbf1',
  appName: 'auraaicom',
  webDir: 'dist',
  server: {
    url: 'https://d5612d77-366d-4faf-9366-ed086292bbf1.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#0a0a0a',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_icon',
      iconColor: '#8B5CF6'
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#0a0a0a'
    }
  }
};

export default config;
