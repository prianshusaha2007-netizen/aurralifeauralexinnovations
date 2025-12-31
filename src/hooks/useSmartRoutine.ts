import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

// Smart routine types with flexibility and motivation awareness
export type RoutineActivityType = 
  | 'study' 
  | 'work' 
  | 'gym' 
  | 'coding' 
  | 'music' 
  | 'content'
  | 'school'
  | 'creative'
  | 'rest'
  | 'custom';

export type FlexibilityLevel = 'fixed' | 'window' | 'alternate' | 'depends';

export type MotivationBlocker = 
  | 'tired' 
  | 'distracted' 
  | 'no_motivation' 
  | 'time_slips' 
  | 'overthinking'
  | 'stress'
  | 'none';

export type MoodLevel = 'low' | 'normal' | 'high';

export interface SmartRoutineBlock {
  id: string;
  name: string;
  type: RoutineActivityType;
  timing: string; // HH:MM or time range
  flexibility: FlexibilityLevel;
  frequency: 'daily' | 'alternate' | 'weekdays' | 'weekends' | 'custom';
  customDays?: number[]; // 0-6 (Sunday-Saturday)
  motivationBlocker?: MotivationBlocker;
  isActive: boolean;
  notificationsEnabled: boolean;
  createdAt: Date;
  lastCompleted?: Date;
  skipCount: number;
  completionCount: number;
}

export interface SmartRoutineSettings {
  wakeTime: string;
  sleepTime: string;
  onboardingComplete: boolean;
  blocks: SmartRoutineBlock[];
  currentMood?: MoodLevel;
  lastMoodCheck?: Date;
}

export interface PendingNudge {
  block: SmartRoutineBlock;
  type: 'upcoming' | 'now' | 'missed';
  message: string;
  scheduledFor: Date;
  dismissed: boolean;
}

const STORAGE_KEY = 'aurra-smart-routine';
const NUDGE_KEY = 'aurra-routine-nudges';

const DEFAULT_ACTIVITY_CONFIG: Record<RoutineActivityType, { icon: string; color: string; label: string }> = {
  study: { icon: '📚', color: 'from-blue-500 to-cyan-500', label: 'Study' },
  work: { icon: '💼', color: 'from-orange-500 to-amber-500', label: 'Work' },
  gym: { icon: '💪', color: 'from-red-500 to-pink-500', label: 'Gym / Workout' },
  coding: { icon: '💻', color: 'from-green-500 to-emerald-500', label: 'Coding' },
  music: { icon: '🎵', color: 'from-purple-500 to-violet-500', label: 'Music / Creative' },
  content: { icon: '🎬', color: 'from-pink-500 to-rose-500', label: 'Content Creation' },
  school: { icon: '🎓', color: 'from-indigo-500 to-blue-500', label: 'School / College' },
  creative: { icon: '🎨', color: 'from-fuchsia-500 to-purple-500', label: 'Creative Work' },
  rest: { icon: '☕', color: 'from-amber-500 to-yellow-500', label: 'Rest / Break' },
  custom: { icon: '⭐', color: 'from-gray-500 to-slate-500', label: 'Custom' },
};

