import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, Code, Briefcase, Palette, VolumeX, Dumbbell,
  Timer, Check, Minus, X, Music, ChevronUp, Heart, Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { FocusType, GymSubType, GymBodyArea } from '@/hooks/useFocusModeAI';
import { FocusAmbientPicker, FocusMusicButton } from './FocusAmbientPicker';
import { useFocusAmbientMusic } from '@/hooks/useFocusAmbientMusic';

interface FocusTypeOption {
  id: FocusType;
  icon: React.ReactNode;
  label: string;
  description: string;
}

const focusTypes: FocusTypeOption[] = [
  { id: 'study', icon: <BookOpen className="w-5 h-5" />, label: 'Study', description: 'I\'ll help you learn' },
  { id: 'coding', icon: <Code className="w-5 h-5" />, label: 'Coding', description: 'Debug & build together' },
  { id: 'work', icon: <Briefcase className="w-5 h-5" />, label: 'Work', description: 'Clear priorities' },
  { id: 'gym', icon: <Dumbbell className="w-5 h-5" />, label: 'Gym', description: 'Calm workout companion' },
  { id: 'creative', icon: <Palette className="w-5 h-5" />, label: 'Creative', description: 'I\'ll stay quiet' },
  { id: 'quiet', icon: <VolumeX className="w-5 h-5" />, label: 'Just focus quietly', description: 'No interruptions' },
];

const durationOptions = [15, 25, 45, 60];

interface FocusTypeSelectionProps {
  onSelect: (type: FocusType) => void;
  onDismiss: () => void;
}

export const FocusTypeSelection: React.FC<FocusTypeSelectionProps> = ({ onSelect, onDismiss }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="bg-card/90 backdrop-blur-sm border border-border/50 rounded-2xl p-4 space-y-4"
    >
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">What are we focusing on?</p>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onDismiss}>
          <X className="w-4 h-4" />
        </Button>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        {focusTypes.map((type) => (
          <button
            key={type.id}
            onClick={() => onSelect(type.id)}
            className={cn(
              "flex items-center gap-3 p-3 rounded-xl text-left transition-all",
              "bg-muted/30 hover:bg-primary/10 hover:border-primary/30 border border-transparent",
              (type.id === 'quiet') && "col-span-2"
            )}
          >
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center",
              type.id === 'gym' ? "bg-orange-500/10 text-orange-500" : "bg-primary/10 text-primary"
            )}>
              {type.icon}
            </div>
            <div>
              <p className="font-medium text-sm">{type.label}</p>
              <p className="text-xs text-muted-foreground">{type.description}</p>
            </div>
          </button>
        ))}
      </div>
    </motion.div>
  );
};

// Gym Sub-Type Selection (Strength/Cardio/Light)
interface GymSubTypeSelectionProps {
  onSelect: (subType: GymSubType) => void;
  onBack: () => void;
}

export const GymSubTypeSelection: React.FC<GymSubTypeSelectionProps> = ({ onSelect, onBack }) => {
  const gymOptions = [
    { id: 'strength' as GymSubType, icon: <Dumbbell className="w-5 h-5" />, label: 'Strength', description: 'Build & lift' },
    { id: 'cardio' as GymSubType, icon: <Zap className="w-5 h-5" />, label: 'Cardio', description: 'Get moving' },
    { id: 'light' as GymSubType, icon: <Heart className="w-5 h-5" />, label: 'Light movement', description: 'Easy & gentle' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="bg-card/90 backdrop-blur-sm border border-orange-500/30 rounded-2xl p-4 space-y-4"
    >
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Are we doing strength, cardio, or just moving today?</p>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onBack}>
          <X className="w-4 h-4" />
        </Button>
      </div>
      
      <div className="space-y-2">
        {gymOptions.map((option) => (
          <button
            key={option.id}
            onClick={() => onSelect(option.id)}
            className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all bg-muted/30 hover:bg-orange-500/10 hover:border-orange-500/30 border border-transparent"
          >
            <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500">
              {option.icon}
            </div>
            <div>
              <p className="font-medium text-sm">{option.label}</p>
              <p className="text-xs text-muted-foreground">{option.description}</p>
            </div>
          </button>
        ))}
      </div>
    </motion.div>
  );
};

// Gym Body Area Selection (for Strength)
interface GymBodyAreaSelectionProps {
  onSelect: (area: GymBodyArea) => void;
  onBack: () => void;
}

