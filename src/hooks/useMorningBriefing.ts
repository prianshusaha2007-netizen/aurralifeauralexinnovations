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

  // Keep useEffect to maintain hook count - auto-trigger disabled, called manually from CalmChatScreen
  // The automatic briefing was causing 401 errors when auth wasn't ready
  useEffect(() => {
    // No-op - briefing is now triggered manually in CalmChatScreen after auth check
  }, []);

  return {
    briefing,
    isLoading,
    fetchBriefing,
    showBriefingNotification,
  };
};
