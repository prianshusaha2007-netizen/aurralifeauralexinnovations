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

  const sendNotification = useCallback((title: string, body: string, iconEmoji: string) => {
    // Always show toast
    toast(`${iconEmoji} ${title}`, {
      description: body,
      duration: 10000,
    });
    // Try browser notification
    if ('Notification' in window && notificationPermissionRef.current === 'granted') {
      try {
        new Notification(title, { body, icon: '/favicon.jpeg' });
      } catch (e) {
        console.log('Browser notification failed:', e);
      }
    }
  }, []);

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

        // 15 minute warning
        if (startsIn === 15 && !notifiedBlocksRef.current.has(`${notificationKey}-15`)) {
          notifiedBlocksRef.current.add(`${notificationKey}-15`);
          sendNotification(
            `${block.icon} ${block.title} in 15 min`,
            `Get ready! Your ${block.title.toLowerCase()} starts soon.`,
            block.icon
          );
        }

        // 5 minute warning
        if (startsIn === 5 && !notifiedBlocksRef.current.has(`${notificationKey}-5`)) {
          notifiedBlocksRef.current.add(`${notificationKey}-5`);
          sendNotification(
            `${block.icon} ${block.title} in 5 min`,
            `Almost time! ${block.focusModeEnabled ? 'Focus mode will activate.' : 'Prepare to start.'}`,
            block.icon
          );
        }

        // Starting now
        if (startsIn === 0 && !notifiedBlocksRef.current.has(`${notificationKey}-0`)) {
          notifiedBlocksRef.current.add(`${notificationKey}-0`);
          sendNotification(
            `${block.icon} ${block.title} Starting!`,
            `Time to begin your ${block.title.toLowerCase()}.${block.focusModeEnabled ? ' Focus mode is now active.' : ''}`,
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
