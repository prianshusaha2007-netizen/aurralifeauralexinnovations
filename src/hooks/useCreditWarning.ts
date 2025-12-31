import { useState, useEffect, useCallback } from 'react';
import { useCredits, CreditStatus } from './useCredits';

export interface CreditWarningState {
  showSoftWarning: boolean;
  showLimitWarning: boolean;
  creditStatus: CreditStatus;
  dismissSoftWarning: () => void;
  dismissLimitWarning: () => void;
  checkAndShowWarning: () => 'soft' | 'limit' | null;
}

/**
 * Hook to manage soft credit warnings in chat.
 * - Shows soft warning at 80-90% usage (once per session)
 * - Shows limit warning when credits are exhausted
 * - Respects user dismissals
 */
export function useCreditWarning(): CreditWarningState {
  const { getCreditStatus, credits } = useCredits();
  const creditStatus = getCreditStatus();
  
  const [showSoftWarning, setShowSoftWarning] = useState(false);
  const [showLimitWarning, setShowLimitWarning] = useState(false);
  const [softWarningShownThisSession, setSoftWarningShownThisSession] = useState(false);
  const [limitWarningShownThisSession, setLimitWarningShownThisSession] = useState(false);

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
      return 'limit';
    }

    // Check for soft warning (80-90% usage)
    if (creditStatus.showSoftWarning && !softWarningShownThisSession) {
      setShowSoftWarning(true);
      setSoftWarningShownThisSession(true);
      return 'soft';
    }

    return null;
  }, [creditStatus, softWarningShownThisSession, limitWarningShownThisSession]);

  return {
    showSoftWarning,
    showLimitWarning,
    creditStatus,
    dismissSoftWarning,
    dismissLimitWarning,
    checkAndShowWarning,
  };
}
