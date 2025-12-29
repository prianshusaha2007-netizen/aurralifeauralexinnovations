import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

type ThemeMode = 'light' | 'dark' | 'auto';
type ActiveTheme = 'light' | 'dark';

interface UserSchedule {
  wakeTime: string;
  sleepTime: string;
}

interface ThemeContextType {
  mode: ThemeMode;
  activeTheme: ActiveTheme;
  setMode: (mode: ThemeMode) => void;
  setUserSchedule: (schedule: UserSchedule) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Parse time string (HH:MM) to minutes since midnight
const parseTimeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + (minutes || 0);
};

// Get current time as minutes since midnight
const getCurrentMinutes = (): number => {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
};

// Determine theme based on user's wake/sleep schedule
const getAutoTheme = (schedule?: UserSchedule): ActiveTheme => {
  const currentMinutes = getCurrentMinutes();
  
  if (schedule) {
    const wakeMinutes = parseTimeToMinutes(schedule.wakeTime);
    const sleepMinutes = parseTimeToMinutes(schedule.sleepTime);
    
    // Handle case where sleep time is after midnight
    if (sleepMinutes < wakeMinutes) {
      // User sleeps past midnight (e.g., wake 7:00, sleep 01:00)
      // Dark mode: from sleepMinutes to wakeMinutes
      if (currentMinutes >= sleepMinutes && currentMinutes < wakeMinutes) {
        return 'dark';
      }
      return 'light';
    } else {
      // Normal schedule (e.g., wake 7:00, sleep 23:00)
      // Light mode: from wakeMinutes to sleepMinutes
      if (currentMinutes >= wakeMinutes && currentMinutes < sleepMinutes) {
        return 'light';
      }
      return 'dark';
    }
  }
  
  // Default fallback: 6AM-9PM light, rest dark
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 21) return 'light';
  return 'dark';
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('aura-theme-mode');
    return (saved as ThemeMode) || 'auto';
  });

  const [userSchedule, setUserScheduleState] = useState<UserSchedule | undefined>(() => {
    const saved = localStorage.getItem('aura-user-schedule');
    return saved ? JSON.parse(saved) : undefined;
  });

  const [activeTheme, setActiveTheme] = useState<ActiveTheme>(() => {
    if (mode === 'auto') return getAutoTheme(userSchedule);
    return mode as ActiveTheme;
  });

  // Update active theme based on mode and schedule
  useEffect(() => {
    if (mode === 'auto') {
      setActiveTheme(getAutoTheme(userSchedule));
      
      // Check every minute for time-based changes
      const interval = setInterval(() => {
        setActiveTheme(getAutoTheme(userSchedule));
      }, 60000);
      
      return () => clearInterval(interval);
    } else {
      setActiveTheme(mode as ActiveTheme);
    }
  }, [mode, userSchedule]);

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    
    if (activeTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [activeTheme]);

  // Listen for system preference changes (as secondary signal in auto mode)
  useEffect(() => {
    if (mode !== 'auto') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      // User schedule takes priority, but this can trigger a re-check
      setActiveTheme(getAutoTheme(userSchedule));
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [mode, userSchedule]);

  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
    localStorage.setItem('aura-theme-mode', newMode);
  }, []);

  const setUserSchedule = useCallback((schedule: UserSchedule) => {
    setUserScheduleState(schedule);
    localStorage.setItem('aura-user-schedule', JSON.stringify(schedule));
    // Immediately update theme if in auto mode
    if (mode === 'auto') {
      setActiveTheme(getAutoTheme(schedule));
    }
  }, [mode]);

  return (
    <ThemeContext.Provider value={{ mode, activeTheme, setMode, setUserSchedule }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
