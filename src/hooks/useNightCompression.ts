/**
 * Night Memory Compression Hook
 * 
 * During night hours (after wind-down), this hook:
 * 1. Summarizes the day's conversations
 * 2. Extracts key patterns and insights
 * 3. Prepares morning context for tomorrow
 * 
 * Runs silently in the background - no UI interruption
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface DaySummary {
  date: string;
  moodTrend: 'positive' | 'neutral' | 'challenging';
  keyTopics: string[];
  openLoops: string[];
  energyPattern: string;
  messageCount: number;
}

interface NightCompressionState {
  isCompressing: boolean;
  lastCompressedDate: string | null;
  todaySummary: DaySummary | null;
}

export const useNightCompression = () => {
  const [state, setState] = useState<NightCompressionState>({
    isCompressing: false,
    lastCompressedDate: localStorage.getItem('aurra-last-compression-date'),
    todaySummary: null,
  });

  // Check if it's time to compress (after 10pm, before 5am)
  const isCompressionTime = useCallback(() => {
    const hour = new Date().getHours();
    return hour >= 22 || hour < 5;
  }, []);

  // Run compression if needed
  const runCompression = useCallback(async () => {
    const today = new Date().toISOString().split('T')[0];
    
    // Don't compress if already done today
    if (state.lastCompressedDate === today) return;
    
    // Only compress during night hours
    if (!isCompressionTime()) return;

    setState(prev => ({ ...prev, isCompressing: true }));

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch today's messages
      const { data: messages } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('user_id', user.id)
        .eq('chat_date', today)
        .order('created_at', { ascending: true });

      if (!messages || messages.length === 0) {
        setState(prev => ({
          ...prev,
          isCompressing: false,
          lastCompressedDate: today,
        }));
        localStorage.setItem('aurra-last-compression-date', today);
        return;
      }

      // Simple local analysis (could be enhanced with AI)
      const userMessages = messages.filter(m => m.sender === 'user');
      const allText = userMessages.map(m => m.content).join(' ').toLowerCase();
      
      // Detect mood patterns
      const positiveWords = ['good', 'great', 'happy', 'excited', 'amazing', 'love', 'nice', 'wonderful'];
      const challengingWords = ['tired', 'stressed', 'anxious', 'worried', 'hard', 'difficult', 'bad', 'sad'];
      
      const positiveCount = positiveWords.filter(w => allText.includes(w)).length;
      const challengingCount = challengingWords.filter(w => allText.includes(w)).length;
      
      let moodTrend: 'positive' | 'neutral' | 'challenging' = 'neutral';
      if (positiveCount > challengingCount + 2) moodTrend = 'positive';
      if (challengingCount > positiveCount + 2) moodTrend = 'challenging';

      // Extract potential topics (simple keyword extraction)
      const topicKeywords = ['work', 'study', 'exercise', 'meeting', 'project', 'health', 'family', 'friends'];
      const keyTopics = topicKeywords.filter(t => allText.includes(t));

      // Detect open loops (questions, todos, reminders)
      const openLoopPatterns = [
        /remind me to (.+)/gi,
        /i need to (.+)/gi,
        /don't forget (.+)/gi,
        /tomorrow (.+)/gi,
      ];
      
      const openLoops: string[] = [];
      for (const pattern of openLoopPatterns) {
        const matches = allText.matchAll(pattern);
        for (const match of matches) {
          if (match[1]) openLoops.push(match[1].slice(0, 50));
        }
      }

      const summary: DaySummary = {
        date: today,
        moodTrend,
        keyTopics: keyTopics.slice(0, 5),
        openLoops: openLoops.slice(0, 3),
        energyPattern: moodTrend === 'challenging' ? 'low' : 'normal',
        messageCount: messages.length,
      };

      // Store summary for morning briefing
      localStorage.setItem('aurra-yesterday-summary', JSON.stringify(summary));
      localStorage.setItem('aurra-last-compression-date', today);

      setState({
        isCompressing: false,
        lastCompressedDate: today,
        todaySummary: summary,
      });

    } catch (error) {
      console.error('[NightCompression] Error:', error);
      setState(prev => ({ ...prev, isCompressing: false }));
    }
  }, [state.lastCompressedDate, isCompressionTime]);

  // Run compression check on mount and periodically
  useEffect(() => {
    runCompression();
    
    // Check every hour during night
    const interval = setInterval(runCompression, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [runCompression]);

  // Get yesterday's summary for morning context
  const getYesterdaySummary = useCallback((): DaySummary | null => {
    const stored = localStorage.getItem('aurra-yesterday-summary');
    if (!stored) return null;
    
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }, []);

  return {
    ...state,
    getYesterdaySummary,
    runCompression,
  };
};
