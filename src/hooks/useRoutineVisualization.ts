import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface RoutineBlock {
  id: string;
  type: string;
  title: string;
  startTime: string;
  endTime: string;
  icon?: string;
}

interface RoutineVisual {
  imageUrl: string;
  generatedAt: Date;
  blocksCount: number;
  theme: 'light' | 'dark';
}

const STORAGE_KEY = 'aurra-routine-visual';
const CONFIRMATION_PATTERNS = [
  /yes,?\s*finalize/i,
  /this\s+(?:will\s+be|is)\s+my\s+routine/i,
  /fix\s+this\s+routine/i,
  /okay,?\s*let'?s?\s+follow/i,
  /confirm\s+(?:my\s+)?routine/i,
  /lock\s+(?:this|my)\s+routine/i,
  /save\s+(?:this|my)\s+routine/i,
  /finalize\s+(?:this|my)?\s*routine/i,
  /(?:looks?\s+)?good,?\s+(?:let'?s?\s+)?(?:do\s+)?(?:it|this)/i,
  /perfect,?\s+(?:let'?s?\s+)?go\s+with\s+this/i,
  /set\s+(?:this|my)\s+routine/i,
];

export const useRoutineVisualization = () => {
  const [routineVisual, setRoutineVisual] = useState<RoutineVisual | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showVisual, setShowVisual] = useState(false);

  // Load saved visual on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setRoutineVisual({
          ...parsed,
          generatedAt: new Date(parsed.generatedAt)
        });
      } catch {
        // Invalid stored data
      }
    }
  }, []);

  // Detect if a message is a routine confirmation
  const detectRoutineConfirmation = useCallback((message: string): boolean => {
    return CONFIRMATION_PATTERNS.some(pattern => pattern.test(message));
  }, []);

  // Get current theme
  const getCurrentTheme = useCallback((): 'light' | 'dark' => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    }
    return 'light';
  }, []);

  // Generate routine visual
  const generateRoutineVisual = useCallback(async (blocks: RoutineBlock[]): Promise<RoutineVisual | null> => {
    if (blocks.length === 0) {
      console.log('[RoutineVisual] No blocks to visualize');
      return null;
    }

    setIsGenerating(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      const theme = getCurrentTheme();

      // Prepare blocks for the API
      const routineBlocks = blocks.map(block => ({
        title: block.title,
        startTime: block.startTime,
        endTime: block.endTime,
        icon: block.icon,
        type: block.type
      }));

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-routine-visual`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ routineBlocks, theme }),
        }
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        if (response.status === 429) {
          toast.error('Taking a breather... Try again in a moment');
        } else if (response.status === 402) {
          toast.error('Need more credits for visuals');
        }
        throw new Error(error.error || 'Failed to generate visual');
      }

      const data = await response.json();

      const visual: RoutineVisual = {
        imageUrl: data.imageUrl,
        generatedAt: new Date(),
        blocksCount: blocks.length,
        theme
      };

      // Save to localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(visual));
      setRoutineVisual(visual);
      setShowVisual(true);

      return visual;

    } catch (err) {
      console.error('[RoutineVisual] Generation error:', err);
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [getCurrentTheme]);

  // Clear saved visual
  const clearRoutineVisual = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setRoutineVisual(null);
    setShowVisual(false);
  }, []);

  // Dismiss visual display
  const dismissVisual = useCallback(() => {
    setShowVisual(false);
  }, []);

  // Show visual again
  const openVisual = useCallback(() => {
    if (routineVisual) {
      setShowVisual(true);
    }
  }, [routineVisual]);

  // Get a friendly message after generating visual
  const getVisualMessage = useCallback((): string => {
    const messages = [
      "This is how your day looks. Clean and balanced.",
      "Here's your routine — we'll take it one block at a time.",
      "This feels doable. We'll grow into it.",
      "Your day, mapped out. One step at a time.",
      "Simple and clear. That's how we move forward.",
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  }, []);

  return {
    routineVisual,
    isGenerating,
    showVisual,
    detectRoutineConfirmation,
    generateRoutineVisual,
    clearRoutineVisual,
    dismissVisual,
    openVisual,
    getVisualMessage,
  };
};
