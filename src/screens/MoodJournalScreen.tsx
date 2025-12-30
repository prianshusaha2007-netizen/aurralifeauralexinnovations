import React, { useState, useEffect } from 'react';
import { 
  BookHeart, 
  TrendingUp, 
  Calendar,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Smile,
  Meh,
  Frown,
  Wind,
  Flame,
  CloudRain,
  Brain,
  Lightbulb,
  Heart,
  Target
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format, startOfWeek, endOfWeek, subWeeks, addWeeks, isWithinInterval, parseISO } from 'date-fns';

interface MoodEntry {
  id: string;
  mood: string;
  energy: string;
  stress: string;
  notes?: string;
  created_at: string;
}

interface WeeklyInsight {
  dominantMood: string;
  averageEnergy: string;
  averageStress: string;
  moodPattern: string;
  suggestion: string;
  encouragement: string;
  streakDays: number;
}

const moodConfig: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  happy: { icon: Smile, color: 'text-green-500', bg: 'bg-green-500/10', label: 'Happy' },
  calm: { icon: Wind, color: 'text-blue-500', bg: 'bg-blue-500/10', label: 'Calm' },
  neutral: { icon: Meh, color: 'text-yellow-500', bg: 'bg-yellow-500/10', label: 'Neutral' },
  stressed: { icon: Flame, color: 'text-orange-500', bg: 'bg-orange-500/10', label: 'Stressed' },
  sad: { icon: Frown, color: 'text-purple-500', bg: 'bg-purple-500/10', label: 'Sad' },
  anxious: { icon: CloudRain, color: 'text-gray-500', bg: 'bg-gray-500/10', label: 'Anxious' },
};

const getMoodScore = (mood: string): number => {
  const scores: Record<string, number> = {
    happy: 5,
    calm: 4,
    neutral: 3,
    stressed: 2,
    sad: 1,
    anxious: 1,
  };
  return scores[mood] || 3;
};

const getEnergyScore = (energy: string): number => {
  const scores: Record<string, number> = { high: 3, medium: 2, low: 1 };
  return scores[energy] || 2;
};

const getStressScore = (stress: string): number => {
  const scores: Record<string, number> = { low: 1, medium: 2, high: 3 };
  return scores[stress] || 2;
};

const generateWeeklyInsight = (entries: MoodEntry[]): WeeklyInsight => {
  if (entries.length === 0) {
    return {
      dominantMood: 'neutral',
      averageEnergy: 'medium',
      averageStress: 'medium',
      moodPattern: 'No data available for this week.',
      suggestion: 'Start tracking your mood to receive personalized insights!',
      encouragement: 'Every journey begins with a single step. 💜',
      streakDays: 0,
    };
  }

  // Calculate dominant mood
  const moodCounts: Record<string, number> = {};
  entries.forEach(e => {
    moodCounts[e.mood] = (moodCounts[e.mood] || 0) + 1;
  });
  const dominantMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0][0];

  // Calculate averages
  const avgEnergy = entries.reduce((sum, e) => sum + getEnergyScore(e.energy), 0) / entries.length;
  const avgStress = entries.reduce((sum, e) => sum + getStressScore(e.stress), 0) / entries.length;
  const avgMoodScore = entries.reduce((sum, e) => sum + getMoodScore(e.mood), 0) / entries.length;

  const averageEnergy = avgEnergy >= 2.5 ? 'high' : avgEnergy >= 1.5 ? 'medium' : 'low';
  const averageStress = avgStress >= 2.5 ? 'high' : avgStress >= 1.5 ? 'medium' : 'low';

  // Detect patterns
  let moodPattern = '';
  let suggestion = '';
  let encouragement = '';

  if (avgMoodScore >= 4) {
    moodPattern = 'You\'ve had a wonderful week! Your emotional state has been consistently positive.';
    suggestion = 'Keep doing what you\'re doing. Maybe share some of this positivity with others?';
    encouragement = 'You\'re thriving! 🌟';
  } else if (avgMoodScore >= 3) {
    moodPattern = 'Your week has been balanced with a mix of emotions. That\'s completely normal!';
    suggestion = 'Consider noting what activities brought you the most joy this week.';
    encouragement = 'You\'re doing great at staying present. 💪';
  } else if (avgStress >= 2.5) {
    moodPattern = 'This week seems to have been stressful. Your emotional patterns show some tension.';
    suggestion = 'Try incorporating small breaks and breathing exercises into your routine.';
    encouragement = 'Remember, this too shall pass. You\'ve got this. 🤗';
  } else {
    moodPattern = 'This week had some challenging moments. It\'s okay to have tough times.';
    suggestion = 'Be gentle with yourself. Consider reaching out to someone you trust.';
    encouragement = 'Every storm runs out of rain. Keep going. 💜';
  }

  // Check energy patterns
  if (avgEnergy < 1.5) {
    suggestion += ' Your energy has been low—prioritize rest and self-care.';
  }

  return {
    dominantMood,
    averageEnergy,
    averageStress,
    moodPattern,
    suggestion,
    encouragement,
    streakDays: entries.length,
  };
};

