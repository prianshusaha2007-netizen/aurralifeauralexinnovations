import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Passive Routine Learning for AURRA
 * 
 * Detects routine signals from casual conversation and suggests saving them.
 * Does NOT force routine creation — always asks first.
 * 
 * Example:
 * User: "I wake up late these days"
 * → AURRA detects a wake-up pattern signal
 * → After 2-3 mentions, suggests: "It sounds like you usually wake up late. Want me to remember that?"
 */

interface RoutineSignal {
  type: 'wake' | 'sleep' | 'exercise' | 'study' | 'work' | 'meal' | 'habit';
  content: string;
  detectedAt: number;
}

interface PendingRoutineSuggestion {
  type: string;
  suggestion: string;
  signals: RoutineSignal[];
}

const ROUTINE_PATTERNS: { type: RoutineSignal['type']; patterns: RegExp[] }[] = [
  {
    type: 'wake',
    patterns: [
      /(?:i\s+)?(?:wake|woke|get)\s+up\s+(?:at\s+)?(\d{1,2}(?::\d{2})?\s*(?:am|pm)?|late|early)/i,
      /(?:morning|subah)\s+(?:mein|me)\s+(\d{1,2}|late|early)/i,
      /(?:i\s+)?(?:usually|always|generally)\s+(?:wake|get)\s+up/i,
    ],
  },
  {
    type: 'sleep',
    patterns: [
      /(?:i\s+)?(?:sleep|go\s+to\s+(?:bed|sleep))\s+(?:at\s+)?(\d{1,2}(?::\d{2})?\s*(?:am|pm)?|late|early)/i,
      /(?:i\s+)?(?:usually|always)\s+(?:sleep|go\s+to\s+bed)/i,
      /(?:raat|night)\s+(?:ko|mein)\s+(\d{1,2}|late|early)/i,
    ],
  },
  {
    type: 'exercise',
    patterns: [
      /(?:i\s+)?(?:go\s+to\s+(?:the\s+)?gym|work\s*out|exercise|run|jog)\s+(?:every|daily|in\s+the\s+)?/i,
      /(?:gym|workout|exercise)\s+(?:karta|karti|karta\s+hun)/i,
      /(?:i\s+)?(?:usually|always|every\s+day)\s+(?:exercise|work\s*out|run)/i,
    ],
  },
  {
    type: 'study',
    patterns: [
      /(?:i\s+)?(?:study|padhai|read)\s+(?:every|daily|in\s+the\s+|at\s+)?/i,
      /(?:i\s+)?(?:usually|always)\s+(?:study|read|learn)/i,
      /(?:evening|shaam|raat)\s+(?:ko|mein)\s+(?:padhai|study)/i,
    ],
  },
  {
    type: 'work',
    patterns: [
      /(?:i\s+)?(?:work|office)\s+(?:from|starts?\s+at|till|until)\s+/i,
      /(?:i\s+)?(?:usually|always)\s+(?:start|finish)\s+work/i,
      /(?:my\s+)?(?:work|office)\s+(?:hours?|timing|schedule)/i,
    ],
  },
  {
    type: 'meal',
    patterns: [
      /(?:i\s+)?(?:eat|have)\s+(?:breakfast|lunch|dinner)\s+(?:at|around)\s+/i,
      /(?:i\s+)?(?:usually|always)\s+(?:eat|have\s+(?:breakfast|lunch|dinner))/i,
    ],
  },
  {
    type: 'habit',
    patterns: [
      /(?:every\s+day|daily|regularly|usually|always)\s+(?:i|I)\s+(.+)/i,
      /(?:i'?ve\s+been|been)\s+(.+)\s+(?:every|for\s+\d+)/i,
      /(?:my\s+)?(?:morning|evening|night)\s+routine\s+(?:is|includes)/i,
    ],
  },
];

const SIGNAL_STORAGE_KEY = 'aurra-routine-signals';
const SUGGESTION_THRESHOLD = 2; // Suggest after 2 mentions

export const usePassiveRoutineLearning = () => {
  const [pendingSuggestion, setPendingSuggestion] = useState<PendingRoutineSuggestion | null>(null);
  const signalsRef = useRef<RoutineSignal[]>([]);

  // Initialize from localStorage on mount
  if (signalsRef.current.length === 0) {
    try {
      const stored = localStorage.getItem(SIGNAL_STORAGE_KEY);
      if (stored) signalsRef.current = JSON.parse(stored);
    } catch { /* ignore */ }
  }

  const saveSignals = useCallback((signals: RoutineSignal[]) => {
    // Keep only last 30 days of signals
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const filtered = signals.filter(s => s.detectedAt > thirtyDaysAgo);
    localStorage.setItem(SIGNAL_STORAGE_KEY, JSON.stringify(filtered));
    signalsRef.current = filtered;
  }, []);

  /**
   * Scan a message for routine signals. Returns a suggestion if threshold is met.
   */
  const detectRoutineSignal = useCallback((message: string): string | null => {
    for (const { type, patterns } of ROUTINE_PATTERNS) {
      for (const pattern of patterns) {
        const match = message.match(pattern);
        if (match) {
          const signal: RoutineSignal = {
            type,
            content: message.trim(),
            detectedAt: Date.now(),
          };

          const currentSignals = Array.isArray(signalsRef.current)
            ? signalsRef.current
            : [];
          const updated = [...currentSignals, signal];
          saveSignals(updated);

          // Count signals of this type in last 7 days
          const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
          const recentCount = updated.filter(
            s => s.type === type && s.detectedAt > weekAgo
          ).length;

          if (recentCount >= SUGGESTION_THRESHOLD) {
            const suggestion = generateSuggestion(type, updated.filter(s => s.type === type));
            if (suggestion) {
              setPendingSuggestion({
                type,
                suggestion,
                signals: updated.filter(s => s.type === type),
              });
              return suggestion;
            }
          }

          return null;
        }
      }
    }
    return null;
  }, [saveSignals]);

  /**
   * User confirmed the routine suggestion — save to life_memories
   */
  const confirmRoutineSuggestion = useCallback(async (): Promise<boolean> => {
    if (!pendingSuggestion) return false;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const content = pendingSuggestion.signals
        .map(s => s.content)
        .slice(-3)
        .join('; ');

      await supabase.from('life_memories').insert({
        user_id: user.id,
        memory_type: 'routine',
        title: `Routine: ${pendingSuggestion.type}`,
        content,
        importance_score: 6,
        metadata: { source: 'passive_learning', signalCount: pendingSuggestion.signals.length },
      });

      // Clear signals for this type after saving
      const currentSignals = Array.isArray(signalsRef.current) ? signalsRef.current : [];
      saveSignals(currentSignals.filter(s => s.type !== pendingSuggestion.type));
      setPendingSuggestion(null);
      return true;
    } catch (error) {
      console.error('[PassiveRoutine] Save error:', error);
      return false;
    }
  }, [pendingSuggestion, saveSignals]);

  const dismissSuggestion = useCallback(() => {
    setPendingSuggestion(null);
  }, []);

  return {
    detectRoutineSignal,
    confirmRoutineSuggestion,
    dismissSuggestion,
    pendingSuggestion,
  };
};

function generateSuggestion(type: RoutineSignal['type'], signals: RoutineSignal[]): string | null {
  const labels: Record<string, string> = {
    wake: 'wake-up time',
    sleep: 'sleep schedule',
    exercise: 'workout routine',
    study: 'study habit',
    work: 'work schedule',
    meal: 'meal timing',
    habit: 'daily habit',
  };

  const label = labels[type] || 'routine';

  // Check if we already suggested this recently (within 3 days)
  const lastSuggestionKey = `aurra-routine-suggested-${type}`;
  const lastSuggested = localStorage.getItem(lastSuggestionKey);
  if (lastSuggested) {
    const daysSince = (Date.now() - parseInt(lastSuggested)) / (1000 * 60 * 60 * 24);
    if (daysSince < 3) return null;
  }

  localStorage.setItem(lastSuggestionKey, Date.now().toString());

  return `I've noticed you mentioning your ${label} a few times. Want me to remember that as part of your routine?`;
}
