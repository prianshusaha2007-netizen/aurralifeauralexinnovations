import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface YesterdaySummary {
  mood: string;
  mainActivities: string[];
  wins: string[];
  misses: string[];
  emotionalTone: string;
  openLoops: string[];
  humanSummary: string;
}

// Detect if user is asking about yesterday
export const detectYesterdayIntent = (message: string): boolean => {
  const lowerMessage = message.toLowerCase();
  const patterns = [
    /(?:what|how)\s+(?:did|was|were)\s+(?:i|yesterday|my\s+day)/i,
    /(?:tell|show|give)\s+me\s+(?:about\s+)?yesterday/i,
    /yesterday'?s?\s+(?:summary|recap|chat|conversation)/i,
    /(?:what|how)\s+happened\s+yesterday/i,
    /kal\s+(?:kya|kaisa)/i, // Hindi
    /(?:recap|remember)\s+yesterday/i,
    /what\s+did\s+(?:we|i)\s+(?:talk|discuss)\s+(?:about\s+)?yesterday/i,
    /how\s+was\s+(?:my\s+)?yesterday/i,
  ];
  return patterns.some(p => p.test(lowerMessage));
};

// Detect broader memory/pattern queries
export const detectPatternQuery = (message: string): 'recent' | 'struggles' | 'wins' | null => {
  const lowerMessage = message.toLowerCase();
  
  if (/(?:what|how)\s+have\s+i\s+been\s+(?:struggling|having trouble|stuck)/i.test(lowerMessage) ||
      /(?:struggling|difficult|hard)\s+(?:with|lately|recently)/i.test(lowerMessage)) {
    return 'struggles';
  }
  
  if (/(?:what|how)\s+have\s+i\s+been\s+(?:doing|achieving|accomplishing)/i.test(lowerMessage) ||
      /(?:my|recent)\s+(?:wins|achievements|progress)/i.test(lowerMessage)) {
    return 'wins';
  }
  
  if (/(?:what|how)\s+(?:have\s+i|was\s+i)\s+(?:doing|been)\s+(?:lately|recently|this week)/i.test(lowerMessage)) {
    return 'recent';
  }
  
  return null;
};

