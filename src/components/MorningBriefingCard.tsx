import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Cloud, CloudRain, Thermometer, Clock, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

interface MorningBriefingCardProps {
  userName: string;
  onDismiss: () => void;
}

interface WeatherData {
  temperature: number;
  condition: string;
  humidity?: number;
}

export const MorningBriefingCard: React.FC<MorningBriefingCardProps> = ({
  userName,
  onDismiss,
}) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    // Update time every minute
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Generate greeting based on time
    const hour = currentTime.getHours();
    let timeGreeting = '';
    
    if (hour < 12) {
      timeGreeting = '☀️ Good morning';
    } else if (hour < 17) {
      timeGreeting = '🌤️ Good afternoon';
    } else if (hour < 21) {
      timeGreeting = '🌅 Good evening';
    } else {
      timeGreeting = '🌙 Hey night owl';
    }

    const greetings = [
      `${timeGreeting}, ${userName}! Ready to crush it today?`,
      `${timeGreeting}, ${userName}! What are we working on?`,
      `${timeGreeting}! ${userName}, let's make today awesome.`,
      `${timeGreeting}, ${userName}! I've got your back today.`,
    ];
    
    setGreeting(greetings[Math.floor(Math.random() * greetings.length)]);
  }, [userName, currentTime]);

  useEffect(() => {
    // Fetch weather
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
              // Fallback - no location permission
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

  const getWeatherIcon = () => {
    if (!weather) return <Sun className="w-6 h-6 text-yellow-500" />;
    
    const condition = weather.condition.toLowerCase();
    if (condition.includes('rain')) return <CloudRain className="w-6 h-6 text-blue-400" />;
    if (condition.includes('cloud')) return <Cloud className="w-6 h-6 text-gray-400" />;
    return <Sun className="w-6 h-6 text-yellow-500" />;
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        className="mx-4 mb-4"
      >
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 via-accent/10 to-background border border-border/50 p-4">
          {/* Dismiss button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 w-6 h-6 rounded-full"
            onClick={onDismiss}
          >
            <X className="w-4 h-4" />
          </Button>

          {/* Sparkle decoration */}
          <Sparkles className="absolute top-3 left-3 w-4 h-4 text-primary/50" />

          {/* Greeting */}
          <h3 className="text-lg font-semibold text-foreground mt-2 pr-8">
            {greeting}
          </h3>

          {/* Time & Date */}
          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-medium">{formatTime(currentTime)}</span>
            </div>
            <span className="text-xs text-muted-foreground/70">
              {formatDate(currentTime)}
            </span>
          </div>

          {/* Weather */}
          {weather && (
            <div className="flex items-center gap-3 mt-3 p-2 rounded-xl bg-background/50">
              {getWeatherIcon()}
              <div className="flex items-center gap-2">
                <Thermometer className="w-4 h-4 text-muted-foreground" />
                <span className="text-lg font-semibold">{weather.temperature}°C</span>
              </div>
              <span className="text-sm text-muted-foreground">{weather.condition}</span>
            </div>
          )}

          {/* Quick tip */}
          <p className="text-xs text-muted-foreground mt-3 italic">
            💡 Tip: Say "Hey AURRA" or tap the mic to talk hands-free!
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
