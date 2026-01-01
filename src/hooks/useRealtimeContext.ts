import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Real-time context data for AURRA
 * Provides live awareness of time, location, and weather
 */
export interface RealtimeContext {
  // Time & Date
  currentTime: string;
  currentHour: number;
  currentDate: string;
  dayOfWeek: string;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  timezone: string;
  isWeekend: boolean;
  isLateNight: boolean; // After 11:30 PM
  
  // Location (approximate, city-level)
  city: string | null;
  country: string | null;
  hasLocation: boolean;
  locationError: string | null;
  
  // Weather
  temperature: number | null;
  feelsLike: number | null;
  condition: string | null;
  weatherEmoji: string | null;
  humidity: number | null;
  isHot: boolean;
  isCold: boolean;
  isRaining: boolean;
  hasWeather: boolean;
  
  // Status
  isLoading: boolean;
  lastUpdated: Date | null;
}

interface CachedWeather {
  data: {
    temperature: number;
    feelsLike: number;
    condition: string;
    emoji: string;
    humidity: number;
  };
  timestamp: number;
  coords: { lat: number; lng: number };
}

interface CachedLocation {
  city: string;
  country: string;
  timestamp: number;
  coords: { lat: number; lng: number };
}

// Cache weather for 15 minutes
const WEATHER_CACHE_DURATION = 15 * 60 * 1000;
// Cache location for 1 hour
const LOCATION_CACHE_DURATION = 60 * 60 * 1000;

/**
 * Hook for real-time context awareness
 * AURRA always knows when, where, and what the environment feels like
 */
