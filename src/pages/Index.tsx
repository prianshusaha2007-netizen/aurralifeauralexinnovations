import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { AuraProvider, useAura } from '@/contexts/AuraContext';
import { useAuth } from '@/hooks/useAuth';
import { NavigationBar } from '@/components/NavigationBar';
import { AppSidebar, TabId } from '@/components/AppSidebar';
import { ChatScreen } from '@/screens/ChatScreen';
import { MemoriesScreen } from '@/screens/MemoriesScreen';
import { RoutineScreen } from '@/screens/RoutineScreen';
import { SettingsScreen } from '@/screens/SettingsScreen';
import { OnboardingScreen } from '@/screens/OnboardingScreen';
import { PlayLearnScreen } from '@/screens/PlayLearnScreen';
import { MoodCheckInScreen } from '@/screens/MoodCheckInScreen';
import { PersonalityProfileScreen } from '@/screens/PersonalityProfileScreen';
import { SmartSearchScreen } from '@/screens/SmartSearchScreen';
import { ChatHistoryScreen } from '@/screens/ChatHistoryScreen';
import { PermissionsScreen } from '@/screens/PermissionsScreen';
import { HabitTrackerScreen } from '@/screens/HabitTrackerScreen';
import { HydrationScreen } from '@/screens/HydrationScreen';
import { AuraOrb } from '@/components/AuraOrb';
import { DailyMoodPopup } from '@/components/DailyMoodPopup';
import { SplashScreen } from '@/components/SplashScreen';
import { PageTransition } from '@/components/PageTransition';
import { ContinuousVoiceMode } from '@/components/ContinuousVoiceMode';

import { useMorningBriefing } from '@/hooks/useMorningBriefing';

const AppContent: React.FC = () => {
  const { userProfile, isLoading, clearChatHistory } = useAura();
  const [activeTab, setActiveTab] = useState<TabId>('chat');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [voiceModeOpen, setVoiceModeOpen] = useState(false);
  
  // Initialize morning briefing (will auto-show if appropriate time)
  useMorningBriefing();

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

  const handleNewChat = () => {
    clearChatHistory();
    setActiveTab('chat');
  };

  const renderScreen = () => {
    switch (activeTab) {
      case 'chat': return <ChatScreen onMenuClick={() => setSidebarOpen(true)} onVoiceModeClick={() => setVoiceModeOpen(true)} />;
      case 'games': return <PlayLearnScreen />;
      case 'memories': return <MemoriesScreen />;
      case 'routine': return <RoutineScreen />;
      case 'habits': return <HabitTrackerScreen />;
      case 'hydration': return <HydrationScreen />;
      case 'settings': return <SettingsScreen />;
      case 'mood': return <MoodCheckInScreen />;
      case 'profile': return <PersonalityProfileScreen />;
      case 'search': return <SmartSearchScreen />;
      case 'history': return <ChatHistoryScreen />;
      case 'permissions': return <PermissionsScreen />;
      default: return <ChatScreen onMenuClick={() => setSidebarOpen(true)} onVoiceModeClick={() => setVoiceModeOpen(true)} />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Daily Mood Check-in Popup */}
      <DailyMoodPopup userName={userProfile.name} />

      {/* Continuous Voice Mode */}
      <ContinuousVoiceMode
        isOpen={voiceModeOpen}
        onClose={() => setVoiceModeOpen(false)}
        userName={userProfile.name}
      />

      <AppSidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onNewChat={handleNewChat}
      />

      <main className="flex-1 overflow-hidden">
        <PageTransition pageKey={activeTab}>
          {renderScreen()}
        </PageTransition>
      </main>
      <NavigationBar activeTab={activeTab} onTabChange={(tab) => setActiveTab(tab as TabId)} />
    </div>
  );
};

const ProtectedApp: React.FC = () => {
  const { user, loading } = useAuth();
  const [showSplash, setShowSplash] = useState(true);

  // Show splash only on first load
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
