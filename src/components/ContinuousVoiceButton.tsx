import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Mic, MicOff, Loader2, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface ContinuousVoiceButtonProps {
  onTranscription: (text: string) => void;
  isProcessing?: boolean;
  className?: string;
  continuous?: boolean;
}

export const ContinuousVoiceButton: React.FC<ContinuousVoiceButtonProps> = ({
  onTranscription,
  isProcessing = false,
  className,
  continuous = false,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopListening();
    };
  }, []);

  const updateAudioLevel = useCallback(() => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    
    const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
    setAudioLevel(Math.min(average / 128, 1));

    if (isListening) {
      animationRef.current = requestAnimationFrame(updateAudioLevel);
    }
  }, [isListening]);

  const startListening = useCallback(async () => {
    try {
      // Enhanced audio constraints for better quality
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });

      streamRef.current = stream;

      // Set up audio analysis for visual feedback
      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        await processAudio(blob);
        
        // If continuous mode, restart recording after processing
        if (continuous && isListening) {
          setTimeout(() => {
            if (streamRef.current && mediaRecorderRef.current) {
              chunksRef.current = [];
              mediaRecorderRef.current.start();
            }
          }, 100);
        }
      };

      mediaRecorder.start();
      setIsListening(true);
      animationRef.current = requestAnimationFrame(updateAudioLevel);
      
      toast.success('🎤 Listening with noise cancellation enabled...', { duration: 2000 });

      // Set up silence detection for auto-stop in continuous mode
      if (continuous) {
        setupSilenceDetection();
      }
    } catch (error) {
      console.error('Microphone error:', error);
      toast.error('Could not access microphone. Please check permissions.');
    }
  }, [continuous, updateAudioLevel, isListening]);

  const setupSilenceDetection = useCallback(() => {
    let silenceStart: number | null = null;
    const SILENCE_THRESHOLD = 10;
    const SILENCE_DURATION = 2000; // 2 seconds of silence to stop

    const checkSilence = () => {
      if (!analyserRef.current || !isListening) return;

      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(dataArray);
      
      const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;

      if (average < SILENCE_THRESHOLD) {
        if (!silenceStart) {
          silenceStart = Date.now();
        } else if (Date.now() - silenceStart > SILENCE_DURATION) {
          // Detected prolonged silence, stop and process
          if (mediaRecorderRef.current?.state === 'recording') {
            mediaRecorderRef.current.stop();
          }
          silenceStart = null;
          return;
        }
      } else {
        silenceStart = null;
      }

      silenceTimeoutRef.current = setTimeout(checkSilence, 100);
    };

    checkSilence();
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    setIsListening(false);
    setAudioLevel(0);
  }, []);

  const processAudio = async (blob: Blob) => {
    if (blob.size < 1000) return; // Ignore very short recordings

    setIsTranscribing(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Audio = (reader.result as string).split(',')[1];
        
        const { data, error } = await supabase.functions.invoke('voice-to-text', {
          body: { audio: base64Audio }
        });
        
        if (error) throw error;
        
        if (data?.requiresSetup) {
          toast.info('Voice input needs setup', {
            description: 'Add OpenAI API key for voice features.',
          });
        } else if (data?.text) {
          onTranscription(data.text);
        } else if (data?.error) {
          throw new Error(data.error);
        }
        
        setIsTranscribing(false);
      };
      reader.readAsDataURL(blob);
    } catch (error) {
      console.error('Transcription error:', error);
      toast.error('Could not process voice input');
      setIsTranscribing(false);
    }
  };

  const handleClick = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const isDisabled = isProcessing || isTranscribing;

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn(
        'rounded-full shrink-0 transition-all duration-300 relative',
        isListening 
          ? 'text-destructive bg-destructive/10' 
          : 'text-muted-foreground hover:text-primary',
        isDisabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      onClick={handleClick}
      disabled={isDisabled}
    >
      {/* Audio level indicator ring */}
      {isListening && (
        <span
          className="absolute inset-0 rounded-full border-2 border-destructive animate-pulse"
          style={{
            transform: `scale(${1 + audioLevel * 0.3})`,
            opacity: 0.5 + audioLevel * 0.5,
          }}
        />
      )}
      
      {isTranscribing ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : isListening ? (
        <MicOff className="w-5 h-5 animate-pulse" />
      ) : (
        <Mic className="w-5 h-5" />
      )}
    </Button>
  );
};
