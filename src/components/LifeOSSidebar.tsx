import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MessageCircle,
  Calendar,
  Brain,
  Activity,
  Settings,
  X,
  ChevronRight,
  Sun,
  Moon,
  Zap,
  Heart,
  Bell,
  Clock,
  Undo2,
  Eye,
  Shield,
  Volume2,
  Palette,
  User,
  CreditCard,
  HelpCircle,
  MoreHorizontal,
  Plus,
  Sparkles,
  Target,
  Droplets,
  Gamepad2,
  Image,
  Search,
  Trophy
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { AuraOrb } from '@/components/AuraOrb';
import { ThemeToggle } from '@/components/ThemeToggle';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useAura } from '@/contexts/AuraContext';
import { supabase } from '@/integrations/supabase/client';

// 5-Layer Architecture
export type LifeOSLayer = 'chat' | 'today' | 'memory' | 'actions' | 'settings';

interface LayerConfig {
  id: LifeOSLayer;
  icon: React.ElementType;
  label: string;
  description: string;
}

const layers: LayerConfig[] = [
  { 
    id: 'chat', 
    icon: MessageCircle, 
    label: 'Chat', 
    description: 'Talk to AURRA' 
  },
  { 
    id: 'today', 
    icon: Calendar, 
    label: 'Today', 
    description: 'Your daily context' 
  },
  { 
    id: 'memory', 
    icon: Brain, 
    label: 'Memory', 
    description: 'What AURRA knows' 
  },
  { 
    id: 'actions', 
    icon: Activity, 
    label: 'Actions', 
    description: 'Recent activity' 
  },
  { 
    id: 'settings', 
    icon: Settings, 
    label: 'Settings', 
    description: 'Control & privacy' 
  },
];

// Settings submenu items
const settingsItems = [
  { id: 'autonomy', icon: Zap, label: 'Autonomy Level', path: '/autonomy' },
  { id: 'voice', icon: Volume2, label: 'Voice Mode', path: null },
  { id: 'notifications', icon: Bell, label: 'Notifications', path: null },
  { id: 'appearance', icon: Palette, label: 'Appearance', path: null },
  { id: 'account', icon: User, label: 'Account', path: null },
  { id: 'subscription', icon: CreditCard, label: 'Plan & Credits', path: '/subscription' },
  { id: 'privacy', icon: Shield, label: 'Privacy & Data', path: null },
  { id: 'help', icon: HelpCircle, label: 'Help', path: null },
];

// Hidden features (accessible via "More")
const moreItems = [
  { id: 'habits', icon: Target, label: 'Habit Tracker', message: 'Show my habits' },
  { id: 'hydration', icon: Droplets, label: 'Hydration', message: 'Show my hydration tracker' },
  { id: 'games', icon: Gamepad2, label: 'Play & Learn', message: 'Show me some games' },
  { id: 'gallery', icon: Image, label: 'Image Gallery', path: '/gallery' },
  { id: 'search', icon: Search, label: 'Smart Search', message: 'Help me search for something' },
  { id: 'skills', icon: Trophy, label: 'Skills Progress', path: '/skills' },
  { id: 'focus-history', icon: Clock, label: 'Focus History', path: '/focus-history' },
  { id: 'timeline', icon: Activity, label: 'Life Timeline', path: '/timeline' },
  { id: 'alarms', icon: Bell, label: 'Alarms', path: '/alarms' },
];

interface LifeOSSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeLayer: LifeOSLayer;
  onLayerChange: (layer: LifeOSLayer) => void;
  onNewChat: () => void;
  onSendMessage?: (message: string) => void;
}

