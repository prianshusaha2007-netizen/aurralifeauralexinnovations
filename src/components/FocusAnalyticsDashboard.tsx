import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Clock, Target, TrendingUp, AlertTriangle, 
  Calendar, Flame, Brain, ChevronRight 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface FocusSessionResult {
  type: string;
  goal?: string;
  duration: number;
  completed: 'yes' | 'almost' | 'not_today';
  struggledCount: number;
  timestamp: string;
}

interface FocusAnalyticsDashboardProps {
  className?: string;
}

export const FocusAnalyticsDashboard: React.FC<FocusAnalyticsDashboardProps> = ({ className }) => {
  // Load focus session results from localStorage
  const sessions = useMemo(() => {
    const stored = localStorage.getItem('aurra-focus-results');
    if (!stored) return [];
    try {
      return JSON.parse(stored) as FocusSessionResult[];
    } catch {
      return [];
    }
  }, []);

  // Calculate analytics
  const analytics = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const todaySessions = sessions.filter(s => new Date(s.timestamp) >= today);
    const weekSessions = sessions.filter(s => new Date(s.timestamp) >= weekAgo);
    
    // Daily stats
    const todayTotalMinutes = todaySessions.reduce((sum, s) => sum + s.duration, 0);
    const todayCompleted = todaySessions.filter(s => s.completed === 'yes').length;
    const todayTotal = todaySessions.length;
    
    // Weekly stats
    const weekTotalMinutes = weekSessions.reduce((sum, s) => sum + s.duration, 0);
    const weekCompleted = weekSessions.filter(s => s.completed === 'yes').length;
    const weekTotal = weekSessions.length;
    
    // Struggle patterns
    const totalStruggles = weekSessions.reduce((sum, s) => sum + s.struggledCount, 0);
    const avgStrugglesPerSession = weekTotal > 0 ? totalStruggles / weekTotal : 0;
    
    // Most productive focus type
    const typeStats: Record<string, { count: number; completed: number; minutes: number }> = {};
    weekSessions.forEach(s => {
      const type = s.type || 'quiet';
      if (!typeStats[type]) typeStats[type] = { count: 0, completed: 0, minutes: 0 };
      typeStats[type].count++;
      typeStats[type].minutes += s.duration;
      if (s.completed === 'yes') typeStats[type].completed++;
    });
    
    const bestType = Object.entries(typeStats)
      .sort((a, b) => (b[1].completed / b[1].count) - (a[1].completed / a[1].count))[0];
    
    // Calculate streak (consecutive days with focus sessions)
    const daySet = new Set<string>();
    sessions.forEach(s => {
      const date = new Date(s.timestamp);
      daySet.add(`${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`);
    });
    
    let streak = 0;
    let checkDate = new Date(today);
    while (true) {
      const key = `${checkDate.getFullYear()}-${checkDate.getMonth()}-${checkDate.getDate()}`;
      if (daySet.has(key)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    
    // Daily goal progress (target: 90 minutes)
    const dailyGoal = 90;
    const dailyProgress = Math.min(100, (todayTotalMinutes / dailyGoal) * 100);
    
    return {
      today: {
        totalMinutes: todayTotalMinutes,
        completed: todayCompleted,
        total: todayTotal,
        completionRate: todayTotal > 0 ? (todayCompleted / todayTotal) * 100 : 0,
      },
      week: {
        totalMinutes: weekTotalMinutes,
        totalHours: Math.round(weekTotalMinutes / 60 * 10) / 10,
        completed: weekCompleted,
        total: weekTotal,
        completionRate: weekTotal > 0 ? (weekCompleted / weekTotal) * 100 : 0,
        avgMinutesPerDay: Math.round(weekTotalMinutes / 7),
      },
      struggles: {
        total: totalStruggles,
        avgPerSession: Math.round(avgStrugglesPerSession * 10) / 10,
      },
      bestType: bestType ? {
        type: bestType[0],
        completionRate: Math.round((bestType[1].completed / bestType[1].count) * 100),
      } : null,
      streak,
      dailyProgress,
      dailyGoal,
    };
  }, [sessions]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'study': return '📚';
      case 'coding': return '💻';
      case 'work': return '💼';
      case 'creative': return '🎨';
      case 'quiet': return '🔇';
      default: return '🎯';
    }
  };

  if (sessions.length === 0) {
    return (
      <Card className={cn("bg-card/50 border-border/30", className)}>
        <CardContent className="py-8 text-center">
          <Brain className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground">No focus sessions yet</p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            Say "let's focus" to start your first session
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Daily Progress Card */}
      <Card className="bg-gradient-to-br from-violet-500/10 to-purple-500/10 border-violet-500/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Target className="w-4 h-4 text-violet-500" />
            Today's Focus
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-between mb-2">
            <div>
              <span className="text-3xl font-bold">{analytics.today.totalMinutes}</span>
              <span className="text-sm text-muted-foreground ml-1">min</span>
            </div>
            <span className="text-xs text-muted-foreground">
              Goal: {analytics.dailyGoal} min
            </span>
          </div>
          <Progress value={analytics.dailyProgress} className="h-2" />
          <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
            <span>{analytics.today.completed}/{analytics.today.total} sessions completed</span>
            {analytics.streak > 0 && (
              <span className="flex items-center gap-1 text-orange-500">
                <Flame className="w-3 h-3" />
                {analytics.streak} day streak
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Weekly Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-card/50 border-border/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Clock className="w-4 h-4" />
              <span className="text-xs">This Week</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold">{analytics.week.totalHours}</span>
              <span className="text-xs text-muted-foreground">hours</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              ~{analytics.week.avgMinutesPerDay} min/day
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs">Completion</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold">{Math.round(analytics.week.completionRate)}</span>
              <span className="text-xs text-muted-foreground">%</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {analytics.week.completed}/{analytics.week.total} sessions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Best Focus Type */}
      {analytics.bestType && (
        <Card className="bg-card/50 border-border/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{getTypeIcon(analytics.bestType.type)}</span>
                <div>
                  <p className="text-sm font-medium capitalize">{analytics.bestType.type}</p>
                  <p className="text-xs text-muted-foreground">Your most productive focus type</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold text-green-500">{analytics.bestType.completionRate}%</span>
                <p className="text-xs text-muted-foreground">completion</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Struggle Insights */}
      {analytics.struggles.total > 0 && (
        <Card className="bg-amber-500/5 border-amber-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-medium">Struggle Patterns</span>
            </div>
            <p className="text-xs text-muted-foreground">
              You've shown signs of struggle {analytics.struggles.total} times this week
              (avg {analytics.struggles.avgPerSession}/session).
              {analytics.struggles.avgPerSession > 1 
                ? " Consider shorter sessions or more breaks."
                : " You're handling challenges well!"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Compact version for inline display
export const CompactFocusStats: React.FC<{ className?: string }> = ({ className }) => {
  const sessions = useMemo(() => {
    const stored = localStorage.getItem('aurra-focus-results');
    if (!stored) return [];
    try {
      return JSON.parse(stored) as FocusSessionResult[];
    } catch {
      return [];
    }
  }, []);

  const todayMinutes = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return sessions
      .filter(s => new Date(s.timestamp) >= today)
      .reduce((sum, s) => sum + s.duration, 0);
  }, [sessions]);

  if (sessions.length === 0) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn("flex items-center gap-2 text-xs text-muted-foreground", className)}
    >
      <Clock className="w-3 h-3" />
      <span>{todayMinutes} min focused today</span>
    </motion.div>
  );
};
