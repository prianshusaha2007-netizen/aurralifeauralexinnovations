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
import { supabase } from '@/integrations/supabase/client';

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
  const { classifyIntent, getResponseStrategy } = useMasterIntentEngine();
  
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
    setIsThinking(true);
    
    // If in story mode, add story context
    let systemPrompt: Message[] = [];
    if (storyState.isActive) {
      systemPrompt = [{ 
        role: 'system', 
        content: getStorySystemPrompt(storyState.genre, storyState.storyContext) 
      }];
    }

    // Add life memory context to conversation
    const memoryContext = getMemoryContext();
    if (memoryContext && !storyState.isActive) {
      systemPrompt.push({
        role: 'system',
        content: memoryContext
      });
    }

    // Also fetch persisted memories from database
    const persistedMemories = await getRelevantMemories();
    if (persistedMemories && !storyState.isActive) {
      systemPrompt.push({
        role: 'system',
        content: persistedMemories
      });
    }

    // Build conversation history for context - now including more messages
    const conversationHistory: Message[] = [
      ...systemPrompt,
      ...chatMessages
        .slice(-20) // Last 20 messages for better context
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
    
    // Track emotional interactions
    if (intent.shouldPrioritizeEmotion) {
      recordInteraction('emotional');
    }

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
            },
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
  }, [chatMessages, addChatMessage, updateChatMessage, userProfile, detectReminderIntent, addFromNaturalLanguage, generateReminderConfirmation, storyState, detectStoryIntent, startStory, endStory, getStorySystemPrompt, generateStoryStartMessage, getMemoryContext, checkSummarization, playText]);

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
    }
  };

  return { 
    sendMessage, 
    isThinking, 
    storyState, 
    endStory, 
    shouldAskMood, 
    markMoodAsked,
    pendingMemory,
    confirmPendingMemory,
    dismissPendingMemory,
  };
};
