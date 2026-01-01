import { useState, useCallback, useRef, useEffect } from 'react';

export type AmbientTrackType = 'lofi' | 'nature' | 'whitenoise' | 'rain' | 'cafe' | 'binaural';

interface AmbientTrack {
  id: AmbientTrackType;
  name: string;
  icon: string;
  description: string;
  frequencies: number[];
  waveType: OscillatorType;
  noiseType?: 'white' | 'pink' | 'brown';
}

export const AMBIENT_TRACKS: AmbientTrack[] = [
  { 
    id: 'lofi', 
    name: 'Lo-Fi Beats', 
    icon: '🎧', 
    description: 'Chill study vibes',
    frequencies: [110, 146.83, 220, 329.63], // A2, D3, A3, E4 - jazzy lo-fi chord
    waveType: 'sine'
  },
  { 
    id: 'nature', 
    name: 'Nature Sounds', 
    icon: '🌲', 
    description: 'Forest ambience',
    frequencies: [180, 320, 520, 720], // Wind-like frequencies
    waveType: 'sine',
    noiseType: 'pink'
  },
  { 
    id: 'whitenoise', 
    name: 'White Noise', 
    icon: '📻', 
    description: 'Block distractions',
    frequencies: [],
    waveType: 'sine',
    noiseType: 'white'
  },
  { 
    id: 'rain', 
    name: 'Rain', 
    icon: '🌧️', 
    description: 'Gentle rainfall',
    frequencies: [200, 400, 800],
    waveType: 'sine',
    noiseType: 'brown'
  },
  { 
    id: 'cafe', 
    name: 'Café', 
    icon: '☕', 
    description: 'Coffee shop buzz',
    frequencies: [100, 250, 500, 750],
    waveType: 'sine',
    noiseType: 'pink'
  },
  { 
    id: 'binaural', 
    name: 'Focus Waves', 
    icon: '🧠', 
    description: 'Alpha waves for focus',
    frequencies: [200, 210], // 10Hz binaural beat (alpha waves)
    waveType: 'sine'
  },
];