export const GymBodyAreaSelection: React.FC<GymBodyAreaSelectionProps> = ({ onSelect, onBack }) => {
  const areaOptions = [
    { id: 'upper' as GymBodyArea, label: 'Upper body', emoji: '💪' },
    { id: 'lower' as GymBodyArea, label: 'Lower body', emoji: '🦵' },
    { id: 'full' as GymBodyArea, label: 'Full body', emoji: '🏋️' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="bg-card/90 backdrop-blur-sm border border-orange-500/30 rounded-2xl p-4 space-y-4"
    >
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Any area you want to focus on?</p>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onBack}>
          <X className="w-4 h-4" />
        </Button>
      </div>
      
      <div className="flex gap-2">
        {areaOptions.map((option) => (
          <button
            key={option.id}
            onClick={() => onSelect(option.id)}
            className="flex-1 flex flex-col items-center gap-2 p-4 rounded-xl transition-all bg-muted/30 hover:bg-orange-500/10"
          >
            <span className="text-2xl">{option.emoji}</span>
            <span className="text-xs font-medium">{option.label}</span>
          </button>
        ))}
      </div>
    </motion.div>
  );
};

interface FocusGoalInputProps {
  focusType: FocusType;
  onSubmit: (goal: string, duration: number) => void;
  onBack: () => void;
}

