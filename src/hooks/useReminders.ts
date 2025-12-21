import { useState, useEffect, useCallback } from 'react';

export type ReminderCategory = 
  | 'one-time' 
  | 'alarm' 
  | 'repeating' 
  | 'health' 
  | 'productivity';

export type RepeatPattern = 
  | 'none' 
  | 'daily' 
  | 'weekly' 
  | 'custom';

export interface Reminder {
  id: string;
  title: string;
  time: Date;
  category: ReminderCategory;
  icon: string;
  repeatPattern: RepeatPattern;
  customRepeat?: string;
  isActive: boolean;
  snoozedUntil?: Date;
  completedAt?: Date;
  createdAt: Date;
}

interface ParsedReminder {
  title: string;
  time: Date;
  category: ReminderCategory;
  repeatPattern: RepeatPattern;
  icon: string;
}

const STORAGE_KEY = 'aura-reminders';

export const useReminders = () => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [activeReminder, setActiveReminder] = useState<Reminder | null>(null);

  // Load reminders from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const restored = parsed.map((r: any) => ({
          ...r,
          time: new Date(r.time),
          createdAt: new Date(r.createdAt),
          snoozedUntil: r.snoozedUntil ? new Date(r.snoozedUntil) : undefined,
          completedAt: r.completedAt ? new Date(r.completedAt) : undefined,
        }));
        setReminders(restored);
      } catch (e) {
        console.error('Failed to parse reminders:', e);
      }
    }
  }, []);

  // Save reminders to localStorage
  useEffect(() => {
    if (reminders.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(reminders));
    }
  }, [reminders]);

  // Check for triggered reminders
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      
      reminders.forEach((reminder) => {
        if (!reminder.isActive || reminder.completedAt) return;
        if (reminder.snoozedUntil && now < reminder.snoozedUntil) return;
        
        const reminderTime = new Date(reminder.time);
        const timeDiff = Math.abs(now.getTime() - reminderTime.getTime());
        
        // Trigger if within 30 seconds
        if (timeDiff <= 30000 && !activeReminder) {
          setActiveReminder(reminder);
        }
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [reminders, activeReminder]);

  // Parse natural language to extract reminder details
  const parseNaturalLanguage = useCallback((text: string): ParsedReminder | null => {
    const lowerText = text.toLowerCase();
    let time = new Date();
    let title = text;
    let category: ReminderCategory = 'one-time';
    let repeatPattern: RepeatPattern = 'none';
    let icon = '🔔';

    // Time parsing
    const inMinutesMatch = lowerText.match(/in (\d+) minute/i);
    const inHoursMatch = lowerText.match(/in (\d+) hour/i);
    const atTimeMatch = lowerText.match(/at (\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
    const tomorrowMatch = lowerText.includes('tomorrow');
    
    if (inMinutesMatch) {
      time.setMinutes(time.getMinutes() + parseInt(inMinutesMatch[1]));
    } else if (inHoursMatch) {
      time.setHours(time.getHours() + parseInt(inHoursMatch[1]));
    } else if (atTimeMatch) {
      let hours = parseInt(atTimeMatch[1]);
      const minutes = atTimeMatch[2] ? parseInt(atTimeMatch[2]) : 0;
      const period = atTimeMatch[3]?.toLowerCase();
      
      if (period === 'pm' && hours !== 12) hours += 12;
      if (period === 'am' && hours === 12) hours = 0;
      
      time.setHours(hours, minutes, 0, 0);
      if (time < new Date()) {
        time.setDate(time.getDate() + 1);
      }
    }

    if (tomorrowMatch) {
      time.setDate(time.getDate() + 1);
    }

    // Repeat pattern detection
    if (lowerText.includes('every hour')) {
      repeatPattern = 'custom';
      category = 'repeating';
    } else if (lowerText.includes('every day') || lowerText.includes('daily')) {
      repeatPattern = 'daily';
      category = 'repeating';
    } else if (lowerText.includes('every week') || lowerText.includes('weekly')) {
      repeatPattern = 'weekly';
      category = 'repeating';
    }

    // Category detection
    if (lowerText.includes('wake up') || lowerText.includes('alarm') || lowerText.includes('sleep')) {
      category = 'alarm';
      icon = '⏰';
    } else if (lowerText.includes('medicine') || lowerText.includes('water') || 
               lowerText.includes('workout') || lowerText.includes('exercise')) {
      category = 'health';
      if (lowerText.includes('water')) icon = '💧';
      else if (lowerText.includes('medicine')) icon = '💊';
      else icon = '💪';
    } else if (lowerText.includes('meeting') || lowerText.includes('study') || 
               lowerText.includes('work') || lowerText.includes('deadline')) {
      category = 'productivity';
      icon = '📚';
    } else if (lowerText.includes('call')) {
      icon = '📞';
    }

    // Extract title (remove time-related words)
    title = text
      .replace(/remind me to /gi, '')
      .replace(/in \d+ (minute|hour)s?/gi, '')
      .replace(/at \d{1,2}(:\d{2})?\s*(am|pm)?/gi, '')
      .replace(/tomorrow/gi, '')
      .replace(/every (hour|day|week)/gi, '')
      .replace(/daily|weekly/gi, '')
      .trim();

    if (!title) title = 'Reminder';

    return { title, time, category, repeatPattern, icon };
  }, []);

  const addReminder = useCallback((reminder: Omit<Reminder, 'id' | 'createdAt'>) => {
    const newReminder: Reminder = {
      ...reminder,
      id: crypto.randomUUID(),
      createdAt: new Date(),
    };
    setReminders(prev => [...prev, newReminder]);
    return newReminder;
  }, []);

  const addFromNaturalLanguage = useCallback((text: string): Reminder | null => {
    const parsed = parseNaturalLanguage(text);
    if (!parsed) return null;

    return addReminder({
      title: parsed.title,
      time: parsed.time,
      category: parsed.category,
      icon: parsed.icon,
      repeatPattern: parsed.repeatPattern,
      isActive: true,
    });
  }, [parseNaturalLanguage, addReminder]);

  const updateReminder = useCallback((id: string, updates: Partial<Reminder>) => {
    setReminders(prev => 
      prev.map(r => r.id === id ? { ...r, ...updates } : r)
    );
  }, []);

  const deleteReminder = useCallback((id: string) => {
    setReminders(prev => prev.filter(r => r.id !== id));
  }, []);

  const snoozeReminder = useCallback((id: string, minutes: number) => {
    const snoozedUntil = new Date();
    snoozedUntil.setMinutes(snoozedUntil.getMinutes() + minutes);
    updateReminder(id, { snoozedUntil });
    setActiveReminder(null);
  }, [updateReminder]);

  const completeReminder = useCallback((id: string) => {
    updateReminder(id, { completedAt: new Date() });
    setActiveReminder(null);
  }, [updateReminder]);

  const dismissActiveReminder = useCallback(() => {
    setActiveReminder(null);
  }, []);

  const toggleReminder = useCallback((id: string) => {
    setReminders(prev => 
      prev.map(r => r.id === id ? { ...r, isActive: !r.isActive } : r)
    );
  }, []);

  return {
    reminders,
    activeReminder,
    addReminder,
    addFromNaturalLanguage,
    updateReminder,
    deleteReminder,
    snoozeReminder,
    completeReminder,
    dismissActiveReminder,
    toggleReminder,
    parseNaturalLanguage,
  };
};
