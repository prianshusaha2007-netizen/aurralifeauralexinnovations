import { useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useNotifications } from './useNotifications';

interface VoiceCommandResult {
  type: 'reminder' | 'mood_query' | 'schedule' | 'search' | 'play' | 'call' | 'message' | 'weather' | 'time' | 'greeting' | 'restaurants' | 'traffic' | 'general';
  handled: boolean;
  response?: string;
  speakResponse?: boolean;
  data?: any;
}

interface UserProfile {
  name?: string;
  wakeTime?: string;
  sleepTime?: string;
}

export const useVoiceCommands = (userProfile?: UserProfile) => {
  const { scheduleNotification, requestPermission } = useNotifications();

  // Helper to get weather info
  const getWeatherInfo = async (): Promise<string> => {
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error('Geolocation not supported'));
          return;
        }
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 300000,
        });
      });

      const { latitude, longitude } = position.coords;
      const response = await supabase.functions.invoke('get-weather', {
        body: { latitude, longitude }
      });

      if (response.error) throw response.error;
      const weather = response.data;
      return `${weather.temperature}°C, ${weather.description.toLowerCase()} ${weather.emoji}`;
    } catch {
      return '';
    }
  };

  const parseTimeFromText = (text: string): number | null => {
    const timePatterns = [
      { regex: /(\d+)\s*(?:minute|min|minutes|mins)/i, multiplier: 60 * 1000 },
      { regex: /(\d+)\s*(?:hour|hours|hr|hrs)/i, multiplier: 60 * 60 * 1000 },
      { regex: /(\d+)\s*(?:second|seconds|sec|secs)/i, multiplier: 1000 },
    ];

    for (const pattern of timePatterns) {
      const match = text.match(pattern.regex);
      if (match) {
        return parseInt(match[1]) * pattern.multiplier;
      }
    }
    return null;
  };

  const extractReminderText = (text: string): string => {
    const cleanText = text
      .replace(/^(hey\s+)?aura[,\s]*/i, '')
      .replace(/remind\s+me\s+to\s+/i, '')
      .replace(/set\s+(a\s+)?reminder\s+(for\s+)?/i, '')
      .replace(/in\s+\d+\s*(minute|minutes|min|mins|hour|hours|hr|hrs|second|seconds|sec|secs)/i, '')
      .replace(/after\s+\d+\s*(minute|minutes|min|mins|hour|hours|hr|hrs|second|seconds|sec|secs)/i, '')
      .trim();
    return cleanText || 'Your reminder';
  };

  const processCommand = useCallback(async (text: string): Promise<VoiceCommandResult> => {
    const lowerText = text.toLowerCase();
    const cleanedText = lowerText.replace(/^(hey\s+)?aura[,\s]*/i, '').trim();
    const userName = userProfile?.name || 'friend';

    // Morning greeting with weather
    if (cleanedText.includes('good morning') || 
        (cleanedText.includes('morning') && (cleanedText.includes('hey') || cleanedText.includes('hi')))) {
      const weatherInfo = await getWeatherInfo();
      const hour = new Date().getHours();
      
      let greeting = '';
      if (hour < 6) {
        greeting = `You're up early, ${userName}! `;
      } else if (hour < 9) {
        greeting = `Good morning, ${userName}! `;
      } else if (hour < 12) {
        greeting = `Late morning vibes, ${userName}! `;
      } else {
        greeting = `Hey ${userName}, it's actually afternoon now! `;
      }

      let response = greeting;
      if (weatherInfo) {
        response += `It's ${weatherInfo} outside. `;
      }

      // Add schedule info
      try {
        const { data: routines } = await supabase
          .from('routines')
          .select('*')
          .order('time', { ascending: true });

        const now = new Date();
        const currentTime = now.toTimeString().slice(0, 5);
        const todaysTasks = routines?.filter((r: any) => r.time >= currentTime && !r.completed) || [];

        if (todaysTasks.length > 0) {
          const firstTask = todaysTasks[0];
          response += `You've got ${todaysTasks.length} tasks today. First up: ${firstTask.title} at ${firstTask.time}. `;
        } else {
          response += `Your schedule looks clear today! `;
        }
      } catch {
        // Ignore schedule errors
      }

      // Add mood-based suggestion
      try {
        const { data: moodData } = await supabase
          .from('mood_checkins')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1);

        if (moodData && moodData.length > 0) {
          const lastMood = moodData[0].mood;
          if (lastMood === 'stressed' || lastMood === 'anxious') {
            response += `Yesterday seemed a bit tough. Take it easy today, okay? 💙`;
          } else if (lastMood === 'happy' || lastMood === 'excited') {
            response += `You were feeling great yesterday — let's keep that energy going! ✨`;
          }
        }
      } catch {
        // Ignore mood errors
      }

      response += ` What would you like to tackle first?`;

      return {
        type: 'greeting',
        handled: true,
        speakResponse: true,
        response,
      };
    }

    // Good night greeting
    if (cleanedText.includes('good night') || cleanedText.includes('goodnight')) {
      const responses = [
        `Sweet dreams, ${userName}! 🌙 I'll be here when you wake up.`,
        `Night night, ${userName}! Rest well — you've earned it. 💤`,
        `Sleep tight, ${userName}. Tomorrow's a new day! 🌟`,
      ];
      return {
        type: 'greeting',
        handled: true,
        speakResponse: true,
        response: responses[Math.floor(Math.random() * responses.length)],
      };
    }

    // Casual greetings
    if (cleanedText === 'hey' || cleanedText === 'hi' || cleanedText === 'hello' || 
        cleanedText.includes('what\'s up') || cleanedText.includes('whats up') ||
        cleanedText.includes('how are you')) {
      const hour = new Date().getHours();
      let timeGreeting = '';
      if (hour < 12) timeGreeting = 'this morning';
      else if (hour < 17) timeGreeting = 'this afternoon';
      else if (hour < 21) timeGreeting = 'this evening';
      else timeGreeting = 'tonight';

      const responses = [
        `Hey ${userName}! What's going on ${timeGreeting}?`,
        `What's up, ${userName}? How can I help?`,
        `Hey! Good to see you ${timeGreeting}. What's on your mind?`,
        `${userName}! What are we working on ${timeGreeting}?`,
      ];
      return {
        type: 'greeting',
        handled: true,
        speakResponse: true,
        response: responses[Math.floor(Math.random() * responses.length)],
      };
    }

    // Restaurant recommendations
    if (cleanedText.includes('restaurant') || cleanedText.includes('food nearby') || 
        cleanedText.includes('where to eat') || cleanedText.includes('hungry') ||
        cleanedText.includes('recommend food') || cleanedText.includes('places to eat')) {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          if (!navigator.geolocation) {
            reject(new Error('Geolocation not supported'));
            return;
          }
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: false,
            timeout: 10000,
            maximumAge: 300000,
          });
        });

        const { latitude, longitude } = position.coords;
        const response = await supabase.functions.invoke('get-location-info', {
          body: { latitude, longitude, type: 'restaurants' }
        });

        if (response.error) throw response.error;
        
        const restaurants = response.data.restaurants;
        if (restaurants.length === 0) {
          return {
            type: 'restaurants',
            handled: true,
            speakResponse: true,
            response: "I couldn't find nearby restaurants right now. Try searching on Google Maps! 🍽️",
          };
        }

        const list = restaurants.slice(0, 3).map((r: any) => 
          `${r.name} (${r.cuisine || r.type})`
        ).join(', ');

        return {
          type: 'restaurants',
          handled: true,
          speakResponse: true,
          response: `Here are some nearby options: ${list}. Want me to search for more details? 🍽️`,
          data: { restaurants },
        };
      } catch (error) {
        return {
          type: 'restaurants',
          handled: true,
          speakResponse: true,
          response: "I need location access to find nearby restaurants. Enable location and try again! 📍",
        };
      }
    }

    // Traffic updates
    if (cleanedText.includes('traffic') || cleanedText.includes('commute') || 
        cleanedText.includes('road conditions')) {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          if (!navigator.geolocation) {
            reject(new Error('Geolocation not supported'));
            return;
          }
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });

        const { latitude, longitude } = position.coords;
        const response = await supabase.functions.invoke('get-location-info', {
          body: { latitude, longitude, type: 'traffic' }
        });

        if (response.error) throw response.error;
        
        const traffic = response.data;
        const emojis: Record<string, string> = {
          'light': '🟢',
          'moderate': '🟡', 
          'heavy': '🔴',
        };

        return {
          type: 'traffic',
          handled: true,
          speakResponse: true,
          response: `Traffic is ${traffic.trafficLevel} ${emojis[traffic.trafficLevel] || ''}. ${traffic.eta} ${traffic.suggestion}`,
          data: traffic,
        };
      } catch {
        return {
          type: 'traffic',
          handled: true,
          speakResponse: true,
          response: "I couldn't check traffic conditions right now. Try Google Maps for real-time updates! 🚗",
        };
      }
    }

    // Time/Date queries
    if (cleanedText.includes('what time') || cleanedText.includes('current time')) {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      return {
        type: 'time',
        handled: true,
        speakResponse: true,
        response: `It's ${timeStr} right now! ⏰`,
      };
    }

    if (cleanedText.includes('what day') || cleanedText.includes('what date') || cleanedText.includes('today\'s date')) {
      const now = new Date();
      const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
      return {
        type: 'time',
        handled: true,
        speakResponse: true,
        response: `Today is ${dateStr}! 📅`,
      };
    }

    // Schedule/Routine queries
    if (cleanedText.includes('schedule') || cleanedText.includes('my routine') || 
        cleanedText.includes('what\'s on') || cleanedText.includes('my day') ||
        cleanedText.includes('what do i have')) {
      try {
        const { data: routines, error } = await supabase
          .from('routines')
          .select('*')
          .order('time', { ascending: true });

        if (error) throw error;

        if (!routines || routines.length === 0) {
          return {
            type: 'schedule',
            handled: true,
            speakResponse: true,
            response: "You don't have any routines set up yet! Go to Routine Manager to add your daily schedule. 📋",
          };
        }

        const now = new Date();
        const currentTime = now.toTimeString().slice(0, 5);
        const upcomingRoutines = routines.filter((r: any) => r.time >= currentTime && !r.completed);
        
        if (upcomingRoutines.length === 0) {
          return {
            type: 'schedule',
            handled: true,
            speakResponse: true,
            response: "You've completed all your tasks for today! Great job! 🎉",
          };
        }

        const nextThree = upcomingRoutines.slice(0, 3);
        const scheduleList = nextThree.map((r: any) => `${r.title} at ${r.time}`).join(', ');
        
        return {
          type: 'schedule',
          handled: true,
          speakResponse: true,
          response: `Here's what's coming up: ${scheduleList}. You have ${upcomingRoutines.length} tasks remaining today! 📅`,
          data: { routines: upcomingRoutines }
        };
      } catch (error) {
        console.error('Schedule query error:', error);
        return {
          type: 'schedule',
          handled: false,
          response: "I couldn't fetch your schedule. Let's try again later!",
        };
      }
    }

    // Reminder commands
    if (cleanedText.includes('remind') || cleanedText.includes('reminder') || cleanedText.includes('set a reminder')) {
      const delayMs = parseTimeFromText(text);
      const reminderText = extractReminderText(text);
      
      if (delayMs) {
        await requestPermission();
        await scheduleNotification({
          title: '⏰ AURA Reminder',
          body: reminderText,
          tag: `reminder-${Date.now()}`,
        }, delayMs);

        const timeInMinutes = Math.round(delayMs / 60000);
        const timeDisplay = timeInMinutes >= 60 
          ? `${Math.round(timeInMinutes / 60)} hour${Math.round(timeInMinutes / 60) > 1 ? 's' : ''}`
          : `${timeInMinutes} minute${timeInMinutes > 1 ? 's' : ''}`;

        toast.success(`Reminder set for ${timeDisplay}!`);
        
        return {
          type: 'reminder',
          handled: true,
          speakResponse: true,
          response: `Got it! I'll remind you "${reminderText}" in ${timeDisplay}. 🔔`,
          data: { reminderText, delayMs }
        };
      } else {
        return {
          type: 'reminder',
          handled: false,
          speakResponse: true,
          response: "I couldn't understand the time. Try saying something like 'Remind me to drink water in 30 minutes'.",
        };
      }
    }

    // Mood queries
    if (cleanedText.includes('how am i feeling') || cleanedText.includes('my mood') || 
        cleanedText.includes('mood this week') || cleanedText.includes('feeling this week') ||
        cleanedText.includes('my emotions') || cleanedText.includes('emotional state')) {
      try {
        const { data: moodData, error } = await supabase
          .from('mood_checkins')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(7);

        if (error) throw error;

        if (!moodData || moodData.length === 0) {
          return {
            type: 'mood_query',
            handled: true,
            speakResponse: true,
            response: "I don't have any mood data for you yet. Try doing a daily check-in first! Go to Daily Check-In from the menu. 🌟",
          };
        }

        const moodCounts: Record<string, number> = {};
        moodData.forEach((entry: any) => {
          moodCounts[entry.mood] = (moodCounts[entry.mood] || 0) + 1;
        });

        const dominantMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'neutral';
        const moodEmojis: Record<string, string> = {
          'happy': '😊', 'sad': '😢', 'anxious': '😰', 'calm': '😌',
          'excited': '🎉', 'tired': '😴', 'stressed': '😫', 'neutral': '😐'
        };

        const response = `Based on your recent check-ins, you've mostly been feeling ${dominantMood} ${moodEmojis[dominantMood] || '✨'}. ${
          dominantMood === 'happy' || dominantMood === 'excited' 
            ? "You're doing great! Keep up the positive vibes!" 
            : dominantMood === 'stressed' || dominantMood === 'anxious'
            ? "I'm here for you. Want to talk about what's on your mind?"
            : "Remember, I'm always here if you need me!"
        }`;

        return {
          type: 'mood_query',
          handled: true,
          speakResponse: true,
          response,
          data: { moodData, dominantMood }
        };
      } catch (error) {
        console.error('Mood query error:', error);
        return {
          type: 'mood_query',
          handled: false,
          response: "I had trouble checking your mood data. Let's try again later!",
        };
      }
    }

    // Music/Play commands
    if (cleanedText.includes('play') || cleanedText.includes('music') || cleanedText.includes('song')) {
      let musicType = 'music';
      if (cleanedText.includes('calm') || cleanedText.includes('relaxing')) musicType = 'calm music';
      else if (cleanedText.includes('focus') || cleanedText.includes('study')) musicType = 'focus music';
      else if (cleanedText.includes('workout') || cleanedText.includes('energetic')) musicType = 'workout music';
      else if (cleanedText.includes('sleep') || cleanedText.includes('ambient')) musicType = 'sleep sounds';

      // Open YouTube/Spotify with search
      const searchQuery = encodeURIComponent(musicType);
      window.open(`https://www.youtube.com/results?search_query=${searchQuery}`, '_blank');
      
      return {
        type: 'play',
        handled: true,
        speakResponse: true,
        response: `Opening YouTube to play ${musicType} for you! 🎵`,
      };
    }

    // Search commands
    if (cleanedText.includes('search for') || cleanedText.includes('google') || cleanedText.includes('look up')) {
      const searchTerm = cleanedText
        .replace(/search\s+for\s+/i, '')
        .replace(/google\s+/i, '')
        .replace(/look\s+up\s+/i, '')
        .trim();
      
      if (searchTerm) {
        window.open(`https://www.google.com/search?q=${encodeURIComponent(searchTerm)}`, '_blank');
        return {
          type: 'search',
          handled: true,
          speakResponse: true,
          response: `Searching for "${searchTerm}" on Google! 🔍`,
        };
      }
    }

    // Weather commands
    if (cleanedText.includes('weather')) {
      try {
        // Get user's location
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          if (!navigator.geolocation) {
            reject(new Error('Geolocation not supported'));
            return;
          }
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: false,
            timeout: 10000,
            maximumAge: 300000, // Cache for 5 minutes
          });
        });

        const { latitude, longitude } = position.coords;
        
        const response = await supabase.functions.invoke('get-weather', {
          body: { latitude, longitude }
        });

        if (response.error) throw response.error;
        
        const weather = response.data;
        const weatherResponse = `It's currently ${weather.temperature}°C and ${weather.description.toLowerCase()} ${weather.emoji}. Feels like ${weather.feelsLike}°C with ${weather.humidity}% humidity and wind at ${weather.windSpeed} km/h.`;
        
        return {
          type: 'weather',
          handled: true,
          speakResponse: true,
          response: weatherResponse,
          data: weather,
        };
      } catch (error) {
        console.error('Weather error:', error);
        
        // Check if it's a permission error
        if (error instanceof GeolocationPositionError) {
          return {
            type: 'weather',
            handled: true,
            speakResponse: true,
            response: "I need location access to check the weather. Please enable location permissions and try again! 📍",
          };
        }
        
        return {
          type: 'weather',
          handled: true,
          speakResponse: true,
          response: "I couldn't fetch the weather right now. Let's try again in a bit! 🌤️",
        };
      }
    }

    // Call commands
    if (cleanedText.includes('call ') || cleanedText.includes('phone ')) {
      return {
        type: 'call',
        handled: false,
        speakResponse: true,
        response: "Phone integration is coming soon! For now, I can help you with other things. 📞",
      };
    }

    // Message commands
    if (cleanedText.includes('send a message') || cleanedText.includes('text ') || cleanedText.includes('whatsapp')) {
      return {
        type: 'message',
        handled: false,
        speakResponse: true,
        response: "Messaging integration is on the roadmap! I'll let you know when it's ready. 💬",
      };
    }

    // Default - not a recognized command
    return {
      type: 'general',
      handled: false,
    };
  }, [scheduleNotification, requestPermission]);

  return { processCommand };
};
