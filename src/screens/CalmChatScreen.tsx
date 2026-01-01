import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, Plus, Loader2, Download, RefreshCw, Headphones, ChevronDown, MoreVertical, Mic, CreditCard, Sparkles } from 'lucide-react';
import { useChatGestures } from '@/hooks/useChatGestures';
import { Button } from '@/components/ui/button';
import { SplitChatBubble } from '@/components/SplitChatBubble';
import { TypingIndicator } from '@/components/TypingIndicator';
import { MemorySavePrompt } from '@/components/MemorySavePrompt';
import { MediaToolsSheet } from '@/components/MediaToolsSheet';
import { ContextShortcutsSheet } from '@/components/ContextShortcutsSheet';
import { MoreMenuSheet } from '@/components/MoreMenuSheet';
import { ChatQuickActions } from '@/components/ChatQuickActions';
import { InlineSettingsCard, SettingsCardType } from '@/components/InlineSettingsCards';
import { VoiceInputButton } from '@/components/VoiceInputButton';
import { VoiceModal } from '@/components/VoiceModal';
import { WeeklyReflectionModal } from '@/components/WeeklyReflectionModal';
import { CodingMentorBanner, CodingMentorMode } from '@/components/CodingMentorMode';
import { RoutineVisualCard, RoutineVisualButton } from '@/components/RoutineVisualCard';
import { RoutineWidget } from '@/components/RoutineWidget';
import { SkillsWidget } from '@/components/SkillsWidget';
import { SkillSessionTimer } from '@/components/SkillSessionTimer';
import { CreditWarning } from '@/components/CreditWarning';
import { CreditLoadingSkeleton } from '@/components/CreditLoadingSkeleton';
import { UpgradeSheet } from '@/components/UpgradeSheet';
import { StatusIndicator, AuraStatus } from '@/components/StatusIndicator';
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
import { useCreditWarning } from '@/hooks/useCreditWarning';
import { useDailyFlow } from '@/hooks/useDailyFlow';
import { useRealtimeContext } from '@/hooks/useRealtimeContext';
import { useSettingsIntent } from '@/hooks/useSettingsIntent';
import { useWeatherSuggestions } from '@/hooks/useWeatherSuggestions';
import { FirstTimePreferences } from '@/components/FirstTimePreferences';
import { NightWindDown } from '@/components/NightWindDown';
import { MorningBriefingCard } from '@/components/MorningBriefingCard';
import { DailyFlowDebugPanel } from '@/components/DailyFlowDebugPanel';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import auraAvatar from '@/assets/aura-avatar.jpeg';

interface CalmChatScreenProps {
  onMenuClick?: () => void;
  onNewChat?: () => void;
}

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

