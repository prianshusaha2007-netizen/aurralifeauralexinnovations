import React, { useState, useEffect } from 'react';
import { BarChart3, Flame, TrendingUp, Calendar, Award } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface HabitStats {
  habitId: string;
  habitName: string;
  habitIcon: string;
  currentStreak: number;
  longestStreak: number;
  completionRate: number;
  completedDays: number;
  totalDays: number;
}

interface WeeklyData {
  day: string;
  date: string;
  completed: number;
  total: number;
}

export const HabitAnalytics: React.FC = () => {
  const [habitStats, setHabitStats] = useState<HabitStats[]>([]);
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchAnalytics();
    }
  }, [user]);

  const fetchAnalytics = async () => {
    try {
      // Fetch habits
      const { data: habits, error: habitsError } = await supabase
        .from('habits')
        .select('*');

      if (habitsError) throw habitsError;

      // Fetch all completions for the past 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

      const { data: completions, error: completionsError } = await supabase
        .from('habit_completions')
        .select('*')
        .gte('completed_at', thirtyDaysAgoStr)
        .order('completed_at', { ascending: false });

      if (completionsError) throw completionsError;

      // Calculate stats for each habit
      const stats: HabitStats[] = (habits || []).map((habit: any) => {
        const habitCompletions = (completions || []).filter(
          (c: any) => c.habit_id === habit.id
        );

        // Calculate completion rate (last 30 days)
        const completedDays = habitCompletions.length;
        const totalDays = 30;
        const completionRate = Math.round((completedDays / totalDays) * 100);

        // Calculate current streak
        let currentStreak = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let i = 0; i < 100; i++) {
          const checkDate = new Date(today);
          checkDate.setDate(checkDate.getDate() - i);
          const dateStr = checkDate.toISOString().split('T')[0];

          if (habitCompletions.some((c: any) => c.completed_at === dateStr)) {
            currentStreak++;
          } else if (i > 0) {
            break;
          }
        }

        // Calculate longest streak
        let longestStreak = 0;
        let tempStreak = 0;
        const sortedCompletions = [...habitCompletions].sort(
          (a: any, b: any) => new Date(a.completed_at).getTime() - new Date(b.completed_at).getTime()
        );

        for (let i = 0; i < sortedCompletions.length; i++) {
          if (i === 0) {
            tempStreak = 1;
          } else {
            const prevDate = new Date(sortedCompletions[i - 1].completed_at);
            const currDate = new Date(sortedCompletions[i].completed_at);
            const diffDays = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));

            if (diffDays === 1) {
              tempStreak++;
            } else {
              tempStreak = 1;
            }
          }
          longestStreak = Math.max(longestStreak, tempStreak);
        }

        return {
          habitId: habit.id,
          habitName: habit.name,
          habitIcon: habit.icon,
          currentStreak,
          longestStreak,
          completionRate,
          completedDays,
          totalDays,
        };
      });

      setHabitStats(stats);

      // Calculate weekly data
      const weekData: WeeklyData[] = [];
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const dayCompletions = (completions || []).filter(
          (c: any) => c.completed_at === dateStr
        );

        weekData.push({
          day: days[date.getDay()],
          date: dateStr,
          completed: dayCompletions.length,
          total: habits?.length || 0,
        });
      }

      setWeeklyData(weekData);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const totalCompletions = habitStats.reduce((sum, h) => sum + h.completedDays, 0);
  const avgCompletionRate = habitStats.length > 0
    ? Math.round(habitStats.reduce((sum, h) => sum + h.completionRate, 0) / habitStats.length)
    : 0;
  const bestStreak = Math.max(...habitStats.map(h => h.longestStreak), 0);

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Loading analytics...</div>;
  }

  if (habitStats.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>No habits to analyze yet. Create some habits first!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4 text-center bg-gradient-to-br from-primary/10 to-primary/5">
          <Calendar className="w-5 h-5 mx-auto mb-1 text-primary" />
          <p className="text-2xl font-bold">{totalCompletions}</p>
          <p className="text-xs text-muted-foreground">Completions</p>
        </Card>
        <Card className="p-4 text-center bg-gradient-to-br from-accent/10 to-accent/5">
          <TrendingUp className="w-5 h-5 mx-auto mb-1 text-accent" />
          <p className="text-2xl font-bold">{avgCompletionRate}%</p>
          <p className="text-xs text-muted-foreground">Avg Rate</p>
        </Card>
        <Card className="p-4 text-center bg-gradient-to-br from-orange-500/10 to-orange-500/5">
          <Award className="w-5 h-5 mx-auto mb-1 text-orange-500" />
          <p className="text-2xl font-bold">{bestStreak}</p>
          <p className="text-xs text-muted-foreground">Best Streak</p>
        </Card>
      </div>

      {/* Weekly Chart */}
      <Card className="p-4">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <BarChart3 className="w-4 h-4" />
          This Week
        </h3>
        <div className="flex items-end justify-between gap-2 h-32">
          {weeklyData.map((day, index) => {
            const percentage = day.total > 0 ? (day.completed / day.total) * 100 : 0;
            const isToday = index === weeklyData.length - 1;

            return (
              <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                <motion.div
                  className={cn(
                    'w-full rounded-t-lg transition-colors',
                    isToday ? 'bg-primary' : 'bg-muted-foreground/30'
                  )}
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max(percentage, 5)}%` }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                />
                <span className={cn(
                  'text-xs',
                  isToday ? 'font-semibold text-primary' : 'text-muted-foreground'
                )}>
                  {day.day}
                </span>
                <span className="text-xs text-muted-foreground">
                  {day.completed}/{day.total}
                </span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Individual Habit Stats */}
      <div className="space-y-3">
        <h3 className="font-semibold flex items-center gap-2">
          <Flame className="w-4 h-4" />
          Habit Breakdown
        </h3>
        {habitStats.map((habit) => (
          <Card key={habit.habitId} className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">{habit.habitIcon}</span>
              <div className="flex-1">
                <p className="font-medium">{habit.habitName}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Flame className="w-3 h-3 text-orange-500" />
                    {habit.currentStreak} day streak
                  </span>
                  <span>•</span>
                  <span>Best: {habit.longestStreak} days</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold">{habit.completionRate}%</p>
                <p className="text-xs text-muted-foreground">30-day rate</p>
              </div>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${habit.completionRate}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
