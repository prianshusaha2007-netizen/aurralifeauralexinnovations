import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { AuraProvider, useAura } from '@/contexts/AuraContext';
import { useAuth } from '@/hooks/useAuth';
import { NavigationBar } from '@/components/NavigationBar';
import { Sidebar } from '@/components/Sidebar';
import { Button } from '@/components/ui/button';
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
import { AuraOrb } from '@/components/AuraOrb';
import { DailyMoodPopup } from '@/components/DailyMoodPopup';

const AppContent: React.FC = () => {
  const { userProfile, isLoading, clearChatHistory } = useAura();
  const [activeTab, setActiveTab] = useState('chat');
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
      case 'chat': return <ChatScreen />;
      case 'play': return <PlayLearnScreen />;
      case 'memories': return <MemoriesScreen />;
      case 'routine': return <RoutineScreen />;
      case 'settings': return <SettingsScreen />;
      case 'mood': return <MoodCheckInScreen />;
      case 'personality': return <PersonalityProfileScreen />;
      case 'smart-search': return <SmartSearchScreen />;
      case 'chat-history': return <ChatHistoryScreen />;
      case 'permissions': return <PermissionsScreen />;
      default: return <ChatScreen />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Daily Mood Check-in Popup */}
      <DailyMoodPopup userName={userProfile.name} />

      {/* Header with Menu */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-card/50 backdrop-blur-sm">
        <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)} className="rounded-full">
          <Menu className="w-5 h-5" />
        </Button>
        <span className="font-bold aura-gradient-text">AURA</span>
        <div className="w-10" />
      </header>

      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onNewChat={handleNewChat}
      />

      <main className="flex-1 overflow-hidden">{renderScreen()}</main>
      <NavigationBar activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

const ProtectedApp: React.FC = () => {
  const { user, loading } = useAuth();

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
