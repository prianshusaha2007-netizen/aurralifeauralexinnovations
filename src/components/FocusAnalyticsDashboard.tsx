import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Clock, Brain } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
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

// Gentle pattern memory — no scores, no streaks, no productivity metrics
export const FocusAnalyticsDashboard: React.FC<FocusAnalyticsDashboardProps> = ({ className }) => {
  const sessions = useMemo(() => {
    const stored = localStorage.getItem('aurra-focus-results');
    if (!stored) return [];
    try {
      return JSON.parse(stored) as FocusSessionResult[];
    } catch {
      return [];
    }
  }, []);

  const patterns = useMemo(() => {
    if (sessions.length < 3) return null;

    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentSessions = sessions.filter(s => new Date(s.timestamp) >= weekAgo);

    // Find preferred time of day
    const hourCounts: Record<string, number> = { morning: 0, afternoon: 0, evening: 0, night: 0 };
    recentSessions.forEach(s => {
      const hour = new Date(s.timestamp).getHours();
      if (hour >= 5 && hour < 12) hourCounts.morning++;
      else if (hour >= 12 && hour < 17) hourCounts.afternoon++;
      else if (hour >= 17 && hour < 21) hourCounts.evening++;
      else hourCounts.night++;
    });
    const bestTime = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0];

    // Average duration preference
    const avgDuration = recentSessions.length > 0
      ? Math.round(recentSessions.reduce((sum, s) => sum + s.duration, 0) / recentSessions.length)
      : 25;

    // Most common type
    const typeCounts: Record<string, number> = {};
    recentSessions.forEach(s => {
      const t = s.type || 'quiet';
      typeCounts[t] = (typeCounts[t] || 0) + 1;
    });
    const favoriteType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0];

    return {
      bestTime: bestTime && bestTime[1] > 0 ? bestTime[0] : null,
      avgDuration,
      favoriteType: favoriteType ? favoriteType[0] : null,
      sessionCount: recentSessions.length,
    };
  }, [sessions]);

  if (sessions.length === 0) {
    return (
      <Card className={cn("bg-card/50 border-border/30", className)}>
        <CardContent className="py-8 text-center">
          <Brain className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground">No focus sessions yet</p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            Say "I need to focus" whenever you're ready
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!patterns) {
    return (
      <Card className={cn("bg-card/50 border-border/30", className)}>
        <CardContent className="py-6 text-center">
          <p className="text-sm text-muted-foreground">
            Still learning your patterns. A few more sessions and I'll know your rhythm.
          </p>
        </CardContent>
      </Card>
    );
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'study': return 'studying';
      case 'coding': return 'coding';
      case 'work': return 'working';
      case 'creative': return 'creating';
      case 'gym': return 'working out';
      case 'quiet': return 'quiet focus';
      default: return 'focusing';
    }
  };

  return (
    <Card className={cn("bg-card/50 border-border/30", className)}>
      <CardContent className="p-4 space-y-3">
        <p className="text-sm text-muted-foreground">What I've noticed:</p>
        <div className="space-y-2 text-sm text-foreground">
          {patterns.bestTime && (
            <p>You tend to focus best in the <span className="font-medium">{patterns.bestTime}</span>.</p>
          )}
          {patterns.avgDuration && (
            <p>Your sweet spot seems to be around <span className="font-medium">~{patterns.avgDuration} minutes</span>.</p>
          )}
          {patterns.favoriteType && (
            <p>Lately you've been {getTypeLabel(patterns.favoriteType)} the most.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Compact version — gentle, no metrics
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

  if (sessions.length === 0) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn("flex items-center gap-2 text-xs text-muted-foreground", className)}
    >
      <Clock className="w-3 h-3" />
      <span>Focusing together</span>
    </motion.div>
  );
};
