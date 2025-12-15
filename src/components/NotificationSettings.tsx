import React, { useState, useEffect } from 'react';
import { Bell, BellOff, Smartphone, Globe, Volume2, VolumeX, Clock, Droplets, Sunrise, Moon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

interface NotificationSettingsProps {
  className?: string;
}

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({ className }) => {
  const [pushEnabled, setPushEnabled] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [morningBriefing, setMorningBriefing] = useState(true);
  const [hydrationReminders, setHydrationReminders] = useState(true);
  const [habitReminders, setHabitReminders] = useState(true);
  const [nightMode, setNightMode] = useState(true);
  const [nightModeStart, setNightModeStart] = useState(22);
  const [nightModeEnd, setNightModeEnd] = useState(7);
  const [volume, setVolume] = useState([70]);

  useEffect(() => {
    // Load settings from localStorage
    const settings = localStorage.getItem('aura-notification-settings');
    if (settings) {
      const parsed = JSON.parse(settings);
      setPushEnabled(parsed.pushEnabled ?? false);
      setSoundEnabled(parsed.soundEnabled ?? true);
      setVibrationEnabled(parsed.vibrationEnabled ?? true);
      setMorningBriefing(parsed.morningBriefing ?? true);
      setHydrationReminders(parsed.hydrationReminders ?? true);
      setHabitReminders(parsed.habitReminders ?? true);
      setNightMode(parsed.nightMode ?? true);
      setNightModeStart(parsed.nightModeStart ?? 22);
      setNightModeEnd(parsed.nightModeEnd ?? 7);
      setVolume(parsed.volume ?? [70]);
    }

    // Check if push notifications are already granted
    if ('Notification' in window && Notification.permission === 'granted') {
      setPushEnabled(true);
    }
  }, []);

  const saveSettings = (updates: Record<string, any>) => {
    const settings = {
      pushEnabled,
      soundEnabled,
      vibrationEnabled,
      morningBriefing,
      hydrationReminders,
      habitReminders,
      nightMode,
      nightModeStart,
      nightModeEnd,
      volume,
      ...updates
    };
    localStorage.setItem('aura-notification-settings', JSON.stringify(settings));
  };

  const requestPushPermission = async () => {
    if (!('Notification' in window)) {
      toast.error('Push notifications not supported in this browser');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setPushEnabled(true);
        saveSettings({ pushEnabled: true });
        toast.success('Push notifications enabled! 🔔');
        
        // Register service worker if not already registered
        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.ready;
          console.log('Service worker ready for push');
        }
      } else if (permission === 'denied') {
        toast.error('Notifications blocked. Enable in browser settings.');
      }
    } catch (error) {
      console.error('Push permission error:', error);
      toast.error('Could not enable notifications');
    }
  };

  const togglePush = async () => {
    if (!pushEnabled) {
      await requestPushPermission();
    } else {
      setPushEnabled(false);
      saveSettings({ pushEnabled: false });
      toast.info('Push notifications disabled');
    }
  };

  const handleSoundToggle = (enabled: boolean) => {
    setSoundEnabled(enabled);
    saveSettings({ soundEnabled: enabled });
  };

  const handleVibrationToggle = (enabled: boolean) => {
    setVibrationEnabled(enabled);
    saveSettings({ vibrationEnabled: enabled });
    if (enabled && navigator.vibrate) {
      navigator.vibrate(100);
    }
  };

  const handleMorningBriefingToggle = (enabled: boolean) => {
    setMorningBriefing(enabled);
    saveSettings({ morningBriefing: enabled });
  };

  const handleHydrationToggle = (enabled: boolean) => {
    setHydrationReminders(enabled);
    saveSettings({ hydrationReminders: enabled });
  };

  const handleHabitToggle = (enabled: boolean) => {
    setHabitReminders(enabled);
    saveSettings({ habitReminders: enabled });
  };

  const handleNightModeToggle = (enabled: boolean) => {
    setNightMode(enabled);
    saveSettings({ nightMode: enabled });
  };

  const handleVolumeChange = (value: number[]) => {
    setVolume(value);
    saveSettings({ volume: value });
  };

  return (
    <div className={className}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        {/* Push Notifications Card */}
        <Card className="border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              {pushEnabled ? <Bell className="w-4 h-4 text-primary" /> : <BellOff className="w-4 h-4 text-muted-foreground" />}
              Push Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Smartphone className="w-4 h-4 text-muted-foreground" />
                <Label htmlFor="push-notifications">Enable Push Notifications</Label>
              </div>
              <Switch 
                id="push-notifications"
                checked={pushEnabled}
                onCheckedChange={togglePush}
              />
            </div>

            {pushEnabled && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-3 pt-2 border-t border-border/50"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Sunrise className="w-4 h-4 text-amber-500" />
                    <Label htmlFor="morning-briefing">Morning Briefing</Label>
                  </div>
                  <Switch 
                    id="morning-briefing"
                    checked={morningBriefing}
                    onCheckedChange={handleMorningBriefingToggle}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Droplets className="w-4 h-4 text-blue-500" />
                    <Label htmlFor="hydration-reminders">Hydration Reminders</Label>
                  </div>
                  <Switch 
                    id="hydration-reminders"
                    checked={hydrationReminders}
                    onCheckedChange={handleHydrationToggle}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-green-500" />
                    <Label htmlFor="habit-reminders">Habit Reminders</Label>
                  </div>
                  <Switch 
                    id="habit-reminders"
                    checked={habitReminders}
                    onCheckedChange={handleHabitToggle}
                  />
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>

        {/* Sound & Vibration Card */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-primary" />
              Sound & Vibration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {soundEnabled ? <Volume2 className="w-4 h-4 text-muted-foreground" /> : <VolumeX className="w-4 h-4 text-muted-foreground" />}
                <Label htmlFor="sound">Notification Sounds</Label>
              </div>
              <Switch 
                id="sound"
                checked={soundEnabled}
                onCheckedChange={handleSoundToggle}
              />
            </div>

            {soundEnabled && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Volume</span>
                  <span className="font-medium">{volume[0]}%</span>
                </div>
                <Slider
                  value={volume}
                  onValueChange={handleVolumeChange}
                  max={100}
                  step={10}
                  className="w-full"
                />
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Smartphone className="w-4 h-4 text-muted-foreground" />
                <Label htmlFor="vibration">Vibration</Label>
              </div>
              <Switch 
                id="vibration"
                checked={vibrationEnabled}
                onCheckedChange={handleVibrationToggle}
              />
            </div>
          </CardContent>
        </Card>

        {/* Night Mode Card */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Moon className="w-4 h-4 text-primary" />
              Do Not Disturb
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Moon className="w-4 h-4 text-muted-foreground" />
                <div>
                  <Label htmlFor="night-mode">Night Mode</Label>
                  <p className="text-xs text-muted-foreground">No notifications during sleep</p>
                </div>
              </div>
              <Switch 
                id="night-mode"
                checked={nightMode}
                onCheckedChange={handleNightModeToggle}
              />
            </div>

            {nightMode && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3"
              >
                Quiet hours: {nightModeStart}:00 - {nightModeEnd}:00
              </motion.div>
            )}
          </CardContent>
        </Card>

        {/* Test Notification Button */}
        {pushEnabled && (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('AURA Test 🔔', {
                  body: 'Notifications are working! Yay! ✨',
                  icon: '/favicon.ico'
                });
                toast.success('Test notification sent!');
              } else {
                toast.error('Enable notifications first');
              }
            }}
          >
            <Bell className="w-4 h-4 mr-2" />
            Send Test Notification
          </Button>
        )}
      </motion.div>
    </div>
  );
};
