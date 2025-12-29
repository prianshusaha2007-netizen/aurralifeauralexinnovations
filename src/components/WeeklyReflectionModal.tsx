import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, TrendingUp, TrendingDown, Minus, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface WeeklyStats {
  focusBlocksCompleted: number;
  moodTrend: string;
  averageMood: string;
}

interface WeeklyReflectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (reflection: {
    overall_feeling: string;
    highlights?: string;
    challenges?: string;
    gratitude?: string;
    next_week_intention?: string;
  }) => Promise<boolean>;
  stats: WeeklyStats | null;
  userName?: string;
}

const FEELINGS = [
  { emoji: '😌', label: 'Peaceful', value: 'peaceful' },
  { emoji: '😊', label: 'Good', value: 'good' },
  { emoji: '💪', label: 'Productive', value: 'productive' },
  { emoji: '😐', label: 'Okay', value: 'okay' },
  { emoji: '😔', label: 'Tough', value: 'tough' },
  { emoji: '🌀', label: 'Chaotic', value: 'chaotic' },
];

export const WeeklyReflectionModal: React.FC<WeeklyReflectionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  stats,
  userName = 'there'
}) => {
  const [step, setStep] = useState(1);
  const [selectedFeeling, setSelectedFeeling] = useState('');
  const [highlights, setHighlights] = useState('');
  const [gratitude, setGratitude] = useState('');
  const [nextWeekIntention, setNextWeekIntention] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!selectedFeeling) return;
    
    setIsSaving(true);
    const success = await onSave({
      overall_feeling: selectedFeeling,
      highlights: highlights.trim() || undefined,
      gratitude: gratitude.trim() || undefined,
      next_week_intention: nextWeekIntention.trim() || undefined
    });
    
    setIsSaving(false);
    
    if (success) {
      toast.success('Reflection saved 🌟');
      onClose();
    } else {
      toast.error('Could not save reflection');
    }
  };

  const getMoodTrendIcon = () => {
    switch (stats?.moodTrend) {
      case 'improving': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'declining': return <TrendingDown className="w-4 h-4 text-amber-500" />;
      default: return <Minus className="w-4 h-4 text-muted-foreground" />;
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="bg-card border border-border rounded-3xl shadow-xl max-w-md w-full overflow-hidden"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
        >
          {/* Header */}
          <div className="relative bg-gradient-to-br from-primary/10 to-accent/10 px-6 py-5">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-3 right-3 h-8 w-8 rounded-full"
              onClick={onClose}
            >
              <X className="w-4 h-4" />
            </Button>
            
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium text-primary">Weekly Reflection</span>
            </div>
            <h2 className="text-xl font-semibold text-foreground">
              Hey {userName}, how was your week?
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Take a moment to look back — no pressure, just awareness.
            </p>
          </div>

          {/* Stats Summary */}
          {stats && (
            <div className="px-6 py-4 border-b border-border/50">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  <span className="text-muted-foreground">
                    <span className="font-medium text-foreground">{stats.focusBlocksCompleted}</span> focus blocks done
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {getMoodTrendIcon()}
                  <span className="text-muted-foreground capitalize">
                    {stats.averageMood} week
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Content */}
          <div className="px-6 py-5 space-y-5">
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <p className="text-sm text-foreground font-medium">
                  Overall, how did this week feel?
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {FEELINGS.map((feeling) => (
                    <button
                      key={feeling.value}
                      onClick={() => setSelectedFeeling(feeling.value)}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${
                        selectedFeeling === feeling.value
                          ? 'border-primary bg-primary/10'
                          : 'border-border/50 hover:border-primary/50 hover:bg-accent/30'
                      }`}
                    >
                      <span className="text-2xl">{feeling.emoji}</span>
                      <span className="text-xs text-muted-foreground">{feeling.label}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <div>
                  <label className="text-sm font-medium text-foreground block mb-2">
                    What went well? ✨
                  </label>
                  <Textarea
                    value={highlights}
                    onChange={(e) => setHighlights(e.target.value)}
                    placeholder="A small win, a good conversation, a moment of peace..."
                    className="resize-none bg-background/50"
                    rows={2}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium text-foreground block mb-2">
                    One thing you're grateful for
                  </label>
                  <Textarea
                    value={gratitude}
                    onChange={(e) => setGratitude(e.target.value)}
                    placeholder="It can be small..."
                    className="resize-none bg-background/50"
                    rows={2}
                  />
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <div>
                  <label className="text-sm font-medium text-foreground block mb-2">
                    One intention for next week 🌱
                  </label>
                  <Textarea
                    value={nextWeekIntention}
                    onChange={(e) => setNextWeekIntention(e.target.value)}
                    placeholder="Something gentle you want to focus on..."
                    className="resize-none bg-background/50"
                    rows={3}
                  />
                </div>
              </motion.div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-muted/30 flex items-center justify-between">
            <div className="flex gap-1">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    s === step ? 'bg-primary' : s < step ? 'bg-primary/50' : 'bg-border'
                  }`}
                />
              ))}
            </div>
            
            <div className="flex gap-2">
              {step > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setStep(step - 1)}
                >
                  Back
                </Button>
              )}
              
              {step < 3 ? (
                <Button
                  size="sm"
                  onClick={() => setStep(step + 1)}
                  disabled={step === 1 && !selectedFeeling}
                  className="rounded-full px-6"
                >
                  Continue
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={isSaving || !selectedFeeling}
                  className="rounded-full px-6"
                >
                  {isSaving ? 'Saving...' : 'Complete'}
                </Button>
              )}
            </div>
          </div>
          
          {/* Skip option */}
          <div className="px-6 pb-4 text-center">
            <button
              onClick={onClose}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Skip for now
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
