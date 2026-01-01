import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { useFocusAmbientMusic, AMBIENT_TRACKS, AmbientTrackType } from '@/hooks/useFocusAmbientMusic';

interface FocusAmbientPickerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FocusAmbientPicker: React.FC<FocusAmbientPickerProps> = ({ isOpen, onClose }) => {
  const { 
    isPlaying, 
    currentTrack, 
    volume, 
    tracks, 
    playTrack, 
    stopMusic, 
    adjustVolume 
  } = useFocusAmbientMusic();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="overflow-hidden"
        >
          <div className="bg-muted/30 rounded-2xl p-4 space-y-4 border border-border/30">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Ambient Sounds</span>
              <div className="flex items-center gap-2">
                {isPlaying && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={stopMusic}
                    className="text-xs h-7 px-2"
                  >
                    Stop
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="h-7 w-7"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            {/* Track Grid */}
            <div className="grid grid-cols-3 gap-2">
              {tracks.map((track) => (
                <button
                  key={track.id}
                  onClick={() => playTrack(track)}
                  className={cn(
                    "p-3 rounded-xl text-center transition-all",
                    "hover:bg-muted/50",
                    currentTrack?.id === track.id && isPlaying
                      ? "bg-primary/20 ring-2 ring-primary"
                      : "bg-muted/20"
                  )}
                >
                  <span className="text-2xl block mb-1">{track.icon}</span>
                  <p className="text-xs font-medium">{track.name}</p>
                </button>
              ))}
            </div>

            {/* Volume Slider */}
            {isPlaying && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-3 pt-2"
              >
                <VolumeX className="w-4 h-4 text-muted-foreground" />
                <Slider
                  value={[volume * 100]}
                  onValueChange={([val]) => adjustVolume(val / 100)}
                  max={100}
                  step={5}
                  className="flex-1"
                />
                <Volume2 className="w-4 h-4 text-muted-foreground" />
              </motion.div>
            )}

            {/* Now Playing */}
            {isPlaying && currentTrack && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2 text-xs text-muted-foreground"
              >
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span>Now playing: {currentTrack.name}</span>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Compact music button for focus mode banner
export const FocusMusicButton: React.FC<{
  onClick: () => void;
  isPlaying: boolean;
  trackIcon?: string;
}> = ({ onClick, isPlaying, trackIcon }) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center transition-all",
        isPlaying 
          ? "bg-primary/20 ring-2 ring-primary text-primary" 
          : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
      )}
    >
      {isPlaying && trackIcon ? (
        <span className="text-sm">{trackIcon}</span>
      ) : (
        <Volume2 className="w-4 h-4" />
      )}
    </button>
  );
};
