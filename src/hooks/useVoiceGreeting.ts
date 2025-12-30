import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseVoiceGreetingReturn {
  playGreeting: (text: string) => Promise<void>;
  isPlaying: boolean;
  error: string | null;
}

export const useVoiceGreeting = (): UseVoiceGreetingReturn => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const playGreeting = useCallback(async (text: string) => {
    if (isPlaying) return;
    
    setIsPlaying(true);
    setError(null);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.log('No session, skipping voice greeting');
        setIsPlaying(false);
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ text }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.log('TTS response not ok:', errorData);
        setIsPlaying(false);
        return;
      }

      const data = await response.json();
      
      if (data.audioContent) {
        const audioUrl = `data:audio/mpeg;base64,${data.audioContent}`;
        const audio = new Audio(audioUrl);
        
        audio.onended = () => setIsPlaying(false);
        audio.onerror = () => {
          console.error('Audio playback error');
          setIsPlaying(false);
        };
        
        await audio.play();
      } else {
        setIsPlaying(false);
      }
    } catch (err) {
      console.error('Voice greeting error:', err);
      setError(err instanceof Error ? err.message : 'Failed to play greeting');
      setIsPlaying(false);
    }
  }, [isPlaying]);

  return { playGreeting, isPlaying, error };
};

// Check if it's a weekend
const isWeekend = (): boolean => {
  const day = new Date().getDay();
  return day === 0 || day === 6; // Sunday = 0, Saturday = 6
};

// Check for common holidays (add more as needed)
const getHoliday = (): string | null => {
  const today = new Date();
  const month = today.getMonth() + 1; // 1-indexed
  const day = today.getDate();
  
  // Major holidays
  if (month === 1 && day === 1) return 'new_year';
  if (month === 2 && day === 14) return 'valentine';
  if (month === 3 && day === 17) return 'st_patrick';
  if (month === 7 && day === 4) return 'independence_day';
  if (month === 10 && day === 31) return 'halloween';
  if (month === 11 && day >= 22 && day <= 28 && new Date(today.getFullYear(), 10, day).getDay() === 4) return 'thanksgiving';
  if (month === 12 && day === 25) return 'christmas';
  if (month === 12 && day === 31) return 'new_year_eve';
  
  // Diwali (approximate - varies each year, typically Oct-Nov)
  if ((month === 10 || month === 11) && day >= 1 && day <= 15) {
    // This is a rough approximation - Diwali date changes yearly
  }
  
  // Holi (approximate - typically March)
  if (month === 3 && day >= 1 && day <= 15) {
    // This is a rough approximation - Holi date changes yearly
  }
  
  return null;
};

// Check if it's the user's birthday (requires birthday to be stored in profile)
const isBirthday = (userBirthday?: string): boolean => {
  if (!userBirthday) return false;
  
  const today = new Date();
  const birthday = new Date(userBirthday);
  
  return today.getMonth() === birthday.getMonth() && today.getDate() === birthday.getDate();
};

// Holiday-specific greetings
const getHolidayGreeting = (holiday: string, userName: string, aiName: string): string => {
  const greetings: Record<string, string[]> = {
    new_year: [
      `Happy New Year, ${userName}! ${aiName} hopes this year brings you everything you wish for.`,
      `New year, new beginnings, ${userName}. Wishing you an amazing year ahead.`,
      `Welcome to the new year, ${userName}. Let's make it a great one together.`,
    ],
    new_year_eve: [
      `Happy New Year's Eve, ${userName}! Ready to ring in the new year?`,
      `Last day of the year, ${userName}. What a journey it's been.`,
      `${userName}, tonight we celebrate. Happy New Year's Eve!`,
    ],
    valentine: [
      `Happy Valentine's Day, ${userName}. Spreading some love your way.`,
      `${userName}, wishing you a day filled with love and happiness.`,
      `Valentine's Day, ${userName}. Remember, you're pretty amazing.`,
    ],
    st_patrick: [
      `Happy St. Patrick's Day, ${userName}! May luck be on your side.`,
      `${userName}, feeling lucky today? Happy St. Patrick's Day!`,
    ],
    independence_day: [
      `Happy Independence Day, ${userName}! Hope you have a fantastic celebration.`,
      `${userName}, wishing you a safe and happy Fourth of July!`,
    ],
    halloween: [
      `Happy Halloween, ${userName}! Don't let the spooks get you.`,
      `Boo! Just kidding, ${userName}. Have a spooktacular Halloween!`,
      `${userName}, ready for some tricks and treats? Happy Halloween!`,
    ],
    thanksgiving: [
      `Happy Thanksgiving, ${userName}. Grateful to be here with you.`,
      `${userName}, wishing you a wonderful Thanksgiving filled with gratitude.`,
      `Thanksgiving vibes, ${userName}. What are you thankful for today?`,
    ],
    christmas: [
      `Merry Christmas, ${userName}! ${aiName} hopes your day is magical.`,
      `${userName}, wishing you a warm and joyful Christmas.`,
      `Christmas Day, ${userName}! Hope it's filled with love and laughter.`,
    ],
  };
  
  const options = greetings[holiday] || [];
  return options[Math.floor(Math.random() * options.length)] || '';
};

