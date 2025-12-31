import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface UserCredits {
  id: string;
  user_id: string;
  is_premium: boolean;
  premium_since: string | null;
  daily_credits_used: number;
  daily_credits_limit: number;
  last_reset_date: string;
}

// Subscription tiers
export type SubscriptionTier = 'core' | 'plus' | 'pro';

// Credit limits per tier per action type (internal only - NEVER shown to user)
export const TIER_LIMITS: Record<SubscriptionTier, {
  normal_chat: number;
  medium_reasoning: number;
  long_reasoning: number;
  skill_session: number;
  voice_reply: number;
  image_tool: number;
  memory_save: number;
  reminders: number;
}> = {
  core: {
    normal_chat: 25,
    medium_reasoning: 5,
    long_reasoning: 0, // Not allowed
    skill_session: 0, // Not allowed
    voice_reply: 0, // Not allowed
    image_tool: 0, // Not allowed
    memory_save: 5,
    reminders: 10,
  },
  plus: {
    normal_chat: 120,
    medium_reasoning: 40,
    long_reasoning: 10,
    skill_session: 10,
    voice_reply: 30,
    image_tool: 10,
    memory_save: 999, // Unlimited
    reminders: 999, // Unlimited
  },
  pro: {
    normal_chat: 300, // Soft cap
    medium_reasoning: 999, // Unlimited
    long_reasoning: 999, // Unlimited
    skill_session: 999, // Unlimited
    voice_reply: 999, // Unlimited
    image_tool: 999, // Unlimited
    memory_save: 999, // Unlimited
    reminders: 999, // Unlimited
  },
};

// Credit costs per action (internal tracking)
export const CREDIT_COSTS = {
  normal_chat: 1,
  medium_reasoning: 2,
  long_reasoning: 3,
  voice_reply: 1,
  skill_session: 1,
  image_tool: 1,
  memory_save: 1,
} as const;

export type CreditAction = keyof typeof CREDIT_COSTS;

export interface CreditStatus {
  isLoading: boolean;
  tier: SubscriptionTier;
  isPremium: boolean;
  usagePercent: number;
  canUseCredits: boolean;
  showSoftWarning: boolean;
  isLimitReached: boolean;
  allowFinalReply: boolean;
  actionAllowed: (action: CreditAction) => boolean;
}

// User-friendly display labels (no numbers!)
export const TIER_DISPLAY = {
  core: {
    conversations: 'Limited',
    skills: 'Not included',
    voiceImages: 'Not included',
    memory: 'Basic',
    description: 'Good for light daily use.',
  },
  plus: {
    conversations: 'Extended',
    skills: 'Included',
    voiceImages: 'Included',
    memory: 'Full',
    description: 'Most people choose this.',
  },
  pro: {
    conversations: 'Unlimited',
    skills: 'Unlimited',
    voiceImages: 'Unlimited',
    memory: 'Advanced',
    description: 'For serious growth.',
  },
};

