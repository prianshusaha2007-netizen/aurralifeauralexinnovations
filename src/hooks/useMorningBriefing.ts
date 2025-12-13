import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface MorningBriefing {
  greeting: string;
  weather: string;
  schedule: string;
  habits: string;
  mood: string;
  motivation: string;
  fullMessage: string;
}

export const useMorningBriefing = () => {
  const { user } = useAuth();
  const [briefing, setBriefing] = useState<MorningBriefing | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchBriefing = useCallback(async () => {
    if (!user) return null;

    setIsLoading(true);

    try {
      // Get user location
      let latitude: number | undefined;
      let longitude: number | undefined;

      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: false,
            timeout: 5000,
            maximumAge: 300000,
          });
        });
        latitude = position.coords.latitude;
        longitude = position.coords.longitude;
      } catch {
        console.log('Location not available for briefing');
      }

      const { data, error } = await supabase.functions.invoke('morning-briefing', {
        body: { userId: user.id, latitude, longitude },
      });

      if (error) throw error;

      setBriefing(data);
      return data;
    } catch (error) {
      console.error('Failed to fetch morning briefing:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const showBriefingNotification = useCallback(async () => {
    const data = await fetchBriefing();
    if (data) {
      // Show as a toast notification
      toast.success(data.greeting, {
        description: data.fullMessage.slice(0, 150) + '...',
        duration: 10000,
      });
    }
  }, [fetchBriefing]);

  // Check if we should show morning briefing
  useEffect(() => {
    const checkMorningBriefing = () => {
      const now = new Date();
      const hour = now.getHours();
      
      // Only show between 6 AM and 10 AM
      if (hour < 6 || hour > 10) return;

      // Check if already shown today
      const lastShown = localStorage.getItem('aura-morning-briefing-date');
      const today = now.toISOString().split('T')[0];
      
      if (lastShown === today) return;

      // Show briefing
      localStorage.setItem('aura-morning-briefing-date', today);
      showBriefingNotification();
    };

    // Check after a short delay to let the app load
    const timer = setTimeout(checkMorningBriefing, 3000);
    return () => clearTimeout(timer);
  }, [showBriefingNotification]);

  return {
    briefing,
    isLoading,
    fetchBriefing,
    showBriefingNotification,
  };
};
