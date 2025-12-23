import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sun, 
  Moon, 
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
  Shield
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useAura } from '@/contexts/AuraContext';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { WeeklyEmailSettings } from '@/components/WeeklyEmailSettings';
import { VoiceSettingsPanel } from '@/components/VoiceSettingsPanel';
import { MicrophoneTest } from '@/components/MicrophoneTest';
import { ResetPermissionsGuide } from '@/components/ResetPermissionsGuide';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useMorningBriefing } from '@/hooks/useMorningBriefing';

export const SettingsScreen: React.FC = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { 
    theme, 
    toggleTheme, 
    userProfile, 
    clearChatHistory, 
    clearAllMemories 
  } = useAura();
  const { toast } = useToast();
  const { subscribeToPush, unsubscribeFromPush, checkSubscription, isSupported } = usePushNotifications();
  const { showBriefingNotification } = useMorningBriefing();
  
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

  const settingsSections = [
    {
      title: 'APPEARANCE',
      items: [
        {
          icon: theme === 'dark' ? Moon : Sun,
          label: 'Dark Mode',
          description: 'Switch between light and dark themes',
          action: (
            <Switch 
              checked={theme === 'dark'} 
              onCheckedChange={toggleTheme}
            />
          ),
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
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold aura-gradient-text">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Customize your AURA experience
        </p>
      </div>

      {/* About Card */}
      <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl p-4 mb-6 border border-primary/20">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/20">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold">AURA</h2>
            <p className="text-xs text-muted-foreground">Your All-Time AI Companion</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Version 1.0 • Made with 💜
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
    </div>
  );
};
