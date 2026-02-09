import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Mic } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RealtimeChat } from '@/utils/RealtimeAudio';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface VoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName?: string;
}

export const VoiceModal: React.FC<VoiceModalProps> = ({ 
  isOpen, 
  onClose, 
  userName = 'there' 
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const chatRef = useRef<RealtimeChat | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const handleMessage = useCallback((event: any) => {
    console.log('Voice event:', event.type);
  }, []);

  const handleSpeakingChange = useCallback((speaking: boolean) => {
    setIsSpeaking(speaking);
  }, []);

  const handleTranscript = useCallback((text: string, isFinal: boolean) => {
    if (isFinal) {
      setTranscript(text);
      setTimeout(() => setTranscript(''), 4000);
    }
  }, []);

  const startConversation = async () => {
    setIsConnecting(true);
    try {
      chatRef.current = new RealtimeChat(
        handleMessage,
        handleSpeakingChange,
        handleTranscript
      );
      await chatRef.current.init(undefined, userName);
      setIsConnected(true);
      setTranscript('');
      toast.success('Ready', { duration: 1500 });
    } catch (error) {
      console.error('Error starting voice:', error);
      toast.error('Could not connect');
    } finally {
      setIsConnecting(false);
    }
  };

  const endConversation = useCallback(() => {
    chatRef.current?.disconnect();
    chatRef.current = null;
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
    setIsConnected(false);
    setIsSpeaking(false);
    setTranscript('');
  }, []);

  useEffect(() => {
    return () => endConversation();
  }, [endConversation]);

  useEffect(() => {
    if (!isOpen && isConnected) {
      endConversation();
    }
  }, [isOpen, isConnected, endConversation]);

  const handleClose = useCallback(() => {
    endConversation();
    onClose();
  }, [endConversation, onClose]);

  // Status message - warm and human
  const getStatusMessage = () => {
    if (isConnecting) return 'One moment...';
    if (isSpeaking) return 'Speaking...';
    if (isConnected) return 'Listening';
    return 'Tap to speak';
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm bg-background/95 backdrop-blur-xl border-0 shadow-2xl p-0 overflow-hidden [&>button]:hidden rounded-3xl">
        <div className="relative min-h-[380px] flex flex-col items-center justify-center px-8 py-10">
          {/* Subtle close */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Central breathing orb */}
          <motion.div
            className="relative mb-8"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 150, damping: 20 }}
          >
            {/* Outer glow ring - breathing animation */}
            <motion.div
              className={`absolute inset-0 rounded-full ${
                isSpeaking 
                  ? 'bg-primary/20' 
                  : isConnected 
                    ? 'bg-primary/10' 
                    : 'bg-muted/30'
              }`}
              animate={{
                scale: isConnected ? [1, 1.15, 1] : 1,
                opacity: isConnected ? [0.4, 0.6, 0.4] : 0.3,
              }}
              transition={{
                duration: isSpeaking ? 1.5 : 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              style={{ width: 140, height: 140, marginLeft: -10, marginTop: -10 }}
            />
            
            {/* Main orb */}
            <motion.button
              onClick={!isConnected ? startConversation : undefined}
              disabled={isConnecting}
              className={`relative w-[120px] h-[120px] rounded-full flex items-center justify-center transition-all ${
                isConnected 
                  ? 'bg-gradient-to-br from-primary/80 to-primary cursor-default' 
                  : 'bg-gradient-to-br from-primary/60 to-primary hover:from-primary/70 hover:to-primary cursor-pointer'
              }`}
              whileTap={!isConnected ? { scale: 0.95 } : undefined}
            >
              <Mic className={`w-8 h-8 text-primary-foreground ${isConnecting ? 'animate-pulse' : ''}`} />
            </motion.button>
          </motion.div>

          {/* Status - minimal, warm */}
          <motion.p
            className="text-lg font-light text-foreground/80 mb-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {getStatusMessage()}
          </motion.p>

          {/* Transcript - gentle appearance */}
          <div className="h-12 flex items-center justify-center">
            <AnimatePresence mode="wait">
              {transcript && (
                <motion.p
                  key={transcript}
                  className="text-sm text-muted-foreground text-center max-w-[280px]"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                >
                  "{transcript}"
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* End button - only when connected */}
          <AnimatePresence>
            {isConnected && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ delay: 0.3 }}
                className="mt-6"
              >
                <Button
                  variant="ghost"
                  onClick={handleClose}
                  className="text-muted-foreground hover:text-foreground rounded-full px-6"
                >
                  Done
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
};
