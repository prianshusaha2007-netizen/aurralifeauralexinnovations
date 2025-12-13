import { useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useNotifications } from './useNotifications';

interface VoiceCommandResult {
  type: 'reminder' | 'mood_query' | 'search' | 'play' | 'call' | 'message' | 'general';
  handled: boolean;
  response?: string;
  data?: any;
}

export const useVoiceCommands = () => {
  const { scheduleNotification, requestPermission } = useNotifications();

  const parseTimeFromText = (text: string): number | null => {
    // Match patterns like "30 minutes", "1 hour", "2 hours", "45 mins"
    const timePatterns = [
      { regex: /(\d+)\s*(?:minute|min|minutes|mins)/i, multiplier: 60 * 1000 },
      { regex: /(\d+)\s*(?:hour|hours|hr|hrs)/i, multiplier: 60 * 60 * 1000 },
      { regex: /(\d+)\s*(?:second|seconds|sec|secs)/i, multiplier: 1000 },
    ];

    for (const pattern of timePatterns) {
      const match = text.match(pattern.regex);
      if (match) {
        return parseInt(match[1]) * pattern.multiplier;
      }
    }

    return null;
  };

  const extractReminderText = (text: string): string => {
    // Remove common phrases to get the reminder content
    const cleanText = text
      .replace(/^(hey\s+)?aura[,\s]*/i, '')
      .replace(/remind\s+me\s+to\s+/i, '')
      .replace(/set\s+(a\s+)?reminder\s+(for\s+)?/i, '')
      .replace(/in\s+\d+\s*(minute|minutes|min|mins|hour|hours|hr|hrs|second|seconds|sec|secs)/i, '')
      .replace(/after\s+\d+\s*(minute|minutes|min|mins|hour|hours|hr|hrs|second|seconds|sec|secs)/i, '')
      .trim();

    return cleanText || 'Your reminder';
  };

  const processCommand = useCallback(async (text: string): Promise<VoiceCommandResult> => {
    const lowerText = text.toLowerCase();
    
    // Remove "Hey AURA" prefix for processing
    const cleanedText = lowerText.replace(/^(hey\s+)?aura[,\s]*/i, '').trim();

    // Check for reminder commands
    if (cleanedText.includes('remind') || cleanedText.includes('reminder') || cleanedText.includes('set a reminder')) {
      const delayMs = parseTimeFromText(text);
      const reminderText = extractReminderText(text);
      
      if (delayMs) {
        await requestPermission();
        await scheduleNotification({
          title: '⏰ AURA Reminder',
          body: reminderText,
          tag: `reminder-${Date.now()}`,
        }, delayMs);

        const timeInMinutes = Math.round(delayMs / 60000);
        const timeDisplay = timeInMinutes >= 60 
          ? `${Math.round(timeInMinutes / 60)} hour${Math.round(timeInMinutes / 60) > 1 ? 's' : ''}`
          : `${timeInMinutes} minute${timeInMinutes > 1 ? 's' : ''}`;

        toast.success(`Reminder set for ${timeDisplay}!`);
        
        return {
          type: 'reminder',
          handled: true,
          response: `Got it! I'll remind you "${reminderText}" in ${timeDisplay}. 🔔`,
          data: { reminderText, delayMs }
        };
      } else {
        return {
          type: 'reminder',
          handled: false,
          response: "I couldn't understand the time. Try saying something like 'Remind me to drink water in 30 minutes'.",
        };
      }
    }

    // Check for mood queries
    if (cleanedText.includes('how am i feeling') || 
        cleanedText.includes('my mood') || 
        cleanedText.includes('mood this week') ||
        cleanedText.includes('feeling this week') ||
        cleanedText.includes('my emotions') ||
        cleanedText.includes('emotional state')) {
      
      try {
        // Fetch recent mood data
        const { data: moodData, error } = await supabase
          .from('mood_checkins')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(7);

        if (error) throw error;

        if (!moodData || moodData.length === 0) {
          return {
            type: 'mood_query',
            handled: true,
            response: "I don't have any mood data for you yet. Try doing a daily check-in first! Go to Daily Check-In from the menu. 🌟",
          };
        }

        // Analyze mood patterns
        const moodCounts: Record<string, number> = {};
        const energyCounts: Record<string, number> = {};
        const stressCounts: Record<string, number> = {};

        moodData.forEach((entry: any) => {
          moodCounts[entry.mood] = (moodCounts[entry.mood] || 0) + 1;
          energyCounts[entry.energy] = (energyCounts[entry.energy] || 0) + 1;
          stressCounts[entry.stress] = (stressCounts[entry.stress] || 0) + 1;
        });

        const dominantMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'neutral';
        const dominantEnergy = Object.entries(energyCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'medium';
        const dominantStress = Object.entries(stressCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'moderate';

        const moodEmojis: Record<string, string> = {
          'happy': '😊', 'sad': '😢', 'anxious': '😰', 'calm': '😌',
          'excited': '🎉', 'tired': '😴', 'stressed': '😫', 'neutral': '😐'
        };

        const response = `Based on your recent check-ins, you've mostly been feeling ${dominantMood} ${moodEmojis[dominantMood] || '✨'}. Your energy has been ${dominantEnergy} and stress levels ${dominantStress}. ${
          dominantMood === 'happy' || dominantMood === 'excited' 
            ? "You're doing great! Keep up the positive vibes! 🌟" 
            : dominantMood === 'stressed' || dominantMood === 'anxious'
            ? "I'm here for you. Want to talk about what's on your mind? 💙"
            : "Remember, I'm always here if you need me! 💫"
        }`;

        return {
          type: 'mood_query',
          handled: true,
          response,
          data: { moodData, dominantMood, dominantEnergy, dominantStress }
        };
      } catch (error) {
        console.error('Mood query error:', error);
        return {
          type: 'mood_query',
          handled: false,
          response: "I had trouble checking your mood data. Let's try again later!",
        };
      }
    }

    // Check for music/play commands
    if (cleanedText.includes('play') || cleanedText.includes('music')) {
      return {
        type: 'play',
        handled: false,
        response: "I'd love to play music for you! Music controls are coming soon. 🎵",
      };
    }

    // Check for call commands
    if (cleanedText.includes('call ') || cleanedText.includes('phone ')) {
      return {
        type: 'call',
        handled: false,
        response: "Phone integration is coming soon! For now, I can help you with other things. 📞",
      };
    }

    // Check for message/text commands
    if (cleanedText.includes('send a message') || cleanedText.includes('text ') || cleanedText.includes('whatsapp')) {
      return {
        type: 'message',
        handled: false,
        response: "Messaging integration is on the roadmap! I'll let you know when it's ready. 💬",
      };
    }

    // Default - not a recognized command, treat as general chat
    return {
      type: 'general',
      handled: false,
    };
  }, [scheduleNotification, requestPermission]);

  return { processCommand };
};
