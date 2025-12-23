import { useRef, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useVoiceFeedback = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Browser-based TTS fallback using Web Speech API
  const speakWithBrowser = useCallback((text: string): Promise<void> => {
    return new Promise((resolve) => {
      if (!('speechSynthesis' in window)) {
        console.log('Web Speech API not supported');
        setIsSpeaking(false);
        resolve();
        return;
      }

      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utteranceRef.current = utterance;
      
      // Try to find a nice female voice
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v => 
        v.name.includes('Samantha') || 
        v.name.includes('Google UK English Female') ||
        v.name.includes('Microsoft Zira') ||
        (v.lang.startsWith('en') && v.name.toLowerCase().includes('female'))
      ) || voices.find(v => v.lang.startsWith('en')) || voices[0];
      
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
      
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      utterance.onend = () => {
        setIsSpeaking(false);
        resolve();
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        resolve();
      };

      window.speechSynthesis.speak(utterance);
    });
  }, []);

  const speak = useCallback(async (text: string): Promise<void> => {
    if (isSpeaking) {
      audioRef.current?.pause();
      audioRef.current = null;
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    // Clean text for speech (remove emojis and special chars)
    const cleanText = text
      .replace(/[\u{1F300}-\u{1F9FF}]/gu, '')
      .replace(/[*_~`#]/g, '')
      .replace(/\[.*?\]/g, '')
      .replace(/!\[.*?\]\(.*?\)/g, '')
      .trim();

    if (!cleanText || cleanText.length < 2) return;

    setIsSpeaking(true);

    try {
      // Try ElevenLabs first
      const { data, error } = await supabase.functions.invoke('elevenlabs-tts', {
        body: { text: cleanText }
      });

      if (!error && data?.audioContent) {
        const audio = new Audio(`data:audio/mp3;base64,${data.audioContent}`);
        audioRef.current = audio;
        
        return new Promise((resolve) => {
          audio.onended = () => {
            setIsSpeaking(false);
            resolve();
          };
          audio.onerror = () => {
            // Fallback to browser TTS on playback error
            speakWithBrowser(cleanText).then(resolve);
          };
          audio.play().catch(() => {
            speakWithBrowser(cleanText).then(resolve);
          });
        });
      }

      // API failed, use browser TTS
      console.log('Using browser TTS fallback');
      await speakWithBrowser(cleanText);
      
    } catch (error) {
      console.log('TTS error, using browser fallback:', error);
      await speakWithBrowser(cleanText);
    }
  }, [isSpeaking, speakWithBrowser]);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  return { speak, stop, isSpeaking };
};

