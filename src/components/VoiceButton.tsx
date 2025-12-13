import React, { useState, useRef, useCallback, forwardRef } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface VoiceButtonProps {
  onTranscription: (text: string) => void;
  isProcessing?: boolean;
  className?: string;
}

export const VoiceButton = forwardRef<HTMLButtonElement, VoiceButtonProps>(({
  onTranscription,
  isProcessing = false,
  className,
}, ref) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        }
      });

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
        stream.getTracks().forEach(track => track.stop());
        
        setIsTranscribing(true);
        try {
          const reader = new FileReader();
          reader.onloadend = async () => {
            const base64Audio = (reader.result as string).split(',')[1];
            
            const { data, error } = await supabase.functions.invoke('voice-to-text', {
              body: { audio: base64Audio }
            });
            
            if (error) {
              throw error;
            }
            
            if (data?.requiresSetup) {
              toast.info('Voice input needs setup', {
                description: 'Add OpenAI API key in settings for voice features.',
              });
            } else if (data?.text) {
              onTranscription(data.text);
              toast.success('Voice captured!');
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

      mediaRecorder.start();
      setIsRecording(true);
      toast.info('🎤 Recording... Tap again to stop');
    } catch (error) {
      console.error('Microphone error:', error);
      toast.error('Could not access microphone. Please check permissions.');
    }
  }, [onTranscription]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  const handleClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const isDisabled = isProcessing || isTranscribing;

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      className={cn(
        'rounded-full shrink-0 transition-all duration-300',
        isRecording 
          ? 'text-destructive bg-destructive/10 animate-pulse' 
          : 'text-muted-foreground hover:text-primary',
        isDisabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      onClick={handleClick}
      disabled={isDisabled}
    >
      {isTranscribing ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : isRecording ? (
        <MicOff className="w-5 h-5" />
      ) : (
        <Mic className="w-5 h-5" />
      )}
    </Button>
  );
});

VoiceButton.displayName = 'VoiceButton';
