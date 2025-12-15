import React from 'react';
import { Droplets, BookOpen, Mail, Smile, Clock, Brain, Dumbbell, Coffee } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface QuickActionsProps {
  onAction: (action: string, message: string) => void;
  className?: string;
}

const QUICK_ACTIONS = [
  { id: 'boost-mood', label: 'Boost Mood', icon: Smile, message: 'Hey AURA, boost my mood! I need some positive energy right now 🌟', color: 'from-pink-500 to-rose-500' },
  { id: 'add-hydration', label: '+Water', icon: Droplets, message: 'Log water: I just drank a glass of water 💧', color: 'from-cyan-500 to-blue-500' },
  { id: 'study-time', label: '+1hr Study', icon: BookOpen, message: 'Add 1 hour to my study time today 📚', color: 'from-violet-500 to-purple-500' },
  { id: 'draft-email', label: 'Draft Email', icon: Mail, message: 'Help me draft a professional email', color: 'from-amber-500 to-orange-500' },
  { id: 'focus-mode', label: 'Focus', icon: Brain, message: 'Help me focus for the next 25 minutes - start a Pomodoro session 🎯', color: 'from-emerald-500 to-green-500' },
  { id: 'workout', label: 'Quick Workout', icon: Dumbbell, message: 'Give me a quick 5-minute workout I can do right now 💪', color: 'from-red-500 to-pink-500' },
  { id: 'break-time', label: 'Break', icon: Coffee, message: 'I need a break. Give me a fun fact or a quick relaxation tip ☕', color: 'from-teal-500 to-cyan-500' },
  { id: 'schedule', label: 'Schedule', icon: Clock, message: "What's on my schedule for today?", color: 'from-indigo-500 to-blue-500' },
];

export const QuickActions: React.FC<QuickActionsProps> = ({ onAction, className }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("flex gap-2 overflow-x-auto pb-2 scrollbar-hide", className)}
    >
      {QUICK_ACTIONS.map((action, index) => {
        const Icon = action.icon;
        return (
          <motion.div
            key={action.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
          >
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAction(action.id, action.message)}
              className={cn(
                "flex-shrink-0 h-9 px-3 rounded-full gap-1.5 text-xs font-medium",
                "border-border/50 hover:border-primary/50",
                "bg-gradient-to-r hover:text-white transition-all",
                `hover:${action.color}`
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {action.label}
            </Button>
          </motion.div>
        );
      })}
    </motion.div>
  );
};
