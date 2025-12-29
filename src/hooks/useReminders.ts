import { useState, useEffect, useCallback, useRef } from 'react';
import { useReminderNotifications } from './useReminderNotifications';
import { useEnhancedNotifications } from './useEnhancedNotifications';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

export type ReminderStatus = 'scheduled' | 'fired' | 'completed' | 'snoozed';

export interface Reminder {
  id: string;
  title: string;
  time: Date;
  category: ReminderCategory;
  icon: string;
  repeatPattern: RepeatPattern;
  customRepeat?: string;
  isActive: boolean;
  status: ReminderStatus;
  snoozedUntil?: Date;
  completedAt?: Date;
  createdAt: Date;
  notificationId?: number;
}

interface ParsedReminder {
  title: string;
  time: Date;
  category: ReminderCategory;
  repeatPattern: RepeatPattern;
  icon: string;
}

const CHECK_INTERVAL = 30000; // 30 seconds

export const useReminders = () => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [activeReminder, setActiveReminder] = useState<Reminder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { scheduleReminderNotification, cancelReminderNotification } = useReminderNotifications();
  const { showNotification, permission, requestPermission } = useEnhancedNotifications();
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const firedRemindersRef = useRef<Set<string>>(new Set());

  // Fetch reminders from Supabase
  const fetchReminders = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('reminders')
        .select('*')
        .eq('user_id', user.id)
        .order('time', { ascending: true });

      if (error) throw error;

      const mappedReminders: Reminder[] = (data || []).map(r => ({
        id: r.id,
        title: r.text,
        time: new Date(r.time),
        category: 'one-time' as ReminderCategory,
        icon: '🔔',
        repeatPattern: 'none' as RepeatPattern,
        isActive: r.active ?? true,
        status: 'scheduled' as ReminderStatus,
        createdAt: new Date(r.created_at),
      }));

      setReminders(mappedReminders);
    } catch (error) {
      console.error('Failed to fetch reminders:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load reminders on mount
  useEffect(() => {
    fetchReminders();
  }, [fetchReminders]);

  // Fire reminder notification
  const fireReminder = useCallback(async (reminder: Reminder) => {
    // Prevent duplicate fires
    if (firedRemindersRef.current.has(reminder.id)) return;
    firedRemindersRef.current.add(reminder.id);

    console.log('[Reminder] Firing:', reminder.title);

    // Show browser/service worker notification
    await showNotification({
      title: 'AURRA Reminder',
      body: `Hey 🙂 you asked me to remind you: ${reminder.title}`,
      icon: '/favicon.jpeg',
      tag: `reminder-${reminder.id}`,
      requireInteraction: true,
    });

    // Set as active for in-app popup
    setActiveReminder(reminder);

    // Update status to fired
    setReminders(prev => 
      prev.map(r => r.id === reminder.id ? { ...r, status: 'fired' as ReminderStatus } : r)
    );

    // Show in-app toast as additional fallback
    toast(`${reminder.icon} ${reminder.title}`, {
      description: "Time for your reminder!",
      duration: 10000,
    });
  }, [showNotification]);

  // Check for due reminders every 30 seconds
  useEffect(() => {
    const checkDueReminders = () => {
      const now = new Date();
      
      reminders.forEach((reminder) => {
        if (!reminder.isActive || reminder.status === 'completed' || reminder.status === 'fired') return;
        if (reminder.snoozedUntil && now < reminder.snoozedUntil) return;
        
        const reminderTime = new Date(reminder.time);
        const timeDiff = now.getTime() - reminderTime.getTime();
        
        // Fire if reminder time has passed (within 5 minute window) or is now
        if (timeDiff >= 0 && timeDiff <= 300000) {
          fireReminder(reminder);
        }
      });
    };

    // Initial check
    checkDueReminders();

    // Set up interval
    checkIntervalRef.current = setInterval(checkDueReminders, CHECK_INTERVAL);

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [reminders, fireReminder]);

  // Request notification permission on mount
  useEffect(() => {
    if (permission === 'default') {
      requestPermission();
    }
  }, [permission, requestPermission]);

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
    const laterMatch = lowerText.includes('later');
    const eveningMatch = lowerText.includes('evening') || lowerText.includes('tonight');
    
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
    } else if (eveningMatch) {
      time.setHours(19, 0, 0, 0);
      if (time < new Date()) {
        time.setDate(time.getDate() + 1);
      }
    } else if (laterMatch) {
      time.setHours(time.getHours() + 1);
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
      .replace(/remind me /gi, '')
      .replace(/in \d+ (minute|hour)s?/gi, '')
      .replace(/at \d{1,2}(:\d{2})?\s*(am|pm)?/gi, '')
      .replace(/tomorrow/gi, '')
      .replace(/later/gi, '')
      .replace(/evening|tonight/gi, '')
      .replace(/every (hour|day|week)/gi, '')
      .replace(/daily|weekly/gi, '')
      .trim();

    if (!title) title = 'Reminder';

    return { title, time, category, repeatPattern, icon };
  }, []);

  // Save reminder to Supabase
  const saveReminderToDb = async (reminder: Reminder): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please log in to save reminders');
        return false;
      }

      const { error } = await supabase
        .from('reminders')
        .insert({
          id: reminder.id,
          user_id: user.id,
          text: reminder.title,
          time: reminder.time.toISOString(),
          active: reminder.isActive,
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Failed to save reminder:', error);
      toast.error('I had trouble setting that. Want me to try again?');
      return false;
    }
  };

  // Update reminder in Supabase
  const updateReminderInDb = async (id: string, updates: { text?: string; time?: string; active?: boolean }): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('reminders')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Failed to update reminder:', error);
      return false;
    }
  };

  // Delete reminder from Supabase
  const deleteReminderFromDb = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('reminders')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Failed to delete reminder:', error);
      return false;
    }
  };

  const addReminder = useCallback(async (reminder: Omit<Reminder, 'id' | 'createdAt' | 'status'>) => {
    const newReminder: Reminder = {
      ...reminder,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      status: 'scheduled',
    };

    // Save to database first
    const saved = await saveReminderToDb(newReminder);
    if (!saved) return null;

    // Add to local state
    setReminders(prev => [...prev, newReminder]);
    
    // Schedule native notification
    if (newReminder.isActive) {
      await scheduleReminderNotification(newReminder);
    }

    // For reminders < 5 minutes, also set a precise client-side timeout
    const timeUntilReminder = newReminder.time.getTime() - Date.now();
    if (timeUntilReminder > 0 && timeUntilReminder < 300000) {
      setTimeout(() => {
        if (!firedRemindersRef.current.has(newReminder.id)) {
          fireReminder(newReminder);
        }
      }, timeUntilReminder);
    }
    
    return newReminder;
  }, [scheduleReminderNotification, fireReminder]);

  const addFromNaturalLanguage = useCallback(async (text: string): Promise<Reminder | null> => {
    const parsed = parseNaturalLanguage(text);
    if (!parsed) return null;

    const reminder = await addReminder({
      title: parsed.title,
      time: parsed.time,
      category: parsed.category,
      icon: parsed.icon,
      repeatPattern: parsed.repeatPattern,
      isActive: true,
    });

    return reminder;
  }, [parseNaturalLanguage, addReminder]);

  const updateReminder = useCallback(async (id: string, updates: Partial<Reminder>) => {
    const reminder = reminders.find(r => r.id === id);
    if (!reminder) return;

    const updatedReminder = { ...reminder, ...updates };
    
    // Update in database
    await updateReminderInDb(id, {
      text: updates.title,
      time: updates.time?.toISOString(),
      active: updates.isActive,
    });
    
    // Reschedule notification if time changed
    if (updates.time || updates.isActive !== undefined) {
      await cancelReminderNotification(id);
      if (updatedReminder.isActive && updatedReminder.status !== 'completed') {
        await scheduleReminderNotification(updatedReminder);
      }
    }
    
    setReminders(prev => 
      prev.map(r => r.id === id ? { ...r, ...updates } : r)
    );
  }, [reminders, scheduleReminderNotification, cancelReminderNotification]);

  const deleteReminder = useCallback(async (id: string) => {
    await cancelReminderNotification(id);
    await deleteReminderFromDb(id);
    firedRemindersRef.current.delete(id);
    setReminders(prev => prev.filter(r => r.id !== id));
  }, [cancelReminderNotification]);

  const snoozeReminder = useCallback(async (id: string, minutes: number) => {
    const snoozedUntil = new Date();
    snoozedUntil.setMinutes(snoozedUntil.getMinutes() + minutes);
    
    const reminder = reminders.find(r => r.id === id);
    if (reminder) {
      const snoozedReminder = { ...reminder, time: snoozedUntil, snoozedUntil, status: 'snoozed' as ReminderStatus };
      await cancelReminderNotification(id);
      await scheduleReminderNotification(snoozedReminder);
      
      // Remove from fired set so it can fire again
      firedRemindersRef.current.delete(id);
    }
    
    await updateReminder(id, { snoozedUntil, status: 'snoozed' });
    setActiveReminder(null);
    
    toast.success(`Snoozed for ${minutes} minutes`);
  }, [reminders, updateReminder, scheduleReminderNotification, cancelReminderNotification]);

  const completeReminder = useCallback(async (id: string) => {
    await cancelReminderNotification(id);
    await updateReminder(id, { completedAt: new Date(), status: 'completed', isActive: false });
    await updateReminderInDb(id, { active: false });
    setActiveReminder(null);
    firedRemindersRef.current.delete(id);
  }, [updateReminder, cancelReminderNotification]);

  const dismissActiveReminder = useCallback(() => {
    setActiveReminder(null);
  }, []);

  const toggleReminder = useCallback(async (id: string) => {
    const reminder = reminders.find(r => r.id === id);
    if (reminder) {
      const newActiveState = !reminder.isActive;
      if (newActiveState) {
        await scheduleReminderNotification(reminder);
        firedRemindersRef.current.delete(id);
      } else {
        await cancelReminderNotification(id);
      }
      await updateReminderInDb(id, { active: newActiveState });
    }
    
    setReminders(prev => 
      prev.map(r => r.id === id ? { ...r, isActive: !r.isActive } : r)
    );
  }, [reminders, scheduleReminderNotification, cancelReminderNotification]);

  // Get time remaining for a reminder
  const getTimeRemaining = useCallback((reminder: Reminder): string => {
    const now = new Date();
    const reminderTime = new Date(reminder.time);
    const diff = reminderTime.getTime() - now.getTime();

    if (diff <= 0) return 'now';

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `in ${days}d`;
    if (hours > 0) return `in ${hours}h`;
    return `in ${minutes}m`;
  }, []);

  return {
    reminders,
    activeReminder,
    isLoading,
    addReminder,
    addFromNaturalLanguage,
    updateReminder,
    deleteReminder,
    snoozeReminder,
    completeReminder,
    dismissActiveReminder,
    toggleReminder,
    parseNaturalLanguage,
    getTimeRemaining,
    refetch: fetchReminders,
  };
};
