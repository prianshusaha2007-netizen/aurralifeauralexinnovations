import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Zap, Brain, Target, TrendingUp, Calendar } from 'lucide-react';
import { RetentionPhase, StressState, DominantPersona } from '@/hooks/useUserJourney';
import { cn } from '@/lib/utils';

interface JourneyStatusBadgeProps {
  daysSinceFirstUse: number;
  retentionPhase: RetentionPhase;
  stressState: StressState;
  dominantPersona: DominantPersona;
  consecutiveActiveDays: number;
  className?: string;
}

const phaseConfig: Record<RetentionPhase, { label: string; color: string; icon: typeof Heart }> = {
  safety: { label: 'Getting to know you', color: 'text-emerald-500', icon: Heart },
  value: { label: 'Finding your rhythm', color: 'text-blue-500', icon: Zap },
  habit: { label: 'Building habits', color: 'text-purple-500', icon: Target },
  bond: { label: 'Growing together', color: 'text-pink-500', icon: Brain },
  dependence: { label: 'Your thinking partner', color: 'text-amber-500', icon: TrendingUp },
};

const stressConfig: Record<StressState, { label: string; color: string }> = {
  calm: { label: 'Calm', color: 'bg-emerald-500/20 text-emerald-600' },
  busy: { label: 'Busy', color: 'bg-amber-500/20 text-amber-600' },
  stressed: { label: 'Stressed', color: 'bg-orange-500/20 text-orange-600' },
  burnout: { label: 'Rest mode', color: 'bg-rose-500/20 text-rose-600' },
  recovery: { label: 'Recovering', color: 'bg-blue-500/20 text-blue-600' },
};

export const JourneyStatusBadge: React.FC<JourneyStatusBadgeProps> = ({
  daysSinceFirstUse,
  retentionPhase,
  stressState,
  dominantPersona,
  consecutiveActiveDays,
  className,
}) => {
  const phase = phaseConfig[retentionPhase];
  const stress = stressConfig[stressState];
  const PhaseIcon = phase.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('flex items-center gap-3 p-3 rounded-2xl bg-card/50 border border-border/30', className)}
    >
      {/* Days streak */}
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10">
        <Calendar className="w-3.5 h-3.5 text-primary" />
        <span className="text-xs font-medium text-primary">
          Day {daysSinceFirstUse + 1}
        </span>
      </div>

      {/* Phase indicator */}
      <div className={cn('flex items-center gap-1.5', phase.color)}>
        <PhaseIcon className="w-3.5 h-3.5" />
        <span className="text-xs font-medium">{phase.label}</span>
      </div>

      {/* Stress state (only show if not calm) */}
      {stressState !== 'calm' && (
        <div className={cn('px-2 py-0.5 rounded-full text-xs font-medium', stress.color)}>
          {stress.label}
        </div>
      )}

      {/* Streak badge */}
      {consecutiveActiveDays >= 3 && (
        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 text-xs font-medium">
          🔥 {consecutiveActiveDays}
        </div>
      )}
    </motion.div>
  );
};

// Compact version for header
export const CompactJourneyBadge: React.FC<{
  daysSinceFirstUse: number;
  stressState: StressState;
}> = ({ daysSinceFirstUse, stressState }) => {
  const stress = stressConfig[stressState];
  
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-muted-foreground">
        Day {daysSinceFirstUse + 1}
      </span>
      {stressState !== 'calm' && (
        <span className={cn('px-1.5 py-0.5 rounded text-[9px] font-medium', stress.color)}>
          {stress.label}
        </span>
      )}
    </div>
  );
};
