import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Hand, Brain, Rocket, Check, Info } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export type AutonomyMode = 'A' | 'B' | 'C';

interface AutonomyModeSelectorProps {
  value?: AutonomyMode;
  onChange?: (mode: AutonomyMode) => void;
  compact?: boolean;
}

const modes = [
  { 
    value: 'A' as const, 
    icon: Hand, 
    label: 'Command', 
    fullLabel: 'You Command → AURRA Executes',
    desc: 'Full control. AURRA only acts when explicitly asked.',
    color: 'text-slate-500',
    bgColor: 'bg-slate-500/10',
    borderColor: 'border-slate-500',
    examples: [
      'Open Instagram',
      'Play Spotify',
      'Send message to John',
    ]
  },
  { 
    value: 'B' as const, 
    icon: Brain, 
    label: 'Suggest', 
    fullLabel: 'AURRA Suggests → You Approve',
    desc: 'AURRA proposes workflows and actions. You tap to approve.',
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500',
    examples: [
      'Should I start your morning playlist?',
      'Time for focus mode?',
      'Reply to pending message?',
    ]
  },
  { 
    value: 'C' as const, 
    icon: Rocket, 
    label: 'Predict', 
    fullLabel: 'AURRA Predicts → You Confirm',
    desc: 'AURRA anticipates needs and acts. Confirm once, auto-execute.',
    color: 'text-violet-500',
    bgColor: 'bg-violet-500/10',
    borderColor: 'border-violet-500',
    examples: [
      'Auto-starting focus mode (usual time)',
      'Sending good morning to Mom',
      'Ordering your regular coffee',
    ]
  },
];

export const AutonomyModeSelector: React.FC<AutonomyModeSelectorProps> = ({
  value,
  onChange,
  compact = false,
}) => {
  const [selectedMode, setSelectedMode] = useState<AutonomyMode>(value || 'B');

  useEffect(() => {
    if (value) setSelectedMode(value);
  }, [value]);

  useEffect(() => {
    // Load from localStorage if no value prop
    if (!value) {
      const saved = localStorage.getItem('aurra_autonomy_mode');
      if (saved && ['A', 'B', 'C'].includes(saved)) {
        setSelectedMode(saved as AutonomyMode);
      }
    }
  }, [value]);

  const handleSelect = (mode: AutonomyMode) => {
    setSelectedMode(mode);
    localStorage.setItem('aurra_autonomy_mode', mode);
    onChange?.(mode);
  };

  if (compact) {
    return (
      <div className="flex gap-1.5">
        {modes.map((mode) => (
          <TooltipProvider key={mode.value}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => handleSelect(mode.value)}
                  className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                    selectedMode === mode.value
                      ? cn(mode.bgColor, mode.borderColor, "border-2")
                      : "bg-muted hover:bg-muted/80"
                  )}
                >
                  <mode.icon className={cn("w-4 h-4", selectedMode === mode.value ? mode.color : "text-muted-foreground")} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-[200px]">
                <p className="font-medium text-xs">{mode.fullLabel}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{mode.desc}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {modes.map((mode) => (
        <motion.div
          key={mode.value}
          whileTap={{ scale: 0.98 }}
        >
          <Card
            className={cn(
              "p-4 cursor-pointer transition-all",
              selectedMode === mode.value
                ? cn("border-2", mode.borderColor, mode.bgColor)
                : "hover:border-muted-foreground/30"
            )}
            onClick={() => handleSelect(mode.value)}
          >
            <div className="flex items-start gap-4">
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                mode.bgColor
              )}>
                <mode.icon className={cn("w-5 h-5", mode.color)} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className={cn("text-xs", mode.color)}>
                    Mode {mode.value}
                  </Badge>
                  <p className="font-medium text-sm">{mode.label}</p>
                </div>
                <p className="text-xs text-muted-foreground mb-2">{mode.desc}</p>
                <div className="flex flex-wrap gap-1.5">
                  {mode.examples.map((ex, i) => (
                    <span key={i} className="text-[10px] bg-muted px-1.5 py-0.5 rounded">
                      {ex}
                    </span>
                  ))}
                </div>
              </div>
              {selectedMode === mode.value && (
                <Check className={cn("w-5 h-5 shrink-0", mode.color)} />
              )}
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};

export const useAutonomyMode = () => {
  const [mode, setMode] = useState<AutonomyMode>('B');

  useEffect(() => {
    const saved = localStorage.getItem('aurra_autonomy_mode');
    if (saved && ['A', 'B', 'C'].includes(saved)) {
      setMode(saved as AutonomyMode);
    }
  }, []);

  const setAutonomyMode = (newMode: AutonomyMode) => {
    setMode(newMode);
    localStorage.setItem('aurra_autonomy_mode', newMode);
  };

  return { mode, setAutonomyMode };
};
