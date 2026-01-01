import React, { useState } from 'react';
import { 
  Sun, Moon, Monitor, Palette, Mic, Volume2, Sparkles, 
  Check, X, User, Brain, Hammer, Scan
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { useTheme } from '@/contexts/ThemeContext';
import { usePersonaContext } from '@/contexts/PersonaContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import auraAvatar from '@/assets/aura-avatar.jpeg';

// Types for different settings cards
export type SettingsCardType = 'appearance' | 'voice' | 'personality' | null;

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
                'flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all',
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
                  className="absolute -top-1 -right-1"
                >
                  <Check className="w-3 h-3 text-primary" />
                </motion.div>
              )}
            </button>
          );
        })}
      </div>
      
      <p className="text-xs text-muted-foreground text-center">
        Auto mode adapts based on your wake/sleep schedule
      </p>
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
      description: enabled ? 'AURRA can now speak' : 'Voice responses turned off',
    });
    onSettingsChanged?.(enabled ? 'Enabled voice responses' : 'Disabled voice responses');
  };

  const handleAutoSpeakToggle = (enabled: boolean) => {
    setAutoSpeak(enabled);
    localStorage.setItem('aura-auto-speak', enabled.toString());
    toast({
      title: enabled ? 'Auto-speak On' : 'Auto-speak Off',
      description: enabled ? 'Responses will be spoken automatically' : 'Tap to hear responses',
    });
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
      
      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 rounded-xl bg-card/50 border border-border/50">
          <div className="flex items-center gap-3">
            <Volume2 className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Voice Responses</p>
              <p className="text-xs text-muted-foreground">Let AURRA speak to you</p>
            </div>
          </div>
          <Switch checked={voiceEnabled} onCheckedChange={handleVoiceToggle} />
        </div>
        
        <div className="flex items-center justify-between p-3 rounded-xl bg-card/50 border border-border/50">
          <div className="flex items-center gap-3">
            <Sparkles className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Auto-speak</p>
              <p className="text-xs text-muted-foreground">Speak responses automatically</p>
            </div>
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
  const { 
    currentPersona, 
    persona, 
    personaBias, 
    applyBiasPreset 
  } = usePersonaContext();
  const { toast } = useToast();

  const PERSONA_ICONS = {
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

  const activePreset = getActivePreset();

  const handlePresetChange = (preset: 'balanced' | 'direct' | 'gentle' | 'simple') => {
    applyBiasPreset(preset);
    toast({
      title: `Style: ${preset.charAt(0).toUpperCase() + preset.slice(1)}`,
      description: 'Communication style updated',
    });
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

      {/* Current Persona */}
      <div className="p-3 rounded-xl bg-primary/5 border border-primary/20">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">{persona.name}</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{persona.description}</p>
      </div>
      
      {/* Communication Style */}
      <div>
        <p className="text-xs text-muted-foreground mb-2">Communication Style</p>
        <div className="grid grid-cols-4 gap-2">
          {BIAS_PRESETS.map((preset) => (
            <button
              key={preset.value}
              onClick={() => handlePresetChange(preset.value)}
              className={cn(
                'flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all',
                activePreset === preset.value
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
            {type === 'appearance' && (
              <AppearanceCard onDismiss={onDismiss} onSettingsChanged={onSettingsChanged} />
            )}
            {type === 'voice' && (
              <VoiceCard onDismiss={onDismiss} onSettingsChanged={onSettingsChanged} />
            )}
            {type === 'personality' && (
              <PersonalityCard onDismiss={onDismiss} onSettingsChanged={onSettingsChanged} />
            )}
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
};