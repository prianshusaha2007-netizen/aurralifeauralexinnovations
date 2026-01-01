import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Cloud, CloudRain, Thermometer, Clock, X, Sparkles, Volume2, VolumeX, Zap, Coffee, Calendar, Dumbbell, BookOpen, Code } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useRoutineBlocks } from '@/hooks/useRoutineBlocks';
import { useVoiceFeedback } from '@/hooks/useVoiceFeedback';

interface MorningBriefingCardProps {
  userName: string;
  onDismiss: () => void;
  onAction?: (choice: 'light' | 'push') => void;
}

interface WeatherData {
  temperature: number;
  condition: string;
  humidity?: number;
}

const BLOCK_ICONS: Record<string, React.ReactNode> = {
  morning: <Coffee className="w-4 h-4" />,
  gym: <Dumbbell className="w-4 h-4" />,
  study: <BookOpen className="w-4 h-4" />,
  coding: <Code className="w-4 h-4" />,
  default: <Calendar className="w-4 h-4" />,
};

export const MorningBriefingCard: React.FC<MorningBriefingCardProps> = ({
  userName,
  onDismiss,
  onAction,
}) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [greeting, setGreeting] = useState('');
  const [hasSpoken, setHasSpoken] = useState(false);
  const { blocks } = useRoutineBlocks();
  const { speak, stop, isSpeaking } = useVoiceFeedback();

  // Get today's blocks
  const todayDayIndex = new Date().getDay(); // 0-6 (Sunday-Saturday)
  const todayBlocks = blocks.filter(b => b.isActive && b.days.includes(todayDayIndex)).sort((a, b) => {
    const timeA = a.startTime.split(':').map(Number);
    const timeB = b.startTime.split(':').map(Number);
    return (timeA[0] * 60 + timeA[1]) - (timeB[0] * 60 + timeB[1]);
  }).slice(0, 4); // Show max 4 blocks

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const hour = currentTime.getHours();
    let timeGreeting = '';
    
    if (hour < 12) {
      timeGreeting = 'Good morning';
    } else if (hour < 17) {
      timeGreeting = 'Good afternoon';
    } else if (hour < 21) {
      timeGreeting = 'Good evening';
    } else {
      timeGreeting = 'Hey night owl';
    }

    setGreeting(`${timeGreeting}, ${userName}`);
  }, [userName, currentTime]);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        if ('geolocation' in navigator) {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const { data } = await supabase.functions.invoke('get-weather', {
                body: {
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude,
                },
              });
              
              if (data) {
                setWeather({
                  temperature: Math.round(data.temperature),
                  condition: data.condition || 'Clear',
                  humidity: data.humidity,
                });
              }
            },
            () => {
              setWeather({ temperature: 25, condition: 'Clear' });
            }
          );
        }
      } catch (error) {
        console.error('Weather fetch error:', error);
      }
    };

    fetchWeather();
  }, []);

  // Generate and speak the briefing
  const generateBriefingText = () => {
    const hour = currentTime.getHours();
    let weatherText = weather ? `It's ${weather.temperature} degrees and ${weather.condition.toLowerCase()}.` : '';
    
    let routineText = '';
    if (todayBlocks.length > 0) {
      const blockNames = todayBlocks.map(b => b.title).join(', ');
      routineText = `Today you have ${todayBlocks.length} things planned: ${blockNames}.`;
    } else {
      routineText = "You have a flexible day ahead.";
    }
    
    const prompt = hour < 12 
      ? `${greeting}. ${weatherText} ${routineText} Want to keep it light or push harder today?`
      : `${greeting}. ${weatherText} ${routineText}`;
    
    return prompt;
  };

  const handleSpeak = () => {
    if (isSpeaking) {
      stop();
    } else {
      const text = generateBriefingText();
      speak(text);
      setHasSpoken(true);
    }
  };

  // Auto-speak on first render
  useEffect(() => {
    if (!hasSpoken && weather) {
      const autoSpeak = localStorage.getItem('aura-auto-speak-briefing') !== 'false';
      if (autoSpeak) {
        const timer = setTimeout(() => {
          const text = generateBriefingText();
          speak(text);
          setHasSpoken(true);
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, [weather, hasSpoken]);

  const getWeatherIcon = () => {
    if (!weather) return <Sun className="w-5 h-5 text-yellow-500" />;
    
    const condition = weather.condition.toLowerCase();
    if (condition.includes('rain')) return <CloudRain className="w-5 h-5 text-blue-400" />;
    if (condition.includes('cloud')) return <Cloud className="w-5 h-5 text-gray-400" />;
    return <Sun className="w-5 h-5 text-yellow-500" />;
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatBlockTime = (time: string) => {
    const [hours, mins] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${mins.toString().padStart(2, '0')} ${period}`;
  };

  const handleChoice = (choice: 'light' | 'push') => {
    stop(); // Stop speaking if active
    onAction?.(choice);
    onDismiss();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        className="flex gap-3 mb-4"
      >
        {/* Avatar */}
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center shrink-0 ring-2 ring-primary/10">
          <Sparkles className="w-4 h-4 text-primary" />
        </div>

        {/* Card Content */}
        <div className="flex-1 relative overflow-hidden rounded-2xl rounded-tl-sm bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-muted/30 border border-amber-500/20 p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="text-base font-semibold text-foreground">
                Here's how today looks 👇
              </h3>
            </div>
            
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="w-8 h-8 rounded-full text-muted-foreground hover:text-primary"
                onClick={handleSpeak}
              >
                {isSpeaking ? (
                  <VolumeX className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="w-6 h-6 rounded-full text-muted-foreground"
                onClick={onDismiss}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>

          {/* Weather context */}
          {weather && (
            <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground">
              {getWeatherIcon()}
              <span>Weather's {weather.condition.toLowerCase()}, {weather.temperature}°C</span>
            </div>
          )}

          {/* Today's Routine - simplified */}
          {todayBlocks.length > 0 ? (
            <div className="mb-3">
              <p className="text-sm text-foreground">
                You've got <span className="font-medium">{todayBlocks.map(b => b.title.toLowerCase()).join(' + ')}</span> later.
              </p>
            </div>
          ) : (
            <p className="text-sm text-foreground mb-3">
              You have a flexible day ahead.
            </p>
          )}

          {/* Main question */}
          <p className="text-sm font-medium text-foreground mb-4">
            Want to take it light or push a bit?
          </p>

          {/* Action Buttons - softer language */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-full flex-1 bg-background/50 hover:bg-background"
              onClick={() => handleChoice('light')}
            >
              Take it light
            </Button>
            <Button
              size="sm"
              className="rounded-full flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
              onClick={() => handleChoice('push')}
            >
              Let's push
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
