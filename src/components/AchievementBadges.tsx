import React, { useState, useEffect } from 'react';
import { Award, Trophy, Flame, Droplets, Brain, Star, Target, Zap, Heart, Crown } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface Achievement {
  id: string;
  achievement_type: string;
  achievement_name: string;
  description: string;
  icon: string;
  earned_at: string;
}

interface AchievementDefinition {
  type: string;
  name: string;
  description: string;
  icon: string;
  requirement: string;
  checkFn: (stats: UserStats) => boolean;
}

interface UserStats {
  habitStreak: number;
  hydrationStreak: number;
  moodLogs: number;
  totalDaysActive: number;
}

const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  {
    type: 'first_checkin',
    name: 'First Steps',
    description: 'Complete your first mood check-in',
    icon: '🌱',
    requirement: '1 mood check-in',
    checkFn: (stats) => stats.moodLogs >= 1
  },
  {
    type: 'habit_streak_3',
    name: 'Habit Builder',
    description: 'Maintain a 3-day habit streak',
    icon: '🔥',
    requirement: '3-day streak',
    checkFn: (stats) => stats.habitStreak >= 3
  },
  {
    type: 'habit_streak_7',
    name: 'Week Warrior',
    description: 'Maintain a 7-day habit streak',
    icon: '⚡',
    requirement: '7-day streak',
    checkFn: (stats) => stats.habitStreak >= 7
  },
  {
    type: 'habit_streak_30',
    name: 'Monthly Master',
    description: 'Maintain a 30-day habit streak',
    icon: '👑',
    requirement: '30-day streak',
    checkFn: (stats) => stats.habitStreak >= 30
  },
  {
    type: 'hydration_hero',
    name: 'Hydration Hero',
    description: 'Stay hydrated for 7 days straight',
    icon: '💧',
    requirement: '7-day hydration streak',
    checkFn: (stats) => stats.hydrationStreak >= 7
  },
  {
    type: 'mood_master',
    name: 'Self-Aware Champion',
    description: 'Log 30 mood check-ins',
    icon: '🧠',
    requirement: '30 mood logs',
    checkFn: (stats) => stats.moodLogs >= 30
  },
  {
    type: 'early_bird',
    name: 'Early Bird',
    description: 'Active for 14 days total',
    icon: '🌅',
    requirement: '14 days active',
    checkFn: (stats) => stats.totalDaysActive >= 14
  },
  {
    type: 'dedicated_user',
    name: 'Dedicated User',
    description: 'Active for 30 days total',
    icon: '⭐',
    requirement: '30 days active',
    checkFn: (stats) => stats.totalDaysActive >= 30
  }
];

export const AchievementBadges: React.FC = () => {
  const { user } = useAuth();
  const [earnedAchievements, setEarnedAchievements] = useState<Achievement[]>([]);
  const [userStats, setUserStats] = useState<UserStats>({
    habitStreak: 0,
    hydrationStreak: 0,
    moodLogs: 0,
    totalDaysActive: 0
  });

  useEffect(() => {
    if (user) {
      fetchAchievements();
      fetchStats();
    }
  }, [user]);

  const fetchAchievements = async () => {
    const { data } = await supabase
      .from('achievements')
      .select('*')
      .eq('user_id', user?.id);
    
    if (data) setEarnedAchievements(data);
  };

  const fetchStats = async () => {
    try {
      const [habitsRes, hydrationRes, moodRes] = await Promise.all([
        supabase.from('habit_completions').select('completed_at').eq('user_id', user?.id),
        supabase.from('hydration_logs').select('created_at').eq('user_id', user?.id),
        supabase.from('mood_checkins').select('created_at').eq('user_id', user?.id)
      ]);

      const habitDates = habitsRes.data?.map(h => h.completed_at.split('T')[0]) || [];
      const hydrationDates = hydrationRes.data?.map(h => h.created_at.split('T')[0]) || [];
      const moodLogs = moodRes.data?.length || 0;

      // Calculate streaks
      const habitStreak = calculateStreak(habitDates);
      const hydrationStreak = calculateStreak(hydrationDates);
      
      // Calculate total active days
      const allDates = new Set([...habitDates, ...hydrationDates, ...(moodRes.data?.map(m => m.created_at.split('T')[0]) || [])]);
      
      const stats = {
        habitStreak,
        hydrationStreak,
        moodLogs,
        totalDaysActive: allDates.size
      };
      
      setUserStats(stats);
      
      // Check for new achievements
      checkAndAwardAchievements(stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const calculateStreak = (dates: string[]): number => {
    if (dates.length === 0) return 0;
    const uniqueDates = [...new Set(dates)].sort().reverse();
    let streak = 0;
    
    for (let i = 0; i < uniqueDates.length; i++) {
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() - i);
      const expected = expectedDate.toISOString().split('T')[0];
      
      if (uniqueDates.includes(expected)) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  };

  const checkAndAwardAchievements = async (stats: UserStats) => {
    const earnedTypes = earnedAchievements.map(a => a.achievement_type);
    
    for (const def of ACHIEVEMENT_DEFINITIONS) {
      if (!earnedTypes.includes(def.type) && def.checkFn(stats)) {
        // Award this achievement
        const { error } = await supabase.from('achievements').insert({
          user_id: user?.id,
          achievement_type: def.type,
          achievement_name: def.name,
          description: def.description,
          icon: def.icon
        });

        if (!error) {
          toast.success(`🎉 Achievement Unlocked: ${def.name}!`, {
            description: def.description,
            duration: 5000
          });
          fetchAchievements();
        }
      }
    }
  };

  const isEarned = (type: string) => earnedAchievements.some(a => a.achievement_type === type);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Award className="w-4 h-4" />
          Badges ({earnedAchievements.length})
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Achievement Badges
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3">
          {ACHIEVEMENT_DEFINITIONS.map((def) => {
            const earned = isEarned(def.type);
            return (
              <Card 
                key={def.type}
                className={`p-3 text-center transition-all ${
                  earned 
                    ? 'bg-primary/10 border-primary/30' 
                    : 'opacity-50 grayscale'
                }`}
              >
                <div className="text-3xl mb-2">{def.icon}</div>
                <p className="font-medium text-sm">{def.name}</p>
                <p className="text-xs text-muted-foreground mt-1">{def.requirement}</p>
                {earned && (
                  <Badge variant="secondary" className="mt-2 text-xs">
                    ✓ Earned
                  </Badge>
                )}
              </Card>
            );
          })}
        </div>

        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
          <p className="text-sm font-medium text-center">
            {earnedAchievements.length}/{ACHIEVEMENT_DEFINITIONS.length} Achievements Unlocked
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
