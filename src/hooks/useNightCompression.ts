/**
 * Night Memory Compression
 * 
 * Runs during night hours to:
 * 1. Summarize day's conversations
 * 2. Extract key patterns
 * 3. Prepare morning context
 * 
 * NOTE: This runs as a standalone utility, not as a React hook,
 * to avoid React instance conflicts.
 */

import { supabase } from '@/integrations/supabase/client';

interface DaySummary {
  date: string;
  moodTrend: 'positive' | 'neutral' | 'challenging';
  keyTopics: string[];
  openLoops: string[];
  energyPattern: string;
  messageCount: number;
}

// Check if it's compression time (10pm - 5am)
const isCompressionTime = (): boolean => {
  const hour = new Date().getHours();
  return hour >= 22 || hour < 5;
};

// Run night compression
export const runNightCompression = async (): Promise<DaySummary | null> => {
  const today = new Date().toISOString().split('T')[0];
  const lastCompressed = localStorage.getItem('aurra-last-compression-date');
  
  // Don't compress if already done today
  if (lastCompressed === today) return null;
  
  // Only compress during night hours
  if (!isCompressionTime()) return null;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Fetch today's messages
    const { data: messages } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('user_id', user.id)
      .eq('chat_date', today)
      .order('created_at', { ascending: true });

    if (!messages || messages.length === 0) {
      localStorage.setItem('aurra-last-compression-date', today);
      return null;
    }

    // Simple local analysis
    const userMessages = messages.filter(m => m.sender === 'user');
    const allText = userMessages.map(m => m.content).join(' ').toLowerCase();
    
    // Detect mood patterns
    const positiveWords = ['good', 'great', 'happy', 'excited', 'amazing', 'love', 'nice'];
    const challengingWords = ['tired', 'stressed', 'anxious', 'worried', 'hard', 'difficult', 'bad'];
    
    const positiveCount = positiveWords.filter(w => allText.includes(w)).length;
    const challengingCount = challengingWords.filter(w => allText.includes(w)).length;
    
    let moodTrend: 'positive' | 'neutral' | 'challenging' = 'neutral';
    if (positiveCount > challengingCount + 2) moodTrend = 'positive';
    if (challengingCount > positiveCount + 2) moodTrend = 'challenging';

    // Extract topics
    const topicKeywords = ['work', 'study', 'exercise', 'meeting', 'project', 'health', 'family'];
    const keyTopics = topicKeywords.filter(t => allText.includes(t));

    // Detect open loops
    const openLoopPatterns = [/remind me to (.+)/gi, /i need to (.+)/gi, /tomorrow (.+)/gi];
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

    // Store for morning briefing
    localStorage.setItem('aurra-yesterday-summary', JSON.stringify(summary));
    localStorage.setItem('aurra-last-compression-date', today);

    return summary;
  } catch (error) {
    console.error('[NightCompression] Error:', error);
    return null;
  }
};

// Get yesterday's summary
export const getYesterdaySummary = (): DaySummary | null => {
  const stored = localStorage.getItem('aurra-yesterday-summary');
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
};

// Auto-run on import if conditions are met (non-blocking)
if (typeof window !== 'undefined') {
  // Run after a delay to avoid blocking app startup
  setTimeout(() => {
    runNightCompression().catch(console.error);
  }, 5000);
  
  // Expose for testing
  (window as any).runNightCompression = runNightCompression;
  (window as any).getYesterdaySummary = getYesterdaySummary;
}
