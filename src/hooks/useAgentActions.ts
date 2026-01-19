// useAgentActions - Hook for executing real database operations from agent actions

import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface ActionResult {
  success: boolean;
  message: string;
  data?: any;
}

interface ExpenseData {
  amount: number;
  category: string;
  description?: string;
}

interface WorkoutData {
  type: string;
  duration: number;
  bodyArea?: string;
  goal?: string;
}

interface PlanData {
  title: string;
  description?: string;
  category?: string;
  targetDate?: string;
}

interface HabitData {
  name: string;
  icon?: string;
}

interface MoodData {
  mood: string;
  energy: string;
  stress: string;
  notes?: string;
}

interface FollowUpData {
  contactName: string;
  platform: string;
  context?: string;
  nextFollowUpAt?: string;
}

export const useAgentActions = () => {
  const { user } = useAuth();

  // Finance: Log expense
  const logExpense = useCallback(async (data: ExpenseData): Promise<ActionResult> => {
    if (!user) return { success: false, message: 'Please log in to log expenses' };

    try {
      const { error } = await supabase.from('expenses').insert({
        user_id: user.id,
        amount: data.amount,
        category: data.category,
        description: data.description || null,
        date: format(new Date(), 'yyyy-MM-dd'),
      });

      if (error) throw error;

      toast.success(`Expense logged: ₹${data.amount} for ${data.category}`);
      return { 
        success: true, 
        message: `✅ Logged expense: ₹${data.amount} for ${data.category}` 
      };
    } catch (error) {
      console.error('Error logging expense:', error);
      return { success: false, message: 'Failed to log expense' };
    }
  }, [user]);

  // Finance: Get budget overview
  const getBudgetOverview = useCallback(async (): Promise<ActionResult> => {
    if (!user) return { success: false, message: 'Please log in to view budget' };

    try {
      const today = new Date();
      const startOfMonth = format(new Date(today.getFullYear(), today.getMonth(), 1), 'yyyy-MM-dd');
      const endOfMonth = format(new Date(today.getFullYear(), today.getMonth() + 1, 0), 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('expenses')
        .select('amount, category')
        .eq('user_id', user.id)
        .gte('date', startOfMonth)
        .lte('date', endOfMonth);

      if (error) throw error;

      const totalSpent = data?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;
      const byCategory = data?.reduce((acc, e) => {
        acc[e.category] = (acc[e.category] || 0) + Number(e.amount);
        return acc;
      }, {} as Record<string, number>) || {};

      const categoryBreakdown = Object.entries(byCategory)
        .map(([cat, amt]) => `${cat}: ₹${amt}`)
        .join('\n');

      return { 
        success: true, 
        message: `📊 **Monthly Spending Overview**\n\nTotal: ₹${totalSpent}\n\n${categoryBreakdown || 'No expenses this month'}`,
        data: { totalSpent, byCategory }
      };
    } catch (error) {
      console.error('Error fetching budget:', error);
      return { success: false, message: 'Failed to fetch budget overview' };
    }
  }, [user]);

  // Fitness: Log workout
  const logWorkout = useCallback(async (data: WorkoutData): Promise<ActionResult> => {
    if (!user) return { success: false, message: 'Please log in to log workouts' };

    try {
      const { error } = await supabase.from('focus_sessions').insert({
        user_id: user.id,
        focus_type: 'gym',
        duration_minutes: data.duration,
        goal: data.goal || data.type,
        gym_sub_type: data.type,
        gym_body_area: data.bodyArea || null,
        completed: 'yes',
      });

      if (error) throw error;

      toast.success(`Workout logged: ${data.duration} min ${data.type}`);
      return { 
        success: true, 
        message: `💪 Workout logged: ${data.duration} min ${data.type}${data.bodyArea ? ` (${data.bodyArea})` : ''}` 
      };
    } catch (error) {
      console.error('Error logging workout:', error);
      return { success: false, message: 'Failed to log workout' };
    }
  }, [user]);

  // Fitness: Get fitness progress
  const getFitnessProgress = useCallback(async (): Promise<ActionResult> => {
    if (!user) return { success: false, message: 'Please log in to view fitness progress' };

    try {
      const sevenDaysAgo = format(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('focus_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('focus_type', 'gym')
        .gte('created_at', sevenDaysAgo);

      if (error) throw error;

      const workoutsThisWeek = data?.length || 0;
      const totalMinutes = data?.reduce((sum, s) => sum + s.duration_minutes, 0) || 0;

      return { 
        success: true, 
        message: `🏋️ **This Week's Fitness**\n\nWorkouts: ${workoutsThisWeek}\nTotal Time: ${totalMinutes} min\nAvg per workout: ${workoutsThisWeek ? Math.round(totalMinutes / workoutsThisWeek) : 0} min`,
        data: { workoutsThisWeek, totalMinutes }
      };
    } catch (error) {
      console.error('Error fetching fitness progress:', error);
      return { success: false, message: 'Failed to fetch fitness progress' };
    }
  }, [user]);

  // Planning: Create goal
  const createGoal = useCallback(async (data: PlanData): Promise<ActionResult> => {
    if (!user) return { success: false, message: 'Please log in to create goals' };

    try {
      const { error } = await supabase.from('goals').insert({
        user_id: user.id,
        title: data.title,
        description: data.description || null,
        category: data.category || 'general',
        target_date: data.targetDate || null,
        status: 'active',
        progress: 0,
      });

      if (error) throw error;

      toast.success(`Goal created: ${data.title}`);
      return { 
        success: true, 
        message: `🎯 Goal created: "${data.title}"${data.targetDate ? ` (Target: ${data.targetDate})` : ''}` 
      };
    } catch (error) {
      console.error('Error creating goal:', error);
      return { success: false, message: 'Failed to create goal' };
    }
  }, [user]);

  // Planning: Get goals list
  const getGoals = useCallback(async (): Promise<ActionResult> => {
    if (!user) return { success: false, message: 'Please log in to view goals' };

    try {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      const goalsList = data?.map(g => 
        `• ${g.title} (${g.progress}% complete)${g.target_date ? ` - Due: ${g.target_date}` : ''}`
      ).join('\n') || 'No active goals';

      return { 
        success: true, 
        message: `📋 **Your Active Goals**\n\n${goalsList}`,
        data: data
      };
    } catch (error) {
      console.error('Error fetching goals:', error);
      return { success: false, message: 'Failed to fetch goals' };
    }
  }, [user]);

  // Study: Start focus session
  const startFocusSession = useCallback(async (type: string = 'study', duration: number = 25): Promise<ActionResult> => {
    if (!user) return { success: false, message: 'Please log in to start a session' };

    try {
      const { data, error } = await supabase.from('focus_sessions').insert({
        user_id: user.id,
        focus_type: type,
        duration_minutes: duration,
        completed: 'not_today',
      }).select().single();

      if (error) throw error;

      toast.success(`${type} session started: ${duration} min`);
      return { 
        success: true, 
        message: `📚 ${type.charAt(0).toUpperCase() + type.slice(1)} session started! ${duration} minutes on the clock.`,
        data: { sessionId: data.id }
      };
    } catch (error) {
      console.error('Error starting session:', error);
      return { success: false, message: 'Failed to start session' };
    }
  }, [user]);

  // Habits: Create habit
  const createHabit = useCallback(async (data: HabitData): Promise<ActionResult> => {
    if (!user) return { success: false, message: 'Please log in to create habits' };

    try {
      const { error } = await supabase.from('habits').insert({
        user_id: user.id,
        name: data.name,
        icon: data.icon || '✨',
        frequency: 'daily',
        target_count: 1,
      });

      if (error) throw error;

      toast.success(`Habit created: ${data.name}`);
      return { 
        success: true, 
        message: `✨ New habit: "${data.name}" added to your daily tracker!` 
      };
    } catch (error) {
      console.error('Error creating habit:', error);
      return { success: false, message: 'Failed to create habit' };
    }
  }, [user]);

  // Mood: Log mood check-in
  const logMood = useCallback(async (data: MoodData): Promise<ActionResult> => {
    if (!user) return { success: false, message: 'Please log in to log mood' };

    try {
      const { error } = await supabase.from('mood_checkins').insert({
        user_id: user.id,
        mood: data.mood,
        energy: data.energy,
        stress: data.stress,
        notes: data.notes || null,
      });

      if (error) throw error;

      toast.success('Mood logged!');
      return { 
        success: true, 
        message: `🧘 Mood check-in recorded: ${data.mood} mood, ${data.energy} energy, ${data.stress} stress` 
      };
    } catch (error) {
      console.error('Error logging mood:', error);
      return { success: false, message: 'Failed to log mood' };
    }
  }, [user]);

  // Social: Schedule follow-up
  const scheduleFollowUp = useCallback(async (data: FollowUpData): Promise<ActionResult> => {
    if (!user) return { success: false, message: 'Please log in to schedule follow-ups' };

    try {
      const { error } = await supabase.from('follow_ups').insert({
        user_id: user.id,
        contact_name: data.contactName,
        platform: data.platform,
        context: data.context || null,
        next_follow_up_at: data.nextFollowUpAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'pending',
      });

      if (error) throw error;

      toast.success(`Follow-up scheduled with ${data.contactName}`);
      return { 
        success: true, 
        message: `📅 Follow-up scheduled with ${data.contactName} on ${data.platform}` 
      };
    } catch (error) {
      console.error('Error scheduling follow-up:', error);
      return { success: false, message: 'Failed to schedule follow-up' };
    }
  }, [user]);

  // Memory: Save memory
  const saveMemory = useCallback(async (content: string, category: string = 'general'): Promise<ActionResult> => {
    if (!user) return { success: false, message: 'Please log in to save memories' };

    try {
      const { error } = await supabase.from('life_memories').insert({
        user_id: user.id,
        title: content.slice(0, 50) + (content.length > 50 ? '...' : ''),
        content,
        memory_type: category,
        importance_score: 5,
      });

      if (error) throw error;

      toast.success('Memory saved!');
      return { 
        success: true, 
        message: `💾 I'll remember that: "${content.slice(0, 100)}${content.length > 100 ? '...' : ''}"` 
      };
    } catch (error) {
      console.error('Error saving memory:', error);
      return { success: false, message: 'Failed to save memory' };
    }
  }, [user]);

  // Routine: Add focus block
  const addFocusBlock = useCallback(async (title: string, duration: number = 30, priority: number = 1): Promise<ActionResult> => {
    if (!user) return { success: false, message: 'Please log in to add focus blocks' };

    try {
      const { error } = await supabase.from('daily_focus_blocks').insert({
        user_id: user.id,
        title,
        duration_minutes: duration,
        priority,
        date: format(new Date(), 'yyyy-MM-dd'),
      });

      if (error) throw error;

      toast.success(`Focus block added: ${title}`);
      return { 
        success: true, 
        message: `📌 Added to today's plan: "${title}" (${duration} min)` 
      };
    } catch (error) {
      console.error('Error adding focus block:', error);
      return { success: false, message: 'Failed to add focus block' };
    }
  }, [user]);

  // Hydration: Log water
  const logWater = useCallback(async (amount: number = 250): Promise<ActionResult> => {
    if (!user) return { success: false, message: 'Please log in to log hydration' };

    try {
      const { error } = await supabase.from('hydration_logs').insert({
        user_id: user.id,
        amount_ml: amount,
      });

      if (error) throw error;

      toast.success(`Logged ${amount}ml of water!`);
      return { 
        success: true, 
        message: `💧 Logged ${amount}ml water. Stay hydrated!` 
      };
    } catch (error) {
      console.error('Error logging water:', error);
      return { success: false, message: 'Failed to log water' };
    }
  }, [user]);

  return {
    // Finance
    logExpense,
    getBudgetOverview,
    // Fitness
    logWorkout,
    getFitnessProgress,
    // Planning
    createGoal,
    getGoals,
    // Study
    startFocusSession,
    // Habits
    createHabit,
    // Mood
    logMood,
    // Social
    scheduleFollowUp,
    // Memory
    saveMemory,
    // Routine
    addFocusBlock,
    // Hydration
    logWater,
  };
};
