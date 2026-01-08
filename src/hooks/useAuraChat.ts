import { useState, useCallback, useEffect, useRef } from 'react';
import { useAura, ChatMessage } from '@/contexts/AuraContext';
import { toast } from 'sonner';
import { useReminderIntentDetection } from './useReminderIntentDetection';
import { useReminders } from './useReminders';
import { useStorytellingMode } from './useStorytellingMode';
import { useMoodCheckIn } from './useMoodCheckIn';
import { useLifeMemoryGraph } from './useLifeMemoryGraph';
import { useMemoryPersistence } from './useMemoryPersistence';
import { useVoicePlayback } from './useVoicePlayback';
import { useRelationshipEvolution } from './useRelationshipEvolution';
import { useSmartRoutine, SmartRoutineBlock } from './useSmartRoutine';
import { useMasterIntentEngine } from './useMasterIntentEngine';
import { useChatActions } from './useChatActions';
import { useRealtimeContext } from './useRealtimeContext';
import { useUserJourney } from './useUserJourney';
import { useMentorship } from './useMentorship';
import { useOptimizedMemory } from './useOptimizedMemory';
import { useEmotionalDetection } from './useEmotionalDetection';
import { useSilentPersonaSwitching } from './useSilentPersonaSwitching';
import { useRecoveryMode } from './useRecoveryMode';
import { hasGreetedToday } from '@/utils/dailyGreeting';
import { isRoutineEditRequest } from '@/utils/routineBehaviorRules';
import { supabase } from '@/integrations/supabase/client';

// Daily plan helper functions (inline to avoid hook nesting issues)
const DAILY_PLAN_KEY = 'aurra-daily-plan';
const LAST_PLAN_DATE_KEY = 'aurra-last-plan-date';
const ROUTINE_ONBOARDING_COMPLETE_KEY = 'aurra-routine-onboarding-complete';

interface DailyPlan {
  plan: string;
  intensity: 'light' | 'normal' | 'busy' | 'unknown';
  keywords: string[];
  timestamp: string;
}

function getDailyPlanContext() {
  const today = new Date().toISOString().split('T')[0];
  const hasCompletedOnboarding = localStorage.getItem(ROUTINE_ONBOARDING_COMPLETE_KEY) === 'true';
  const lastPlanDate = localStorage.getItem(LAST_PLAN_DATE_KEY);
  const hasAskedToday = lastPlanDate === today;
  
  let currentPlan: DailyPlan | null = null;
  const savedPlan = localStorage.getItem(DAILY_PLAN_KEY);
  if (savedPlan) {
    try {
      const parsed = JSON.parse(savedPlan);
      if (parsed.timestamp?.startsWith(today)) {
        currentPlan = parsed;
      }
    } catch {
      // Invalid JSON
    }
  }
  
  const isFirstMessageOfDay = !hasGreetedToday();
  const shouldAskForPlan = hasCompletedOnboarding && isFirstMessageOfDay && !hasAskedToday;
  
  return {
    hasCompletedOnboarding,
    shouldAskForPlan,
    hasAskedToday,
    currentPlan,
  };
}

/**
 * Detect mid-day plan intensity changes from user messages
 */
