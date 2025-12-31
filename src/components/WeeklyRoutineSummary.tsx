import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, RotateCcw, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useSmartRoutine } from '@/hooks/useSmartRoutine';
import { AuraOrb } from './AuraOrb';

interface WeeklyRoutineSummaryProps {
  onDismiss: () => void;
  onTweakRoutine: () => void;
}

export const WeeklyRoutineSummary: React.FC<WeeklyRoutineSummaryProps> = ({
  onDismiss,
  onTweakRoutine,
}) => {
  const { getWeeklySummary, getActivityConfig, settings } = useSmartRoutine();
  const summary = getWeeklySummary();

  const mostConsistentConfig = summary.mostConsistent 
    ? getActivityConfig(summary.mostConsistent.type)
    : null;

  const needsAttentionConfig = summary.needsAttention
    ? getActivityConfig(summary.needsAttention.type)
    : null;

  // No blocks = no summary
  if (settings.blocks.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-3xl border border-border/50 p-6 space-y-4"
    >
      <div className="flex items-start gap-3">
        <div className="flex justify-center">
          <AuraOrb size="sm" />
        </div>
        <div className="flex-1">
          <p className="text-sm text-muted-foreground mb-1">Weekly heads-up</p>
        </div>
      </div>

      {/* Insight message - neutral, encouraging */}
      <div className="bg-muted/30 rounded-2xl p-4 space-y-3">
        {summary.mostConsistent && mostConsistentConfig && (
          <div className="flex items-center gap-3">
            <div className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center',
              'bg-gradient-to-br text-white',
              mostConsistentConfig.color
            )}>
              {mostConsistentConfig.icon}
            </div>
            <p className="text-sm flex-1">
              You were most consistent with{' '}
              <span className="font-medium">{summary.mostConsistent.name}</span>{' '}
              this week.
            </p>
            <TrendingUp className="w-4 h-4 text-green-500" />
          </div>
        )}

        {summary.needsAttention && needsAttentionConfig && summary.needsAttention.skipCount > 0 && (
          <div className="flex items-center gap-3">
            <div className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center opacity-60',
              'bg-gradient-to-br text-white',
              needsAttentionConfig.color
            )}>
              {needsAttentionConfig.icon}
            </div>
            <p className="text-sm flex-1 text-muted-foreground">
              <span className="font-medium text-foreground">{summary.needsAttention.name}</span>{' '}
              slipped a bit. No stress.
            </p>
          </div>
        )}

        {!summary.mostConsistent && !summary.needsAttention && (
          <p className="text-sm text-muted-foreground">
            Just getting started — your patterns will show here soon.
          </p>
        )}
      </div>

      {/* Actions - no pressure */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={onTweakRoutine}
          className="flex-1 rounded-full"
        >
          <Settings2 className="w-4 h-4 mr-2" />
          Tweak routine
        </Button>
        <Button
          variant="ghost"
          onClick={onDismiss}
          className="flex-1 rounded-full text-muted-foreground"
        >
          Keep it same
        </Button>
      </div>

      {/* No scores, no red marks, no anxiety */}
      <p className="text-xs text-center text-muted-foreground pt-2">
        This is just a gentle overview. No pressure.
      </p>
    </motion.div>
  );
};

// Hook to determine if we should show weekly summary
export const useShouldShowWeeklySummary = () => {
  const SUMMARY_KEY = 'aurra-weekly-summary-shown';
  
  const checkShouldShow = (): boolean => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    
    // Show on Sunday (0) or Monday (1)
    if (dayOfWeek !== 0 && dayOfWeek !== 1) return false;

    const lastShown = localStorage.getItem(SUMMARY_KEY);
    if (!lastShown) return true;

    const lastShownDate = new Date(lastShown);
    const weekDiff = Math.floor((now.getTime() - lastShownDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
    
    return weekDiff >= 1;
  };

  const markAsShown = () => {
    localStorage.setItem(SUMMARY_KEY, new Date().toISOString());
  };

  return { shouldShow: checkShouldShow(), markAsShown };
};
