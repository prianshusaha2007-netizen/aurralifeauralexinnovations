import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Plus, Loader2, Download, RefreshCw, Headphones, ChevronDown, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CalmChatBubble } from '@/components/CalmChatBubble';
import { ThinkingIndicator } from '@/components/ThinkingIndicator';
import { MemorySavePrompt } from '@/components/MemorySavePrompt';
import { MediaToolsSheet } from '@/components/MediaToolsSheet';
import { ChatQuickActions } from '@/components/ChatQuickActions';
import { VoiceInputButton } from '@/components/VoiceInputButton';
import { VoiceModal } from '@/components/VoiceModal';
import { WeeklyReflectionModal } from '@/components/WeeklyReflectionModal';
import { CodingMentorBanner, CodingMentorMode } from '@/components/CodingMentorMode';
import { RoutineVisualCard, RoutineVisualButton } from '@/components/RoutineVisualCard';
import { RoutineWidget } from '@/components/RoutineWidget';
import { SkillsWidget } from '@/components/SkillsWidget';
import { useAura } from '@/contexts/AuraContext';
import { useAuraChat } from '@/hooks/useAuraChat';
import { useVoiceFeedback } from '@/hooks/useVoiceFeedback';
import { useRotatingPlaceholder } from '@/hooks/useRotatingPlaceholder';
import { useMorningBriefing } from '@/hooks/useMorningBriefing';
import { useMediaActions } from '@/hooks/useMediaActions';
import { useWeeklyReflection } from '@/hooks/useWeeklyReflection';
import { useRoutineBlocks } from '@/hooks/useRoutineBlocks';
import { useRoutineVisualization } from '@/hooks/useRoutineVisualization';
import { useSkillsProgress } from '@/hooks/useSkillsProgress';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
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

// Detect image generation intent
const detectImageGenIntent = (message: string): boolean => {
  const patterns = [
    /generate (?:an? )?image/i,
    /create (?:an? )?image/i,
    /make (?:an? )?(?:picture|image)/i,
    /draw (?:me )?/i,
    /image (?:banao|banana|bana)/i,
    /🎨.*(?:image|picture)/i,
  ];
  return patterns.some(p => p.test(message));
};

// Detect document creation intent
const detectDocIntent = (message: string): boolean => {
  const patterns = [
    /create (?:a )?(?:document|doc|pdf)/i,
    /make (?:a )?(?:document|doc|pdf)/i,
    /write (?:a )?(?:document|doc)/i,
    /draft (?:a )?(?:document|doc)/i,
  ];
  return patterns.some(p => p.test(message));
};