export const FocusGoalInput: React.FC<FocusGoalInputProps> = ({ focusType, onSubmit, onBack }) => {
  const [goal, setGoal] = useState('');
  const [duration, setDuration] = useState(25);
  
  const getPromptText = () => {
    switch (focusType) {
      case 'study': return "What's the goal for this session?";
      case 'coding': return "What are you working on?";
      case 'work': return "What's your priority right now?";
      case 'creative': return "What are you creating?";
      default: return "What's your goal?";
    }
  };
  
  const getPlaceholder = () => {
    switch (focusType) {
      case 'study': return "e.g., Learn derivatives, Review chapter 5...";
      case 'coding': return "e.g., Fix the login bug, Build the API...";
      case 'work': return "e.g., Finish the report, Clear emails...";
      case 'creative': return "e.g., Edit the video, Design the logo...";
      default: return "Describe your goal...";
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="bg-card/90 backdrop-blur-sm border border-border/50 rounded-2xl p-4 space-y-4"
    >
      <p className="text-sm text-muted-foreground">{getPromptText()}</p>
      
      <input
        type="text"
        value={goal}
        onChange={(e) => setGoal(e.target.value)}
        placeholder={getPlaceholder()}
        className="w-full px-4 py-3 rounded-xl bg-muted/30 border border-border/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        autoFocus
      />
      
      <div>
        <p className="text-xs text-muted-foreground mb-2">How long feels doable?</p>
        <div className="flex gap-2">
          {durationOptions.map((d) => (
            <button
              key={d}
              onClick={() => setDuration(d)}
              className={cn(
                "flex-1 py-2 rounded-lg text-sm font-medium transition-all",
                duration === d
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
              )}
            >
              {d}m
            </button>
          ))}
        </div>
      </div>
      
      <div className="flex gap-2">
        <Button variant="outline" onClick={onBack} className="flex-1 rounded-xl">
          Back
        </Button>
        <Button 
          onClick={() => onSubmit(goal || 'Focus session', duration)} 
          className="flex-1 rounded-xl"
        >
          Let's begin
        </Button>
      </div>
    </motion.div>
  );
};

interface FocusActiveBannerProps {
  focusType: FocusType;
  goal: string;
  remainingTime: number;
  formatTime: (seconds: number) => string;
  onEnd: () => void;
}

export const FocusActiveBanner: React.FC<FocusActiveBannerProps> = ({
  focusType,
  goal,
  remainingTime,
  formatTime,
  onEnd,
}) => {
  const [showMusicPicker, setShowMusicPicker] = useState(false);
  const ambientMusic = useFocusAmbientMusic();
  
  const isGym = focusType === 'gym';
  
  const getTypeIcon = () => {
    switch (focusType) {
      case 'study': return <BookOpen className="w-4 h-4" />;
      case 'coding': return <Code className="w-4 h-4" />;
      case 'work': return <Briefcase className="w-4 h-4" />;
      case 'creative': return <Palette className="w-4 h-4" />;
      case 'quiet': return <VolumeX className="w-4 h-4" />;
      case 'gym': return <Dumbbell className="w-4 h-4" />;
    }
  };
  
  const getBannerStyle = () => {
    if (isGym) {
      return "bg-gradient-to-r from-orange-500/20 to-amber-500/20 border-orange-500/30";
    }
    return "bg-gradient-to-r from-violet-500/20 to-purple-500/20 border-violet-500/30";
  };
  
  const getTextStyle = () => {
    if (isGym) {
      return "text-orange-600 dark:text-orange-400";
    }
    return "text-violet-600 dark:text-violet-400";
  };
  
  const getBadgeStyle = () => {
    if (isGym) {
      return "bg-orange-500/20 text-orange-600 dark:text-orange-400";
    }
    return "bg-violet-500/20 text-violet-600 dark:text-violet-400";
  };
  
  const getIconStyle = () => {
    if (isGym) {
      return "bg-orange-500/20 text-orange-500";
    }
    return "bg-violet-500/20 text-violet-500";
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="px-4 py-2 space-y-2"
    >
      <div className={cn("rounded-xl p-3 border", getBannerStyle())}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", getIconStyle())}>
              {getTypeIcon()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={cn("font-medium text-sm", getTextStyle())}>
                  {isGym ? 'Gym Focus' : 'Focus Mode'}
                </span>
                <span className={cn("text-xs px-2 py-0.5 rounded-full", getBadgeStyle())}>
                  {formatTime(remainingTime)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground truncate max-w-48">{goal}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <FocusMusicButton
              onClick={() => setShowMusicPicker(!showMusicPicker)}
              isPlaying={ambientMusic.isPlaying}
              trackIcon={ambientMusic.currentTrack?.icon}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={onEnd}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              End
            </Button>
          </div>
        </div>
        
        {/* Gym-specific helper text */}
        {isGym && (
          <p className="text-xs text-muted-foreground mt-2 opacity-70">
            I'm here if you need anything. 💪
          </p>
        )}
      </div>
      
      {/* Ambient Music Picker */}
      <FocusAmbientPicker 
        isOpen={showMusicPicker} 
        onClose={() => setShowMusicPicker(false)} 
      />
    </motion.div>
  );
};

interface FocusReflectionProps {
  goal: string;
  focusType?: FocusType;
  onReflect: (result: 'yes' | 'almost' | 'not_today') => void;
}

export const FocusReflection: React.FC<FocusReflectionProps> = ({ goal, focusType, onReflect }) => {
  const isGym = focusType === 'gym';
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn(
        "bg-card/90 backdrop-blur-sm border rounded-2xl p-4 space-y-4",
        isGym ? "border-orange-500/30" : "border-border/50"
      )}
    >
      <p className="text-sm text-foreground">
        How did that feel?
      </p>
      
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={() => onReflect('yes')}
          className="flex-1 rounded-xl gap-2"
        >
          <Check className="w-4 h-4 text-green-500" />
          Good
        </Button>
        <Button
          variant="outline"
          onClick={() => onReflect('almost')}
          className="flex-1 rounded-xl gap-2"
        >
          <Minus className="w-4 h-4 text-amber-500" />
          Okay
        </Button>
        <Button
          variant="outline"
          onClick={() => onReflect('not_today')}
          className="flex-1 rounded-xl gap-2"
        >
          <X className="w-4 h-4 text-muted-foreground" />
          Rough
        </Button>
      </div>
    </motion.div>
  );
};

interface StruggleSupportProps {
  message: string;
  buttons?: string[];
  isSafetyOverride?: boolean;
  onResponse: (response: string) => void;
}

export const StruggleSupport: React.FC<StruggleSupportProps> = ({ message, buttons, isSafetyOverride, onResponse }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn(
        "border rounded-2xl p-4 space-y-3",
        isSafetyOverride 
          ? "bg-red-500/10 border-red-500/30" 
          : "bg-amber-500/10 border-amber-500/20"
      )}
    >
      <p className="text-sm text-foreground whitespace-pre-line">{message}</p>
      
      {buttons && (
        <div className="flex gap-2">
          {buttons.map((btn) => (
            <Button
              key={btn}
              variant="outline"
              size="sm"
              onClick={() => onResponse(btn)}
              className={cn(
                "flex-1 rounded-xl text-xs",
                isSafetyOverride && "border-red-500/30 hover:bg-red-500/10"
              )}
            >
              {btn}
            </Button>
          ))}
        </div>
      )}
    </motion.div>
  );
};

// Recovery Day Banner
interface RecoveryBannerProps {
  onUpdateStatus: (feeling: 'better' | 'still_tired') => void;
}

export const RecoveryBanner: React.FC<RecoveryBannerProps> = ({ onUpdateStatus }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 space-y-3"
    >
      <div className="flex items-center gap-2">
        <Heart className="w-5 h-5 text-blue-500" />
        <p className="text-sm font-medium">Recovery Day</p>
      </div>
      
      <p className="text-xs text-muted-foreground">
        Today feels like a recovery day. We'll focus on movement, not intensity.
        How's your body feeling now?
      </p>
      
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onUpdateStatus('better')}
          className="flex-1 rounded-xl text-xs"
        >
          Better 💪
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onUpdateStatus('still_tired')}
          className="flex-1 rounded-xl text-xs"
        >
          Still tired 😴
        </Button>
      </div>
    </motion.div>
  );
};
