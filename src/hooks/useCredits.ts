import { useState, useEffect, useCallback, useRef } from 'react';
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

// Subscription tiers - aligned with backend spec
// free | basic | plus | pro
export type SubscriptionTier = 'core' | 'basic' | 'plus' | 'pro';

// Daily credit limits per tier (internal tracking only - NEVER show numbers to users)
// Aligned with payment architecture spec
export const DAILY_CREDITS: Record<SubscriptionTier, number> = {
  core: 20,       // Free tier
  basic: 60,      // ₹99/month
  plus: 150,      // ₹199/month
  pro: 999999,    // ₹299/month - unlimited (internal only, never shown)
};

// Credit costs per action (internal)
export const CREDIT_COSTS: Record<string, number> = {
  normal_chat: 1,
  study_explanation: 3,  // Long explanations
  image_generation: 5,
  focus_session: 2,
  memory_save: 1,
};

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
  dailyCreditsRemaining: number;
  actionAllowed: (action: CreditAction) => boolean;
}

// User-friendly tier display (no numbers!)
export const TIER_DISPLAY: Record<SubscriptionTier, {
  name: string;
  price: string;
  priceValue: number;
  target: string;
  description: string;
}> = {
  core: {
    name: 'Free',
    price: 'Free',
    priceValue: 0,
    target: 'Light use',
    description: 'For checking in, quick chats, and getting a feel for AURRA.',
  },
  basic: {
    name: 'Basic',
    price: '₹99',
    priceValue: 99,
    target: 'Students',
    description: 'For regular check-ins, routines, and staying consistent.',
  },
  plus: {
    name: 'Plus',
    price: '₹199',
    priceValue: 199,
    target: 'Daily users',
    description: 'Most people choose this.',
  },
  pro: {
    name: 'Pro',
    price: '₹299',
    priceValue: 299,
    target: 'Power users',
    description: 'For founders and power users who stay connected all day.',
  },
};

export function useCredits() {
  const { user, loading: authLoading } = useAuth();
  const [credits, setCredits] = useState<UserCredits | null>(null);
  const [tier, setTier] = useState<SubscriptionTier>('core');
  const [isLoading, setIsLoading] = useState(true);
  const [finalReplyUsed, setFinalReplyUsed] = useState(false);
  const [testUsagePercent, setTestUsagePercent] = useState<number | null>(null);
  const isMountedRef = useRef(true);
  const hasFetchedRef = useRef(false);

  // Track mount state
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
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
    if (!user?.id || !isMountedRef.current) {
      return;
    }

    try {
      await fetchTier(isMountedRef.current);
      
      if (!isMountedRef.current) return;
      
      const { data, error } = await supabase
        .from('user_credits')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!isMountedRef.current) return;

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching credits:', error);
        if (isMountedRef.current) setIsLoading(false);
        return;
      }

      if (data) {
        const today = new Date().toISOString().split('T')[0];
        // Daily reset at midnight
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

          if (!isMountedRef.current) return;

          if (!updateError && updated) {
            setCredits(updated);
            setFinalReplyUsed(false);
          } else {
            setCredits(data);
          }
        } else {
          if (isMountedRef.current) setCredits(data);
        }
      } else {
        // Create new credits record for new users
        const { data: newCredits, error: insertError } = await supabase
          .from('user_credits')
          .insert({
            user_id: user.id,
            is_premium: false,
            daily_credits_used: 0,
            daily_credits_limit: DAILY_CREDITS.core,
            last_reset_date: new Date().toISOString().split('T')[0],
          })
          .select()
          .single();

        if (!isMountedRef.current) return;

        if (!insertError && newCredits) {
          setCredits(newCredits);
        }
      }
    } catch (err) {
      console.error('Credits fetch error:', err);
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [user?.id, fetchTier]);

  useEffect(() => {
    if (!authLoading && user?.id && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchCredits();
    } else if (!authLoading && !user) {
      setIsLoading(false);
    }
  }, [authLoading, user?.id, fetchCredits]);

  // Check if a specific action can be performed
  const isActionAllowed = useCallback((action: CreditAction): boolean => {
    if (!credits) return true;
    
    // Pro users - always allowed (unlimited with soft rate limiting)
    if (tier === 'pro') return true;
    
    const dailyLimit = DAILY_CREDITS[tier];
    const cost = CREDIT_COSTS[action] ?? 1;
    
    return (credits.daily_credits_used + cost) <= dailyLimit;
  }, [tier, credits]);

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
        dailyCreditsRemaining: DAILY_CREDITS.core,
        actionAllowed: () => true,
      };
    }

    const isPremium = tier !== 'core';
    const dailyLimit = DAILY_CREDITS[tier];
    
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
        dailyCreditsRemaining: 999,
        actionAllowed: () => true,
      };
    }

    // Calculate usage percent
    const usagePercent = testUsagePercent !== null 
      ? testUsagePercent 
      : (credits.daily_credits_used / dailyLimit) * 100;
    
    const dailyCreditsRemaining = Math.max(0, dailyLimit - credits.daily_credits_used);
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
      dailyCreditsRemaining,
      actionAllowed: isActionAllowed,
    };
  }, [credits, isLoading, tier, finalReplyUsed, isActionAllowed, testUsagePercent]);

  // Test function to simulate usage levels
  const simulateUsage = useCallback((percent: number | null) => {
    setTestUsagePercent(percent);
  }, []);

  // Use credits for an action
  const useCreditsForAction = useCallback(async (action: CreditAction): Promise<boolean> => {
    if (!user?.id || !credits) return false;

    // Pro users always allowed
    if (tier === 'pro') {
      return true;
    }

    // Check if action is allowed
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

    // Update credits in DB
    const cost = CREDIT_COSTS[action] ?? 1;
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

  // Upgrade to premium (called after successful payment)
  const upgradeToPremium = useCallback(async (newTier?: SubscriptionTier): Promise<boolean> => {
    if (!user?.id) return false;

    const targetTier = newTier || 'plus';
    const newLimit = DAILY_CREDITS[targetTier];

    try {
      const { data, error } = await supabase
        .from('user_credits')
        .update({
          is_premium: true,
          premium_since: new Date().toISOString(),
          daily_credits_limit: newLimit,
          daily_credits_used: 0, // Reset on upgrade
        })
        .eq('user_id', user.id)
        .select()
        .single();

      if (!error && data) {
        setCredits(data);
        await fetchTier(true);
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
    simulateUsage,
  };
}
