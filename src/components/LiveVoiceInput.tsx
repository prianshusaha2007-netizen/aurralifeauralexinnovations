import React, { useState, useCallback, useEffect } from 'react';
import { useScribe } from '@elevenlabs/react';
import { Mic, MicOff, Send, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface LiveVoiceInputProps {
  onTranscript: (text: string) => void;
  onClose?: () => void;
  className?: string;
}

export const LiveVoiceInput: React.FC<LiveVoiceInputProps> = ({
  onTranscript,
  onClose,
  className,
}) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fullTranscript, setFullTranscript] = useState('');

  const scribe = useScribe({
    modelId: 'scribe_v2_realtime',
    onPartialTranscript: (data) => {
      console.log('Partial:', data.text);
    },
    onCommittedTranscript: (data) => {
      console.log('Committed:', data.text);
      setFullTranscript(prev => prev + (prev ? ' ' : '') + data.text);
    },
  });

  const handleStart = useCallback(async () => {
    setError(null);
    setIsConnecting(true);
    setFullTranscript('');
    
    try {
      const { data, error: fnError } = await supabase.functions.invoke('elevenlabs-scribe-token');
      
      if (fnError || !data?.token) {
        throw new Error(fnError?.message || 'Failed to get token');
      }

      await scribe.connect({
        token: data.token,
        microphone: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
    } catch (err) {
      console.error('Scribe connection error:', err);
      setError(err instanceof Error ? err.message : 'Failed to start');
    } finally {
      setIsConnecting(false);
    }
  }, [scribe]);

  const handleStop = useCallback(() => {
    scribe.disconnect();
  }, [scribe]);

  const handleSend = useCallback(() => {
    const textToSend = (fullTranscript + (scribe.partialTranscript ? ' ' + scribe.partialTranscript : '')).trim();
    if (textToSend) {
      onTranscript(textToSend);
      setFullTranscript('');
      scribe.disconnect();
      onClose?.();
    }
  }, [fullTranscript, scribe, onTranscript, onClose]);

  const handleCancel = useCallback(() => {
    scribe.disconnect();
    setFullTranscript('');
    onClose?.();
  }, [scribe, onClose]);

  // Auto-start on mount
  useEffect(() => {
    handleStart();
    return () => {
      scribe.disconnect();
    };
  }, []);

  const displayText = fullTranscript + (scribe.partialTranscript ? (fullTranscript ? ' ' : '') + scribe.partialTranscript : '');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className={cn(
        "bg-card border border-border rounded-2xl p-4 shadow-lg",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {scribe.isConnected ? (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-sm font-medium text-foreground">Listening...</span>
            </div>
          ) : isConnecting ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Connecting...</span>
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">Tap mic to start</span>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleCancel}
          className="h-8 w-8 rounded-full"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="text-sm text-destructive mb-3 p-2 bg-destructive/10 rounded-lg">
          {error}
        </div>
      )}

      {/* Transcript Display */}
      <div className="min-h-[60px] max-h-[120px] overflow-y-auto mb-4 p-3 bg-muted/50 rounded-xl">
        {displayText ? (
          <p className="text-foreground text-sm leading-relaxed">
            {displayText}
            <span className="inline-block w-0.5 h-4 bg-primary ml-0.5 animate-pulse" />
          </p>
        ) : (
          <p className="text-muted-foreground text-sm italic">
            {scribe.isConnected ? 'Start speaking...' : 'Your words will appear here...'}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-center gap-3">
        {!scribe.isConnected ? (
          <Button
            onClick={handleStart}
            disabled={isConnecting}
            className="rounded-full h-12 w-12"
            size="icon"
          >
            {isConnecting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Mic className="w-5 h-5" />
            )}
          </Button>
        ) : (
          <Button
            onClick={handleStop}
            variant="destructive"
            className="rounded-full h-12 w-12"
            size="icon"
          >
            <MicOff className="w-5 h-5" />
          </Button>
        )}

        {displayText && (
          <Button
            onClick={handleSend}
            className="rounded-full px-6 gap-2"
          >
            <Send className="w-4 h-4" />
            Send
          </Button>
        )}
      </div>
    </motion.div>
  );
};