export const useRealtimeContext = () => {
  const [context, setContext] = useState<RealtimeContext>({
    currentTime: '',
    currentHour: 0,
    currentDate: '',
    dayOfWeek: '',
    timeOfDay: 'day' as 'morning',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    isWeekend: false,
    isLateNight: false,
    city: null,
    country: null,
    hasLocation: false,
    locationError: null,
    temperature: null,
    feelsLike: null,
    condition: null,
    weatherEmoji: null,
    humidity: null,
    isHot: false,
    isCold: false,
    isRaining: false,
    hasWeather: false,
    isLoading: true,
    lastUpdated: null,
  });
  
  const coordsRef = useRef<{ lat: number; lng: number } | null>(null);
  const weatherCacheRef = useRef<CachedWeather | null>(null);
  const locationCacheRef = useRef<CachedLocation | null>(null);

  /**
   * Update time context - runs every minute
   */
  const updateTimeContext = useCallback(() => {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();
    
    // Determine time of day
    let timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
    if (hour >= 5 && hour < 12) {
      timeOfDay = 'morning';
    } else if (hour >= 12 && hour < 17) {
      timeOfDay = 'afternoon';
    } else if (hour >= 17 && hour < 21) {
      timeOfDay = 'evening';
    } else {
      timeOfDay = 'night';
    }
    
    // Check if late night (after 11:30 PM)
    const isLateNight = hour >= 23 || hour < 5;
    
    setContext(prev => ({
      ...prev,
      currentTime: now.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: true 
      }),
      currentHour: hour,
      currentDate: now.toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric',
        year: 'numeric'
      }),
      dayOfWeek: now.toLocaleDateString('en-US', { weekday: 'long' }),
      timeOfDay,
      isWeekend: day === 0 || day === 6,
      isLateNight,
    }));
  }, []);

  /**
   * Get location (city-level, permission-based)
   */
  const fetchLocation = useCallback(async () => {
    // Check cache first
    if (locationCacheRef.current) {
      const age = Date.now() - locationCacheRef.current.timestamp;
      if (age < LOCATION_CACHE_DURATION) {
        setContext(prev => ({
          ...prev,
          city: locationCacheRef.current!.city,
          country: locationCacheRef.current!.country,
          hasLocation: true,
          locationError: null,
        }));
        return;
      }
    }

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: LOCATION_CACHE_DURATION,
        });
      });
      
      const { latitude, longitude } = position.coords;
      coordsRef.current = { lat: latitude, lng: longitude };
      
      // Reverse geocode to get city (using a free API)
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`,
          { headers: { 'Accept-Language': 'en' } }
        );
        
        if (response.ok) {
          const data = await response.json();
          const city = data.address?.city || data.address?.town || data.address?.village || data.address?.state || null;
          const country = data.address?.country || null;
          
          // Cache the location
          locationCacheRef.current = {
            city: city || 'Unknown',
            country: country || 'Unknown',
            timestamp: Date.now(),
            coords: { lat: latitude, lng: longitude },
          };
          
          setContext(prev => ({
            ...prev,
            city,
            country,
            hasLocation: true,
            locationError: null,
          }));
        }
      } catch {
        // Silently fail geocoding - still have coords for weather
        setContext(prev => ({
          ...prev,
          hasLocation: true,
          locationError: null,
        }));
      }
    } catch (error) {
      const geoError = error as GeolocationPositionError;
      let errorMessage = 'Location unavailable';
      
      if (geoError.code === 1) {
        errorMessage = 'Location permission denied';
      } else if (geoError.code === 2) {
        errorMessage = 'Location unavailable';
      } else if (geoError.code === 3) {
        errorMessage = 'Location request timed out';
      }
      
      setContext(prev => ({
        ...prev,
        hasLocation: false,
        locationError: errorMessage,
      }));
    }
  }, []);

  /**
   * Fetch weather data
   */
  const fetchWeather = useCallback(async () => {
    // Check cache first
    if (weatherCacheRef.current && coordsRef.current) {
      const age = Date.now() - weatherCacheRef.current.timestamp;
      if (age < WEATHER_CACHE_DURATION) {
        const cached = weatherCacheRef.current.data;
        setContext(prev => ({
          ...prev,
          temperature: cached.temperature,
          feelsLike: cached.feelsLike,
          condition: cached.condition,
          weatherEmoji: cached.emoji,
          humidity: cached.humidity,
          isHot: cached.temperature > 30,
          isCold: cached.temperature < 15,
          isRaining: cached.condition?.toLowerCase().includes('rain') ?? false,
          hasWeather: true,
        }));
        return;
      }
    }

    if (!coordsRef.current) {
      // Try to get location first
      await fetchLocation();
    }
    
    if (!coordsRef.current) {
      return; // Can't get weather without location
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase.functions.invoke('get-weather', {
        body: {
          latitude: coordsRef.current.lat,
          longitude: coordsRef.current.lng,
        },
      });

      if (error) throw error;

      if (data) {
        // Cache weather data
        weatherCacheRef.current = {
          data: {
            temperature: data.temperature,
            feelsLike: data.feelsLike || data.temperature,
            condition: data.condition,
            emoji: data.emoji || '🌤️',
            humidity: data.humidity || 0,
          },
          timestamp: Date.now(),
          coords: { ...coordsRef.current },
        };

        setContext(prev => ({
          ...prev,
          temperature: data.temperature,
          feelsLike: data.feelsLike || data.temperature,
          condition: data.condition,
          weatherEmoji: data.emoji || '🌤️',
          humidity: data.humidity,
          isHot: data.temperature > 30,
          isCold: data.temperature < 15,
          isRaining: data.condition?.toLowerCase().includes('rain'),
          hasWeather: true,
        }));
      }
    } catch (error) {
      console.log('Weather fetch failed:', error);
      // Silently fail - weather is optional
    }
  }, [fetchLocation]);

  /**
   * Initialize all context
   */
  const initializeContext = useCallback(async () => {
    setContext(prev => ({ ...prev, isLoading: true }));
    
    // Update time immediately
    updateTimeContext();
    
    // Fetch location and weather in parallel
    await Promise.all([
      fetchLocation(),
      fetchWeather(),
    ]);
    
    setContext(prev => ({ 
      ...prev, 
      isLoading: false, 
      lastUpdated: new Date() 
    }));
  }, [updateTimeContext, fetchLocation, fetchWeather]);

  /**
   * Refresh all context data
   */
  const refresh = useCallback(async () => {
    // Clear caches to force fresh data
    weatherCacheRef.current = null;
    locationCacheRef.current = null;
    await initializeContext();
  }, [initializeContext]);

  /**
   * Get natural language context for AI
   * This is what gets passed to the AI system
   */
  const getContextForAI = useCallback((): string => {
    const parts: string[] = [];
    
    // Time context
    parts.push(`Current time: ${context.currentTime} (${context.timeOfDay})`);
    parts.push(`Date: ${context.dayOfWeek}, ${context.currentDate}`);
    
    if (context.isWeekend) {
      parts.push(`It's the weekend`);
    }
    
    if (context.isLateNight) {
      parts.push(`It's late night - user might be tired or having trouble sleeping`);
    }
    
    // Location context (if available)
    if (context.hasLocation && context.city) {
      parts.push(`Location: ${context.city}${context.country ? `, ${context.country}` : ''}`);
    }
    
    // Weather context (if available)
    if (context.hasWeather && context.temperature !== null) {
      let weatherDesc = `Weather: ${context.temperature}°C`;
      
      if (context.condition) {
        weatherDesc += ` (${context.condition})`;
      }
      
      if (context.isHot) {
        weatherDesc += ` - Hot today, user may need hydration reminders`;
      } else if (context.isCold) {
        weatherDesc += ` - Cold today`;
      }
      
      if (context.isRaining) {
        weatherDesc += ` - Raining, outdoor plans may need adjustment`;
      }
      
      parts.push(weatherDesc);
    }
    
    return parts.join('\n');
  }, [context]);

  /**
   * Get a natural greeting based on context
   */
  const getNaturalGreeting = useCallback((): string => {
    const { timeOfDay, isWeekend, temperature, isHot, isRaining, condition } = context;
    
    let greeting = '';
    
    // Time-based opening
    switch (timeOfDay) {
      case 'morning':
        greeting = 'Morning';
        break;
      case 'afternoon':
        greeting = 'Hey';
        break;
      case 'evening':
        greeting = 'Evening';
        break;
      case 'night':
        greeting = 'Still up?';
        break;
    }
    
    // Add weather flavor if relevant
    if (isHot && temperature && temperature > 32) {
      greeting += '\nIt\'s really warm today — staying hydrated will help.';
    } else if (isRaining) {
      greeting += '\nLooks like it\'s rainy out there.';
    } else if (isWeekend && timeOfDay === 'morning') {
      greeting += '\nNice weekend morning 🙂';
    }
    
    return greeting;
  }, [context]);

  // Initialize on mount
  useEffect(() => {
    initializeContext();
    
    // Update time every minute
    const timeInterval = setInterval(updateTimeContext, 60000);
    
    // Refresh weather every 15 minutes
    const weatherInterval = setInterval(fetchWeather, WEATHER_CACHE_DURATION);
    
    return () => {
      clearInterval(timeInterval);
      clearInterval(weatherInterval);
    };
  }, [initializeContext, updateTimeContext, fetchWeather]);

  return {
    context,
    refresh,
    getContextForAI,
    getNaturalGreeting,
    isReady: !context.isLoading,
  };
};
