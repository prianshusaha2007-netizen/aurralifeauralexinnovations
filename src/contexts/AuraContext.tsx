import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface MemoryPermissions {
  goals: boolean;
  preferences: boolean;
  emotional: boolean;
}

export interface UserProfile {
  name: string;
  age: string;
  gender: string;
  profession: string;
  professions: string[];
  goals: string[];
  languages: string[];
  wakeTime: string;
  sleepTime: string;
  tonePreference: string;
  preferredModel: string;
  onboardingComplete: boolean;
  aiName: string; // Custom name for AURRA
  preferredPersona: string; // companion, mentor, thinking-partner, creative, coach
  responseStyle: string; // short, balanced, detailed
  askBeforeJoking: boolean;
  memoryPermissions: MemoryPermissions;
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
  deleteChatMessage: (id: string) => void;
  clearChatHistory: () => void;
  clearAllMemories: () => void;
  isLoading: boolean;
}

const defaultUserProfile: UserProfile = {
  name: '',
  age: '',
  gender: '',
  profession: '',
  professions: [],
  goals: [],
  languages: [],
  wakeTime: '07:00',
  sleepTime: '23:00',
  tonePreference: 'mixed',
  preferredModel: 'gemini-flash',
  onboardingComplete: false,
  aiName: 'AURRA',
  preferredPersona: 'companion',
  responseStyle: 'balanced',
  askBeforeJoking: true,
  memoryPermissions: {
    goals: true,
    preferences: true,
    emotional: true,
  },
};

const AuraContext = createContext<AuraContextType | undefined>(undefined);

