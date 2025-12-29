import React, { useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface VolumeIndicatorProps {
  analyser: AnalyserNode | null;
  isActive: boolean;
  className?: string;
  showLabel?: boolean;
}

export const VolumeIndicator: React.FC<VolumeIndicatorProps> = ({
  analyser,
  isActive,
  className,
  showLabel = true
}) => {
  const [volume, setVolume] = useState(0);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (!analyser || !isActive) {
      setVolume(0);
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
      animationRef.current = requestAnimationFrame(updateVolume);
    };

    updateVolume();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [analyser, isActive]);

  if (!isActive) return null;

  // Get computed CSS variable for theming
  const getVolumeColor = () => {
    if (volume < 30) return 'bg-emerald-500';
    if (volume < 60) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      {showLabel && (
        <span className="text-xs text-muted-foreground">Mic Level</span>
      )}
      
      {/* Vertical bar meter */}
      <div className="flex items-end gap-1 h-16">
        {[...Array(10)].map((_, index) => {
          const threshold = (index + 1) * 10;
          const isActive = volume >= threshold;
          
          return (
            <motion.div
              key={index}
              className={cn(
                "w-2 rounded-full transition-all duration-75",
                isActive ? (
                  index < 3 ? 'bg-emerald-500' :
                  index < 6 ? 'bg-yellow-500' :
                  index < 8 ? 'bg-orange-500' :
                  'bg-red-500'
                ) : 'bg-muted/30'
              )}
              style={{ height: `${(index + 1) * 6}px` }}
              animate={{
                opacity: isActive ? 1 : 0.3,
                scale: isActive ? 1.1 : 1
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
