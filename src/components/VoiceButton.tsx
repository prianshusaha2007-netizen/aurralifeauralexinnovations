import React, { useState, useRef, useCallback, forwardRef } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Capacitor } from '@capacitor/core';

interface VoiceButtonProps {
  onTranscription: (text: string) => void;
  isProcessing?: boolean;
  className?: string;
}

// Helper to request microphone permission
const requestMicrophonePermission = async (): Promise<boolean> => {
  try {
    // On native platforms, we need to handle permissions differently
    if (Capacitor.isNativePlatform()) {
      // For iOS/Android, getUserMedia will trigger the native permission dialog
      // But we should try to get a stream first to trigger the prompt
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      return true;
    }
    
    // For web, check if permissions API is available
    if (navigator.permissions) {
      try {
        const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        if (result.state === 'denied') {
          toast.error('Microphone access denied. Please enable in your browser/device settings.');
          return false;
        }
      } catch {
        // Permissions API might not support microphone query
      }
    }
    
    return true;
  } catch (error) {
    console.error('Permission request error:', error);
    return false;
  }
};

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
      // First check/request microphone permission
      const hasPermission = await requestMicrophonePermission();
      if (!hasPermission) {
        return;
      }

      // Check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error('Audio recording is not supported on this device/browser');
        return;
      }

      // Try to get the audio stream with fallback options for mobile compatibility
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            sampleRate: 16000,
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: true,
          }
        });
      } catch (constraintError) {
        // Fallback to basic audio constraints for older devices
        console.log('Falling back to basic audio constraints');
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }

      // Check for supported MIME types
      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/webm';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'audio/mp4';
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = ''; // Use browser default
          }
        }
      }

      const recorderOptions: MediaRecorderOptions = {};
      if (mimeType) {
        recorderOptions.mimeType = mimeType;
      }

      const mediaRecorder = new MediaRecorder(stream, recorderOptions);

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: mimeType || 'audio/webm' });
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
    } catch (error: any) {
      console.error('Microphone error:', error);
      
      // Provide more specific error messages
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        toast.error('Microphone access denied. Please allow microphone access in your device settings.');
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        toast.error('No microphone found. Please connect a microphone.');
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        toast.error('Microphone is in use by another app. Please close other apps using the microphone.');
      } else if (error.name === 'OverconstrainedError') {
        toast.error('Microphone does not support the required settings.');
      } else if (error.name === 'SecurityError') {
        toast.error('Microphone access blocked. Please use HTTPS or localhost.');
      } else {
        toast.error('Could not access microphone. Please check permissions in your device settings.');
      }
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