export const useYesterdayRecall = () => {
  const [isLoading, setIsLoading] = useState(false);

  // Get yesterday's summary from local archive or database
  const getYesterdaySummary = useCallback(async (): Promise<YesterdaySummary | null> => {
    setIsLoading(true);
    
    try {
      // First check local archive
      const archivedChats = JSON.parse(localStorage.getItem('aura-archived-chats') || '[]');
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      const yesterdayChat = archivedChats.find((chat: any) => chat.date === yesterdayStr);
      
      if (yesterdayChat?.messages?.length > 0) {
        // Generate human-style summary from archived messages
        const messages = yesterdayChat.messages;
        const userMessages = messages.filter((m: any) => m.sender === 'user');
        
        // Analyze messages for patterns
        const activities = extractActivities(userMessages);
        const mood = detectOverallMood(userMessages);
        
        return {
          mood,
          mainActivities: activities,
          wins: [],
          misses: [],
          emotionalTone: mood,
          openLoops: [],
          humanSummary: generateHumanSummary(activities, mood, userMessages.length),
        };
      }
      
      // Check database for chat summaries
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const startOfYesterday = new Date(yesterdayStr);
      const endOfYesterday = new Date(yesterdayStr);
      endOfYesterday.setHours(23, 59, 59, 999);
      
      const { data: summaries } = await supabase
        .from('chat_summaries')
        .select('*')
        .eq('user_id', user.id)
        .gte('time_range_start', startOfYesterday.toISOString())
        .lte('time_range_end', endOfYesterday.toISOString())
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (summaries && summaries.length > 0) {
        const summary = summaries[0];
        return {
          mood: summary.emotional_trend || 'neutral',
          mainActivities: summary.key_topics || [],
          wins: [],
          misses: [],
          emotionalTone: summary.emotional_trend || 'neutral',
          openLoops: summary.open_loops || [],
          humanSummary: summary.summary || 'We had a conversation yesterday.',
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching yesterday summary:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get recent patterns (last 7-14 days)
  const getRecentPatterns = useCallback(async (type: 'struggles' | 'wins' | 'recent'): Promise<string> => {
    setIsLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return "I don't have enough context yet to share patterns.";
      
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
      
      const { data: summaries } = await supabase
        .from('chat_summaries')
        .select('*')
        .eq('user_id', user.id)
        .gte('time_range_start', twoWeeksAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (!summaries || summaries.length === 0) {
        return "We haven't chatted long enough yet for me to notice patterns.";
      }
      
      // Analyze emotional trends
      const emotionalTrends = summaries.map(s => s.emotional_trend).filter(Boolean);
      const allTopics = summaries.flatMap(s => s.key_topics || []);
      const openLoops = summaries.flatMap(s => s.open_loops || []);
      
      if (type === 'struggles') {
        const negativePatterns = emotionalTrends.filter(t => 
          /tired|stressed|anxious|overwhelmed|low/i.test(t || '')
        );
        
        if (negativePatterns.length > 2) {
          return `Mostly energy and consistency at night. Mornings have been better.`;
        }
        return `Nothing major standing out. You've been handling things okay.`;
      }
      
      if (type === 'wins') {
        const positivePatterns = emotionalTrends.filter(t => 
          /good|great|excited|motivated|calm/i.test(t || '')
        );
        
        if (positivePatterns.length > 2) {
          return `You've had some good momentum lately. Keep building on that.`;
        }
        return `Still building up — but showing up counts.`;
      }
      
      // Recent overview
      return `You've been ${emotionalTrends[0] || 'doing okay'}. ${allTopics.slice(0, 3).join(', ')} came up recently.`;
      
    } catch (error) {
      console.error('Error fetching patterns:', error);
      return "I couldn't recall that right now.";
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Format yesterday summary for chat response
  const formatYesterdayForChat = useCallback((summary: YesterdaySummary | null): string => {
    if (!summary) {
      return "We didn't really chat yesterday. Want to catch me up on how things are going?";
    }
    
    const { mainActivities, mood, humanSummary } = summary;
    
    if (mainActivities.length === 0 && !humanSummary) {
      return "Yesterday was pretty light. Nothing major happened in our chat.";
    }
    
    return humanSummary;
  }, []);

  return {
    isLoading,
    getYesterdaySummary,
    getRecentPatterns,
    formatYesterdayForChat,
    detectYesterdayIntent,
    detectPatternQuery,
  };
};

// Helper functions for local analysis
function extractActivities(messages: any[]): string[] {
  const activities: string[] = [];
  const activityPatterns = [
    /(?:went to|did|finished|completed)\s+(\w+)/gi,
    /(?:gym|college|work|coding|study|meeting|class)/gi,
  ];
  
  messages.forEach(m => {
    const content = m.content || '';
    activityPatterns.forEach(p => {
      const matches = content.match(p);
      if (matches) {
        activities.push(...matches.slice(0, 2));
      }
    });
  });
  
  return [...new Set(activities)].slice(0, 4);
}

function detectOverallMood(messages: any[]): string {
  const allContent = messages.map(m => m.content || '').join(' ').toLowerCase();
  
  if (/tired|exhausted|drained|low energy/i.test(allContent)) return 'tired';
  if (/stressed|overwhelmed|anxious/i.test(allContent)) return 'heavy';
  if (/happy|great|good|excited/i.test(allContent)) return 'good';
  if (/okay|fine|alright/i.test(allContent)) return 'okay';
  
  return 'neutral';
}

function generateHumanSummary(activities: string[], mood: string, messageCount: number): string {
  if (messageCount < 3) {
    return "We had a quick chat yesterday. Nothing too heavy.";
  }
  
  const activityStr = activities.length > 0 
    ? `You had ${activities.slice(0, 2).join(' and ')}` 
    : 'It was a pretty regular day';
  
  const moodStr = {
    tired: 'and seemed a bit tired by the end',
    heavy: 'and it felt like a lot to handle',
    good: 'and things were going well',
    okay: 'and it was pretty steady',
    neutral: '',
  }[mood] || '';
  
  return `${activityStr}${moodStr ? ` ${moodStr}` : ''}.`;
}
