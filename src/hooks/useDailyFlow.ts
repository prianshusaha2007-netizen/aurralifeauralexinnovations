import { useState, useEffect, useCallback } from 'react';

interface DailyFlowState {
  showPreferences: boolean;
  showMorningBriefing: boolean;
  showWindDown: boolean;
  isFirstTimeUser: boolean;
  currentDayChat: string;
}

export const useDailyFlow = () => {
  const [state, setState] = useState<DailyFlowState>({
    showPreferences: false,
    showMorningBriefing: false,
    showWindDown: false,
    isFirstTimeUser: false,
    currentDayChat: '',
  });

  // Check daily flow conditions
  useEffect(() => {
    const checkDailyFlow = () => {
      const now = new Date();
      const hour = now.getHours();
      const today = now.toISOString().split('T')[0];
      
      // Check if first-time user
      const hasCompletedPrefs = localStorage.getItem('aura-preferences-complete');
      const isFirstTime = !hasCompletedPrefs;
      
      // Check morning briefing (5am-11am, once per day)
      const lastMorningBriefing = localStorage.getItem('aura-morning-briefing-date');
      const shouldShowMorning = hour >= 5 && hour < 11 && lastMorningBriefing !== today && !isFirstTime;
      
      // Check wind-down (10pm-2am, once per day)
      const lastWindDown = localStorage.getItem('aura-winddown-date');
      const shouldShowWindDown = (hour >= 22 || hour < 2) && lastWindDown !== today && !isFirstTime;
      
      // Check if we need to archive yesterday's chat
      const lastChatDate = localStorage.getItem('aura-chat-date');
      if (lastChatDate && lastChatDate !== today) {
        // Archive yesterday's chat
        const chatHistory = JSON.parse(localStorage.getItem('aura-archived-chats') || '[]');
        const yesterdayMessages = localStorage.getItem('aura-chat-messages');
        if (yesterdayMessages) {
          chatHistory.push({
            date: lastChatDate,
            messages: JSON.parse(yesterdayMessages),
          });
          localStorage.setItem('aura-archived-chats', JSON.stringify(chatHistory.slice(-30)));
        }
      }
      localStorage.setItem('aura-chat-date', today);
      
      setState({
        showPreferences: isFirstTime,
        showMorningBriefing: shouldShowMorning,
        showWindDown: shouldShowWindDown,
        isFirstTimeUser: isFirstTime,
        currentDayChat: today,
      });
    };
    
    checkDailyFlow();
    
    // Re-check every hour
    const interval = setInterval(checkDailyFlow, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const dismissPreferences = useCallback(() => {
    localStorage.setItem('aura-preferences-complete', 'true');
    setState(prev => ({ ...prev, showPreferences: false, isFirstTimeUser: false }));
  }, []);

  const dismissMorningBriefing = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem('aura-morning-briefing-date', today);
    setState(prev => ({ ...prev, showMorningBriefing: false }));
  }, []);

  const dismissWindDown = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem('aura-winddown-date', today);
    setState(prev => ({ ...prev, showWindDown: false }));
  }, []);

  // Debug/simulation functions
  const triggerMorningFlow = useCallback(() => {
    setState(prev => ({ ...prev, showMorningBriefing: true }));
  }, []);

  const triggerNightFlow = useCallback(() => {
    setState(prev => ({ ...prev, showWindDown: true, isFirstTimeUser: false }));
  }, []);

  const triggerFirstTimeFlow = useCallback(() => {
    localStorage.removeItem('aura-preferences-complete');
    setState(prev => ({ ...prev, showPreferences: true, isFirstTimeUser: true }));
  }, []);

  const resetAllFlowState = useCallback(() => {
    localStorage.removeItem('aura-preferences-complete');
    localStorage.removeItem('aura-morning-briefing-date');
    localStorage.removeItem('aura-winddown-date');
    localStorage.removeItem('aura-morning-flow-date');
    localStorage.removeItem('aura-winddown-history');
    setState({
      showPreferences: false,
      showMorningBriefing: false,
      showWindDown: false,
      isFirstTimeUser: false,
      currentDayChat: new Date().toISOString().split('T')[0],
    });
  }, []);

  return {
    ...state,
    dismissPreferences,
    dismissMorningBriefing,
    dismissWindDown,
    // Debug functions
    triggerMorningFlow,
    triggerNightFlow,
    triggerFirstTimeFlow,
    resetAllFlowState,
  };
};
