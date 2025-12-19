import React, { useState, useMemo } from 'react';
import { BarChart3, TrendingUp, Calendar, Target, Droplet, Brain, Flame, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useAura } from '@/contexts/AuraContext';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subWeeks, subMonths, eachDayOfInterval, isSameDay } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, PieChart, Pie, Cell } from 'recharts';

interface HabitCompletion {
  habit_id: string;
  completed_at: string;
  count: number;
}

interface MoodCheckin {
  mood: string;
  energy: string;
  stress: string;
  created_at: string;
}

interface HydrationLog {
  amount_ml: number;
  created_at: string;
}

const moodToScore: Record<string, number> = {
  'amazing': 5,
  'good': 4,
  'okay': 3,
  'low': 2,
  'terrible': 1,
};

const energyToScore: Record<string, number> = {
  'high': 3,
  'medium': 2,
  'low': 1,
};

const stressToScore: Record<string, number> = {
  'low': 1,
  'medium': 2,
  'high': 3,
};

const MOOD_COLORS = ['#22c55e', '#84cc16', '#eab308', '#f97316', '#ef4444'];

export const ProgressDashboardScreen: React.FC = () => {
  const { user } = useAuth();
  const [period, setPeriod] = useState<'week' | 'month'>('week');
  const [weekOffset, setWeekOffset] = useState(0);
  const [monthOffset, setMonthOffset] = useState(0);

  const dateRange = useMemo(() => {
    if (period === 'week') {
      const base = subWeeks(new Date(), weekOffset);
      return { start: startOfWeek(base, { weekStartsOn: 1 }), end: endOfWeek(base, { weekStartsOn: 1 }) };
    }
    const base = subMonths(new Date(), monthOffset);
    return { start: startOfMonth(base), end: endOfMonth(base) };
  }, [period, weekOffset, monthOffset]);

  // Fetch habit completions
  const { data: habitCompletions = [] } = useQuery({
    queryKey: ['habit-completions', user?.id, dateRange],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from('habit_completions')
        .select('*')
        .eq('user_id', user.id)
        .gte('completed_at', format(dateRange.start, 'yyyy-MM-dd'))
        .lte('completed_at', format(dateRange.end, 'yyyy-MM-dd'));
      return (data || []) as HabitCompletion[];
    },
    enabled: !!user,
  });

  // Fetch habits
  const { data: habits = [] } = useQuery({
    queryKey: ['habits', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', user.id);
      return data || [];
    },
    enabled: !!user,
  });

  // Fetch mood checkins
  const { data: moodCheckins = [] } = useQuery({
    queryKey: ['mood-checkins', user?.id, dateRange],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from('mood_checkins')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', dateRange.start.toISOString())
        .lte('created_at', dateRange.end.toISOString())
        .order('created_at', { ascending: true });
      return (data || []) as MoodCheckin[];
    },
    enabled: !!user,
  });

  // Fetch hydration logs
  const { data: hydrationLogs = [] } = useQuery({
    queryKey: ['hydration-logs', user?.id, dateRange],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from('hydration_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', dateRange.start.toISOString())
        .lte('created_at', dateRange.end.toISOString());
      return (data || []) as HydrationLog[];
    },
    enabled: !!user,
  });

  // Calculate habit completion rate
  const habitStats = useMemo(() => {
    const days = eachDayOfInterval({ start: dateRange.start, end: dateRange.end });
    const totalPossible = habits.length * days.length;
    const completed = habitCompletions.length;
    const rate = totalPossible > 0 ? Math.round((completed / totalPossible) * 100) : 0;
    
    // Daily completion data
    const dailyData = days.map(day => {
      const dayCompletions = habitCompletions.filter(hc => 
        isSameDay(new Date(hc.completed_at), day)
      );
      return {
        date: format(day, 'EEE'),
        completed: dayCompletions.length,
        total: habits.length,
        percentage: habits.length > 0 ? Math.round((dayCompletions.length / habits.length) * 100) : 0,
      };
    });

    return { totalPossible, completed, rate, dailyData };
  }, [habits, habitCompletions, dateRange]);

  // Calculate mood trends
  const moodStats = useMemo(() => {
    if (moodCheckins.length === 0) return { avgMood: 0, avgEnergy: 0, avgStress: 0, trend: [] };

    const avgMood = moodCheckins.reduce((sum, c) => sum + (moodToScore[c.mood] || 3), 0) / moodCheckins.length;
    const avgEnergy = moodCheckins.reduce((sum, c) => sum + (energyToScore[c.energy] || 2), 0) / moodCheckins.length;
    const avgStress = moodCheckins.reduce((sum, c) => sum + (stressToScore[c.stress] || 2), 0) / moodCheckins.length;

    const trend = moodCheckins.map(c => ({
      date: format(new Date(c.created_at), 'MMM d'),
      mood: moodToScore[c.mood] || 3,
      energy: energyToScore[c.energy] || 2,
      stress: stressToScore[c.stress] || 2,
    }));

    // Mood distribution
    const moodDist = Object.entries(
      moodCheckins.reduce((acc, c) => {
        acc[c.mood] = (acc[c.mood] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    ).map(([name, value]) => ({ name, value }));

    return { avgMood, avgEnergy, avgStress, trend, moodDist };
  }, [moodCheckins]);

  // Calculate hydration stats
  const hydrationStats = useMemo(() => {
    const totalMl = hydrationLogs.reduce((sum, log) => sum + log.amount_ml, 0);
    const days = eachDayOfInterval({ start: dateRange.start, end: dateRange.end });
    const avgDaily = days.length > 0 ? Math.round(totalMl / days.length) : 0;
    
    const dailyData = days.map(day => {
      const dayLogs = hydrationLogs.filter(log => 
        isSameDay(new Date(log.created_at), day)
      );
      const total = dayLogs.reduce((sum, log) => sum + log.amount_ml, 0);
      return {
        date: format(day, 'EEE'),
        amount: total,
        goal: 2000,
      };
    });

    return { totalMl, avgDaily, dailyData };
  }, [hydrationLogs, dateRange]);

  const navigatePeriod = (direction: 'prev' | 'next') => {
    if (period === 'week') {
      setWeekOffset(prev => direction === 'prev' ? prev + 1 : Math.max(0, prev - 1));
    } else {
      setMonthOffset(prev => direction === 'prev' ? prev + 1 : Math.max(0, prev - 1));
    }
  };

  return (
    <div className="h-full overflow-y-auto pb-24">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border/50 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-bold">Progress Dashboard</h1>
          </div>
          <TrendingUp className="w-5 h-5 text-muted-foreground" />
        </div>

        {/* Period Selector */}
        <div className="flex items-center justify-between">
          <Tabs value={period} onValueChange={(v) => setPeriod(v as 'week' | 'month')} className="w-full">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="week">Weekly</TabsTrigger>
              <TabsTrigger value="month">Monthly</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Date Navigation */}
        <div className="flex items-center justify-between mt-3">
          <Button variant="ghost" size="sm" onClick={() => navigatePeriod('prev')}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm font-medium">
            {format(dateRange.start, 'MMM d')} - {format(dateRange.end, 'MMM d, yyyy')}
          </span>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigatePeriod('next')}
            disabled={(period === 'week' && weekOffset === 0) || (period === 'month' && monthOffset === 0)}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Overview Cards */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="border-border/50">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground">Habits</span>
              </div>
              <p className="text-2xl font-bold text-primary">{habitStats.rate}%</p>
              <p className="text-xs text-muted-foreground">{habitStats.completed}/{habitStats.totalPossible} completed</p>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="w-4 h-4 text-purple-500" />
                <span className="text-xs text-muted-foreground">Avg Mood</span>
              </div>
              <p className="text-2xl font-bold text-purple-500">{moodStats.avgMood.toFixed(1)}/5</p>
              <p className="text-xs text-muted-foreground">{moodCheckins.length} check-ins</p>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-2">
                <Droplet className="w-4 h-4 text-cyan-500" />
                <span className="text-xs text-muted-foreground">Hydration</span>
              </div>
              <p className="text-2xl font-bold text-cyan-500">{(hydrationStats.avgDaily / 1000).toFixed(1)}L</p>
              <p className="text-xs text-muted-foreground">avg daily</p>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-2">
                <Flame className="w-4 h-4 text-orange-500" />
                <span className="text-xs text-muted-foreground">Streak</span>
              </div>
              <p className="text-2xl font-bold text-orange-500">{habitStats.dailyData.filter(d => d.percentage >= 80).length}</p>
              <p className="text-xs text-muted-foreground">productive days</p>
            </CardContent>
          </Card>
        </div>

        {/* Habit Completion Chart */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              Habit Completion Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={habitStats.dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="percentage" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Mood Trend Chart */}
        {moodStats.trend.length > 0 && (
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Brain className="w-4 h-4 text-purple-500" />
                Mood & Energy Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={moodStats.trend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" domain={[0, 5]} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="mood" stroke="#a855f7" strokeWidth={2} dot={{ fill: '#a855f7' }} />
                    <Line type="monotone" dataKey="energy" stroke="#22c55e" strokeWidth={2} dot={{ fill: '#22c55e' }} />
                    <Line type="monotone" dataKey="stress" stroke="#ef4444" strokeWidth={2} dot={{ fill: '#ef4444' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Hydration Chart */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Droplet className="w-4 h-4 text-cyan-500" />
              Daily Hydration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hydrationStats.dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [`${value}ml`, 'Amount']}
                  />
                  <Bar dataKey="amount" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="goal" fill="hsl(var(--muted))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Mood Distribution */}
        {moodStats.moodDist && moodStats.moodDist.length > 0 && (
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Mood Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={moodStats.moodDist}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {moodStats.moodDist.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={MOOD_COLORS[index % MOOD_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Summary */}
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="pt-4">
            <h3 className="font-semibold mb-2">📊 Period Summary</h3>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• Habit completion rate: <span className="text-foreground font-medium">{habitStats.rate}%</span></li>
              <li>• Average mood score: <span className="text-foreground font-medium">{moodStats.avgMood.toFixed(1)}/5</span></li>
              <li>• Total water intake: <span className="text-foreground font-medium">{(hydrationStats.totalMl / 1000).toFixed(1)}L</span></li>
              <li>• Mood check-ins: <span className="text-foreground font-medium">{moodCheckins.length}</span></li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
