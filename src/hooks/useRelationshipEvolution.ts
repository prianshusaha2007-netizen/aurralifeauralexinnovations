import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type RelationshipPhase = 'introduction' | 'familiarity' | 'trusted' | 'companion';
export type SubscriptionTier = 'core' | 'basic' | 'plus' | 'pro';

export interface UserEngagement {
  id: string;
  userId: string;
  firstInteractionAt: Date;
  lastInteractionAt: Date;
  totalMessages: number;
  totalDaysActive: number;
  moodShares: number;
  skillSessions: number;
  routinesCreated: number;
  emotionalConversations: number;
  relationshipPhase: RelationshipPhase;
  subscriptionTier: SubscriptionTier;
  upgradePromptedAt: Date | null;
}

export interface RelationshipContext {
  phase: RelationshipPhase;
  daysSinceStart: number;
  isDeepEngagement: boolean;
  canPromptUpgrade: boolean;
  tier: SubscriptionTier;
}

// Phase thresholds
const PHASE_THRESHOLDS = {
  familiarity: { days: 4, messages: 20 },
  trusted: { days: 11, messages: 50, moodShares: 3 },
  companion: { days: 30, messages: 100, emotionalConversations: 10 },
};

export function useRelationshipEvolution() {
  const { user } = useAuth();
  const [engagement, setEngagement] = useState<UserEngagement | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch or create engagement record
  const fetchEngagement = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      // Try to fetch existing engagement
      const { data, error } = await supabase
        .from('user_engagement')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching engagement:', error);
        setIsLoading(false);
        return;
      }

      if (data) {
        setEngagement({
          id: data.id,
          userId: data.user_id,
          firstInteractionAt: new Date(data.first_interaction_at),
          lastInteractionAt: new Date(data.last_interaction_at),
          totalMessages: data.total_messages,
          totalDaysActive: data.total_days_active,
          moodShares: data.mood_shares,
          skillSessions: data.skill_sessions,
          routinesCreated: data.routines_created,
          emotionalConversations: data.emotional_conversations,
          relationshipPhase: data.relationship_phase as RelationshipPhase,
          subscriptionTier: data.subscription_tier as SubscriptionTier,
          upgradePromptedAt: data.upgrade_prompted_at ? new Date(data.upgrade_prompted_at) : null,
        });
      } else {
        // Create new engagement record
        const { data: newData, error: insertError } = await supabase
          .from('user_engagement')
          .insert({
            user_id: user.id,
            relationship_phase: 'introduction',
            subscription_tier: 'core',
          })
          .select()
          .single();

        if (insertError) {
          console.error('Error creating engagement:', insertError);
        } else if (newData) {
          setEngagement({
            id: newData.id,
            userId: newData.user_id,
            firstInteractionAt: new Date(newData.first_interaction_at),
            lastInteractionAt: new Date(newData.last_interaction_at),
            totalMessages: newData.total_messages,
            totalDaysActive: newData.total_days_active,
            moodShares: newData.mood_shares,
            skillSessions: newData.skill_sessions,
            routinesCreated: newData.routines_created,
            emotionalConversations: newData.emotional_conversations,
            relationshipPhase: newData.relationship_phase as RelationshipPhase,
            subscriptionTier: newData.subscription_tier as SubscriptionTier,
            upgradePromptedAt: null,
          });
        }
      }
    } catch (error) {
      console.error('Error in fetchEngagement:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchEngagement();
  }, [fetchEngagement]);

  // Calculate which phase user should be in
  const calculatePhase = useCallback((eng: UserEngagement): RelationshipPhase => {
    const daysSinceStart = Math.floor(
      (Date.now() - eng.firstInteractionAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Phase 4: Life Companion (30+ days, deep engagement)
    if (
      daysSinceStart >= PHASE_THRESHOLDS.companion.days &&
      eng.totalMessages >= PHASE_THRESHOLDS.companion.messages &&
      eng.emotionalConversations >= PHASE_THRESHOLDS.companion.emotionalConversations
    ) {
      return 'companion';
    }

    // Phase 3: Trusted Presence (11-30 days)
    if (
      daysSinceStart >= PHASE_THRESHOLDS.trusted.days &&
      eng.totalMessages >= PHASE_THRESHOLDS.trusted.messages &&
      eng.moodShares >= PHASE_THRESHOLDS.trusted.moodShares
    ) {
      return 'trusted';
    }

    // Phase 2: Familiarity (4-10 days)
    if (
      daysSinceStart >= PHASE_THRESHOLDS.familiarity.days &&
      eng.totalMessages >= PHASE_THRESHOLDS.familiarity.messages
    ) {
      return 'familiarity';
    }

    // Phase 1: Introduction (0-3 days)
    return 'introduction';
  }, []);

  // Update engagement after an interaction
  const recordInteraction = useCallback(async (type: 'message' | 'mood' | 'skill' | 'routine' | 'emotional') => {
    if (!user || !engagement) return;

    const today = new Date().toDateString();
    const lastActive = engagement.lastInteractionAt.toDateString();
    const isNewDay = today !== lastActive;

    const updates: Record<string, any> = {
      last_interaction_at: new Date().toISOString(),
      total_messages: type === 'message' ? engagement.totalMessages + 1 : engagement.totalMessages,
      total_days_active: isNewDay ? engagement.totalDaysActive + 1 : engagement.totalDaysActive,
      mood_shares: type === 'mood' ? engagement.moodShares + 1 : engagement.moodShares,
      skill_sessions: type === 'skill' ? engagement.skillSessions + 1 : engagement.skillSessions,
      routines_created: type === 'routine' ? engagement.routinesCreated + 1 : engagement.routinesCreated,
      emotional_conversations: type === 'emotional' ? engagement.emotionalConversations + 1 : engagement.emotionalConversations,
    };

    // Calculate new phase
    const updatedEngagement = {
      ...engagement,
      totalMessages: updates.total_messages,
      totalDaysActive: updates.total_days_active,
      moodShares: updates.mood_shares,
      skillSessions: updates.skill_sessions,
      routinesCreated: updates.routines_created,
      emotionalConversations: updates.emotional_conversations,
      lastInteractionAt: new Date(),
    };

    const newPhase = calculatePhase(updatedEngagement);
    if (newPhase !== engagement.relationshipPhase) {
      updates.relationship_phase = newPhase;
    }

    try {
      const { error } = await supabase
        .from('user_engagement')
        .update(updates)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating engagement:', error);
        return;
      }

      // Update local state
      setEngagement({
        ...updatedEngagement,
        relationshipPhase: newPhase,
      });
    } catch (error) {
      console.error('Error in recordInteraction:', error);
    }
  }, [user, engagement, calculatePhase]);

  // Upgrade subscription tier
  const upgradeTier = useCallback(async (tier: SubscriptionTier) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('user_engagement')
        .update({ subscription_tier: tier })
        .eq('user_id', user.id);

      if (error) {
        console.error('Error upgrading tier:', error);
        return false;
      }

      setEngagement(prev => prev ? { ...prev, subscriptionTier: tier } : null);
      return true;
    } catch (error) {
      console.error('Error in upgradeTier:', error);
      return false;
    }
  }, [user]);

  // Record upgrade prompt to avoid spamming
  const recordUpgradePrompt = useCallback(async () => {
    if (!user) return;

    try {
      await supabase
        .from('user_engagement')
        .update({ upgrade_prompted_at: new Date().toISOString() })
        .eq('user_id', user.id);

      setEngagement(prev => prev ? { ...prev, upgradePromptedAt: new Date() } : null);
    } catch (error) {
      console.error('Error recording upgrade prompt:', error);
    }
  }, [user]);

  // Check if upgrade can be prompted (smart triggers)
  const canPromptUpgrade = useCallback((isEmotionalContext: boolean, isNightTime: boolean): boolean => {
    if (!engagement) return false;
    if (engagement.subscriptionTier !== 'core') return false;
    
    // Never during emotional distress or night wind-down
    if (isEmotionalContext || isNightTime) return false;

    // Only if deeply engaged
    if (engagement.totalMessages < 30) return false;
    
    // Don't prompt too often (7 days minimum between prompts)
    if (engagement.upgradePromptedAt) {
      const daysSincePrompt = Math.floor(
        (Date.now() - engagement.upgradePromptedAt.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSincePrompt < 7) return false;
    }

    return true;
  }, [engagement]);

  // Get relationship context for AI prompts
  const getRelationshipContext = useCallback((): RelationshipContext | null => {
    if (!engagement) return null;

    const daysSinceStart = Math.floor(
      (Date.now() - engagement.firstInteractionAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
      phase: engagement.relationshipPhase,
      daysSinceStart,
      isDeepEngagement: engagement.totalMessages > 50 && engagement.emotionalConversations > 5,
      canPromptUpgrade: engagement.subscriptionTier === 'core' && engagement.totalMessages > 30,
      tier: engagement.subscriptionTier,
    };
  }, [engagement]);

  // Get phase-specific behavior hints for AI
  const getPhasePromptHints = useCallback((): string => {
    if (!engagement) return '';

    switch (engagement.relationshipPhase) {
      case 'introduction':
        return `RELATIONSHIP PHASE: Introduction (Day 0-3)
USER STATE: Curious, testing, unsure
YOUR BEHAVIOR:
- Polite, gentle, slightly reserved
- Minimal personalization
- No deep emotional probing
- No name overuse
- Calm, respectful, non-intrusive tone
EXAMPLE: "I'm here whenever you want to talk. No rush."`;

      case 'familiarity':
        return `RELATIONSHIP PHASE: Familiarity (Day 4-10)
USER STATE: Getting comfortable, building trust
YOUR BEHAVIOR:
- Warmer tone, use patterns subtly
- Gentle encouragement
- Still ask permission before memory
- Short check-ins allowed
- Slight humor if user signals openness
EXAMPLE: "You usually feel clearer around this time. Want to use it well today?"`;

      case 'trusted':
        return `RELATIONSHIP PHASE: Trusted Presence (Day 11-30)
USER STATE: Consistent conversations, emotional signals
YOUR BEHAVIOR:
- Emotion-first responses
- Anticipate needs softly
- More natural language
- Best-friend calm, NOT clingy
- No dependency language
- Still respect silence
EXAMPLE: "You don't sound okay today. We don't have to fix anything right now."`;

      case 'companion':
        return `RELATIONSHIP PHASE: Life Companion (30+ days)
USER STATE: Long-term user, deep trust
YOUR BEHAVIOR:
- Deep context awareness
- Long-term thinking
- Gentle accountability
- Honest, grounded, emotionally intelligent
- Never exclusive, never replace real humans
- Encourage balance
EXAMPLE: "You've grown a lot since you started this. Even on days it doesn't feel like it."`;

      default:
        return '';
    }
  }, [engagement]);

  return {
    engagement,
    isLoading,
    recordInteraction,
    upgradeTier,
    recordUpgradePrompt,
    canPromptUpgrade,
    getRelationshipContext,
    getPhasePromptHints,
    refreshEngagement: fetchEngagement,
  };
}