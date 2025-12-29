import React, { useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface AudioWaveformProps {
  analyser: AnalyserNode | null;
  isActive: boolean;
  mode?: 'recording' | 'playback' | 'speaking' | 'listening';
  className?: string;
  barCount?: number;
}

export const AudioWaveform: React.FC<AudioWaveformProps> = ({ 
  analyser, 
  isActive, 
  mode = 'recording',
  className,
  barCount = 40
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (!canvasRef.current || !isActive) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const getColor = () => {
      // Get computed CSS variable value for canvas (CSS vars don't work directly in canvas)
      const computedStyle = getComputedStyle(document.documentElement);
      const primaryHsl = computedStyle.getPropertyValue('--primary').trim() || '262 83% 58%';
      
      switch (mode) {
        case 'speaking':
          return 'hsl(142 76% 36%)'; // Green for AI speaking
        case 'listening':
        case 'recording':
          return `hsl(${primaryHsl})`;
        case 'playback':
          return 'hsl(142 76% 36%)';
        default:
          return `hsl(${primaryHsl})`;
      }
    };

    const draw = () => {
      if (!analyser) {
        // Draw animated static waveform when no analyser
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = getColor();
        const barWidth = canvas.width / barCount - 2;
        
        for (let i = 0; i < barCount; i++) {
          const height = Math.random() * 30 + 5;
          const x = i * (barWidth + 2);
          const y = (canvas.height - height) / 2;
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, height, 2);
          ctx.fill();
        }
        animationRef.current = requestAnimationFrame(draw);
        return;
      }

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const barWidth = canvas.width / barCount - 2;
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      const baseColor = getColor();
      
      gradient.addColorStop(0, baseColor);
      gradient.addColorStop(1, baseColor.replace(')', ' / 0.3)').replace('hsl', 'hsla'));
      
      ctx.fillStyle = gradient;

      for (let i = 0; i < barCount; i++) {
        const dataIndex = Math.floor(i * dataArray.length / barCount);
        const value = dataArray[dataIndex] || 0;
        const height = Math.max(4, (value / 255) * canvas.height * 0.8);
        const x = i * (barWidth + 2);
        const y = (canvas.height - height) / 2;
        
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, height, 2);
        ctx.fill();
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [analyser, isActive, mode, barCount]);

  if (!isActive) return null;

  return (
    <canvas 
      ref={canvasRef} 
      width={320} 
      height={60} 
      className={cn("w-full h-[60px] rounded-lg bg-muted/30", className)}
    />
  );
};
