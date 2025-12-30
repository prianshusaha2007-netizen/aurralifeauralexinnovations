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

// Credit costs (internal only - never shown to user)
export const CREDIT_COSTS = {
  normal_chat: 1,
  long_reasoning: 2,
  voice_reply: 2,
  skill_session: 3,
  image_generation: 5,
  memory_save: 1,
} as const;

export type CreditAction = keyof typeof CREDIT_COSTS;

export interface CreditStatus {
  isLoading: boolean;
  isPremium: boolean;
  usagePercent: number;
  canUseCredits: boolean;
  showSoftWarning: boolean;
  isLimitReached: boolean;
  allowFinalReply: boolean;
}

export function useCredits() {
  const { user } = useAuth();
  const [credits, setCredits] = useState<UserCredits | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [finalReplyUsed, setFinalReplyUsed] = useState(false);

  // Fetch or create user credits
  const fetchCredits = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      // Try to fetch existing credits
      const { data, error } = await supabase
        .from('user_credits')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching credits:', error);
        setIsLoading(false);
        return;
      }

      if (data) {
        // Check if we need to reset daily credits (new day)
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

          if (!updateError && updated) {
            setCredits(updated);
            setFinalReplyUsed(false);
          } else {
            setCredits(data);
          }
        } else {
          setCredits(data);
        }
      } else {
        // Create new credits record for user
        const { data: newCredits, error: insertError } = await supabase
          .from('user_credits')
          .insert({
            user_id: user.id,
            is_premium: false,
            daily_credits_used: 0,
            daily_credits_limit: 50,
            last_reset_date: new Date().toISOString().split('T')[0],
          })
          .select()
          .single();

        if (!insertError && newCredits) {
          setCredits(newCredits);
        }
      }
    } catch (err) {
      console.error('Credits fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchCredits();
  }, [fetchCredits]);

  // Calculate credit status
  const getCreditStatus = useCallback((): CreditStatus => {
    if (isLoading || !credits) {
      return {
        isLoading: true,
        isPremium: false,
        usagePercent: 0,
        canUseCredits: true,
        showSoftWarning: false,
        isLimitReached: false,
        allowFinalReply: true,
      };
    }

    // Premium users have no limits
    if (credits.is_premium) {
      return {
        isLoading: false,
        isPremium: true,
        usagePercent: 0,
        canUseCredits: true,
        showSoftWarning: false,
        isLimitReached: false,
        allowFinalReply: true,
      };
    }

    const usagePercent = (credits.daily_credits_used / credits.daily_credits_limit) * 100;
    const showSoftWarning = usagePercent >= 80 && usagePercent < 100;
    const isLimitReached = credits.daily_credits_used >= credits.daily_credits_limit;
    const allowFinalReply = isLimitReached && !finalReplyUsed;
    const canUseCredits = !isLimitReached || allowFinalReply;

    return {
      isLoading: false,
      isPremium: false,
      usagePercent,
      canUseCredits,
      showSoftWarning,
      isLimitReached,
      allowFinalReply,
    };
  }, [credits, isLoading, finalReplyUsed]);

  // Use credits for an action
  const useCreditsForAction = useCallback(async (action: CreditAction): Promise<boolean> => {
    if (!user?.id || !credits) return false;

    // Premium users don't consume credits
    if (credits.is_premium) return true;

    const cost = CREDIT_COSTS[action];
    const newUsed = credits.daily_credits_used + cost;

    // Check if this would exceed limit (unless it's the final reply)
    const status = getCreditStatus();
    if (status.isLimitReached && !status.allowFinalReply) {
      return false;
    }

    // If this is the final reply allowed, mark it as used
    if (status.isLimitReached && status.allowFinalReply) {
      setFinalReplyUsed(true);
    }

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
  }, [user?.id, credits, getCreditStatus]);

  // Upgrade to premium
  const upgradeToPremium = useCallback(async (): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      const { data, error } = await supabase
        .from('user_credits')
        .update({
          is_premium: true,
          premium_since: new Date().toISOString(),
        })
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
  }, [user?.id]);

  return {
    credits,
    isLoading,
    getCreditStatus,
    useCreditsForAction,
    upgradeToPremium,
    refreshCredits: fetchCredits,
  };
}
