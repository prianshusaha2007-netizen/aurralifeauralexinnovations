import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface FocusSessionData {
  focusType: string;
  goal?: string;
  durationMinutes: number;
  completed: 'yes' | 'almost' | 'not_today';
  struggledCount: number;
  gymSubType?: string;
  gymBodyArea?: string;
}

export const useFocusSessions = () => {
  const { user } = useAuth();

  // Save focus session to database
  const saveFocusSession = useCallback(async (data: FocusSessionData) => {
    if (!user) {
      console.log('No user, saving to localStorage only');
      return null;
    }

    try {
      const { data: session, error } = await supabase
        .from('focus_sessions')
        .insert({
          user_id: user.id,
          focus_type: data.focusType,
          goal: data.goal,
          duration_minutes: data.durationMinutes,
          completed: data.completed,
          struggled_count: data.struggledCount,
          gym_sub_type: data.gymSubType,
          gym_body_area: data.gymBodyArea,
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving focus session:', error);
        return null;
      }

      return session;
    } catch (error) {
      console.error('Error saving focus session:', error);
      return null;
    }
  }, [user]);

  // Get user's focus sessions
  const getFocusSessions = useCallback(async (days: number = 7) => {
    if (!user) return [];

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    try {
      const { data, error } = await supabase
        .from('focus_sessions')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching focus sessions:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching focus sessions:', error);
      return [];
    }
  }, [user]);

  // Calculate streak from database
  const calculateStreak = useCallback(async () => {
    if (!user) return 0;

    try {
      const { data, error } = await supabase
        .from('focus_sessions')
        .select('created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error || !data) return 0;

      const daySet = new Set<string>();
      data.forEach(s => {
        const d = new Date(s.created_at);
        daySet.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
      });

      let streak = 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
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

      return streak;
    } catch (error) {
      console.error('Error calculating streak:', error);
      return 0;
    }
  }, [user]);

  return {
    saveFocusSession,
    getFocusSessions,
    calculateStreak,
  };
};
