import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Sparkles, Menu, Volume2, Mic, Radio, Camera, ImagePlus, X, Loader2, Ghost, Timer, ChevronDown, GraduationCap, Gamepad2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AuraOrb } from '@/components/AuraOrb';
import { ChatBubble } from '@/components/ChatBubble';
import { AutomationModal } from '@/components/AutomationModal';
import { ActionsBar } from '@/components/ActionsBar';
import { USPTiles } from '@/components/USPTiles';
import { ModelSelector } from '@/components/ModelSelector';
import { ContinuousVoiceButton } from '@/components/ContinuousVoiceButton';
import { MorningBriefingCard } from '@/components/MorningBriefingCard';
import { QuickActions } from '@/components/QuickActions';
import { TutorMode } from '@/components/TutorMode';
import { ChatGames, GameType, getGameSystemPrompt } from '@/components/ChatGames';
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

// Extended message type with reactions and reply
interface ExtendedMessage extends ChatMessage {
  reactions?: string[];
  replyTo?: { content: string; sender: string } | null;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({ onMenuClick, onVoiceModeClick }) => {
  const { chatMessages, addChatMessage, updateChatMessage, userProfile } = useAura();
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
  const [imagePrompt, setImagePrompt] = useState('');
  const [showImagePrompt, setShowImagePrompt] = useState(false);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [showMorningBriefing, setShowMorningBriefing] = useState(false);
  const [welcomeBackShown, setWelcomeBackShown] = useState(false);
  const [showTutorMode, setShowTutorMode] = useState(false);
  const [showChatGames, setShowChatGames] = useState(false);
  const [activeGame, setActiveGame] = useState<GameType | null>(null);
  const [replyingTo, setReplyingTo] = useState<ExtendedMessage | null>(null);
  const [messageReactions, setMessageReactions] = useState<Record<string, string[]>>({});
  
  // Vanish Mode
  const [vanishMode, setVanishMode] = useState(false);
  const [vanishMessages, setVanishMessages] = useState<ChatMessage[]>([]);
  const [vanishTimer, setVanishTimer] = useState<number | null>(null);
  const [showVanishOptions, setShowVanishOptions] = useState(false);
  const vanishTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const voiceButtonRef = useRef<HTMLButtonElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Update last active time periodically
  useEffect(() => {
    const interval = setInterval(updateLastActive, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Wake word detection
  const handleWakeWord = useCallback(() => {
    toast.success('Hey! I heard you! 👋', { duration: 2000 });
    setShowVoiceInput(true);
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
  }, [chatMessages, vanishMessages]);

  // Morning briefing check
  useEffect(() => {
    const hour = new Date().getHours();
    const lastBriefing = localStorage.getItem('aura-last-briefing');
    const today = new Date().toDateString();
    
    if (hour >= 5 && hour < 11 && lastBriefing !== today && chatMessages.length <= 1) {
      setShowMorningBriefing(true);
      localStorage.setItem('aura-last-briefing', today);
    }
  }, [chatMessages.length]);

  // Initial greeting
  useEffect(() => {
    if (chatMessages.length === 0 && userProfile.onboardingComplete && !welcomeBackShown) {
      let greeting = '';
      
      if (shouldShowWelcomeBack) {
        greeting = getWelcomeMessage(userProfile.name);
        setWelcomeBackShown(true);
      } else {
        const casualGreetings = [
          `Areyyy ${userProfile.name}! Kya scene hai? 🔥`,
          `Oye ${userProfile.name}! Kahan tha/thi itne din? 👋`,
          `Heyy ${userProfile.name}! Sup yaar, sab badhiya?`,
          `${userProfile.name}! Finally aa gaya/gayi! Bol kya plan hai today?`,
          `Ayy ${userProfile.name}! Ready to roll? Batao kya karna hai ✨`,
        ];
        greeting = casualGreetings[Math.floor(Math.random() * casualGreetings.length)];
      }
      
      addChatMessage({ content: greeting, sender: 'aura' });
    }
  }, [userProfile.onboardingComplete, shouldShowWelcomeBack, welcomeBackShown]);

  // Image generation detection
  const isImageGenRequest = (text: string): boolean => {
    const lowerText = text.toLowerCase();
    const triggers = [
      'generate image', 'create image', 'make image', 'draw', 'generate a', 
      'create a picture', 'generate picture', 'make a picture', 'create art',
      'imagine', 'visualize', 'picture of', 'image of', 'photo of',
      'banao image', 'image banao', 'photo banao', 'tasveer banao',
    ];
    return triggers.some(t => lowerText.includes(t));
  };

  // Handle image generation
  const handleImageGeneration = async (prompt: string) => {
    setIsGeneratingImage(true);
    addChatMessage({ content: prompt, sender: 'user' });
    
    const thinkingId = addChatMessage({ 
      content: '🎨 Creating your image... hold on yaar! ✨', 
      sender: 'aura' 
    });

    try {
      const { data, error } = await supabase.functions.invoke('generate-image', {
        body: { prompt }
      });

      if (error) throw error;

      if (data.imageUrl) {
        updateChatMessage(thinkingId, `Here's what I created! 🔥\n\n![Generated](${data.imageUrl})\n\n${data.textContent || 'Kaisa laga?'}`);
      } else {
        updateChatMessage(thinkingId, data.error || "Couldn't generate that yaar. Try different prompt? 😅");
      }
    } catch (error) {
      console.error('Image generation error:', error);
      updateChatMessage(thinkingId, "Image generation failed yaar. Try again? 🙈");
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleSend = async () => {
    if ((!inputValue.trim() && !selectedImage) || isThinking || isGeneratingImage) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    
    if (selectedImage && showImagePrompt) {
      await handleImageAnalysis(imagePrompt || userMessage || 'Analyze this image');
    } else if (selectedImage) {
      setShowImagePrompt(true);
      return;
    } else if (isImageGenRequest(userMessage)) {
      await handleImageGeneration(userMessage);
    } else if (vanishMode) {
      addVanishMessage({ content: userMessage, sender: 'user' });
      await sendVanishMessage(userMessage);
    } else {
      // Add reply context if replying
      if (replyingTo) {
        const contextMessage = `[Replying to: "${replyingTo.content.slice(0, 50)}..."]\n\n${userMessage}`;
        await sendMessage(contextMessage, selectedModel);
        setReplyingTo(null);
      } else {
        await sendMessage(userMessage, selectedModel);
      }
    }
  };

  const sendVanishMessage = async (message: string) => {
    try {
      const allMessages = [...vanishMessages, { id: 'temp', content: message, sender: 'user' as const, timestamp: new Date() }];
      
      // Add thinking indicator
      const thinkingId = addVanishMessage({ content: '...', sender: 'aura' });
      
      const response = await supabase.functions.invoke('aura-chat', {
        body: {
          messages: allMessages.slice(0, -1).map(m => ({ role: m.sender === 'user' ? 'user' : 'assistant', content: m.content })),
          userProfile: {
            name: userProfile.name,
            age: userProfile.age,
            professions: userProfile.professions,
            goals: userProfile.goals,
            languages: userProfile.languages,
            tonePreference: userProfile.tonePreference,
          },
          preferredModel: selectedModel,
        },
      });

      if (response.error) throw response.error;

      // Handle streaming response
      const reader = response.data.getReader?.();
      if (reader) {
        let fullContent = '';
        
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
                  prev.map(m => m.id === thinkingId ? { ...m, content: fullContent } : m)
                );
              } catch {}
            }
          }
        }
        
        // If no content was streamed, handle non-streaming response
        if (!fullContent) {
          const text = await response.data.text?.();
          if (text) {
            try {
              const parsed = JSON.parse(text);
              fullContent = parsed.choices?.[0]?.message?.content || parsed.content || text;
            } catch {
              fullContent = text;
            }
            setVanishMessages(prev => 
              prev.map(m => m.id === thinkingId ? { ...m, content: fullContent } : m)
            );
          }
        }
      } else {
        // Non-streaming response
        const text = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
        try {
          const parsed = JSON.parse(text);
          const content = parsed.choices?.[0]?.message?.content || parsed.content || 'Got it! 👻';
          setVanishMessages(prev => 
            prev.map(m => m.id === thinkingId ? { ...m, content } : m)
          );
        } catch {
          setVanishMessages(prev => 
            prev.map(m => m.id === thinkingId ? { ...m, content: 'Got your message! 👻' } : m)
          );
        }
      }
    } catch (error) {
      console.error('Vanish chat error:', error);
      addVanishMessage({ content: 'Oops, kuch gadbad ho gayi yaar 😅', sender: 'aura' });
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
        setShowImagePrompt(true);
        toast.success('Image ready! Tell me what to do with it 📸');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageAnalysis = async (prompt: string) => {
    if (!selectedImage) return;
    
    setIsAnalyzingImage(true);
    const imageToSend = selectedImage;
    clearSelectedImage();
    
    addChatMessage({ content: `📷 ${prompt}`, sender: 'user' });
    
    try {
      const { data, error } = await supabase.functions.invoke('analyze-image', {
        body: { image: imageToSend, prompt }
      });

      if (error) throw error;

      const response = data.compliment ? `
**${data.compliment}**

${data.overallFeedback}

**Scores:** Confidence ${data.confidence}/100 • Outfit ${data.outfitScore}/100 • Aesthetic ${data.aesthetic}/100

**Vibe:** ${data.vibe} | **Mood:** ${data.mood}

${data.improvements?.length > 0 ? `**Tips:** ${data.improvements.join(', ')}` : ''}
      `.trim() : data.analysis || data.description || 'Image analyzed!';

      addChatMessage({ content: response, sender: 'aura' });
    } catch (error) {
      console.error('Image analysis error:', error);
      addChatMessage({ content: "Couldn't analyze that image yaar. Try again? 📸", sender: 'aura' });
    } finally {
      setIsAnalyzingImage(false);
    }
  };

  const clearSelectedImage = () => {
    setSelectedImage(null);
    setImagePrompt('');
    setShowImagePrompt(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const handleVoiceTranscription = async (text: string) => {
    if (!text) return;
    setShowVoiceInput(false);
    
    const commandResult = await processCommand(text);
    
    if (commandResult.handled && commandResult.response) {
      addChatMessage({ content: text, sender: 'user' });
      addChatMessage({ content: commandResult.response, sender: 'aura' });
      if (commandResult.speakResponse) await speak(commandResult.response);
    } else if (commandResult.type === 'general') {
      addChatMessage({ content: text, sender: 'user' });
      await sendMessage(text, selectedModel);
    } else if (commandResult.response) {
      addChatMessage({ content: text, sender: 'user' });
      addChatMessage({ content: commandResult.response, sender: 'aura' });
      if (commandResult.speakResponse) await speak(commandResult.response);
    } else {
      setInputValue(text);
    }
  };

  const toggleWakeWord = () => {
    if (!isWakeWordSupported) {
      toast.error('Wake word not supported in this browser');
      return;
    }
    setWakeWordEnabled(!wakeWordEnabled);
    toast.success(!wakeWordEnabled ? 'Say "Hey AURA" to start!' : 'Wake word disabled.');
  };

  const handleSpeakMessage = async (text: string) => {
    if (isSpeaking) {
      audioRef.current?.pause();
      setIsSpeaking(false);
      return;
    }

    try {
      setIsSpeaking(true);
      // Try ElevenLabs first, fallback to OpenAI
      const { data, error } = await supabase.functions.invoke('elevenlabs-tts', {
        body: { text }
      });

      if (error) throw error;

      if (data?.audioContent) {
        const audio = new Audio(`data:audio/mp3;base64,${data.audioContent}`);
        audioRef.current = audio;
        audio.onended = () => setIsSpeaking(false);
        await audio.play();
      } else if (data?.requiresSetup) {
        toast.info('Voice requires API setup');
        setIsSpeaking(false);
      }
    } catch (error) {
      console.error('TTS error:', error);
      // Fallback to original text-to-voice
      try {
        const { data } = await supabase.functions.invoke('text-to-voice', {
          body: { text, voice: 'nova' }
        });
        if (data?.audioContent) {
          const audio = new Audio(`data:audio/mp3;base64,${data.audioContent}`);
          audioRef.current = audio;
          audio.onended = () => setIsSpeaking(false);
          await audio.play();
        }
      } catch {
        toast.error('Voice playback failed');
        setIsSpeaking(false);
      }
    }
  };

  const handleQuickAction = (actionId: string, message: string) => {
    setInputValue(message);
    // Auto-send for some actions
    if (['boost-mood', 'schedule', 'break-time'].includes(actionId)) {
      addChatMessage({ content: message, sender: 'user' });
      sendMessage(message, selectedModel);
      setInputValue('');
    }
  };

  const handleReaction = (messageId: string, emoji: string) => {
    setMessageReactions(prev => ({
      ...prev,
      [messageId]: [...(prev[messageId] || []), emoji]
    }));
  };

  const handleReply = (message: ExtendedMessage) => {
    setReplyingTo(message);
    toast.info(`Replying to: "${message.content.slice(0, 30)}..."`);
  };

  const handleStartLesson = (subject: string, topic: string) => {
    setShowTutorMode(false);
    const message = `Teach me about ${topic} in ${subject}. Explain it simply like I'm a beginner, with examples.`;
    addChatMessage({ content: message, sender: 'user' });
    sendMessage(message, selectedModel);
  };

  const handleStartGame = (gameType: GameType, initialMessage: string) => {
    setActiveGame(gameType);
    addChatMessage({ content: initialMessage, sender: 'aura' });
    toast.success(`Let's play ${gameType.replace('-', ' ')}! 🎮`);
  };

  // Vanish mode functions
  useEffect(() => {
    return () => {
      vanishTimersRef.current.forEach(timer => clearTimeout(timer));
      vanishTimersRef.current.clear();
    };
  }, []);

  const vanishTimerOptions = [
    { label: 'No Timer', value: null, icon: '👻' },
    { label: '30 sec', value: 30, icon: '⚡' },
    { label: '1 min', value: 60, icon: '⏱️' },
    { label: '5 min', value: 300, icon: '🕐' },
  ];

  const toggleVanishMode = () => {
    if (vanishMode) {
      vanishTimersRef.current.forEach(timer => clearTimeout(timer));
      vanishTimersRef.current.clear();
      setVanishMessages([]);
      setVanishTimer(null);
      setShowVanishOptions(false);
      toast.success('👻 Vanish mode off — messages cleared!');
    } else {
      setShowVanishOptions(true);
    }
    if (vanishMode) setVanishMode(false);
  };

  const enableVanishMode = (timerValue: number | null) => {
    setVanishTimer(timerValue);
    setVanishMode(true);
    setShowVanishOptions(false);
    toast.success('👻 Vanish mode on!');
  };

  const addVanishMessage = (message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const newMessage: ChatMessage = {
      ...message,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    };
    setVanishMessages(prev => [...prev, newMessage]);
    
    if (vanishTimer !== null) {
      const timerId = setTimeout(() => {
        setVanishMessages(prev => prev.filter(m => m.id !== newMessage.id));
        vanishTimersRef.current.delete(newMessage.id);
      }, vanishTimer * 1000);
      vanishTimersRef.current.set(newMessage.id, timerId);
    }
    
    return newMessage.id;
  };

  const displayMessages = vanishMode ? vanishMessages : chatMessages;
  const lastAuraMessage = displayMessages.filter(m => m.sender === 'aura').slice(-1)[0];

  return (
    <div className={cn("flex flex-col h-full relative", vanishMode && "vanish-mode-active")}>
      {/* Vanish Mode Background */}
      <AnimatePresence>
        {vanishMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none z-0"
            style={{ background: 'linear-gradient(180deg, hsl(var(--primary) / 0.05) 0%, transparent 30%)' }}
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
              <span className="text-xs font-medium text-primary">Vanish Mode Active 👻</span>
              <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={toggleVanishMode}>
                Turn Off
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Vanish Options Dropdown */}
      <AnimatePresence>
        {showVanishOptions && !vanishMode && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-16 right-4 z-50 bg-card border rounded-xl shadow-lg overflow-hidden"
          >
            <div className="p-2 border-b border-border/50">
              <p className="text-xs font-medium text-muted-foreground px-2">Choose timer</p>
            </div>
            <div className="p-1">
              {vanishTimerOptions.map((opt) => (
                <button
                  key={opt.value ?? 'none'}
                  onClick={() => enableVanishMode(opt.value)}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-primary/10 transition-colors"
                >
                  <span>{opt.icon}</span>
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowVanishOptions(false)}
              className="w-full text-xs text-muted-foreground py-2 hover:text-foreground border-t"
            >
              Cancel
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fixed Header - Sticky on Scroll */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border/50">
        <div className="flex items-center justify-between px-3 py-2">
          {/* Left - Menu Button */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-9 w-9 rounded-full shrink-0" 
            onClick={onMenuClick}
          >
            <Menu className="w-5 h-5" />
          </Button>
          
          {/* Center - Title */}
          <div className="flex items-center gap-2">
            <AuraOrb size="sm" isThinking={isThinking || isVoiceFeedbackSpeaking} />
            <span className="font-semibold text-sm">AURA</span>
          </div>
          
          {/* Right - Actions */}
          <div className="flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="icon"
              className={cn("h-8 w-8 rounded-full", vanishMode && "text-primary bg-primary/20")}
              onClick={toggleVanishMode}
            >
              <Ghost className={cn("w-4 h-4", vanishMode && "animate-pulse")} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={() => setShowTutorMode(true)}
            >
              <GraduationCap className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn("h-8 w-8 rounded-full", activeGame && "text-primary bg-primary/20")}
              onClick={() => setShowChatGames(true)}
            >
              <Gamepad2 className={cn("w-4 h-4", activeGame && "animate-pulse")} />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 rounded-full" 
              onClick={onVoiceModeClick}
            >
              <Mic className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Morning Briefing */}
      {showMorningBriefing && (
        <MorningBriefingCard userName={userProfile.name} onDismiss={() => setShowMorningBriefing(false)} />
      )}

      {/* Tutor Mode Modal */}
      <AnimatePresence>
        {showTutorMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-background/80 backdrop-blur-sm p-4 overflow-y-auto"
          >
            <TutorMode onStartLesson={handleStartLesson} onClose={() => setShowTutorMode(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Games Modal */}
      <ChatGames 
        isOpen={showChatGames} 
        onClose={() => setShowChatGames(false)}
        onStartGame={handleStartGame}
      />

      {/* USP Tiles */}
      {displayMessages.length <= 1 && !showMorningBriefing && !vanishMode && (
        <div className="px-4 py-2">
          <USPTiles />
        </div>
      )}

      {/* Vanish Empty State */}
      {vanishMode && vanishMessages.length === 0 && (
        <div className="px-4 py-8 text-center">
          <Ghost className="w-16 h-16 mx-auto text-primary/30 mb-4" />
          <p className="text-muted-foreground font-medium">Vanish Mode Active 👻</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Messages won't be saved 🤫</p>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 space-y-4 z-10">
        <div className="max-w-2xl mx-auto space-y-4">
          {displayMessages.map((message) => (
            <ChatBubble
              key={message.id}
              content={message.content}
              sender={message.sender}
              timestamp={message.timestamp}
              onSpeak={message.sender === 'aura' ? handleSpeakMessage : undefined}
              onReply={() => handleReply(message as ExtendedMessage)}
              onReact={(emoji) => handleReaction(message.id, emoji)}
              reactions={messageReactions[message.id]}
              replyTo={replyingTo?.id === message.id ? null : undefined}
            />
          ))}
          
          {/* Typing Indicator */}
          {(isThinking || isGeneratingImage) && displayMessages[displayMessages.length - 1]?.sender === 'user' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white animate-pulse" />
              </div>
              <div className="bg-card border px-4 py-3 rounded-2xl rounded-bl-md">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-xs text-muted-foreground ml-2">
                    {isGeneratingImage ? 'Creating...' : 'Typing...'}
                  </span>
                </div>
              </div>
            </motion.div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="p-3 pb-6 bg-gradient-to-t from-background via-background/95 to-transparent">
        {/* Reply Preview */}
        {replyingTo && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="max-w-2xl mx-auto mb-2"
          >
            <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg border-l-2 border-primary">
              <span className="text-xs text-muted-foreground flex-1 truncate">
                Replying to: {replyingTo.content.slice(0, 40)}...
              </span>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setReplyingTo(null)}>
                <X className="w-3 h-3" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* Image Preview with Prompt */}
        {selectedImage && (
          <div className="max-w-2xl mx-auto mb-3">
            <div className="relative p-3 bg-card border rounded-2xl">
              <div className="flex gap-3">
                <div className="relative">
                  <img src={selectedImage} alt="Selected" className="h-20 w-20 object-cover rounded-xl" />
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-destructive"
                    onClick={clearSelectedImage}
                  >
                    <X className="w-3 h-3 text-white" />
                  </Button>
                </div>
                {showImagePrompt && (
                  <div className="flex-1 space-y-2">
                    <p className="text-xs text-muted-foreground">What should I do with this image?</p>
                    <div className="flex flex-wrap gap-1">
                      {['Analyze', 'Describe', 'Mood check', 'Outfit rating', 'Extract text'].map(opt => (
                        <Button
                          key={opt}
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs rounded-full"
                          onClick={() => {
                            setImagePrompt(opt);
                            handleImageAnalysis(opt);
                          }}
                        >
                          {opt}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Hidden Inputs */}
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
        <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleImageSelect} className="hidden" />
        
        <div className="max-w-2xl mx-auto">
          {/* Quick Actions */}
          <QuickActions onAction={handleQuickAction} className="mb-2" />

          {/* Actions Bar */}
          <div className="mb-2">
            <ActionsBar onActionSelect={(id, msg) => toast.info(`AURA: ${msg}`)} />
          </div>

          {/* Input Row */}
          <div className="flex items-end gap-2">
            <div className="flex items-center gap-1 pb-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full"
                onClick={() => cameraInputRef.current?.click()}
                disabled={isThinking || isAnalyzingImage}
              >
                <Camera className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full"
                onClick={() => fileInputRef.current?.click()}
                disabled={isThinking || isAnalyzingImage}
              >
                <ImagePlus className="w-5 h-5" />
              </Button>
            </div>

            <div className="flex-1 relative">
              <div className="flex items-end bg-card border rounded-3xl focus-within:border-primary/50 shadow-sm">
                <textarea
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
                  placeholder={selectedImage ? "What to do with image?" : "Message AURA... ✨"}
                  className="flex-1 bg-transparent border-0 resize-none py-3 px-4 text-[15px] focus:outline-none min-h-[44px] max-h-[120px]"
                  style={{ height: '44px' }}
                  disabled={isThinking || isAnalyzingImage || isGeneratingImage}
                  rows={1}
                />
                <div className="flex items-center pr-2 pb-1.5">
                  <ContinuousVoiceButton 
                    onTranscription={handleVoiceTranscription}
                    isProcessing={isThinking || isAnalyzingImage}
                    continuous={wakeWordEnabled}
                  />
                </div>
              </div>
            </div>

            <Button
              size="icon"
              className={cn(
                "h-11 w-11 rounded-full shadow-lg transition-all",
                (inputValue.trim() || selectedImage) ? "bg-primary hover:bg-primary/90" : "bg-muted"
              )}
              onClick={handleSend}
              disabled={(!inputValue.trim() && !selectedImage) || isThinking || isAnalyzingImage || isGeneratingImage}
            >
              {isAnalyzingImage || isGeneratingImage ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className={cn("w-5 h-5", (inputValue.trim() || selectedImage) ? "text-primary-foreground" : "text-muted-foreground")} />
              )}
            </Button>
          </div>

          {/* Bottom Row */}
          <div className="flex items-center justify-between mt-2 px-1">
            <Button
              variant="ghost"
              size="sm"
              className={cn('h-8 px-3 rounded-full text-xs', wakeWordEnabled && 'text-primary bg-primary/10')}
              onClick={toggleWakeWord}
            >
              <Radio className={cn('w-3.5 h-3.5 mr-1.5', wakeWordEnabled && 'animate-pulse')} />
              {wakeWordEnabled ? '"Hey AURA" On' : 'Wake Word'}
            </Button>

            <div className="flex items-center gap-1">
              {lastAuraMessage && (
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn('h-8 px-3 rounded-full text-xs', isSpeaking && 'text-primary bg-primary/10')}
                  onClick={() => handleSpeakMessage(lastAuraMessage.content)}
                >
                  <Volume2 className={cn("w-3.5 h-3.5 mr-1.5", isSpeaking && "animate-pulse")} />
                  {isSpeaking ? 'Speaking...' : 'Listen'}
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-3 rounded-full text-xs"
                onClick={() => setShowAutomation(true)}
              >
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                Actions
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      <AutomationModal isOpen={showAutomation} onClose={() => setShowAutomation(false)} />
    </div>
  );
};
