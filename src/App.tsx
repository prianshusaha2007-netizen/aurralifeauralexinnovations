import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { PersonaProvider } from "@/contexts/PersonaContext";
import { AuraProvider } from "@/contexts/AuraContext";
import { useAuth } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import Install from "./pages/Install";
import { ImageGalleryScreen } from "./screens/ImageGalleryScreen";
import { ChatHistoryScreen } from "./screens/ChatHistoryScreen";
import { ArchivedChatScreen } from "./screens/ArchivedChatScreen";
import { SkillsDashboardScreen } from "./screens/SkillsDashboardScreen";
import SubscriptionScreen from "./screens/SubscriptionScreen";
import SubscriptionManagementScreen from "./screens/SubscriptionManagementScreen";
import { FocusHistoryScreen } from "./screens/FocusHistoryScreen";
import { WellnessScreen } from "./screens/WellnessScreen";
import { MentorshipSettingsScreen } from "./screens/MentorshipSettingsScreen";
import { ReferralsScreen } from "./screens/ReferralsScreen";
import TimelineScreen from "./screens/TimelineScreen";
import AutonomySettingsScreen from "./screens/AutonomySettingsScreen";
import AlarmsScreen from "./screens/AlarmsScreen";
const queryClient = new QueryClient();

// Wrapper for routes that need AuraProvider
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground animate-pulse">Loading...</p>
      </div>
    );
  }
  
  if (!user) return <Navigate to="/auth" replace />;
  
  return <AuraProvider>{children}</AuraProvider>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <PersonaProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/gallery" element={<ProtectedRoute><ImageGalleryScreen /></ProtectedRoute>} />
              <Route path="/chat-history" element={<ProtectedRoute><ChatHistoryScreen /></ProtectedRoute>} />
              <Route path="/chat/:date" element={<ProtectedRoute><ArchivedChatScreen /></ProtectedRoute>} />
              <Route path="/skills" element={<ProtectedRoute><SkillsDashboardScreen /></ProtectedRoute>} />
              <Route path="/subscription" element={<ProtectedRoute><SubscriptionScreen /></ProtectedRoute>} />
              <Route path="/my-plan" element={<ProtectedRoute><SubscriptionManagementScreen /></ProtectedRoute>} />
              <Route path="/focus-history" element={<ProtectedRoute><FocusHistoryScreen /></ProtectedRoute>} />
              <Route path="/wellness" element={<ProtectedRoute><WellnessScreen /></ProtectedRoute>} />
              <Route path="/mentorship" element={<ProtectedRoute><MentorshipSettingsScreen /></ProtectedRoute>} />
              <Route path="/referrals" element={<ProtectedRoute><ReferralsScreen /></ProtectedRoute>} />
              <Route path="/timeline" element={<ProtectedRoute><TimelineScreen /></ProtectedRoute>} />
              <Route path="/autonomy" element={<ProtectedRoute><AutonomySettingsScreen /></ProtectedRoute>} />
              <Route path="/alarms" element={<ProtectedRoute><AlarmsScreen /></ProtectedRoute>} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="/install" element={<Install />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </PersonaProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;