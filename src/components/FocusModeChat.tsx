import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, Code, Briefcase, Palette, VolumeX,
  Timer, Check, Minus, X, Music, ChevronUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { FocusType } from '@/hooks/useFocusModeAI';
import { FocusAmbientPicker, FocusMusicButton } from './FocusAmbientPicker';
import { CompactFocusStats } from './FocusAnalyticsDashboard';
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
              type.id === 'quiet' && "col-span-2"
            )}
          >
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
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
        <p className="text-xs text-muted-foreground mb-2">Duration</p>
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
          Start Focus
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
  
  const getTypeIcon = () => {
    switch (focusType) {
      case 'study': return <BookOpen className="w-4 h-4" />;
      case 'coding': return <Code className="w-4 h-4" />;
      case 'work': return <Briefcase className="w-4 h-4" />;
      case 'creative': return <Palette className="w-4 h-4" />;
      case 'quiet': return <VolumeX className="w-4 h-4" />;
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="px-4 py-2 space-y-2"
    >
      <div className="bg-gradient-to-r from-violet-500/20 to-purple-500/20 rounded-xl p-3 border border-violet-500/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center text-violet-500">
              {getTypeIcon()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-violet-600 dark:text-violet-400 text-sm">Focus Mode</span>
                <span className="text-xs bg-violet-500/20 px-2 py-0.5 rounded-full text-violet-600 dark:text-violet-400">
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
      </div>
      
      {/* Ambient Music Picker */}
      <FocusAmbientPicker 
        isOpen={showMusicPicker} 
        onClose={() => setShowMusicPicker(false)} 
      />
      
      {/* Compact stats */}
      <CompactFocusStats />
    </motion.div>
  );
};

interface FocusReflectionProps {
  goal: string;
  onReflect: (result: 'yes' | 'almost' | 'not_today') => void;
}

export const FocusReflection: React.FC<FocusReflectionProps> = ({ goal, onReflect }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="bg-card/90 backdrop-blur-sm border border-border/50 rounded-2xl p-4 space-y-4"
    >
      <p className="text-sm text-foreground">
        Quick check —<br />
        did you finish what you planned?
      </p>
      
      {goal && (
        <p className="text-xs text-muted-foreground italic">"{goal}"</p>
      )}
      
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={() => onReflect('yes')}
          className="flex-1 rounded-xl gap-2"
        >
          <Check className="w-4 h-4 text-green-500" />
          Yes
        </Button>
        <Button
          variant="outline"
          onClick={() => onReflect('almost')}
          className="flex-1 rounded-xl gap-2"
        >
          <Minus className="w-4 h-4 text-amber-500" />
          Almost
        </Button>
        <Button
          variant="outline"
          onClick={() => onReflect('not_today')}
          className="flex-1 rounded-xl gap-2"
        >
          <X className="w-4 h-4 text-muted-foreground" />
          Not today
        </Button>
      </div>
    </motion.div>
  );
};

interface StruggleSupportProps {
  message: string;
  buttons?: string[];
  onResponse: (response: string) => void;
}

export const StruggleSupport: React.FC<StruggleSupportProps> = ({ message, buttons, onResponse }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 space-y-3"
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
              className="flex-1 rounded-xl text-xs"
            >
              {btn}
            </Button>
          ))}
        </div>
      )}
    </motion.div>
  );
};