export const useSmartRoutine = () => {
  const [settings, setSettings] = useState<SmartRoutineSettings>({
    wakeTime: '07:00',
    sleepTime: '23:00',
    onboardingComplete: false,
    blocks: [],
  });
  const [pendingNudges, setPendingNudges] = useState<PendingNudge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeNudge, setActiveNudge] = useState<PendingNudge | null>(null);

  // Load settings from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setSettings({
          ...parsed,
          blocks: parsed.blocks?.map((b: any) => ({
            ...b,
            createdAt: new Date(b.createdAt),
            lastCompleted: b.lastCompleted ? new Date(b.lastCompleted) : undefined,
          })) || [],
          lastMoodCheck: parsed.lastMoodCheck ? new Date(parsed.lastMoodCheck) : undefined,
        });
      } catch (e) {
        console.error('Failed to parse smart routine:', e);
      }
    }
    setIsLoading(false);
  }, []);

  // Save settings to localStorage
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    }
  }, [settings, isLoading]);

  // Check for upcoming blocks and generate nudges
  useEffect(() => {
    const checkNudges = () => {
      const now = new Date();
      const currentDay = now.getDay();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const nudges: PendingNudge[] = [];

      for (const block of settings.blocks) {
        if (!block.isActive || !block.notificationsEnabled) continue;

        // Check if block applies today
        const appliesToday = 
          block.frequency === 'daily' ||
          (block.frequency === 'weekdays' && currentDay >= 1 && currentDay <= 5) ||
          (block.frequency === 'weekends' && (currentDay === 0 || currentDay === 6)) ||
          (block.frequency === 'alternate' && currentDay % 2 === 0) ||
          (block.frequency === 'custom' && block.customDays?.includes(currentDay));

        if (!appliesToday) continue;

        const [hours, minutes] = block.timing.split(':').map(Number);
        const blockMinutes = hours * 60 + minutes;
        const diff = blockMinutes - currentMinutes;

        // Generate appropriate nudge
        if (diff > 0 && diff <= 15 && !hasNudgeBeenDismissed(block.id, 'upcoming')) {
          nudges.push({
            block,
            type: 'upcoming',
            message: getSmartNudgeMessage(block, 'upcoming', settings.currentMood),
            scheduledFor: now,
            dismissed: false,
          });
        } else if (diff >= -5 && diff <= 5 && !hasNudgeBeenDismissed(block.id, 'now')) {
          nudges.push({
            block,
            type: 'now',
            message: getSmartNudgeMessage(block, 'now', settings.currentMood),
            scheduledFor: now,
            dismissed: false,
          });
        }
      }

      if (nudges.length > 0 && !activeNudge) {
        setActiveNudge(nudges[0]);
      }
      setPendingNudges(nudges);
    };

    checkNudges();
    const interval = setInterval(checkNudges, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [settings.blocks, settings.currentMood, activeNudge]);

  const hasNudgeBeenDismissed = (blockId: string, type: string): boolean => {
    const today = new Date().toDateString();
    const key = `${NUDGE_KEY}-${blockId}-${type}-${today}`;
    return localStorage.getItem(key) === 'true';
  };

  const markNudgeDismissed = (blockId: string, type: string) => {
    const today = new Date().toDateString();
    const key = `${NUDGE_KEY}-${blockId}-${type}-${today}`;
    localStorage.setItem(key, 'true');
  };

  const getActivityConfig = useCallback((type: RoutineActivityType) => {
    return DEFAULT_ACTIVITY_CONFIG[type];
  }, []);

  // Update wake/sleep times
  const updateSchedule = useCallback((wakeTime: string, sleepTime: string) => {
    setSettings(prev => ({ ...prev, wakeTime, sleepTime }));
  }, []);

  // Add a routine block
  const addBlock = useCallback((block: Omit<SmartRoutineBlock, 'id' | 'createdAt' | 'skipCount' | 'completionCount'>) => {
    const newBlock: SmartRoutineBlock = {
      ...block,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      skipCount: 0,
      completionCount: 0,
    };
    setSettings(prev => ({
      ...prev,
      blocks: [...prev.blocks, newBlock],
    }));
    return newBlock;
  }, []);

  // Update a block
  const updateBlock = useCallback((id: string, updates: Partial<SmartRoutineBlock>) => {
    setSettings(prev => ({
      ...prev,
      blocks: prev.blocks.map(b => b.id === id ? { ...b, ...updates } : b),
    }));
  }, []);

  // Delete a block
  const deleteBlock = useCallback((id: string) => {
    setSettings(prev => ({
      ...prev,
      blocks: prev.blocks.filter(b => b.id !== id),
    }));
  }, []);

  // Complete a block
  const completeBlock = useCallback((id: string) => {
    setSettings(prev => ({
      ...prev,
      blocks: prev.blocks.map(b => 
        b.id === id 
          ? { ...b, lastCompleted: new Date(), completionCount: b.completionCount + 1 }
          : b
      ),
    }));
    toast.success('Nice work! 🎉');
  }, []);

  // Skip a block (no judgement)
  const skipBlock = useCallback((id: string) => {
    setSettings(prev => ({
      ...prev,
      blocks: prev.blocks.map(b => 
        b.id === id 
          ? { ...b, skipCount: b.skipCount + 1 }
          : b
      ),
    }));
    // No negative toast - we respect the decision
  }, []);

  // Shift a block for today
  const shiftBlock = useCallback((id: string, newTime: string) => {
    // Store temporary shift in localStorage for today
    const today = new Date().toDateString();
    const shifts = JSON.parse(localStorage.getItem('aurra-routine-shifts') || '{}');
    shifts[`${id}-${today}`] = newTime;
    localStorage.setItem('aurra-routine-shifts', JSON.stringify(shifts));
    toast('Got it. Shifted for today.', { duration: 2000 });
  }, []);

  // Handle nudge response
  const respondToNudge = useCallback((action: 'start' | 'shift' | 'skip') => {
    if (!activeNudge) return;

    const block = activeNudge.block;
    markNudgeDismissed(block.id, activeNudge.type);

    switch (action) {
      case 'start':
        completeBlock(block.id);
        break;
      case 'skip':
        skipBlock(block.id);
        break;
      case 'shift':
        // User can shift - this would open a time picker
        break;
    }

    setActiveNudge(null);
  }, [activeNudge, completeBlock, skipBlock]);

  // Set current mood
  const setMood = useCallback((mood: MoodLevel) => {
    setSettings(prev => ({
      ...prev,
      currentMood: mood,
      lastMoodCheck: new Date(),
    }));
  }, []);

  // Complete onboarding
  const completeOnboarding = useCallback(() => {
    setSettings(prev => ({ ...prev, onboardingComplete: true }));
  }, []);

  // Get weekly summary (non-judgmental)
  const getWeeklySummary = useCallback(() => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const summary: {
      mostConsistent: SmartRoutineBlock | null;
      needsAttention: SmartRoutineBlock | null;
      totalCompletions: number;
      totalSkips: number;
    } = {
      mostConsistent: null,
      needsAttention: null,
      totalCompletions: 0,
      totalSkips: 0,
    };

    let maxCompletions = 0;
    let maxSkips = 0;

    for (const block of settings.blocks) {
      summary.totalCompletions += block.completionCount;
      summary.totalSkips += block.skipCount;

      if (block.completionCount > maxCompletions) {
        maxCompletions = block.completionCount;
        summary.mostConsistent = block;
      }

      if (block.skipCount > maxSkips && block.skipCount > block.completionCount) {
        maxSkips = block.skipCount;
        summary.needsAttention = block;
      }
    }

    return summary;
  }, [settings.blocks]);

  // Get blocks for today with mood-adjusted suggestions
  const getTodayBlocks = useCallback(() => {
    const now = new Date();
    const currentDay = now.getDay();
    
    return settings.blocks.filter(block => {
      if (!block.isActive) return false;
      
      switch (block.frequency) {
        case 'daily':
          return true;
        case 'weekdays':
          return currentDay >= 1 && currentDay <= 5;
        case 'weekends':
          return currentDay === 0 || currentDay === 6;
        case 'alternate':
          return currentDay % 2 === 0;
        case 'custom':
          return block.customDays?.includes(currentDay);
        default:
          return true;
      }
    }).sort((a, b) => a.timing.localeCompare(b.timing));
  }, [settings.blocks]);

  return {
    settings,
    isLoading,
    activeNudge,
    pendingNudges,
    getActivityConfig,
    updateSchedule,
    addBlock,
    updateBlock,
    deleteBlock,
    completeBlock,
    skipBlock,
    shiftBlock,
    respondToNudge,
    setMood,
    completeOnboarding,
    getWeeklySummary,
    getTodayBlocks,
    DEFAULT_ACTIVITY_CONFIG,
  };
};

// Generate contextual, non-pushy nudge messages
function getSmartNudgeMessage(
  block: SmartRoutineBlock, 
  type: 'upcoming' | 'now' | 'missed',
  mood?: MoodLevel
): string {
  const config = DEFAULT_ACTIVITY_CONFIG[block.type];
  const name = block.name || config.label;

  // Adjust message based on mood
  if (mood === 'low') {
    switch (type) {
      case 'upcoming':
        return `${name} is coming up. Want to keep it light today?`;
      case 'now':
        return `It's around ${name} time. Only if you feel up for it.`;
      default:
        return `Looks like ${name} shifted. That's okay.`;
    }
  }

  // Normal messages - supportive, not commanding
  switch (type) {
    case 'upcoming':
      return `Hey — ${name.toLowerCase()} time's around now.\nWant to start, or shift it a bit?`;
    case 'now':
      return `${config.icon} Ready for ${name.toLowerCase()}?`;
    default:
      return `${name} shifted a bit today. No stress.`;
  }
}
