import React, { useState, useEffect } from 'react';
import { ArrowLeft, Bell, BellRing, Droplets, Calendar, Heart, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useMorningBriefing } from '@/hooks/useMorningBriefing';

interface NotificationsScreenProps {
  onBack?: () => void;
}

export const NotificationsScreen: React.FC<NotificationsScreenProps> = ({ onBack }) => {
  const { toast } = useToast();
  const { subscribeToPush, unsubscribeFromPush, checkSubscription, isSupported } = usePushNotifications();
  const { showBriefingNotification } = useMorningBriefing();
  
  const [pushEnabled, setPushEnabled] = useState(false);
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('aurra-notification-settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return {
          morningCheckIn: true,
          routineAlerts: true,
          hydrationReminders: true,
          focusMode: true,
          silentHoursEnabled: false,
          silentStart: '22:00',
          silentEnd: '07:00',
        };
      }
    }
    return {
      morningCheckIn: true,
      routineAlerts: true,
      hydrationReminders: true,
      focusMode: true,
      silentHoursEnabled: false,
      silentStart: '22:00',
      silentEnd: '07:00',
    };
  });

  useEffect(() => {
    checkSubscription().then(setPushEnabled);
  }, [checkSubscription]);

  const handlePushToggle = async (enabled: boolean) => {
    if (enabled) {
      const success = await subscribeToPush();
      setPushEnabled(success);
      if (success) {
        toast({
          title: 'Notifications Enabled',
          description: "You'll receive updates from AURRA",
        });
      }
    } else {
      await unsubscribeFromPush();
      setPushEnabled(false);
      toast({
        title: 'Notifications Disabled',
        description: "You won't receive push notifications",
      });
    }
  };

  const updateSetting = (key: string, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    localStorage.setItem('aurra-notification-settings', JSON.stringify(newSettings));
    toast({
      title: 'Setting Updated',
      description: value ? 'Notifications enabled' : 'Notifications disabled',
    });
  };

  const handleTestBriefing = async () => {
    await showBriefingNotification();
    toast({
      title: "Morning Briefing Sent! ☀️",
      description: "Check your notifications",
    });
  };

  const notificationTypes = [
    {
      icon: Heart,
      label: 'Morning Check-in',
      description: 'Daily mood and wellness prompts',
      key: 'morningCheckIn',
      color: 'text-rose-500',
      bgColor: 'bg-rose-500/10',
    },
    {
      icon: Calendar,
      label: 'Routine Alerts',
      description: 'Reminders for your daily routines',
      key: 'routineAlerts',
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      icon: Droplets,
      label: 'Hydration Reminders',
      description: 'Stay hydrated throughout the day',
      key: 'hydrationReminders',
      color: 'text-cyan-500',
      bgColor: 'bg-cyan-500/10',
    },
    {
      icon: Moon,
      label: 'Focus Mode',
      description: 'Focus session start and end alerts',
      key: 'focusMode',
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
  ];

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border">
        {onBack && (
          <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        )}
        <div>
          <h1 className="text-xl font-semibold">Notifications</h1>
          <p className="text-sm text-muted-foreground">Manage how AURRA reaches you</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-24 space-y-6">
        {/* Master Toggle */}
        <Card className="border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/10">
                  <BellRing className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Push Notifications</p>
                  <p className="text-sm text-muted-foreground">
                    {isSupported ? (pushEnabled ? 'Enabled' : 'Disabled') : 'Not supported on this device'}
                  </p>
                </div>
              </div>
              <Switch 
                checked={pushEnabled} 
                onCheckedChange={handlePushToggle}
                disabled={!isSupported}
              />
            </div>
          </CardContent>
        </Card>

        {/* Notification Types */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider px-1">
            Notification Types
          </h3>
          {notificationTypes.map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.key} className="border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${item.bgColor}`}>
                        <Icon className={`w-4 h-4 ${item.color}`} />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                      </div>
                    </div>
                    <Switch 
                      checked={settings[item.key]} 
                      onCheckedChange={(value) => updateSetting(item.key, value)}
                      disabled={!pushEnabled}
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Silent Hours */}
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-muted">
                  <Moon className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium text-sm">Silent Hours</p>
                  <p className="text-xs text-muted-foreground">
                    {settings.silentHoursEnabled 
                      ? `${settings.silentStart} - ${settings.silentEnd}` 
                      : 'No quiet time set'}
                  </p>
                </div>
              </div>
              <Switch 
                checked={settings.silentHoursEnabled} 
                onCheckedChange={(value) => updateSetting('silentHoursEnabled', value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Test Notification */}
        <Button 
          variant="outline" 
          className="w-full rounded-xl"
          onClick={handleTestBriefing}
          disabled={!pushEnabled}
        >
          <Bell className="w-4 h-4 mr-2" />
          Test Morning Briefing
        </Button>

        <p className="text-xs text-center text-muted-foreground px-4">
          You can change these settings anytime. AURRA respects your preferences.
        </p>
      </div>
    </div>
  );
};

export default NotificationsScreen;
