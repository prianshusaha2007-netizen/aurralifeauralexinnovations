import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Conversational Memory Editing for AURRA
 * 
 * Handles natural language commands to edit, delete, or query memories.
 * Users can say things like:
 * - "That's not true anymore"
 * - "Forget that"
 * - "I don't do that now"
 * - "Update my goal"
 * - "What do you remember about me?"
 */

interface MemoryEditResult {
  handled: boolean;
  response: string;
  action?: 'delete' | 'update' | 'list' | 'correct';
}

// Patterns for memory editing via natural conversation
const FORGET_PATTERNS = [
  /(?:forget|delete|remove)\s+(?:that|this|about\s+)?(.+)/i,
  /(?:don'?t|do\s+not)\s+remember\s+(?:that|this|about\s+)?(.+)/i,
  /(?:erase|clear)\s+(?:that|this|the\s+)?(?:memory\s+(?:about|of)\s+)?(.+)/i,
  /(?:that'?s?\s+)?(?:not\s+true|wrong|incorrect|outdated)\s*(?:anymore|now)?/i,
  /(?:i\s+)?(?:don'?t|no\s+longer|stopped?)\s+(?:do|doing|have|like|want)\s+(?:that|this|it)\s*(?:anymore|now)?/i,
];

const CORRECTION_PATTERNS = [
  /(?:actually|now)\s+(?:i|my)\s+(.+)/i,
  /(?:i\s+)?(?:don'?t|no\s+longer)\s+(.+?)(?:\s+anymore|\s+now)?$/i,
  /(?:that'?s?\s+)?(?:changed|different)\s+now/i,
  /(?:update|change)\s+(?:that|this|what\s+you\s+know)\s+(?:about\s+)?(.+)/i,
  /(?:i\s+)?stopped?\s+(.+)/i,
  /(?:i\s+)?(?:quit|quitting|gave\s+up)\s+(.+)/i,
];

const LIST_PATTERNS = [
  /(?:what|show)\s+(?:do\s+you|all)\s+(?:remember|know)\s+(?:about\s+me)?/i,
  /(?:list|show)\s+(?:my\s+)?(?:all\s+)?memories/i,
  /what\s+do\s+you\s+(?:know|remember)\s+about\s+(?:me|my\s+(.+))/i,
  /(?:do\s+you\s+)?remember\s+(?:anything\s+)?about\s+(?:me|my\s+(.+))/i,
];

export const useConversationalMemory = () => {
  const [isProcessing, setIsProcessing] = useState(false);

  const detectMemoryEditIntent = useCallback((message: string): {
    type: 'forget' | 'correct' | 'list' | null;
    subject?: string;
  } => {
    const lowerMessage = message.toLowerCase().trim();

    // Check forget patterns
    for (const pattern of FORGET_PATTERNS) {
      const match = lowerMessage.match(pattern);
      if (match) {
        return { type: 'forget', subject: match[1]?.trim() };
      }
    }

    // Check correction patterns
    for (const pattern of CORRECTION_PATTERNS) {
      const match = lowerMessage.match(pattern);
      if (match) {
        return { type: 'correct', subject: match[1]?.trim() };
      }
    }

    // Check list patterns
    for (const pattern of LIST_PATTERNS) {
      const match = lowerMessage.match(pattern);
      if (match) {
        return { type: 'list', subject: match[1]?.trim() };
      }
    }

    return { type: null };
  }, []);

  const handleMemoryEdit = useCallback(async (
    message: string,
    lastAuraMessage?: string
  ): Promise<MemoryEditResult> => {
    const intent = detectMemoryEditIntent(message);
    if (!intent.type) return { handled: false, response: '' };

    setIsProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { handled: false, response: '' };

      if (intent.type === 'forget') {
        return await handleForget(user.id, intent.subject, lastAuraMessage);
      }

      if (intent.type === 'correct') {
        return await handleCorrection(user.id, message, intent.subject);
      }

      if (intent.type === 'list') {
        return await handleList(user.id, intent.subject);
      }

      return { handled: false, response: '' };
    } catch (error) {
      console.error('[ConversationalMemory] Error:', error);
      return { handled: false, response: '' };
    } finally {
      setIsProcessing(false);
    }
  }, [detectMemoryEditIntent]);

  return { handleMemoryEdit, isProcessing };
};

// --- Handler functions ---

async function handleForget(
  userId: string,
  subject?: string,
  lastAuraMessage?: string
): Promise<MemoryEditResult> {
  // Find matching memories
  let query = supabase
    .from('life_memories')
    .select('id, title, content, memory_type')
    .eq('user_id', userId);

  if (subject) {
    query = query.or(`title.ilike.%${subject}%,content.ilike.%${subject}%`);
  }

  const { data: memories } = await query.limit(5);

  if (!memories || memories.length === 0) {
    // Also check the simpler 'memories' table
    const { data: simpleMemories } = await supabase
      .from('memories')
      .select('id, category, content')
      .eq('user_id', userId)
      .or(subject ? `category.ilike.%${subject}%,content.ilike.%${subject}%` : 'id.neq.null')
      .limit(5);

    if (simpleMemories && simpleMemories.length > 0) {
      const ids = simpleMemories.map(m => m.id);
      await supabase.from('memories').delete().in('id', ids);
      return {
        handled: true,
        response: "Got it. I've updated that.",
        action: 'delete',
      };
    }

    return {
      handled: true,
      response: "I don't think I have that saved. But I'll keep it in mind going forward.",
      action: 'delete',
    };
  }

  // Delete matching life memories
  const ids = memories.map(m => m.id);
  await supabase.from('life_memories').delete().in('id', ids);

  return {
    handled: true,
    response: "Got it. I've updated that.",
    action: 'delete',
  };
}

async function handleCorrection(
  userId: string,
  fullMessage: string,
  subject?: string
): Promise<MemoryEditResult> {
  if (!subject) {
    return {
      handled: true,
      response: "Okay, I'll keep that in mind.",
      action: 'correct',
    };
  }

  // Find related memories to update
  const { data: memories } = await supabase
    .from('life_memories')
    .select('id, title, content, memory_type')
    .eq('user_id', userId)
    .or(`title.ilike.%${subject}%,content.ilike.%${subject}%`)
    .limit(3);

  if (memories && memories.length > 0) {
    // Update existing memory with the correction
    await supabase
      .from('life_memories')
      .update({
        content: fullMessage,
        updated_at: new Date().toISOString(),
      })
      .eq('id', memories[0].id);

    return {
      handled: true,
      response: "Got it. I'll remember that instead.",
      action: 'update',
    };
  }

  // No existing memory found — save as new memory
  await supabase.from('life_memories').insert({
    user_id: userId,
    memory_type: 'preference',
    title: `Correction: ${subject.slice(0, 50)}`,
    content: fullMessage,
    importance_score: 7,
    metadata: {},
  });

  return {
    handled: true,
    response: "Okay, noted.",
    action: 'update',
  };
}

async function handleList(
  userId: string,
  category?: string
): Promise<MemoryEditResult> {
  let query = supabase
    .from('life_memories')
    .select('memory_type, title, content')
    .eq('user_id', userId)
    .order('importance_score', { ascending: false })
    .limit(10);

  if (category) {
    query = query.or(`memory_type.ilike.%${category}%,title.ilike.%${category}%,content.ilike.%${category}%`);
  }

  const { data: memories } = await query;

  if (!memories || memories.length === 0) {
    return {
      handled: true,
      response: category
        ? `I don't have anything saved about "${category}" yet. Just mention things naturally and I'll pick them up.`
        : "I'm still getting to know you. The more we talk, the more I'll remember about your life, preferences, and patterns.",
      action: 'list',
    };
  }

  // Format memories naturally
  const grouped: Record<string, string[]> = {};
  memories.forEach(m => {
    const type = m.memory_type || 'other';
    if (!grouped[type]) grouped[type] = [];
    grouped[type].push(m.content);
  });

  const typeLabels: Record<string, string> = {
    goal: '🎯 Goals',
    habit: '🔄 Habits',
    preference: '💭 Preferences',
    relationship: '👥 People',
    person: '👤 About you',
    decision: '✅ Decisions',
    emotional_pattern: '💛 Patterns',
    routine: '📅 Routines',
  };

  let response = "Here's what I remember:\n\n";
  for (const [type, items] of Object.entries(grouped)) {
    const label = typeLabels[type] || `📌 ${type}`;
    response += `${label}\n`;
    items.forEach(item => {
      response += `• ${item}\n`;
    });
    response += '\n';
  }
  response += "You can always tell me to forget or update anything.";

  return {
    handled: true,
    response,
    action: 'list',
  };
}
