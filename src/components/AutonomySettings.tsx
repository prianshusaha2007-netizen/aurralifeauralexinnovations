import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Bot, Hand, Lightbulb, Rocket, Zap,
  Heart, Brain, MessageSquare, AudioLines,
  Bell, Eye, Database, Shield, Volume2,
  ChevronRight, Check
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

export interface AutonomyPreferences {
  autonomyLevel: 'do-as-told' | 'help-when-asked' | 'help-proactively' | 'full-optimization';
  emotionalIntensity: number; // 0-100
  defaultMode: 'voice' | 'chat' | 'hybrid';
  companionWeight: number; // 0-100, where 100 is full companion, 0 is full mentor
  notificationsEnabled: boolean;
  insightsVerbosity: 'minimal' | 'balanced' | 'detailed';
  memoryTransparency: boolean;
  proactiveCheckins: boolean;
  voiceEnabled: boolean;
  nightMode: {
    enabled: boolean;
    startTime: string;
    endTime: string;
  };
}

interface AutonomySettingsProps {
  preferences?: AutonomyPreferences;
  onSave?: (preferences: AutonomyPreferences) => void;
}

const defaultPreferences: AutonomyPreferences = {
  autonomyLevel: 'help-when-asked',
  emotionalIntensity: 70,
  defaultMode: 'hybrid',
  companionWeight: 50,
  notificationsEnabled: true,
  insightsVerbosity: 'balanced',
  memoryTransparency: true,
  proactiveCheckins: true,
  voiceEnabled: true,
  nightMode: {
    enabled: true,
    startTime: '22:00',
    endTime: '07:00'
  }
};

const autonomyLevels = [
  { 
    value: 'do-as-told', 
    icon: Hand, 
    label: 'Do as told', 
    desc: 'Only act when explicitly asked',
    color: 'text-slate-500'
  },
  { 
    value: 'help-when-asked', 
    icon: Lightbulb, 
    label: 'Help when asked', 
    desc: 'Offer suggestions when you ask',
    color: 'text-amber-500'
  },
  { 
    value: 'help-proactively', 
    icon: Bot, 
    label: 'Help proactively', 
    desc: 'Suggest actions based on patterns',
    color: 'text-blue-500'
  },
  { 
    value: 'full-optimization', 
    icon: Rocket, 
    label: 'Full optimization', 
    desc: 'Actively optimize your life cadence',
    color: 'text-violet-500'
  },
];

