import { useState, useCallback } from 'react';
import { useAura, ChatMessage } from '@/contexts/AuraContext';
import { toast } from 'sonner';
import { useReminderIntentDetection } from './useReminderIntentDetection';
import { useReminders } from './useReminders';
import { useStorytellingMode } from './useStorytellingMode';

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/aura-chat`;

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
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
      const reminder = await addFromNaturalLanguage(userMessage);
      if (reminder) {
        const confirmation = generateReminderConfirmation(reminder.title, reminderIntent.timeText);
        addChatMessage({ content: confirmation, sender: 'aura' });
        return;
      }
    }

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

    let assistantContent = '';
    let messageId: string | null = null;

    try {
      const response = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
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
  }, [chatMessages, addChatMessage, updateChatMessage, userProfile, detectReminderIntent, addFromNaturalLanguage, generateReminderConfirmation, storyState, detectStoryIntent, startStory, endStory, getStorySystemPrompt, generateStoryStartMessage]);

  // Helper function for streaming story responses
  const streamStoryResponse = async (conversationHistory: Message[], preferredModel?: string) => {
    let assistantContent = '';
    let messageId: string | null = null;

    try {
      const response = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
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

  return { sendMessage, isThinking, storyState, endStory };
};
