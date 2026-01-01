import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus,
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
  Shield,
  User,
  X,
  ChevronRight
} from 'lucide-react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { motion } from 'framer-motion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useCredits, TIER_LIMITS } from '@/hooks/useCredits';

const TIER_LABELS: Record<string, string> = {
  core: 'Free',
  plus: 'Basic',
  pro: 'Pro',
};

interface MoreMenuSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSendMessage: (message: string) => void;
  onNewChat: () => void;
}

// Menu items as defined in the contract - each sends a chat message
const MENU_ITEMS = [
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
    color: 'from-blue-500 to-cyan-500',
    divider: true
  },
  { 
    id: 'todays-focus', 
    icon: Target, 
    label: "Today's Focus", 
    message: "What should I focus on today? Show my priorities",
    color: 'from-emerald-500 to-green-500'
  },
  { 
    id: 'daily-routine', 
    icon: Calendar, 
    label: 'Daily Routine', 
    message: "Show today's routine",
    color: 'from-violet-500 to-purple-500'
  },
  { 
    id: 'hydration-health', 
    icon: Droplets, 
    label: 'Hydration & Health', 
    message: 'Show my hydration and health reminders',
    color: 'from-cyan-500 to-blue-500'
  },
  { 
    id: 'smart-reminders', 
    icon: Bell, 
    label: 'Smart Reminders', 
    message: 'What reminders do I have?',
    color: 'from-orange-500 to-amber-500'
  },
  { 
    id: 'memories', 
    icon: Brain, 
    label: 'Memories', 
    message: 'What do you remember about me?',
    color: 'from-pink-500 to-rose-500',
    divider: true
  },
  { 
    id: 'subscription-credits', 
    icon: CreditCard, 
    label: 'Subscription & Credits', 
    action: 'subscription',
    color: 'from-purple-500 to-pink-500'
  },
  { 
    id: 'profile', 
    icon: User, 
    label: 'Profile & Personal Details', 
    message: 'Show my profile and personal details',
    color: 'from-blue-500 to-indigo-500'
  },
  { 
    id: 'personality-relationship', 
    icon: Sparkles, 
    label: 'Personality & Relationship', 
    message: 'Show my personality settings and our relationship',
    color: 'from-amber-500 to-yellow-500'
  },
  { 
    id: 'appearance', 
    icon: Palette, 
    label: 'Appearance', 
    message: 'I want to change the appearance settings',
    color: 'from-indigo-500 to-violet-500'
  },
  { 
    id: 'voice-language', 
    icon: Mic, 
    label: 'Voice & Language', 
    message: 'Show my voice and language settings',
    color: 'from-teal-500 to-emerald-500'
  },
  { 
    id: 'privacy-account', 
    icon: Shield, 
    label: 'Privacy & Account', 
    message: 'Show my privacy and account settings',
    color: 'from-slate-500 to-gray-500'
  },
];

export const MoreMenuSheet: React.FC<MoreMenuSheetProps> = ({
  open,
  onOpenChange,
  onSendMessage,
  onNewChat,
}) => {
  const navigate = useNavigate();
  const { tier, getCreditStatus } = useCredits();
  const creditStatus = getCreditStatus();
  const planLabel = TIER_LABELS[tier] || 'Free';
  const usagePercent = Math.min(creditStatus.usagePercent, 100);
  
  // Calculate messages remaining
  const dailyLimit = TIER_LIMITS[tier]?.normal_chat || 25;
  const messagesUsed = Math.round((usagePercent / 100) * dailyLimit);
  const messagesRemaining = Math.max(0, dailyLimit - messagesUsed);
  const isNearLimit = usagePercent >= 80;
  const isAtLimit = usagePercent >= 100;

  const handleItemClick = (item: typeof MENU_ITEMS[0]) => {
    if (item.action === 'new-chat') {
      onNewChat();
    } else if (item.action === 'subscription') {
      navigate('/subscription');
    } else if (item.message) {
      onSendMessage(item.message);
    }
    onOpenChange(false);
  };

  const handleBadgeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate('/subscription');
    onOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="relative pb-2">
          <DrawerTitle className="text-lg font-semibold">More</DrawerTitle>
          <DrawerClose asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute right-4 top-4 h-8 w-8 rounded-full"
            >
              <X className="w-4 h-4" />
            </Button>
          </DrawerClose>
        </DrawerHeader>
        
        <ScrollArea className="px-4 pb-8 max-h-[70vh]">
          <div className="grid gap-2">
            {MENU_ITEMS.map((item, index) => {
              const Icon = item.icon;
              const isNewChat = item.action === 'new-chat';
              const isSubscription = item.id === 'subscription-credits';
              
              return (
                <React.Fragment key={item.id}>
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.02 }}
                  >
                    <button
                      onClick={() => handleItemClick(item)}
                      className={cn(
                        'flex items-center gap-3 p-3.5 rounded-xl transition-all text-left group w-full',
                        isNewChat 
                          ? 'bg-primary text-primary-foreground hover:bg-primary/90 mb-2'
                          : 'bg-card/50 border border-border/40 hover:bg-accent/50 hover:border-primary/30'
                      )}
                    >
                      <div className={cn(
                        'w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110',
                        isNewChat 
                          ? 'bg-primary-foreground/20' 
                          : `bg-gradient-to-br ${item.color}`
                      )}>
                        <Icon className={cn(
                          'w-5 h-5',
                          isNewChat ? 'text-primary-foreground' : 'text-white'
                        )} />
                      </div>
                      <div className="flex items-center gap-2 flex-1">
                        <span className={cn(
                          'font-medium',
                          isNewChat ? 'text-primary-foreground' : 'text-foreground'
                        )}>
                          {item.label}
                        </span>
                        {isSubscription && (
                          <Badge 
                            variant={tier === 'pro' ? 'default' : 'secondary'}
                            className="text-xs px-1.5 py-0 cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={handleBadgeClick}
                          >
                            {planLabel}
                            <ChevronRight className="w-3 h-3 ml-0.5" />
                          </Badge>
                        )}
                      </div>
                    </button>
                    
                    {/* Usage progress bar for subscription item */}
                    {isSubscription && !creditStatus.isPremium && (
                      <div className="mt-1.5 mx-1 mb-2">
                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                          <span>Messages today</span>
                          <span className={cn(
                            isAtLimit && "text-destructive font-medium",
                            isNearLimit && !isAtLimit && "text-amber-500"
                          )}>
                            {isAtLimit 
                              ? "0 left" 
                              : `${messagesRemaining} left`}
                          </span>
                        </div>
                        <Progress 
                          value={usagePercent} 
                          className={cn(
                            "h-1.5 transition-all",
                            isNearLimit && "animate-pulse"
                          )}
                        />
                        {isNearLimit && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {isAtLimit 
                              ? "You've reached today's limit" 
                              : `Only ${messagesRemaining} messages remaining`}
                          </p>
                        )}
                      </div>
                    )}
                  </motion.div>
                  {item.divider && (
                    <div className="my-1 border-t border-border/30" />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </ScrollArea>
      </DrawerContent>
    </Drawer>
  );
};