export const AutonomySettings: React.FC<AutonomySettingsProps> = ({
  preferences: initialPreferences,
  onSave
}) => {
  const [preferences, setPreferences] = useState<AutonomyPreferences>(
    initialPreferences || defaultPreferences
  );
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('aura_autonomy_preferences');
    if (saved) {
      setPreferences(JSON.parse(saved));
    }
  }, []);

  const updatePreference = <K extends keyof AutonomyPreferences>(
    key: K, 
    value: AutonomyPreferences[K]
  ) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    localStorage.setItem('aura_autonomy_preferences', JSON.stringify(preferences));
    onSave?.(preferences);
    setHasChanges(false);
  };

  const getCompanionMentorLabel = () => {
    if (preferences.companionWeight > 70) return 'Mostly Companion';
    if (preferences.companionWeight > 55) return 'Slightly Companion';
    if (preferences.companionWeight > 45) return 'Balanced';
    if (preferences.companionWeight > 30) return 'Slightly Mentor';
    return 'Mostly Mentor';
  };

  return (
    <div className="space-y-6">
      {/* Autonomy Level */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Autonomy Level</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          How proactive should AURRA be in helping you?
        </p>
        <div className="grid gap-2">
          {autonomyLevels.map((level, i) => (
            <Card
              key={level.value}
              className={cn(
                "p-4 cursor-pointer transition-all",
                preferences.autonomyLevel === level.value
                  ? "border-primary bg-primary/5"
                  : "hover:border-muted-foreground/30"
              )}
              onClick={() => updatePreference('autonomyLevel', level.value as any)}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                  <level.icon className={cn("w-5 h-5", level.color)} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{level.label}</p>
                    <Badge variant="outline" className="text-xs">
                      Level {i + 1}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{level.desc}</p>
                </div>
                {preferences.autonomyLevel === level.value && (
                  <Check className="w-5 h-5 text-primary" />
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>

      <Separator />

      {/* Companion vs Mentor Balance */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-500" />
            <h3 className="font-semibold">Personality Balance</h3>
          </div>
          <Badge variant="secondary">{getCompanionMentorLabel()}</Badge>
        </div>
        <div className="flex items-center gap-4">
          <Brain className="w-4 h-4 text-violet-500" />
          <Slider
            value={[preferences.companionWeight]}
            onValueChange={(v) => updatePreference('companionWeight', v[0])}
            max={100}
            step={5}
            className="flex-1"
          />
          <Heart className="w-4 h-4 text-rose-500" />
        </div>
        <p className="text-sm text-muted-foreground text-center">
          Mentor ← → Companion
        </p>
      </div>

      <Separator />

      {/* Emotional Intensity */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Emotional Warmth</h3>
          </div>
          <span className="text-sm text-muted-foreground">
            {preferences.emotionalIntensity}%
          </span>
        </div>
        <Slider
          value={[preferences.emotionalIntensity]}
          onValueChange={(v) => updatePreference('emotionalIntensity', v[0])}
          max={100}
          step={10}
        />
        <p className="text-sm text-muted-foreground">
          {preferences.emotionalIntensity < 40 ? 'More direct and efficient' :
           preferences.emotionalIntensity > 70 ? 'Warmer and more empathetic' :
           'Balanced emotional presence'}
        </p>
      </div>

      <Separator />

      {/* Interaction Mode */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Default Interaction</h3>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { value: 'chat', icon: MessageSquare, label: 'Chat' },
            { value: 'voice', icon: AudioLines, label: 'Voice' },
            { value: 'hybrid', icon: Zap, label: 'Hybrid' },
          ].map((mode) => (
            <Card
              key={mode.value}
              className={cn(
                "p-3 cursor-pointer text-center transition-all",
                preferences.defaultMode === mode.value
                  ? "border-primary bg-primary/5"
                  : "hover:border-muted-foreground/30"
              )}
              onClick={() => updatePreference('defaultMode', mode.value as any)}
            >
              <mode.icon className={cn(
                "w-5 h-5 mx-auto mb-1",
                preferences.defaultMode === mode.value ? "text-primary" : "text-muted-foreground"
              )} />
              <p className="text-sm font-medium">{mode.label}</p>
            </Card>
          ))}
        </div>
      </div>

      <Separator />

      {/* Insights Verbosity */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Eye className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Insights Detail</h3>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { value: 'minimal', label: 'Minimal' },
            { value: 'balanced', label: 'Balanced' },
            { value: 'detailed', label: 'Detailed' },
          ].map((option) => (
            <Card
              key={option.value}
              className={cn(
                "p-3 cursor-pointer text-center transition-all",
                preferences.insightsVerbosity === option.value
                  ? "border-primary bg-primary/5"
                  : "hover:border-muted-foreground/30"
              )}
              onClick={() => updatePreference('insightsVerbosity', option.value as any)}
            >
              <p className="text-sm font-medium">{option.label}</p>
            </Card>
          ))}
        </div>
      </div>

      <Separator />

      {/* Toggle Settings */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="font-medium">Notifications</p>
              <p className="text-sm text-muted-foreground">Reminders and check-ins</p>
            </div>
          </div>
          <Switch
            checked={preferences.notificationsEnabled}
            onCheckedChange={(v) => updatePreference('notificationsEnabled', v)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Volume2 className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="font-medium">Voice</p>
              <p className="text-sm text-muted-foreground">Enable voice interactions</p>
            </div>
          </div>
          <Switch
            checked={preferences.voiceEnabled}
            onCheckedChange={(v) => updatePreference('voiceEnabled', v)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bot className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="font-medium">Proactive Check-ins</p>
              <p className="text-sm text-muted-foreground">AURRA initiates conversations</p>
            </div>
          </div>
          <Switch
            checked={preferences.proactiveCheckins}
            onCheckedChange={(v) => updatePreference('proactiveCheckins', v)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Database className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="font-medium">Memory Transparency</p>
              <p className="text-sm text-muted-foreground">See what AURRA remembers</p>
            </div>
          </div>
          <Switch
            checked={preferences.memoryTransparency}
            onCheckedChange={(v) => updatePreference('memoryTransparency', v)}
          />
        </div>
      </div>

      {/* Save Button */}
      {hasChanges && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky bottom-4"
        >
          <Button onClick={handleSave} className="w-full" size="lg">
            Save Preferences
          </Button>
        </motion.div>
      )}
    </div>
  );
};
