import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Sparkles, Menu, Volume2, Mic, Radio, Camera, ImagePlus, X, Loader2, Ghost, Timer, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AuraOrb } from '@/components/AuraOrb';
import { ChatBubble } from '@/components/ChatBubble';
import { AutomationModal } from '@/components/AutomationModal';
import { ActionsBar } from '@/components/ActionsBar';
import { USPTiles } from '@/components/USPTiles';
import { ModelSelector } from '@/components/ModelSelector';
import { ContinuousVoiceButton } from '@/components/ContinuousVoiceButton';
import { MorningBriefingCard } from '@/components/MorningBriefingCard';
import { useAura, ChatMessage } from '@/contexts/AuraContext';
import { useAuraChat } from '@/hooks/useAuraChat';
import { useVoiceCommands } from '@/hooks/useVoiceCommands';
import { useVoiceFeedback } from '@/hooks/useVoiceFeedback';
import { useWakeWord } from '@/hooks/useWakeWord';
import { useHotkeys } from '@/hooks/useHotkeys';
import { useWelcomeBack, updateLastActive } from '@/hooks/useWelcomeBack';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatScreenProps {
  onMenuClick?: () => void;
  onVoiceModeClick?: () => void;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({ onMenuClick, onVoiceModeClick }) => {
  const { chatMessages, addChatMessage, userProfile } = useAura();
  const { sendMessage, isThinking } = useAuraChat();
  const { processCommand } = useVoiceCommands({
    name: userProfile.name,
    wakeTime: userProfile.wakeTime,
    sleepTime: userProfile.sleepTime,
  });
  const { speak, isSpeaking: isVoiceFeedbackSpeaking } = useVoiceFeedback();
  const { shouldShowWelcomeBack, getWelcomeMessage } = useWelcomeBack();
  
  const [inputValue, setInputValue] = useState('');
  const [showAutomation, setShowAutomation] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gemini-flash');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [wakeWordEnabled, setWakeWordEnabled] = useState(false);
  const [showVoiceInput, setShowVoiceInput] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [showMorningBriefing, setShowMorningBriefing] = useState(false);
  const [welcomeBackShown, setWelcomeBackShown] = useState(false);
  
  // Vanish Mode - temporary chat that disappears
  const [vanishMode, setVanishMode] = useState(false);
  const [vanishMessages, setVanishMessages] = useState<ChatMessage[]>([]);
  const [vanishTimer, setVanishTimer] = useState<number | null>(null); // null = no timer, number = seconds
  const [showVanishOptions, setShowVanishOptions] = useState(false);
  const vanishTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const voiceButtonRef = useRef<HTMLButtonElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Update last active time periodically
  useEffect(() => {
    const interval = setInterval(updateLastActive, 5 * 60 * 1000); // Every 5 min
    return () => clearInterval(interval);
  }, []);

  // Wake word detection
  const handleWakeWord = useCallback(() => {
    toast.success('Hey! I heard you! 👋', { duration: 2000 });
    setShowVoiceInput(true);
    // Trigger voice input after wake word
    setTimeout(() => {
      voiceButtonRef.current?.click();
    }, 500);
  }, []);

  const { isListening: isWakeWordListening, isSupported: isWakeWordSupported } = useWakeWord({
    wakePhrase: 'hey aura',
    onWakeWord: handleWakeWord,
    enabled: wakeWordEnabled,
  });

  // Hotkey: Ctrl+Space for voice input
  useHotkeys([
    {
      key: 'Space',
      ctrl: true,
      callback: () => {
        toast.success('Voice input activated! 🎤', { duration: 1500 });
        voiceButtonRef.current?.click();
      },
      description: 'Trigger voice input',
    },
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  // Check for morning briefing
  useEffect(() => {
    const hour = new Date().getHours();
    const lastBriefing = localStorage.getItem('aura-last-briefing');
    const today = new Date().toDateString();
    
    // Show morning briefing between 5am-11am if not shown today
    if (hour >= 5 && hour < 11 && lastBriefing !== today && chatMessages.length <= 1) {
      setShowMorningBriefing(true);
      localStorage.setItem('aura-last-briefing', today);
    }
  }, [chatMessages.length]);

  // Send initial greeting or welcome back message
  useEffect(() => {
    if (chatMessages.length === 0 && userProfile.onboardingComplete && !welcomeBackShown) {
      let greeting = '';
      
      if (shouldShowWelcomeBack) {
        // Welcome back after being away
        greeting = getWelcomeMessage(userProfile.name);
        setWelcomeBackShown(true);
      } else {
        // Regular casual greetings - Indian human-like style
        const casualGreetings = [
          `Areyyy ${userProfile.name}! Kya scene hai? 🔥`,
          `Oye ${userProfile.name}! Kahan tha/thi itne din? 👋`,
          `Heyy ${userProfile.name}! Sup yaar, sab badhiya?`,
          `${userProfile.name}! Finally aa gaya/gayi! Bol kya plan hai today?`,
          `Ayy ${userProfile.name}! Ready to roll? Batao kya karna hai ✨`,
          `${userProfile.name} bro/sis! Kya chal raha, spill the tea 🍵`,
          `Yo ${userProfile.name}! What's good? Main toh ready hoon 🙌`,
          `${userProfile.name}! Acha sun na, I was thinking about you only!`,
        ];
        greeting = casualGreetings[Math.floor(Math.random() * casualGreetings.length)];
      }
      
      addChatMessage({ content: greeting, sender: 'aura' });
    }
  }, [userProfile.onboardingComplete, shouldShowWelcomeBack, welcomeBackShown]);

  const handleSend = async () => {
    if ((!inputValue.trim() && !selectedImage) || isThinking) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    
    if (selectedImage) {
      // Send image for analysis
      await handleImageAnalysis(userMessage);
    } else if (vanishMode) {
      // Vanish mode - don't save to DB
      addVanishMessage({ content: userMessage, sender: 'user' });
      // Still call AI but add response to vanish messages
      await sendVanishMessage(userMessage);
    } else {
      await sendMessage(userMessage, selectedModel);
    }
  };

  // Send message in vanish mode (no DB save)
  const sendVanishMessage = async (message: string) => {
    try {
      const allMessages = [...vanishMessages, { id: 'temp', content: message, sender: 'user' as const, timestamp: new Date() }];
      
      const response = await supabase.functions.invoke('aura-chat', {
        body: {
          messages: allMessages.map(m => ({ role: m.sender === 'user' ? 'user' : 'assistant', content: m.content })),
          userProfile: {
            name: userProfile.name,
            age: userProfile.age,
            professions: userProfile.professions,
            goals: userProfile.goals,
            languages: userProfile.languages,
            tonePreference: userProfile.tonePreference,
            wakeTime: userProfile.wakeTime,
            sleepTime: userProfile.sleepTime,
          },
          preferredModel: selectedModel,
        },
      });

      if (response.error) throw response.error;

      // Parse streaming response
      const reader = response.data.getReader?.();
      if (reader) {
        let fullContent = '';
        const messageId = addVanishMessage({ content: '', sender: 'aura' });
        
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ') && line !== 'data: [DONE]') {
              try {
                const json = JSON.parse(line.slice(6));
                const content = json.choices?.[0]?.delta?.content || '';
                fullContent += content;
                setVanishMessages(prev => 
                  prev.map(m => m.id === messageId ? { ...m, content: fullContent } : m)
                );
              } catch {}
            }
          }
        }
      }
    } catch (error) {
      console.error('Vanish chat error:', error);
      addVanishMessage({ content: 'Oops, kuch gadbad ho gayi yaar. Try again? 😅', sender: 'aura' });
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Image too large. Max 10MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        toast.success('Image attached! Add a message or send directly.');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageAnalysis = async (additionalPrompt?: string) => {
    if (!selectedImage) return;
    
    setIsAnalyzingImage(true);
    const imageToSend = selectedImage;
    setSelectedImage(null);
    
    // Add user message with image indicator
    addChatMessage({ 
      content: additionalPrompt ? `📷 ${additionalPrompt}` : '📷 Analyze this image', 
      sender: 'user' 
    });
    
    try {
      const { data, error } = await supabase.functions.invoke('analyze-image', {
        body: { image: imageToSend }
      });

      if (error) throw error;

      // Format the analysis response
      const response = `
**${data.compliment}**

${data.overallFeedback}

**Scores:**
• Confidence: ${data.confidence}/100
• Outfit: ${data.outfitScore}/100  
• Aesthetic: ${data.aesthetic}/100

**Vibe:** ${data.vibe}
**Mood:** ${data.mood} | **Expression:** ${data.expression}
**Lighting:** ${data.lightingQuality}

${data.improvements?.length > 0 ? `**Suggestions:**\n${data.improvements.map((s: string) => `• ${s}`).join('\n')}` : ''}
      `.trim();

      addChatMessage({ content: response, sender: 'aura' });
    } catch (error) {
      console.error('Image analysis error:', error);
      addChatMessage({ 
        content: "I couldn't analyze that image right now. Try again? 📸", 
        sender: 'aura' 
      });
    } finally {
      setIsAnalyzingImage(false);
    }
  };

  const clearSelectedImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleVoiceTranscription = async (text: string) => {
    if (!text) return;
    setShowVoiceInput(false);
    
    // Check for voice commands first
    const commandResult = await processCommand(text);
    
    if (commandResult.handled && commandResult.response) {
      // Add user message
      addChatMessage({ content: text, sender: 'user' });
      // Add AURA's response for handled commands
      addChatMessage({ content: commandResult.response, sender: 'aura' });
      
      // Speak the response if it's a voice command
      if (commandResult.speakResponse) {
        await speak(commandResult.response);
      }
    } else if (commandResult.type === 'general') {
      // Not a command, send as regular message
      addChatMessage({ content: text, sender: 'user' });
      await sendMessage(text, selectedModel);
    } else if (commandResult.response) {
      // Partially handled (acknowledged but not executed)
      addChatMessage({ content: text, sender: 'user' });
      addChatMessage({ content: commandResult.response, sender: 'aura' });
      
      // Speak the response
      if (commandResult.speakResponse) {
        await speak(commandResult.response);
      }
    } else {
      // Fallback: just set as input
      setInputValue(text);
    }
  };

  const toggleWakeWord = () => {
    if (!isWakeWordSupported) {
      toast.error('Wake word detection not supported in this browser');
      return;
    }
    setWakeWordEnabled(!wakeWordEnabled);
    toast.success(
      !wakeWordEnabled 
        ? 'Wake word enabled! Say "Hey AURA" to start talking.' 
        : 'Wake word disabled.'
    );
  };

  const handleSpeakMessage = async (text: string) => {
    if (isSpeaking) {
      audioRef.current?.pause();
      setIsSpeaking(false);
      return;
    }

    try {
      setIsSpeaking(true);
      const { data, error } = await supabase.functions.invoke('text-to-voice', {
        body: { text, voice: 'nova' }
      });

      if (error) throw error;

      if (data?.requiresSetup) {
        toast.info('Voice playback needs setup', {
          description: 'Add OpenAI API key for voice features.',
        });
        setIsSpeaking(false);
        return;
      }

      if (data?.audioContent) {
        const audio = new Audio(`data:audio/mp3;base64,${data.audioContent}`);
        audioRef.current = audio;
        audio.onended = () => setIsSpeaking(false);
        await audio.play();
      }
    } catch (error) {
      console.error('TTS error:', error);
      toast.error('Could not play voice');
      setIsSpeaking(false);
    }
  };

  const handleActionSelect = (actionId: string, message: string) => {
    toast.info(`AURA says: ${message}`);
  };

  // Clear all vanish timers on unmount
  useEffect(() => {
    return () => {
      vanishTimersRef.current.forEach(timer => clearTimeout(timer));
      vanishTimersRef.current.clear();
    };
  }, []);

  // Timer options for vanish mode
  const vanishTimerOptions = [
    { label: 'No Timer', value: null, icon: '👻' },
    { label: '30 sec', value: 30, icon: '⚡' },
    { label: '1 min', value: 60, icon: '⏱️' },
    { label: '5 min', value: 300, icon: '🕐' },
  ];

  // Toggle Vanish Mode
  const toggleVanishMode = () => {
    if (vanishMode) {
      // Exiting vanish mode - clear temporary messages and timers
      vanishTimersRef.current.forEach(timer => clearTimeout(timer));
      vanishTimersRef.current.clear();
      setVanishMessages([]);
      setVanishTimer(null);
      setShowVanishOptions(false);
      toast.success('👻 Vanish mode off — messages cleared!', { duration: 2000 });
    } else {
      // Show options dropdown first
      setShowVanishOptions(true);
    }
    if (vanishMode) setVanishMode(false);
  };

  // Enable vanish mode with timer selection
  const enableVanishMode = (timerValue: number | null) => {
    setVanishTimer(timerValue);
    setVanishMode(true);
    setShowVanishOptions(false);
    
    const timerLabel = timerValue === 30 ? '30 seconds' : timerValue === 60 ? '1 minute' : timerValue === 300 ? '5 minutes' : 'exit';
    toast.success(`👻 Vanish mode on!`, { 
      duration: 3000,
      description: timerValue 
        ? `Messages auto-delete after ${timerLabel} ⚡`
        : 'Messages disappear when you leave 🤫'
    });
  };

  // Add vanish message (not saved to DB) with optional auto-delete
  const addVanishMessage = (message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const newMessage: ChatMessage = {
      ...message,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    };
    setVanishMessages(prev => [...prev, newMessage]);
    
    // Set auto-delete timer if enabled
    if (vanishTimer !== null) {
      const timerId = setTimeout(() => {
        setVanishMessages(prev => prev.filter(m => m.id !== newMessage.id));
        vanishTimersRef.current.delete(newMessage.id);
      }, vanishTimer * 1000);
      vanishTimersRef.current.set(newMessage.id, timerId);
    }
    
    return newMessage.id;
  };

  // Current messages to display
  const displayMessages = vanishMode ? vanishMessages : chatMessages;

  const lastAuraMessage = displayMessages.filter(m => m.sender === 'aura').slice(-1)[0];

  return (
    <div className={cn("flex flex-col h-full relative", vanishMode && "vanish-mode-active")}>
      {/* Vanish Mode Background Effect */}
      <AnimatePresence>
        {vanishMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none z-0"
            style={{
              background: 'linear-gradient(180deg, hsl(var(--primary) / 0.05) 0%, transparent 30%, transparent 70%, hsl(var(--primary) / 0.05) 100%)',
            }}
          />
        )}
      </AnimatePresence>

      {/* Vanish Mode Banner */}
      <AnimatePresence>
        {vanishMode && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-primary/10 border-b border-primary/20 overflow-hidden z-20"
          >
            <div className="flex items-center justify-center gap-2 py-2 px-4">
              <Ghost className="w-4 h-4 text-primary animate-pulse" />
              <span className="text-xs font-medium text-primary">
                {vanishTimer 
                  ? `⏱️ Messages auto-delete after ${vanishTimer === 30 ? '30s' : vanishTimer === 60 ? '1min' : '5min'}` 
                  : 'Vanish Mode On — Messages disappear when you leave 👻'}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs text-primary hover:bg-primary/20"
                onClick={toggleVanishMode}
              >
                Turn Off
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Vanish Mode Timer Options Dropdown */}
      <AnimatePresence>
        {showVanishOptions && !vanishMode && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-16 right-4 z-50 bg-card border border-border rounded-xl shadow-lg overflow-hidden"
          >
            <div className="p-2 border-b border-border/50">
              <p className="text-xs font-medium text-muted-foreground px-2">Choose vanish timer</p>
            </div>
            <div className="p-1">
              {vanishTimerOptions.map((option) => (
                <button
                  key={option.value ?? 'none'}
                  onClick={() => enableVanishMode(option.value)}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-primary/10 transition-colors text-left"
                >
                  <span>{option.icon}</span>
                  <span>{option.label}</span>
                </button>
              ))}
            </div>
            <div className="p-1 border-t border-border/50">
              <button
                onClick={() => setShowVanishOptions(false)}
                className="w-full text-xs text-muted-foreground py-2 hover:text-foreground transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header with Orb and Controls */}
      <div className="flex flex-col items-center pt-4 pb-2 relative z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-accent/10 via-primary/5 to-transparent" />
        
        {/* Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 left-4 z-10 rounded-full"
          onClick={onMenuClick}
        >
          <Menu className="w-5 h-5" />
        </Button>
        
        {/* Voice Mode, Vanish Mode & Model Selector */}
        <div className="absolute top-2 right-4 z-10 flex items-center gap-1">
          {/* Vanish Mode Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "rounded-full transition-all",
              vanishMode 
                ? "text-primary bg-primary/20 hover:bg-primary/30" 
                : "text-muted-foreground hover:text-primary hover:bg-primary/10"
            )}
            onClick={toggleVanishMode}
            title={vanishMode ? "Exit Vanish Mode" : "Enable Vanish Mode (messages disappear)"}
          >
            <Ghost className={cn("w-5 h-5", vanishMode && "animate-pulse")} />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10"
            onClick={onVoiceModeClick}
            title="Continuous Voice Mode"
          >
            <Mic className="w-5 h-5" />
          </Button>
          <ModelSelector value={selectedModel} onChange={setSelectedModel} />
        </div>
        
        <AuraOrb size="md" isThinking={isThinking || isVoiceFeedbackSpeaking} className="animate-float" />
        <h1 className="mt-2 text-lg font-bold aura-gradient-text">AURA</h1>
        <p className="text-xs text-muted-foreground">
          {isVoiceFeedbackSpeaking ? 'Speaking...' : isThinking ? 'Thinking...' : isWakeWordListening ? '🎤 Listening for "Hey AURA"...' : 'Your AI Bestfriend & Life Assistant'}
        </p>
      </div>

      {/* Morning Briefing Card */}
      {showMorningBriefing && (
        <MorningBriefingCard 
          userName={userProfile.name}
          onDismiss={() => setShowMorningBriefing(false)}
        />
      )}

      {/* USP Tiles - show when chat is empty or has few messages */}
      {displayMessages.length <= 1 && !showMorningBriefing && !vanishMode && (
        <div className="px-4 py-2">
          <USPTiles />
        </div>
      )}

      {/* Vanish Mode Empty State */}
      {vanishMode && vanishMessages.length === 0 && (
        <div className="px-4 py-8 text-center">
          <Ghost className="w-16 h-16 mx-auto text-primary/30 mb-4" />
          <p className="text-muted-foreground font-medium">Vanish Mode Active 👻</p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            Messages here won't be saved. Ekdum secret! 🤫
          </p>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-4 z-10">
        {displayMessages.map((message) => (
          <motion.div
            key={message.id}
            initial={vanishMode ? { opacity: 0, y: 10 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChatBubble
              content={message.content}
              sender={message.sender}
              timestamp={message.timestamp}
            />
          </motion.div>
        ))}
        
        {isThinking && displayMessages[displayMessages.length - 1]?.sender === 'user' && (
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
      <div className="p-4 pb-24 bg-gradient-to-t from-background via-background to-transparent space-y-3">
        {/* Actions Bar */}
        <div className="max-w-lg mx-auto">
          <ActionsBar onActionSelect={handleActionSelect} />
        </div>

        {/* Image Preview */}
        {selectedImage && (
          <div className="max-w-lg mx-auto">
            <div className="relative inline-block">
              <img 
                src={selectedImage} 
                alt="Selected" 
                className="h-20 w-20 object-cover rounded-xl border-2 border-primary/30"
              />
              <Button
                variant="secondary"
                size="icon"
                className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-destructive hover:bg-destructive/80"
                onClick={clearSelectedImage}
              >
                <X className="w-3 h-3 text-destructive-foreground" />
              </Button>
            </div>
          </div>
        )}
        
        {/* Hidden File Inputs */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
          className="hidden"
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleImageSelect}
          className="hidden"
        />
        
        <div className="flex items-center gap-2 max-w-lg mx-auto">
          {/* Camera Button */}
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full shrink-0 text-muted-foreground hover:text-primary hover:bg-primary/10"
            onClick={() => cameraInputRef.current?.click()}
            disabled={isThinking || isAnalyzingImage}
            title="Take a photo"
          >
            <Camera className="w-5 h-5" />
          </Button>

          {/* Image Upload Button */}
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full shrink-0 text-muted-foreground hover:text-primary hover:bg-primary/10"
            onClick={() => fileInputRef.current?.click()}
            disabled={isThinking || isAnalyzingImage}
            title="Upload image"
          >
            <ImagePlus className="w-5 h-5" />
          </Button>

          {/* Wake Word Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'rounded-full shrink-0',
              wakeWordEnabled ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-primary'
            )}
            onClick={toggleWakeWord}
            title={wakeWordEnabled ? 'Disable wake word' : 'Enable "Hey AURA" wake word'}
          >
            <Radio className={cn('w-5 h-5', wakeWordEnabled && 'animate-pulse')} />
          </Button>
          
          <ContinuousVoiceButton 
            onTranscription={handleVoiceTranscription}
            isProcessing={isThinking || isAnalyzingImage}
            continuous={wakeWordEnabled}
          />
          
          <div className="flex-1 relative">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={selectedImage ? "Add a message or tap send..." : "Hey AURA, what's up..."}
              className="rounded-full pr-12 bg-muted/50 border-border/50 focus:border-primary/50"
              disabled={isThinking || isAnalyzingImage}
            />
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'absolute right-1 top-1/2 -translate-y-1/2 rounded-full',
                'text-muted-foreground hover:text-primary',
                (inputValue.trim() || selectedImage) && 'text-primary'
              )}
              onClick={handleSend}
              disabled={(!inputValue.trim() && !selectedImage) || isThinking || isAnalyzingImage}
            >
              {isAnalyzingImage ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>

          {/* Speak Last Message */}
          {lastAuraMessage && (
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'rounded-full shrink-0',
                isSpeaking ? 'text-primary animate-pulse' : 'text-muted-foreground hover:text-primary'
              )}
              onClick={() => handleSpeakMessage(lastAuraMessage.content)}
            >
              <Volume2 className="w-5 h-5" />
            </Button>
          )}
          
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
      
      <AutomationModal
        isOpen={showAutomation}
        onClose={() => setShowAutomation(false)}
      />
    </div>
  );
};