export const MoodJournalScreen: React.FC = () => {
  const { toast } = useToast();
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentWeekStart, setCurrentWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [weeklyInsight, setWeeklyInsight] = useState<WeeklyInsight | null>(null);

  const currentWeekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 });

  useEffect(() => {
    fetchMoodEntries();
  }, []);

  useEffect(() => {
    const weekEntries = entries.filter(e => {
      const entryDate = parseISO(e.created_at);
      return isWithinInterval(entryDate, { start: currentWeekStart, end: currentWeekEnd });
    });
    setWeeklyInsight(generateWeeklyInsight(weekEntries));
  }, [entries, currentWeekStart, currentWeekEnd]);

  const fetchMoodEntries = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('mood_checkins')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      console.error('Error fetching mood entries:', error);
      toast({
        title: 'Error loading mood data',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const goToPreviousWeek = () => setCurrentWeekStart(subWeeks(currentWeekStart, 1));
  const goToNextWeek = () => {
    const nextWeek = addWeeks(currentWeekStart, 1);
    if (nextWeek <= startOfWeek(new Date(), { weekStartsOn: 1 })) {
      setCurrentWeekStart(nextWeek);
    }
  };

  const isCurrentWeek = format(currentWeekStart, 'yyyy-ww') === format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-ww');

  const weekEntries = entries.filter(e => {
    const entryDate = parseISO(e.created_at);
    return isWithinInterval(entryDate, { start: currentWeekStart, end: currentWeekEnd });
  });

  // Get daily mood for the week
  const daysOfWeek = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(currentWeekStart);
    day.setDate(day.getDate() + i);
    return day;
  });

  const getDayMood = (date: Date): MoodEntry | undefined => {
    return weekEntries.find(e => {
      const entryDate = parseISO(e.created_at);
      return format(entryDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
    });
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
          <BookHeart className="w-6 h-6 text-primary" />
          <h1 className="text-xl font-bold">Mood Journal</h1>
        </div>
        <p className="text-sm text-muted-foreground">Track your emotional patterns over time</p>
      </div>

      <div className="p-4 space-y-4">
        {/* Week Navigation */}
        <Card className="border-border/50">
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="icon" onClick={goToPreviousWeek}>
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <div className="text-center">
                <p className="font-semibold">
                  {format(currentWeekStart, 'MMM d')} - {format(currentWeekEnd, 'MMM d, yyyy')}
                </p>
                {isCurrentWeek && (
                  <span className="text-xs text-primary font-medium">This Week</span>
                )}
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={goToNextWeek}
                disabled={isCurrentWeek}
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Weekly Calendar Grid */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              Week at a Glance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1">
              {daysOfWeek.map((day, i) => {
                const mood = getDayMood(day);
                const moodData = mood ? moodConfig[mood.mood] : null;
                const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                const isFuture = day > new Date();

                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className={cn(
                      'flex flex-col items-center p-2 rounded-lg',
                      isToday && 'ring-2 ring-primary/50',
                      isFuture && 'opacity-40'
                    )}
                  >
                    <span className="text-[10px] text-muted-foreground mb-1">
                      {format(day, 'EEE')}
                    </span>
                    <span className={cn(
                      'text-xs font-medium mb-1',
                      isToday && 'text-primary'
                    )}>
                      {format(day, 'd')}
                    </span>
                    <div className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center',
                      moodData ? moodData.bg : 'bg-muted/30'
                    )}>
                      {moodData ? (
                        React.createElement(moodData.icon, {
                          className: cn('w-4 h-4', moodData.color)
                        })
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-muted" />
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Weekly Insights */}
        {weeklyInsight && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  Weekly Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center p-3 rounded-lg bg-background/50">
                    <div className={cn(
                      'w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center',
                      moodConfig[weeklyInsight.dominantMood]?.bg || 'bg-muted'
                    )}>
                      {moodConfig[weeklyInsight.dominantMood] && 
                        React.createElement(moodConfig[weeklyInsight.dominantMood].icon, {
                          className: cn('w-5 h-5', moodConfig[weeklyInsight.dominantMood].color)
                        })
                      }
                    </div>
                    <p className="text-[10px] text-muted-foreground">Dominant Mood</p>
                    <p className="text-xs font-medium capitalize">{weeklyInsight.dominantMood}</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-background/50">
                    <div className="w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center bg-yellow-500/10">
                      <TrendingUp className="w-5 h-5 text-yellow-500" />
                    </div>
                    <p className="text-[10px] text-muted-foreground">Avg Energy</p>
                    <p className="text-xs font-medium capitalize">{weeklyInsight.averageEnergy}</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-background/50">
                    <div className="w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center bg-orange-500/10">
                      <Flame className="w-5 h-5 text-orange-500" />
                    </div>
                    <p className="text-[10px] text-muted-foreground">Avg Stress</p>
                    <p className="text-xs font-medium capitalize">{weeklyInsight.averageStress}</p>
                  </div>
                </div>

                {/* Pattern Analysis */}
                <div className="p-4 rounded-xl bg-background/50 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                      <Brain className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-1">Pattern Analysis</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {weeklyInsight.moodPattern}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-accent/10 shrink-0">
                      <Lightbulb className="w-4 h-4 text-accent-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-1">AURRA's Suggestion</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {weeklyInsight.suggestion}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-pink-500/10 shrink-0">
                      <Heart className="w-4 h-4 text-pink-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-1">Encouragement</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {weeklyInsight.encouragement}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Streak */}
                {weeklyInsight.streakDays > 0 && (
                  <div className="flex items-center justify-center gap-2 p-3 rounded-lg bg-primary/10">
                    <Target className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">
                      {weeklyInsight.streakDays} check-in{weeklyInsight.streakDays > 1 ? 's' : ''} this week
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Recent Entries */}
        {weekEntries.length > 0 && (
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                This Week's Entries
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <AnimatePresence>
                  {weekEntries.slice(0, 7).map((entry, i) => {
                    const moodData = moodConfig[entry.mood];
                    return (
                      <motion.div
                        key={entry.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-center gap-3 p-3 rounded-lg bg-muted/30"
                      >
                        <div className={cn('p-2 rounded-full', moodData?.bg)}>
                          {moodData && React.createElement(moodData.icon, {
                            className: cn('w-4 h-4', moodData.color)
                          })}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium capitalize text-sm">{entry.mood}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(parseISO(entry.created_at), 'EEEE, MMM d · h:mm a')}
                          </p>
                        </div>
                        <div className="flex gap-1.5">
                          <span className={cn(
                            'px-2 py-0.5 rounded-full text-[10px] font-medium',
                            entry.energy === 'high' ? 'bg-green-500/10 text-green-600' :
                            entry.energy === 'medium' ? 'bg-yellow-500/10 text-yellow-600' :
                            'bg-red-500/10 text-red-600'
                          )}>
                            {entry.energy} energy
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>
        )}

        {entries.length === 0 && (
          <Card className="border-dashed border-2 border-border/50">
            <CardContent className="py-8 text-center">
              <BookHeart className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <h3 className="font-semibold mb-1">No mood entries yet</h3>
              <p className="text-sm text-muted-foreground">
                Start your daily check-ins to see your emotional patterns here.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
