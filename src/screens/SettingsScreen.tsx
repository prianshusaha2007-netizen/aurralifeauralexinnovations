import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Sun, 
  Moon, 
  Monitor,
  User, 
  Globe, 
  MessageSquare, 
  Download, 
  Trash2,
  ChevronRight,
  Sparkles,
  LogOut,
  Volume2,
  Bell,
  BellRing,
  Mic,
  Shield,
  FileText,
  Clock,
  Sunrise,
  Sunset,
  Bot,
  Edit3,
  Crown
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAura } from '@/contexts/AuraContext';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/contexts/ThemeContext';
import { useCredits } from '@/hooks/useCredits';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { WeeklyEmailSettings } from '@/components/WeeklyEmailSettings';
import { VoiceSettingsPanel } from '@/components/VoiceSettingsPanel';
import { MicrophoneTest } from '@/components/MicrophoneTest';
import { ResetPermissionsGuide } from '@/components/ResetPermissionsGuide';
import { PersonaSettings } from '@/components/PersonaSettings';
import { UpgradeSheet } from '@/components/UpgradeSheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useMorningBriefing } from '@/hooks/useMorningBriefing';

export const SettingsScreen: React.FC = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { 
    userProfile, 
    updateUserProfile,
    clearChatHistory, 
    clearAllMemories 
  } = useAura();
  const { mode, activeTheme, setMode, setUserSchedule } = useTheme();
  const { toast } = useToast();
  const { subscribeToPush, unsubscribeFromPush, checkSubscription, isSupported } = usePushNotifications();
  const { showBriefingNotification } = useMorningBriefing();
  const { getCreditStatus } = useCredits();
  
  // Credit status
  const creditStatus = getCreditStatus();
  
  // Upgrade sheet state
  const [showUpgradeSheet, setShowUpgradeSheet] = useState(false);
  
  // Schedule state
  const [wakeTime, setWakeTime] = useState(userProfile.wakeTime || '07:00');
  const [sleepTime, setSleepTime] = useState(userProfile.sleepTime || '23:00');
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  
  // AI Name customization state
  const [aiName, setAiName] = useState(userProfile.aiName || 'AURRA');
  const [aiNameDialogOpen, setAiNameDialogOpen] = useState(false);
  const [tempAiName, setTempAiName] = useState(aiName);
  
  // Voice settings state
  const [voiceSettings, setVoiceSettings] = useState(() => {
    const saved = localStorage.getItem('aura-voice-settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return { voiceName: '', speed: 1.0, pitch: 1.0, volume: 1.0 };
      }
    }
    return { voiceName: '', speed: 1.0, pitch: 1.0, volume: 1.0 };
  });

  // Push notification state
  const [pushEnabled, setPushEnabled] = useState(false);

  useEffect(() => {
    checkSubscription().then(setPushEnabled);
  }, [checkSubscription]);

  const handlePushToggle = async (enabled: boolean) => {
    if (enabled) {
      const success = await subscribeToPush();
      setPushEnabled(success);
    } else {
      await unsubscribeFromPush();
      setPushEnabled(false);
    }
  };

  const handleTestBriefing = async () => {
    await showBriefingNotification();
    toast({
      title: "Morning Briefing Sent! ☀️",
      description: "Check your notification",
    });
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth', { replace: true });
  };

  const handleExportChat = () => {
    toast({
      title: "Export Started",
      description: "Your chat history is being prepared for download.",
    });
  };

  const handleClearChat = () => {
    clearChatHistory();
    toast({
      title: "Chat Cleared",
      description: "Your chat history has been deleted.",
    });
  };

  const handleClearMemories = () => {
    clearAllMemories();
    toast({
      title: "Memories Cleared",
      description: "All saved memories have been deleted.",
    });
  };

  const cycleThemeMode = () => {
    const modes = ['light', 'dark', 'auto'] as const;
    const currentIndex = modes.indexOf(mode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setMode(modes[nextIndex]);
    toast({
      title: `Theme: ${modes[nextIndex].charAt(0).toUpperCase() + modes[nextIndex].slice(1)}`,
      description: modes[nextIndex] === 'auto' ? 'Adapts to your schedule' : `${modes[nextIndex]} mode enabled`,
    });
  };

  const handleSaveSchedule = () => {
    // Update the theme context
    setUserSchedule({ wakeTime, sleepTime });
    
    // Also update the user profile so it persists
    updateUserProfile({ 
      wakeTime, 
      sleepTime,
      onboardingComplete: true // Ensure profile saves
    });
    
    setScheduleDialogOpen(false);
    toast({
      title: "Schedule Updated",
      description: `Wake: ${wakeTime}, Sleep: ${sleepTime}`,
    });
  };

  const handleSaveAiName = () => {
    const name = tempAiName.trim() || 'AURRA';
    setAiName(name);
    localStorage.setItem('aurra-ai-name', name);
    updateUserProfile({ aiName: name });
    setAiNameDialogOpen(false);
    toast({
      title: name === 'AURRA' ? 'Name Reset' : 'Name Updated',
      description: name === 'AURRA' ? 'I\'ll go by AURRA again' : `You can now call me ${name}`,
    });
  };

  const getThemeIcon = () => {
    if (mode === 'auto') return Monitor;
    return activeTheme === 'dark' ? Moon : Sun;
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${minutes} ${ampm}`;
  };

  const settingsSections = [
    // Upgrade section (only for non-premium users)
    ...(!creditStatus.isPremium ? [{
      title: 'CHAT & PRESENCE',
      items: [
        {
          icon: Crown,
          label: `${aiName} Plus`,
          description: 'Stay longer · Go deeper · Build consistency',
          isUpgradeSettings: true,
          action: <ChevronRight className="w-5 h-5 text-primary" />,
          highlight: true,
        },
      ],
    }] : []),
    {
      title: 'PERSONA & AVATAR',
      items: [
        {
          icon: Edit3,
          label: `My AI's Name`,
          description: aiName === 'AURRA' ? 'Default: AURRA' : `Custom: ${aiName}`,
          isAiNameSettings: true,
          action: <ChevronRight className="w-5 h-5 text-muted-foreground" />,
        },
        {
          icon: Bot,
          label: `${aiName} Persona`,
          description: 'Avatar style & communication preferences',
          isPersonaSettings: true,
          action: <ChevronRight className="w-5 h-5 text-muted-foreground" />,
        },
      ],
    },
    {
      title: 'APPEARANCE',
      items: [
        {
          icon: getThemeIcon(),
          label: 'Theme Mode',
          description: `${mode.charAt(0).toUpperCase() + mode.slice(1)} mode${mode === 'auto' ? ' (adapts to schedule)' : ''}`,
          onClick: cycleThemeMode,
          action: <ChevronRight className="w-5 h-5 text-muted-foreground" />,
        },
        {
          icon: Clock,
          label: 'Daily Schedule',
          description: `Wake ${formatTime(userProfile.wakeTime || '07:00')} • Sleep ${formatTime(userProfile.sleepTime || '23:00')}`,
          isScheduleSettings: true,
          action: <ChevronRight className="w-5 h-5 text-muted-foreground" />,
        },
      ],
    },
    {
      title: 'VOICE',
      items: [
        {
          icon: Volume2,
          label: 'Voice Settings',
          description: `Voice: ${voiceSettings.voice}, Speed: ${voiceSettings.speed}x`,
          isVoiceSettings: true,
          action: <ChevronRight className="w-5 h-5 text-muted-foreground" />,
        },
        {
          icon: Mic,
          label: 'Test Microphone',
          description: 'Verify your microphone works',
          isMicTest: true,
          action: <ChevronRight className="w-5 h-5 text-muted-foreground" />,
        },
        {
          icon: Shield,
          label: 'Reset Permissions',
          description: 'Fix denied microphone or notification access',
          isPermissionsGuide: true,
          action: <ChevronRight className="w-5 h-5 text-muted-foreground" />,
        },
      ],
    },
    {
      title: 'NOTIFICATIONS',
      items: [
        {
          icon: BellRing,
          label: 'Push Notifications',
          description: pushEnabled ? 'Enabled' : 'Disabled',
          action: (
            <Switch 
              checked={pushEnabled} 
              onCheckedChange={handlePushToggle}
              disabled={!isSupported}
            />
          ),
        },
        {
          icon: Bell,
          label: 'Test Morning Briefing',
          description: 'Get your personalized morning update now',
          onClick: handleTestBriefing,
          action: <ChevronRight className="w-5 h-5 text-muted-foreground" />,
        },
      ],
    },
    {
      title: 'EMAIL',
      customComponent: <WeeklyEmailSettings />,
    },
    {
      title: 'PROFILE',
      items: [
        {
          icon: User,
          label: 'Edit Profile',
          description: `Logged in as ${userProfile.name || 'User'}`,
          action: <ChevronRight className="w-5 h-5 text-muted-foreground" />,
        },
        {
          icon: Globe,
          label: 'Language Settings',
          description: userProfile.languages.join(', ') || 'Not set',
          action: <ChevronRight className="w-5 h-5 text-muted-foreground" />,
        },
        {
          icon: MessageSquare,
          label: 'Tone Style',
          description: userProfile.tonePreference || 'Mixed',
          action: <ChevronRight className="w-5 h-5 text-muted-foreground" />,
        },
      ],
    },
    {
      title: 'DATA',
      items: [
        {
          icon: Download,
          label: 'Export Chat',
          description: 'Download your conversation history',
          onClick: handleExportChat,
          action: <ChevronRight className="w-5 h-5 text-muted-foreground" />,
        },
        {
          icon: Trash2,
          label: 'Clear Chat History',
          description: 'Delete all messages',
          onClick: handleClearChat,
          action: <ChevronRight className="w-5 h-5 text-destructive" />,
          destructive: true,
        },
        {
          icon: Trash2,
          label: 'Delete Memories',
          description: 'Remove all saved memories',
          onClick: handleClearMemories,
          action: <ChevronRight className="w-5 h-5 text-destructive" />,
          destructive: true,
        },
      ],
    },
    {
      title: 'LEGAL',
      items: [
        {
          icon: FileText,
          label: 'Privacy Policy',
          description: 'How we handle your data',
          onClick: () => navigate('/privacy'),
          action: <ChevronRight className="w-5 h-5 text-muted-foreground" />,
        },
        {
          icon: FileText,
          label: 'Terms of Service',
          description: 'Usage terms and conditions',
          onClick: () => navigate('/terms'),
          action: <ChevronRight className="w-5 h-5 text-muted-foreground" />,
        },
      ],
    },
    {
      title: 'ACCOUNT',
      items: [
        {
          icon: LogOut,
          label: 'Sign Out',
          description: 'Log out of your account',
          onClick: handleSignOut,
          action: <ChevronRight className="w-5 h-5 text-destructive" />,
          destructive: true,
        },
      ],
    },
  ];

  return (
    <div className="flex flex-col h-full p-4 pb-24">
      {/* Schedule Settings Dialog */}
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
            <Button variant="outline" onClick={() => setScheduleDialogOpen(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button onClick={handleSaveSchedule} className="rounded-xl">
              Save Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Name Dialog */}
      <Dialog open={aiNameDialogOpen} onOpenChange={setAiNameDialogOpen}>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle>Name Your AI</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Give me a custom name, or keep the default "AURRA". I'll respond to whatever you choose.
            </p>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">AI Name</label>
              <Input
                value={tempAiName}
                onChange={(e) => setTempAiName(e.target.value)}
                placeholder="e.g., Nova, Alex, Buddy..."
                className="rounded-xl"
                maxLength={20}
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to reset to AURRA
              </p>
            </div>

            {/* Quick suggestions */}
            <div className="flex flex-wrap gap-2">
              {['AURRA', 'Nova', 'Alex', 'Sage', 'Echo'].map((name) => (
                <Button
                  key={name}
                  variant={tempAiName === name ? 'default' : 'outline'}
                  size="sm"
                  className="rounded-full text-xs"
                  onClick={() => setTempAiName(name)}
                >
                  {name}
                </Button>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAiNameDialogOpen(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button onClick={handleSaveAiName} className="rounded-xl">
              Save Name
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold aura-gradient-text">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Customize your {aiName} experience
        </p>
      </div>

      {/* About Card */}
      <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl p-4 mb-6 border border-primary/20">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/20">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold">{aiName}</h2>
            <p className="text-xs text-muted-foreground">Your all-time AI companion</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Version 1.0
        </p>
      </div>

      {/* Settings Sections */}
      <div className="flex-1 overflow-y-auto space-y-6">
        {settingsSections.map((section) => (
          <div key={section.title}>
            <h2 className="text-xs font-semibold text-muted-foreground mb-3">
              {section.title}
            </h2>
            <div className="bg-card rounded-2xl border border-border/50 overflow-hidden p-4">
              {'customComponent' in section && section.customComponent ? (
                section.customComponent
              ) : (
                'items' in section && section.items?.map((item: any, index: number) => {
                  const Icon = item.icon;
                  
                  // Upgrade settings
                  if (item.isUpgradeSettings) {
                    return (
                      <button
                        key={item.label}
                        onClick={() => setShowUpgradeSheet(true)}
                        className={cn(
                          'flex items-center gap-4 w-full p-4 text-left -mx-4',
                          'hover:bg-primary/5 transition-colors',
                          'bg-gradient-to-r from-primary/5 to-accent/5',
                          index !== (section.items?.length ?? 0) - 1 && 'border-b border-border/50'
                        )}
                      >
                        <div className="p-2 rounded-lg bg-primary/20 text-primary">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-primary">{item.label}</p>
                          <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                        </div>
                        {item.action}
                      </button>
                    );
                  }
                  
                  // AI Name settings
                  if (item.isAiNameSettings) {
                    return (
                      <button
                        key={item.label}
                        onClick={() => {
                          setTempAiName(aiName);
                          setAiNameDialogOpen(true);
                        }}
                        className={cn(
                          'flex items-center gap-4 w-full p-4 text-left -mx-4',
                          'hover:bg-muted/50 transition-colors',
                          index !== (section.items?.length ?? 0) - 1 && 'border-b border-border/50'
                        )}
                      >
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{item.label}</p>
                          <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                        </div>
                        {item.action}
                      </button>
                    );
                  }
                  
                  // Schedule settings
                  if (item.isScheduleSettings) {
                    return (
                      <button
                        key={item.label}
                        onClick={() => setScheduleDialogOpen(true)}
                        className={cn(
                          'flex items-center gap-4 w-full p-4 text-left -mx-4',
                          'hover:bg-muted/50 transition-colors',
                          index !== (section.items?.length ?? 0) - 1 && 'border-b border-border/50'
                        )}
                      >
                        <div className="p-2 rounded-lg bg-muted text-foreground">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{item.label}</p>
                          <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                        </div>
                        {item.action}
                      </button>
                    );
                  }
                  
                  // Voice settings with dialog
                  if (item.isVoiceSettings) {
                    return (
                      <Dialog key={item.label}>
                        <DialogTrigger asChild>
                          <button
                            className={cn(
                              'flex items-center gap-4 w-full p-4 text-left -mx-4',
                              'hover:bg-muted/50 transition-colors',
                              index !== (section.items?.length ?? 0) - 1 && 'border-b border-border/50'
                            )}
                          >
                            <div className="p-2 rounded-lg bg-muted text-foreground">
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium">{item.label}</p>
                              <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                            </div>
                            {item.action}
                          </button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle>Voice Settings</DialogTitle>
                          </DialogHeader>
                          <VoiceSettingsPanel 
                            settings={voiceSettings} 
                            onChange={setVoiceSettings} 
                          />
                        </DialogContent>
                      </Dialog>
                    );
                  }

                  // Microphone test with dialog
                  if (item.isMicTest) {
                    return (
                      <Dialog key={item.label}>
                        <DialogTrigger asChild>
                          <button
                            className={cn(
                              'flex items-center gap-4 w-full p-4 text-left -mx-4',
                              'hover:bg-muted/50 transition-colors',
                              index !== (section.items?.length ?? 0) - 1 && 'border-b border-border/50'
                            )}
                          >
                            <div className="p-2 rounded-lg bg-muted text-foreground">
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium">{item.label}</p>
                              <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                            </div>
                            {item.action}
                          </button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle>Microphone Test</DialogTitle>
                          </DialogHeader>
                          <MicrophoneTest />
                        </DialogContent>
                      </Dialog>
                    );
                  }

                  // Permissions guide with dialog
                  if (item.isPermissionsGuide) {
                    return (
                      <Dialog key={item.label}>
                        <DialogTrigger asChild>
                          <button
                            className={cn(
                              'flex items-center gap-4 w-full p-4 text-left -mx-4',
                              'hover:bg-muted/50 transition-colors',
                              index !== (section.items?.length ?? 0) - 1 && 'border-b border-border/50'
                            )}
                          >
                            <div className="p-2 rounded-lg bg-muted text-foreground">
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium">{item.label}</p>
                              <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                            </div>
                            {item.action}
                          </button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
                          <ResetPermissionsGuide />
                        </DialogContent>
                      </Dialog>
                    );
                  }

                  // Persona settings with dialog
                  if (item.isPersonaSettings) {
                    return (
                      <Dialog key={item.label}>
                        <DialogTrigger asChild>
                          <button
                            className={cn(
                              'flex items-center gap-4 w-full p-4 text-left -mx-4',
                              'hover:bg-muted/50 transition-colors',
                              index !== (section.items?.length ?? 0) - 1 && 'border-b border-border/50'
                            )}
                          >
                            <div className="p-2 rounded-lg bg-primary/10 text-primary">
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium">{item.label}</p>
                              <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                            </div>
                            {item.action}
                          </button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>AURRA Persona</DialogTitle>
                          </DialogHeader>
                          <PersonaSettings />
                        </DialogContent>
                      </Dialog>
                    );
                  }
                  
                  return (
                    <button
                      key={item.label}
                      onClick={item.onClick}
                      className={cn(
                        'flex items-center gap-4 w-full p-4 text-left -mx-4',
                        'hover:bg-muted/50 transition-colors',
                        index !== (section.items?.length ?? 0) - 1 && 'border-b border-border/50'
                      )}
                      disabled={!item.onClick}
                    >
                      <div className={cn(
                        'p-2 rounded-lg',
                        item.destructive ? 'bg-destructive/10 text-destructive' : 'bg-muted text-foreground'
                      )}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          'text-sm font-medium',
                          item.destructive && 'text-destructive'
                        )}>
                          {item.label}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {item.description}
                        </p>
                      </div>
                      {item.action}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        ))}
      </div>
      
      {/* Upgrade Sheet */}
      <UpgradeSheet open={showUpgradeSheet} onOpenChange={setShowUpgradeSheet} />
    </div>
  );
};
