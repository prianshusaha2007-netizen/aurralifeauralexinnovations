import React, { useState, useEffect, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  Brain,
  Sparkles,
  BarChart3,
  PieChart as PieChartIcon,
  Sun,
  Moon,
  Sunrise,
  Sunset,
  Lightbulb,
  Heart,
  Target,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  subMonths, 
  addMonths, 
  parseISO, 
  isWithinInterval,
  eachDayOfInterval,
  getDay,
  getHours
} from 'date-fns';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

interface MoodEntry {
  id: string;
  mood: string;
  energy: string;
  stress: string;
  notes?: string;
  created_at: string;
}

interface MonthlyMoodReportProps {
  onBack: () => void;
}

const moodColors: Record<string, string> = {
  happy: '#22c55e',
  calm: '#3b82f6',
  neutral: '#eab308',
  stressed: '#f97316',
  sad: '#a855f7',
  anxious: '#6b7280',
};

const moodScores: Record<string, number> = {
  happy: 5,
  calm: 4,
  neutral: 3,
  stressed: 2,
  sad: 1,
  anxious: 1,
};

const energyScores: Record<string, number> = { high: 3, medium: 2, low: 1 };
const stressScores: Record<string, number> = { low: 1, medium: 2, high: 3 };

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const MonthlyMoodReport: React.FC<MonthlyMoodReportProps> = ({ onBack }) => {
  const { toast } = useToast();
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date()));

  const monthEnd = endOfMonth(currentMonth);
  const isCurrentMonth = format(currentMonth, 'yyyy-MM') === format(new Date(), 'yyyy-MM');

  useEffect(() => {
    fetchMoodEntries();
  }, []);

  const fetchMoodEntries = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('mood_checkins')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      console.error('Error fetching mood entries:', error);
      toast({
        title: 'Error loading mood data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const monthEntries = useMemo(() => {
    return entries.filter(e => {
      const entryDate = parseISO(e.created_at);
      return isWithinInterval(entryDate, { start: currentMonth, end: monthEnd });
    });
  }, [entries, currentMonth, monthEnd]);

  // Calculate daily trend data
  const dailyTrendData = useMemo(() => {
    const days = eachDayOfInterval({ start: currentMonth, end: monthEnd });
    return days.map(day => {
      const dayEntries = monthEntries.filter(e => 
        format(parseISO(e.created_at), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
      );
      
      if (dayEntries.length === 0) {
        return { date: format(day, 'd'), mood: null, energy: null, stress: null };
      }

      const avgMood = dayEntries.reduce((sum, e) => sum + (moodScores[e.mood] || 3), 0) / dayEntries.length;
      const avgEnergy = dayEntries.reduce((sum, e) => sum + (energyScores[e.energy] || 2), 0) / dayEntries.length;
      const avgStress = dayEntries.reduce((sum, e) => sum + (stressScores[e.stress] || 2), 0) / dayEntries.length;

      return {
        date: format(day, 'd'),
        mood: Math.round(avgMood * 10) / 10,
        energy: Math.round(avgEnergy * 10) / 10,
        stress: Math.round(avgStress * 10) / 10,
      };
    });
  }, [monthEntries, currentMonth, monthEnd]);

  // Mood distribution for pie chart
  const moodDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    monthEntries.forEach(e => {
      counts[e.mood] = (counts[e.mood] || 0) + 1;
    });
    return Object.entries(counts).map(([mood, count]) => ({
      name: mood.charAt(0).toUpperCase() + mood.slice(1),
      value: count,
      color: moodColors[mood] || '#888',
    }));
  }, [monthEntries]);

  // Day of week analysis
  const dayOfWeekData = useMemo(() => {
    const dayStats: Record<number, { total: number; count: number }> = {};
    for (let i = 0; i < 7; i++) {
      dayStats[i] = { total: 0, count: 0 };
    }
    
    monthEntries.forEach(e => {
      const day = getDay(parseISO(e.created_at));
      dayStats[day].total += moodScores[e.mood] || 3;
      dayStats[day].count += 1;
    });

    return dayNames.map((name, i) => ({
      day: name,
      avgMood: dayStats[i].count > 0 
        ? Math.round((dayStats[i].total / dayStats[i].count) * 10) / 10 
        : 0,
      entries: dayStats[i].count,
    }));
  }, [monthEntries]);

  // Time of day analysis
  const timeOfDayData = useMemo(() => {
    const periods = [
      { name: 'Morning', icon: Sunrise, range: [5, 12], total: 0, count: 0 },
      { name: 'Afternoon', icon: Sun, range: [12, 17], total: 0, count: 0 },
      { name: 'Evening', icon: Sunset, range: [17, 21], total: 0, count: 0 },
      { name: 'Night', icon: Moon, range: [21, 5], total: 0, count: 0 },
    ];

    monthEntries.forEach(e => {
      const hour = getHours(parseISO(e.created_at));
      const period = periods.find(p => {
        if (p.range[0] < p.range[1]) {
          return hour >= p.range[0] && hour < p.range[1];
        }
        return hour >= p.range[0] || hour < p.range[1];
      });
      if (period) {
        period.total += moodScores[e.mood] || 3;
        period.count += 1;
      }
    });

    return periods.map(p => ({
      ...p,
      avgMood: p.count > 0 ? Math.round((p.total / p.count) * 10) / 10 : 0,
    }));
  }, [monthEntries]);

  // Calculate statistics and insights
  const monthStats = useMemo(() => {
    if (monthEntries.length === 0) {
      return {
        totalEntries: 0,
        avgMood: 0,
        avgEnergy: 0,
        avgStress: 0,
        trend: 'neutral',
        dominantMood: 'neutral',
        bestDay: null,
        worstDay: null,
        consistency: 0,
      };
    }

    const avgMood = monthEntries.reduce((sum, e) => sum + (moodScores[e.mood] || 3), 0) / monthEntries.length;
    const avgEnergy = monthEntries.reduce((sum, e) => sum + (energyScores[e.energy] || 2), 0) / monthEntries.length;
    const avgStress = monthEntries.reduce((sum, e) => sum + (stressScores[e.stress] || 2), 0) / monthEntries.length;

    // Calculate trend (first half vs second half)
    const midPoint = Math.floor(monthEntries.length / 2);
    const firstHalf = monthEntries.slice(0, midPoint);
    const secondHalf = monthEntries.slice(midPoint);
    const firstAvg = firstHalf.reduce((sum, e) => sum + (moodScores[e.mood] || 3), 0) / (firstHalf.length || 1);
    const secondAvg = secondHalf.reduce((sum, e) => sum + (moodScores[e.mood] || 3), 0) / (secondHalf.length || 1);
    const trend = secondAvg > firstAvg + 0.3 ? 'up' : secondAvg < firstAvg - 0.3 ? 'down' : 'stable';

    // Find dominant mood
    const moodCounts: Record<string, number> = {};
    monthEntries.forEach(e => {
      moodCounts[e.mood] = (moodCounts[e.mood] || 0) + 1;
    });
    const dominantMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'neutral';

    // Find best and worst days
    const dayGroups: Record<string, { total: number; count: number; date: string }> = {};
    monthEntries.forEach(e => {
      const dateKey = format(parseISO(e.created_at), 'yyyy-MM-dd');
      if (!dayGroups[dateKey]) {
        dayGroups[dateKey] = { total: 0, count: 0, date: dateKey };
      }
      dayGroups[dateKey].total += moodScores[e.mood] || 3;
      dayGroups[dateKey].count += 1;
    });

    const dayAverages = Object.values(dayGroups).map(d => ({
      date: d.date,
      avg: d.total / d.count,
    }));
    const bestDay = dayAverages.sort((a, b) => b.avg - a.avg)[0];
    const worstDay = dayAverages.sort((a, b) => a.avg - b.avg)[0];

    // Calculate consistency (days with entries / days in month)
    const daysInMonth = eachDayOfInterval({ start: currentMonth, end: monthEnd }).length;
    const daysWithEntries = new Set(monthEntries.map(e => format(parseISO(e.created_at), 'yyyy-MM-dd'))).size;
    const consistency = Math.round((daysWithEntries / daysInMonth) * 100);

    return {
      totalEntries: monthEntries.length,
      avgMood: Math.round(avgMood * 10) / 10,
      avgEnergy: Math.round(avgEnergy * 10) / 10,
      avgStress: Math.round(avgStress * 10) / 10,
      trend,
      dominantMood,
      bestDay: bestDay?.date ? format(parseISO(bestDay.date), 'MMM d') : null,
      worstDay: worstDay?.date && worstDay.avg < 3 ? format(parseISO(worstDay.date), 'MMM d') : null,
      consistency,
    };
  }, [monthEntries, currentMonth, monthEnd]);

  // Generate insights
  const insights = useMemo(() => {
    const insightsList: string[] = [];

    if (monthStats.totalEntries === 0) {
      return ['Start tracking your mood to receive personalized insights!'];
    }

    // Mood trend insight
    if (monthStats.trend === 'up') {
      insightsList.push('📈 Your mood improved throughout the month. Great progress!');
    } else if (monthStats.trend === 'down') {
      insightsList.push('📉 Your mood dipped later in the month. Consider what factors may have contributed.');
    } else {
      insightsList.push('📊 Your mood remained relatively stable this month.');
    }

    // Best day of week
    const bestDayOfWeek = dayOfWeekData.filter(d => d.entries > 0).sort((a, b) => b.avgMood - a.avgMood)[0];
    if (bestDayOfWeek && bestDayOfWeek.avgMood > 3.5) {
      insightsList.push(`🌟 ${bestDayOfWeek.day}s tend to be your happiest days.`);
    }

    // Time of day insight
    const bestTime = timeOfDayData.filter(t => t.count > 0).sort((a, b) => b.avgMood - a.avgMood)[0];
    if (bestTime && bestTime.avgMood > 3) {
      insightsList.push(`⏰ You typically feel best during the ${bestTime.name.toLowerCase()}.`);
    }

    // Energy-stress correlation
    if (monthStats.avgStress > 2.3 && monthStats.avgEnergy < 2) {
      insightsList.push('⚡ High stress with low energy detected. Prioritize rest and self-care.');
    }

    // Consistency insight
    if (monthStats.consistency >= 80) {
      insightsList.push('🎯 Excellent tracking consistency! Keep it up.');
    } else if (monthStats.consistency >= 50) {
      insightsList.push('📝 Good tracking habits. Try checking in daily for deeper insights.');
    } else {
      insightsList.push('💡 More frequent check-ins will help reveal clearer patterns.');
    }

    return insightsList;
  }, [monthStats, dayOfWeekData, timeOfDayData]);

  const goToPreviousMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const goToNextMonth = () => {
    const nextMonth = addMonths(currentMonth, 1);
    if (nextMonth <= startOfMonth(new Date())) {
      setCurrentMonth(nextMonth);
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <Brain className="w-8 h-8 text-primary" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto pb-24">
      {/* Header */}
      <div className="p-4 bg-gradient-to-b from-primary/10 to-transparent">
        <div className="flex items-center gap-2 mb-1">
          <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <BarChart3 className="w-6 h-6 text-primary" />
          <h1 className="text-xl font-bold">Monthly Report</h1>
        </div>
        <p className="text-sm text-muted-foreground ml-10">Deep dive into your emotional patterns</p>
      </div>

      <div className="p-4 space-y-4">
        {/* Month Navigation */}
        <Card className="border-border/50">
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="icon" onClick={goToPreviousMonth}>
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <div className="text-center">
                <p className="font-semibold text-lg">{format(currentMonth, 'MMMM yyyy')}</p>
                {isCurrentMonth && (
                  <span className="text-xs text-primary font-medium">Current Month</span>
                )}
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={goToNextMonth}
                disabled={isCurrentMonth}
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-2">
          <Card className="border-border/50">
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-bold text-primary">{monthStats.totalEntries}</div>
              <p className="text-[10px] text-muted-foreground">Check-ins</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-3 text-center">
              <div className="flex items-center justify-center gap-1">
                <span className="text-2xl font-bold">{monthStats.avgMood}</span>
                {monthStats.trend === 'up' && <TrendingUp className="w-4 h-4 text-green-500" />}
                {monthStats.trend === 'down' && <TrendingDown className="w-4 h-4 text-red-500" />}
                {monthStats.trend === 'stable' && <Minus className="w-4 h-4 text-yellow-500" />}
              </div>
              <p className="text-[10px] text-muted-foreground">Avg Mood</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-bold">{monthStats.avgEnergy}</div>
              <p className="text-[10px] text-muted-foreground">Avg Energy</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-bold">{monthStats.consistency}%</div>
              <p className="text-[10px] text-muted-foreground">Consistency</p>
            </CardContent>
          </Card>
        </div>

        {/* Mood Trend Chart */}
        {monthEntries.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  Daily Mood Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={dailyTrendData.filter(d => d.mood !== null)}>
                    <defs>
                      <linearGradient id="moodGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                    <YAxis domain={[1, 5]} stroke="hsl(var(--muted-foreground))" fontSize={10} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '12px'
                      }} 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="mood" 
                      stroke="hsl(var(--primary))" 
                      fill="url(#moodGradient)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Energy & Stress Comparison */}
        {monthEntries.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-500" />
                  Energy vs Stress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={dailyTrendData.filter(d => d.energy !== null)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                    <YAxis domain={[1, 3]} stroke="hsl(var(--muted-foreground))" fontSize={10} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '12px'
                      }} 
                    />
                    <Legend />
                    <Line type="monotone" dataKey="energy" stroke="#22c55e" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="stress" stroke="#ef4444" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Mood Distribution */}
        {moodDistribution.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <PieChartIcon className="w-4 h-4 text-primary" />
                  Mood Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <ResponsiveContainer width="50%" height={150}>
                    <PieChart>
                      <Pie
                        data={moodDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={35}
                        outerRadius={60}
                        dataKey="value"
                        paddingAngle={2}
                      >
                        {moodDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex-1 space-y-1.5">
                    {moodDistribution.map((item) => (
                      <div key={item.name} className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-xs flex-1">{item.name}</span>
                        <span className="text-xs font-medium">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Day of Week Analysis */}
        {monthEntries.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  Mood by Day of Week
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={dayOfWeekData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                    <YAxis domain={[0, 5]} stroke="hsl(var(--muted-foreground))" fontSize={10} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '12px'
                      }} 
                    />
                    <Bar dataKey="avgMood" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Time of Day Analysis */}
        {monthEntries.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Sun className="w-4 h-4 text-yellow-500" />
                  Mood by Time of Day
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-2">
                  {timeOfDayData.map((period) => {
                    const Icon = period.icon;
                    const moodLevel = period.avgMood >= 4 ? 'high' : period.avgMood >= 3 ? 'medium' : 'low';
                    return (
                      <div 
                        key={period.name}
                        className={cn(
                          'p-3 rounded-lg text-center',
                          moodLevel === 'high' ? 'bg-green-500/10' :
                          moodLevel === 'medium' ? 'bg-yellow-500/10' :
                          'bg-muted/30'
                        )}
                      >
                        <Icon className={cn(
                          'w-5 h-5 mx-auto mb-1',
                          moodLevel === 'high' ? 'text-green-500' :
                          moodLevel === 'medium' ? 'text-yellow-500' :
                          'text-muted-foreground'
                        )} />
                        <p className="text-xs font-medium">{period.name}</p>
                        <p className="text-lg font-bold">{period.avgMood || '-'}</p>
                        <p className="text-[10px] text-muted-foreground">{period.count} entries</p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* AI Insights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                AURRA's Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {insights.map((insight, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  className="flex items-start gap-3 p-3 rounded-lg bg-background/50"
                >
                  <Lightbulb className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <p className="text-sm text-muted-foreground">{insight}</p>
                </motion.div>
              ))}

              {/* Personalized Recommendation */}
              <div className="pt-3 border-t border-border/50">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-pink-500/10 shrink-0">
                    <Heart className="w-4 h-4 text-pink-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">Monthly Encouragement</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {monthStats.avgMood >= 4 
                        ? "You've had a wonderful month! Keep nurturing the habits that bring you joy. 🌟"
                        : monthStats.avgMood >= 3
                        ? "A balanced month with room for growth. You're on the right path. 💜"
                        : "This month had challenges, and that's okay. Every experience teaches us something. 🤗"
                      }
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {monthEntries.length === 0 && (
          <Card className="border-dashed border-2 border-border/50">
            <CardContent className="py-8 text-center">
              <BarChart3 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <h3 className="font-semibold mb-1">No data for this month</h3>
              <p className="text-sm text-muted-foreground">
                Check in daily to see detailed monthly reports.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
