import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { PersonaProvider } from "@/contexts/PersonaContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import { ImageGalleryScreen } from "./screens/ImageGalleryScreen";
import { ChatHistoryScreen } from "./screens/ChatHistoryScreen";
import { ArchivedChatScreen } from "./screens/ArchivedChatScreen";
import { SkillsDashboardScreen } from "./screens/SkillsDashboardScreen";
import SubscriptionScreen from "./screens/SubscriptionScreen";
import { FocusHistoryScreen } from "./screens/FocusHistoryScreen";

const queryClient = new QueryClient();

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
              <Route path="/gallery" element={<ImageGalleryScreen />} />
              <Route path="/chat-history" element={<ChatHistoryScreen />} />
              <Route path="/chat/:date" element={<ArchivedChatScreen />} />
              <Route path="/skills" element={<SkillsDashboardScreen />} />
              <Route path="/subscription" element={<SubscriptionScreen />} />
              <Route path="/focus-history" element={<FocusHistoryScreen />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </PersonaProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;