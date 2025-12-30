import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Sparkles, Menu, Volume2, Mic, Radio, Camera, ImagePlus, X, Loader2, Ghost, Timer, ChevronDown, GraduationCap, Gamepad2, Search, Pin, History, Crown, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AuraAvatar } from '@/components/AuraAvatar';
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
import { CreditWarning } from '@/components/CreditWarning';
import { UpgradeSheet } from '@/components/UpgradeSheet';
import { ChatSettingsSheet } from '@/components/ChatSettingsSheet';
import { useAura, ChatMessage } from '@/contexts/AuraContext';
import { useAuraChat } from '@/hooks/useAuraChat';
import { useVoiceCommands } from '@/hooks/useVoiceCommands';
import { useVoiceFeedback } from '@/hooks/useVoiceFeedback';
import { useWakeWord } from '@/hooks/useWakeWord';
import { useHotkeys } from '@/hooks/useHotkeys';
import { useWelcomeBack, updateLastActive } from '@/hooks/useWelcomeBack';
import { usePersonaContext } from '@/contexts/PersonaContext';
import { useCredits } from '@/hooks/useCredits';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();
  const { chatMessages, addChatMessage, updateChatMessage, deleteChatMessage, userProfile } = useAura();
  const { sendMessage, isThinking } = useAuraChat();
  const { avatarStyle, autoSwitchPersona } = usePersonaContext();
  const { getCreditStatus, useCreditsForAction } = useCredits();
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
  const [showUpgradeSheet, setShowUpgradeSheet] = useState(false);
  const [showChatSettings, setShowChatSettings] = useState(false);
  const [creditWarningShown, setCreditWarningShown] = useState(false);
  const [messageReactions, setMessageReactions] = useState<Record<string, string[]>>(() => {
    try {
      const saved = localStorage.getItem('aura-message-reactions');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Pinned messages
  const [pinnedMessageIds, setPinnedMessageIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('aura-pinned-messages');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  
  // Vanish Mode
  const [vanishMode, setVanishMode] = useState(false);
  const [vanishMessages, setVanishMessages] = useState<ChatMessage[]>([]);
  const [vanishTimer, setVanishTimer] = useState<number | null>(null);
  const [showVanishOptions, setShowVanishOptions] = useState(false);
  
  // Credit status
  const creditStatus = getCreditStatus();
  const aiName = userProfile.aiName || 'AURRA';
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

    // Check credit status before sending
    if (!creditStatus.canUseCredits && !creditStatus.allowFinalReply) {
      setShowUpgradeSheet(true);
      return;
    }

    const userMessage = inputValue.trim();
    setInputValue('');
    
    // Use credits for normal chat
    if (!vanishMode && !selectedImage && !isImageGenRequest(userMessage)) {
      await useCreditsForAction('normal_chat');
    }
    
    if (selectedImage && showImagePrompt) {
      await handleImageAnalysis(imagePrompt || userMessage || 'Analyze this image');
    } else if (selectedImage) {
      setShowImagePrompt(true);
      return;
    } else if (isImageGenRequest(userMessage)) {
      await useCreditsForAction('image_generation');
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
      const conversationHistory = vanishMessages.map(m => ({ 
        role: m.sender === 'user' ? 'user' : 'assistant' as const, 
        content: m.content 
      }));
      conversationHistory.push({ role: 'user', content: message });
      
      // Add thinking indicator
      const thinkingId = addVanishMessage({ content: '...', sender: 'aura' });
      
      // Get user's session token for authentication
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/aura-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          messages: conversationHistory,
          userProfile: {
            name: userProfile.name,
            age: userProfile.age,
            professions: userProfile.professions,
            goals: userProfile.goals,
            languages: userProfile.languages,
            tonePreference: userProfile.tonePreference,
          },
          preferredModel: selectedModel,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error('Failed to get response');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';
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
              fullContent += content;
              setVanishMessages(prev => 
                prev.map(m => m.id === thinkingId ? { ...m, content: fullContent } : m)
              );
            }
          } catch {}
        }
      }

      // Fallback if no content streamed
      if (!fullContent) {
        setVanishMessages(prev => 
          prev.map(m => m.id === thinkingId ? { ...m, content: "I'm here in vanish mode! 👻" } : m)
        );
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
    setMessageReactions(prev => {
      const existing = prev[messageId] || [];
      // Toggle: remove if already exists, add if not
      const hasReaction = existing.includes(emoji);
      const updated = hasReaction 
        ? existing.filter(e => e !== emoji)
        : [...existing, emoji];
      
      const newReactions = { ...prev, [messageId]: updated };
      // Persist to localStorage
      localStorage.setItem('aura-message-reactions', JSON.stringify(newReactions));
      return newReactions;
    });
  };

  const handleDeleteMessage = (messageId: string) => {
    // For vanish mode, just remove from local state
    if (vanishMode) {
      setVanishMessages(prev => prev.filter(m => m.id !== messageId));
    } else {
      // Use context function to delete from state and database
      deleteChatMessage(messageId);
    }
    // Also remove reactions for that message
    setMessageReactions(prev => {
      const updated = { ...prev };
      delete updated[messageId];
      localStorage.setItem('aura-message-reactions', JSON.stringify(updated));
      return updated;
    });
  };

  const handleEditMessage = (messageId: string, newContent: string) => {
    updateChatMessage(messageId, newContent);
  };

  const handlePinMessage = (messageId: string) => {
    setPinnedMessageIds(prev => {
      const isPinned = prev.includes(messageId);
      const updated = isPinned 
        ? prev.filter(id => id !== messageId)
        : [...prev, messageId];
      localStorage.setItem('aura-pinned-messages', JSON.stringify(updated));
      toast.success(isPinned ? 'Message unpinned' : 'Message pinned 📌');
      return updated;
    });
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
  
  // Filter messages by search
  const filteredMessages = searchQuery.trim()
    ? displayMessages.filter(m => 
        m.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : displayMessages;

  // Separate pinned and unpinned messages
  const pinnedMessages = filteredMessages.filter(m => pinnedMessageIds.includes(m.id));
  const unpinnedMessages = filteredMessages.filter(m => !pinnedMessageIds.includes(m.id));
  
  const lastAuraMessage = displayMessages.filter(m => m.sender === 'aura').slice(-1)[0];

  return (
    <div className={cn("flex flex-col h-full relative", vanishMode && "vanish-mode-active")}>
      {/* Floating Menu Button - Always visible top-left */}
      <Button 
        variant="secondary" 
        size="icon" 
        className="fixed top-3 left-3 z-[60] h-10 w-10 rounded-full shadow-lg bg-background/95 backdrop-blur-md border border-border/50" 
        onClick={onMenuClick}
      >
        <Menu className="w-5 h-5" />
      </Button>

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
            className="bg-primary/10 border-b border-primary/20 overflow-hidden z-20 mt-14"
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
        <div className="flex items-center justify-between px-3 py-2 pl-14">
          {/* Center - Title with Avatar */}
          <div className="flex items-center gap-2">
            <AuraAvatar 
              style={avatarStyle as any}
              size="sm" 
              isThinking={isThinking || isVoiceFeedbackSpeaking} 
              isSpeaking={isVoiceFeedbackSpeaking}
            />
            <span className="font-semibold text-sm">{aiName}</span>
            {creditStatus.isPremium && (
              <Crown className="w-3 h-3 text-primary" />
            )}
          </div>
          
          {/* Right - Actions */}
          <div className="flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={() => navigate('/chat-history')}
              title="Chat History"
            >
              <History className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn("h-8 w-8 rounded-full", showSearch && "text-primary bg-primary/20")}
              onClick={() => setShowSearch(!showSearch)}
            >
              <Search className="w-4 h-4" />
            </Button>
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
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 rounded-full" 
              onClick={() => setShowChatSettings(true)}
              title="Chat Settings"
            >
              <Settings2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <AnimatePresence>
          {showSearch && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-3 flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search messages..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 text-sm rounded-full bg-muted/50 border border-border/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
                    autoFocus
                  />
                </div>
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-full"
                    onClick={() => setSearchQuery('')}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
              {searchQuery && (
                <div className="px-4 pb-2 text-xs text-muted-foreground">
                  {filteredMessages.length} result{filteredMessages.length !== 1 ? 's' : ''} found
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
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
          {/* Pinned Messages Section */}
          {pinnedMessages.length > 0 && !searchQuery && (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-3 px-2">
                <Pin className="w-4 h-4 text-primary" />
                <span className="text-xs font-medium text-primary">Pinned Messages</span>
              </div>
              <div className="space-y-3 p-3 rounded-xl bg-primary/5 border border-primary/20">
                {pinnedMessages.map((message) => (
                  <ChatBubble
                    key={message.id}
                    content={message.content}
                    sender={message.sender}
                    timestamp={message.timestamp}
                    onSpeak={message.sender === 'aura' ? handleSpeakMessage : undefined}
                    onReply={() => handleReply(message as ExtendedMessage)}
                    onReact={(emoji) => handleReaction(message.id, emoji)}
                    onDelete={() => handleDeleteMessage(message.id)}
                    onEdit={message.sender === 'user' ? (newContent) => handleEditMessage(message.id, newContent) : undefined}
                    onPin={() => handlePinMessage(message.id)}
                    isPinned={true}
                    reactions={messageReactions[message.id]}
                    replyTo={replyingTo?.id === message.id ? null : undefined}
                    searchHighlight={searchQuery}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Regular Messages */}
          {(searchQuery ? filteredMessages : unpinnedMessages).map((message) => (
            <ChatBubble
              key={message.id}
              content={message.content}
              sender={message.sender}
              timestamp={message.timestamp}
              onSpeak={message.sender === 'aura' ? handleSpeakMessage : undefined}
              onReply={() => handleReply(message as ExtendedMessage)}
              onReact={(emoji) => handleReaction(message.id, emoji)}
              onDelete={() => handleDeleteMessage(message.id)}
              onEdit={message.sender === 'user' ? (newContent) => handleEditMessage(message.id, newContent) : undefined}
              onPin={() => handlePinMessage(message.id)}
              isPinned={pinnedMessageIds.includes(message.id)}
              reactions={messageReactions[message.id]}
              replyTo={replyingTo?.id === message.id ? null : undefined}
              searchHighlight={searchQuery}
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

          {/* Credit Soft Warning */}
          {creditStatus.showSoftWarning && !creditWarningShown && !creditStatus.isPremium && (
            <CreditWarning
              type="soft"
              aiName={aiName}
              onContinueTomorrow={() => setCreditWarningShown(true)}
              onUpgrade={() => setShowUpgradeSheet(true)}
            />
          )}

          {/* Credit Limit Reached Warning */}
          {creditStatus.isLimitReached && !creditStatus.isPremium && (
            <CreditWarning
              type="limit"
              aiName={aiName}
              onContinueTomorrow={() => {}}
              onUpgrade={() => setShowUpgradeSheet(true)}
            />
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
      
      {/* Upgrade Sheet */}
      <UpgradeSheet open={showUpgradeSheet} onOpenChange={setShowUpgradeSheet} />
      
      {/* Chat Settings Sheet */}
      <ChatSettingsSheet open={showChatSettings} onOpenChange={setShowChatSettings} />
    </div>
  );
};
