import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Phone, Volume2, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AuraOrb } from './AuraOrb';
import { AudioWaveform } from './AudioWaveform';
import { VolumeIndicator } from './VolumeIndicator';
import { VoiceHistorySheet } from './VoiceHistorySheet';
import { RealtimeChat } from '@/utils/RealtimeAudio';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ContinuousVoiceModeProps {
  isOpen: boolean;
  onClose: () => void;
  userName?: string;
}

export const ContinuousVoiceMode: React.FC<ContinuousVoiceModeProps> = ({
  isOpen,
  onClose,
  userName = 'there'
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [auraResponse, setAuraResponse] = useState('');
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [inputAnalyser, setInputAnalyser] = useState<AnalyserNode | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const chatRef = useRef<RealtimeChat | null>(null);
  const conversationIdRef = useRef<string>(crypto.randomUUID());
  const pendingUserTranscriptRef = useRef<string>('');
  const pendingAuraTranscriptRef = useRef<string>('');

  const handleVoiceActivity = useCallback((isActive: boolean) => {
    setIsUserSpeaking(isActive);
  }, []);

  // Save transcript to database
  const saveTranscript = useCallback(async (role: 'user' | 'assistant', content: string) => {
    if (!content.trim()) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from('voice_transcripts').insert({
        user_id: user.id,
        conversation_id: conversationIdRef.current,
        role,
        content: content.trim()
      });
    } catch (error) {
      console.error('Error saving transcript:', error);
    }
  }, []);

  const handleMessage = useCallback((event: any) => {
    console.log('Voice mode event:', event.type);
    
    // Capture user's speech transcription
    if (event.type === 'conversation.item.input_audio_transcription.completed') {
      const userText = event.transcript || '';
      if (userText.trim()) {
        pendingUserTranscriptRef.current = userText;
        setTranscript(userText);
        saveTranscript('user', userText);
      }
    }
  }, [saveTranscript]);

  const handleSpeakingChange = useCallback((speaking: boolean) => {
    setIsSpeaking(speaking);
    // Update analyser based on speaking state
    if (chatRef.current) {
      if (speaking) {
        setAnalyser(chatRef.current.getOutputAnalyser());
      } else {
        setAnalyser(chatRef.current.getInputAnalyser());
      }
    }
    
    // When AI stops speaking, save the accumulated response
    if (!speaking && pendingAuraTranscriptRef.current.trim()) {
      saveTranscript('assistant', pendingAuraTranscriptRef.current);
      pendingAuraTranscriptRef.current = '';
    }
  }, [saveTranscript]);

  const handleTranscript = useCallback((text: string, isFinal: boolean) => {
    pendingAuraTranscriptRef.current += text;
    setAuraResponse(prev => prev + text);
  }, []);

  const startConversation = async () => {
    setIsConnecting(true);
    // Generate new conversation ID for this session
    conversationIdRef.current = crypto.randomUUID();
    pendingUserTranscriptRef.current = '';
    pendingAuraTranscriptRef.current = '';
    
    try {
      chatRef.current = new RealtimeChat(
        handleMessage,
        handleSpeakingChange,
        handleTranscript
      );
      // Pass userName to edge function for personalized greeting
      await chatRef.current.init(undefined, userName);
      setIsConnected(true);
      setTranscript('');
      setAuraResponse('');
      // Set initial analyser for input visualization
      setTimeout(() => {
        if (chatRef.current) {
          const inputAn = chatRef.current.getInputAnalyser();
          setAnalyser(inputAn);
          setInputAnalyser(inputAn);
        }
      }, 500);
      toast.success('Voice mode ready — just speak naturally');
    } catch (error) {
      console.error('Error starting conversation:', error);
      toast.error('Could not connect to voice mode. Please try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  const endConversation = () => {
    chatRef.current?.disconnect();
    chatRef.current = null;
    setIsConnected(false);
    setIsSpeaking(false);
    setTranscript('');
    setAuraResponse('');
    setAnalyser(null);
    setInputAnalyser(null);
  };

  const toggleMute = () => {
    const newMuteState = !isMuted;
    setIsMuted(newMuteState);
    chatRef.current?.setMuted(newMuteState);
    toast(newMuteState ? 'Microphone muted' : 'Microphone unmuted');
  };

  useEffect(() => {
    return () => {
      chatRef.current?.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!isOpen && isConnected) {
      endConversation();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 bg-background"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-accent/5" />
        
        {/* Animated background orbs */}
        <motion.div
          className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-primary/10 blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full bg-accent/10 blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />

        <div className="relative h-full flex flex-col items-center justify-center px-6">
          {/* Status text */}
          <motion.div
            className="absolute top-12 text-center"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="text-sm text-muted-foreground">
              {isConnecting ? 'Connecting...' : 
               isMuted ? '🔇 Microphone muted' :
               isConnected ? (isSpeaking ? 'AURA is speaking...' : 
                 isUserSpeaking ? '🎙️ You are speaking...' : 'Listening...') : 
               'Voice Conversation Mode'}
            </p>
          </motion.div>

          {/* Main orb */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
          >
            <AuraOrb 
              size="xl" 
              isThinking={isConnecting} 
              className={isSpeaking ? 'animate-pulse-glow' : ''}
            />
          </motion.div>

          {/* Audio Waveform Visualization */}
          {isConnected && (
            <motion.div
              className="mt-8 w-full max-w-sm px-4"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center justify-center gap-6">
                {/* Volume Indicator with VAD */}
                <VolumeIndicator
                  analyser={inputAnalyser}
                  isActive={isConnected && !isSpeaking && !isMuted}
                  showLabel={true}
                  onVoiceActivity={handleVoiceActivity}
                  vadThreshold={15}
                />
                
                {/* Audio Waveform */}
                <div className="flex-1">
                  <AudioWaveform 
                    analyser={analyser} 
                    isActive={isConnected} 
                    mode={isSpeaking ? 'speaking' : 'listening'}
                    className="mx-auto"
                  />
                  <p className="text-xs text-center text-muted-foreground mt-2">
                    {isMuted ? '🔇 Muted' : 
                     isSpeaking ? '🔊 AURA is responding' : 
                     isUserSpeaking ? '🎙️ Hearing you...' : '🎤 Listening...'}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Transcript display */}
          {isConnected && (auraResponse || transcript) && (
            <motion.div
              className="mt-4 max-w-sm text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {auraResponse && (
                <p className="text-foreground/90 text-sm leading-relaxed">
                  {auraResponse}
                </p>
              )}
            </motion.div>
          )}

          {/* Controls */}
          <motion.div
            className="absolute bottom-12 flex items-center gap-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {!isConnected ? (
              <Button
                size="lg"
                className="rounded-full h-16 px-8 aura-gradient text-primary-foreground"
                onClick={startConversation}
                disabled={isConnecting}
              >
                <Mic className="w-5 h-5 mr-2" />
                {isConnecting ? 'Connecting...' : 'Start Talking'}
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full h-14 w-14"
                  onClick={toggleMute}
                >
                  {isMuted ? (
                    <MicOff className="w-5 h-5 text-destructive" />
                  ) : (
                    <Mic className="w-5 h-5" />
                  )}
                </Button>
                
                <Button
                  size="icon"
                  className="rounded-full h-16 w-16 bg-destructive hover:bg-destructive/90"
                  onClick={endConversation}
                >
                  <Phone className="w-6 h-6 rotate-[135deg]" />
                </Button>
                
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full h-14 w-14"
                  onClick={() => {}}
                >
                  <Volume2 className="w-5 h-5" />
                </Button>
              </>
            )}
          </motion.div>

          {/* History and Close buttons */}
          <div className="absolute top-4 right-4 flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowHistory(true)}
            >
              <History className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                if (isConnected) endConversation();
                onClose();
              }}
            >
              Close
            </Button>
          </div>

          {/* Voice History Sheet */}
          <VoiceHistorySheet 
            open={showHistory} 
            onOpenChange={setShowHistory} 
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
