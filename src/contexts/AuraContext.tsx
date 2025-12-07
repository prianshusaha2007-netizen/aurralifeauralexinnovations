import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface UserProfile {
  name: string;
  age: string;
  gender: string;
  profession: string;
  languages: string[];
  wakeTime: string;
  sleepTime: string;
  tonePreference: string;
  onboardingComplete: boolean;
}

export interface Memory {
  id: string;
  category: string;
  content: string;
  createdAt: Date;
}

export interface RoutineBlock {
  id: string;
  title: string;
  time: string;
  type: 'study' | 'work' | 'rest' | 'sleep' | 'exercise' | 'meal';
  completed: boolean;
}

export interface Reminder {
  id: string;
  text: string;
  time: string;
  active: boolean;
}

export interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'aura';
  timestamp: Date;
  language?: string;
}

interface AuraContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  userProfile: UserProfile;
  updateUserProfile: (profile: Partial<UserProfile>) => void;
  memories: Memory[];
  addMemory: (memory: Omit<Memory, 'id' | 'createdAt'>) => void;
  deleteMemory: (id: string) => void;
  routineBlocks: RoutineBlock[];
  addRoutineBlock: (block: Omit<RoutineBlock, 'id'>) => void;
  toggleRoutineComplete: (id: string) => void;
  deleteRoutineBlock: (id: string) => void;
  reminders: Reminder[];
  addReminder: (reminder: Omit<Reminder, 'id'>) => void;
  toggleReminder: (id: string) => void;
  deleteReminder: (id: string) => void;
  chatMessages: ChatMessage[];
  addChatMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => string;
  updateChatMessage: (id: string, content: string) => void;
  clearChatHistory: () => void;
  clearAllMemories: () => void;
}

const defaultUserProfile: UserProfile = {
  name: '',
  age: '',
  gender: '',
  profession: '',
  languages: [],
  wakeTime: '07:00',
  sleepTime: '23:00',
  tonePreference: 'mixed',
  onboardingComplete: false,
};

const AuraContext = createContext<AuraContextType | undefined>(undefined);

export const AuraProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('aura-theme');
    return (saved as 'light' | 'dark') || 'dark';
  });

  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('aura-user-profile');
    return saved ? JSON.parse(saved) : defaultUserProfile;
  });

  const [memories, setMemories] = useState<Memory[]>(() => {
    const saved = localStorage.getItem('aura-memories');
    return saved ? JSON.parse(saved) : [];
  });

  const [routineBlocks, setRoutineBlocks] = useState<RoutineBlock[]>(() => {
    const saved = localStorage.getItem('aura-routine');
    return saved ? JSON.parse(saved) : [];
  });

  const [reminders, setReminders] = useState<Reminder[]>(() => {
    const saved = localStorage.getItem('aura-reminders');
    return saved ? JSON.parse(saved) : [
      { id: '1', text: 'Drink water 💧', time: '09:00', active: true },
      { id: '2', text: 'Take a short break', time: '11:00', active: true },
      { id: '3', text: 'Lunch time 🍽️', time: '13:00', active: true },
    ];
  });

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('aura-chat');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('aura-theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('aura-user-profile', JSON.stringify(userProfile));
  }, [userProfile]);

  useEffect(() => {
    localStorage.setItem('aura-memories', JSON.stringify(memories));
  }, [memories]);

  useEffect(() => {
    localStorage.setItem('aura-routine', JSON.stringify(routineBlocks));
  }, [routineBlocks]);

  useEffect(() => {
    localStorage.setItem('aura-reminders', JSON.stringify(reminders));
  }, [reminders]);

  useEffect(() => {
    localStorage.setItem('aura-chat', JSON.stringify(chatMessages));
  }, [chatMessages]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  const updateUserProfile = (profile: Partial<UserProfile>) => {
    setUserProfile(prev => ({ ...prev, ...profile }));
  };

  const addMemory = (memory: Omit<Memory, 'id' | 'createdAt'>) => {
    setMemories(prev => [...prev, { ...memory, id: Date.now().toString(), createdAt: new Date() }]);
  };

  const deleteMemory = (id: string) => {
    setMemories(prev => prev.filter(m => m.id !== id));
  };

  const addRoutineBlock = (block: Omit<RoutineBlock, 'id'>) => {
    setRoutineBlocks(prev => [...prev, { ...block, id: Date.now().toString() }]);
  };

  const toggleRoutineComplete = (id: string) => {
    setRoutineBlocks(prev => prev.map(b => b.id === id ? { ...b, completed: !b.completed } : b));
  };

  const deleteRoutineBlock = (id: string) => {
    setRoutineBlocks(prev => prev.filter(b => b.id !== id));
  };

  const addReminder = (reminder: Omit<Reminder, 'id'>) => {
    setReminders(prev => [...prev, { ...reminder, id: Date.now().toString() }]);
  };

  const toggleReminder = (id: string) => {
    setReminders(prev => prev.map(r => r.id === id ? { ...r, active: !r.active } : r));
  };

  const deleteReminder = (id: string) => {
    setReminders(prev => prev.filter(r => r.id !== id));
  };

  const addChatMessage = (message: Omit<ChatMessage, 'id' | 'timestamp'>): string => {
    const id = Date.now().toString();
    setChatMessages(prev => [...prev, { ...message, id, timestamp: new Date() }]);
    return id;
  };

  const updateChatMessage = (id: string, content: string) => {
    setChatMessages(prev => prev.map(msg => 
      msg.id === id ? { ...msg, content } : msg
    ));
  };

  const clearChatHistory = () => setChatMessages([]);

  const clearAllMemories = () => setMemories([]);

  return (
    <AuraContext.Provider value={{
      theme,
      toggleTheme,
      userProfile,
      updateUserProfile,
      memories,
      addMemory,
      deleteMemory,
      routineBlocks,
      addRoutineBlock,
      toggleRoutineComplete,
      deleteRoutineBlock,
      reminders,
      addReminder,
      toggleReminder,
      deleteReminder,
      chatMessages,
      addChatMessage,
      updateChatMessage,
      clearChatHistory,
      clearAllMemories,
    }}>
      {children}
    </AuraContext.Provider>
  );
};

export const useAura = () => {
  const context = useContext(AuraContext);
  if (!context) throw new Error('useAura must be used within AuraProvider');
  return context;
};
