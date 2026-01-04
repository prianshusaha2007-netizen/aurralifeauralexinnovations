/**
 * AURRA Rhythm Editor
 * 
 * Minimal, card-based rhythm view
 * No dashboards, no time-tables, no stress
 * Editable via chat
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useLifeRhythm, LifeRhythm } from '@/hooks/useLifeRhythm';
import { 
  Sun, 
  Sunset, 
  Moon, 
  Calendar,
  Sparkles,
  Coffee,
  Zap,
  Wind,
  Edit3,
  Check,
  X
} from 'lucide-react';

interface RhythmEditorSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSendMessage?: (message: string) => void;
}

const timeOfDayIcons = {
  morning: Sun,
  afternoon: Zap,
  evening: Sunset,
  night: Moon,
};

const timeOfDayColors = {
  morning: 'text-amber-500',
  afternoon: 'text-orange-500',
  evening: 'text-purple-500',
  night: 'text-indigo-500',
};

const paceEmojis = {
  relaxed: '😌',
  productive: '💪',
  mixed: '⚖️',
};

export const RhythmEditorSheet: React.FC<RhythmEditorSheetProps> = ({
  open,
  onOpenChange,
  onSendMessage,
}) => {
  const { rhythm, editRhythm, hasCompletedRhythmOnboarding } = useLifeRhythm();
  const [editingSection, setEditingSection] = useState<'weekday' | 'weekend' | null>(null);

  const handleQuickEdit = (change: string) => {
    onOpenChange(false);
    if (onSendMessage) {
      onSendMessage(change);
    }
  };

  if (!hasCompletedRhythmOnboarding()) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-[50vh] rounded-t-3xl">
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Calendar className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-medium mb-2">No rhythm set yet</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Tell me about your typical week and I'll help you stay on track
            </p>
            <Button
              onClick={() => handleQuickEdit("Let's set up my routine")}
              className="rounded-full"
            >
              Set up my rhythm
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl overflow-hidden">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Your Weekly Rhythm
          </SheetTitle>
        </SheetHeader>

        <div className="overflow-y-auto h-[calc(100%-60px)] pb-8 space-y-6">
          {/* Weekday Pattern Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 rounded-2xl p-4 border border-emerald-500/20"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Coffee className="w-5 h-5 text-emerald-500" />
                <h3 className="font-medium">Weekdays</h3>
                <span className="text-xs text-muted-foreground">(Mon–Fri)</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingSection(editingSection === 'weekday' ? null : 'weekday')}
                className="h-8 w-8 p-0"
              >
                <Edit3 className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-3">
              {Object.entries(rhythm.weekdayPattern).map(([time, activity]) => {
                const Icon = timeOfDayIcons[time as keyof typeof timeOfDayIcons];
                const colorClass = timeOfDayColors[time as keyof typeof timeOfDayColors];
                
                return (
                  <div key={time} className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${colorClass}`} />
                    <span className="text-sm capitalize w-20">{time}</span>
                    <span className="text-sm text-muted-foreground capitalize">
                      → {activity}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Quick edit options */}
            <AnimatePresence>
              {editingSection === 'weekday' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 pt-4 border-t border-emerald-500/20"
                >
                  <p className="text-xs text-muted-foreground mb-3">Quick adjustments:</p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full text-xs"
                      onClick={() => handleQuickEdit("Make my mornings lighter")}
                    >
                      Lighter mornings
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full text-xs"
                      onClick={() => handleQuickEdit("Add gym to my evenings")}
                    >
                      Add gym
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full text-xs"
                      onClick={() => handleQuickEdit("Reduce my reminders")}
                    >
                      Fewer reminders
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Weekend Pattern Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 rounded-2xl p-4 border border-blue-500/20"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Wind className="w-5 h-5 text-blue-500" />
                <h3 className="font-medium">Weekends</h3>
                <span className="text-xs text-muted-foreground">(Sat–Sun)</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingSection(editingSection === 'weekend' ? null : 'weekend')}
                className="h-8 w-8 p-0"
              >
                <Edit3 className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-lg">{paceEmojis[rhythm.weekendPattern.pace]}</span>
                <span className="text-sm w-20">Pace</span>
                <span className="text-sm text-muted-foreground capitalize">
                  → {rhythm.weekendPattern.pace}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-lg">🎯</span>
                <span className="text-sm w-20">Focus</span>
                <span className="text-sm text-muted-foreground">
                  → {rhythm.weekendPattern.flexibility === 'high' ? 'Optional' : 'Moderate'}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-lg">👥</span>
                <span className="text-sm w-20">Social</span>
                <span className="text-sm text-muted-foreground">
                  → {rhythm.weekendPattern.social}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-lg">🔋</span>
                <span className="text-sm w-20">Recovery</span>
                <span className="text-sm text-muted-foreground">
                  → {rhythm.weekendPattern.recovery ? 'Priority' : 'Allowed'}
                </span>
              </div>
            </div>

            {/* Quick edit options */}
            <AnimatePresence>
              {editingSection === 'weekend' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 pt-4 border-t border-blue-500/20"
                >
                  <p className="text-xs text-muted-foreground mb-3">Quick adjustments:</p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full text-xs"
                      onClick={() => handleQuickEdit("Make weekends more productive")}
                    >
                      More productive
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full text-xs"
                      onClick={() => handleQuickEdit("Keep weekends free for rest")}
                    >
                      More rest
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Today's Adjustment Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-muted/30 rounded-2xl p-4 border border-border/50"
          >
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <span>⚡</span>
              Quick changes for today
            </h4>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                className="rounded-full text-xs"
                onClick={() => handleQuickEdit("Today is different, keep it light")}
              >
                Go light today
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="rounded-full text-xs"
                onClick={() => handleQuickEdit("Don't remind me today")}
              >
                No reminders today
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="rounded-full text-xs"
                onClick={() => handleQuickEdit("I want to be productive today")}
              >
                Productive mode
              </Button>
            </div>
          </motion.div>

          {/* Note */}
          <p className="text-xs text-center text-muted-foreground px-4">
            You can change these anytime by chatting with me 💬
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
};
