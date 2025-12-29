import React from 'react';
import { 
  MessageCircle, 
  History, 
  Brain, 
  Heart, 
  Calendar, 
  User, 
  Search, 
  Settings,
  X,
  Plus,
  Sparkles,
  Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onNewChat: () => void;
}

const menuItems = [
  { id: 'new-chat', icon: Plus, label: 'New Chat', action: true },
  { id: 'chat', icon: MessageCircle, label: 'Chat' },
  { id: 'chat-history', icon: History, label: 'Chat History' },
  { id: 'memories', icon: Brain, label: 'Memories' },
  { id: 'mood', icon: Heart, label: 'Daily Check-In & Mood' },
  { id: 'routine', icon: Calendar, label: 'Routine Manager' },
  { id: 'personality', icon: User, label: 'Personality Profile' },
  { id: 'smart-search', icon: Search, label: 'Smart Search' },
  { id: 'permissions', icon: Shield, label: 'Permissions' },
  { id: 'settings', icon: Settings, label: 'Settings' },
];

export const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen, 
  onClose, 
  activeTab, 
  onTabChange,
  onNewChat 
}) => {
  const handleItemClick = (item: typeof menuItems[0]) => {
    if (item.id === 'new-chat') {
      onNewChat();
      onClose();
    } else {
      onTabChange(item.id);
      onClose();
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className={cn(
          'fixed inset-0 z-50 bg-background/80 backdrop-blur-sm transition-opacity duration-300',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-50 h-full w-72 bg-card border-r border-border shadow-2xl transition-transform duration-300 ease-out',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            <span className="text-lg font-bold aura-gradient-text">AURRA</span>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Menu Items */}
        <ScrollArea className="h-[calc(100%-80px)] py-4">
          <nav className="space-y-1 px-3">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const isNewChat = item.id === 'new-chat';

              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
                    isNewChat 
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90 mb-4'
                      : isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <Icon className={cn('w-5 h-5', isNewChat && 'animate-pulse')} />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </ScrollArea>
      </aside>
    </>
  );
};
