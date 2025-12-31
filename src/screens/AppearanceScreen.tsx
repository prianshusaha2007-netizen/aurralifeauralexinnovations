import React, { useState } from 'react';
import { ArrowLeft, Sun, Moon, Monitor, Clock, Sunrise, Sunset, Type, Contrast, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useTheme } from '@/contexts/ThemeContext';
import { useAura } from '@/contexts/AuraContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface AppearanceScreenProps {
  onBack?: () => void;
}

export const AppearanceScreen: React.FC<AppearanceScreenProps> = ({ onBack }) => {
  const { mode, activeTheme, setMode, setUserSchedule } = useTheme();
  const { userProfile, updateUserProfile } = useAura();
  const { toast } = useToast();

  const [wakeTime, setWakeTime] = useState(userProfile.wakeTime || '07:00');
  const [sleepTime, setSleepTime] = useState(userProfile.sleepTime || '23:00');
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  
  const [accessibilitySettings, setAccessibilitySettings] = useState(() => {
    const saved = localStorage.getItem('aurra-accessibility-settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return { reducedMotion: false, highContrast: false, largeText: false };
      }
    }
    return { reducedMotion: false, highContrast: false, largeText: false };
  });

  const themes = [
    { id: 'light', icon: Sun, label: 'Light', description: 'Bright and clear' },
    { id: 'dark', icon: Moon, label: 'Dark', description: 'Easy on the eyes' },
    { id: 'auto', icon: Monitor, label: 'Auto', description: 'Adapts to your schedule' },
  ] as const;

  const handleThemeChange = (newMode: 'light' | 'dark' | 'auto') => {
    setMode(newMode);
    toast({
      title: `Theme: ${newMode.charAt(0).toUpperCase() + newMode.slice(1)}`,
      description: newMode === 'auto' ? 'Adapts to your schedule' : `${newMode} mode enabled`,
    });
  };

  const handleSaveSchedule = () => {
    setUserSchedule({ wakeTime, sleepTime });
    updateUserProfile({ wakeTime, sleepTime, onboardingComplete: true });
    setScheduleDialogOpen(false);
    toast({
      title: "Schedule Updated",
      description: `Wake: ${formatTime(wakeTime)}, Sleep: ${formatTime(sleepTime)}`,
    });
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${minutes} ${ampm}`;
  };

  const updateAccessibility = (key: string, value: boolean) => {
    const newSettings = { ...accessibilitySettings, [key]: value };
    setAccessibilitySettings(newSettings);
    localStorage.setItem('aurra-accessibility-settings', JSON.stringify(newSettings));
    toast({
      title: 'Accessibility Updated',
      description: value ? 'Setting enabled' : 'Setting disabled',
    });
  };

  const accessibilityOptions = [
    {
      icon: Sparkles,
      label: 'Reduced Motion',
      description: 'Minimize animations',
      key: 'reducedMotion',
    },
    {
      icon: Contrast,
      label: 'High Contrast',
      description: 'Increase visual contrast',
      key: 'highContrast',
    },
    {
      icon: Type,
      label: 'Large Text',
      description: 'Increase text size',
      key: 'largeText',
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
          <h1 className="text-xl font-semibold">Appearance</h1>
          <p className="text-sm text-muted-foreground">Customize how AURRA looks</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-24 space-y-6">
        {/* Theme Selection */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider px-1">
            Theme
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {themes.map((theme) => {
              const Icon = theme.icon;
              const isActive = mode === theme.id;
              return (
                <button
                  key={theme.id}
                  onClick={() => handleThemeChange(theme.id)}
                  className={cn(
                    'flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all',
                    isActive 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/50'
                  )}
                >
                  <div className={cn(
                    'p-3 rounded-xl',
                    isActive ? 'bg-primary/10' : 'bg-muted'
                  )}>
                    <Icon className={cn(
                      'w-5 h-5',
                      isActive ? 'text-primary' : 'text-muted-foreground'
                    )} />
                  </div>
                  <span className={cn(
                    'text-sm font-medium',
                    isActive ? 'text-primary' : 'text-foreground'
                  )}>
                    {theme.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Daily Schedule */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider px-1">
            Daily Schedule
          </h3>
          <Card className="border-border/50">
            <CardContent className="p-4">
              <button 
                onClick={() => setScheduleDialogOpen(true)}
                className="w-full flex items-center gap-3"
              >
                <div className="p-2.5 rounded-xl bg-amber-500/10">
                  <Clock className="w-5 h-5 text-amber-500" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium">Wake & Sleep Times</p>
                  <p className="text-sm text-muted-foreground">
                    {formatTime(userProfile.wakeTime || '07:00')} – {formatTime(userProfile.sleepTime || '23:00')}
                  </p>
                </div>
              </button>
            </CardContent>
          </Card>
          <p className="text-xs text-muted-foreground px-1">
            Auto theme mode uses your schedule to switch between light and dark.
          </p>
        </div>

        {/* Accessibility */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider px-1">
            Accessibility
          </h3>
          {accessibilityOptions.map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.key} className="border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-muted">
                        <Icon className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                      </div>
                    </div>
                    <Switch 
                      checked={accessibilitySettings[item.key]} 
                      onCheckedChange={(value) => updateAccessibility(item.key, value)}
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Schedule Dialog */}
      <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Daily Schedule</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <p className="text-sm text-muted-foreground">
              Set your wake and sleep times. In auto mode, the theme will switch to dark during your sleep hours.
            </p>
            
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-xl bg-amber-500/10">
                  <Sunrise className="w-5 h-5 text-amber-500" />
                </div>
                <div className="flex-1">
                  <label className="text-sm font-medium mb-1.5 block">Wake Time</label>
                  <Input
                    type="time"
                    value={wakeTime}
                    onChange={(e) => setWakeTime(e.target.value)}
                    className="rounded-xl"
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-xl bg-indigo-500/10">
                  <Sunset className="w-5 h-5 text-indigo-500" />
                </div>
                <div className="flex-1">
                  <label className="text-sm font-medium mb-1.5 block">Sleep Time</label>
                  <Input
                    type="time"
                    value={sleepTime}
                    onChange={(e) => setSleepTime(e.target.value)}
                    className="rounded-xl"
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScheduleDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveSchedule}>
              Save Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AppearanceScreen;
