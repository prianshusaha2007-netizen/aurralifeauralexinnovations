import React, { useState, useEffect, useCallback } from 'react';
import { Mic, MicOff, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface VoiceInputButtonProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
  className?: string;
}

export const VoiceInputButton: React.FC<VoiceInputButtonProps> = ({
  onTranscript,
  disabled = false,
  className,
}) => {
  const { isListening, isProcessing, startListening, stopListening, cancelListening } = useVoiceInput();
  const [pulseAnimation, setPulseAnimation] = useState(false);

  useEffect(() => {
    if (isListening) {
      setPulseAnimation(true);
    } else {
      setPulseAnimation(false);
    }
  }, [isListening]);

  const handleClick = useCallback(async () => {
    if (isListening) {
      const transcript = await stopListening();
      if (transcript) {
        onTranscript(transcript);
      }
    } else if (!isProcessing) {
      startListening();
    }
  }, [isListening, isProcessing, startListening, stopListening, onTranscript]);

  const handleCancel = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    cancelListening();
  }, [cancelListening]);

  return (
    <div className={cn("relative", className)}>
      {/* Calm, gentle pulse animation - not flashy */}
      <AnimatePresence>
        {isListening && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 -m-3"
          >
            {/* Outer ring - subtle breathe */}
            <motion.div 
              className="absolute inset-0 rounded-full bg-primary/10"
              animate={{ 
                scale: [1, 1.15, 1],
                opacity: [0.4, 0.2, 0.4]
              }}
              transition={{ 
                duration: 2.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            {/* Inner ring - gentle pulse */}
            <motion.div 
              className="absolute inset-1 rounded-full bg-primary/15"
              animate={{ 
                scale: [1, 1.08, 1],
                opacity: [0.5, 0.3, 0.5]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.2
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "h-11 w-11 rounded-2xl transition-all duration-200 relative z-10",
          isListening && "bg-primary/15 text-primary hover:bg-primary/20",
          isProcessing && "text-muted-foreground",
          !isListening && !isProcessing && "text-muted-foreground hover:text-primary hover:bg-primary/8"
        )}
        onClick={handleClick}
        disabled={disabled || isProcessing}
      >
        {isProcessing ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : isListening ? (
          <MicOff className="w-5 h-5" />
        ) : (
          <Mic className="w-5 h-5" />
        )}
      </Button>

      {/* Listening indicator - calm, not alarming */}
      <AnimatePresence>
        {isListening && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            className="absolute left-full ml-3 top-1/2 -translate-y-1/2 flex items-center gap-2"
          >
            <span className="text-xs text-primary font-medium whitespace-nowrap">
              Listening...
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-xl hover:bg-muted/60"
              onClick={handleCancel}
            >
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};