export const CalmChatScreen: React.FC<CalmChatScreenProps> = ({ onMenuClick, onNewChat }) => {
  const navigate = useNavigate();
  const { chatMessages, addChatMessage, userProfile } = useAura();
  const { sendMessage, isThinking, showUpgradeSheet: chatUpgradeSheet, setShowUpgradeSheet: setChatUpgradeSheet, focusState } = useAuraChat();
  const { speak, isSpeaking } = useVoiceFeedback();
  const { placeholder } = useRotatingPlaceholder(6000);
  const { briefing, isLoading: isBriefingLoading, fetchBriefing } = useMorningBriefing();
  const { analyzeFile, generateImage, createDocument, downloadDocument, downloadImage, isUploading, isGenerating, isCreatingDoc } = useMediaActions();
  const { showReflectionPrompt, lastWeekStats, saveReflection, dismissReflection } = useWeeklyReflection();
  const { activeBlock, blocks } = useRoutineBlocks();
  const { hasActiveSkills, getActiveSkills, currentSession } = useSkillsProgress();
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
  
  // Credit warning system
  const {
    showSoftWarning,
    showLimitWarning,
    creditStatus,
    dismissSoftWarning,
    dismissLimitWarning,
    checkAndShowWarning,
  } = useCreditWarning();
  
  // 24-hour daily flow
  const {
    showPreferences,
    showMorningBriefing,
    showWindDown,
    isFirstTimeUser,
    dismissPreferences,
    dismissMorningBriefing,
    dismissWindDown,
    triggerMorningFlow,
    triggerNightFlow,
    triggerFirstTimeFlow,
    resetAllFlowState,
  } = useDailyFlow();
  
  // Real-time context (location, weather, time awareness)
  const { context: realtimeContext } = useRealtimeContext();
  
  // Settings intent detection
  const { detectSettingsIntent } = useSettingsIntent();
  
  // Weather-based proactive suggestions
  const { triggerSuggestion, shouldProactivelySuggest } = useWeatherSuggestions(realtimeContext);
  
  const [inputValue, setInputValue] = useState('');
  const [memoryPrompt, setMemoryPrompt] = useState<{ content: string; show: boolean }>({ content: '', show: false });
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
  const [showUpgradeSheet, setShowUpgradeSheet] = useState(false);
  const [showContextSheet, setShowContextSheet] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [longPressVoiceActive, setLongPressVoiceActive] = useState(false);
  const [activeSettingsCard, setActiveSettingsCard] = useState<SettingsCardType>(null);
  const [isListening, setIsListening] = useState(false);
  
  // Check if coding block is active
  const isCodingBlockActive = activeBlock?.block.type === 'coding';
  
  // Chat gestures - long press for voice, swipe right for context shortcuts
  const { isLongPressing, gestureHandlers } = useChatGestures({
    onLongPress: () => {
      setLongPressVoiceActive(true);
      setShowVoiceMode(true);
    },
    onSwipeRight: () => {
      setShowContextSheet(true);
    },
    longPressDelay: 400,
    swipeThreshold: 80,
  });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const hasShownTooltipRef = useRef(localStorage.getItem('aura-voice-tooltip-shown') === 'true');
  const weatherSuggestionShownRef = useRef(false);


  // Fetch morning briefing when hook triggers it
  useEffect(() => {
    const fetchMorningBriefingData = async () => {
      if (!showMorningBriefing) return;
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      fetchBriefing();
    };
    
    fetchMorningBriefingData();
  }, [showMorningBriefing, fetchBriefing]);

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

  // Initial greeting - ONLY ONCE per day, not on every app open
  useEffect(() => {
    if (chatMessages.length === 0 && userProfile.onboardingComplete) {
      const today = new Date().toDateString();
      const lastGreetingDate = localStorage.getItem('aurra-last-greeting-date');
      
      // Only show greeting if it's a new day
      if (lastGreetingDate === today) {
        // Same day - use minimal return message
        addChatMessage({ content: "Ready when you are.", sender: 'aura' });
        return;
      }
      
      // New day - mark as greeted and show contextual greeting
      localStorage.setItem('aurra-last-greeting-date', today);
      
      const hour = new Date().getHours();
      let greeting = '';
      
      // Simple, contextual greetings - no feature explanations
      if (hour >= 5 && hour < 12) {
        greeting = `Morning, ${userProfile.name}. ☀️`;
      } else if (hour >= 12 && hour < 17) {
        greeting = `Hey ${userProfile.name}.`;
      } else if (hour >= 17 && hour < 21) {
        greeting = `Evening, ${userProfile.name}.`;
      } else {
        greeting = `Still up, ${userProfile.name}? 🌙`;
      }
      
      addChatMessage({ content: greeting, sender: 'aura' });
    }
  }, [userProfile.onboardingComplete, userProfile.name, chatMessages.length, addChatMessage]);

  // Weather-based proactive suggestions
  useEffect(() => {
    // Only trigger once per session when weather data is available
    if (weatherSuggestionShownRef.current) return;
    if (!realtimeContext.hasWeather || realtimeContext.isLoading) return;
    if (chatMessages.length === 0) return; // Wait for greeting first
    
    // Check if we should proactively suggest based on weather
    if (shouldProactivelySuggest()) {
      const suggestion = triggerSuggestion();
      if (suggestion) {
        weatherSuggestionShownRef.current = true;
        // Add a small delay after greeting
        setTimeout(() => {
          addChatMessage({ content: suggestion, sender: 'aura' });
        }, 2000);
      }
    }
  }, [realtimeContext.hasWeather, realtimeContext.isLoading, shouldProactivelySuggest, triggerSuggestion, chatMessages.length, addChatMessage]);

  const handleSend = async (messageOverride?: string) => {
    const messageToSend = messageOverride || inputValue.trim();
    if (!messageToSend || isThinking) return;

    // Check if user can still send messages (credits check)
    if (!creditStatus.canUseCredits && !creditStatus.isPremium) {
      // Show limit warning if not already shown
      checkAndShowWarning();
      return;
    }

    setInputValue('');
    setShowQuickActions(false);
    
    // Reset textarea height
    if (inputRef.current) {
      inputRef.current.style.height = '44px';
    }

    // Check for settings intent - show inline settings cards instead of AI response
    const settingsIntent = detectSettingsIntent(messageToSend);
    if (settingsIntent.shouldShowCard) {
      addChatMessage({ content: messageToSend, sender: 'user' });
      addChatMessage({ content: settingsIntent.confirmationMessage, sender: 'aura' });
      // Small delay to show the card after the message appears
      setTimeout(() => {
        setActiveSettingsCard(settingsIntent.type);
        scrollToBottom('smooth');
      }, 300);
      return;
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
      // Check credits after action
      setTimeout(() => checkAndShowWarning(), 500);
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
    
    // Check credits after message is sent - with delay to allow credit update
    setTimeout(() => checkAndShowWarning(), 1000);
  };

  const handleSpeak = async (text: string) => {
    await speak(text);
  };

  const handleMorningQuestion = async (answer: string) => {
    dismissMorningBriefing();
    await handleSend(answer);
  };

  const handleMorningBriefingAction = async (choice: 'light' | 'push') => {
    dismissMorningBriefing();
    localStorage.setItem('aura-day-mode', choice);
    
    const message = choice === 'light' 
      ? "I want to take it easy today. Let's keep things light."
      : "I'm ready to push harder today. Let's make progress!";
    
    await handleSend(message);
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

  // Derive AURRA's current status for the indicator
  const auraStatus: AuraStatus = isThinking || isGenerating || isCreatingDoc || isUploading
    ? 'thinking' 
    : isSpeaking 
    ? 'speaking' 
    : isListening || showVoiceMode
    ? 'listening'
    : 'idle';

  // Header height constant for proper spacing
  const HEADER_HEIGHT = 64;
  const INPUT_BAR_HEIGHT = 100;

  return (
    <div className="flex flex-col h-full bg-background relative">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />

      {/* Fixed Header - Truly fixed, never scrolls */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border/30" style={{ height: HEADER_HEIGHT }}>
        <div className="flex items-center justify-between px-4 py-3 pl-14 h-full">
          {/* Left: Avatar */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-primary/20 shadow-lg shadow-primary/10">
              <img src={auraAvatar} alt="AURRA" className="w-full h-full object-cover" />
            </div>
            {/* Center: Name & Status */}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-semibold text-foreground">AURRA</h1>
                {/* Time of day icon */}
                <span className="text-sm">
                  {realtimeContext.timeOfDay === 'morning' && '🌅'}
                  {realtimeContext.timeOfDay === 'afternoon' && '☀️'}
                  {realtimeContext.timeOfDay === 'evening' && '🌆'}
                  {realtimeContext.timeOfDay === 'night' && '🌙'}
                </span>
                {/* Weather & Temperature indicator */}
                {realtimeContext.hasWeather && realtimeContext.temperature !== null && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-muted/50 text-[10px] text-muted-foreground"
                  >
                    <span>{realtimeContext.weatherEmoji || '🌤️'}</span>
                    <span>{Math.round(realtimeContext.temperature)}°</span>
                  </motion.div>
                )}
              </div>
              {/* Status Indicator */}
              <StatusIndicator status={auraStatus} />
            </div>
          </div>
          
          {/* Right: Subscription, Voice & More buttons */}
          <div className="flex items-center gap-1">
            {/* Subscription Quick Access - shows plan badge for all users */}
            {!creditStatus.isLoading && (
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "rounded-full h-8 px-2.5 text-xs gap-1 transition-colors",
                  creditStatus.isPremium 
                    ? "text-primary hover:text-primary/80 hover:bg-primary/10" 
                    : "text-muted-foreground hover:text-primary hover:bg-primary/10",
                  !creditStatus.isPremium && creditStatus.usagePercent >= 80 && "animate-pulse text-amber-500 hover:text-amber-600"
                )}
                onClick={() => navigate('/subscription')}
              >
                {creditStatus.isPremium ? (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline capitalize">{creditStatus.tier}</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">
                      {creditStatus.usagePercent >= 100 ? 'Upgrade' : 'Free'}
                    </span>
                  </>
                )}
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
            
            {/* More Menu Button - Opens chat-binding menu */}
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full h-10 w-10 text-muted-foreground hover:text-foreground hover:bg-accent/50"
              onClick={() => setShowMoreMenu(true)}
            >
              <MoreVertical className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Spacer for fixed header */}
      <div style={{ height: HEADER_HEIGHT }} className="flex-shrink-0" />

      {/* Focus Mode Banner - shows when in focus mode */}
      <AnimatePresence>
        {focusState?.isActive && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="px-4 py-2"
          >
            <div className="bg-gradient-to-r from-violet-500/20 to-purple-500/20 rounded-xl p-3 border border-violet-500/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-violet-500 rounded-full animate-pulse" />
                <span className="font-medium text-violet-600 dark:text-violet-400">Focus Mode</span>
                <span className="text-sm text-muted-foreground">{focusState.formatTime(focusState.remainingTime)}</span>
              </div>
              <span className="text-xs text-muted-foreground">Say "end focus" to stop</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Coding Mentor Banner - shows during coding blocks */}
      <AnimatePresence>
        {isCodingBlockActive && !showCodingMentor && (
          <CodingMentorBanner onActivate={() => setShowCodingMentor(true)} />
        )}
      </AnimatePresence>

      {/* Morning Briefing Card - appears in chat style */}
      <AnimatePresence>
        {showMorningBriefing && (
          <div className="px-4 py-4">
            <MorningBriefingCard
              userName={userProfile.name}
              onDismiss={dismissMorningBriefing}
              onAction={handleMorningBriefingAction}
            />
          </div>
        )}
      </AnimatePresence>

      {/* Skill Session Timer - shows during active sessions */}
      <AnimatePresence>
        {currentSession && (
          <SkillSessionTimer compact={chatMessages.length > 1} />
        )}
      </AnimatePresence>

      {/* Routine Widget - shows when not in morning flow and has blocks */}
      {!showMorningBriefing && chatMessages.length <= 1 && !currentSession && (
        <div className="px-4 pb-2 space-y-2">
          <RoutineWidget 
            onViewVisual={openVisual}
            onViewRoutine={() => {
              // Send message to show routine in chat
              handleSend("Show me my routine for today");
            }}
          />
          {/* Skills Widget - compact view */}
          {hasActiveSkills() && (
            <SkillsWidget onNavigate={() => {
              // Send message to show skills in chat
              handleSend("Show my skills and progress");
            }} />
          )}
        </div>
      )}

      {/* Chat Messages - with gesture support */}
      <div 
        ref={chatContainerRef} 
        className="flex-1 overflow-y-auto px-4 py-6 relative"
        {...gestureHandlers}
      >
        {/* Long press indicator */}
        <AnimatePresence>
          {isLongPressing && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="fixed inset-0 z-40 flex items-center justify-center bg-background/80 backdrop-blur-sm"
            >
              <div className="flex flex-col items-center gap-3">
                <div className="w-20 h-20 rounded-full aura-gradient flex items-center justify-center animate-pulse">
                  <Mic className="w-10 h-10 text-primary-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground">Opening voice mode...</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <div className="max-w-2xl mx-auto space-y-5">
          {chatMessages.map((message, index) => (
            <SplitChatBubble
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

          {/* First Time Preferences Flow */}
          <AnimatePresence>
            {showPreferences && isFirstTimeUser && (
              <FirstTimePreferences
                onComplete={dismissPreferences}
                onSendMessage={handleSend}
              />
            )}
          </AnimatePresence>

          {/* Night Wind Down Flow */}
          <AnimatePresence>
            {showWindDown && !isFirstTimeUser && (
              <NightWindDown
                onDismiss={dismissWindDown}
                onSendMessage={handleSend}
              />
            )}
          </AnimatePresence>

          {/* Quick Actions - Show when chat is empty or minimal */}
          <AnimatePresence>
            {showQuickActions && !showMorningBriefing && !showPreferences && !showWindDown && chatMessages.length <= 1 && (
              <ChatQuickActions 
                onAction={handleQuickAction}
                className="py-6"
              />
            )}
          </AnimatePresence>

          {/* Inline Settings Cards - appear when settings intent is detected */}
          <AnimatePresence>
            {activeSettingsCard && (
              <InlineSettingsCard
                type={activeSettingsCard}
                onDismiss={() => setActiveSettingsCard(null)}
                onSettingsChanged={(message) => {
                  addChatMessage({ content: `✓ ${message}`, sender: 'aura' });
                  setTimeout(() => setActiveSettingsCard(null), 1500);
                }}
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

          {/* Soft Credit Warning - appears naturally in chat */}
          <AnimatePresence>
            {!creditStatus.isLoading && showSoftWarning && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex gap-3"
              >
                <div className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-primary/10 shrink-0">
                  <img src={auraAvatar} alt="AURRA" className="w-full h-full object-cover" />
                </div>
                <CreditWarning
                  type="soft"
                  aiName={userProfile.aiName || 'AURRA'}
                  onContinueTomorrow={dismissSoftWarning}
                  onUpgrade={() => {
                    dismissSoftWarning();
                    setShowUpgradeSheet(true);
                  }}
                  className="flex-1"
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Credit Loading Skeleton */}
          <AnimatePresence>
            {creditStatus.isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex gap-3"
              >
                <div className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-primary/10 shrink-0 bg-muted animate-pulse" />
                <CreditLoadingSkeleton variant="card" className="flex-1" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Limit Reached Warning - appears naturally in chat */}
          <AnimatePresence>
            {!creditStatus.isLoading && showLimitWarning && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex gap-3"
              >
                <div className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-primary/10 shrink-0">
                  <img src={auraAvatar} alt="AURRA" className="w-full h-full object-cover" />
                </div>
                <CreditWarning
                  type="limit"
                  aiName={userProfile.aiName || 'AURRA'}
                  onContinueTomorrow={dismissLimitWarning}
                  onUpgrade={() => {
                    dismissLimitWarning();
                    setShowUpgradeSheet(true);
                  }}
                  className="flex-1"
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Typing Indicator - WhatsApp style */}
          {(isThinking || isGenerating || isCreatingDoc) && chatMessages[chatMessages.length - 1]?.sender === 'user' && (
            <TypingIndicator />
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

      {/* Fixed Input Area - Truly fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 z-40 p-4 pb-6 bg-gradient-to-t from-background via-background to-background/80 backdrop-blur-sm border-t border-border/30" style={{ paddingBottom: 'max(24px, env(safe-area-inset-bottom))' }}>
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

          {/* Subtle hint with gesture tips */}
          <p className="text-center text-[11px] text-muted-foreground/40 mt-3">
            Long press to speak • Swipe right for shortcuts
          </p>
        </div>
      </div>

      {/* Spacer for fixed input area */}
      <div style={{ height: INPUT_BAR_HEIGHT }} className="flex-shrink-0" />

      {/* Media & Tools Bottom Sheet */}
      <MediaToolsSheet 
        open={showMediaSheet}
        onOpenChange={setShowMediaSheet}
        onAction={handleMediaAction}
        onFileSelect={handleFileSelect}
        isUploading={isUploading}
      />

      {/* Context Shortcuts Sheet - Quick access to features via chat */}
      <ContextShortcutsSheet
        open={showContextSheet}
        onOpenChange={setShowContextSheet}
        onSendMessage={handleSend}
      />

      {/* More Menu Sheet - Global control center with chat-binding */}
      <MoreMenuSheet
        open={showMoreMenu}
        onOpenChange={setShowMoreMenu}
        onSendMessage={handleSend}
        onNewChat={() => {
          if (onNewChat) {
            onNewChat();
            addChatMessage({ content: "New day, fresh chat ☀️", sender: 'aura' });
          }
        }}
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

      {/* Upgrade Sheet - triggered by chat or button */}
      <UpgradeSheet
        open={showUpgradeSheet || chatUpgradeSheet}
        onOpenChange={(open) => {
          setShowUpgradeSheet(open);
          if (setChatUpgradeSheet) setChatUpgradeSheet(open);
        }}
      />

      {/* Daily Flow Debug Panel - dev only */}
      <DailyFlowDebugPanel
        onTriggerMorning={() => {
          triggerMorningFlow();
          fetchBriefing();
        }}
        onTriggerNight={triggerNightFlow}
        onTriggerFirstTime={triggerFirstTimeFlow}
        onResetFlow={resetAllFlowState}
        flowState={{
          showPreferences,
          showMorningBriefing,
          showWindDown,
          isFirstTimeUser,
        }}
      />
    </div>
  );
};
