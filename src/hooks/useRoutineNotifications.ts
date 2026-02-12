import { useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { RoutineBlock } from './useRoutineBlocks';

interface UpcomingBlock {
  block: RoutineBlock;
  startsIn: number; // minutes
}

export const useRoutineNotifications = (blocks: RoutineBlock[]) => {
  const notifiedBlocksRef = useRef<Set<string>>(new Set());
  const notificationPermissionRef = useRef<NotificationPermission>('default');

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window) {
      Notification.requestPermission().then(permission => {
        notificationPermissionRef.current = permission;
      });
    }
  }, []);

  const humanizeNotification = useCallback((title: string, body: string): { title: string; body: string } => {
    // Replace robotic language with human-friendly alternatives
    let humanTitle = title
      .replace(/^Reminder:\s*/i, '')
      .replace(/^Alert:\s*/i, '')
      .replace(/^Notification:\s*/i, '');
    
    let humanBody = body
      .replace(/^You have a scheduled/i, 'Just a heads-up —')
      .replace(/^It's time to/i, 'This might be a good time to')
      .replace(/^Don't forget to/i, 'Whenever you\'re ready —')
      .replace(/^You must/i, 'You might want to')
      .replace(/^Complete your/i, 'Your');
    
    return { title: humanTitle, body: humanBody };
  }, []);

  const sendNotification = useCallback((title: string, body: string, iconEmoji: string) => {
    // Humanize the notification text
    const humanized = humanizeNotification(title, body);
    
    // Always show toast with human-friendly language
    toast(`${iconEmoji} ${humanized.title}`, {
      description: humanized.body,
      duration: 10000,
    });
    // Try browser notification
    if ('Notification' in window && notificationPermissionRef.current === 'granted') {
      try {
        new Notification(humanized.title, { body: humanized.body, icon: '/favicon.jpeg' });
      } catch (e) {
        console.log('Browser notification failed:', e);
      }
    }
  }, [humanizeNotification]);

  const getUpcomingBlocks = useCallback((): UpcomingBlock[] => {
    const now = new Date();
    const currentDay = now.getDay();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const upcoming: UpcomingBlock[] = [];

    for (const block of blocks) {
      if (!block.isActive || !block.notificationsEnabled) continue;
      if (!block.days.includes(currentDay)) continue;

      const [startHour, startMin] = block.startTime.split(':').map(Number);
      const blockStartMinutes = startHour * 60 + startMin;
      const startsIn = blockStartMinutes - currentMinutes;

      if (startsIn > 0 && startsIn <= 60) {
        upcoming.push({ block, startsIn });
      }
    }

    return upcoming.sort((a, b) => a.startsIn - b.startsIn);
  }, [blocks]);

  // Check for upcoming blocks and send reminders
  useEffect(() => {
    const checkUpcoming = () => {
      const now = new Date();
      const dateKey = now.toDateString();

      for (const block of blocks) {
        if (!block.isActive || !block.notificationsEnabled) continue;
        if (!block.days.includes(now.getDay())) continue;

        const [startHour, startMin] = block.startTime.split(':').map(Number);
        const blockStartMinutes = startHour * 60 + startMin;
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        const startsIn = blockStartMinutes - currentMinutes;

        const notificationKey = `${block.id}-${dateKey}`;

        // 15 minute warning — gentle heads-up
        if (startsIn === 15 && !notifiedBlocksRef.current.has(`${notificationKey}-15`)) {
          notifiedBlocksRef.current.add(`${notificationKey}-15`);
          sendNotification(
            `${block.icon} ${block.title} soon`,
            `Just a heads-up — ${block.title.toLowerCase()} starts in about 15 minutes.`,
            block.icon
          );
        }

        // 5 minute warning — soft nudge
        if (startsIn === 5 && !notifiedBlocksRef.current.has(`${notificationKey}-5`)) {
          notifiedBlocksRef.current.add(`${notificationKey}-5`);
          sendNotification(
            `${block.icon} ${block.title} in 5`,
            `${block.title} is coming up.${block.focusModeEnabled ? ' I\'ll set up focus mode for you.' : ''}`,
            block.icon
          );
        }

        // Starting now — calm presence
        if (startsIn === 0 && !notifiedBlocksRef.current.has(`${notificationKey}-0`)) {
          notifiedBlocksRef.current.add(`${notificationKey}-0`);
          sendNotification(
            `${block.icon} ${block.title}`,
            `Your ${block.title.toLowerCase()} is starting now.${block.focusModeEnabled ? ' Focus mode is on.' : ' Whenever you\'re ready.'}`,
            block.icon
          );
        }
      }
    };

    checkUpcoming();
    const interval = setInterval(checkUpcoming, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [blocks, sendNotification]);

  // Clear old notification keys daily
  useEffect(() => {
    const clearOldKeys = () => {
      const today = new Date().toDateString();
      const keysToKeep = new Set<string>();
      
      notifiedBlocksRef.current.forEach(key => {
        if (key.includes(today)) {
          keysToKeep.add(key);
        }
      });
      
      notifiedBlocksRef.current = keysToKeep;
    };

    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);
    const msUntilMidnight = midnight.getTime() - Date.now();

    const timeout = setTimeout(() => {
      clearOldKeys();
      setInterval(clearOldKeys, 24 * 60 * 60 * 1000);
    }, msUntilMidnight);

    return () => clearTimeout(timeout);
  }, []);

  return {
    getUpcomingBlocks,
    sendNotification,
  };
};
