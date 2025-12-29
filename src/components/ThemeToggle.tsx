import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className, showLabel = false }) => {
  const { mode, setMode } = useTheme();

  const modes = [
    { value: 'light' as const, icon: Sun, label: 'Light' },
    { value: 'dark' as const, icon: Moon, label: 'Dark' },
    { value: 'auto' as const, icon: Monitor, label: 'Auto' },
  ];

  const cycleMode = () => {
    const currentIndex = modes.findIndex(m => m.value === mode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setMode(modes[nextIndex].value);
  };

  const currentMode = modes.find(m => m.value === mode);
  const Icon = currentMode?.icon || Monitor;

  return (
    <Button
      variant="ghost"
      size={showLabel ? 'default' : 'icon'}
      onClick={cycleMode}
      className={cn('transition-all', className)}
    >
      <Icon className="h-5 w-5" />
      {showLabel && <span className="ml-2">{currentMode?.label}</span>}
    </Button>
  );
};
