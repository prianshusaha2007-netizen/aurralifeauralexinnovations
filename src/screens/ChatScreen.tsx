import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Sparkles, Menu, Volume2, Mic, Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AuraOrb } from '@/components/AuraOrb';
import { ChatBubble } from '@/components/ChatBubble';
import { AutomationModal } from '@/components/AutomationModal';
import { ActionsBar } from '@/components/ActionsBar';
import { USPTiles } from '@/components/USPTiles';
import { ModelSelector } from '@/components/ModelSelector';
import { VoiceButton } from '@/components/VoiceButton';
import { useAura } from '@/contexts/AuraContext';
import { useAuraChat } from '@/hooks/useAuraChat';
import { useVoiceCommands } from '@/hooks/useVoiceCommands';
import { useVoiceFeedback } from '@/hooks/useVoiceFeedback';
import { useWakeWord } from '@/hooks/useWakeWord';
import { useHotkeys } from '@/hooks/useHotkeys';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

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
  const [inputValue, setInputValue] = useState('');
  const [showAutomation, setShowAutomation] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gemini-flash');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [wakeWordEnabled, setWakeWordEnabled] = useState(false);
  const [showVoiceInput, setShowVoiceInput] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const voiceButtonRef = useRef<HTMLButtonElement>(null);

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

  // Send initial greeting if no messages
  useEffect(() => {
    if (chatMessages.length === 0 && userProfile.onboardingComplete) {
      const professionGreeting = userProfile.profession === 'Student' 
        ? "Need help with studies, notes, or just wanna chill?"
        : userProfile.profession === 'Working Professional'
        ? "Work stuff, emails, or just need a break? I'm here!"
        : "What are we working on today? I'm ready to help!";
      
      const greeting = `Hey ${userProfile.name}! 💫 What's up? ${professionGreeting}`;
      addChatMessage({ content: greeting, sender: 'aura' });
    }
  }, [userProfile.onboardingComplete]);

  const handleSend = async () => {
    if (!inputValue.trim() || isThinking) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    await sendMessage(userMessage, selectedModel);
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

  const lastAuraMessage = chatMessages.filter(m => m.sender === 'aura').slice(-1)[0];

  return (
    <div className="flex flex-col h-full">
      {/* Header with Orb and Controls */}
      <div className="flex flex-col items-center pt-4 pb-2 relative">
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
        
        {/* Voice Mode & Model Selector */}
        <div className="absolute top-2 right-4 z-10 flex items-center gap-2">
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

      {/* USP Tiles - show when chat is empty or has few messages */}
      {chatMessages.length <= 1 && (
        <div className="px-4 py-2">
          <USPTiles />
        </div>
      )}

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
      <div className="p-4 pb-24 bg-gradient-to-t from-background via-background to-transparent space-y-3">
        {/* Actions Bar */}
        <div className="max-w-lg mx-auto">
          <ActionsBar onActionSelect={handleActionSelect} />
        </div>
        
        <div className="flex items-center gap-2 max-w-lg mx-auto">
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
          
          <VoiceButton 
            ref={voiceButtonRef}
            onTranscription={handleVoiceTranscription}
            isProcessing={isThinking}
          />
          
          <div className="flex-1 relative">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Hey AURA, what's up..."
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
