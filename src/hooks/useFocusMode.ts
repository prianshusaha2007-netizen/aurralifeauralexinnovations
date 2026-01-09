import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';

export interface FocusSession {
  id: string;
  startedAt: Date;
  duration: number; // in minutes
  blockType?: string;
  musicEnabled: boolean;
  completed: boolean;
}

const FOCUS_STORAGE_KEY = 'aurra-focus-sessions';

export const useFocusMode = () => {
  const [isActive, setIsActive] = useState(false);
  const [currentSession, setCurrentSession] = useState<FocusSession | null>(null);
  const [remainingTime, setRemainingTime] = useState(0);
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const currentSessionRef = useRef<FocusSession | null>(null);

  // Keep ref in sync with state
  useEffect(() => {
    currentSessionRef.current = currentSession;
  }, [currentSession]);

  // Load sessions from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(FOCUS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setSessions(parsed.map((s: any) => ({
          ...s,
          startedAt: new Date(s.startedAt)
        })));
      }
    } catch (e) {
      console.error('Failed to parse focus sessions:', e);
    }
    return undefined;
  }, []);

  // Save sessions to localStorage
  useEffect(() => {
    if (sessions.length > 0) {
      try {
        localStorage.setItem(FOCUS_STORAGE_KEY, JSON.stringify(sessions));
      } catch (e) {
        console.error('Failed to save focus sessions:', e);
      }
    }
    return undefined;
  }, [sessions]);

  const stopMusic = useCallback(() => {
    try {
      const oscillator = (window as any).__focusOscillator;
      const audioContext = (window as any).__focusAudioContext;
      
      if (oscillator) {
        oscillator.stop();
        (window as any).__focusOscillator = null;
      }
      if (audioContext) {
        audioContext.close();
        (window as any).__focusAudioContext = null;
      }
      
      setMusicPlaying(false);
    } catch (e) {
      console.log('Error stopping music:', e);
    }
  }, []);

  // End session function - stable reference using refs
  const endSession = useCallback((completed = false) => {
    const session = currentSessionRef.current;
    if (session) {
      const completedSession = { ...session, completed };
      setSessions(prev => [...prev, completedSession]);
    }

    setIsActive(false);
    setCurrentSession(null);
    setRemainingTime(0);
    stopMusic();

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (completed) {
      toast.success('Focus session complete! 🎉');
    } else {
      toast('Focus session ended');
    }
  }, [stopMusic]);

  // Timer countdown - use ref for endSession to avoid stale closures
  const endSessionRef = useRef(endSession);
  useEffect(() => {
    endSessionRef.current = endSession;
  }, [endSession]);

  useEffect(() => {
    if (isActive && remainingTime > 0) {
      timerRef.current = setInterval(() => {
        setRemainingTime(prev => {
          if (prev <= 1) {
            // Use setTimeout to avoid calling endSession during setState
            setTimeout(() => endSessionRef.current(true), 0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isActive, remainingTime]);

  const startMusic = useCallback(async () => {
    try {
      // Create ambient focus music using Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Create a calming ambient sound
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(174, audioContext.currentTime); // Very low frequency for calm
      gainNode.gain.setValueAtTime(0.05, audioContext.currentTime); // Very quiet
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.start();
      setMusicPlaying(true);
      
      // Store reference for stopping
      (window as any).__focusAudioContext = audioContext;
      (window as any).__focusOscillator = oscillator;
    } catch (e) {
      console.log('Could not start ambient audio:', e);
    }
  }, []);

  const startSession = useCallback((duration: number, blockType?: string, enableMusic = false) => {
    const session: FocusSession = {
      id: crypto.randomUUID(),
      startedAt: new Date(),
      duration,
      blockType,
      musicEnabled: enableMusic,
      completed: false
    };

    setCurrentSession(session);
    setRemainingTime(duration * 60); // Convert to seconds
    setIsActive(true);

    if (enableMusic) {
      startMusic();
    }

    toast.success('Focus mode started', {
      description: `${duration} minute session. Stay focused!`
    });
  }, [startMusic]);

  const pauseSession = useCallback(() => {
    setIsActive(false);
    if (musicPlaying && audioRef.current) {
      audioRef.current.pause();
    }
  }, [musicPlaying]);

  const resumeSession = useCallback(() => {
    if (remainingTime > 0) {
      setIsActive(true);
      if (currentSession?.musicEnabled && audioRef.current) {
        audioRef.current.play();
      }
    }
  }, [remainingTime, currentSession]);

  const toggleMusic = useCallback(() => {
    if (musicPlaying) {
      stopMusic();
    } else {
      startMusic();
    }
  }, [musicPlaying, startMusic, stopMusic]);

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }, []);

  const getTodaysSessions = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return sessions.filter(s => new Date(s.startedAt) >= today);
  }, [sessions]);

  const getTotalFocusTime = useCallback(() => {
    return getTodaysSessions()
      .filter(s => s.completed)
      .reduce((sum, s) => sum + s.duration, 0);
  }, [getTodaysSessions]);

  return {
    isActive,
    currentSession,
    remainingTime,
    sessions,
    musicPlaying,
    startSession,
    endSession,
    pauseSession,
    resumeSession,
    toggleMusic,
    formatTime,
    getTodaysSessions,
    getTotalFocusTime,
  };
};
