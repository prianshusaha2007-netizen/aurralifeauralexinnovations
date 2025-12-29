import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { AuraProvider, useAura } from '@/contexts/AuraContext';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/contexts/ThemeContext';
import { AppSidebar, TabId } from '@/components/AppSidebar';
import { GlobalBottomNav } from '@/components/GlobalBottomNav';
import { ReminderPopup } from '@/components/ReminderPopup';
import { CalmChatScreen } from '@/screens/CalmChatScreen';
import { LifeMemoriesScreen } from '@/screens/LifeMemoriesScreen';
import { RoutineScreen } from '@/screens/RoutineScreen';
import { SettingsScreen } from '@/screens/SettingsScreen';
import { OnboardingScreen } from '@/screens/OnboardingScreen';
import { PlayLearnScreen } from '@/screens/PlayLearnScreen';
import { MoodCheckInScreen } from '@/screens/MoodCheckInScreen';
import { PersonalityProfileScreen } from '@/screens/PersonalityProfileScreen';
import { SmartSearchScreen } from '@/screens/SmartSearchScreen';
import { ChatHistoryScreen } from '@/screens/ChatHistoryScreen';
import { PermissionsScreen } from '@/screens/PermissionsScreen';
import { PermissionsOnboardingScreen } from '@/screens/PermissionsOnboardingScreen';
import { HabitTrackerScreen } from '@/screens/HabitTrackerScreen';
import { HydrationScreen } from '@/screens/HydrationScreen';
import { ImageAnalysisScreen } from '@/screens/ImageAnalysisScreen';
import { SocialLeaderboardScreen } from '@/screens/SocialLeaderboardScreen';
import { ImageGalleryScreen } from '@/screens/ImageGalleryScreen';
import { ProgressDashboardScreen } from '@/screens/ProgressDashboardScreen';
import { RemindersScreen } from '@/screens/RemindersScreen';
import { SmartServicesScreen } from '@/screens/SmartServicesScreen';
import { DailyRoutineScreen } from '@/screens/DailyRoutineScreen';
import { AuraOrb } from '@/components/AuraOrb';
import { DailyMoodPopup } from '@/components/DailyMoodPopup';
import { SplashScreen } from '@/components/SplashScreen';
import { PageTransition } from '@/components/PageTransition';
import { ContinuousVoiceMode } from '@/components/ContinuousVoiceMode';
import { PermissionsOnboardingModal } from '@/components/PermissionsOnboardingModal';
import { useReminders } from '@/hooks/useReminders';
import { useMorningBriefing } from '@/hooks/useMorningBriefing';

const AppContent: React.FC = () => {
  const { userProfile, isLoading, clearChatHistory } = useAura();
  const { setUserSchedule } = useTheme();
  const [activeTab, setActiveTab] = useState<TabId>('chat');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [voiceModeOpen, setVoiceModeOpen] = useState(false);
  const [permissionsComplete, setPermissionsComplete] = useState(() => {
    return localStorage.getItem('aura-permissions-complete') === 'true';
  });
  
  const { activeReminder, snoozeReminder, completeReminder, dismissActiveReminder } = useReminders();
  
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
    setActiveTab('chat');
  };

  const renderScreen = () => {
    switch (activeTab) {
      case 'chat': return <CalmChatScreen onMenuClick={() => setSidebarOpen(true)} />;
      case 'games': return <PlayLearnScreen />;
      case 'memories': return <LifeMemoriesScreen />;
      case 'routine': return <DailyRoutineScreen onMenuClick={() => setSidebarOpen(true)} />;
      case 'habits': return <HabitTrackerScreen />;
      case 'hydration': return <HydrationScreen />;
      case 'settings': return <SettingsScreen />;
      case 'mood': return <MoodCheckInScreen />;
      case 'profile': return <PersonalityProfileScreen />;
      case 'search': return <SmartSearchScreen />;
      case 'history': return <ChatHistoryScreen />;
      case 'permissions': return <PermissionsScreen />;
      case 'image-analysis': return <ImageAnalysisScreen />;
      case 'gallery': return <ImageGalleryScreen />;
      case 'social': return <SocialLeaderboardScreen />;
      case 'progress': return <ProgressDashboardScreen />;
      case 'reminders': return <RemindersScreen onMenuClick={() => setSidebarOpen(true)} />;
      case 'services': return <SmartServicesScreen onMenuClick={() => setSidebarOpen(true)} />;
      default: return <CalmChatScreen onMenuClick={() => setSidebarOpen(true)} />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <DailyMoodPopup userName={userProfile.name} />
      <PermissionsOnboardingModal />

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
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onNewChat={handleNewChat}
      />

      <main className="flex-1 overflow-hidden pb-16">
        <PageTransition pageKey={activeTab}>
          {renderScreen()}
        </PageTransition>
      </main>

      <GlobalBottomNav
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as TabId)}
        onMenuClick={() => setSidebarOpen(true)}
      />
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
