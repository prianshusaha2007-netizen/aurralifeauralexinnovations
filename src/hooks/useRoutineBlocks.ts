import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export type RoutineBlockType = 
  | 'morning' 
  | 'study' 
  | 'gym' 
  | 'music' 
  | 'coding' 
  | 'night'
  | 'meal'
  | 'hydration'
  | 'custom';

export interface RoutineBlock {
  id: string;
  type: RoutineBlockType;
  title: string;
  startTime: string;
  endTime: string;
  days: number[]; // 0-6 (Sunday-Saturday)
  isActive: boolean;
  focusModeEnabled: boolean;
  notificationsEnabled: boolean;
  color: string;
  icon: string;
  createdAt: Date;
}

export interface ActiveBlock {
  block: RoutineBlock;
  startedAt: Date;
  remainingMinutes: number;
}

const STORAGE_KEY = 'aurra-routine-blocks';

const DEFAULT_BLOCK_CONFIGS: Record<RoutineBlockType, { color: string; icon: string; title: string }> = {
  morning: { color: 'from-amber-500 to-orange-500', icon: '🌅', title: 'Morning Routine' },
  study: { color: 'from-blue-500 to-cyan-500', icon: '📚', title: 'Study Time' },
  gym: { color: 'from-red-500 to-pink-500', icon: '💪', title: 'Gym / Workout' },
  music: { color: 'from-purple-500 to-violet-500', icon: '🎵', title: 'Music Practice' },
  coding: { color: 'from-green-500 to-emerald-500', icon: '💻', title: 'Coding Time' },
  night: { color: 'from-indigo-500 to-purple-500', icon: '🌙', title: 'Night Wind-Down' },
  meal: { color: 'from-yellow-500 to-amber-500', icon: '🍽️', title: 'Meal Time' },
  hydration: { color: 'from-cyan-500 to-blue-500', icon: '💧', title: 'Hydration Break' },
  custom: { color: 'from-gray-500 to-slate-500', icon: '⭐', title: 'Custom Block' },
};

export const useRoutineBlocks = () => {
  const { user } = useAuth();
  const [blocks, setBlocks] = useState<RoutineBlock[]>([]);
  const [activeBlock, setActiveBlock] = useState<ActiveBlock | null>(null);
  const [focusModeActive, setFocusModeActive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load blocks from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setBlocks(parsed.map((b: any) => ({
          ...b,
          createdAt: new Date(b.createdAt)
        })));
      } catch (e) {
        console.error('Failed to parse routine blocks:', e);
      }
    }
    setIsLoading(false);
  }, []);

  // Save blocks to localStorage
  useEffect(() => {
    if (blocks.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(blocks));
    }
  }, [blocks]);

  // Check for active blocks
  useEffect(() => {
    const checkActiveBlock = () => {
      const now = new Date();
      const currentDay = now.getDay();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      
      for (const block of blocks) {
        if (!block.isActive) continue;
        if (!block.days.includes(currentDay)) continue;
        
        if (currentTime >= block.startTime && currentTime <= block.endTime) {
          const [endHour, endMin] = block.endTime.split(':').map(Number);
          const endDate = new Date();
          endDate.setHours(endHour, endMin, 0, 0);
          const remainingMinutes = Math.max(0, Math.floor((endDate.getTime() - now.getTime()) / 60000));
          
          setActiveBlock({
            block,
            startedAt: new Date(),
            remainingMinutes
          });
          
          if (block.focusModeEnabled) {
            setFocusModeActive(true);
          }
          return;
        }
      }
      
      setActiveBlock(null);
      setFocusModeActive(false);
    };

    checkActiveBlock();
    const interval = setInterval(checkActiveBlock, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [blocks]);

  const getBlockConfig = useCallback((type: RoutineBlockType) => {
    return DEFAULT_BLOCK_CONFIGS[type];
  }, []);

  const addBlock = useCallback((block: Omit<RoutineBlock, 'id' | 'createdAt'>) => {
    const newBlock: RoutineBlock = {
      ...block,
      id: crypto.randomUUID(),
      createdAt: new Date()
    };
    setBlocks(prev => [...prev, newBlock]);
    toast.success('Routine block added');
    return newBlock;
  }, []);

  const updateBlock = useCallback((id: string, updates: Partial<RoutineBlock>) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
  }, []);

  const deleteBlock = useCallback((id: string) => {
    setBlocks(prev => prev.filter(b => b.id !== id));
    toast.success('Block removed');
  }, []);

  const toggleBlockActive = useCallback((id: string) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, isActive: !b.isActive } : b));
  }, []);

  const startFocusMode = useCallback(() => {
    setFocusModeActive(true);
  }, []);

  const endFocusMode = useCallback(() => {
    setFocusModeActive(false);
  }, []);

  const createDefaultBlocks = useCallback(() => {
    const defaultBlocks: Omit<RoutineBlock, 'id' | 'createdAt'>[] = [
      {
        type: 'morning',
        title: 'Morning Routine',
        startTime: '06:00',
        endTime: '07:00',
        days: [0, 1, 2, 3, 4, 5, 6],
        isActive: true,
        focusModeEnabled: false,
        notificationsEnabled: true,
        color: DEFAULT_BLOCK_CONFIGS.morning.color,
        icon: DEFAULT_BLOCK_CONFIGS.morning.icon,
      },
      {
        type: 'study',
        title: 'Study Time',
        startTime: '16:30',
        endTime: '18:30',
        days: [1, 2, 3, 4, 5],
        isActive: true,
        focusModeEnabled: true,
        notificationsEnabled: true,
        color: DEFAULT_BLOCK_CONFIGS.study.color,
        icon: DEFAULT_BLOCK_CONFIGS.study.icon,
      },
      {
        type: 'gym',
        title: 'Gym / Workout',
        startTime: '18:00',
        endTime: '19:30',
        days: [1, 3, 5],
        isActive: true,
        focusModeEnabled: false,
        notificationsEnabled: true,
        color: DEFAULT_BLOCK_CONFIGS.gym.color,
        icon: DEFAULT_BLOCK_CONFIGS.gym.icon,
      },
      {
        type: 'coding',
        title: 'Coding Time',
        startTime: '21:00',
        endTime: '23:00',
        days: [0, 2, 4, 6],
        isActive: true,
        focusModeEnabled: true,
        notificationsEnabled: true,
        color: DEFAULT_BLOCK_CONFIGS.coding.color,
        icon: DEFAULT_BLOCK_CONFIGS.coding.icon,
      },
      {
        type: 'night',
        title: 'Night Wind-Down',
        startTime: '23:30',
        endTime: '00:30',
        days: [0, 1, 2, 3, 4, 5, 6],
        isActive: true,
        focusModeEnabled: false,
        notificationsEnabled: false,
        color: DEFAULT_BLOCK_CONFIGS.night.color,
        icon: DEFAULT_BLOCK_CONFIGS.night.icon,
      },
    ];

    defaultBlocks.forEach(block => addBlock(block));
    toast.success('Default routine created');
  }, [addBlock]);

  return {
    blocks,
    activeBlock,
    focusModeActive,
    isLoading,
    getBlockConfig,
    addBlock,
    updateBlock,
    deleteBlock,
    toggleBlockActive,
    startFocusMode,
    endFocusMode,
    createDefaultBlocks,
    DEFAULT_BLOCK_CONFIGS,
  };
};
