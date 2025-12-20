import React, { useState } from 'react';
import { 
  MessageCircle, History, Bookmark, Brain, Calendar, 
  Smile, Image, Settings, Plus, ChevronDown, ChevronRight,
  Sparkles, User, Search, Gamepad2, DropletIcon, Target,
  Trophy, X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import auraLogo from '@/assets/aura-logo.jpeg';
import { useAura } from '@/contexts/AuraContext';
import { format, isToday, isYesterday, isThisWeek } from 'date-fns';

export type SidebarTab = 
  | 'chat' | 'new-chat' | 'history' | 'pinned' | 'memories' 
  | 'routine' | 'mood' | 'image-analysis' | 'settings' | 'habits'
  | 'hydration' | 'games' | 'social' | 'progress' | 'profile' | 'search';

interface SidebarItem {
  id: SidebarTab;
  icon: React.ElementType;
  label: string;
  action?: boolean;
  divider?: boolean;
}

const mainItems: SidebarItem[] = [
  { id: 'new-chat', icon: Plus, label: 'New Chat', action: true },
  { id: 'chat', icon: MessageCircle, label: 'Chat' },
  { id: 'history', icon: History, label: 'Chat History' },
  { id: 'pinned', icon: Bookmark, label: 'Pinned Chats', divider: true },
];

const lifeItems: SidebarItem[] = [
  { id: 'memories', icon: Brain, label: 'Memories' },
  { id: 'routine', icon: Calendar, label: 'Routines' },
  { id: 'mood', icon: Smile, label: 'Mood & Check-ins' },
  { id: 'habits', icon: Target, label: 'Habit Tracker' },
  { id: 'hydration', icon: DropletIcon, label: 'Hydration', divider: true },
];

const toolsItems: SidebarItem[] = [
  { id: 'image-analysis', icon: Image, label: 'Image Analysis' },
  { id: 'games', icon: Gamepad2, label: 'Play & Learn' },
  { id: 'search', icon: Search, label: 'Smart Search' },
  { id: 'progress', icon: Trophy, label: 'Progress', divider: true },
];

const bottomItems: SidebarItem[] = [
  { id: 'profile', icon: User, label: 'My Profile' },
  { id: 'settings', icon: Settings, label: 'Settings' },
];

interface AuraSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: SidebarTab;
  onTabChange: (tab: SidebarTab) => void;
  onNewChat: () => void;
}

interface ChatHistoryItem {
  id: string;
  title: string;
  preview: string;
  timestamp: Date;
  pinned?: boolean;
}

