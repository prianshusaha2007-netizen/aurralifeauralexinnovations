import React, { useEffect, useState } from 'react';
import { 
  Plus,
  X,
  History,
  Target,
  Calendar,
  Droplets,
  Bell,
  Brain,
  Sparkles,
  Palette,
  Mic,
  CreditCard,
  Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AuraOrb } from '@/components/AuraOrb';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

export type TabId = 
  | 'chat' 
  | 'history' 
  | 'memories' 
  | 'routine' 
  | 'habits'
  | 'hydration'
  | 'mood' 
  | 'mood-journal'
  | 'profile' 
  | 'search' 
  | 'games' 
  | 'permissions' 
  | 'settings'
  | 'image-analysis'
  | 'social'
  | 'gallery'
  | 'progress'
  | 'reminders'
  | 'services'
  | 'daily-plan'
  | 'subscription'
  | 'personality'
  | 'notifications'
  | 'appearance'
  | 'voice'
  | 'account'
  | 'help';

interface MenuItem {
  id: string;
  icon: React.ElementType;
  label: string;
  message?: string;
  action?: 'new-chat';
  divider?: boolean;
  section?: string;
  showBadge?: boolean;
  color?: string;
}

// Menu items that match the Master UI Contract - each sends a chat message
const menuItems: MenuItem[] = [
  { 
    id: 'new-chat', 
    icon: Plus, 
    label: 'New Chat', 
    action: 'new-chat',
    color: 'from-primary to-primary/70'
  },
  { 
    id: 'chat-history', 
    icon: History, 
    label: 'Chat History', 
    message: 'Show my recent chat history',
    divider: true
  },
  { 
    id: 'todays-focus', 
    icon: Target, 
    label: "Today's Focus", 
    message: "What should I focus on today? Show my priorities",
    section: 'Life'
  },
  { 
    id: 'daily-routine', 
    icon: Calendar, 
    label: 'Daily Routine', 
    message: "Show today's routine"
  },
  { 
    id: 'hydration-health', 
    icon: Droplets, 
    label: 'Hydration & Health', 
    message: 'Show my hydration and health reminders'
  },
  { 
    id: 'smart-reminders', 
    icon: Bell, 
    label: 'Smart Reminders', 
    message: 'What reminders do I have?'
  },
  { 
    id: 'memories', 
    icon: Brain, 
    label: 'Memories', 
    message: 'What do you remember about me?',
    divider: true
  },
  { 
    id: 'personality-relationship', 
    icon: Sparkles, 
    label: 'Personality & Relationship', 
    message: 'Show my personality settings and our relationship',
    section: 'Settings'
  },
  { 
    id: 'appearance', 
    icon: Palette, 
    label: 'Appearance', 
    message: 'I want to change the appearance settings'
  },
  { 
    id: 'voice-language', 
    icon: Mic, 
    label: 'Voice & Language', 
    message: 'Show my voice and language settings'
  },
  { 
    id: 'subscription-credits', 
    icon: CreditCard, 
    label: 'Subscription & Credits', 
    message: 'Show my plan and usage',
    showBadge: true
  },
  { 
    id: 'privacy-account', 
    icon: Shield, 
    label: 'Privacy & Account', 
    message: 'Show my privacy and account settings'
  },
];

interface AppSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  onNewChat: () => void;
  onSendMessage?: (message: string) => void;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  isOpen,
  onClose,
  activeTab,
  onTabChange,
  onNewChat,
  onSendMessage,
}) => {
  const [isFreePlan, setIsFreePlan] = useState(true);

  useEffect(() => {
    const checkSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('tier, status')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      setIsFreePlan(!subscription || subscription.tier === 'core');
    };

    checkSubscription();
  }, []);

  const handleItemClick = (item: MenuItem) => {
    if (item.action === 'new-chat') {
      onNewChat();
      onTabChange('chat');
    } else if (item.message && onSendMessage) {
      // Chat-binding: send message instead of navigating
      onSendMessage(item.message);
    }
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={cn(
        'fixed left-0 top-0 h-full w-72 bg-card border-r border-border z-50',
        'transform transition-transform duration-300 ease-out',
        isOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AuraOrb size="sm" />
            <div>
              <h2 className="font-bold text-lg aura-gradient-text">AURRA</h2>
              <p className="text-xs text-muted-foreground">Your AI Companion</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Menu Items */}
        <ScrollArea className="flex-1 h-[calc(100vh-80px)]">
          <div className="p-2 space-y-1">
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              const isNewChat = item.action === 'new-chat';
              const showDivider = item.divider && index < menuItems.length - 1;
              const showSectionHeader = item.section && index > 0;
              
              return (
                <React.Fragment key={item.id}>
                  {showSectionHeader && (
                    <div className="pt-3 pb-1 px-4">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        {item.section}
                      </span>
                    </div>
                  )}
                  <button
                    onClick={() => handleItemClick(item)}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
                      'text-left hover:bg-muted/50',
                      isNewChat && 'bg-primary/5 border border-primary/20 hover:bg-primary/10'
                    )}
                  >
                    <Icon className={cn(
                      'w-5 h-5',
                      isNewChat ? 'text-primary' : 'text-muted-foreground'
                    )} />
                    <span className={cn(
                      'font-medium text-sm flex-1',
                      isNewChat ? 'text-primary' : 'text-foreground'
                    )}>
                      {item.label}
                    </span>
                    {item.showBadge && isFreePlan && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5 bg-muted text-muted-foreground font-medium">
                        Free Plan
                      </Badge>
                    )}
                  </button>
                  {showDivider && (
                    <div className="my-2 mx-4 border-t border-border/50" />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </ScrollArea>
      </div>
    </>
  );
};