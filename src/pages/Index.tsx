import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { AuraProvider, useAura } from '@/contexts/AuraContext';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/contexts/ThemeContext';
import { useMentorship } from '@/hooks/useMentorship';
import { AppSidebar, TabId } from '@/components/AppSidebar';
import { ReminderPopup } from '@/components/ReminderPopup';
import { FloatingFocusButton } from '@/components/FloatingFocusButton';
import { CalmChatScreen } from '@/screens/CalmChatScreen';
import { OnboardingScreen } from '@/screens/OnboardingScreen';
import { PermissionsOnboardingScreen } from '@/screens/PermissionsOnboardingScreen';
import { MentorshipOnboarding } from '@/components/MentorshipOnboarding';
import { AuraOrb } from '@/components/AuraOrb';
import { DailyMoodPopup } from '@/components/DailyMoodPopup';
import { SplashScreen } from '@/components/SplashScreen';
import { PageTransition } from '@/components/PageTransition';
import { ContinuousVoiceMode } from '@/components/ContinuousVoiceMode';
import { PermissionsOnboardingModal } from '@/components/PermissionsOnboardingModal';
import { MorningGreeting } from '@/components/MorningGreeting';
import { MorningMoodCheck, useShouldShowMoodCheck } from '@/components/MorningMoodCheck';
import { useReminders } from '@/hooks/useReminders';
import { useMorningBriefing } from '@/hooks/useMorningBriefing';

const AppContent: React.FC = () => {
  const { userProfile, isLoading, clearChatHistory } = useAura();
  const { setUserSchedule } = useTheme();
  const { hasCompletedSetup: hasMentorshipSetup, isLoading: mentorshipLoading } = useMentorship();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [voiceModeOpen, setVoiceModeOpen] = useState(false);
  const [showMentorshipOnboarding, setShowMentorshipOnboarding] = useState(false);
  const [permissionsComplete, setPermissionsComplete] = useState(() => {
    return localStorage.getItem('aura-permissions-complete') === 'true';
  });
  
  const { reminders, activeReminder, snoozeReminder, completeReminder, dismissActiveReminder } = useReminders();
  const { shouldShow: showMorningMood, dismiss: dismissMorningMood } = useShouldShowMoodCheck();
  const [morningMoodVisible, setMorningMoodVisible] = useState(false);
  
  // Show morning mood check after a short delay
  useEffect(() => {
    if (showMorningMood) {
      const timer = setTimeout(() => setMorningMoodVisible(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [showMorningMood]);
  
  // Check if mentorship onboarding should be shown
  useEffect(() => {
    if (!mentorshipLoading && !hasMentorshipSetup && userProfile.onboardingComplete && permissionsComplete) {
      // Show mentorship onboarding after a delay
      const timer = setTimeout(() => setShowMentorshipOnboarding(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [mentorshipLoading, hasMentorshipSetup, userProfile.onboardingComplete, permissionsComplete]);
  
  useMorningBriefing();

  // Sync user schedule to theme context for auto dark/light mode
  useEffect(() => {
    if (userProfile.wakeTime && userProfile.sleepTime) {
      setUserSchedule({
        wakeTime: userProfile.wakeTime,
        sleepTime: userProfile.sleepTime,
      });
    }
  }, [userProfile.wakeTime, userProfile.sleepTime, setUserSchedule]);

  const handlePermissionsComplete = () => {
    localStorage.setItem('aura-permissions-complete', 'true');
    setPermissionsComplete(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <AuraOrb size="xl" />
        <p className="mt-4 text-muted-foreground animate-pulse">Loading your space...</p>
      </div>
    );
  }

  if (!userProfile.onboardingComplete) {
    return <OnboardingScreen />;
  }

  // Show permissions onboarding after profile onboarding
  if (!permissionsComplete) {
    return (
      <PermissionsOnboardingScreen
        onComplete={handlePermissionsComplete}
        userName={userProfile.name}
      />
    );
  }

  const handleNewChat = () => {
    clearChatHistory();
  };

  // Chat is the cockpit - only render chat screen
  // All other "screens" are accessed via sidebar or triggered via chat
  const handleSidebarTabChange = (tab: TabId) => {
    // For settings screens, we'll need to handle them
    // For now, just close sidebar - features should be accessed via chat
    setSidebarOpen(false);
  };

  const handleMorningMoodComplete = (mood: 'low' | 'normal' | 'high') => {
    // Store mood in localStorage - useSmartRoutine will pick it up
    const stored = localStorage.getItem('aurra-smart-routine');
    const settings = stored ? JSON.parse(stored) : {};
    settings.currentMood = mood;
    settings.lastMoodCheck = new Date().toISOString();
    localStorage.setItem('aurra-smart-routine', JSON.stringify(settings));
    dismissMorningMood();
    setMorningMoodVisible(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <MorningGreeting />
      <DailyMoodPopup userName={userProfile.name} />
      <PermissionsOnboardingModal />
      
      {/* Morning Mood Check Popup */}
      {morningMoodVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <MorningMoodCheck 
            userName={userProfile.name}
            onComplete={handleMorningMoodComplete}
          />
        </div>
      )}

      {/* Mentorship Onboarding */}
      {showMentorshipOnboarding && (
        <MentorshipOnboarding
          onComplete={() => setShowMentorshipOnboarding(false)}
          userName={userProfile.name}
        />
      )}
      <ContinuousVoiceMode
        isOpen={voiceModeOpen}
        onClose={() => setVoiceModeOpen(false)}
        userName={userProfile.name}
      />

      <ReminderPopup
        reminder={activeReminder}
        onSnooze={(mins) => activeReminder && snoozeReminder(activeReminder.id, mins)}
        onComplete={() => activeReminder && completeReminder(activeReminder.id)}
        onDismiss={dismissActiveReminder}
      />

      <AppSidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        activeTab="chat"
        onTabChange={handleSidebarTabChange}
        onNewChat={handleNewChat}
      />

      {/* Floating Focus Button - appears during active routine blocks */}
      <FloatingFocusButton />

      {/* Chat is the only screen - the cockpit */}
      <main className="flex-1 overflow-hidden">
        <PageTransition pageKey="chat">
          <CalmChatScreen 
            onMenuClick={() => setSidebarOpen(true)} 
            onNewChat={handleNewChat}
          />
        </PageTransition>
      </main>
    </div>
  );
};

const ProtectedApp: React.FC = () => {
  const { user, loading } = useAuth();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const hasSeenSplash = sessionStorage.getItem('aura-splash-seen');
    if (hasSeenSplash) {
      setShowSplash(false);
    }
  }, []);

  const handleSplashComplete = () => {
    sessionStorage.setItem('aura-splash-seen', 'true');
    setShowSplash(false);
  };

  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <AuraOrb size="xl" />
        <p className="mt-4 text-muted-foreground animate-pulse">Connecting...</p>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  return (
    <AuraProvider>
      <AppContent />
    </AuraProvider>
  );
};

const Index = () => <ProtectedApp />;

export default Index;