export const LifeOSSidebar: React.FC<LifeOSSidebarProps> = ({
  isOpen,
  onClose,
  activeLayer,
  onLayerChange,
  onNewChat,
  onSendMessage,
}) => {
  const navigate = useNavigate();
  const { userProfile } = useAura();
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [showMore, setShowMore] = useState(false);
  const [currentMood, setCurrentMood] = useState<string | null>(null);
  const [currentEnergy, setCurrentEnergy] = useState<string | null>(null);
  
  // Get time-based greeting
  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 12) return { label: 'Morning', icon: Sun };
    if (hour < 17) return { label: 'Afternoon', icon: Sun };
    if (hour < 21) return { label: 'Evening', icon: Moon };
    return { label: 'Night', icon: Moon };
  };
  
  const timeOfDay = getTimeOfDay();
  
  // Fetch latest mood/energy
  useEffect(() => {
    const fetchMoodData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('mood_checkins')
        .select('mood, energy')
        .eq('user_id', user.id)
        .gte('created_at', today)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (data) {
        setCurrentMood(data.mood);
        setCurrentEnergy(data.energy);
      }
    };
    
    fetchMoodData();
  }, [isOpen]);

  const handleLayerClick = (layer: LifeOSLayer) => {
    if (layer === 'chat') {
      onLayerChange('chat');
      onClose();
    } else if (layer === 'settings') {
      setExpandedSection(expandedSection === 'settings' ? null : 'settings');
    } else {
      // For other layers, send a chat message to trigger the view
      const messages: Record<string, string> = {
        today: "What's my plan for today?",
        memory: "What do you remember about me?",
        actions: "What actions have you taken recently?",
      };
      if (onSendMessage && messages[layer]) {
        onSendMessage(messages[layer]);
        onLayerChange('chat');
        onClose();
      }
    }
  };

  const handleSettingsItemClick = (item: typeof settingsItems[0]) => {
    if (item.path) {
      navigate(item.path);
      onClose();
    } else {
      // Send chat message for settings
      const messages: Record<string, string> = {
        voice: 'Show my voice settings',
        notifications: 'Show my notification settings',
        appearance: 'I want to change appearance settings',
        account: 'Show my account settings',
        privacy: 'Show my privacy settings',
        help: 'I need help with something',
      };
      if (onSendMessage && messages[item.id]) {
        onSendMessage(messages[item.id]);
        onLayerChange('chat');
        onClose();
      }
    }
  };

  const handleMoreItemClick = (item: typeof moreItems[0]) => {
    if ('path' in item && item.path) {
      navigate(item.path);
    } else if ('message' in item && item.message && onSendMessage) {
      onSendMessage(item.message);
      onLayerChange('chat');
    }
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
            onClick={onClose}
          />
        )}
      </AnimatePresence>
      
      {/* Sidebar */}
      <motion.aside
        initial={{ x: -300 }}
        animate={{ x: isOpen ? 0 : -300 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed left-0 top-0 h-full w-72 bg-card border-r border-border z-50 flex flex-col"
      >
        {/* Header - Calm, minimal */}
        <div className="p-4 border-b border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AuraOrb size="sm" />
              <div>
                <h2 className="font-semibold text-base">AURRA</h2>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <timeOfDay.icon className="w-3 h-3" />
                  {timeOfDay.label}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <ThemeToggle />
              <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full h-8 w-8">
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          {/* Quick context - mood/energy if available */}
          {(currentMood || currentEnergy) && (
            <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              {currentMood && (
                <Badge variant="secondary" className="text-[10px] px-2 py-0.5 bg-muted/50">
                  <Heart className="w-3 h-3 mr-1" />
                  {currentMood}
                </Badge>
              )}
              {currentEnergy && (
                <Badge variant="secondary" className="text-[10px] px-2 py-0.5 bg-muted/50">
                  <Zap className="w-3 h-3 mr-1" />
                  {currentEnergy}
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* New Chat Button - Prominent */}
        <div className="p-3">
          <Button
            onClick={() => {
              onNewChat();
              onLayerChange('chat');
              onClose();
            }}
            className="w-full justify-start gap-2 bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20"
            variant="ghost"
          >
            <Plus className="w-4 h-4" />
            <span>New Chat</span>
            <Sparkles className="w-3 h-3 ml-auto opacity-60" />
          </Button>
        </div>

        {/* 5-Layer Navigation */}
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {layers.map((layer) => {
              const Icon = layer.icon;
              const isActive = activeLayer === layer.id;
              const isExpanded = expandedSection === layer.id;
              
              return (
                <div key={layer.id}>
                  <button
                    onClick={() => handleLayerClick(layer.id)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all',
                      'text-left hover:bg-muted/50',
                      isActive && layer.id !== 'settings' && 'bg-primary/10 text-primary',
                      isExpanded && 'bg-muted/50'
                    )}
                  >
                    <Icon className={cn(
                      'w-5 h-5',
                      isActive && layer.id !== 'settings' ? 'text-primary' : 'text-muted-foreground'
                    )} />
                    <div className="flex-1 min-w-0">
                      <span className={cn(
                        'font-medium text-sm block',
                        isActive && layer.id !== 'settings' && 'text-primary'
                      )}>
                        {layer.label}
                      </span>
                      <span className="text-[10px] text-muted-foreground truncate block">
                        {layer.description}
                      </span>
                    </div>
                    {layer.id === 'settings' && (
                      <ChevronRight className={cn(
                        'w-4 h-4 text-muted-foreground transition-transform',
                        isExpanded && 'rotate-90'
                      )} />
                    )}
                  </button>
                  
                  {/* Settings submenu */}
                  <AnimatePresence>
                    {layer.id === 'settings' && isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden ml-4 border-l border-border/50"
                      >
                        <div className="py-1 pl-4 space-y-0.5">
                          {settingsItems.map((item) => (
                            <button
                              key={item.id}
                              onClick={() => handleSettingsItemClick(item)}
                              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
                            >
                              <item.icon className="w-4 h-4" />
                              <span>{item.label}</span>
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
            
            {/* Divider */}
            <div className="h-px bg-border/50 my-3 mx-3" />
            
            {/* More - Hidden features */}
            <div>
              <button
                onClick={() => setShowMore(!showMore)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all',
                  'text-left hover:bg-muted/30 text-muted-foreground',
                  showMore && 'bg-muted/30'
                )}
              >
                <MoreHorizontal className="w-5 h-5" />
                <span className="text-sm">More</span>
                <ChevronRight className={cn(
                  'w-4 h-4 ml-auto transition-transform',
                  showMore && 'rotate-90'
                )} />
              </button>
              
              <AnimatePresence>
                {showMore && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden ml-4 border-l border-border/50"
                  >
                    <div className="py-1 pl-4 space-y-0.5">
                      {moreItems.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => handleMoreItemClick(item)}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
                        >
                          <item.icon className="w-4 h-4" />
                          <span>{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </ScrollArea>

        {/* Footer - User info */}
        <div className="p-3 border-t border-border/50">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-sm font-medium">
              {userProfile.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{userProfile.name || 'User'}</p>
              <p className="text-[10px] text-muted-foreground">
                {userProfile.professions?.[0] || 'AURRA User'}
              </p>
            </div>
          </div>
        </div>
      </motion.aside>
    </>
  );
};

export default LifeOSSidebar;
