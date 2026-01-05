/**
 * AURRA Weekly Wellness Summary
 * 
 * Shows burnout patterns, hydration stats, and focus time
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Heart, 
  Droplets, 
  Timer, 
  TrendingUp, 
  TrendingDown,
  Moon,
  Sun,
  AlertTriangle,
  Award,
  BarChart3,
  Calendar,
  Flame,
  ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useBurnoutDetection } from '@/hooks/useBurnoutDetection';
import { useFocusSessions } from '@/hooks/useFocusSessions';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, startOfWeek, endOfWeek } from 'date-fns';

interface WellnessScore {
  overall: number;
  hydration: number;
  focus: number;
  rest: number;
  trend: 'up' | 'down' | 'stable';
}

interface DayStats {
  date: Date;
  focusMinutes: number;
  hydrationMl: number;
  focusSessions: number;
}

export const WeeklyWellnessSummary: React.FC = () => {
  const { user } = useAuth();
  const { burnoutState, indicators } = useBurnoutDetection();
  const { getFocusSessions } = useFocusSessions();
  
  const [weeklyStats, setWeeklyStats] = useState<DayStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalFocusMinutes, setTotalFocusMinutes] = useState(0);
  const [totalHydrationMl, setTotalHydrationMl] = useState(0);
  const [wellnessScore, setWellnessScore] = useState<WellnessScore>({
    overall: 75,
    hydration: 70,
    focus: 80,
    rest: 75,
    trend: 'stable',
  });

  useEffect(() => {
    if (user) {
      fetchWeeklyData();
    }
  }, [user]);

  const fetchWeeklyData = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
      
      // Fetch focus sessions
      const focusSessions = await getFocusSessions(7);
      
      // Fetch hydration logs
      const { data: hydrationLogs } = await supabase
        .from('hydration_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', subDays(new Date(), 7).toISOString());

      // Build daily stats
      const dailyStats: DayStats[] = [];
      for (let i = 6; i >= 0; i--) {
        const date = subDays(new Date(), i);
        date.setHours(0, 0, 0, 0);
        const nextDay = new Date(date);
        nextDay.setDate(nextDay.getDate() + 1);

        const dayFocus = focusSessions.filter(s => {
          const sessionDate = new Date(s.created_at);
          return sessionDate >= date && sessionDate < nextDay;
        });

        const dayHydration = hydrationLogs?.filter(h => {
          const logDate = new Date(h.created_at);
          return logDate >= date && logDate < nextDay;
        }) || [];

        dailyStats.push({
          date,
          focusMinutes: dayFocus.reduce((sum, s) => sum + (s.duration_minutes || 0), 0),
          hydrationMl: dayHydration.reduce((sum, h) => sum + (h.amount_ml || 0), 0),
          focusSessions: dayFocus.length,
        });
      }

      setWeeklyStats(dailyStats);
      
      // Calculate totals
      const totalFocus = dailyStats.reduce((sum, d) => sum + d.focusMinutes, 0);
      const totalHydration = dailyStats.reduce((sum, d) => sum + d.hydrationMl, 0);
      setTotalFocusMinutes(totalFocus);
      setTotalHydrationMl(totalHydration);

      // Calculate wellness score
      calculateWellnessScore(dailyStats, totalFocus, totalHydration);
    } catch (error) {
      console.error('Error fetching weekly data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateWellnessScore = (stats: DayStats[], focus: number, hydration: number) => {
    // Hydration score (target: 2000ml x 7 = 14000ml/week)
    const hydrationScore = Math.min(100, (hydration / 14000) * 100);
    
    // Focus score (target: 120 min x 7 = 840 min/week)
    const focusScore = Math.min(100, (focus / 840) * 100);
    
    // Rest score based on burnout indicators
    const lateNightPenalty = Math.max(0, 100 - (indicators.lateNightUsage * 15));
    const heavyDaysPenalty = Math.max(0, 100 - (indicators.consecutiveHeavyDays * 20));
    const restScore = (lateNightPenalty + heavyDaysPenalty) / 2;
    
    // Overall score
    const overall = Math.round((hydrationScore + focusScore + restScore) / 3);
    
    // Trend (compare first half to second half of week)
    const firstHalf = stats.slice(0, 3);
    const secondHalf = stats.slice(4);
    const firstHalfAvg = firstHalf.reduce((sum, d) => sum + d.focusMinutes, 0) / 3;
    const secondHalfAvg = secondHalf.reduce((sum, d) => sum + d.focusMinutes, 0) / 3;
    
    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (secondHalfAvg > firstHalfAvg * 1.2) trend = 'up';
    else if (secondHalfAvg < firstHalfAvg * 0.8) trend = 'down';
    
    setWellnessScore({
      overall,
      hydration: Math.round(hydrationScore),
      focus: Math.round(focusScore),
      rest: Math.round(restScore),
      trend,
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-amber-500';
    return 'text-red-500';
  };

  const getScoreGradient = (score: number) => {
    if (score >= 80) return 'from-green-500 to-emerald-500';
    if (score >= 60) return 'from-amber-500 to-orange-500';
    return 'from-red-500 to-rose-500';
  };

  const getBurnoutLevelDisplay = () => {
    switch (burnoutState.level) {
      case 'healthy':
        return { label: 'Healthy', color: 'text-green-500', bg: 'bg-green-500/10' };
      case 'watch':
        return { label: 'Monitoring', color: 'text-amber-500', bg: 'bg-amber-500/10' };
      case 'concern':
        return { label: 'Take Care', color: 'text-orange-500', bg: 'bg-orange-500/10' };
      case 'rest_needed':
        return { label: 'Rest Needed', color: 'text-red-500', bg: 'bg-red-500/10' };
    }
  };

  const burnoutDisplay = getBurnoutLevelDisplay();
  const maxFocusDay = Math.max(...weeklyStats.map(d => d.focusMinutes), 1);
  const maxHydrationDay = Math.max(...weeklyStats.map(d => d.hydrationMl), 1);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Weekly Wellness</h2>
            <p className="text-sm text-muted-foreground">
              {format(subDays(new Date(), 6), 'MMM d')} — {format(new Date(), 'MMM d')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {wellnessScore.trend === 'up' && <TrendingUp className="w-5 h-5 text-green-500" />}
            {wellnessScore.trend === 'down' && <TrendingDown className="w-5 h-5 text-red-500" />}
          </div>
        </div>

        {/* Overall Score Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className={cn(
            'overflow-hidden border-0',
            `bg-gradient-to-br ${getScoreGradient(wellnessScore.overall)}`
          )}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/70 text-sm font-medium">Wellness Score</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-bold text-white">{wellnessScore.overall}</span>
                    <span className="text-white/70">/100</span>
                  </div>
                </div>
                <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center">
                  <Heart className="w-10 h-10 text-white" />
                </div>
              </div>

              {/* Sub-scores */}
              <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-white/20">
                <div className="text-center">
                  <Droplets className="w-5 h-5 mx-auto text-white/70 mb-1" />
                  <p className="text-white font-bold">{wellnessScore.hydration}%</p>
                  <p className="text-white/60 text-xs">Hydration</p>
                </div>
                <div className="text-center">
                  <Timer className="w-5 h-5 mx-auto text-white/70 mb-1" />
                  <p className="text-white font-bold">{wellnessScore.focus}%</p>
                  <p className="text-white/60 text-xs">Focus</p>
                </div>
                <div className="text-center">
                  <Moon className="w-5 h-5 mx-auto text-white/70 mb-1" />
                  <p className="text-white font-bold">{wellnessScore.rest}%</p>
                  <p className="text-white/60 text-xs">Rest</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Burnout Status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Energy Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className={cn('px-3 py-1.5 rounded-full text-sm font-medium', burnoutDisplay.bg, burnoutDisplay.color)}>
                {burnoutDisplay.label}
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">{indicators.lateNightUsage} late nights</p>
                <p className="text-xs text-muted-foreground">{indicators.consecutiveHeavyDays} heavy days</p>
              </div>
            </div>
            
            {burnoutState.suggestedAction && (
              <div className="mt-3 p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
                💡 {burnoutState.suggestedAction}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Focus Stats */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Timer className="w-4 h-4" />
              Focus Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-3xl font-bold">{Math.floor(totalFocusMinutes / 60)}</span>
              <span className="text-muted-foreground">hrs</span>
              <span className="text-xl font-semibold">{totalFocusMinutes % 60}</span>
              <span className="text-muted-foreground">min</span>
            </div>
            
            {/* Daily bars */}
            <div className="flex gap-1.5 h-20">
              {weeklyStats.map((day, i) => (
                <div key={i} className="flex-1 flex flex-col justify-end">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${(day.focusMinutes / maxFocusDay) * 100}%` }}
                    transition={{ delay: i * 0.05 }}
                    className={cn(
                      'rounded-t-sm min-h-[4px]',
                      day.focusMinutes > 60 ? 'bg-primary' : 'bg-primary/40'
                    )}
                  />
                  <p className="text-[10px] text-muted-foreground text-center mt-1">
                    {format(day.date, 'EEE').charAt(0)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Hydration Stats */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Droplets className="w-4 h-4 text-cyan-500" />
              Hydration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-3xl font-bold">{(totalHydrationMl / 1000).toFixed(1)}</span>
              <span className="text-muted-foreground">liters this week</span>
            </div>
            
            {/* Daily bars */}
            <div className="flex gap-1.5 h-20">
              {weeklyStats.map((day, i) => (
                <div key={i} className="flex-1 flex flex-col justify-end">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${(day.hydrationMl / maxHydrationDay) * 100}%` }}
                    transition={{ delay: i * 0.05 }}
                    className={cn(
                      'rounded-t-sm min-h-[4px]',
                      day.hydrationMl >= 2000 ? 'bg-cyan-500' : 'bg-cyan-500/40'
                    )}
                  />
                  <p className="text-[10px] text-muted-foreground text-center mt-1">
                    {format(day.date, 'EEE').charAt(0)}
                  </p>
                </div>
              ))}
            </div>
            
            <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
              <div className="w-3 h-3 rounded-sm bg-cyan-500" />
              <span>Goal reached (2L)</span>
            </div>
          </CardContent>
        </Card>

        {/* Weekly Insights */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Award className="w-4 h-4" />
              Weekly Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {wellnessScore.focus >= 80 && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-green-500/10">
                <Flame className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Great focus week!</p>
                  <p className="text-xs text-muted-foreground">You hit your focus goals consistently</p>
                </div>
              </div>
            )}
            
            {indicators.lateNightUsage > 2 && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/10">
                <Moon className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Late nights detected</p>
                  <p className="text-xs text-muted-foreground">Try winding down earlier for better rest</p>
                </div>
              </div>
            )}
            
            {wellnessScore.hydration < 60 && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-cyan-500/10">
                <Droplets className="w-5 h-5 text-cyan-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Drink more water</p>
                  <p className="text-xs text-muted-foreground">You're below your hydration target</p>
                </div>
              </div>
            )}
            
            {wellnessScore.overall >= 75 && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/10">
                <Heart className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">You're doing well!</p>
                  <p className="text-xs text-muted-foreground">Keep up the good balance</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  );
};
