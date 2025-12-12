import { useState, useCallback } from 'react';
import { useAura, ChatMessage } from '@/contexts/AuraContext';
import { toast } from 'sonner';

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/aura-chat`;

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export const useAuraChat = () => {
  const { chatMessages, addChatMessage, updateChatMessage, userProfile } = useAura();
  const [isThinking, setIsThinking] = useState(false);

  const sendMessage = useCallback(async (userMessage: string, preferredModel?: string) => {
    if (!userMessage.trim()) return;

    // Add user message
    addChatMessage({ content: userMessage, sender: 'user' });
    setIsThinking(true);

    // Build conversation history for context - now including more messages
    const conversationHistory: Message[] = chatMessages
      .slice(-20) // Last 20 messages for better context
      .map((msg: ChatMessage) => ({
        role: msg.sender === 'user' ? 'user' : 'assistant' as const,
        content: msg.content,
      }));
    
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
  }, [chatMessages, addChatMessage, updateChatMessage, userProfile]);

  return { sendMessage, isThinking };
};
