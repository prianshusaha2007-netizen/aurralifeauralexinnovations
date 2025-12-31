import React from 'react';
import { Heart, Sparkles, Star, Crown, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRelationshipEvolution, RelationshipPhase } from '@/hooks/useRelationshipEvolution';
import { useAura } from '@/contexts/AuraContext';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';

const PHASE_CONFIG: Record<RelationshipPhase, {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  description: string;
  nextPhaseHint?: string;
}> = {
  introduction: {
    label: 'Introduction',
    icon: Heart,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    description: 'Getting to know each other',
    nextPhaseHint: 'Keep chatting daily to build familiarity',
  },
  familiarity: {
    label: 'Familiarity',
    icon: Sparkles,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10',
    description: 'Building trust and patterns',
    nextPhaseHint: 'Share how you feel to deepen our connection',
  },
  trusted: {
    label: 'Trusted Presence',
    icon: Star,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    description: 'A reliable companion',
    nextPhaseHint: 'Continue our journey together',
  },
  companion: {
    label: 'Life Companion',
    icon: Crown,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    description: 'Deep, lasting connection',
  },
};

const PHASE_ORDER: RelationshipPhase[] = ['introduction', 'familiarity', 'trusted', 'companion'];

export const RelationshipProgress: React.FC = () => {
  const { engagement, isLoading } = useRelationshipEvolution();
  const { userProfile } = useAura();

  const aiName = userProfile.aiName || 'AURRA';

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-4 space-y-4">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (!engagement) {
    return null;
  }

  const currentPhase = engagement.relationshipPhase;
  const phaseConfig = PHASE_CONFIG[currentPhase];
  const PhaseIcon = phaseConfig.icon;
  
  const currentPhaseIndex = PHASE_ORDER.indexOf(currentPhase);
  const progressPercent = ((currentPhaseIndex + 1) / PHASE_ORDER.length) * 100;

  const daysSinceStart = Math.floor(
    (Date.now() - engagement.firstInteractionAt.getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="rounded-2xl border border-border bg-card p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          Journey with {aiName}
        </h3>
        <span className="text-xs text-muted-foreground">
          {daysSinceStart} {daysSinceStart === 1 ? 'day' : 'days'} together
        </span>
      </div>

      {/* Current Phase */}
      <div className={cn(
        "rounded-xl p-3 flex items-center gap-3",
        phaseConfig.bgColor
      )}>
        <div className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center",
          phaseConfig.bgColor
        )}>
          <PhaseIcon className={cn("w-5 h-5", phaseConfig.color)} />
        </div>
        <div className="flex-1">
          <div className={cn("font-medium", phaseConfig.color)}>
            {phaseConfig.label}
          </div>
          <div className="text-xs text-muted-foreground">
            {phaseConfig.description}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Relationship Growth</span>
          <span>{Math.round(progressPercent)}%</span>
        </div>
        <Progress value={progressPercent} className="h-2" />
        
        {/* Phase Indicators */}
        <div className="flex justify-between mt-2">
          {PHASE_ORDER.map((phase, index) => {
            const config = PHASE_CONFIG[phase];
            const Icon = config.icon;
            const isActive = index <= currentPhaseIndex;
            const isCurrent = phase === currentPhase;
            
            return (
              <div 
                key={phase}
                className={cn(
                  "flex flex-col items-center gap-1",
                  isActive ? "opacity-100" : "opacity-40"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                  isCurrent ? config.bgColor : isActive ? "bg-muted" : "bg-muted/50",
                  isCurrent && "ring-2 ring-offset-2 ring-offset-background",
                  isCurrent && config.color.replace('text-', 'ring-')
                )}>
                  <Icon className={cn(
                    "w-4 h-4",
                    isActive ? config.color : "text-muted-foreground"
                  )} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border">
        <div className="text-center">
          <div className="text-lg font-semibold text-foreground">
            {engagement.totalMessages}
          </div>
          <div className="text-[10px] text-muted-foreground">Messages</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-foreground">
            {engagement.moodShares}
          </div>
          <div className="text-[10px] text-muted-foreground">Mood Shares</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-foreground">
            {engagement.totalDaysActive}
          </div>
          <div className="text-[10px] text-muted-foreground">Active Days</div>
        </div>
      </div>

      {/* Next Phase Hint */}
      {phaseConfig.nextPhaseHint && currentPhase !== 'companion' && (
        <div className="text-xs text-muted-foreground text-center pt-2 border-t border-border">
          💡 {phaseConfig.nextPhaseHint}
        </div>
      )}
    </div>
  );
};