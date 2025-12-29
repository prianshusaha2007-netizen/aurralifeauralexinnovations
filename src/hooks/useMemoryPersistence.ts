import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Memory types for classification
type MemoryType = 'person' | 'goal' | 'habit' | 'emotional_pattern' | 'decision' | 'preference' | 'routine' | 'relationship';

interface DetectedMemory {
  type: MemoryType;
  title: string;
  content: string;
  importance: number;
  requiresPermission: boolean;
}

// Patterns for detecting important memories from conversations
const MEMORY_PATTERNS = {
  // Identity-level (requires permission)
  person: [
    /my (?:name is|name's) (\w+)/i,
    /(?:i am|i'm) (\w+)/i,
    /call me (\w+)/i,
  ],
  relationship: [
    /my (?:wife|husband|partner|girlfriend|boyfriend|spouse|fiance)/i,
    /my (?:mom|dad|mother|father|parents?|brother|sister|son|daughter)/i,
    /my (?:boss|colleague|friend|best friend)/i,
    /(?:getting (?:married|divorced)|broke up|dating|relationship)/i,
  ],
  
  // Goals and plans (auto-save, medium importance)
  goal: [
    /(?:i want to|i'm trying to|my goal is to|planning to|gonna|going to) (.+)/i,
    /(?:i've been working on|working towards) (.+)/i,
    /(?:my dream is|dream of) (.+)/i,
    /(?:want to become|aspire to be) (.+)/i,
  ],
  
  // Habits and routines (auto-save via repetition)
  habit: [
    /(?:every day|daily|regularly|usually|always) (?:i|I) (.+)/i,
    /(?:i've been|been) (.+) (?:every|for \d+)/i,
    /my (?:morning|evening|night) routine/i,
  ],
  
  // Preferences (auto-save, low importance)
  preference: [
    /(?:i love|i like|i prefer|i enjoy|i hate|i don't like) (.+)/i,
    /(?:favorite|fav|best) (?:thing|is) (.+)/i,
    /(?:allergic to|can't eat|don't eat) (.+)/i,
  ],
  
  // Decisions (context memory)
  decision: [
    /(?:i decided|i've decided|made up my mind) (.+)/i,
    /(?:i chose|i'm choosing|picked) (.+)/i,
    /(?:i quit|i'm quitting|started|i'm starting) (.+)/i,
  ],
  
  // Emotional patterns
  emotional_pattern: [
    /(?:i always feel|i often feel|i get) (?:anxious|stressed|happy|sad|overwhelmed) (?:when|about) (.+)/i,
    /(?:triggers|makes me feel) (.+)/i,
    /(?:struggle with|struggling with) (.+)/i,
  ],
};

// Keywords that indicate high importance
const HIGH_IMPORTANCE_KEYWORDS = [
  'important', 'really', 'very', 'extremely', 'crucial', 'never forget',
  'please remember', 'keep in mind', 'serious', 'life-changing', 'major',
];

// Keywords that suggest user wants AURRA to remember
const REMEMBER_TRIGGERS = [
  'remember', 'don\'t forget', 'keep this in mind', 'note this',
  'yaad rakhna', 'bhoolna mat', 'note kar', 'important hai',
];

export const useMemoryPersistence = () => {
  const [isSaving, setIsSaving] = useState(false);
  const [pendingMemory, setPendingMemory] = useState<DetectedMemory | null>(null);

  // Detect if message contains important memories
  const detectMemories = useCallback((message: string): DetectedMemory[] => {
    const detected: DetectedMemory[] = [];
    const lowerMessage = message.toLowerCase();

    // Check for explicit remember requests
    const hasRememberTrigger = REMEMBER_TRIGGERS.some(t => lowerMessage.includes(t));
    const hasHighImportance = HIGH_IMPORTANCE_KEYWORDS.some(k => lowerMessage.includes(k));

    // Check each memory type
    for (const [type, patterns] of Object.entries(MEMORY_PATTERNS)) {
      for (const pattern of patterns) {
        const match = message.match(pattern);
        if (match) {
          const extractedContent = match[1] || match[0];
          const isIdentityLevel = type === 'person' || type === 'relationship';
          
          let importance = 5; // default
          if (hasHighImportance || hasRememberTrigger) importance = 8;
          if (isIdentityLevel) importance = 9;
          
          detected.push({
            type: type as MemoryType,
            title: generateTitle(type as MemoryType, extractedContent),
            content: extractedContent.trim(),
            importance,
            requiresPermission: isIdentityLevel && !hasRememberTrigger,
          });
          break; // One match per type is enough
        }
      }
    }

    return detected;
  }, []);

  // Generate a title for the memory
  const generateTitle = (type: MemoryType, content: string): string => {
    const shortContent = content.slice(0, 50);
    const titles: Record<MemoryType, string> = {
      person: `About ${shortContent}`,
      relationship: `Relationship: ${shortContent}`,
      goal: `Goal: ${shortContent}`,
      habit: `Habit: ${shortContent}`,
      preference: `Preference: ${shortContent}`,
      decision: `Decision: ${shortContent}`,
      routine: `Routine: ${shortContent}`,
      emotional_pattern: `Pattern: ${shortContent}`,
    };
    return titles[type];
  };

  // Save memory to database
  const saveMemory = useCallback(async (memory: DetectedMemory): Promise<boolean> => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      // Check if similar memory already exists
      const { data: existing } = await supabase
        .from('life_memories')
        .select('id, content')
        .eq('user_id', user.id)
        .eq('memory_type', memory.type)
        .ilike('content', `%${memory.content.slice(0, 30)}%`)
        .limit(1);

      if (existing && existing.length > 0) {
        // Update existing memory with new info
        await supabase
          .from('life_memories')
          .update({
            content: memory.content,
            importance_score: Math.max(memory.importance, (existing[0] as any).importance_score || 5),
            last_referenced_at: new Date().toISOString(),
          })
          .eq('id', existing[0].id);
      } else {
        // Insert new memory
        await supabase
          .from('life_memories')
          .insert({
            user_id: user.id,
            memory_type: memory.type,
            title: memory.title,
            content: memory.content,
            importance_score: memory.importance,
            metadata: {},
          });
      }

      console.log('[Memory] Saved:', memory.type, memory.title);
      return true;
    } catch (error) {
      console.error('[Memory] Save error:', error);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, []);

  // Process a message and auto-save detected memories
  const processMessageForMemories = useCallback(async (message: string): Promise<{
    savedCount: number;
    pendingPermission: DetectedMemory | null;
  }> => {
    const memories = detectMemories(message);
    let savedCount = 0;
    let pendingPermission: DetectedMemory | null = null;

    for (const memory of memories) {
      if (memory.requiresPermission) {
        // Set pending for permission prompt
        pendingPermission = memory;
        setPendingMemory(memory);
      } else {
        // Auto-save without permission
        const saved = await saveMemory(memory);
        if (saved) savedCount++;
      }
    }

    return { savedCount, pendingPermission };
  }, [detectMemories, saveMemory]);

  // Confirm pending memory (after user permission)
  const confirmPendingMemory = useCallback(async (): Promise<boolean> => {
    if (!pendingMemory) return false;
    const saved = await saveMemory(pendingMemory);
    if (saved) setPendingMemory(null);
    return saved;
  }, [pendingMemory, saveMemory]);

  // Dismiss pending memory
  const dismissPendingMemory = useCallback(() => {
    setPendingMemory(null);
  }, []);

  // Get relevant memories for context
  const getRelevantMemories = useCallback(async (query?: string): Promise<string> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return '';

      let queryBuilder = supabase
        .from('life_memories')
        .select('memory_type, title, content, importance_score')
        .eq('user_id', user.id)
        .order('importance_score', { ascending: false })
        .order('last_referenced_at', { ascending: false })
        .limit(15);

      if (query) {
        queryBuilder = queryBuilder.or(`title.ilike.%${query}%,content.ilike.%${query}%`);
      }

      const { data } = await queryBuilder;

      if (!data || data.length === 0) return '';

      let context = '\n[USER MEMORIES - Reference naturally, never mention storage]\n';
      data.forEach(m => {
        context += `- [${m.memory_type}] ${m.content}\n`;
      });

      return context;
    } catch (error) {
      console.error('[Memory] Fetch error:', error);
      return '';
    }
  }, []);

  return {
    detectMemories,
    processMessageForMemories,
    saveMemory,
    confirmPendingMemory,
    dismissPendingMemory,
    getRelevantMemories,
    pendingMemory,
    isSaving,
  };
};
