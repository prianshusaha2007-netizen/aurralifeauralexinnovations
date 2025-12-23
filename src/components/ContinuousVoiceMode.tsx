import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Phone, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AuraOrb } from './AuraOrb';
import { AudioWaveform } from './AudioWaveform';
import { RealtimeChat } from '@/utils/RealtimeAudio';
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
  const [transcript, setTranscript] = useState('');
  const [auraResponse, setAuraResponse] = useState('');
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const chatRef = useRef<RealtimeChat | null>(null);

  const handleMessage = (event: any) => {
    console.log('Voice mode event:', event.type);
  };

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
  }, []);

  const handleTranscript = (text: string, isFinal: boolean) => {
    if (isFinal) {
      setAuraResponse(prev => prev + text);
    } else {
      setAuraResponse(prev => prev + text);
    }
  };

  const startConversation = async () => {
    setIsConnecting(true);
    try {
      const instructions = `You are AURA, a warm and friendly AI companion talking to ${userName}. 
Be conversational, natural, and engaging. Keep responses concise for voice (1-3 sentences usually).
You're like a supportive best friend - casual, warm, and genuinely interested.
Adapt your tone based on the conversation - playful when appropriate, supportive when needed.`;

      chatRef.current = new RealtimeChat(
        handleMessage,
        handleSpeakingChange,
        handleTranscript
      );
      await chatRef.current.init(instructions);
      setIsConnected(true);
      setTranscript('');
      setAuraResponse('');
      // Set initial analyser for input visualization
      setTimeout(() => {
        if (chatRef.current) {
          setAnalyser(chatRef.current.getInputAnalyser());
        }
      }, 500);
      toast.success('Voice mode connected!');
    } catch (error) {
      console.error('Error starting conversation:', error);
      toast.error('Failed to start voice mode. Please try again.');
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
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    // In a full implementation, you would mute the audio track
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
               isConnected ? (isSpeaking ? 'AURA is speaking...' : 'Listening...') : 
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
              <AudioWaveform 
                analyser={analyser} 
                isActive={isConnected} 
                mode={isSpeaking ? 'speaking' : 'listening'}
                className="mx-auto"
              />
              <p className="text-xs text-center text-muted-foreground mt-2">
                {isSpeaking ? '🔊 AURA is responding' : '🎤 Listening to you'}
              </p>
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

          {/* Close button */}
          <Button
            variant="ghost"
            className="absolute top-4 right-4"
            onClick={() => {
              if (isConnected) endConversation();
              onClose();
            }}
          >
            Close
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
