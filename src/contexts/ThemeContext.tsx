import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

type ThemeMode = 'light' | 'dark' | 'auto';
type ActiveTheme = 'light' | 'dark';

interface ThemeContextType {
  mode: ThemeMode;
  activeTheme: ActiveTheme;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Determine theme based on time and emotional state
const getAutoTheme = (): ActiveTheme => {
  const hour = new Date().getHours();
  // Night (9PM - 6AM) = dark, Day = light
  if (hour >= 21 || hour < 6) return 'dark';
  return 'light';
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('aura-theme-mode');
    return (saved as ThemeMode) || 'auto';
  });

  const [activeTheme, setActiveTheme] = useState<ActiveTheme>(() => {
    if (mode === 'auto') return getAutoTheme();
    return mode as ActiveTheme;
  });

  // Update active theme based on mode
  useEffect(() => {
    if (mode === 'auto') {
      setActiveTheme(getAutoTheme());
      
      // Check every minute for time-based changes
      const interval = setInterval(() => {
        setActiveTheme(getAutoTheme());
      }, 60000);
      
      return () => clearInterval(interval);
    } else {
      setActiveTheme(mode as ActiveTheme);
    }
  }, [mode]);

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    
    if (activeTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [activeTheme]);

  // Listen for system preference changes
  useEffect(() => {
    if (mode !== 'auto') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      // System preference as secondary signal
      if (mode === 'auto') {
        const timeBasedTheme = getAutoTheme();
        // Only use system preference if it aligns with time (optional refinement)
        setActiveTheme(timeBasedTheme);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [mode]);

  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
    localStorage.setItem('aura-theme-mode', newMode);
  }, []);

  return (
    <ThemeContext.Provider value={{ mode, activeTheme, setMode }}>
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
