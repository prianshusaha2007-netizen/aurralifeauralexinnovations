import React, { useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Mic } from 'lucide-react';

interface VolumeIndicatorProps {
  analyser: AnalyserNode | null;
  isActive: boolean;
  className?: string;
  showLabel?: boolean;
  onVoiceActivity?: (isActive: boolean) => void;
  vadThreshold?: number;
}

export const VolumeIndicator: React.FC<VolumeIndicatorProps> = ({
  analyser,
  isActive,
  className,
  showLabel = true,
  onVoiceActivity,
  vadThreshold = 15
}) => {
  const [volume, setVolume] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const animationRef = useRef<number | null>(null);
  const speakingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!analyser || !isActive) {
      setVolume(0);
      setIsSpeaking(false);
      return;
    }

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const updateVolume = () => {
      analyser.getByteFrequencyData(dataArray);
      
      // Calculate average volume level
      const sum = dataArray.reduce((acc, val) => acc + val, 0);
      const average = sum / dataArray.length;
      const normalizedVolume = Math.min(100, (average / 128) * 100);
      
      setVolume(normalizedVolume);
      
      // Voice Activity Detection
      const isCurrentlySpeaking = normalizedVolume > vadThreshold;
      
      if (isCurrentlySpeaking) {
        // Clear any pending timeout
        if (speakingTimeoutRef.current) {
          clearTimeout(speakingTimeoutRef.current);
          speakingTimeoutRef.current = null;
        }
        
        if (!isSpeaking) {
          setIsSpeaking(true);
          onVoiceActivity?.(true);
        }
      } else if (isSpeaking) {
        // Add a small delay before marking as not speaking to avoid flickering
        if (!speakingTimeoutRef.current) {
          speakingTimeoutRef.current = setTimeout(() => {
            setIsSpeaking(false);
            onVoiceActivity?.(false);
            speakingTimeoutRef.current = null;
          }, 300);
        }
      }
      
      animationRef.current = requestAnimationFrame(updateVolume);
    };

    updateVolume();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (speakingTimeoutRef.current) {
        clearTimeout(speakingTimeoutRef.current);
      }
    };
  }, [analyser, isActive, isSpeaking, onVoiceActivity, vadThreshold]);

  if (!isActive) return null;

  const getVolumeColor = () => {
    if (volume < 30) return 'bg-emerald-500';
    if (volume < 60) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      {/* VAD Indicator */}
      <motion.div
        className={cn(
          "flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium transition-colors",
          isSpeaking 
            ? "bg-emerald-500/20 text-emerald-500" 
            : "bg-muted/30 text-muted-foreground"
        )}
        animate={{
          scale: isSpeaking ? [1, 1.05, 1] : 1,
        }}
        transition={{ duration: 0.3, repeat: isSpeaking ? Infinity : 0 }}
      >
        <motion.div
          className={cn(
            "w-2 h-2 rounded-full",
            isSpeaking ? "bg-emerald-500" : "bg-muted-foreground/50"
          )}
          animate={{
            opacity: isSpeaking ? [1, 0.5, 1] : 0.5,
          }}
          transition={{ duration: 0.5, repeat: Infinity }}
        />
        {isSpeaking ? 'Speaking' : 'Silent'}
      </motion.div>

      {showLabel && (
        <span className="text-xs text-muted-foreground">Mic Level</span>
      )}
      
      {/* Vertical bar meter */}
      <div className="flex items-end gap-1 h-16">
        {[...Array(10)].map((_, index) => {
          const threshold = (index + 1) * 10;
          const isBarActive = volume >= threshold;
          
          return (
            <motion.div
              key={index}
              className={cn(
                "w-2 rounded-full transition-all duration-75",
                isBarActive ? (
                  index < 3 ? 'bg-emerald-500' :
                  index < 6 ? 'bg-yellow-500' :
                  index < 8 ? 'bg-orange-500' :
                  'bg-red-500'
                ) : 'bg-muted/30'
              )}
              style={{ height: `${(index + 1) * 6}px` }}
              animate={{
                opacity: isBarActive ? 1 : 0.3,
                scale: isBarActive ? 1.1 : 1
              }}
              transition={{ duration: 0.05 }}
            />
          );
        })}
      </div>

      {/* Horizontal progress bar */}
      <div className="w-24 h-2 bg-muted/30 rounded-full overflow-hidden">
        <motion.div
          className={cn("h-full rounded-full", getVolumeColor())}
          animate={{ width: `${volume}%` }}
          transition={{ duration: 0.05 }}
        />
      </div>
      
      {/* Volume percentage */}
      <span className="text-xs font-mono text-muted-foreground">
        {Math.round(volume)}%
      </span>
    </div>
  );
};
