import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useAura } from '@/contexts/AuraContext';
import { cn } from '@/lib/utils';
import { Heart, GraduationCap, Brain, Palette, Dumbbell, Sparkles } from 'lucide-react';

interface ChatSettingsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PERSONA_OPTIONS = [
  { 
    id: 'companion', 
    icon: Heart, 
    label: 'Companion', 
    description: 'calm, supportive, presence-first',
    color: 'text-pink-500'
  },
  { 
    id: 'mentor', 
    icon: GraduationCap, 
    label: 'Mentor', 
    description: 'learning, skills, improvement',
    color: 'text-blue-500'
  },
  { 
    id: 'thinking-partner', 
    icon: Brain, 
    label: 'Thinking Partner', 
    description: 'planning, clarity, decisions',
    color: 'text-purple-500'
  },
  { 
    id: 'creative', 
    icon: Palette, 
    label: 'Creative Partner', 
    description: 'ideas, design, expression',
    color: 'text-orange-500'
  },
  { 
    id: 'coach', 
    icon: Dumbbell, 
    label: 'Coach', 
    description: 'habits, gym, discipline',
    color: 'text-green-500'
  },
];

const RESPONSE_STYLES = [
  { id: 'short', label: 'Short & calm' },
  { id: 'balanced', label: 'Balanced' },
  { id: 'detailed', label: 'Detailed (only when needed)' },
];

