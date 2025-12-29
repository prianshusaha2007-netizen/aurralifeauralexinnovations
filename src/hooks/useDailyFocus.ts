import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface FocusBlock {
  id: string;
  user_id: string;
  date: string;
  title: string;
  description: string | null;
  duration_minutes: number;
  priority: number;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export const useDailyFocus = () => {
  const { user } = useAuth();
  const [focusBlocks, setFocusBlocks] = useState<FocusBlock[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const fetchTodaysFocus = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const today = getTodayDate();
      const { data, error } = await supabase
        .from('daily_focus_blocks')
        .select('*')
        .eq('date', today)
        .order('priority', { ascending: true });

      if (error) throw error;
      setFocusBlocks((data || []) as FocusBlock[]);
    } catch (error) {
      console.error('Error fetching focus blocks:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const addFocusBlock = useCallback(async (
    title: string,
    description?: string,
    durationMinutes: number = 30,
    priority: number = 1
  ) => {
    if (!user) return null;

    // Check if already have 3 blocks for today
    if (focusBlocks.length >= 3) {
      toast.error('You can only have 3 focus blocks per day');
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('daily_focus_blocks')
        .insert({
          user_id: user.id,
          date: getTodayDate(),
          title,
          description: description || null,
          duration_minutes: durationMinutes,
          priority: Math.min(focusBlocks.length + 1, 3),
        })
        .select()
        .single();

      if (error) throw error;
      
      setFocusBlocks(prev => [...prev, data as FocusBlock]);
      toast.success('Focus block added');
      return data;
    } catch (error) {
      console.error('Error adding focus block:', error);
      toast.error('Failed to add focus block');
      return null;
    }
  }, [user, focusBlocks.length]);

  const updateFocusBlock = useCallback(async (
    id: string,
    updates: Partial<Pick<FocusBlock, 'title' | 'description' | 'duration_minutes' | 'priority'>>
  ) => {
    try {
      const { error } = await supabase
        .from('daily_focus_blocks')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      
      setFocusBlocks(prev => 
        prev.map(block => block.id === id ? { ...block, ...updates } : block)
      );
      toast.success('Focus block updated');
    } catch (error) {
      console.error('Error updating focus block:', error);
      toast.error('Failed to update focus block');
    }
  }, []);

  const completeFocusBlock = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('daily_focus_blocks')
        .update({
          completed: true,
          completed_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
      
      setFocusBlocks(prev => 
        prev.map(block => 
          block.id === id 
            ? { ...block, completed: true, completed_at: new Date().toISOString() } 
            : block
        )
      );
      toast.success('Well done! Focus block completed 🎉');
    } catch (error) {
      console.error('Error completing focus block:', error);
      toast.error('Failed to complete focus block');
    }
  }, []);

  const deleteFocusBlock = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('daily_focus_blocks')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setFocusBlocks(prev => prev.filter(block => block.id !== id));
      toast.success('Focus block removed');
    } catch (error) {
      console.error('Error deleting focus block:', error);
      toast.error('Failed to delete focus block');
    }
  }, []);

  const getCompletionProgress = useCallback(() => {
    if (focusBlocks.length === 0) return 0;
    const completed = focusBlocks.filter(b => b.completed).length;
    return Math.round((completed / focusBlocks.length) * 100);
  }, [focusBlocks]);

  useEffect(() => {
    fetchTodaysFocus();
  }, [fetchTodaysFocus]);

  return {
    focusBlocks,
    isLoading,
    addFocusBlock,
    updateFocusBlock,
    completeFocusBlock,
    deleteFocusBlock,
    fetchTodaysFocus,
    getCompletionProgress,
    canAddMore: focusBlocks.length < 3,
  };
};
