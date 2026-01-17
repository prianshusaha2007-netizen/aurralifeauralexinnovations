import { useCallback, useRef } from 'react';
import { useNativeCapabilities } from './useNativeCapabilities';

type PriorityLevel = 'low' | 'medium' | 'high' | 'critical';

interface AlarmFeedbackOptions {
  priority: number; // 1-10
  urgency?: number; // 1-10
  muted?: boolean;
}

// Web Audio API for generating alarm sounds
const createOscillator = (
  audioContext: AudioContext,
  frequency: number,
  duration: number,
  volume: number = 0.3
): Promise<void> => {
  return new Promise((resolve) => {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.05);
    gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + duration);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
    
    oscillator.onended = () => resolve();
  });
};

// Sound patterns for different priority levels
const soundPatterns = {
  low: {
    frequencies: [440],
    durations: [0.3],
    gaps: [],
    volume: 0.2,
  },
  medium: {
    frequencies: [523, 659],
    durations: [0.2, 0.3],
    gaps: [0.1],
    volume: 0.3,
  },
  high: {
    frequencies: [659, 784, 659],
    durations: [0.15, 0.15, 0.2],
    gaps: [0.05, 0.05],
    volume: 0.4,
  },
  critical: {
    frequencies: [880, 1047, 880, 1047, 880],
    durations: [0.1, 0.1, 0.1, 0.1, 0.15],
    gaps: [0.05, 0.05, 0.05, 0.05],
    volume: 0.5,
  },
};

// Vibration patterns (in ms) for different priority levels
const vibrationPatterns = {
  low: [100],
  medium: [100, 50, 150],
  high: [150, 50, 150, 50, 200],
  critical: [200, 50, 200, 50, 200, 50, 300],
};

export const useAlarmFeedback = () => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const { hapticFeedback, hapticNotification, isNative } = useNativeCapabilities();

  const getPriorityLevel = (priority: number, urgency: number = 5): PriorityLevel => {
    const combined = (priority + urgency) / 2;
    if (combined >= 8) return 'critical';
    if (combined >= 6) return 'high';
    if (combined >= 4) return 'medium';
    return 'low';
  };

  const playSound = useCallback(async (level: PriorityLevel) => {
    try {
      // Create audio context on first use (must be triggered by user interaction)
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      const pattern = soundPatterns[level];
      let currentTime = 0;

      for (let i = 0; i < pattern.frequencies.length; i++) {
        await new Promise(resolve => setTimeout(resolve, currentTime * 1000));
        await createOscillator(ctx, pattern.frequencies[i], pattern.durations[i], pattern.volume);
        currentTime = pattern.gaps[i] || 0;
      }
    } catch (error) {
      console.error('Error playing alarm sound:', error);
    }
  }, []);

  const triggerVibration = useCallback(async (level: PriorityLevel) => {
    // Use native haptics if available (Capacitor)
    if (isNative) {
      const hapticStyle = level === 'critical' || level === 'high' ? 'heavy' : 
                         level === 'medium' ? 'medium' : 'light';
      
      const notificationType = level === 'critical' ? 'error' :
                               level === 'high' ? 'warning' : 'success';
      
      // Trigger multiple haptics for higher priority
      const repeatCount = level === 'critical' ? 3 : level === 'high' ? 2 : 1;
      
      for (let i = 0; i < repeatCount; i++) {
        await hapticNotification(notificationType);
        if (i < repeatCount - 1) {
          await new Promise(resolve => setTimeout(resolve, 150));
        }
      }
      
      return;
    }

    // Web Vibration API fallback
    if ('vibrate' in navigator) {
      navigator.vibrate(vibrationPatterns[level]);
    }
  }, [isNative, hapticNotification]);

  const triggerAlarmFeedback = useCallback(async (options: AlarmFeedbackOptions) => {
    if (options.muted) return;

    const level = getPriorityLevel(options.priority, options.urgency);
    
    // Trigger sound and vibration in parallel
    await Promise.all([
      playSound(level),
      triggerVibration(level),
    ]);
  }, [playSound, triggerVibration]);

  const stopFeedback = useCallback(() => {
    // Stop vibration
    if ('vibrate' in navigator) {
      navigator.vibrate(0);
    }
    
    // Close audio context to stop any playing sounds
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  }, []);

  return {
    triggerAlarmFeedback,
    stopFeedback,
    playSound,
    triggerVibration,
    getPriorityLevel,
  };
};
