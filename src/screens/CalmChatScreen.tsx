import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Mic, Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CalmChatBubble } from '@/components/CalmChatBubble';
import { MemorySavePrompt } from '@/components/MemorySavePrompt';
import { MediaToolsSheet } from '@/components/MediaToolsSheet';
import { ChatQuickActions } from '@/components/ChatQuickActions';
import { useAura } from '@/contexts/AuraContext';
import { useAuraChat } from '@/hooks/useAuraChat';
import { useVoiceFeedback } from '@/hooks/useVoiceFeedback';
import { useRotatingPlaceholder } from '@/hooks/useRotatingPlaceholder';
import { useMorningBriefing } from '@/hooks/useMorningBriefing';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import auraAvatar from '@/assets/aura-avatar.jpeg';

interface CalmChatScreenProps {
  onMenuClick?: () => void;
}

// Status messages that rotate
const STATUS_MESSAGES = [
  'Here with you',
  'Listening',
  'Ready when you are',
  'Taking it easy',
];

// Detect memory-worthy content
const detectMemoryIntent = (message: string): boolean => {
  const patterns = [
    /remind me/i,
    /remember (that|this)/i,
    /don't forget/i,
    /i should/i,
    /i need to/i,
    /i have to/i,
    /my .+ is/i,
    /i like/i,
    /i prefer/i,
    /i'm allergic/i,
    /my birthday/i,
    /my anniversary/i,
  ];
  return patterns.some(p => p.test(message));
};

