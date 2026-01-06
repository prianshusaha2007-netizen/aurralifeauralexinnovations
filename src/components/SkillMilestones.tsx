import React from 'react';
import { motion } from 'framer-motion';
import { 
  Star, 
  Trophy, 
  Crown, 
  Flame, 
  Target,
  Medal,
  Sparkles,
  Check,
  Lock
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { SkillType, UserSkill } from '@/hooks/useSkillsProgress';

interface Milestone {
  id: string;
  type: 'sessions' | 'streak' | 'hours';
  target: number;
  title: string;
  description: string;
  icon: React.ElementType;
  gradient: string;
  reward: string;
}

const MILESTONES: Milestone[] = [
  // Session milestones
  { id: 'first-session', type: 'sessions', target: 1, title: 'First Step', description: 'Complete your first session', icon: Star, gradient: 'from-amber-400 to-yellow-500', reward: '⭐ Starter' },
  { id: 'sessions-5', type: 'sessions', target: 5, title: 'Getting Started', description: 'Complete 5 sessions', icon: Target, gradient: 'from-blue-400 to-cyan-500', reward: '🎯 Focused' },
  { id: 'sessions-10', type: 'sessions', target: 10, title: 'Double Digits', description: 'Complete 10 sessions', icon: Medal, gradient: 'from-emerald-400 to-green-500', reward: '🏅 Dedicated' },
  { id: 'sessions-25', type: 'sessions', target: 25, title: 'Quarter Century', description: 'Complete 25 sessions', icon: Trophy, gradient: 'from-purple-400 to-violet-500', reward: '🏆 Committed' },
  { id: 'sessions-50', type: 'sessions', target: 50, title: 'Halfway Legend', description: 'Complete 50 sessions', icon: Crown, gradient: 'from-orange-400 to-red-500', reward: '👑 Master' },
  { id: 'sessions-100', type: 'sessions', target: 100, title: 'Century Champion', description: 'Complete 100 sessions', icon: Sparkles, gradient: 'from-pink-400 to-rose-500', reward: '💎 Legend' },
  
  // Streak milestones
  { id: 'streak-3', type: 'streak', target: 3, title: 'Momentum', description: '3 day streak', icon: Flame, gradient: 'from-orange-400 to-amber-500', reward: '🔥 On Fire' },
  { id: 'streak-7', type: 'streak', target: 7, title: 'Week Warrior', description: '7 day streak', icon: Flame, gradient: 'from-red-400 to-orange-500', reward: '🔥🔥 Unstoppable' },
  { id: 'streak-14', type: 'streak', target: 14, title: 'Two Week Strong', description: '14 day streak', icon: Flame, gradient: 'from-rose-400 to-red-500', reward: '💪 Powerhouse' },
  { id: 'streak-30', type: 'streak', target: 30, title: 'Monthly Master', description: '30 day streak', icon: Crown, gradient: 'from-purple-400 to-pink-500', reward: '👑 Royalty' },
];

interface SkillMilestonesProps {
  skill: UserSkill;
  className?: string;
}

export const SkillMilestones: React.FC<SkillMilestonesProps> = ({ skill, className }) => {
  const getProgress = (milestone: Milestone): number => {
    switch (milestone.type) {
      case 'sessions':
        return Math.min(100, (skill.totalSessions / milestone.target) * 100);
      case 'streak':
        return Math.min(100, (skill.currentStreak / milestone.target) * 100);
      default:
        return 0;
    }
  };

  const isUnlocked = (milestone: Milestone): boolean => {
    return getProgress(milestone) >= 100;
  };

  const getCurrentValue = (milestone: Milestone): number => {
    switch (milestone.type) {
      case 'sessions':
        return skill.totalSessions;
      case 'streak':
        return skill.currentStreak;
      default:
        return 0;
    }
  };

  // Get next milestone for each type
  const nextSessionMilestone = MILESTONES
    .filter(m => m.type === 'sessions' && !isUnlocked(m))
    .sort((a, b) => a.target - b.target)[0];

  const nextStreakMilestone = MILESTONES
    .filter(m => m.type === 'streak' && !isUnlocked(m))
    .sort((a, b) => a.target - b.target)[0];

  const unlockedMilestones = MILESTONES.filter(m => isUnlocked(m));

  return (
    <div className={cn("space-y-4", className)}>
      {/* Next Milestones */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground">Next Milestones</h3>
        
        <div className="grid gap-3">
          {nextSessionMilestone && (
            <MilestoneCard 
              milestone={nextSessionMilestone}
              current={getCurrentValue(nextSessionMilestone)}
              progress={getProgress(nextSessionMilestone)}
            />
          )}
          
          {nextStreakMilestone && (
            <MilestoneCard 
              milestone={nextStreakMilestone}
              current={getCurrentValue(nextStreakMilestone)}
              progress={getProgress(nextStreakMilestone)}
            />
          )}
        </div>
      </div>

      {/* Earned Badges */}
      {unlockedMilestones.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">Earned Badges</h3>
          <div className="flex flex-wrap gap-2">
            {unlockedMilestones.map((milestone) => (
              <Badge 
                key={milestone.id}
                variant="secondary"
                className={cn(
                  "bg-gradient-to-r text-white border-0",
                  milestone.gradient
                )}
              >
                {milestone.reward}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

interface MilestoneCardProps {
  milestone: Milestone;
  current: number;
  progress: number;
}

const MilestoneCard: React.FC<MilestoneCardProps> = ({ milestone, current, progress }) => {
  const Icon = milestone.icon;
  const isComplete = progress >= 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className={cn(
        "overflow-hidden transition-all",
        isComplete && "ring-2 ring-primary"
      )}>
        <CardContent className="p-3">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-xl bg-gradient-to-br",
              milestone.gradient
            )}>
              {isComplete ? (
                <Check className="h-4 w-4 text-white" />
              ) : (
                <Icon className="h-4 w-4 text-white" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium truncate">{milestone.title}</span>
                <span className="text-xs text-muted-foreground">
                  {current}/{milestone.target}
                </span>
              </div>
              <Progress value={progress} className="h-1.5" />
              <p className="text-xs text-muted-foreground mt-1">{milestone.description}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Compact version for dashboard
interface SkillProgressBadgesProps {
  skill: UserSkill;
  showNext?: boolean;
  className?: string;
}

export const SkillProgressBadges: React.FC<SkillProgressBadgesProps> = ({ 
  skill, 
  showNext = true,
  className 
}) => {
  const getProgress = (milestone: Milestone): number => {
    switch (milestone.type) {
      case 'sessions':
        return Math.min(100, (skill.totalSessions / milestone.target) * 100);
      case 'streak':
        return Math.min(100, (skill.currentStreak / milestone.target) * 100);
      default:
        return 0;
    }
  };

  const unlockedMilestones = MILESTONES.filter(m => getProgress(m) >= 100);
  const nextMilestone = MILESTONES
    .filter(m => getProgress(m) < 100)
    .sort((a, b) => getProgress(b) - getProgress(a))[0];

  if (unlockedMilestones.length === 0 && !showNext) return null;

  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {unlockedMilestones.slice(-3).map((milestone) => (
        <Badge 
          key={milestone.id}
          variant="secondary"
          className="text-[10px] px-1.5 py-0"
        >
          {milestone.reward}
        </Badge>
      ))}
      
      {showNext && nextMilestone && (
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <Lock className="h-2.5 w-2.5" />
          <span>{Math.round(getProgress(nextMilestone))}% to {nextMilestone.reward}</span>
        </div>
      )}
    </div>
  );
};

export { MILESTONES };