export const ChatSettingsSheet: React.FC<ChatSettingsSheetProps> = ({ open, onOpenChange }) => {
  const { userProfile, updateUserProfile } = useAura();
  
  // AI Name state
  const [useCustomName, setUseCustomName] = useState(
    userProfile.aiName && userProfile.aiName !== 'AURRA'
  );
  const [customName, setCustomName] = useState(userProfile.aiName || 'AURRA');
  
  // Persona preference
  const [preferredPersona, setPreferredPersona] = useState(
    userProfile.preferredPersona || 'companion'
  );
  
  // Response style
  const [responseStyle, setResponseStyle] = useState(
    userProfile.responseStyle || 'balanced'
  );
  
  // Humor toggle
  const [askBeforeJoking, setAskBeforeJoking] = useState(
    userProfile.askBeforeJoking !== false // Default true
  );
  
  // Memory permissions
  const [memoryPermissions, setMemoryPermissions] = useState({
    goals: userProfile.memoryPermissions?.goals !== false,
    preferences: userProfile.memoryPermissions?.preferences !== false,
    emotional: userProfile.memoryPermissions?.emotional !== false,
  });

  // Auto-save on changes
  useEffect(() => {
    const aiName = useCustomName ? customName : 'AURRA';
    
    updateUserProfile({
      aiName,
      preferredPersona,
      responseStyle,
      askBeforeJoking,
      memoryPermissions,
    });
    
    // Also persist to localStorage for immediate access
    localStorage.setItem('aurra-ai-name', aiName);
    localStorage.setItem('aurra-chat-settings', JSON.stringify({
      preferredPersona,
      responseStyle,
      askBeforeJoking,
      memoryPermissions,
    }));
  }, [useCustomName, customName, preferredPersona, responseStyle, askBeforeJoking, memoryPermissions]);

  const handleCustomNameChange = (name: string) => {
    // Max 15 characters
    if (name.length <= 15) {
      setCustomName(name);
    }
  };

  const handleMemoryToggle = (key: keyof typeof memoryPermissions) => {
    setMemoryPermissions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const currentAiName = useCustomName ? customName : 'AURRA';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Personality & Presence
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-8 pb-8">
          {/* Section 1: AI Name */}
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold">What should I call myself?</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Giving me a name can make our conversations feel more personal. This is completely optional.
              </p>
            </div>
            
            <RadioGroup 
              value={useCustomName ? 'custom' : 'aurra'} 
              onValueChange={(v) => setUseCustomName(v === 'custom')}
              className="space-y-3"
            >
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="aurra" id="name-aurra" />
                <Label htmlFor="name-aurra" className="text-sm cursor-pointer">
                  AURRA <span className="text-muted-foreground">(default)</span>
                </Label>
              </div>
              <div className="flex items-start space-x-3">
                <RadioGroupItem value="custom" id="name-custom" className="mt-1" />
                <div className="flex-1 space-y-2">
                  <Label htmlFor="name-custom" className="text-sm cursor-pointer">
                    Custom name
                  </Label>
                  {useCustomName && (
                    <Input
                      value={customName === 'AURRA' ? '' : customName}
                      onChange={(e) => handleCustomNameChange(e.target.value)}
                      placeholder="e.g., Nova, Alex..."
                      className="h-9 rounded-xl"
                      maxLength={15}
                    />
                  )}
                </div>
              </div>
            </RadioGroup>
            
            <p className="text-xs text-muted-foreground italic">
              I'll use this name gently — only in emotional or reassuring moments.
            </p>
          </div>

          {/* Section 2: Preferred Persona */}
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold">How would you like me to show up for you?</h3>
              <p className="text-xs text-muted-foreground mt-1">
                I'll still adapt automatically. This just helps me understand what you usually prefer.
              </p>
            </div>
            
            <RadioGroup 
              value={preferredPersona} 
              onValueChange={setPreferredPersona}
              className="space-y-2"
            >
              {PERSONA_OPTIONS.map((persona) => {
                const Icon = persona.icon;
                return (
                  <label
                    key={persona.id}
                    htmlFor={`persona-${persona.id}`}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all",
                      preferredPersona === persona.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <RadioGroupItem value={persona.id} id={`persona-${persona.id}`} className="sr-only" />
                    <div className={cn("p-2 rounded-lg bg-muted", persona.color)}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{persona.label}</p>
                      <p className="text-xs text-muted-foreground">{persona.description}</p>
                    </div>
                    {preferredPersona === persona.id && (
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    )}
                  </label>
                );
              })}
            </RadioGroup>
            
            <p className="text-xs text-muted-foreground italic">
              You don't need to change this often. I'll adapt as needed.
            </p>
          </div>

          {/* Section 3: Response Style */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Response style</h3>
            
            <RadioGroup 
              value={responseStyle} 
              onValueChange={setResponseStyle}
              className="space-y-2"
            >
              {RESPONSE_STYLES.map((style) => (
                <div key={style.id} className="flex items-center space-x-3">
                  <RadioGroupItem value={style.id} id={`style-${style.id}`} />
                  <Label htmlFor={`style-${style.id}`} className="text-sm cursor-pointer">
                    {style.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
            
            <p className="text-xs text-muted-foreground italic">
              I'll still keep things simple unless you ask for depth.
            </p>
          </div>

          {/* Section 4: Humor Toggle */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold">Humor & Lightness</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  I'll only use humor when you're okay with it.
                </p>
              </div>
              <Switch
                checked={askBeforeJoking}
                onCheckedChange={setAskBeforeJoking}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Ask before joking
            </p>
          </div>

          {/* Section 5: Memory Permissions */}
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold">What should I remember?</h3>
              <p className="text-xs text-muted-foreground mt-1">
                You can change this anytime.
              </p>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Checkbox 
                  id="memory-goals" 
                  checked={memoryPermissions.goals}
                  onCheckedChange={() => handleMemoryToggle('goals')}
                />
                <Label htmlFor="memory-goals" className="text-sm cursor-pointer">
                  Goals & routines
                </Label>
              </div>
              <div className="flex items-center space-x-3">
                <Checkbox 
                  id="memory-preferences" 
                  checked={memoryPermissions.preferences}
                  onCheckedChange={() => handleMemoryToggle('preferences')}
                />
                <Label htmlFor="memory-preferences" className="text-sm cursor-pointer">
                  Preferences & habits
                </Label>
              </div>
              <div className="flex items-center space-x-3">
                <Checkbox 
                  id="memory-emotional" 
                  checked={memoryPermissions.emotional}
                  onCheckedChange={() => handleMemoryToggle('emotional')}
                />
                <Label htmlFor="memory-emotional" className="text-sm cursor-pointer">
                  Emotional patterns
                </Label>
              </div>
            </div>
          </div>

          {/* Subtle footer note */}
          <p className="text-xs text-center text-muted-foreground/60 pt-4">
            Changes apply instantly · {currentAiName} adapts quietly
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
};
