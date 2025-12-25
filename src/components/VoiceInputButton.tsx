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
      <AnimatePresence>
        {isListening && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="absolute inset-0 -m-2"
          >
            <div className="absolute inset-0 rounded-full bg-destructive/20 animate-ping" />
            <div className="absolute inset-0 rounded-full bg-destructive/10 animate-pulse" />
          </motion.div>
        )}
      </AnimatePresence>

      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "h-10 w-10 rounded-full transition-all relative z-10",
          isListening && "bg-destructive/10 text-destructive hover:bg-destructive/20",
          isProcessing && "text-muted-foreground",
          !isListening && !isProcessing && "text-muted-foreground hover:text-foreground"
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

      <AnimatePresence>
        {isListening && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, x: 10 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.8, x: 10 }}
            className="absolute left-full ml-2 top-1/2 -translate-y-1/2 flex items-center gap-2"
          >
            <span className="text-xs text-destructive font-medium whitespace-nowrap">
              Listening...
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 rounded-full"
              onClick={handleCancel}
            >
              <X className="w-3 h-3" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
