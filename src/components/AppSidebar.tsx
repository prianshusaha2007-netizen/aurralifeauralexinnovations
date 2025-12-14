import React from 'react';
import { 
  MessageSquare, 
  History, 
  Brain, 
  Calendar, 
  Smile, 
  User, 
  Search, 
  Settings, 
  Gamepad2,
  Shield,
  Plus,
  X,
  Target,
  Droplets
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AuraOrb } from '@/components/AuraOrb';
import { cn } from '@/lib/utils';

export type TabId = 
  | 'chat' 
  | 'history' 
  | 'memories' 
  | 'routine' 
  | 'habits'
  | 'hydration'
  | 'mood' 
  | 'profile' 
  | 'search' 
  | 'games' 
  | 'permissions' 
  | 'settings';

interface MenuItem {
  id: TabId;
  icon: React.ElementType;
  label: string;
  action?: boolean;
}

const menuItems: MenuItem[] = [
  { id: 'chat', icon: Plus, label: 'New Chat', action: true },
  { id: 'history', icon: History, label: 'Chat History' },
  { id: 'memories', icon: Brain, label: 'Memories' },
  { id: 'routine', icon: Calendar, label: 'Routine & Reminders' },
  { id: 'habits', icon: Target, label: 'Habit Tracker' },
  { id: 'hydration', icon: Droplets, label: 'Hydration Tracker' },
  { id: 'mood', icon: Smile, label: 'Mood Check-in' },
  { id: 'profile', icon: User, label: 'Personality Profile' },
  { id: 'search', icon: Search, label: 'Smart Search' },
  { id: 'games', icon: Gamepad2, label: 'Games & Fun' },
  { id: 'permissions', icon: Shield, label: 'Permissions' },
  { id: 'settings', icon: Settings, label: 'Settings' },
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
  const handleItemClick = (item: MenuItem) => {
    if (item.action && item.id === 'chat') {
      onNewChat();
    } else {
      onTabChange(item.id);
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
              <h2 className="font-bold text-lg aura-gradient-text">AURA</h2>
              <p className="text-xs text-muted-foreground">Your AI Companion</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Menu Items */}
        <ScrollArea className="flex-1 h-[calc(100vh-80px)]">
          <div className="p-2 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id && !item.action;
              
              return (
                <button
                  key={item.id}
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
                    'font-medium text-sm',
                    isActive ? 'text-primary' : 'text-foreground',
                    item.action && 'text-primary'
                  )}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </ScrollArea>
      </div>
    </>
  );
};
