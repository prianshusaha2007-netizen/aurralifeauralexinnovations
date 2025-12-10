import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { AuraProvider, useAura } from '@/contexts/AuraContext';
import { useAuth } from '@/hooks/useAuth';
import { NavigationBar } from '@/components/NavigationBar';
import { ChatScreen } from '@/screens/ChatScreen';
import { MemoriesScreen } from '@/screens/MemoriesScreen';
import { RoutineScreen } from '@/screens/RoutineScreen';
import { SettingsScreen } from '@/screens/SettingsScreen';
import { OnboardingScreen } from '@/screens/OnboardingScreen';
import { PlayLearnScreen } from '@/screens/PlayLearnScreen';
import { AuraOrb } from '@/components/AuraOrb';

const AppContent: React.FC = () => {
  const { userProfile, isLoading } = useAura();
  const [activeTab, setActiveTab] = useState('chat');

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

  const renderScreen = () => {
    switch (activeTab) {
      case 'chat':
        return <ChatScreen />;
      case 'play':
        return <PlayLearnScreen />;
      case 'memories':
        return <MemoriesScreen />;
      case 'routine':
        return <RoutineScreen />;
      case 'settings':
        return <SettingsScreen />;
      default:
        return <ChatScreen />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
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

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <AuraProvider>
      <AppContent />
    </AuraProvider>
  );
};

const Index = () => {
  return <ProtectedApp />;
};

export default Index;
