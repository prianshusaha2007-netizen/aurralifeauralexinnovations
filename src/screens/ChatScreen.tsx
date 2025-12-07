import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, Volume2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AuraOrb } from '@/components/AuraOrb';
import { ChatBubble } from '@/components/ChatBubble';
import { VoiceModal } from '@/components/VoiceModal';
import { AutomationModal } from '@/components/AutomationModal';
import { useAura } from '@/contexts/AuraContext';
import { useAuraChat } from '@/hooks/useAuraChat';
import { cn } from '@/lib/utils';

export const ChatScreen: React.FC = () => {
  const { chatMessages, addChatMessage, userProfile } = useAura();
  const { sendMessage, isThinking } = useAuraChat();
  const [inputValue, setInputValue] = useState('');
  const [voiceModal, setVoiceModal] = useState<'speak' | 'listen' | null>(null);
  const [showAutomation, setShowAutomation] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  // Send initial greeting if no messages
  useEffect(() => {
    if (chatMessages.length === 0 && userProfile.onboardingComplete) {
      const greeting = `Hey ${userProfile.name}! 💫 I'm so happy to see you. How are you feeling today? Share anything with me—I'm here to listen, help, and keep you company.`;
      addChatMessage({ content: greeting, sender: 'aura' });
    }
  }, [userProfile.onboardingComplete]);

  const handleSend = async () => {
    if (!inputValue.trim() || isThinking) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    await sendMessage(userMessage);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header with Orb */}
      <div className="flex flex-col items-center pt-6 pb-4 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
        <AuraOrb size="md" isThinking={isThinking} className="animate-float" />
        <h1 className="mt-4 text-lg font-semibold aura-gradient-text">AURA</h1>
        <p className="text-xs text-muted-foreground">
          {isThinking ? 'Thinking...' : 'Your AI Companion'}
        </p>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-4">
        {chatMessages.map((message) => (
          <ChatBubble
            key={message.id}
            content={message.content}
            sender={message.sender}
            timestamp={message.timestamp}
          />
        ))}
        
        {isThinking && chatMessages[chatMessages.length - 1]?.sender === 'user' && (
          <div className="flex justify-start">
            <div className="bg-aura-bubble-ai px-4 py-3 rounded-2xl rounded-bl-md">
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-muted-foreground animate-thinking" />
                <span className="w-2 h-2 rounded-full bg-muted-foreground animate-thinking" style={{ animationDelay: '0.2s' }} />
                <span className="w-2 h-2 rounded-full bg-muted-foreground animate-thinking" style={{ animationDelay: '0.4s' }} />
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 pb-24 bg-gradient-to-t from-background via-background to-transparent">
        <div className="flex items-center gap-2 max-w-lg mx-auto">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full shrink-0 text-muted-foreground hover:text-primary"
            onClick={() => setVoiceModal('speak')}
          >
            <Mic className="w-5 h-5" />
          </Button>
          
          <div className="flex-1 relative">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Talk to AURA..."
              className="rounded-full pr-12 bg-muted/50 border-border/50 focus:border-primary/50"
              disabled={isThinking}
            />
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'absolute right-1 top-1/2 -translate-y-1/2 rounded-full',
                'text-muted-foreground hover:text-primary',
                inputValue.trim() && 'text-primary'
              )}
              onClick={handleSend}
              disabled={!inputValue.trim() || isThinking}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full shrink-0 text-muted-foreground hover:text-primary"
            onClick={() => setVoiceModal('listen')}
          >
            <Volume2 className="w-5 h-5" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full shrink-0 text-muted-foreground hover:text-accent"
            onClick={() => setShowAutomation(true)}
          >
            <Sparkles className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Modals */}
      <VoiceModal
        isOpen={voiceModal !== null}
        onClose={() => setVoiceModal(null)}
        mode={voiceModal || 'speak'}
      />
      
      <AutomationModal
        isOpen={showAutomation}
        onClose={() => setShowAutomation(false)}
      />
    </div>
  );
};