function detectPlanIntensityChange(message: string): { 
  detected: boolean; 
  newIntensity: 'light' | 'normal' | 'busy' | null;
  responseMessage: string;
} {
  const lowerMessage = message.toLowerCase();
  
  // Busier patterns
  if (/(?:got|getting|became|become|turned|it'?s?|today'?s?|things? (?:got|are)|now it'?s?)\s*(?:busier|hectic|crazy|intense|packed|heavy|stressful|chaotic)/i.test(lowerMessage) ||
      /(?:more|extra|sudden|unexpected)\s*(?:work|tasks?|meetings?|stuff|things)/i.test(lowerMessage) ||
      /(?:swamped|overwhelmed|slammed|drowning)/i.test(lowerMessage)) {
    return { 
      detected: true, 
      newIntensity: 'busy',
      responseMessage: "Got it — shifting to busy mode. I'll keep things light and simple. 💪"
    };
  }
  
  // Lighter patterns
  if (/(?:got|getting|became|become|turned|it'?s?|today'?s?|things? (?:got|are)|now it'?s?)\s*(?:lighter|easier|calmer|relaxed|chill|quiet|slow)/i.test(lowerMessage) ||
      /(?:cancelled|canceled|postponed|cleared|freed up)/i.test(lowerMessage) ||
      /(?:day off|taking it easy|nothing much)/i.test(lowerMessage)) {
    return { 
      detected: true, 
      newIntensity: 'light',
      responseMessage: "Nice — going light mode. Enjoy the breather. 🍃"
    };
  }
  
  // Back to normal patterns
  if (/(?:back to normal|getting normal|things? (?:are|got) normal|regular day now|settled down)/i.test(lowerMessage)) {
    return { 
      detected: true, 
      newIntensity: 'normal',
      responseMessage: "Cool, back to steady mode. ☕"
    };
  }
  
  return { detected: false, newIntensity: null, responseMessage: '' };
}

/**
 * Update the daily plan intensity
 */
function updatePlanIntensity(newIntensity: 'light' | 'normal' | 'busy', reason?: string): DailyPlan | null {
  const today = new Date().toISOString().split('T')[0];
  const savedPlan = localStorage.getItem(DAILY_PLAN_KEY);
  
  if (savedPlan) {
    try {
      const parsed = JSON.parse(savedPlan);
      if (parsed.timestamp?.startsWith(today)) {
        const updated: DailyPlan = {
          ...parsed,
          intensity: newIntensity,
          plan: reason ? `${parsed.plan} → ${reason}` : parsed.plan,
          timestamp: new Date().toISOString(),
        };
        localStorage.setItem(DAILY_PLAN_KEY, JSON.stringify(updated));
        // Trigger storage event for other components
        window.dispatchEvent(new Event('storage'));
        return updated;
      }
    } catch {}
  }
  
  // Create new plan if none exists
  const newPlan: DailyPlan = {
    plan: reason || 'Updated mid-day',
    intensity: newIntensity,
    keywords: [],
    timestamp: new Date().toISOString(),
  };
  localStorage.setItem(DAILY_PLAN_KEY, JSON.stringify(newPlan));
  localStorage.setItem(LAST_PLAN_DATE_KEY, today);
  window.dispatchEvent(new Event('storage'));
  return newPlan;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/aura-chat`;
const SUMMARIZATION_THRESHOLD = 50;

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// Detect routine action intents from user messages
function detectRoutineActionIntent(message: string): { 
  action: 'start' | 'shift' | 'skip' | 'edit' | null; 
  blockName?: string;
  shiftMinutes?: number;
} {
  const lowerMessage = message.toLowerCase();
  
  // Start action
  if (/^(?:let'?s?\s+)?(?:start|begin|okay|alright|ready|yes|yeah|yep|sure|go|do it|haan|chalo)/i.test(lowerMessage)) {
    return { action: 'start' };
  }
  
  // Skip action
  if (/(?:skip|not\s+(?:now|today)|maybe\s+later|pass|nahi|aaj\s+nahi)/i.test(lowerMessage)) {
    return { action: 'skip' };
  }
  
  // Shift action
  const shiftMatch = lowerMessage.match(/(?:shift|push|delay|later|baad\s+mein)\s*(?:by\s+)?(\d+)?\s*(?:min|hour)?/i);
  if (shiftMatch || /not\s+now|later/i.test(lowerMessage)) {
    const minutes = shiftMatch?.[1] ? parseInt(shiftMatch[1]) : 30;
    return { action: 'shift', shiftMinutes: minutes };
  }
  
  // Edit action
  if (/(?:change|edit|update|modify)\s+(?:my\s+)?(?:routine|schedule|gym|study|coding|work)/i.test(lowerMessage)) {
    const blockMatch = lowerMessage.match(/(?:change|edit|update)\s+(?:my\s+)?(\w+)/i);
    return { action: 'edit', blockName: blockMatch?.[1] };
  }
  
  return { action: null };
}

// Get time-based context for AI
function getTimeContext(): { 
  timeOfDay: string; 
  currentHour: number; 
  currentTime: string;
  isEvening: boolean;
  isNight: boolean;
} {
  const now = new Date();
  const currentHour = now.getHours();
  const currentTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  
  let timeOfDay = 'day';
  if (currentHour >= 5 && currentHour < 12) timeOfDay = 'morning';
  else if (currentHour >= 12 && currentHour < 17) timeOfDay = 'afternoon';
  else if (currentHour >= 17 && currentHour < 21) timeOfDay = 'evening';
  else timeOfDay = 'night';
  
  return {
    timeOfDay,
    currentHour,
    currentTime,
    isEvening: currentHour >= 17 && currentHour < 21,
    isNight: currentHour >= 21 || currentHour < 5,
  };
}

// Find upcoming/current routine block
function findRelevantBlock(blocks: SmartRoutineBlock[], currentHour: number): {
  upcomingBlock: SmartRoutineBlock | null;
  isNearRoutineTime: boolean;
  minutesUntilBlock: number;
} {
  if (!blocks.length) return { upcomingBlock: null, isNearRoutineTime: false, minutesUntilBlock: 0 };
  
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  
  for (const block of blocks) {
    const [hours, mins] = block.timing.split(':').map(Number);
    const blockMinutes = hours * 60 + (mins || 0);
    const diff = blockMinutes - currentMinutes;
    
    // Within 45 minutes before or 15 minutes after
    if (diff >= -15 && diff <= 45) {
      return { 
        upcomingBlock: block, 
        isNearRoutineTime: true, 
        minutesUntilBlock: diff 
      };
    }
  }
  
  return { upcomingBlock: null, isNearRoutineTime: false, minutesUntilBlock: 0 };
}

export const useAuraChat = () => {
  const { chatMessages, addChatMessage, updateChatMessage, userProfile } = useAura();
  const [isThinking, setIsThinking] = useState(false);
  const [currentResponseMode, setCurrentResponseMode] = useState<'fast' | 'deep' | null>(null);
  const { detectReminderIntent, generateReminderConfirmation } = useReminderIntentDetection();
  const { addFromNaturalLanguage } = useReminders();
  const { 
    storyState, 
    detectStoryIntent, 
    startStory, 
    endStory, 
    getStorySystemPrompt,
    generateStoryStartMessage 
  } = useStorytellingMode();
  const {
    shouldAskMood,
    detectMoodFromMessage,
    getMoodResponse,
    saveMood,
    markMoodAsked,
  } = useMoodCheckIn();
  const {
    getMemoryContext,
    triggerSummarization,
  } = useLifeMemoryGraph();
  const {
    processMessageForMemories,
    getRelevantMemories,
    pendingMemory,
    confirmPendingMemory,
    dismissPendingMemory,
  } = useMemoryPersistence();
  const { playText } = useVoicePlayback();
  const { 
    engagement, 
    recordInteraction, 
    getRelationshipContext 
  } = useRelationshipEvolution();
  const {
    settings: routineSettings,
    getTodayBlocks,
    completeBlock,
    skipBlock,
    shiftBlock,
  } = useSmartRoutine();
  
  // User journey tracking for retention and adaptive behavior
  const {
    daysSinceFirstUse,
    retentionPhase,
    stressState,
    dominantPersona,
    studentScore,
    founderScore,
    consecutiveActiveDays,
    energyLevel,
    phaseAdaptations,
  } = useUserJourney();
  const { classifyIntent, getResponseStrategy } = useMasterIntentEngine();
  const { handleChatAction, showUpgradeSheet, setShowUpgradeSheet, focusState } = useChatActions();
  const { context: realtimeContext, getContextForAI } = useRealtimeContext();
  const { profile: mentorshipProfile, isInQuietHours, hasCompletedSetup: hasMentorshipSetup } = useMentorship();
  
  // Emotional detection for real-time tone adaptation
  const { 
    detectEmotion, 
    emotionalTrend, 
    currentEnergy, 
    getEmotionalContextForAI,
    needsSupport,
  } = useEmotionalDetection();
  
  // Silent persona switching based on context
  const { 
    processMessage: processPersonaMessage, 
    getPersonaContextForAI,
  } = useSilentPersonaSwitching();
  
  // Recovery mode - gentle mode after stress signals
  const {
    isActive: recoveryModeActive,
    level: recoveryLevel,
    processMessage: processRecoveryMessage,
    getRecoveryContextForAI,
    getActivationMessage,
  } = useRecoveryMode();
  
  // Optimized memory system for faster responses
  const { 
    memoryContext: optimizedMemory, 
    getContextForAI: getOptimizedMemoryContext, 
    getResponsePath,
    isReady: memoryReady,
  } = useOptimizedMemory();
  
  
  const messageCountRef = useRef(0);

  // Check and trigger summarization if needed
  const checkSummarization = useCallback(async () => {
    messageCountRef.current += 1;
    
    // Trigger summarization every 50 messages
    if (messageCountRef.current >= SUMMARIZATION_THRESHOLD) {
      console.log('Triggering auto-summarization...');
      messageCountRef.current = 0;
      
      // Run in background
      triggerSummarization().then(result => {
        if (result?.summarized) {
          console.log('Chat summarized successfully:', result.summary);
        }
      });
    }
  }, [triggerSummarization]);

  const sendMessage = useCallback(async (userMessage: string, preferredModel?: string) => {
    if (!userMessage.trim()) return;

    // CHAT-AS-OS: Handle chat-based actions first (focus mode, subscriptions, etc.)
    const chatActionResult = handleChatAction(userMessage);
    if (chatActionResult.handled) {
      addChatMessage({ content: userMessage, sender: 'user' });
      if (chatActionResult.response) {
        addChatMessage({ content: chatActionResult.response, sender: 'aura' });
      }
      return;
    }

    // Check for mid-day plan intensity change
    const planChange = detectPlanIntensityChange(userMessage);
    if (planChange.detected && planChange.newIntensity) {
      addChatMessage({ content: userMessage, sender: 'user' });
      updatePlanIntensity(planChange.newIntensity, userMessage);
      addChatMessage({ content: planChange.responseMessage, sender: 'aura' });
      return;
    }

    // Check if user wants to end the story
    const lowerMessage = userMessage.toLowerCase();
    if (storyState.isActive && (lowerMessage.includes('stop story') || lowerMessage.includes('end story') || lowerMessage.includes('kahani band'))) {
      addChatMessage({ content: userMessage, sender: 'user' });
      addChatMessage({ 
        content: "Story ended! 📚 That was fun yaar! Want to start another one sometime? Just say 'tell me a story'! ✨", 
        sender: 'aura' 
      });
      endStory();
      return;
    }

    // Check for story intent
    const storyIntent = detectStoryIntent(userMessage);
    if (storyIntent.isStory && !storyState.isActive) {
      addChatMessage({ content: userMessage, sender: 'user' });
      const startMessage = generateStoryStartMessage(storyIntent.genre);
      addChatMessage({ content: startMessage, sender: 'aura' });
      startStory(storyIntent.genre);
      
      // Continue to send the actual story request
      setIsThinking(true);
      
      // Build story conversation with system prompt
      const storySystemPrompt = getStorySystemPrompt(storyIntent.genre, '');
      const conversationHistory: Message[] = [
        { role: 'system', content: storySystemPrompt },
        { role: 'user', content: `Start a ${storyIntent.genre} story for me. Make it engaging and interactive with choices at the end.` }
      ];
      
      await streamStoryResponse(conversationHistory, preferredModel);
      return;
    }

    // Check for reminder intent
    const reminderIntent = detectReminderIntent(userMessage);
    if (reminderIntent.isReminder && reminderIntent.confidence >= 60) {
      addChatMessage({ content: userMessage, sender: 'user' });
      setIsThinking(true);
      
      try {
        const reminder = await addFromNaturalLanguage(userMessage);
        if (reminder) {
          const confirmation = generateReminderConfirmation(reminder.title, reminderIntent.timeText);
          addChatMessage({ content: confirmation, sender: 'aura' });
          setIsThinking(false);
          return;
        }
      } catch (error) {
        console.error('Failed to save reminder:', error);
        addChatMessage({ 
          content: "I had trouble setting that reminder. Want me to try again?", 
          sender: 'aura' 
        });
        setIsThinking(false);
        return;
      }
    }

    // Check if user is expressing mood
    const detectedMood = detectMoodFromMessage(userMessage);
    if (detectedMood) {
      // Save the mood silently
      saveMood(detectedMood, userMessage);
    }

    // Process message for important memories (auto-save in background)
    processMessageForMemories(userMessage).then(({ savedCount, pendingPermission }) => {
      if (savedCount > 0) {
        console.log(`[Memory] Auto-saved ${savedCount} memories from message`);
      }
    });

    // Regular chat flow (or story continuation)
    addChatMessage({ content: userMessage, sender: 'user' });
    
    // Determine response path early and set it for UI indicator
    const responsePath = getResponsePath(userMessage);
    setCurrentResponseMode(responsePath);
    setIsThinking(true);
    
    // If in story mode, add story context
    let systemPrompt: Message[] = [];
    if (storyState.isActive) {
      systemPrompt = [{ 
        role: 'system', 
        content: getStorySystemPrompt(storyState.genre, storyState.storyContext) 
      }];
    }

    // Add OPTIMIZED memory context (summarized, not raw) for better speed
    const optimizedContext = getOptimizedMemoryContext();
    if (optimizedContext && !storyState.isActive) {
      systemPrompt.push({
        role: 'system',
        content: `[MEMORY CONTEXT - Use implicitly, never quote]\n${optimizedContext}`
      });
    }

    // Response path already determined above
    
    // For fast path, limit context to last 6 messages
    // For deep path, use last 20 messages
    const messageLimit = responsePath === 'fast' ? 6 : 20;

    // Build conversation history for context
    const conversationHistory: Message[] = [
      ...systemPrompt,
      ...chatMessages
        .slice(-messageLimit)
        .map((msg: ChatMessage): Message => ({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.content,
        }))
    ];
    
    // Add current message
    conversationHistory.push({ role: 'user', content: userMessage });
    
    // Trigger summarization check in background
    checkSummarization();
    
    // Record interaction for relationship evolution
    recordInteraction('message');
    
    // Master Intent Classification - "Chat is the OS"
    const intent = classifyIntent(userMessage);
    const responseStrategy = getResponseStrategy(intent);
    
    // Emotional detection and recovery mode processing
    const emotionResult = detectEmotion(userMessage);
    const personaResult = processPersonaMessage(userMessage);
    const recoveryResult = processRecoveryMessage(userMessage);
    
    // Track emotional interactions
    if (intent.shouldPrioritizeEmotion) {
      recordInteraction('emotional');
    }
    
    // If recovery mode just activated, we'll add an activation message after AI response
    const shouldShowRecoveryMessage = recoveryResult.shouldActivateRecovery;

    let assistantContent = '';
    let messageId: string | null = null;

    try {
      // Get user's session token for authentication
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          messages: conversationHistory,
          preferredModel: preferredModel || 'gemini-flash',
          userProfile: {
            name: userProfile.name,
            age: userProfile.age,
            profession: userProfile.profession,
            professions: userProfile.professions,
            goals: userProfile.goals,
            languages: userProfile.languages,
            tonePreference: userProfile.tonePreference,
            wakeTime: routineSettings.wakeTime || userProfile.wakeTime,
            sleepTime: routineSettings.sleepTime || userProfile.sleepTime,
            aiName: userProfile.aiName || 'AURRA',
            preferredPersona: userProfile.preferredPersona || 'companion',
            responseStyle: userProfile.responseStyle || 'balanced',
            askBeforeJoking: userProfile.askBeforeJoking !== false,
            relationshipStyle: userProfile.relationshipStyle || 'best_friend',
            aurraGender: userProfile.aurraGender || 'neutral',
            // Relationship evolution data
            relationshipPhase: engagement?.relationshipPhase || 'introduction',
            daysSinceStart: engagement ? Math.floor((Date.now() - engagement.firstInteractionAt.getTime()) / (1000 * 60 * 60 * 24)) : 0,
            subscriptionTier: engagement?.subscriptionTier || 'core',
            // Smart Routine context
            currentMood: routineSettings.currentMood,
            todayBlocks: getTodayBlocks().map(b => ({
              name: b.name,
              timing: b.timing,
              type: b.type,
              completed: b.lastCompleted && new Date(b.lastCompleted).toDateString() === new Date().toDateString(),
            })),
            // Time context for routine-aware responses
            timeContext: getTimeContext(),
            upcomingBlock: findRelevantBlock(getTodayBlocks(), new Date().getHours()),
            // Real-time context (location, weather, live awareness)
            realtimeContext: {
              currentTime: realtimeContext.currentTime,
              currentDate: realtimeContext.currentDate,
              dayOfWeek: realtimeContext.dayOfWeek,
              timeOfDay: realtimeContext.timeOfDay,
              isWeekend: realtimeContext.isWeekend,
              isLateNight: realtimeContext.isLateNight,
              city: realtimeContext.city,
              country: realtimeContext.country,
              hasLocation: realtimeContext.hasLocation,
              temperature: realtimeContext.temperature,
              feelsLike: realtimeContext.feelsLike,
              condition: realtimeContext.condition,
              weatherEmoji: realtimeContext.weatherEmoji,
              isHot: realtimeContext.isHot,
              isCold: realtimeContext.isCold,
              isRaining: realtimeContext.isRaining,
              hasWeather: realtimeContext.hasWeather,
            },
            // Session context for greeting logic
            sessionContext: {
              isFirstMessageOfDay: !hasGreetedToday(),
              messageCountToday: chatMessages.filter(m => {
                const msgDate = new Date(m.timestamp || Date.now()).toDateString();
                return msgDate === new Date().toDateString() && m.sender === 'user';
              }).length,
            },
            // Daily plan context - "What's your plan for today?" system
            dailyPlanContext: (() => {
              const planCtx = getDailyPlanContext();
              return {
                hasCompletedRoutineOnboarding: planCtx.hasCompletedOnboarding,
                shouldAskForPlan: planCtx.shouldAskForPlan,
                hasAskedForPlanToday: planCtx.hasAskedToday,
                currentPlan: planCtx.currentPlan ? {
                  plan: planCtx.currentPlan.plan,
                  intensity: planCtx.currentPlan.intensity,
                  keywords: planCtx.currentPlan.keywords,
                } : null,
                isRoutineEditRequest: isRoutineEditRequest(userMessage),
              };
            })(),
            // Master Intent for "Chat is the OS"
            intent: {
              type: intent.type,
              confidence: intent.confidence,
              urgency: intent.urgency,
              subAction: intent.subAction,
              shouldPrioritizeEmotion: intent.shouldPrioritizeEmotion,
            },
            responseStrategy: {
              systemPersona: responseStrategy.systemPersona,
              responseLength: responseStrategy.responseLength,
              featureHint: responseStrategy.featureHint,
              responsePath, // 'fast' or 'deep' - controls token limits
            },
            // User Journey - 30-day retention arc, stress states, persona scoring
            journeyContext: {
              daysSinceFirstUse,
              retentionPhase,
              stressState,
              dominantPersona,
              studentScore,
              founderScore,
              consecutiveActiveDays,
              energyLevel,
              // Phase-specific behavior adaptations
              adaptations: {
                responseLength: phaseAdaptations.responseLength,
                pushRoutines: phaseAdaptations.pushRoutines,
                showReminders: phaseAdaptations.showReminders,
                suggestionsPerDay: phaseAdaptations.suggestionsPerDay,
                toneIntensity: phaseAdaptations.toneIntensity,
              },
            },
            // Focus Mode Context - when user is in focus mode
            focusContext: focusState.isActive ? {
              isActive: true,
              remainingMinutes: Math.ceil(focusState.remainingTime / 60),
              sessionType: focusState.currentSession?.blockType || 'general',
            } : null,
            // Mentorship context
            mentorshipContext: hasMentorshipSetup ? {
              roleTypes: mentorshipProfile.role_types,
              mentorshipStyle: mentorshipProfile.mentorship_style,
              subjects: mentorshipProfile.subjects,
              practices: mentorshipProfile.practices,
              level: mentorshipProfile.level,
              injuriesNotes: mentorshipProfile.injuries_notes,
              isInQuietHours: isInQuietHours(),
              followUpEnabled: mentorshipProfile.follow_up_enabled,
            } : null,
            // Emotional Detection Context - real-time tone adaptation
            emotionalContext: {
              currentState: emotionResult.state,
              emotionalTrend: emotionalTrend,
              energyLevel: currentEnergy,
              confidence: emotionResult.confidence,
              toneAdaptation: emotionResult.toneAdaptation,
              responseStyle: emotionResult.suggestedResponseStyle,
              needsExtraSupport: needsSupport,
            },
            // Silent Persona Context - context-aware persona
            personaContext: {
              activePersona: personaResult.persona,
              behavior: personaResult.behavior,
            },
            // Recovery Mode Context - stress-triggered gentle mode
            recoveryContext: recoveryModeActive ? {
              isActive: true,
              level: recoveryLevel,
              adaptations: getRecoveryContextForAI(),
            } : null,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Request failed with status ${response.status}`);
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            
            if (content) {
              assistantContent += content;
              
              // Update message in real-time
              if (!messageId) {
                messageId = addChatMessage({ content: assistantContent, sender: 'aura' });
              } else {
                updateChatMessage(messageId, assistantContent);
              }
            }
          } catch {
            // Incomplete JSON, continue buffering
          }
        }
      }

      // If we never added a message (edge case), add it now
      if (!messageId && assistantContent) {
        addChatMessage({ content: assistantContent, sender: 'aura' });
      }

      // Auto-play voice if enabled
      if (userProfile.autoPlayVoice && assistantContent) {
        // Use a short delay to let the UI settle
        setTimeout(() => {
          playText(assistantContent, userProfile.aurraGender);
        }, 300);
      }

    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Something went wrong';
      
      if (errorMessage.includes('Rate limit')) {
        toast.error('Taking a quick breather... Try again in a moment! 💫');
      } else if (errorMessage.includes('Usage limit')) {
        toast.error('Need more credits to keep chatting!');
      } else {
        toast.error('Could not connect to AURA. Please try again.');
      }
      
      // Add fallback response
      addChatMessage({ 
        content: "I'm having a little trouble connecting right now. Give me a moment and try again? 💫", 
        sender: 'aura' 
      });
    } finally {
      setIsThinking(false);
    }
  }, [chatMessages, addChatMessage, updateChatMessage, userProfile, detectReminderIntent, addFromNaturalLanguage, generateReminderConfirmation, storyState, detectStoryIntent, startStory, endStory, getStorySystemPrompt, generateStoryStartMessage, getMemoryContext, checkSummarization, playText, realtimeContext, mentorshipProfile, hasMentorshipSetup, isInQuietHours]);

  // Helper function for streaming story responses
  const streamStoryResponse = async (conversationHistory: Message[], preferredModel?: string) => {
    let assistantContent = '';
    let messageId: string | null = null;

    try {
      // Get user's session token for authentication
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          messages: conversationHistory,
          preferredModel: preferredModel || 'gemini-flash',
          userProfile: {
            name: userProfile.name,
            age: userProfile.age,
            profession: userProfile.profession,
            professions: userProfile.professions,
            goals: userProfile.goals,
            languages: userProfile.languages,
            tonePreference: userProfile.tonePreference,
            wakeTime: userProfile.wakeTime,
            sleepTime: userProfile.sleepTime,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            
            if (content) {
              assistantContent += content;
              
              if (!messageId) {
                messageId = addChatMessage({ content: assistantContent, sender: 'aura' });
              } else {
                updateChatMessage(messageId, assistantContent);
              }
            }
          } catch {
            // Incomplete JSON, continue buffering
          }
        }
      }

      if (!messageId && assistantContent) {
        addChatMessage({ content: assistantContent, sender: 'aura' });
      }
    } catch (error) {
      console.error('Story error:', error);
      addChatMessage({ 
        content: "Oops, I lost my train of thought! 😅 Let's try again?", 
        sender: 'aura' 
      });
    } finally {
      setIsThinking(false);
      setCurrentResponseMode(null);
    }
  };

  return { 
    sendMessage, 
    isThinking,
    currentResponseMode,
    storyState, 
    endStory, 
    shouldAskMood, 
    markMoodAsked,
    pendingMemory,
    confirmPendingMemory,
    dismissPendingMemory,
    // Chat-as-OS features
    showUpgradeSheet,
    setShowUpgradeSheet,
    focusState,
    // Emotional & Recovery state
    emotionalTrend,
    currentEnergy,
    recoveryModeActive,
    recoveryLevel,
  };
};
