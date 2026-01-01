import { useState, useEffect, useCallback, useMemo } from 'react';
import { useCredits, CreditStatus } from './useCredits';
import { useSoftUpsell } from './useSoftUpsell';

export interface CreditWarningState {
  showSoftWarning: boolean;
  showLimitWarning: boolean;
  creditStatus: CreditStatus;
  consecutiveLimitDays: number;
  dismissSoftWarning: () => void;
  dismissLimitWarning: () => void;
  checkAndShowWarning: () => 'soft' | 'limit' | null;
  getSoftLimitMessage: () => string;
}

const DEFAULT_CREDIT_STATUS: CreditStatus = {
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

/**
 * Hook to manage soft credit warnings in chat.
 * - Shows soft warning at 80-90% usage (once per session)
 * - Shows limit warning when credits are exhausted
 * - Tracks consecutive limit days for soft upsell
 * - Respects user dismissals
 */
export function useCreditWarning(): CreditWarningState {
  // All useState hooks first - in a stable order
  const [showSoftWarning, setShowSoftWarning] = useState(false);
  const [showLimitWarning, setShowLimitWarning] = useState(false);
  const [softWarningShownThisSession, setSoftWarningShownThisSession] = useState(false);
  const [limitWarningShownThisSession, setLimitWarningShownThisSession] = useState(false);

  // Custom hooks after useState
  const { getCreditStatus, credits, isLoading } = useCredits();
  const { recordLimitHit, consecutiveLimitDays, getSoftLimitMessage } = useSoftUpsell();

  // Memoize credit status to avoid issues with function calls during render
  const creditStatus = useMemo<CreditStatus>(() => {
    if (isLoading) {
      return DEFAULT_CREDIT_STATUS;
    }
    return getCreditStatus();
  }, [isLoading, getCreditStatus]);

  // Reset session flags when credits reset (new day)
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const lastWarningDate = localStorage.getItem('aurra-warning-date');
    
    if (lastWarningDate !== today) {
      setSoftWarningShownThisSession(false);
      setLimitWarningShownThisSession(false);
      localStorage.setItem('aurra-warning-date', today);
    }
  }, [credits?.last_reset_date]);

  const dismissSoftWarning = useCallback(() => {
    setShowSoftWarning(false);
    setSoftWarningShownThisSession(true);
  }, []);

  const dismissLimitWarning = useCallback(() => {
    setShowLimitWarning(false);
    setLimitWarningShownThisSession(true);
  }, []);

  /**
   * Check credit status and determine if a warning should be shown.
   * Call this after each message is sent.
   * Returns 'soft', 'limit', or null.
   */
  const checkAndShowWarning = useCallback((): 'soft' | 'limit' | null => {
    // Premium users never see warnings
    if (creditStatus.isPremium || creditStatus.isLoading) {
      return null;
    }

    // Check for limit reached first
    if (creditStatus.isLimitReached && !limitWarningShownThisSession) {
      setShowLimitWarning(true);
      setLimitWarningShownThisSession(true);
      // Record that user hit their limit today (for soft upsell tracking)
      recordLimitHit();
      return 'limit';
    }

    // Check for soft warning (80-90% usage)
    if (creditStatus.showSoftWarning && !softWarningShownThisSession) {
      setShowSoftWarning(true);
      setSoftWarningShownThisSession(true);
      return 'soft';
    }

    return null;
  }, [creditStatus, softWarningShownThisSession, limitWarningShownThisSession, recordLimitHit]);

  return {
    showSoftWarning,
    showLimitWarning,
    creditStatus,
    consecutiveLimitDays,
    dismissSoftWarning,
    dismissLimitWarning,
    checkAndShowWarning,
    getSoftLimitMessage,
  };
}