export const CalmChatScreen: React.FC<CalmChatScreenProps> = ({ onMenuClick }) => {
  const { chatMessages, addChatMessage, userProfile } = useAura();
  const { sendMessage, isThinking } = useAuraChat();
  const { speak, isSpeaking } = useVoiceFeedback();
  const { placeholder } = useRotatingPlaceholder(6000);
  const { briefing, isLoading: isBriefingLoading, fetchBriefing } = useMorningBriefing();
  
  const [inputValue, setInputValue] = useState('');
  const [statusIndex, setStatusIndex] = useState(0);
  const [memoryPrompt, setMemoryPrompt] = useState<{ content: string; show: boolean }>({ content: '', show: false });
  const [showMorningFlow, setShowMorningFlow] = useState(false);
  const [showMediaSheet, setShowMediaSheet] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Rotate status message
  useEffect(() => {
    const timer = setInterval(() => {
      setStatusIndex(prev => (prev + 1) % STATUS_MESSAGES.length);
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  // Check for morning flow - only fetch briefing if user is authenticated
  useEffect(() => {
    const checkMorningFlow = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return; // Don't fetch if not authenticated
      
      const hour = new Date().getHours();
      const lastShown = localStorage.getItem('aura-morning-flow-date');
      const today = new Date().toISOString().split('T')[0];
      
      if (hour >= 5 && hour < 11 && lastShown !== today && chatMessages.length <= 1) {
        setShowMorningFlow(true);
        localStorage.setItem('aura-morning-flow-date', today);
        fetchBriefing();
      }
    };
    
    checkMorningFlow();
  }, [chatMessages.length, fetchBriefing]);

  // Hide quick actions when chat has messages (user messages specifically)
  useEffect(() => {
    const hasUserMessages = chatMessages.some(m => m.sender === 'user');
    setShowQuickActions(!hasUserMessages);
  }, [chatMessages]);

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, scrollToBottom]);

  // Initial greeting
  useEffect(() => {
    if (chatMessages.length === 0 && userProfile.onboardingComplete) {
      const hour = new Date().getHours();
      let greeting = '';
      
      if (hour >= 5 && hour < 12) {
        greeting = `Good morning, ${userProfile.name} ☀️`;
      } else if (hour >= 12 && hour < 17) {
        greeting = `Hey ${userProfile.name} 👋`;
      } else if (hour >= 17 && hour < 21) {
        greeting = `Good evening, ${userProfile.name} 🌆`;
      } else {
        greeting = `Hey ${userProfile.name}, still up? 🌙`;
      }
      
      addChatMessage({ content: greeting, sender: 'aura' });
    }
  }, [userProfile.onboardingComplete, userProfile.name, chatMessages.length, addChatMessage]);

  const handleSend = async (messageOverride?: string) => {
    const messageToSend = messageOverride || inputValue.trim();
    if (!messageToSend || isThinking) return;

    setInputValue('');
    setShowQuickActions(false);
    
    // Reset textarea height
    if (inputRef.current) {
      inputRef.current.style.height = '44px';
    }

    // Check for memory intent
    const noPrompts = localStorage.getItem('aura-no-memory-prompts') === 'true';
    if (!noPrompts && detectMemoryIntent(messageToSend)) {
      // Save and show prompt after a delay
      setTimeout(() => {
        setMemoryPrompt({ content: messageToSend, show: true });
      }, 2000);
    }

    await sendMessage(messageToSend);
  };

  const handleSpeak = async (text: string) => {
    await speak(text);
  };

  const handleMorningQuestion = async (answer: string) => {
    setShowMorningFlow(false);
    await handleSend(answer);
  };

  const handleQuickAction = async (actionId: string, message: string) => {
    await handleSend(message);
  };

  const handleMediaAction = async (actionId: string, message: string) => {
    await handleSend(message);
  };

  const currentStatus = isThinking ? 'Thinking...' : isSpeaking ? 'Speaking...' : STATUS_MESSAGES[statusIndex];

  return (
    <div className="flex flex-col h-full bg-background relative overflow-hidden">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />

      {/* Minimal Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/30">
        <div className="flex items-center justify-between px-4 py-3 pl-14">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-primary/20 shadow-lg shadow-primary/10">
              <img src={auraAvatar} alt="AURA" className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="font-semibold text-foreground">AURA</h1>
              <motion.p 
                key={currentStatus}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-muted-foreground"
              >
                {currentStatus}
              </motion.p>
            </div>
          </div>
        </div>
      </header>

      {/* Morning Flow */}
      <AnimatePresence>
        {showMorningFlow && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="px-4 py-4"
          >
            <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl p-5 border border-primary/20">
              <p className="text-lg font-medium text-foreground mb-1">
                Good morning, {userProfile.name} ☀️
              </p>
              {isBriefingLoading ? (
                <p className="text-sm text-muted-foreground">Checking the day...</p>
              ) : briefing ? (
                <p className="text-sm text-muted-foreground mb-4">{briefing.weather}</p>
              ) : null}
              
              <p className="text-sm text-foreground mt-4 mb-3">
                What's the one thing you want to get done today?
              </p>
              
              <div className="flex flex-wrap gap-2">
                {['Work on project', 'Take it easy', 'Exercise', 'Catch up with someone'].map(opt => (
                  <Button
                    key={opt}
                    variant="outline"
                    size="sm"
                    className="rounded-full text-xs bg-background/50"
                    onClick={() => handleMorningQuestion(opt)}
                  >
                    {opt}
                  </Button>
                ))}
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                className="mt-3 text-xs text-muted-foreground"
                onClick={() => setShowMorningFlow(false)}
              >
                Skip for now
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-2xl mx-auto space-y-5">
          {chatMessages.map((message, index) => (
            <CalmChatBubble
              key={message.id}
              content={message.content}
              sender={message.sender}
              timestamp={message.timestamp}
              onSpeak={message.sender === 'aura' ? handleSpeak : undefined}
              isLatest={index === chatMessages.length - 1}
            />
          ))}

          {/* Quick Actions - Show when chat is empty or minimal */}
          <AnimatePresence>
            {showQuickActions && !showMorningFlow && chatMessages.length <= 1 && (
              <ChatQuickActions 
                onAction={handleQuickAction}
                className="py-6"
              />
            )}
          </AnimatePresence>

          {/* Memory Save Prompt */}
          <AnimatePresence>
            {memoryPrompt.show && (
              <MemorySavePrompt
                content={memoryPrompt.content}
                onClose={() => setMemoryPrompt({ content: '', show: false })}
              />
            )}
          </AnimatePresence>

          {/* Typing Indicator */}
          {isThinking && chatMessages[chatMessages.length - 1]?.sender === 'user' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3"
            >
              <div className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-primary/10">
                <img src={auraAvatar} alt="AURA" className="w-full h-full object-cover" />
              </div>
              <div className="bg-card/80 backdrop-blur-sm border border-border/40 px-4 py-3 rounded-2xl rounded-bl-sm">
                <div className="flex gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </motion.div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="p-4 pb-6 bg-gradient-to-t from-background via-background to-transparent">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-end gap-2">
            {/* Plus Button for Media & Tools */}
            <Button
              variant="ghost"
              size="icon"
              className="h-12 w-12 rounded-full shrink-0 text-muted-foreground hover:text-foreground hover:bg-accent/50"
              onClick={() => setShowMediaSheet(true)}
            >
              <Plus className="w-6 h-6" />
            </Button>

            {/* Input Container */}
            <div className="flex-1 relative">
              <div className="flex items-end bg-card border border-border/50 rounded-3xl focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/10 transition-all shadow-sm">
                <textarea
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => {
                    setInputValue(e.target.value);
                    e.target.style.height = 'auto';
                    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder={placeholder}
                  className="flex-1 bg-transparent border-0 resize-none py-3.5 px-5 text-[15px] focus:outline-none min-h-[48px] max-h-[120px] placeholder:text-muted-foreground/50"
                  style={{ height: '48px' }}
                  disabled={isThinking}
                  rows={1}
                />
                
                {/* Mic button inside input */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-full mr-1 mb-1 text-muted-foreground hover:text-foreground"
                  disabled={isThinking}
                >
                  <Mic className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Send Button */}
            <Button
              size="icon"
              className={cn(
                "h-12 w-12 rounded-full shadow-lg transition-all shrink-0",
                inputValue.trim() 
                  ? "bg-primary hover:bg-primary/90 shadow-primary/20" 
                  : "bg-muted text-muted-foreground"
              )}
              onClick={() => handleSend()}
              disabled={!inputValue.trim() || isThinking}
            >
              {isThinking ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>

          {/* Subtle hint */}
          <p className="text-center text-[11px] text-muted-foreground/40 mt-3">
            Press Enter to send • Shift+Enter for new line
          </p>
        </div>
      </div>

      {/* Media & Tools Bottom Sheet */}
      <MediaToolsSheet 
        open={showMediaSheet}
        onOpenChange={setShowMediaSheet}
        onAction={handleMediaAction}
      />
    </div>
  );
};
