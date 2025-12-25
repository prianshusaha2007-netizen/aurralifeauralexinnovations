import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface VoiceInputState {
  isListening: boolean;
  isProcessing: boolean;
  transcript: string;
  error: string | null;
}

export const useVoiceInput = () => {
  const [state, setState] = useState<VoiceInputState>({
    isListening: false,
    isProcessing: false,
    transcript: '',
    error: null,
  });
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const startListening = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isListening: true, error: null, transcript: '' }));
      
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        }
      });
      
      streamRef.current = stream;
      chunksRef.current = [];
      
      // Detect best MIME type
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/mp4';
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        setState(prev => ({ ...prev, isListening: false, isProcessing: true }));
        
        const audioBlob = new Blob(chunksRef.current, { type: mimeType });
        
        try {
          // Convert to base64
          const reader = new FileReader();
          const base64Promise = new Promise<string>((resolve) => {
            reader.onloadend = () => {
              const base64 = (reader.result as string).split(',')[1];
              resolve(base64);
            };
          });
          reader.readAsDataURL(audioBlob);
          const base64Audio = await base64Promise;
          
          // Send to transcription
          const { data, error } = await supabase.functions.invoke('voice-to-text', {
            body: { audio: base64Audio }
          });
          
          if (error) throw error;
          
          const transcribedText = data?.text || '';
          setState(prev => ({ 
            ...prev, 
            isProcessing: false, 
            transcript: transcribedText 
          }));
          
          return transcribedText;
        } catch (err) {
          console.error('Transcription error:', err);
          setState(prev => ({ 
            ...prev, 
            isProcessing: false, 
            error: 'Failed to transcribe audio' 
          }));
          toast.error('Could not transcribe audio');
          return '';
        }
      };
      
      mediaRecorder.start(100);
      
    } catch (err) {
      console.error('Microphone error:', err);
      setState(prev => ({ 
        ...prev, 
        isListening: false, 
        error: 'Microphone access denied' 
      }));
      toast.error('Please allow microphone access');
    }
  }, []);

  const stopListening = useCallback((): Promise<string> => {
    return new Promise((resolve) => {
      if (mediaRecorderRef.current && state.isListening) {
        const originalOnStop = mediaRecorderRef.current.onstop;
        
        mediaRecorderRef.current.onstop = async (e) => {
          if (originalOnStop) {
            await (originalOnStop as (e: Event) => Promise<void>)(e);
          }
          
          // Wait for processing to complete
          const checkInterval = setInterval(() => {
            if (!state.isProcessing) {
              clearInterval(checkInterval);
              resolve(state.transcript);
            }
          }, 100);
          
          // Timeout after 10 seconds
          setTimeout(() => {
            clearInterval(checkInterval);
            resolve(state.transcript);
          }, 10000);
        };
        
        mediaRecorderRef.current.stop();
      }
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    });
  }, [state.isListening, state.isProcessing, state.transcript]);

  const cancelListening = useCallback(() => {
    if (mediaRecorderRef.current && state.isListening) {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setState(prev => ({ 
      ...prev, 
      isListening: false, 
      isProcessing: false,
      transcript: '' 
    }));
  }, [state.isListening]);

  return {
    ...state,
    startListening,
    stopListening,
    cancelListening,
  };
};
