import React, { useEffect, useState } from 'react';
import { 
  MessageSquare, 
  History, 
  Brain, 
  Calendar, 
  Settings, 
  Gamepad2,
  Plus,
  X,
  Droplets,
  Trophy,
  BarChart3,
  Image,
  ImageIcon,
  Bell,
  MapPin,
  Target,
  BookHeart,
  Heart,
  CreditCard
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
  | 'subscription';

interface MenuItem {
  id: TabId | 'new-chat';
  icon: React.ElementType;
  label: string;
  action?: boolean;
  divider?: boolean;
  section?: string;
}

const menuItems: MenuItem[] = [
  { id: 'new-chat', icon: Plus, label: 'New Chat', action: true },
  { id: 'chat', icon: MessageSquare, label: 'Chat', section: 'Main' },
  { id: 'history', icon: History, label: 'Chat History' },
  { id: 'reminders', icon: Bell, label: 'Reminders & Alarms' },
  { id: 'services', icon: MapPin, label: 'Smart Services', divider: true },
  { id: 'daily-plan', icon: Target, label: "Today's Focus", section: 'Wellness' },
  { id: 'mood', icon: Heart, label: 'Daily Check-In' },
  { id: 'mood-journal', icon: BookHeart, label: 'Mood Journal' },
  { id: 'games', icon: Gamepad2, label: 'Play Games' },
  { id: 'routine', icon: Calendar, label: 'Daily Routine' },
  { id: 'hydration', icon: Droplets, label: 'Hydration Tracker' },
  { id: 'progress', icon: BarChart3, label: 'Progress Dashboard' },
  { id: 'social', icon: Trophy, label: 'Social Leaderboard', divider: true },
  { id: 'memories', icon: Brain, label: 'Memories', section: 'Personal' },
  { id: 'image-analysis', icon: Image, label: 'Image Analysis' },
  { id: 'gallery', icon: ImageIcon, label: 'Image Gallery', divider: true },
  { id: 'settings', icon: Settings, label: 'Settings', section: 'More' },
  { id: 'subscription' as TabId, icon: CreditCard, label: 'Subscription' },
];

interface AppSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  onNewChat: () => void;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  isOpen,
  onClose,
  activeTab,
  onTabChange,
  onNewChat,
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
    if (item.action && item.id === 'new-chat') {
      onNewChat();
      onTabChange('chat');
    } else if (item.id !== 'new-chat') {
      onTabChange(item.id as TabId);
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
              <h2 className="font-bold text-lg aura-gradient-text">Auralex</h2>
              <p className="text-xs text-muted-foreground">Human-Centric AI</p>
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
              const isActive = activeTab === item.id && !item.action;
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
                      isActive && 'bg-primary/10 text-primary',
                      item.action && 'bg-primary/5 border border-primary/20 hover:bg-primary/10'
                    )}
                  >
                    <Icon className={cn(
                      'w-5 h-5',
                      isActive ? 'text-primary' : 'text-muted-foreground',
                      item.action && 'text-primary'
                    )} />
                    <span className={cn(
                      'font-medium text-sm flex-1',
                      isActive ? 'text-primary' : 'text-foreground',
                      item.action && 'text-primary'
                    )}>
                      {item.label}
                    </span>
                    {item.id === 'subscription' && isFreePlan && (
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