export const CalmChatScreen: React.FC<CalmChatScreenProps> = ({ onMenuClick }) => {
  const navigate = useNavigate();
  const { chatMessages, addChatMessage, userProfile } = useAura();
  const { sendMessage, isThinking } = useAuraChat();
  const { speak, isSpeaking } = useVoiceFeedback();
  const { placeholder } = useRotatingPlaceholder(6000);
  const { briefing, isLoading: isBriefingLoading, fetchBriefing } = useMorningBriefing();
  const { analyzeFile, generateImage, createDocument, downloadDocument, downloadImage, isUploading, isGenerating, isCreatingDoc } = useMediaActions();
  const { showReflectionPrompt, lastWeekStats, saveReflection, dismissReflection } = useWeeklyReflection();
  const { activeBlock, blocks } = useRoutineBlocks();
  const { hasActiveSkills, getActiveSkills } = useSkillsProgress();
  const { 
    routineVisual, 
    isGenerating: isGeneratingVisual, 
    showVisual, 
    detectRoutineConfirmation, 
    generateRoutineVisual, 
    dismissVisual, 
    openVisual, 
    getVisualMessage 
  } = useRoutineVisualization();
  
  const [inputValue, setInputValue] = useState('');
  const [statusIndex, setStatusIndex] = useState(0);
  const [memoryPrompt, setMemoryPrompt] = useState<{ content: string; show: boolean }>({ content: '', show: false });
  const [showMorningFlow, setShowMorningFlow] = useState(false);
  const [showMediaSheet, setShowMediaSheet] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const [showVoiceMode, setShowVoiceMode] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<{ url: string; prompt: string } | null>(null);
  const [generatedDoc, setGeneratedDoc] = useState<{ title: string; html: string; text: string } | null>(null);
  const [showFloatingVoice, setShowFloatingVoice] = useState(false);
  const [shouldPulse, setShouldPulse] = useState(false);
  const [showVoiceTooltip, setShowVoiceTooltip] = useState(false);
  const [showCodingMentor, setShowCodingMentor] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isNearBottom, setIsNearBottom] = useState(true);
  
  // Check if coding block is active
  const isCodingBlockActive = activeBlock?.block.type === 'coding';
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const hasShownTooltipRef = useRef(localStorage.getItem('aura-voice-tooltip-shown') === 'true');

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

  // Scroll to bottom with smooth animation
  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior
      });
    }
  }, []);

  // Auto-scroll when new messages arrive (only if near bottom)
  useEffect(() => {
    if (isNearBottom) {
      // Small delay to ensure content is rendered
      requestAnimationFrame(() => {
        scrollToBottom('smooth');
      });
    }
  }, [chatMessages, scrollToBottom, isNearBottom]);

  // Track scroll position for floating buttons
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      
      // Show scroll button if more than 200px from bottom
      setShowScrollButton(distanceFromBottom > 200);
      
      // Consider "near bottom" if within 100px
      setIsNearBottom(distanceFromBottom < 100);
      
      // Show floating voice button when scrolled down
      setShowFloatingVoice(scrollTop > 100);
      
      // Reset activity timer on scroll
      lastActivityRef.current = Date.now();
      setShouldPulse(false);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // Pulse animation after inactivity (30 seconds)
  useEffect(() => {
    const checkInactivity = setInterval(() => {
      const inactiveTime = Date.now() - lastActivityRef.current;
      // Start pulsing after 30 seconds of inactivity, only if floating button is visible
      if (inactiveTime > 30000 && showFloatingVoice && !showVoiceMode) {
        setShouldPulse(true);
        // Show tooltip on first pulse only
        if (!hasShownTooltipRef.current) {
          setShowVoiceTooltip(true);
          hasShownTooltipRef.current = true;
          localStorage.setItem('aura-voice-tooltip-shown', 'true');
          // Auto-hide tooltip after 6 seconds
          setTimeout(() => setShowVoiceTooltip(false), 6000);
        }
      }
    }, 5000);

    return () => clearInterval(checkInactivity);
  }, [showFloatingVoice, showVoiceMode]);

  // Reset activity on user interaction
  useEffect(() => {
    lastActivityRef.current = Date.now();
    setShouldPulse(false);
    setShowVoiceTooltip(false);
  }, [chatMessages, inputValue]);

  // Initial greeting - simple, human, not overwhelming
  useEffect(() => {
    if (chatMessages.length === 0 && userProfile.onboardingComplete) {
      const hour = new Date().getHours();
      let greeting = '';
      
      // Simple, calm greetings - no feature explanations
      if (hour >= 5 && hour < 12) {
        greeting = `Good morning, ${userProfile.name}. How are you feeling today?`;
      } else if (hour >= 12 && hour < 17) {
        greeting = `Hey ${userProfile.name}. How's your day going?`;
      } else if (hour >= 17 && hour < 21) {
        greeting = `Good evening, ${userProfile.name}. How are you?`;
      } else {
        greeting = `Hey ${userProfile.name}. Still up? 🌙`;
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

    // Check for image generation intent
    if (detectImageGenIntent(messageToSend)) {
      addChatMessage({ content: messageToSend, sender: 'user' });
      addChatMessage({ content: "Creating your image... 🎨", sender: 'aura' });
      
      const result = await generateImage(messageToSend);
      if (result) {
        setGeneratedImage({ url: result.imageUrl, prompt: result.prompt });
        addChatMessage({ 
          content: `Here's what I created! ${result.textContent}\n\n[Generated Image]`, 
          sender: 'aura' 
        });
      } else {
        addChatMessage({ content: "Sorry, I couldn't generate that image. Want to try again?", sender: 'aura' });
      }
      return;
    }

    // Check for routine confirmation intent - auto-generate visual
    if (detectRoutineConfirmation(messageToSend) && blocks.length > 0) {
      // Generate the routine visual in the background
      generateRoutineVisual(blocks).then((visual) => {
        if (visual) {
          const message = getVisualMessage();
          addChatMessage({ content: message, sender: 'aura' });
        }
      });
    }

    // Check for memory intent
    const noPrompts = localStorage.getItem('aura-no-memory-prompts') === 'true';
    if (!noPrompts && detectMemoryIntent(messageToSend)) {
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

  const handleFileSelect = async (file: File) => {
    addChatMessage({ content: `Uploading ${file.name}...`, sender: 'user' });
    addChatMessage({ content: `Analyzing your file... 📎`, sender: 'aura' });
    
    const result = await analyzeFile(file);
    if (result) {
      addChatMessage({ 
        content: result.analysis, 
        sender: 'aura' 
      });
    } else {
      addChatMessage({ 
        content: "I had trouble analyzing that file. Could you try again?", 
        sender: 'aura' 
      });
    }
  };

  const handleVoiceTranscript = async (transcript: string) => {
    if (transcript) {
      setInputValue(transcript);
      // Auto-send after a brief delay
      setTimeout(() => {
        handleSend(transcript);
      }, 300);
    }
  };

  const currentStatus = isThinking || isGenerating || isCreatingDoc 
    ? 'Thinking...' 
    : isSpeaking 
    ? 'Speaking...' 
    : isUploading 
    ? 'Analyzing...'
    : STATUS_MESSAGES[statusIndex];

  return (
    <div className="flex flex-col h-full bg-background relative">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />

      {/* Fixed Header */}
      <header className="flex-shrink-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/30">
        <div className="flex items-center justify-between px-4 py-3 pl-14">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-primary/20 shadow-lg shadow-primary/10">
              <img src={auraAvatar} alt="AURRA" className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="font-semibold text-foreground">AURRA</h1>
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
          
          <div className="flex items-center gap-2">
            {/* Skills Button - shows when user has active skills */}
            {hasActiveSkills() && (
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full h-10 w-10 text-muted-foreground hover:text-primary hover:bg-primary/10 relative"
                onClick={() => navigate('/skills')}
              >
                <Target className="w-5 h-5" />
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-primary rounded-full" />
              </Button>
            )}
            
            {/* Routine Visual Button - shows when visual exists but is hidden */}
            {routineVisual && !showVisual && (
              <RoutineVisualButton
                hasVisual={!!routineVisual}
                onClick={openVisual}
              />
            )}
            
            {/* Voice Mode Button */}
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full h-10 w-10 text-muted-foreground hover:text-primary hover:bg-primary/10"
              onClick={() => setShowVoiceMode(true)}
            >
              <Headphones className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Coding Mentor Banner - shows during coding blocks */}
      <AnimatePresence>
        {isCodingBlockActive && !showCodingMentor && (
          <CodingMentorBanner onActivate={() => setShowCodingMentor(true)} />
        )}
      </AnimatePresence>

      {/* Morning Flow - soft, not interrogative */}
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
                Good morning, {userProfile.name}
              </p>
              {isBriefingLoading ? (
                <p className="text-sm text-muted-foreground">Checking the weather...</p>
              ) : briefing ? (
                <p className="text-sm text-muted-foreground mb-4">{briefing.weather}</p>
              ) : null}
              
              {/* Routine Visual Nudge */}
              {routineVisual && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  className="mt-4 mb-4"
                >
                  <p className="text-xs text-muted-foreground mb-2">Your day at a glance</p>
                  <div 
                    className="relative rounded-xl overflow-hidden cursor-pointer group"
                    onClick={openVisual}
                  >
                    <img 
                      src={routineVisual.imageUrl} 
                      alt="Your routine" 
                      className="w-full h-32 object-cover transition-transform group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />
                    <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                      <span className="text-xs font-medium text-foreground">
                        {routineVisual.blocksCount} blocks today
                      </span>
                      <Button size="sm" variant="secondary" className="h-6 text-xs rounded-full">
                        View
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
              
              <p className="text-sm text-foreground mt-4 mb-3">
                Does today feel like a light day or a push day?
              </p>
              
              <div className="flex flex-wrap gap-2">
                {['Light day', 'Push day', 'Not sure yet'].map(opt => (
                  <Button
                    key={opt}
                    variant="outline"
                    size="sm"
                    className="rounded-full text-xs bg-background/50"
                    onClick={() => handleMorningQuestion(`Today feels like a ${opt.toLowerCase()}`)}
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
                Skip
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Routine Widget - shows when not in morning flow and has blocks */}
      {!showMorningFlow && chatMessages.length <= 1 && (
        <div className="px-4 pb-2 space-y-2">
          <RoutineWidget 
            onViewVisual={openVisual}
            onViewRoutine={() => {
              // Navigate to routine screen would happen via parent
            }}
          />
          {/* Skills Widget - compact view in header area */}
          {hasActiveSkills() && (
            <SkillsWidget onNavigate={() => navigate('/skills')} />
          )}
        </div>
      )}

      {/* Chat Messages */}
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto px-4 py-6">
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

          {/* Generated Image Display */}
          <AnimatePresence>
            {generatedImage && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex gap-3"
              >
                <div className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-primary/10 shrink-0">
                  <img src={auraAvatar} alt="AURRA" className="w-full h-full object-cover" />
                </div>
                <div className="bg-card/80 backdrop-blur-sm border border-border/40 p-4 rounded-2xl rounded-bl-sm max-w-sm">
                  <img 
                    src={generatedImage.url} 
                    alt={generatedImage.prompt}
                    className="rounded-lg w-full mb-3"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full text-xs gap-1"
                      onClick={() => downloadImage(generatedImage.url, 'aura-image.png')}
                    >
                      <Download className="w-3 h-3" />
                      Download
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full text-xs gap-1"
                      onClick={() => handleSend(`Generate another image: ${generatedImage.prompt}`)}
                    >
                      <RefreshCw className="w-3 h-3" />
                      Regenerate
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Routine Visual Display */}
          {routineVisual && (
            <RoutineVisualCard
              imageUrl={routineVisual.imageUrl}
              isVisible={showVisual}
              isGenerating={isGeneratingVisual}
              onDismiss={dismissVisual}
              onRegenerate={() => generateRoutineVisual(blocks)}
              className="max-w-sm"
            />
          )}

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
          {(isThinking || isGenerating || isCreatingDoc) && chatMessages[chatMessages.length - 1]?.sender === 'user' && (
            <ThinkingIndicator />
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Floating Scroll to Bottom Button */}
      <AnimatePresence>
        {showScrollButton && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            className="absolute bottom-32 left-1/2 -translate-x-1/2 z-40"
          >
            <Button
              size="sm"
              variant="secondary"
              className="rounded-full shadow-lg gap-1.5 px-4 bg-card/95 backdrop-blur-sm border border-border/50 hover:bg-card"
              onClick={() => scrollToBottom('smooth')}
            >
              <ChevronDown className="w-4 h-4" />
              <span className="text-xs">New messages</span>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Voice Button */}
      <AnimatePresence>
        {showFloatingVoice && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="fixed bottom-28 right-6 z-40"
          >
            <div className="relative">
              {/* Pulse ring animation */}
              {shouldPulse && (
                <motion.div
                  className="absolute inset-0 rounded-full bg-primary/30"
                  initial={{ scale: 1, opacity: 0.6 }}
                  animate={{ scale: 1.8, opacity: 0 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                />
              )}
              
              {/* Tooltip */}
              <AnimatePresence>
                {showVoiceTooltip && (
                  <motion.div
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="absolute right-full mr-3 top-1/2 -translate-y-1/2 whitespace-nowrap"
                  >
                    <div className="bg-card border border-border/50 shadow-lg rounded-xl px-4 py-2.5">
                      <p className="text-sm font-medium text-foreground">Try voice mode 🎧</p>
                      <p className="text-xs text-muted-foreground">Talk naturally with AURRA</p>
                    </div>
                    {/* Arrow */}
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full">
                      <div className="border-8 border-transparent border-l-card" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              
              <Button
                size="icon"
                className="h-14 w-14 rounded-full aura-gradient shadow-lg shadow-primary/30 hover:shadow-primary/40 transition-shadow relative"
                onClick={() => {
                  setShowVoiceMode(true);
                  setShouldPulse(false);
                  setShowVoiceTooltip(false);
                  lastActivityRef.current = Date.now();
                }}
              >
                <Headphones className="w-6 h-6 text-primary-foreground" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fixed Input Area */}
      <div className="flex-shrink-0 p-4 pb-6 bg-gradient-to-t from-background via-background to-transparent border-t border-border/30">
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
                  disabled={isThinking || isGenerating}
                  rows={1}
                />
                
                {/* Voice Input Button */}
                <VoiceInputButton
                  onTranscript={handleVoiceTranscript}
                  disabled={isThinking || isGenerating}
                  className="mr-1 mb-1"
                />
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
              disabled={!inputValue.trim() || isThinking || isGenerating}
            >
              {isThinking || isGenerating ? (
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
        onFileSelect={handleFileSelect}
        isUploading={isUploading}
      />

      {/* Voice Mode Modal */}
      <VoiceModal
        isOpen={showVoiceMode}
        onClose={() => setShowVoiceMode(false)}
        userName={userProfile.name}
      />

      {/* Weekly Reflection Modal */}
      <WeeklyReflectionModal
        isOpen={showReflectionPrompt}
        onClose={dismissReflection}
        onSave={saveReflection}
        stats={lastWeekStats}
        userName={userProfile.name}
      />

      {/* Coding Mentor Full Screen */}
      <AnimatePresence>
        {showCodingMentor && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background"
          >
            <div className="h-full flex flex-col">
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h2 className="font-semibold">Coding Mentor</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCodingMentor(false)}
                >
                  Back to Chat
                </Button>
              </div>
              <div className="flex-1">
                <CodingMentorMode
                  isActive={true}
                  onSendMessage={async (message, type) => {
                    // Use the existing chat to get coding help
                    const response = await sendMessage(`[Coding ${type}]: ${message}`);
                    return chatMessages[chatMessages.length - 1]?.content || "I'm here to help with your code!";
                  }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
