import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface MoodCheckInState {
  shouldAskMood: boolean;
  lastAsked: string | null;
  currentMood: string | null;
}

const MOOD_CHECK_INTERVAL_HOURS = 6; // Ask every 6 hours max

export const useMoodCheckIn = () => {
  const { user } = useAuth();
  const [state, setState] = useState<MoodCheckInState>({
    shouldAskMood: false,
    lastAsked: null,
    currentMood: null,
  });

  // Check if we should ask about mood
  const checkIfShouldAsk = useCallback(() => {
    const lastAsked = localStorage.getItem('aura-last-mood-ask');
    const now = Date.now();
    
    if (!lastAsked) {
      return true; // Never asked before
    }
    
    const hoursSinceLastAsk = (now - parseInt(lastAsked)) / (1000 * 60 * 60);
    return hoursSinceLastAsk >= MOOD_CHECK_INTERVAL_HOURS;
  }, []);

  // Detect mood from user's message
  const detectMoodFromMessage = useCallback((message: string): string | null => {
    const lowerMessage = message.toLowerCase();
    
    // Positive moods
    if (/\b(happy|great|amazing|awesome|fantastic|wonderful|excited|good|khush|mast|badhiya|accha)\b/.test(lowerMessage)) {
      return 'happy';
    }
    if (/\b(calm|peaceful|relaxed|chill|shanti)\b/.test(lowerMessage)) {
      return 'calm';
    }
    if (/\b(energetic|pumped|motivated|charged)\b/.test(lowerMessage)) {
      return 'energetic';
    }
    
    // Negative moods
    if (/\b(sad|down|upset|unhappy|depressed|low|dukhi|udas)\b/.test(lowerMessage)) {
      return 'sad';
    }
    if (/\b(stressed|anxious|worried|tense|nervous|tension)\b/.test(lowerMessage)) {
      return 'stressed';
    }
    if (/\b(tired|exhausted|sleepy|thaka|neend)\b/.test(lowerMessage)) {
      return 'tired';
    }
    if (/\b(angry|frustrated|annoyed|irritated|gussa)\b/.test(lowerMessage)) {
      return 'angry';
    }
    if (/\b(bored|bore|boring)\b/.test(lowerMessage)) {
      return 'bored';
    }
    if (/\b(confused|lost|overwhelmed)\b/.test(lowerMessage)) {
      return 'confused';
    }
    
    return null;
  }, []);

  // Generate a natural mood check question
  const getMoodCheckQuestion = useCallback((): string => {
    const questions = [
      "Hey, how are you feeling right now? 💭",
      "Quick check-in — how's your mood today?",
      "Arre, kaisa chal raha hai? How are you feeling?",
      "Just checking in... how are you doing? 🌟",
      "What's the vibe today? How are you feeling?",
    ];
    return questions[Math.floor(Math.random() * questions.length)];
  }, []);

  // Generate response based on detected mood
  const getMoodResponse = useCallback((mood: string): string => {
    const responses: Record<string, string[]> = {
      happy: [
        "Love to hear that! 🌟 Keep that energy going!",
        "Ayyy that's amazing! What's making you feel so good?",
        "This makes me happy too! 💫",
      ],
      calm: [
        "That's a beautiful state to be in. Enjoy it! 🌿",
        "Peace mode activated. Nice! ✨",
        "That's the best feeling. Soak it in.",
      ],
      energetic: [
        "Let's gooo! 🔥 Channel that energy into something great!",
        "Love the energy! What are you gonna crush today?",
        "Unstoppable mode! I'm here for it! 💪",
      ],
      sad: [
        "I'm here with you. Want to talk about it? 💙",
        "Arre... it's okay to feel this way. I'm listening.",
        "Sending you a virtual hug. What's on your mind? 🤗",
      ],
      stressed: [
        "Take a breath with me. We'll figure this out together. 💫",
        "I hear you. What's weighing on you the most?",
        "Pause. Breathe. One thing at a time. I'm here.",
      ],
      tired: [
        "Rest is productive too, you know. Be gentle with yourself. 😴",
        "Maybe take a short break? You deserve it.",
        "Tired is valid. What would feel good right now?",
      ],
      angry: [
        "That frustration is valid. Want to vent? I'm all ears.",
        "I get it. Sometimes things are just... ugh. Tell me more.",
        "Let it out. What's got you feeling this way?",
      ],
      bored: [
        "Ooh let's fix that! Want to play a game or chat about something fun? 😏",
        "Bore ho raha? I've got ideas if you want! 🎮",
        "Let's shake things up! What sounds interesting to you?",
      ],
      confused: [
        "Let's untangle this together. What's confusing you?",
        "One step at a time. Break it down for me?",
        "I'm here to help clarify. What's on your mind?",
      ],
    };
    
    const moodResponses = responses[mood] || ["Thanks for sharing how you're feeling. 💙"];
    return moodResponses[Math.floor(Math.random() * moodResponses.length)];
  }, []);

  // Save mood to database
  const saveMood = useCallback(async (mood: string, notes?: string) => {
    if (!user) return;
    
    try {
      // Map simple mood to database format
      const moodMap: Record<string, { mood: string; energy: string; stress: string }> = {
        happy: { mood: 'happy', energy: 'high', stress: 'low' },
        calm: { mood: 'calm', energy: 'medium', stress: 'low' },
        energetic: { mood: 'happy', energy: 'high', stress: 'low' },
        sad: { mood: 'sad', energy: 'low', stress: 'medium' },
        stressed: { mood: 'anxious', energy: 'medium', stress: 'high' },
        tired: { mood: 'tired', energy: 'low', stress: 'medium' },
        angry: { mood: 'angry', energy: 'high', stress: 'high' },
        bored: { mood: 'neutral', energy: 'low', stress: 'low' },
        confused: { mood: 'anxious', energy: 'medium', stress: 'medium' },
      };
      
      const moodData = moodMap[mood] || { mood: 'neutral', energy: 'medium', stress: 'medium' };
      
      await supabase.from('mood_checkins').insert({
        user_id: user.id,
        mood: moodData.mood,
        energy: moodData.energy,
        stress: moodData.stress,
        notes: notes || null,
      });
      
      localStorage.setItem('aura-last-mood-ask', Date.now().toString());
      setState(prev => ({ ...prev, currentMood: mood, shouldAskMood: false }));
    } catch (error) {
      console.error('Failed to save mood:', error);
    }
  }, [user]);

  // Mark that we asked about mood
  const markMoodAsked = useCallback(() => {
    localStorage.setItem('aura-last-mood-ask', Date.now().toString());
    setState(prev => ({ ...prev, shouldAskMood: false }));
  }, []);

  // Check on mount
  useEffect(() => {
    setState(prev => ({ ...prev, shouldAskMood: checkIfShouldAsk() }));
  }, [checkIfShouldAsk]);

  return {
    shouldAskMood: state.shouldAskMood,
    currentMood: state.currentMood,
    detectMoodFromMessage,
    getMoodCheckQuestion,
    getMoodResponse,
    saveMood,
    markMoodAsked,
    checkIfShouldAsk,
  };
};
