import React, { useState, useEffect } from 'react';
import { 
  Sun, Moon, Monitor, Palette, Mic, Volume2, Sparkles, 
  Check, X, User, Brain, Hammer, Scan, Droplets, Bell,
  Calendar, Clock, CreditCard, MapPin,
  Briefcase, Target, Heart, Sunrise, Sunset
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useTheme } from '@/contexts/ThemeContext';
import { usePersonaContext } from '@/contexts/PersonaContext';
import { useAura } from '@/contexts/AuraContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import auraAvatar from '@/assets/aura-avatar.jpeg';

// Types for different settings cards
export type SettingsCardType = 
  | 'appearance' 
  | 'voice' 
  | 'personality' 
  | 'hydration' 
  | 'reminders' 
  | 'routine'
  | 'subscription'
  | 'profile'
  | null;

interface InlineSettingsCardProps {
  type: SettingsCardType;
  onDismiss: () => void;
  onSettingsChanged?: (message: string) => void;
}

// Appearance Settings Card
const AppearanceCard: React.FC<{ 
  onDismiss: () => void; 
  onSettingsChanged?: (message: string) => void;
}> = ({ onDismiss, onSettingsChanged }) => {
  const { mode, setMode } = useTheme();
  const { toast } = useToast();

  const themes = [
    { id: 'light', icon: Sun, label: 'Light' },
    { id: 'dark', icon: Moon, label: 'Dark' },
    { id: 'auto', icon: Monitor, label: 'Auto' },
  ] as const;

  const handleThemeChange = (newMode: 'light' | 'dark' | 'auto') => {
    setMode(newMode);
    toast({
      title: `Theme: ${newMode.charAt(0).toUpperCase() + newMode.slice(1)}`,
      description: newMode === 'auto' ? 'Adapts to your schedule' : `${newMode} mode enabled`,
    });
    onSettingsChanged?.(`Changed theme to ${newMode} mode`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-primary" />
          <span className="font-medium text-sm">Theme</span>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onDismiss}>
          <X className="w-4 h-4" />
        </Button>
      </div>
      
      <div className="grid grid-cols-3 gap-2">
        {themes.map((theme) => {
          const Icon = theme.icon;
          const isActive = mode === theme.id;
          return (
            <button
              key={theme.id}
              onClick={() => handleThemeChange(theme.id)}
              className={cn(
                'flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all relative',
                isActive 
                  ? 'border-primary bg-primary/10' 
                  : 'border-border/50 hover:border-primary/50 bg-card/50'
              )}
            >
              <Icon className={cn(
                'w-5 h-5',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )} />
              <span className={cn(
                'text-xs font-medium',
                isActive ? 'text-primary' : 'text-foreground'
              )}>
                {theme.label}
              </span>
              {isActive && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center"
                >
                  <Check className="w-2.5 h-2.5 text-primary-foreground" />
                </motion.div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// Voice Settings Card
const VoiceCard: React.FC<{ 
  onDismiss: () => void;
  onSettingsChanged?: (message: string) => void;
}> = ({ onDismiss, onSettingsChanged }) => {
  const { toast } = useToast();
  const [voiceEnabled, setVoiceEnabled] = useState(() => {
    return localStorage.getItem('aura-voice-enabled') !== 'false';
  });
  const [autoSpeak, setAutoSpeak] = useState(() => {
    return localStorage.getItem('aura-auto-speak') === 'true';
  });

  const handleVoiceToggle = (enabled: boolean) => {
    setVoiceEnabled(enabled);
    localStorage.setItem('aura-voice-enabled', enabled.toString());
    toast({
      title: enabled ? 'Voice Enabled' : 'Voice Disabled',
    });
    onSettingsChanged?.(enabled ? 'Enabled voice responses' : 'Disabled voice responses');
  };

  const handleAutoSpeakToggle = (enabled: boolean) => {
    setAutoSpeak(enabled);
    localStorage.setItem('aura-auto-speak', enabled.toString());
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Mic className="w-4 h-4 text-primary" />
          <span className="font-medium text-sm">Voice Settings</span>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onDismiss}>
          <X className="w-4 h-4" />
        </Button>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between p-3 rounded-xl bg-card/50 border border-border/50">
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm">Voice Responses</span>
          </div>
          <Switch checked={voiceEnabled} onCheckedChange={handleVoiceToggle} />
        </div>
        
        <div className="flex items-center justify-between p-3 rounded-xl bg-card/50 border border-border/50">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm">Auto-speak</span>
          </div>
          <Switch 
            checked={autoSpeak} 
            onCheckedChange={handleAutoSpeakToggle}
            disabled={!voiceEnabled}
          />
        </div>
      </div>
    </div>
  );
};

// Personality Settings Card
const PersonalityCard: React.FC<{ 
  onDismiss: () => void;
  onSettingsChanged?: (message: string) => void;
}> = ({ onDismiss, onSettingsChanged }) => {
  const { currentPersona, persona, personaBias, applyBiasPreset } = usePersonaContext();
  const { toast } = useToast();

  const PERSONA_ICONS: Record<string, React.ElementType> = {
    companion: User,
    mentor: Sparkles,
    thinker: Brain,
    builder: Hammer,
    mirror: Scan,
  };

  const BIAS_PRESETS = [
    { value: 'balanced', label: 'Balanced', emoji: '⚖️' },
    { value: 'direct', label: 'Direct', emoji: '🎯' },
    { value: 'gentle', label: 'Gentle', emoji: '💝' },
    { value: 'simple', label: 'Simple', emoji: '✨' },
  ] as const;

  const getActivePreset = () => {
    if (personaBias.directness > 0.3) return 'direct';
    if (personaBias.directness < -0.3) return 'gentle';
    if (personaBias.depth < -0.3) return 'simple';
    return 'balanced';
  };

  const handlePresetChange = (preset: 'balanced' | 'direct' | 'gentle' | 'simple') => {
    applyBiasPreset(preset);
    toast({ title: `Style: ${preset}` });
    onSettingsChanged?.(`Changed communication style to ${preset}`);
  };

  const Icon = PERSONA_ICONS[currentPersona] || User;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="font-medium text-sm">Personality</span>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onDismiss}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="p-3 rounded-xl bg-primary/5 border border-primary/20">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">{persona.name}</span>
        </div>
      </div>
      
      <div className="grid grid-cols-4 gap-2">
        {BIAS_PRESETS.map((preset) => (
          <button
            key={preset.value}
            onClick={() => handlePresetChange(preset.value)}
            className={cn(
              'flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all',
              getActivePreset() === preset.value
                ? 'border-primary bg-primary/10'
                : 'border-border/50 hover:border-primary/50'
            )}
          >
            <span className="text-lg">{preset.emoji}</span>
            <span className="text-[10px] font-medium">{preset.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

// Hydration & Health Card
const HydrationCard: React.FC<{ 
  onDismiss: () => void;
  onSettingsChanged?: (message: string) => void;
}> = ({ onDismiss, onSettingsChanged }) => {
  const { toast } = useToast();
  const [hydrationReminder, setHydrationReminder] = useState(() => {
    return localStorage.getItem('aurra-hydration-reminder') === 'true';
  });
  const [interval, setInterval] = useState(() => {
    return localStorage.getItem('aurra-hydration-interval') || '2';
  });

  const handleToggle = (enabled: boolean) => {
    setHydrationReminder(enabled);
    localStorage.setItem('aurra-hydration-reminder', enabled.toString());
    toast({ title: enabled ? 'Hydration reminders on 💧' : 'Hydration reminders off' });
    onSettingsChanged?.(enabled ? 'Enabled hydration reminders' : 'Disabled hydration reminders');
  };

  const handleIntervalChange = (hours: string) => {
    setInterval(hours);
    localStorage.setItem('aurra-hydration-interval', hours);
    toast({ title: `Reminding every ${hours} hours` });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Droplets className="w-4 h-4 text-cyan-500" />
          <span className="font-medium text-sm">Hydration & Health</span>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onDismiss}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex items-center justify-between p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
        <div className="flex items-center gap-2">
          <Droplets className="w-4 h-4 text-cyan-500" />
          <span className="text-sm">Water reminders</span>
        </div>
        <Switch checked={hydrationReminder} onCheckedChange={handleToggle} />
      </div>

      {hydrationReminder && (
        <div className="flex gap-2">
          {['1', '2', '3'].map((hours) => (
            <button
              key={hours}
              onClick={() => handleIntervalChange(hours)}
              className={cn(
                'flex-1 py-2 rounded-xl text-sm font-medium transition-all',
                interval === hours 
                  ? 'bg-cyan-500 text-white' 
                  : 'bg-muted hover:bg-muted/80'
              )}
            >
              {hours}h
            </button>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground text-center">
        Gentle nudges to stay hydrated throughout the day
      </p>
    </div>
  );
};

// Reminders Card
const RemindersCard: React.FC<{ 
  onDismiss: () => void;
  onSettingsChanged?: (message: string) => void;
}> = ({ onDismiss, onSettingsChanged }) => {
  const [reminders, setReminders] = useState<Array<{ id: string; text: string; time: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReminders = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('reminders')
        .select('*')
        .eq('user_id', user.id)
        .eq('active', true)
        .order('time', { ascending: true })
        .limit(5);

      if (data) {
        setReminders(data.map(r => ({ id: r.id, text: r.text, time: r.time })));
      }
      setLoading(false);
    };

    fetchReminders();
  }, []);

  const formatTime = (time: string) => {
    try {
      const [hours, mins] = time.split(':');
      const h = parseInt(hours);
      const ampm = h >= 12 ? 'PM' : 'AM';
      return `${h % 12 || 12}:${mins} ${ampm}`;
    } catch {
      return time;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-orange-500" />
          <span className="font-medium text-sm">Smart Reminders</span>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onDismiss}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-4 text-muted-foreground text-sm">Loading...</div>
      ) : reminders.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-sm text-muted-foreground">No active reminders</p>
          <p className="text-xs text-muted-foreground mt-1">
            Say "remind me to..." to create one
          </p>
        </div>
      ) : (
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {reminders.map((reminder) => (
            <div key={reminder.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20">
              <Clock className="w-4 h-4 text-orange-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{reminder.text}</p>
                <p className="text-xs text-muted-foreground">{formatTime(reminder.time)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground text-center">
        "Remind me to call mom at 5pm"
      </p>
    </div>
  );
};

// Routine Card
const RoutineCard: React.FC<{ 
  onDismiss: () => void;
  onSettingsChanged?: (message: string) => void;
}> = ({ onDismiss, onSettingsChanged }) => {
  const [routines, setRoutines] = useState<Array<{ id: string; title: string; time: string; completed: boolean }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRoutines = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('routines')
        .select('*')
        .eq('user_id', user.id)
        .order('time', { ascending: true })
        .limit(6);

      if (data) {
        setRoutines(data.map(r => ({ 
          id: r.id, 
          title: r.title, 
          time: r.time,
          completed: r.completed || false
        })));
      }
      setLoading(false);
    };

    fetchRoutines();
  }, []);

  const toggleComplete = async (id: string, completed: boolean) => {
    await supabase
      .from('routines')
      .update({ completed: !completed })
      .eq('id', id);
    
    setRoutines(prev => prev.map(r => 
      r.id === id ? { ...r, completed: !completed } : r
    ));
    
    onSettingsChanged?.(!completed ? 'Marked routine as complete' : 'Marked routine as incomplete');
  };

  const formatTime = (time: string) => {
    try {
      const [hours, mins] = time.split(':');
      const h = parseInt(hours);
      const ampm = h >= 12 ? 'PM' : 'AM';
      return `${h % 12 || 12}:${mins} ${ampm}`;
    } catch {
      return time;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-violet-500" />
          <span className="font-medium text-sm">Today's Routine</span>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onDismiss}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-4 text-muted-foreground text-sm">Loading...</div>
      ) : routines.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-sm text-muted-foreground">No routine blocks yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Say "add morning workout at 7am"
          </p>
        </div>
      ) : (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {routines.map((routine) => (
            <button
              key={routine.id}
              onClick={() => toggleComplete(routine.id, routine.completed)}
              className={cn(
                'flex items-center gap-3 p-2.5 rounded-xl w-full text-left transition-all',
                routine.completed 
                  ? 'bg-green-500/10 border border-green-500/20' 
                  : 'bg-violet-500/10 border border-violet-500/20'
              )}
            >
              <div className={cn(
                'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all',
                routine.completed 
                  ? 'bg-green-500 border-green-500' 
                  : 'border-violet-500'
              )}>
                {routine.completed && <Check className="w-3 h-3 text-white" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn('text-sm', routine.completed && 'line-through text-muted-foreground')}>
                  {routine.title}
                </p>
                <p className="text-xs text-muted-foreground">{formatTime(routine.time)}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Subscription Card - Non-pushy, value-first design
const SubscriptionCard: React.FC<{ 
  onDismiss: () => void;
  onSettingsChanged?: (message: string) => void;
}> = ({ onDismiss }) => {
  const [subscription, setSubscription] = useState<{ tier: string; creditsUsed: number; creditsLimit: number; renewalDate?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: credits } = await supabase
        .from('user_credits')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      const { data: sub } = await supabase
        .from('subscriptions')
        .select('tier, expires_at')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      setSubscription({
        tier: sub?.tier || 'free',
        creditsUsed: credits?.daily_credits_used || 0,
        creditsLimit: credits?.daily_credits_limit || 30,
        renewalDate: sub?.expires_at ? new Date(sub.expires_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) : undefined,
      });
      setLoading(false);
    };

    fetchSubscription();
  }, []);

  // Plan configuration - user-friendly labels, no technical jargon
  const plans = [
    { id: 'free', name: 'Free', price: '₹0', messages: '~30/day', label: 'Light daily use', color: 'from-gray-400 to-gray-500' },
    { id: 'basic', name: 'Basic', price: '₹99', messages: '~80/day', label: 'Everyday use', color: 'from-blue-400 to-blue-500' },
    { id: 'pro', name: 'Pro', price: '₹199', messages: '~150/day', label: 'Most popular', color: 'from-purple-500 to-pink-500', recommended: true },
    { id: 'max', name: 'Max', price: '₹299', messages: '~300/day', label: 'All-day use', color: 'from-amber-500 to-orange-500' },
  ];

  const currentPlan = plans.find(p => p.id === subscription?.tier) || plans[0];
  const usagePercent = Math.min(100, ((subscription?.creditsUsed || 0) / (subscription?.creditsLimit || 1)) * 100);
  const isNearLimit = usagePercent > 80;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-purple-500" />
          <span className="font-medium text-sm">Your Plan</span>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onDismiss}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-4 text-muted-foreground text-sm">Loading...</div>
      ) : (
        <>
          {/* Current Plan Card */}
          <div className={cn(
            "p-4 rounded-xl border",
            `bg-gradient-to-br ${currentPlan.color}/20 border-primary/30`
          )}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <Badge className={cn("bg-gradient-to-r text-white", currentPlan.color)}>
                  {currentPlan.name}
                </Badge>
                <p className="text-xs text-muted-foreground mt-1">{currentPlan.label}</p>
              </div>
              <span className="text-lg font-semibold">{currentPlan.price}<span className="text-xs text-muted-foreground">/mo</span></span>
            </div>
            
            {/* Usage indicator - no technical terms */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Today's usage</span>
                <span className={isNearLimit ? 'text-orange-500 font-medium' : ''}>
                  {subscription?.creditsUsed} messages used
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${usagePercent}%` }}
                  className={cn(
                    "h-full rounded-full transition-all",
                    isNearLimit ? 'bg-orange-500' : `bg-gradient-to-r ${currentPlan.color}`
                  )}
                />
              </div>
            </div>

            {subscription?.renewalDate && (
              <p className="text-xs text-muted-foreground mt-2">
                Renews {subscription.renewalDate}
              </p>
            )}
          </div>

          {/* Soft upsell - only for free users, never pushy */}
          {subscription?.tier === 'free' && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground text-center">
                Pick what feels right. You can change anytime.
              </p>
              
              <div className="grid grid-cols-3 gap-2">
                {plans.slice(1).map((plan) => (
                  <button
                    key={plan.id}
                    className={cn(
                      'p-2.5 rounded-xl border-2 transition-all text-center relative',
                      plan.recommended 
                        ? 'border-purple-500 bg-purple-500/10' 
                        : 'border-border/50 hover:border-primary/50'
                    )}
                  >
                    {plan.recommended && (
                      <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[8px] bg-purple-500 text-white px-2 py-0.5 rounded-full">
                        Popular
                      </span>
                    )}
                    <p className="font-semibold text-sm">{plan.price}</p>
                    <p className="text-[10px] text-muted-foreground">{plan.messages}</p>
                  </button>
                ))}
              </div>

              <Button 
                variant="outline" 
                className="w-full rounded-full text-sm"
              >
                See plans
              </Button>
            </div>
          )}

          {/* Near limit soft nudge */}
          {isNearLimit && subscription?.tier === 'free' && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 text-center"
            >
              <p className="text-xs text-foreground">
                I can still chat, but I'll be a bit limited today 🙂
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                If you want deeper help anytime, you can unlock more access.
              </p>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
};

// Profile Card - Clean, human sections
const ProfileCard: React.FC<{ 
  onDismiss: () => void;
  onSettingsChanged?: (message: string) => void;
}> = ({ onDismiss }) => {
  const { userProfile } = useAura();
  
  // Relationship options
  const relationships = [
    { id: 'friend', label: 'Best Friend', emoji: '🤝' },
    { id: 'mentor', label: 'Mentor', emoji: '🧭' },
    { id: 'coach', label: 'Coach', emoji: '💪' },
    { id: 'thinker', label: 'Thinking Partner', emoji: '🧠' },
  ];
  
  const currentRelationship = localStorage.getItem('aurra-relationship') || 'friend';

  const formatTime = (time: string | undefined) => {
    if (!time) return '--:--';
    const [h, m] = time.split(':');
    const hour = parseInt(h);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    return `${hour % 12 || 12}:${m} ${ampm}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-primary" />
          <span className="font-medium text-sm">Profile & Personal Details</span>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onDismiss}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* About You Section */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
          <Brain className="w-3 h-3" /> About You
        </p>
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2.5 rounded-xl bg-card/50 border border-border/50">
            <p className="text-[10px] text-muted-foreground">Name</p>
            <p className="text-sm font-medium truncate">{userProfile.name || 'Not set'}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-card/50 border border-border/50">
            <p className="text-[10px] text-muted-foreground">Profession</p>
            <p className="text-sm font-medium truncate">{userProfile.profession || 'Not set'}</p>
          </div>
        </div>
      </div>

      {/* Daily Rhythm Section */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
          <Clock className="w-3 h-3" /> Daily Rhythm
        </p>
        <div className="flex gap-2">
          <div className="flex-1 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-2">
            <Sunrise className="w-4 h-4 text-amber-500" />
            <div>
              <p className="text-[10px] text-muted-foreground">Wake</p>
              <p className="text-sm font-medium">{formatTime(userProfile.wakeTime)}</p>
            </div>
          </div>
          <div className="flex-1 p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center gap-2">
            <Sunset className="w-4 h-4 text-indigo-500" />
            <div>
              <p className="text-[10px] text-muted-foreground">Sleep</p>
              <p className="text-sm font-medium">{formatTime(userProfile.sleepTime)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Life Focus Section */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
          <Target className="w-3 h-3" /> Life Focus
        </p>
        <div className="p-2.5 rounded-xl bg-card/50 border border-border/50">
          <p className="text-sm">
            {userProfile.goals?.length 
              ? userProfile.goals.slice(0, 3).join(' • ') 
              : 'Tell me your goals to get started'}
          </p>
        </div>
      </div>

      {/* Relationship with AURRA */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
          <Heart className="w-3 h-3" /> Relationship with AURRA
        </p>
        <div className="grid grid-cols-4 gap-1.5">
          {relationships.map((rel) => (
            <div
              key={rel.id}
              className={cn(
                'p-2 rounded-lg text-center transition-all',
                currentRelationship === rel.id
                  ? 'bg-primary/10 border-2 border-primary'
                  : 'bg-card/50 border border-border/50'
              )}
            >
              <span className="text-base">{rel.emoji}</span>
              <p className="text-[9px] mt-0.5 leading-tight">{rel.label}</p>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground text-center">
          You can change this anytime
        </p>
      </div>
    </div>
  );
};

// Main Component
export const InlineSettingsCard: React.FC<InlineSettingsCardProps> = ({
  type,
  onDismiss,
  onSettingsChanged,
}) => {
  if (!type) return null;

  const renderCard = () => {
    switch (type) {
      case 'appearance':
        return <AppearanceCard onDismiss={onDismiss} onSettingsChanged={onSettingsChanged} />;
      case 'voice':
        return <VoiceCard onDismiss={onDismiss} onSettingsChanged={onSettingsChanged} />;
      case 'personality':
        return <PersonalityCard onDismiss={onDismiss} onSettingsChanged={onSettingsChanged} />;
      case 'hydration':
        return <HydrationCard onDismiss={onDismiss} onSettingsChanged={onSettingsChanged} />;
      case 'reminders':
        return <RemindersCard onDismiss={onDismiss} onSettingsChanged={onSettingsChanged} />;
      case 'routine':
        return <RoutineCard onDismiss={onDismiss} onSettingsChanged={onSettingsChanged} />;
      case 'subscription':
        return <SubscriptionCard onDismiss={onDismiss} onSettingsChanged={onSettingsChanged} />;
      case 'profile':
        return <ProfileCard onDismiss={onDismiss} onSettingsChanged={onSettingsChanged} />;
      default:
        return null;
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.95 }}
        className="flex gap-3"
      >
        <div className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-primary/10 shrink-0">
          <img src={auraAvatar} alt="AURRA" className="w-full h-full object-cover" />
        </div>
        <Card className="flex-1 bg-card/80 backdrop-blur-sm border-border/40 overflow-hidden">
          <CardContent className="p-4">
            {renderCard()}
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
};