export const AuraSidebar: React.FC<AuraSidebarProps> = ({
  isOpen,
  onClose,
  activeTab,
  onTabChange,
  onNewChat,
}) => {
  const { chatMessages, userProfile } = useAura();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    main: true,
    life: true,
    tools: true,
  });

  // Group chat messages into conversation summaries
  const getChatHistory = (): ChatHistoryItem[] => {
    const conversations: ChatHistoryItem[] = [];
    let currentConvo: { messages: typeof chatMessages; startTime: Date } | null = null;
    
    chatMessages.forEach((msg, idx) => {
      if (idx === 0 || !currentConvo) {
        currentConvo = { messages: [msg], startTime: new Date(msg.timestamp) };
      } else {
        const timeDiff = new Date(msg.timestamp).getTime() - new Date(currentConvo.messages[currentConvo.messages.length - 1].timestamp).getTime();
        // New conversation if gap > 30 minutes
        if (timeDiff > 30 * 60 * 1000) {
          const userMsg = currentConvo.messages.find(m => m.sender === 'user');
          conversations.push({
            id: currentConvo.messages[0].id,
            title: userMsg?.content.slice(0, 40) || 'Conversation',
            preview: currentConvo.messages[0].content.slice(0, 60),
            timestamp: currentConvo.startTime,
          });
          currentConvo = { messages: [msg], startTime: new Date(msg.timestamp) };
        } else {
          currentConvo.messages.push(msg);
        }
      }
    });
    
    if (currentConvo && currentConvo.messages.length > 0) {
      const userMsg = currentConvo.messages.find(m => m.sender === 'user');
      conversations.push({
        id: currentConvo.messages[0].id,
        title: userMsg?.content.slice(0, 40) || 'Current Conversation',
        preview: currentConvo.messages[0].content.slice(0, 60),
        timestamp: currentConvo.startTime,
      });
    }
    
    return conversations.reverse().slice(0, 10);
  };

  const chatHistory = getChatHistory();

  const groupByDate = (items: ChatHistoryItem[]) => {
    const groups: Record<string, ChatHistoryItem[]> = {};
    items.forEach(item => {
      let label = format(item.timestamp, 'MMM d');
      if (isToday(item.timestamp)) label = 'Today';
      else if (isYesterday(item.timestamp)) label = 'Yesterday';
      else if (isThisWeek(item.timestamp)) label = format(item.timestamp, 'EEEE');
      
      if (!groups[label]) groups[label] = [];
      groups[label].push(item);
    });
    return groups;
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleItemClick = (item: SidebarItem) => {
    if (item.id === 'new-chat') {
      onNewChat();
      onTabChange('chat');
    } else {
      onTabChange(item.id);
    }
    onClose();
  };

  const renderItem = (item: SidebarItem) => {
    const isActive = activeTab === item.id;
    return (
      <button
        key={item.id}
        onClick={() => handleItemClick(item)}
        className={cn(
          'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
          isActive 
            ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' 
            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
          item.action && 'bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20'
        )}
      >
        <item.icon className={cn('w-5 h-5', item.action && 'text-primary')} />
        <span className="truncate">{item.label}</span>
        {item.action && <Sparkles className="w-3 h-3 ml-auto text-primary" />}
      </button>
    );
  };

  const renderSection = (
    title: string, 
    items: SidebarItem[], 
    sectionKey: string
  ) => {
    const isExpanded = expandedSections[sectionKey];
    return (
      <div className="mb-2">
        <button
          onClick={() => toggleSection(sectionKey)}
          className="w-full flex items-center justify-between px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
        >
          {title}
          {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        </button>
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="space-y-1 overflow-hidden"
            >
              {items.map(item => (
                <React.Fragment key={item.id}>
                  {renderItem(item)}
                  {item.divider && <div className="h-px bg-border/50 my-2 mx-3" />}
                </React.Fragment>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const groupedHistory = groupByDate(chatHistory);

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={{ x: -300 }}
        animate={{ x: isOpen ? 0 : -300 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className={cn(
          'fixed top-0 left-0 h-full w-72 bg-card border-r border-border z-50',
          'flex flex-col shadow-2xl'
        )}
      >
        {/* Header */}
        <div className="p-4 border-b border-border/50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg">
                <img src={auraLogo} alt="AURA" className="w-full h-full object-cover" />
              </div>
              <div>
                <h1 className="font-bold text-lg bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  AURA
                </h1>
                <p className="text-[10px] text-muted-foreground">Your AI Companion</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="lg:hidden rounded-full">
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-background/50 border-border/50 h-9 text-sm rounded-xl"
            />
          </div>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1 p-2">
          <div className="space-y-1 mb-4">
            {mainItems.map(item => (
              <React.Fragment key={item.id}>
                {renderItem(item)}
                {item.divider && <div className="h-px bg-border/50 my-2 mx-3" />}
              </React.Fragment>
            ))}
          </div>

          {/* Chat History */}
          {chatHistory.length > 0 && (
            <div className="mb-4">
              <p className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Recent Chats
              </p>
              <div className="space-y-1">
                {Object.entries(groupedHistory).map(([date, items]) => (
                  <div key={date}>
                    <p className="px-3 py-1 text-[10px] text-muted-foreground/70">{date}</p>
                    {items.map(item => (
                      <button
                        key={item.id}
                        onClick={() => {
                          onTabChange('chat');
                          onClose();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-muted transition-colors group"
                      >
                        <MessageCircle className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span className="truncate text-left flex-1 text-muted-foreground group-hover:text-foreground">
                          {item.title}
                        </span>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {renderSection('Life', lifeItems, 'life')}
          {renderSection('Tools', toolsItems, 'tools')}
        </ScrollArea>

        {/* Footer */}
        <div className="p-2 border-t border-border/50 space-y-1">
          {bottomItems.map(renderItem)}
          
          {/* User Profile Card */}
          <div className="mt-3 p-3 rounded-xl bg-gradient-to-br from-primary/10 to-accent/5 border border-border/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-bold">
                {userProfile.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{userProfile.name || 'User'}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {userProfile.professions?.[0] || 'AURA User'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.aside>

      {/* Desktop sidebar spacer - always visible on lg+ */}
      <div className="hidden lg:block w-72 shrink-0" />
    </>
  );
};
