import React, { useState, useCallback, useEffect, useRef } from 'react';
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

// Audio Waveform Visualization Component
const AudioWaveformVisualizer: React.FC<{ isActive: boolean }> = ({ isActive }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);

  useEffect(() => {
    if (!isActive) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      // Clear canvas when not active
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      }
      return;
    }

    const setupAudio = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const audioContext = new AudioContext();
        const source = audioContext.createMediaStreamSource(stream);
        const analyzer = audioContext.createAnalyser();
        
        analyzer.fftSize = 64;
        const bufferLength = analyzer.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        source.connect(analyzer);
        analyzerRef.current = analyzer;
        dataArrayRef.current = dataArray;

        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const draw = () => {
          if (!analyzerRef.current || !dataArrayRef.current) return;
          
          animationRef.current = requestAnimationFrame(draw);
          analyzerRef.current.getByteFrequencyData(dataArrayRef.current as Uint8Array<ArrayBuffer>);
          
          const width = canvas.width;
          const height = canvas.height;
          
          ctx.clearRect(0, 0, width, height);
          
          const barCount = 24;
          const barWidth = width / barCount - 2;
          const centerY = height / 2;
          
          for (let i = 0; i < barCount; i++) {
            const dataIndex = Math.floor(i * dataArrayRef.current.length / barCount);
            const value = dataArrayRef.current[dataIndex];
            const barHeight = (value / 255) * (height * 0.8);
            
            const x = i * (barWidth + 2);
            
            // Create gradient for bars
            const gradient = ctx.createLinearGradient(0, centerY - barHeight / 2, 0, centerY + barHeight / 2);
            gradient.addColorStop(0, 'hsl(var(--primary) / 0.8)');
            gradient.addColorStop(0.5, 'hsl(var(--primary))');
            gradient.addColorStop(1, 'hsl(var(--primary) / 0.8)');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.roundRect(x, centerY - barHeight / 2, barWidth, Math.max(barHeight, 4), 2);
            ctx.fill();
          }
        };
        
        draw();

        return () => {
          stream.getTracks().forEach(track => track.stop());
          audioContext.close();
        };
      } catch (error) {
        console.error('Error setting up audio visualization:', error);
      }
    };

    setupAudio();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive]);

  return (
    <canvas
      ref={canvasRef}
      width={280}
      height={48}
      className="w-full h-12"
    />
  );
};

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

      {/* Waveform Visualization */}
      {scribe.isConnected && (
        <div className="mb-3 p-2 bg-muted/30 rounded-xl">
          <AudioWaveformVisualizer isActive={scribe.isConnected} />
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
