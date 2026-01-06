import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { useMentorship } from './useMentorship';

interface MentorshipNotification {
  id: string;
  type: 'follow_up' | 'session_reminder' | 'streak_warning' | 'encouragement' | 'reflection';
  title: string;
  body: string;
  role?: string;
  scheduledFor: Date;
  sent: boolean;
}

const STORAGE_KEY = 'aurra-mentorship-notifications';

// Contextual message templates based on mentorship role
const NOTIFICATION_TEMPLATES = {
  student: {
    follow_up: [
      "Still studying? Take a quick break if needed 📚",
      "How's the session going? I'm here if you need help.",
      "You've been at it for a while — doing great!"
    ],
    session_reminder: [
      "Ready for today's study session?",
      "Your focused study time is coming up ✨",
      "Time to dive into learning — you've got this!"
    ],
    streak_warning: [
      "Don't forget to keep your study streak alive today!",
      "One quick session keeps the momentum going 📈"
    ],
    encouragement: [
      "You're building something amazing — one session at a time.",
      "Consistency is key. You're doing great!",
      "Every session counts. Keep going! 💪"
    ],
    reflection: [
      "Before you wrap up — how did today's studying feel?",
      "What was one thing you learned today?"
    ]
  },
  trainer: {
    follow_up: [
      "How's the workout going? Remember to stay hydrated! 💧",
      "Taking it steady today? That's smart training.",
      "Still in session? Listen to your body."
    ],
    session_reminder: [
      "Time to move! Your training session awaits 🏋️",
      "Ready to crush today's workout?",
      "Your body is ready — let's do this!"
    ],
    streak_warning: [
      "Even a light session counts — don't break your streak!",
      "Recovery day? Active rest still keeps you on track."
    ],
    encouragement: [
      "Every rep is progress. You're getting stronger!",
      "Discipline is doing it even when you don't feel like it.",
      "Your future self will thank you for today's effort."
    ],
    reflection: [
      "How did today's session feel? Any wins to celebrate?",
      "Rate your energy today — high, medium, or low?"
    ]
  },
  learner: {
    follow_up: [
      "Making progress? Don't hesitate to ask for help!",
      "Still practicing? You're building real skills.",
      "How's the learning session going?"
    ],
    session_reminder: [
      "Time to practice! Skills grow with repetition 🎯",
      "Your practice session is calling.",
      "Ready to level up your skills today?"
    ],
    streak_warning: [
      "Keep your practice streak alive — even 15 minutes helps!",
      "One session today keeps your momentum going."
    ],
    encouragement: [
      "Mastery takes time. You're on the right path!",
      "Every mistake is a learning opportunity.",
      "You're building something valuable — keep at it!"
    ],
    reflection: [
      "What clicked for you today?",
      "Any breakthroughs or challenges to share?"
    ]
  },
  default: {
    follow_up: [
      "Still there? Just checking in 🙂",
      "How's it going? I'm here if you need anything."
    ],
    session_reminder: [
      "Time for your session!",
      "Ready to make progress today?"
    ],
    streak_warning: [
      "Keep your streak going — you've got this!"
    ],
    encouragement: [
      "You're doing great! Keep up the good work.",
      "Small steps lead to big changes."
    ],
    reflection: [
      "How was today? Anything on your mind?"
    ]
  }
};