export const AuraProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('aura-theme');
    return (saved as 'light' | 'dark') || 'dark';
  });

  const [userProfile, setUserProfile] = useState<UserProfile>(defaultUserProfile);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [routineBlocks, setRoutineBlocks] = useState<RoutineBlock[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([
    { id: '1', text: 'Drink water 💧', time: '09:00', active: true },
    { id: '2', text: 'Take a short break', time: '11:00', active: true },
    { id: '3', text: 'Lunch time 🍽️', time: '13:00', active: true },
  ]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  // Load profile from database
  useEffect(() => {
    if (!user) {
      setUserProfile(defaultUserProfile);
      setChatMessages([]);
      setIsLoading(false);
      return;
    }

    const loadUserData = async () => {
      setIsLoading(true);
      try {
        // Load profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (profile) {
          // Load AI name and chat settings from localStorage
          const storedAiName = localStorage.getItem('aurra-ai-name') || 'AURRA';
          const storedChatSettings = localStorage.getItem('aurra-chat-settings');
          let chatSettings = {
            preferredPersona: 'companion',
            responseStyle: 'balanced',
            askBeforeJoking: true,
            memoryPermissions: { goals: true, preferences: true, emotional: true },
          };
          if (storedChatSettings) {
            try {
              chatSettings = { ...chatSettings, ...JSON.parse(storedChatSettings) };
            } catch {}
          }
          
          setUserProfile({
            name: profile.name || '',
            age: profile.age?.toString() || '',
            gender: profile.gender || '',
            profession: profile.profession || '',
            professions: (profile as any).professions || [],
            goals: (profile as any).goals || [],
            languages: profile.languages || [],
            wakeTime: profile.wake_time || '07:00',
            sleepTime: profile.sleep_time || '23:00',
            tonePreference: profile.tone_preference || 'mixed',
            preferredModel: (profile as any).preferred_model || 'gemini-flash',
            onboardingComplete: true,
            aiName: storedAiName,
            preferredPersona: chatSettings.preferredPersona,
            responseStyle: chatSettings.responseStyle,
            askBeforeJoking: chatSettings.askBeforeJoking,
            memoryPermissions: chatSettings.memoryPermissions,
          });
        } else {
          setUserProfile(defaultUserProfile);
        }

        // Load chat messages
        const { data: messages } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true });

        if (messages) {
          setChatMessages(
            messages.map((msg) => ({
              id: msg.id,
              content: msg.content,
              sender: msg.sender as 'user' | 'aura',
              timestamp: new Date(msg.created_at),
            }))
          );
        }

        // Load memories from database
        const { data: memoriesData } = await supabase
          .from('memories')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (memoriesData) {
          setMemories(
            memoriesData.map((m) => ({
              id: m.id,
              category: m.category,
              content: m.content,
              createdAt: new Date(m.created_at),
            }))
          );
        }

        // Load routines from database
        const { data: routinesData } = await supabase
          .from('routines')
          .select('*')
          .eq('user_id', user.id)
          .order('time', { ascending: true });

        if (routinesData) {
          setRoutineBlocks(
            routinesData.map((r) => ({
              id: r.id,
              title: r.title,
              time: r.time,
              type: r.type as RoutineBlock['type'],
              completed: r.completed || false,
            }))
          );
        }

        // Load reminders from database
        const { data: remindersData } = await supabase
          .from('reminders')
          .select('*')
          .eq('user_id', user.id)
          .order('time', { ascending: true });

        if (remindersData && remindersData.length > 0) {
          setReminders(
            remindersData.map((r) => ({
              id: r.id,
              text: r.text,
              time: r.time,
              active: r.active ?? true,
            }))
          );
        }

      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, [user]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('aura-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));

  const updateUserProfile = useCallback(
    async (profile: Partial<UserProfile>) => {
      const newProfile = { ...userProfile, ...profile };
      setUserProfile(newProfile);

      if (user && profile.onboardingComplete) {
        try {
          const { error } = await supabase.from('profiles').upsert({
            id: user.id,
            name: newProfile.name,
            age: newProfile.age ? parseInt(newProfile.age) : null,
            gender: newProfile.gender || null,
            profession: newProfile.profession || null,
            professions: newProfile.professions || [],
            goals: newProfile.goals || [],
            languages: newProfile.languages,
            wake_time: newProfile.wakeTime,
            sleep_time: newProfile.sleepTime,
            tone_preference: newProfile.tonePreference,
            preferred_model: newProfile.preferredModel,
          });

          if (error) throw error;
        } catch (error) {
          console.error('Error saving profile:', error);
          toast.error('Could not save profile');
        }
      }
    },
    [user, userProfile]
  );

  const addMemory = useCallback(async (memory: Omit<Memory, 'id' | 'createdAt'>) => {
    const id = crypto.randomUUID();
    const newMemory = { ...memory, id, createdAt: new Date() };
    setMemories((prev) => [newMemory, ...prev]);

    if (user) {
      const { error } = await supabase.from('memories').insert({
        id,
        user_id: user.id,
        category: memory.category,
        content: memory.content,
      });
      if (error) console.error('Error saving memory:', error);
    }
  }, [user]);

  const deleteMemory = useCallback(async (id: string) => {
    setMemories((prev) => prev.filter((m) => m.id !== id));
    
    if (user) {
      const { error } = await supabase.from('memories').delete().eq('id', id);
      if (error) console.error('Error deleting memory:', error);
    }
  }, [user]);

  const addRoutineBlock = useCallback(async (block: Omit<RoutineBlock, 'id'>) => {
    const id = crypto.randomUUID();
    const newBlock = { ...block, id };
    setRoutineBlocks((prev) => [...prev, newBlock]);

    if (user) {
      const { error } = await supabase.from('routines').insert({
        id,
        user_id: user.id,
        title: block.title,
        time: block.time,
        type: block.type,
        completed: block.completed,
      });
      if (error) console.error('Error saving routine:', error);
    }
  }, [user]);

  const toggleRoutineComplete = useCallback(async (id: string) => {
    const block = routineBlocks.find(b => b.id === id);
    if (!block) return;

    const newCompleted = !block.completed;
    setRoutineBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, completed: newCompleted } : b)));

    if (user) {
      const { error } = await supabase.from('routines').update({ completed: newCompleted }).eq('id', id);
      if (error) console.error('Error updating routine:', error);
    }
  }, [user, routineBlocks]);

  const deleteRoutineBlock = useCallback(async (id: string) => {
    setRoutineBlocks((prev) => prev.filter((b) => b.id !== id));

    if (user) {
      const { error } = await supabase.from('routines').delete().eq('id', id);
      if (error) console.error('Error deleting routine:', error);
    }
  }, [user]);

  const addReminder = useCallback(async (reminder: Omit<Reminder, 'id'>) => {
    const id = crypto.randomUUID();
    const newReminder = { ...reminder, id };
    setReminders((prev) => [...prev, newReminder]);

    if (user) {
      const { error } = await supabase.from('reminders').insert({
        id,
        user_id: user.id,
        text: reminder.text,
        time: reminder.time,
        active: reminder.active,
      });
      if (error) console.error('Error saving reminder:', error);
    }
  }, [user]);

  const toggleReminder = useCallback(async (id: string) => {
    const reminder = reminders.find(r => r.id === id);
    if (!reminder) return;

    const newActive = !reminder.active;
    setReminders((prev) => prev.map((r) => (r.id === id ? { ...r, active: newActive } : r)));

    if (user) {
      const { error } = await supabase.from('reminders').update({ active: newActive }).eq('id', id);
      if (error) console.error('Error updating reminder:', error);
    }
  }, [user, reminders]);

  const deleteReminder = useCallback(async (id: string) => {
    setReminders((prev) => prev.filter((r) => r.id !== id));

    if (user) {
      const { error } = await supabase.from('reminders').delete().eq('id', id);
      if (error) console.error('Error deleting reminder:', error);
    }
  }, [user]);

  const addChatMessage = useCallback(
    (message: Omit<ChatMessage, 'id' | 'timestamp'>): string => {
      const id = crypto.randomUUID();
      const timestamp = new Date();
      setChatMessages((prev) => [...prev, { ...message, id, timestamp }]);

      // Save to database
      if (user) {
        supabase
          .from('chat_messages')
          .insert({
            id,
            user_id: user.id,
            content: message.content,
            sender: message.sender,
          })
          .then(({ error }) => {
            if (error) console.error('Error saving message:', error);
          });
      }

      return id;
    },
    [user]
  );

  const updateChatMessage = useCallback(
    (id: string, content: string) => {
      setChatMessages((prev) => prev.map((msg) => (msg.id === id ? { ...msg, content } : msg)));

      // Update in database
      if (user) {
        supabase
          .from('chat_messages')
          .update({ content })
          .eq('id', id)
          .eq('user_id', user.id)
          .then(({ error }) => {
            if (error) console.error('Error updating message:', error);
          });
      }
    },
    [user]
  );

  const deleteChatMessage = useCallback(async (id: string) => {
    setChatMessages((prev) => prev.filter((msg) => msg.id !== id));

    if (user) {
      const { error } = await supabase.from('chat_messages').delete().eq('id', id).eq('user_id', user.id);
      if (error) console.error('Error deleting message:', error);
    }
  }, [user]);

  const clearChatHistory = useCallback(async () => {
    setChatMessages([]);
    if (user) {
      const { error } = await supabase.from('chat_messages').delete().eq('user_id', user.id);
      if (error) console.error('Error clearing messages:', error);
    }
  }, [user]);

  const clearAllMemories = useCallback(async () => {
    setMemories([]);
    if (user) {
      const { error } = await supabase.from('memories').delete().eq('user_id', user.id);
      if (error) console.error('Error clearing memories:', error);
    }
  }, [user]);

  return (
    <AuraContext.Provider
      value={{
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
        deleteChatMessage,
        clearChatHistory,
        clearAllMemories,
        isLoading,
      }}
    >
      {children}
    </AuraContext.Provider>
  );
};

export const useAura = () => {
  const context = useContext(AuraContext);
  if (!context) throw new Error('useAura must be used within AuraProvider');
  return context;
};
