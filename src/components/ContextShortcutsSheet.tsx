import React from 'react';
import { 
  Calendar, Clock, Bell, Brain, TrendingUp, Target, X
} from 'lucide-react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

interface ContextShortcutsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSendMessage: (message: string) => void;
}

// Context shortcuts that send messages to chat instead of navigating
const CONTEXT_SHORTCUTS = [
  { 
    id: 'today', 
    icon: Calendar, 
    label: 'Today', 
    message: "Show me today's plan and what I have going on",
    color: 'from-blue-500 to-cyan-500'
  },
  { 
    id: 'routine', 
    icon: Clock, 
    label: 'Routine', 
    message: "Show me my routine for today",
    color: 'from-violet-500 to-purple-500'
  },
  { 
    id: 'reminders', 
    icon: Bell, 
    label: 'Reminders', 
    message: "What reminders do I have?",
    color: 'from-orange-500 to-amber-500'
  },
  { 
    id: 'focus', 
    icon: Target, 
    label: 'Focus', 
    message: "Start focus mode - I want to concentrate",
    color: 'from-emerald-500 to-green-500'
  },
  { 
    id: 'memories', 
    icon: Brain, 
    label: 'Memories', 
    message: "What do you remember about me?",
    color: 'from-pink-500 to-rose-500'
  },
  { 
    id: 'progress', 
    icon: TrendingUp, 
    label: 'Progress', 
    message: "How am I doing this week? Show my progress",
    color: 'from-indigo-500 to-blue-500'
  },
];

export const ContextShortcutsSheet: React.FC<ContextShortcutsSheetProps> = ({
  open,
  onOpenChange,
  onSendMessage,
}) => {
  const handleShortcutClick = (message: string) => {
    onSendMessage(message);
    onOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[60vh]">
        <DrawerHeader className="relative pb-2">
          <DrawerTitle className="text-lg font-semibold">Quick Context</DrawerTitle>
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
        
        <div className="px-4 pb-8">
          <p className="text-xs text-muted-foreground mb-4">
            Tap to ask about any of these
          </p>
          
          <div className="grid grid-cols-3 gap-3">
            {CONTEXT_SHORTCUTS.map((shortcut, index) => {
              const Icon = shortcut.icon;
              return (
                <motion.button
                  key={shortcut.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleShortcutClick(shortcut.message)}
                  className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-card/50 border border-border/40 hover:bg-accent/50 hover:border-primary/30 transition-all group"
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${shortcut.color} flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-xs font-medium text-foreground">{shortcut.label}</span>
                </motion.button>
              );
            })}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