export const useMentorshipNotifications = () => {
  const { profile, isInQuietHours, shouldSendFollowUp, updateLastCheckin } = useMentorship();
  const [notifications, setNotifications] = useState<MentorshipNotification[]>([]);
  const [lastNotificationTime, setLastNotificationTime] = useState<Date | null>(null);

  // Load notifications from storage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setNotifications(parsed.notifications || []);
        setLastNotificationTime(parsed.lastTime ? new Date(parsed.lastTime) : null);
      } catch (e) {
        console.error('Error loading mentorship notifications:', e);
      }
    }
  }, []);

  // Save to storage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      notifications,
      lastTime: lastNotificationTime?.toISOString()
    }));
  }, [notifications, lastNotificationTime]);

  // Get appropriate template based on role
  const getTemplate = useCallback((type: keyof typeof NOTIFICATION_TEMPLATES['default']): string => {
    const role = profile.role_types[0] || 'default';
    const templates = NOTIFICATION_TEMPLATES[role as keyof typeof NOTIFICATION_TEMPLATES] || NOTIFICATION_TEMPLATES.default;
    const options = templates[type] || NOTIFICATION_TEMPLATES.default[type];
    return options[Math.floor(Math.random() * options.length)];
  }, [profile.role_types]);

  // Check if we can send a notification
  const canSendNotification = useCallback((): boolean => {
    // Respect quiet hours
    if (isInQuietHours()) return false;

    // Respect "only if user messages first"
    if (profile.only_if_user_messages_first) return false;

    // Rate limit: max 1 notification per hour
    if (lastNotificationTime) {
      const hoursSinceLast = (Date.now() - lastNotificationTime.getTime()) / (1000 * 60 * 60);
      if (hoursSinceLast < 1) return false;
    }

    return true;
  }, [isInQuietHours, profile.only_if_user_messages_first, lastNotificationTime]);

  // Send a gentle notification
  const sendNotification = useCallback((
    type: MentorshipNotification['type'],
    customMessage?: string
  ): boolean => {
    if (!canSendNotification()) return false;

    const message = customMessage || getTemplate(type);
    
    // Use gentle toast notification (not system notification)
    toast(message, {
      duration: 5000,
      position: 'top-center',
    });

    const notification: MentorshipNotification = {
      id: crypto.randomUUID(),
      type,
      title: profile.role_types[0] || 'AURRA',
      body: message,
      role: profile.role_types[0],
      scheduledFor: new Date(),
      sent: true
    };

    setNotifications(prev => [...prev.slice(-50), notification]);
    setLastNotificationTime(new Date());
    updateLastCheckin();

    return true;
  }, [canSendNotification, getTemplate, profile.role_types, updateLastCheckin]);

  // Schedule a follow-up
  const scheduleFollowUp = useCallback((delayMinutes: number = 60) => {
    if (!profile.follow_up_enabled) return null;

    const scheduledFor = new Date();
    scheduledFor.setMinutes(scheduledFor.getMinutes() + delayMinutes);

    const notification: MentorshipNotification = {
      id: crypto.randomUUID(),
      type: 'follow_up',
      title: 'Check-in',
      body: getTemplate('follow_up'),
      role: profile.role_types[0],
      scheduledFor,
      sent: false
    };

    setNotifications(prev => [...prev, notification]);
    return notification;
  }, [profile.follow_up_enabled, profile.role_types, getTemplate]);

  // Send contextual encouragement
  const sendEncouragement = useCallback(() => {
    return sendNotification('encouragement');
  }, [sendNotification]);

  // Send reflection prompt
  const sendReflectionPrompt = useCallback(() => {
    return sendNotification('reflection');
  }, [sendNotification]);

  // Send session reminder
  const sendSessionReminder = useCallback((skillName?: string) => {
    const customMessage = skillName 
      ? `Time for ${skillName}! Ready to make progress?`
      : undefined;
    return sendNotification('session_reminder', customMessage);
  }, [sendNotification]);

  // Send streak warning
  const sendStreakWarning = useCallback((skillName: string, currentStreak: number) => {
    const message = currentStreak > 3
      ? `You're on a ${currentStreak} day streak for ${skillName}! Don't let it end today.`
      : getTemplate('streak_warning');
    return sendNotification('streak_warning', message);
  }, [sendNotification, getTemplate]);

  // Check and send scheduled notifications
  useEffect(() => {
    const checkScheduled = () => {
      const now = new Date();
      
      notifications.forEach(notification => {
        if (notification.sent) return;
        if (new Date(notification.scheduledFor) <= now) {
          if (canSendNotification()) {
            toast(notification.body, {
              duration: 5000,
              position: 'top-center',
            });
            setNotifications(prev => 
              prev.map(n => n.id === notification.id ? { ...n, sent: true } : n)
            );
            setLastNotificationTime(new Date());
          }
        }
      });
    };

    const interval = setInterval(checkScheduled, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [notifications, canSendNotification]);

  // Cleanup old notifications
  useEffect(() => {
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    setNotifications(prev => 
      prev.filter(n => new Date(n.scheduledFor).getTime() > oneWeekAgo)
    );
  }, []);

  return {
    notifications,
    canSendNotification,
    sendNotification,
    scheduleFollowUp,
    sendEncouragement,
    sendReflectionPrompt,
    sendSessionReminder,
    sendStreakWarning,
    isQuietHours: isInQuietHours,
  };
};
