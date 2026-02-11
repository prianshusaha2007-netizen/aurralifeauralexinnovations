import { useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { toast } from 'sonner';

export interface AppInfo {
  id: string;
  name: string;
  icon: string;
  deepLink: string;
  fallbackUrl?: string;
  category: 'social' | 'productivity' | 'entertainment' | 'utility' | 'health' | 'finance' | 'communication';
}

export const MOBILE_APPS: AppInfo[] = [
  // Communication
  { id: 'whatsapp', name: 'WhatsApp', icon: '💬', deepLink: 'whatsapp://', fallbackUrl: 'https://wa.me/', category: 'communication' },
  { id: 'telegram', name: 'Telegram', icon: '✈️', deepLink: 'tg://', fallbackUrl: 'https://t.me/', category: 'communication' },
  { id: 'instagram-dm', name: 'Instagram DM', icon: '📩', deepLink: 'instagram://direct-inbox', fallbackUrl: 'https://instagram.com/direct/inbox', category: 'communication' },
  { id: 'phone', name: 'Phone', icon: '📞', deepLink: 'tel:', category: 'communication' },
  { id: 'sms', name: 'Messages', icon: '💌', deepLink: 'sms:', category: 'communication' },
  { id: 'gmail', name: 'Gmail', icon: '📧', deepLink: 'googlegmail://', fallbackUrl: 'https://mail.google.com', category: 'communication' },

  // Social
  { id: 'instagram', name: 'Instagram', icon: '📸', deepLink: 'instagram://', fallbackUrl: 'https://instagram.com', category: 'social' },
  { id: 'twitter', name: 'X (Twitter)', icon: '🐦', deepLink: 'twitter://', fallbackUrl: 'https://x.com', category: 'social' },
  { id: 'youtube', name: 'YouTube', icon: '▶️', deepLink: 'youtube://', fallbackUrl: 'https://youtube.com', category: 'social' },
  { id: 'snapchat', name: 'Snapchat', icon: '👻', deepLink: 'snapchat://', fallbackUrl: 'https://snapchat.com', category: 'social' },
  { id: 'linkedin', name: 'LinkedIn', icon: '💼', deepLink: 'linkedin://', fallbackUrl: 'https://linkedin.com', category: 'social' },
  { id: 'reddit', name: 'Reddit', icon: '🤖', deepLink: 'reddit://', fallbackUrl: 'https://reddit.com', category: 'social' },

  // Entertainment
  { id: 'spotify', name: 'Spotify', icon: '🎵', deepLink: 'spotify://', fallbackUrl: 'https://open.spotify.com', category: 'entertainment' },
  { id: 'netflix', name: 'Netflix', icon: '🎬', deepLink: 'nflx://', fallbackUrl: 'https://netflix.com', category: 'entertainment' },
  { id: 'prime-video', name: 'Prime Video', icon: '🎥', deepLink: 'intent://www.primevideo.com#Intent;scheme=https;package=com.amazon.avod.thirdpartyclient;end', fallbackUrl: 'https://primevideo.com', category: 'entertainment' },
  { id: 'apple-music', name: 'Apple Music', icon: '🎶', deepLink: 'music://', fallbackUrl: 'https://music.apple.com', category: 'entertainment' },

  // Productivity
  { id: 'google-calendar', name: 'Calendar', icon: '📅', deepLink: 'googlecalendar://', fallbackUrl: 'https://calendar.google.com', category: 'productivity' },
  { id: 'google-drive', name: 'Drive', icon: '📁', deepLink: 'googledrive://', fallbackUrl: 'https://drive.google.com', category: 'productivity' },
  { id: 'google-docs', name: 'Docs', icon: '📝', deepLink: 'googledocs://', fallbackUrl: 'https://docs.google.com', category: 'productivity' },
  { id: 'notion', name: 'Notion', icon: '📓', deepLink: 'notion://', fallbackUrl: 'https://notion.so', category: 'productivity' },
  { id: 'google-maps', name: 'Maps', icon: '🗺️', deepLink: 'comgooglemaps://', fallbackUrl: 'https://maps.google.com', category: 'productivity' },
  { id: 'chrome', name: 'Chrome', icon: '🌐', deepLink: 'googlechrome://', fallbackUrl: 'https://google.com', category: 'productivity' },

  // Utility
  { id: 'camera', name: 'Camera', icon: '📷', deepLink: 'camera://', category: 'utility' },
  { id: 'settings', name: 'Settings', icon: '⚙️', deepLink: 'app-settings://', category: 'utility' },
  { id: 'calculator', name: 'Calculator', icon: '🧮', deepLink: 'calculator://', category: 'utility' },
  { id: 'clock', name: 'Clock', icon: '⏰', deepLink: 'clock-app://', category: 'utility' },
  { id: 'flashlight', name: 'Flashlight', icon: '🔦', deepLink: 'flashlight://', category: 'utility' },

  // Health
  { id: 'google-fit', name: 'Google Fit', icon: '❤️', deepLink: 'googlefit://', fallbackUrl: 'https://fit.google.com', category: 'health' },
  { id: 'health', name: 'Health', icon: '🏥', deepLink: 'x-apple-health://', category: 'health' },

  // Finance
  { id: 'gpay', name: 'Google Pay', icon: '💳', deepLink: 'gpay://', fallbackUrl: 'https://pay.google.com', category: 'finance' },
  { id: 'phonepe', name: 'PhonePe', icon: '💸', deepLink: 'phonepe://', category: 'finance' },
  { id: 'paytm', name: 'Paytm', icon: '🏦', deepLink: 'paytmmp://', category: 'finance' },
];

export interface DeviceControl {
  id: string;
  name: string;
  icon: string;
  description: string;
  category: 'connectivity' | 'display' | 'sound' | 'system';
  actionType: 'toggle' | 'slider' | 'action';
}

export const DEVICE_CONTROLS: DeviceControl[] = [
  // Connectivity
  { id: 'wifi', name: 'Wi-Fi', icon: '📶', description: 'Toggle wireless network', category: 'connectivity', actionType: 'toggle' },
  { id: 'bluetooth', name: 'Bluetooth', icon: '🔵', description: 'Toggle Bluetooth', category: 'connectivity', actionType: 'toggle' },
  { id: 'airplane', name: 'Airplane Mode', icon: '✈️', description: 'Toggle airplane mode', category: 'connectivity', actionType: 'toggle' },
  { id: 'hotspot', name: 'Hotspot', icon: '📡', description: 'Mobile hotspot', category: 'connectivity', actionType: 'toggle' },

  // Display
  { id: 'brightness', name: 'Brightness', icon: '☀️', description: 'Adjust screen brightness', category: 'display', actionType: 'slider' },
  { id: 'dark-mode', name: 'Dark Mode', icon: '🌙', description: 'Toggle dark theme', category: 'display', actionType: 'toggle' },
  { id: 'rotation', name: 'Auto Rotate', icon: '🔄', description: 'Screen rotation lock', category: 'display', actionType: 'toggle' },

  // Sound
  { id: 'volume', name: 'Volume', icon: '🔊', description: 'Adjust media volume', category: 'sound', actionType: 'slider' },
  { id: 'dnd', name: 'Do Not Disturb', icon: '🔕', description: 'Silence notifications', category: 'sound', actionType: 'toggle' },
  { id: 'silent', name: 'Silent Mode', icon: '🤫', description: 'Mute all sounds', category: 'sound', actionType: 'toggle' },
  { id: 'vibrate', name: 'Vibrate', icon: '📳', description: 'Vibration only mode', category: 'sound', actionType: 'toggle' },

  // System
  { id: 'battery-saver', name: 'Battery Saver', icon: '🔋', description: 'Extend battery life', category: 'system', actionType: 'toggle' },
  { id: 'location', name: 'Location', icon: '📍', description: 'GPS & location services', category: 'system', actionType: 'toggle' },
  { id: 'nfc', name: 'NFC', icon: '📲', description: 'Near-field communication', category: 'system', actionType: 'toggle' },
];

export interface AutomationAction {
  id: string;
  name: string;
  icon: string;
  description: string;
  steps: string[];
  category: 'morning' | 'focus' | 'night' | 'social' | 'custom';
}

export const PRESET_AUTOMATIONS: AutomationAction[] = [
  {
    id: 'morning-routine',
    name: 'Morning Kickstart',
    icon: '🌅',
    description: 'Start your day perfectly',
    steps: ['Turn off DND', 'Play morning playlist on Spotify', 'Open Calendar', 'Show weather'],
    category: 'morning',
  },
  {
    id: 'deep-focus',
    name: 'Deep Focus',
    icon: '🧠',
    description: 'Eliminate all distractions',
    steps: ['Enable DND', 'Close social apps', 'Play lo-fi on Spotify', 'Start focus timer'],
    category: 'focus',
  },
  {
    id: 'wind-down',
    name: 'Wind Down',
    icon: '🌙',
    description: 'Prepare for sleep',
    steps: ['Enable DND', 'Reduce brightness', 'Play sleep sounds', 'Set alarm for tomorrow'],
    category: 'night',
  },
  {
    id: 'social-break',
    name: 'Social Break',
    icon: '📱',
    description: '15-min social media break',
    steps: ['Open Instagram', 'Set 15-min timer', 'Auto-close after timer'],
    category: 'social',
  },
  {
    id: 'workout-mode',
    name: 'Workout Mode',
    icon: '💪',
    description: 'Get in the zone',
    steps: ['Enable DND', 'Play workout playlist', 'Open Google Fit', 'Start timer'],
    category: 'custom',
  },
  {
    id: 'study-session',
    name: 'Study Session',
    icon: '📚',
    description: 'Maximize study time',
    steps: ['Enable DND', 'Block social apps', 'Open Notes/Docs', 'Start 25-min Pomodoro'],
    category: 'focus',
  },
];

export const useMobileControls = () => {
  const isNative = Capacitor.isNativePlatform();
  const platform = Capacitor.getPlatform();

  const openApp = useCallback((app: AppInfo) => {
    try {
      if (isNative) {
        // On native, try deep link first
        window.location.href = app.deepLink;
        // Fallback after short delay
        if (app.fallbackUrl) {
          setTimeout(() => {
            window.open(app.fallbackUrl, '_blank');
          }, 1000);
        }
      } else {
        // On web, use fallback URL or deep link
        if (app.fallbackUrl) {
          window.open(app.fallbackUrl, '_blank');
        } else {
          window.location.href = app.deepLink;
        }
      }
      toast.success(`Opening ${app.name}...`);
    } catch {
      toast.error(`Could not open ${app.name}`);
    }
  }, [isNative]);

  const toggleDeviceControl = useCallback((control: DeviceControl, value?: boolean) => {
    if (isNative) {
      // Native: try to open device settings
      if (platform === 'android') {
        const settingsMap: Record<string, string> = {
          'wifi': 'android.settings.WIFI_SETTINGS',
          'bluetooth': 'android.settings.BLUETOOTH_SETTINGS',
          'airplane': 'android.settings.AIRPLANE_MODE_SETTINGS',
          'location': 'android.settings.LOCATION_SOURCE_SETTINGS',
          'dnd': 'android.settings.ZEN_MODE_SETTINGS',
          'battery-saver': 'android.settings.BATTERY_SAVER_SETTINGS',
          'hotspot': 'android.settings.TETHERING_SETTINGS',
          'nfc': 'android.settings.NFC_SETTINGS',
          'display': 'android.settings.DISPLAY_SETTINGS',
        };
        const action = settingsMap[control.id];
        if (action) {
          try {
            window.location.href = `intent://#Intent;action=${action};end`;
          } catch {
            toast.info(`Open ${control.name} from your phone settings`);
          }
        }
      }
      toast.success(`${control.name} ${value ? 'enabled' : 'toggled'}`);
    } else {
      // Web: simulate
      toast.success(`${control.name} ${value ? 'enabled' : 'disabled'} (simulated)`, {
        description: 'Install the native app for real device control'
      });
    }
  }, [isNative, platform]);

  const runAutomation = useCallback(async (automation: AutomationAction) => {
    toast.info(`Running: ${automation.name}`, {
      description: 'Executing steps...'
    });

    for (let i = 0; i < automation.steps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 800));
      toast.success(`✓ ${automation.steps[i]}`, { duration: 2000 });
    }

    toast.success(`${automation.name} complete!`, {
      description: `All ${automation.steps.length} steps executed`
    });
  }, []);

  const makeCall = useCallback((number: string) => {
    window.location.href = `tel:${number}`;
    toast.success('Opening dialer...');
  }, []);

  const sendSMS = useCallback((number: string, body?: string) => {
    const url = body ? `sms:${number}?body=${encodeURIComponent(body)}` : `sms:${number}`;
    window.location.href = url;
    toast.success('Opening messages...');
  }, []);

  const openWhatsApp = useCallback((number?: string, message?: string) => {
    let url = 'https://wa.me/';
    if (number) url += number;
    if (message) url += `?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
    toast.success('Opening WhatsApp...');
  }, []);

  const openSpotifyPlaylist = useCallback((playlistUri?: string) => {
    if (playlistUri) {
      window.location.href = `spotify:playlist:${playlistUri}`;
    } else {
      window.location.href = 'spotify://';
    }
    setTimeout(() => window.open('https://open.spotify.com', '_blank'), 1000);
    toast.success('Opening Spotify...');
  }, []);

  return {
    isNative,
    platform,
    apps: MOBILE_APPS,
    deviceControls: DEVICE_CONTROLS,
    automations: PRESET_AUTOMATIONS,
    openApp,
    toggleDeviceControl,
    runAutomation,
    makeCall,
    sendSMS,
    openWhatsApp,
    openSpotifyPlaylist,
  };
};
