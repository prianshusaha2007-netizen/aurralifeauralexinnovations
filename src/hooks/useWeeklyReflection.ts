import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { startOfWeek, endOfWeek, subWeeks, format } from 'date-fns';

interface WeeklyReflection {
  id: string;
  week_start: string;
  week_end: string;
  focus_blocks_completed: number;
  overall_feeling: string | null;
  highlights: string | null;
  challenges: string | null;
  gratitude: string | null;
  next_week_intention: string | null;
  created_at: string;
}

interface WeeklyStats {
  focusBlocksCompleted: number;
  moodTrend: string;
  averageMood: string;
}

export const useWeeklyReflection = () => {
  const [showReflectionPrompt, setShowReflectionPrompt] = useState(false);
  const [lastWeekStats, setLastWeekStats] = useState<WeeklyStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentReflection, setCurrentReflection] = useState<WeeklyReflection | null>(null);

  // Check if it's time to show weekly reflection (Sunday evening or Monday morning)
  const checkReflectionTime = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const now = new Date();
    const dayOfWeek = now.getDay();
    const hour = now.getHours();
    
    // Show on Sunday after 6pm or Monday before noon
    const isReflectionTime = (dayOfWeek === 0 && hour >= 18) || (dayOfWeek === 1 && hour < 12);
    
    if (!isReflectionTime) return;

    // Check if already reflected this week
    const lastWeekStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
    const lastReflectionCheck = localStorage.getItem('aura-last-reflection-week');
    const lastWeekKey = format(lastWeekStart, 'yyyy-MM-dd');
    
    if (lastReflectionCheck === lastWeekKey) return;

    // Check if reflection exists in database
    const { data: existingReflection } = await supabase
      .from('weekly_reflections')
      .select('*')
      .eq('week_start', format(lastWeekStart, 'yyyy-MM-dd'))
      .maybeSingle();

    if (existingReflection) {
      localStorage.setItem('aura-last-reflection-week', lastWeekKey);
      return;
    }

    // Fetch last week's stats
    await fetchLastWeekStats();
    setShowReflectionPrompt(true);
  }, []);

  const fetchLastWeekStats = async () => {
    setIsLoading(true);
    try {
      const now = new Date();
      const lastWeekStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
      const lastWeekEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });

      // Fetch completed focus blocks from last week
      const { data: focusBlocks } = await supabase
        .from('daily_focus_blocks')
        .select('*')
        .gte('date', format(lastWeekStart, 'yyyy-MM-dd'))
        .lte('date', format(lastWeekEnd, 'yyyy-MM-dd'))
        .eq('completed', true);

      // Fetch mood check-ins from last week
      const { data: moodCheckins } = await supabase
        .from('mood_checkins')
        .select('mood, created_at')
        .gte('created_at', lastWeekStart.toISOString())
        .lte('created_at', lastWeekEnd.toISOString())
        .order('created_at', { ascending: true });

      // Calculate mood trend
      let moodTrend = 'stable';
      let averageMood = 'neutral';
      
      if (moodCheckins && moodCheckins.length >= 2) {
        const moodValues: Record<string, number> = {
          'great': 5, 'happy': 4, 'good': 4, 'okay': 3, 'neutral': 3,
          'meh': 2, 'sad': 2, 'stressed': 1, 'anxious': 1, 'bad': 1
        };
        
        const moods = moodCheckins.map(m => moodValues[m.mood.toLowerCase()] || 3);
        const avgMood = moods.reduce((a, b) => a + b, 0) / moods.length;
        
        // Check trend by comparing first half to second half
        const midpoint = Math.floor(moods.length / 2);
        const firstHalf = moods.slice(0, midpoint).reduce((a, b) => a + b, 0) / midpoint || 3;
        const secondHalf = moods.slice(midpoint).reduce((a, b) => a + b, 0) / (moods.length - midpoint) || 3;
        
        if (secondHalf - firstHalf > 0.5) moodTrend = 'improving';
        else if (firstHalf - secondHalf > 0.5) moodTrend = 'declining';
        
        if (avgMood >= 4) averageMood = 'positive';
        else if (avgMood >= 3) averageMood = 'balanced';
        else averageMood = 'challenging';
      }

      setLastWeekStats({
        focusBlocksCompleted: focusBlocks?.length || 0,
        moodTrend,
        averageMood
      });
    } catch (error) {
      console.error('Error fetching weekly stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveReflection = async (reflection: {
    overall_feeling: string;
    highlights?: string;
    challenges?: string;
    gratitude?: string;
    next_week_intention?: string;
  }) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return false;

    const now = new Date();
    const lastWeekStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
    const lastWeekEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });

    try {
      const { error } = await supabase.from('weekly_reflections').insert({
        user_id: session.user.id,
        week_start: format(lastWeekStart, 'yyyy-MM-dd'),
        week_end: format(lastWeekEnd, 'yyyy-MM-dd'),
        focus_blocks_completed: lastWeekStats?.focusBlocksCompleted || 0,
        ...reflection
      });

      if (error) throw error;

      localStorage.setItem('aura-last-reflection-week', format(lastWeekStart, 'yyyy-MM-dd'));
      setShowReflectionPrompt(false);
      return true;
    } catch (error) {
      console.error('Error saving reflection:', error);
      return false;
    }
  };

  const dismissReflection = () => {
    const now = new Date();
    const lastWeekStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
    localStorage.setItem('aura-last-reflection-week', format(lastWeekStart, 'yyyy-MM-dd'));
    setShowReflectionPrompt(false);
  };

  useEffect(() => {
    checkReflectionTime();
  }, [checkReflectionTime]);

  return {
    showReflectionPrompt,
    lastWeekStats,
    isLoading,
    saveReflection,
    dismissReflection,
    checkReflectionTime
  };
};
