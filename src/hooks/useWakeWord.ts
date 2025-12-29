import { useState, useEffect, useCallback, useRef } from 'react';

interface UseWakeWordOptions {
  wakePhrase?: string;
  onWakeWord: () => void;
  enabled?: boolean;
}

export const useWakeWord = ({ 
  wakePhrase = 'hey aurra', 
  onWakeWord, 
  enabled = false 
}: UseWakeWordOptions) => {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<any>(null);
  const restartTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognition);
  }, []);

  const startListening = useCallback(() => {
    if (!isSupported || isListening) return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      console.log('Wake word detection started');
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const lastResult = event.results[event.results.length - 1];
      const transcript = lastResult[0].transcript.toLowerCase().trim();
      
      console.log('Wake word heard:', transcript);
      
      if (transcript.includes(wakePhrase.toLowerCase())) {
        console.log('Wake word detected!');
        onWakeWord();
        // Restart recognition after wake word
        recognition.stop();
      }
    };

    recognition.onerror = (event: any) => {
      console.log('Wake word recognition error:', event.error);
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        setIsListening(false);
        // Try to restart after error
        if (enabled) {
          restartTimeoutRef.current = setTimeout(() => {
            startListening();
          }, 1000);
        }
      }
    };

    recognition.onend = () => {
      console.log('Wake word detection ended');
      setIsListening(false);
      // Auto-restart if still enabled
      if (enabled) {
        restartTimeoutRef.current = setTimeout(() => {
          startListening();
        }, 100);
      }
    };

    recognitionRef.current = recognition;
    
    try {
      recognition.start();
    } catch (error) {
      console.error('Failed to start wake word detection:', error);
    }
  }, [isSupported, isListening, wakePhrase, onWakeWord, enabled]);

  const stopListening = useCallback(() => {
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (error) {
        console.log('Recognition already stopped');
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  useEffect(() => {
    if (enabled && isSupported) {
      startListening();
    } else {
      stopListening();
    }

    return () => {
      stopListening();
    };
  }, [enabled, isSupported]);

  return {
    isListening,
    isSupported,
    startListening,
    stopListening,
  };
};