export function useCredits() {
  const { user } = useAuth();
  const [credits, setCredits] = useState<UserCredits | null>(null);
  const [tier, setTier] = useState<SubscriptionTier>('core');
  const [isLoading, setIsLoading] = useState(true);
  const [finalReplyUsed, setFinalReplyUsed] = useState(false);
  const [actionUsage, setActionUsage] = useState<Record<string, number>>({});
  const [isMounted, setIsMounted] = useState(true);
  const [testUsagePercent, setTestUsagePercent] = useState<number | null>(null); // For testing only

  // Track mount state to prevent updates after unmount
  useEffect(() => {
    setIsMounted(true);
    return () => {
      setIsMounted(false);
    };
  }, []);

  // Fetch user tier from engagement table
  const fetchTier = useCallback(async (mounted: boolean) => {
    if (!user?.id || !mounted) return;
    
    try {
      const { data } = await supabase
        .from('user_engagement')
        .select('subscription_tier')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (mounted && data?.subscription_tier) {
        setTier(data.subscription_tier as SubscriptionTier);
      }
    } catch (err) {
      console.error('Error fetching tier:', err);
    }
  }, [user?.id]);

  // Fetch or create user credits
  const fetchCredits = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    let mounted = true;

    try {
      await fetchTier(mounted);
      
      if (!mounted) return;
      
      const { data, error } = await supabase
        .from('user_credits')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!mounted) return;

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching credits:', error);
        setIsLoading(false);
        return;
      }

      if (data) {
        const today = new Date().toISOString().split('T')[0];
        if (data.last_reset_date !== today) {
          const { data: updated, error: updateError } = await supabase
            .from('user_credits')
            .update({
              daily_credits_used: 0,
              last_reset_date: today,
            })
            .eq('user_id', user.id)
            .select()
            .single();

          if (!mounted) return;

          if (!updateError && updated) {
            setCredits(updated);
            setFinalReplyUsed(false);
            setActionUsage({}); // Reset action tracking
          } else {
            setCredits(data);
          }
        } else {
          setCredits(data);
        }
      } else {
        const { data: newCredits, error: insertError } = await supabase
          .from('user_credits')
          .insert({
            user_id: user.id,
            is_premium: false,
            daily_credits_used: 0,
            daily_credits_limit: TIER_LIMITS.core.normal_chat,
            last_reset_date: new Date().toISOString().split('T')[0],
          })
          .select()
          .single();

        if (!mounted) return;

        if (!insertError && newCredits) {
          setCredits(newCredits);
        }
      }
    } catch (err) {
      console.error('Credits fetch error:', err);
    } finally {
      if (mounted) {
        setIsLoading(false);
      }
    }
  }, [user?.id, fetchTier]);

  useEffect(() => {
    fetchCredits();
  }, [fetchCredits]);

  // Check if a specific action is allowed for current tier
  const isActionAllowed = useCallback((action: CreditAction): boolean => {
    const limits = TIER_LIMITS[tier];
    const actionLimit = limits[action as keyof typeof limits] ?? 0;
    
    // Action not available for this tier
    if (actionLimit === 0) return false;
    
    // Pro users - always allowed (soft caps)
    if (tier === 'pro') return true;
    
    // Check usage for this specific action
    const used = actionUsage[action] ?? 0;
    return used < actionLimit;
  }, [tier, actionUsage]);

  // Calculate credit status
  const getCreditStatus = useCallback((): CreditStatus => {
    if (isLoading || !credits) {
      return {
        isLoading: true,
        tier: 'core',
        isPremium: false,
        usagePercent: 0,
        canUseCredits: true,
        showSoftWarning: false,
        isLimitReached: false,
        allowFinalReply: true,
        actionAllowed: () => true,
      };
    }

    const isPremium = tier === 'plus' || tier === 'pro';
    
    // Pro users have no visible limits
    if (tier === 'pro') {
      return {
        isLoading: false,
        tier: 'pro',
        isPremium: true,
        usagePercent: 0,
        canUseCredits: true,
        showSoftWarning: false,
        isLimitReached: false,
        allowFinalReply: true,
        actionAllowed: () => true,
      };
    }

    // Calculate chat-based usage percent (or use test override)
    const chatLimit = TIER_LIMITS[tier].normal_chat;
    const chatUsed = actionUsage.normal_chat ?? 0;
    const usagePercent = testUsagePercent !== null ? testUsagePercent : (chatUsed / chatLimit) * 100;
    const showSoftWarning = usagePercent >= 80 && usagePercent < 100;
    const isLimitReached = usagePercent >= 100;
    const allowFinalReply = isLimitReached && !finalReplyUsed;
    const canUseCredits = !isLimitReached || allowFinalReply;

    return {
      isLoading: false,
      tier,
      isPremium,
      usagePercent,
      canUseCredits,
      showSoftWarning,
      isLimitReached,
      allowFinalReply,
      actionAllowed: isActionAllowed,
    };
  }, [credits, isLoading, tier, finalReplyUsed, actionUsage, isActionAllowed, testUsagePercent]);

  // Test function to simulate usage levels
  const simulateUsage = useCallback((percent: number | null) => {
    setTestUsagePercent(percent);
  }, []);
  // Use credits for an action
  const useCreditsForAction = useCallback(async (action: CreditAction): Promise<boolean> => {
    if (!user?.id || !credits) return false;

    // Pro users always allowed
    if (tier === 'pro') {
      // Track usage but don't block
      setActionUsage(prev => ({
        ...prev,
        [action]: (prev[action] ?? 0) + 1,
      }));
      return true;
    }

    // Check if action is allowed for tier
    if (!isActionAllowed(action)) {
      return false;
    }

    const status = getCreditStatus();
    
    // If limit reached and not final reply, block
    if (status.isLimitReached && !status.allowFinalReply) {
      return false;
    }

    // Mark final reply as used
    if (status.isLimitReached && status.allowFinalReply) {
      setFinalReplyUsed(true);
    }

    // Track action usage
    setActionUsage(prev => ({
      ...prev,
      [action]: (prev[action] ?? 0) + 1,
    }));

    // Update total credits in DB
    const cost = CREDIT_COSTS[action];
    const newUsed = credits.daily_credits_used + cost;

    try {
      const { data, error } = await supabase
        .from('user_credits')
        .update({ daily_credits_used: newUsed })
        .eq('user_id', user.id)
        .select()
        .single();

      if (!error && data) {
        setCredits(data);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [user?.id, credits, tier, isActionAllowed, getCreditStatus]);

  // Upgrade to premium
  const upgradeToPremium = useCallback(async (): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      const { data, error } = await supabase
        .from('user_credits')
        .update({
          is_premium: true,
          premium_since: new Date().toISOString(),
          daily_credits_limit: TIER_LIMITS.plus.normal_chat,
        })
        .eq('user_id', user.id)
        .select()
        .single();

      if (!error && data) {
        setCredits(data);
        await fetchTier(true); // Refresh tier
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [user?.id, fetchTier]);

  return {
    credits,
    tier,
    isLoading,
    getCreditStatus,
    useCreditsForAction,
    upgradeToPremium,
    refreshCredits: fetchCredits,
    isActionAllowed,
    tierDisplay: TIER_DISPLAY[tier],
    simulateUsage, // For testing credit warnings
  };
}