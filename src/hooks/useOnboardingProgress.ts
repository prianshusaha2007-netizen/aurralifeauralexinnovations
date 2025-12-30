import { useState, useEffect, useCallback } from 'react';
import { useAura } from '@/contexts/AuraContext';

// Onboarding questions that are asked gradually over sessions
interface OnboardingQuestion {
  id: string;
  category: 'identity' | 'goals' | 'routine' | 'hobbies' | 'relationships' | 'learning';
  question: string;
  field: string;
  isAsked: boolean;
  isAnswered: boolean;
  isSensitive?: boolean;
  day: number; // Which day to ask (1, 2, 3, etc.)
}

const ONBOARDING_QUESTIONS: OnboardingQuestion[] = [
  // Day 1 - Identity
  { id: 'name', category: 'identity', question: "What should I call you?", field: 'name', isAsked: false, isAnswered: false, day: 1 },
  { id: 'work_status', category: 'identity', question: "Are you studying, working, or both?", field: 'profession', isAsked: false, isAnswered: false, day: 1 },
  
  // Day 2 - Goals & Direction
  { id: 'current_goal', category: 'goals', question: "What are you currently working toward?", field: 'goals', isAsked: false, isAnswered: false, day: 2 },
  { id: 'goal_type', category: 'goals', question: "Is it study, career, health, or something personal?", field: 'goal_category', isAsked: false, isAnswered: false, day: 2 },
  
  // Day 3 - Daily Routine (gradual)
  { id: 'wake_time', category: 'routine', question: "When do you usually wake up?", field: 'wakeTime', isAsked: false, isAnswered: false, day: 3 },
  { id: 'fixed_times', category: 'routine', question: "Do you have fixed times for study, gym, or work?", field: 'fixed_schedule', isAsked: false, isAnswered: false, day: 3 },
  { id: 'good_day', category: 'routine', question: "What does a good day usually look like for you?", field: 'ideal_day', isAsked: false, isAnswered: false, day: 4 },
  
  // Day 4-5 - Hobbies & Interests
  { id: 'hobbies', category: 'hobbies', question: "What do you enjoy doing when you're free?", field: 'hobbies', isAsked: false, isAnswered: false, day: 4 },
  
  // Day 5+ - Learning Style
  { id: 'explanation_style', category: 'learning', question: "Do you like explanations short or detailed?", field: 'explanation_preference', isAsked: false, isAnswered: false, day: 5 },
  { id: 'learning_style', category: 'learning', question: "Do you prefer being guided or left to explore?", field: 'learning_preference', isAsked: false, isAnswered: false, day: 5 },
  
  // Day 6+ - Relationships (optional, sensitive)
  { id: 'important_people', category: 'relationships', question: "Anyone important you want me to remember reminders for?", field: 'important_contacts', isAsked: false, isAnswered: false, isSensitive: true, day: 6 },
];

const STORAGE_KEY = 'aurra-onboarding-progress';

