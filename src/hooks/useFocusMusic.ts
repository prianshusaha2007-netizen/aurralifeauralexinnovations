import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type MusicMood = 'calm' | 'focus' | 'energize' | 'nature' | 'lofi';

interface MusicTrack {
  id: string;
  mood: MusicMood;
  name: string;
  description: string;
  icon: string;
}

const MUSIC_TRACKS: MusicTrack[] = [
  { id: 'calm', mood: 'calm', name: 'Calm Ambience', description: 'Peaceful and serene', icon: '🧘' },
  { id: 'focus', mood: 'focus', name: 'Deep Focus', description: 'Concentration boost', icon: '🎯' },
  { id: 'energize', mood: 'energize', name: 'Gentle Energy', description: 'Soft motivation', icon: '⚡' },
  { id: 'nature', mood: 'nature', name: 'Nature Sounds', description: 'Rain and forest', icon: '🌿' },
  { id: 'lofi', mood: 'lofi', name: 'Lo-Fi Beats', description: 'Chill study vibes', icon: '🎧' },
];

const MOOD_PROMPTS: Record<MusicMood, string> = {
  calm: 'Generate a short, calming ambient soundscape with soft pads and gentle drones. Very peaceful and meditative.',
  focus: 'Create focused, minimal electronic ambient music with subtle rhythmic elements. Good for concentration.',
  energize: 'Produce uplifting but gentle ambient music with positive progression. Motivating yet not distracting.',
  nature: 'Generate peaceful nature sounds with rain, gentle wind through trees, and distant bird calls.',
  lofi: 'Create chill lo-fi hip hop beats with warm vinyl crackle, soft drums, and jazzy chords.',
};

export const useFocusMusic = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<MusicTrack | null>(null);
  const [volume, setVolume] = useState(0.3);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  // Fallback: Generate ambient sound with Web Audio API
  const generateAmbientSound = useCallback((mood: MusicMood) => {
    try {
      stopMusic();
      
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;

      // Create multiple oscillators for richer ambient sound
      const frequencies: Record<MusicMood, number[]> = {
        calm: [174, 285, 396], // Healing frequencies
        focus: [528, 639, 741], // Focus frequencies
        energize: [417, 528, 639],
        nature: [136.1, 172.06, 194.18], // Earth tones
        lofi: [261.63, 329.63, 392], // C major chord
      };

      const masterGain = audioContext.createGain();
      masterGain.gain.setValueAtTime(volume * 0.05, audioContext.currentTime);
      masterGain.connect(audioContext.destination);
      gainNodeRef.current = masterGain;

      frequencies[mood].forEach((freq, index) => {
        const osc = audioContext.createOscillator();
        const oscGain = audioContext.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, audioContext.currentTime);
        oscGain.gain.setValueAtTime(0.3 - index * 0.08, audioContext.currentTime);
        
        // Add slight detuning for warmth
        osc.detune.setValueAtTime(Math.random() * 10 - 5, audioContext.currentTime);
        
        osc.connect(oscGain);
        oscGain.connect(masterGain);
        osc.start();
        
        if (index === 0) oscillatorRef.current = osc;
      });

      setIsPlaying(true);
    } catch (e) {
      console.error('Failed to generate ambient sound:', e);
      toast.error('Could not start ambient audio');
    }
  }, [volume]);

  const playTrack = useCallback(async (track: MusicTrack) => {
    setCurrentTrack(track);
    setIsLoading(true);

    try {
      // Use Web Audio API for ambient sounds
      generateAmbientSound(track.mood);
      toast.success(`${track.icon} Playing: ${track.name}`, {
        description: track.description,
      });
    } catch (error) {
      console.error('Music generation failed:', error);
      // Fallback to Web Audio
      generateAmbientSound(track.mood);
    } finally {
      setIsLoading(false);
    }
  }, [generateAmbientSound]);

  const stopMusic = useCallback(() => {
    try {
      if (oscillatorRef.current) {
        oscillatorRef.current.stop();
        oscillatorRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setIsPlaying(false);
      setCurrentTrack(null);
    } catch (e) {
      console.log('Error stopping music:', e);
    }
  }, []);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      stopMusic();
    } else if (currentTrack) {
      playTrack(currentTrack);
    } else {
      // Default to calm
      playTrack(MUSIC_TRACKS[0]);
    }
  }, [isPlaying, currentTrack, playTrack, stopMusic]);

  const adjustVolume = useCallback((newVolume: number) => {
    setVolume(newVolume);
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.setValueAtTime(newVolume * 0.05, gainNodeRef.current.context.currentTime);
    }
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  }, []);

  return {
    isPlaying,
    isLoading,
    currentTrack,
    volume,
    tracks: MUSIC_TRACKS,
    playTrack,
    stopMusic,
    togglePlay,
    adjustVolume,
  };
};
