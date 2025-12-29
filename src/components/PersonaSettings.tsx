import React from 'react';
import { usePersonaContext } from '@/contexts/PersonaContext';
import { AuraAvatar, AvatarStyle } from '@/components/AuraAvatar';
import { cn } from '@/lib/utils';
import { Check, User, Sparkles, Brain, Hammer, Scan } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

const PERSONA_ICONS = {
  companion: User,
  mentor: Sparkles,
  thinker: Brain,
  builder: Hammer,
  mirror: Scan,
};

const AVATAR_STYLES: { value: AvatarStyle; label: string }[] = [
  { value: 'abstract', label: 'Abstract' },
  { value: 'silhouette', label: 'Silhouette' },
  { value: 'geometric', label: 'Geometric' },
  { value: 'illustrated', label: 'Illustrated' },
];

const BIAS_PRESETS = [
  { value: 'balanced', label: 'Balanced', description: 'Default AURRA style' },
  { value: 'direct', label: 'Be Direct', description: 'More concise and action-oriented' },
  { value: 'gentle', label: 'Be Gentle', description: 'Extra warm and supportive' },
  { value: 'simple', label: 'Keep Simple', description: 'Easy to understand responses' },
] as const;

export const PersonaSettings: React.FC = () => {
  const {
    currentPersona,
    persona,
    avatarStyle,
    personaBias,
    allPersonas,
    setAvatarStyle,
    applyBiasPreset,
  } = usePersonaContext();

  // Determine which preset is active
  const getActivePreset = () => {
    if (personaBias.directness > 0.3) return 'direct';
    if (personaBias.directness < -0.3) return 'gentle';
    if (personaBias.depth < -0.3) return 'simple';
    return 'balanced';
  };

  const activePreset = getActivePreset();

  return (
    <div className="space-y-6">
      {/* Avatar Style Selection */}
      <div>
        <h3 className="text-sm font-medium mb-3">Avatar Style</h3>
        <p className="text-xs text-muted-foreground mb-4">
          Choose how AURRA appears to you
        </p>
        <div className="flex gap-3 justify-center">
          {AVATAR_STYLES.map((style) => (
            <button
              key={style.value}
              onClick={() => setAvatarStyle(style.value)}
              className={cn(
                'flex flex-col items-center gap-2 p-3 rounded-xl transition-all',
                'border-2',
                avatarStyle === style.value
                  ? 'border-primary bg-primary/5'
                  : 'border-transparent bg-muted/50 hover:bg-muted'
              )}
            >
              <AuraAvatar
                style={style.value}
                size="md"
                showBreathing={avatarStyle === style.value}
              />
              <span className="text-xs font-medium">{style.label}</span>
              {avatarStyle === style.value && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center"
                >
                  <Check className="w-3 h-3 text-primary-foreground" />
                </motion.div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Current Persona Display */}
      <div>
        <h3 className="text-sm font-medium mb-3">Current Persona</h3>
        <p className="text-xs text-muted-foreground mb-4">
          AURRA automatically adapts based on your conversation
        </p>
        <div className="bg-muted/50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            {(() => {
              const Icon = PERSONA_ICONS[currentPersona];
              return (
                <div className="p-2 rounded-lg bg-primary/10">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
              );
            })()}
            <div>
              <p className="font-medium">{persona.name}</p>
              <p className="text-xs text-muted-foreground">{persona.description}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1 mt-3">
            {persona.traits.map((trait) => (
              <span
                key={trait}
                className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full"
              >
                {trait}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Bias Presets */}
      <div>
        <h3 className="text-sm font-medium mb-3">Communication Style</h3>
        <p className="text-xs text-muted-foreground mb-4">
          Gently guide how AURRA responds to you
        </p>
        <div className="grid grid-cols-2 gap-2">
          {BIAS_PRESETS.map((preset) => (
            <button
              key={preset.value}
              onClick={() => applyBiasPreset(preset.value)}
              className={cn(
                'flex flex-col items-start p-3 rounded-xl transition-all text-left',
                'border-2',
                activePreset === preset.value
                  ? 'border-primary bg-primary/5'
                  : 'border-transparent bg-muted/50 hover:bg-muted'
              )}
            >
              <span className="text-sm font-medium">{preset.label}</span>
              <span className="text-xs text-muted-foreground">{preset.description}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Info about evolution */}
      <div className="bg-primary/5 rounded-xl p-4 border border-primary/20">
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">💡 Persona Evolution:</span>{' '}
          AURRA learns your communication style over time and subtly mirrors it with 
          +1% clarity and patience. This happens naturally through your conversations.
        </p>
      </div>
    </div>
  );
};