export const useOnboardingProgress = () => {
  const { userProfile, updateUserProfile } = useAura();
  const [questions, setQuestions] = useState<OnboardingQuestion[]>([]);
  const [currentDay, setCurrentDay] = useState(1);
  const [pendingQuestion, setPendingQuestion] = useState<OnboardingQuestion | null>(null);

  // Load progress from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const data = JSON.parse(stored);
        setQuestions(data.questions || ONBOARDING_QUESTIONS);
        setCurrentDay(data.currentDay || 1);
      } catch {
        setQuestions(ONBOARDING_QUESTIONS);
      }
    } else {
      setQuestions(ONBOARDING_QUESTIONS);
    }

    // Calculate current day based on first use
    const firstUse = localStorage.getItem('aurra-first-use');
    if (!firstUse) {
      localStorage.setItem('aurra-first-use', new Date().toISOString());
    } else {
      const daysSinceFirst = Math.floor(
        (Date.now() - new Date(firstUse).getTime()) / (1000 * 60 * 60 * 24)
      ) + 1;
      setCurrentDay(Math.min(daysSinceFirst, 7)); // Cap at 7 days
    }
  }, []);

  // Save progress to localStorage
  useEffect(() => {
    if (questions.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ questions, currentDay }));
    }
  }, [questions, currentDay]);

  // Get next question to ask (based on current day, not asked yet)
  const getNextQuestion = useCallback((): OnboardingQuestion | null => {
    const available = questions.filter(q => 
      !q.isAnswered && 
      q.day <= currentDay && 
      !q.isSensitive // Skip sensitive questions unless user engages
    );
    
    return available[0] || null;
  }, [questions, currentDay]);

  // Mark question as asked
  const markAsked = useCallback((questionId: string) => {
    setQuestions(prev => prev.map(q => 
      q.id === questionId ? { ...q, isAsked: true } : q
    ));
  }, []);

  // Record answer and update profile
  const recordAnswer = useCallback((questionId: string, answer: string) => {
    setQuestions(prev => prev.map(q => 
      q.id === questionId ? { ...q, isAsked: true, isAnswered: true } : q
    ));

    const question = questions.find(q => q.id === questionId);
    if (question) {
      // Update user profile based on the answer
      const updates: Record<string, any> = {};
      
      switch (question.field) {
        case 'name':
          updates.name = answer;
          break;
        case 'profession':
          updates.professions = [answer];
          break;
        case 'goals':
          updates.goals = [answer];
          break;
        case 'wakeTime':
          // Try to parse time from natural language
          const timeMatch = answer.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
          if (timeMatch) {
            let hours = parseInt(timeMatch[1]);
            const minutes = timeMatch[2] || '00';
            const period = timeMatch[3]?.toLowerCase();
            
            if (period === 'pm' && hours < 12) hours += 12;
            if (period === 'am' && hours === 12) hours = 0;
            
            updates.wakeTime = `${hours.toString().padStart(2, '0')}:${minutes}`;
          }
          break;
        default:
          // Store other answers in localStorage for now
          const customData = JSON.parse(localStorage.getItem('aurra-custom-profile') || '{}');
          customData[question.field] = answer;
          localStorage.setItem('aurra-custom-profile', JSON.stringify(customData));
      }
      
      if (Object.keys(updates).length > 0) {
        updateUserProfile(updates);
      }
    }
    
    setPendingQuestion(null);
  }, [questions, updateUserProfile]);

  // Get onboarding status
  const getOnboardingStatus = useCallback(() => {
    const answered = questions.filter(q => q.isAnswered).length;
    const total = questions.filter(q => !q.isSensitive).length;
    const percentage = Math.round((answered / total) * 100);
    
    return {
      answered,
      total,
      percentage,
      isComplete: percentage >= 80,
      currentDay,
    };
  }, [questions, currentDay]);

  // Check if we should ask a question in this conversation
  const shouldAskQuestion = useCallback((): boolean => {
    const lastAsked = localStorage.getItem('aurra-last-onboarding-ask');
    if (lastAsked) {
      const hoursSinceAsk = (Date.now() - new Date(lastAsked).getTime()) / (1000 * 60 * 60);
      if (hoursSinceAsk < 4) return false; // Don't ask more than once per 4 hours
    }
    
    const nextQ = getNextQuestion();
    return !!nextQ;
  }, [getNextQuestion]);

  // Get the question to ask and mark timing
  const getQuestionToAsk = useCallback((): string | null => {
    const nextQ = getNextQuestion();
    if (!nextQ) return null;
    
    localStorage.setItem('aurra-last-onboarding-ask', new Date().toISOString());
    markAsked(nextQ.id);
    setPendingQuestion(nextQ);
    
    return nextQ.question;
  }, [getNextQuestion, markAsked]);

  // Detect if message might be answering the pending question
  const detectAnswerToQuestion = useCallback((message: string): boolean => {
    if (!pendingQuestion) return false;
    
    // Simple heuristic: if there's a pending question and user sends a message
    // that looks like an answer (not a question, not very short)
    const isLikelyAnswer = message.length > 2 && 
                          !message.endsWith('?') && 
                          !message.toLowerCase().startsWith('what') &&
                          !message.toLowerCase().startsWith('how') &&
                          !message.toLowerCase().startsWith('why');
    
    return isLikelyAnswer;
  }, [pendingQuestion]);

  return {
    questions,
    currentDay,
    pendingQuestion,
    getNextQuestion,
    markAsked,
    recordAnswer,
    getOnboardingStatus,
    shouldAskQuestion,
    getQuestionToAsk,
    detectAnswerToQuestion,
  };
};