export const useFocusAmbientMusic = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<AmbientTrack | null>(null);
  const [volume, setVolume] = useState(0.3);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorsRef = useRef<OscillatorNode[]>([]);
  const noiseNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const filterNodeRef = useRef<BiquadFilterNode | null>(null);

  // Create noise buffer
  const createNoiseBuffer = useCallback((type: 'white' | 'pink' | 'brown', duration: number = 10) => {
    if (!audioContextRef.current) return null;
    
    const sampleRate = audioContextRef.current.sampleRate;
    const bufferSize = sampleRate * duration;
    const buffer = audioContextRef.current.createBuffer(2, bufferSize, sampleRate);
    
    for (let channel = 0; channel < 2; channel++) {
      const channelData = buffer.getChannelData(channel);
      let lastOut = 0;
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        
        if (type === 'white') {
          channelData[i] = white * 0.5;
        } else if (type === 'pink') {
          // Pink noise algorithm
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          b3 = 0.86650 * b3 + white * 0.3104856;
          b4 = 0.55000 * b4 + white * 0.5329522;
          b5 = -0.7616 * b5 - white * 0.0168980;
          channelData[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
          b6 = white * 0.115926;
        } else if (type === 'brown') {
          // Brown noise (random walk)
          channelData[i] = (lastOut + (0.02 * white)) / 1.02;
          lastOut = channelData[i];
          channelData[i] *= 3.5; // Compensate for volume loss
        }
      }
    }
    
    return buffer;
  }, []);

  // Play a specific track
  const playTrack = useCallback((track: AmbientTrack) => {
    // Stop any existing audio
    stopMusic();
    
    try {
      // Create audio context
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const ctx = audioContextRef.current;
      
      // Create master gain
      gainNodeRef.current = ctx.createGain();
      gainNodeRef.current.gain.setValueAtTime(volume, ctx.currentTime);
      
      // Create filter for warmth
      filterNodeRef.current = ctx.createBiquadFilter();
      filterNodeRef.current.type = 'lowpass';
      filterNodeRef.current.frequency.setValueAtTime(2000, ctx.currentTime);
      filterNodeRef.current.Q.setValueAtTime(0.5, ctx.currentTime);
      
      // Connect filter -> gain -> output
      filterNodeRef.current.connect(gainNodeRef.current);
      gainNodeRef.current.connect(ctx.destination);
      
      // Create oscillators for tonal content
      if (track.frequencies.length > 0) {
        oscillatorsRef.current = track.frequencies.map((freq, index) => {
          const osc = ctx.createOscillator();
          const oscGain = ctx.createGain();
          
          osc.type = track.waveType;
          osc.frequency.setValueAtTime(freq, ctx.currentTime);
          
          // Lower volume for higher frequencies
          const freqVolume = 0.15 / (index + 1);
          oscGain.gain.setValueAtTime(freqVolume, ctx.currentTime);
          
          // Add subtle vibrato for binaural
          if (track.id === 'binaural') {
            osc.frequency.setValueAtTime(freq, ctx.currentTime);
          } else {
            // Add slow LFO for organic feel
            const lfo = ctx.createOscillator();
            const lfoGain = ctx.createGain();
            lfo.frequency.setValueAtTime(0.1 + Math.random() * 0.1, ctx.currentTime);
            lfoGain.gain.setValueAtTime(freq * 0.01, ctx.currentTime);
            lfo.connect(lfoGain);
            lfoGain.connect(osc.frequency);
            lfo.start();
          }
          
          osc.connect(oscGain);
          oscGain.connect(filterNodeRef.current!);
          osc.start();
          
          return osc;
        });
      }
      
      // Add noise if specified
      if (track.noiseType) {
        const noiseBuffer = createNoiseBuffer(track.noiseType, 10);
        if (noiseBuffer) {
          noiseNodeRef.current = ctx.createBufferSource();
          noiseNodeRef.current.buffer = noiseBuffer;
          noiseNodeRef.current.loop = true;
          
          const noiseGain = ctx.createGain();
          noiseGain.gain.setValueAtTime(0.3, ctx.currentTime);
          
          noiseNodeRef.current.connect(noiseGain);
          noiseGain.connect(filterNodeRef.current!);
          noiseNodeRef.current.start();
        }
      }
      
      setCurrentTrack(track);
      setIsPlaying(true);
    } catch (e) {
      console.error('Failed to start ambient music:', e);
    }
  }, [volume, createNoiseBuffer]);

  // Stop music
  const stopMusic = useCallback(() => {
    oscillatorsRef.current.forEach(osc => {
      try { osc.stop(); } catch (e) {}
    });
    oscillatorsRef.current = [];
    
    if (noiseNodeRef.current) {
      try { noiseNodeRef.current.stop(); } catch (e) {}
      noiseNodeRef.current = null;
    }
    
    if (audioContextRef.current) {
      try { audioContextRef.current.close(); } catch (e) {}
      audioContextRef.current = null;
    }
    
    gainNodeRef.current = null;
    filterNodeRef.current = null;
    setIsPlaying(false);
    setCurrentTrack(null);
  }, []);

  // Adjust volume
  const adjustVolume = useCallback((newVolume: number) => {
    setVolume(newVolume);
    if (gainNodeRef.current && audioContextRef.current) {
      gainNodeRef.current.gain.setTargetAtTime(
        newVolume, 
        audioContextRef.current.currentTime, 
        0.1
      );
    }
  }, []);

  // Toggle play/pause
  const togglePlay = useCallback(() => {
    if (isPlaying) {
      stopMusic();
    } else if (currentTrack) {
      playTrack(currentTrack);
    }
  }, [isPlaying, currentTrack, playTrack, stopMusic]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopMusic();
    };
  }, [stopMusic]);

  return {
    isPlaying,
    currentTrack,
    volume,
    tracks: AMBIENT_TRACKS,
    playTrack,
    stopMusic,
    adjustVolume,
    togglePlay,
  };
};