// Birthday greetings
const getBirthdayGreeting = (userName: string, aiName: string): string => {
  const greetings = [
    `Happy Birthday, ${userName}! 🎂 ${aiName} hopes you have an incredible day.`,
    `It's your special day, ${userName}! Happy Birthday! Make it amazing.`,
    `${userName}, happy birthday! Another year wiser, another year stronger.`,
    `Birthday wishes coming your way, ${userName}! Hope today is as wonderful as you are.`,
    `${userName}! It's your birthday! ${aiName}'s wishing you all the best today.`,
  ];
  return greetings[Math.floor(Math.random() * greetings.length)];
};

// Weekend greetings
const getWeekendGreeting = (userName: string, aiName: string, hour: number): string => {
  const day = new Date().getDay();
  const isSaturday = day === 6;
  
  if (hour >= 5 && hour < 12) {
    const greetings = isSaturday ? [
      `Happy Saturday, ${userName}! No rush today. Take it easy.`,
      `Saturday morning, ${userName}. What's the plan for the weekend?`,
      `${userName}, weekend vibes! Hope you're sleeping in.`,
    ] : [
      `Happy Sunday, ${userName}! A day for rest and recharge.`,
      `Sunday morning, ${userName}. Hope you're having a peaceful start.`,
      `${userName}, it's Sunday. Perfect day to do absolutely nothing.`,
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  } else if (hour >= 12 && hour < 17) {
    const greetings = [
      `Weekend afternoon, ${userName}. How's the day going?`,
      `${userName}, hope your ${isSaturday ? 'Saturday' : 'Sunday'} is treating you well.`,
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  } else {
    const greetings = [
      `${isSaturday ? 'Saturday' : 'Sunday'} evening, ${userName}. Winding down?`,
      `${userName}, hope you had a great ${isSaturday ? 'Saturday' : 'Sunday'}.`,
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  }
};

// Greeting messages based on time of day and special occasions
export const getTimeBasedGreeting = (userName: string, aiName: string = 'AURRA', userBirthday?: string): string => {
  const hour = new Date().getHours();
  
  // Priority 1: Birthday
  if (isBirthday(userBirthday)) {
    return getBirthdayGreeting(userName, aiName);
  }
  
  // Priority 2: Holidays
  const holiday = getHoliday();
  if (holiday) {
    const holidayGreeting = getHolidayGreeting(holiday, userName, aiName);
    if (holidayGreeting) return holidayGreeting;
  }
  
  // Priority 3: Weekends
  if (isWeekend()) {
    return getWeekendGreeting(userName, aiName, hour);
  }
  
  // Default: Time-based greetings
  if (hour >= 5 && hour < 12) {
    const greetings = [
      `Good morning, ${userName}. ${aiName} here. Hope you slept well.`,
      `Morning, ${userName}. Ready for today?`,
      `Hey ${userName}, good morning. Let's make today count.`,
      `Rise and shine, ${userName}. ${aiName}'s here when you need me.`,
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  } else if (hour >= 12 && hour < 17) {
    const greetings = [
      `Good afternoon, ${userName}. How's your day going?`,
      `Hey ${userName}, afternoon check-in. Everything okay?`,
      `${userName}, hope your day's been good so far. ${aiName}'s here.`,
      `Afternoon, ${userName}. Need anything?`,
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  } else if (hour >= 17 && hour < 21) {
    const greetings = [
      `Good evening, ${userName}. How was your day?`,
      `Evening, ${userName}. Time to unwind?`,
      `Hey ${userName}, the day's winding down. How are you feeling?`,
      `${userName}, evening's here. ${aiName}'s ready to listen.`,
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  } else {
    const greetings = [
      `Hey ${userName}. Still up? I'm here if you need to talk.`,
      `${userName}, it's late. Everything okay?`,
      `Night owl, ${userName}? ${aiName}'s here with you.`,
      `Late night, ${userName}. Can't sleep, or just winding down?`,
      `${userName}, quiet hours. Sometimes these are the best times to think.`,
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  }
};

// Legacy function for backward compatibility
export const getMorningGreeting = getTimeBasedGreeting;

// Onboarding naming step greeting
export const getOnboardingNamingGreeting = (): string => {
  return "This is completely optional, but giving me a name can make our conversations feel more personal. What would you like to call me?";
};
