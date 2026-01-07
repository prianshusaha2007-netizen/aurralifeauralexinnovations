import React from 'react';
import { Rocket, Brain, PenLine, FileText, Laugh, Wand2, Dumbbell, Target, CalendarClock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface ChatQuickActionsProps {
  onAction: (action: string, message: string) => void;
  className?: string;
}

const QUICK_ACTIONS = [
  { 
    id: 'yesterday', 
    label: 'What happened yesterday?', 
    icon: CalendarClock, 
    message: "What happened yesterday? Give me a quick recap of what we talked about.",
    gradient: 'from-amber-500 to-yellow-500'
  },
  { 
    id: 'boost-day', 
    label: 'Boost my day', 
    icon: Rocket, 
    message: "Let's make this day lighter. I need some energy and motivation 🚀",
    gradient: 'from-orange-500 to-amber-500'
  },
  { 
    id: 'productive', 
    label: "Let's be productive", 
    icon: Brain, 
    message: "I want to be productive. What should I focus on right now? 🧠",
    gradient: 'from-violet-500 to-purple-500'
  },
  { 
    id: 'workout', 
    label: 'Start workout', 
    icon: Dumbbell, 
    message: "I want to work out today - help me with my gym routine 💪",
    gradient: 'from-red-500 to-orange-500'
  },
  { 
    id: 'skills', 
    label: 'My skills', 
    icon: Target, 
    message: "Show my skills and progress",
    gradient: 'from-teal-500 to-cyan-500',
    isNavigation: true,
    path: '/skills'
  },
  { 
    id: 'write', 
    label: 'Write something', 
    icon: PenLine, 
    message: "Help me write something - it could be an email, post, or notes ✍️",
    gradient: 'from-blue-500 to-cyan-500'
  },
  { 
    id: 'create-doc', 
    label: 'Create a doc', 
    icon: FileText, 
    message: "I need help creating a document 📄",
    gradient: 'from-emerald-500 to-green-500'
  },
  { 
    id: 'joke', 
    label: 'Crack a joke', 
    icon: Laugh, 
    message: "Tell me a joke, I need a laugh 😄",
    gradient: 'from-pink-500 to-rose-500'
  },
  { 
    id: 'generate-image', 
    label: 'Generate image', 
    icon: Wand2, 
    message: "I want to generate an image. Let me describe what I'm imagining 🎨",
    gradient: 'from-indigo-500 to-violet-500'
  },
];

export const ChatQuickActions: React.FC<ChatQuickActionsProps> = ({ onAction, className }) => {
  const navigate = useNavigate();

  const handleClick = (action: typeof QUICK_ACTIONS[0]) => {
    if ('isNavigation' in action && action.isNavigation && 'path' in action) {
      navigate(action.path as string);
    } else {
      onAction(action.id, action.message);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn("space-y-3", className)}
    >
      <p className="text-sm text-muted-foreground text-center mb-4">
        What would you like to do?
      </p>
      
      <div className="flex flex-wrap justify-center gap-2 max-w-md mx-auto">
        {QUICK_ACTIONS.map((action, index) => {
          const Icon = action.icon;
          return (
            <motion.div
              key={action.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.08 }}
            >
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleClick(action)}
                className={cn(
                  "rounded-full px-4 h-10 gap-2 text-sm font-medium",
                  "border-border/60 hover:border-primary/50",
                  "bg-card/50 backdrop-blur-sm",
                  "hover:bg-gradient-to-r hover:text-white transition-all duration-300",
                  `hover:${action.gradient}`
                )}
              >
                <Icon className="w-4 h-4" />
                {action.label}
              </Button>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};
