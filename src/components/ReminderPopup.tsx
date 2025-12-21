import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Clock, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Reminder } from '@/hooks/useReminders';
import { cn } from '@/lib/utils';

interface ReminderPopupProps {
  reminder: Reminder | null;
  onSnooze: (minutes: number) => void;
  onComplete: () => void;
  onDismiss: () => void;
}

const snoozeOptions = [
  { label: '5 min', value: 5 },
  { label: '10 min', value: 10 },
  { label: '30 min', value: 30 },
];

const friendlyMessages: Record<string, string[]> = {
  default: ['Hey. Time for this.', 'Don\'t forget!', 'Quick reminder.'],
  water: ['Stay hydrated!', 'Drink some water.', 'Water break time!'],
  medicine: ['Time for your medicine.', 'Don\'t skip this one.', 'Medicine reminder.'],
  call: ['Time to make that call.', 'Don\'t forget to call.', 'Calling time!'],
  workout: ['Time to move!', 'Get that workout in.', 'Exercise time!'],
  alarm: ['Wake up!', 'Rise and shine!', 'New day awaits.'],
};

export const ReminderPopup: React.FC<ReminderPopupProps> = ({
  reminder,
  onSnooze,
  onComplete,
  onDismiss,
}) => {
  if (!reminder) return null;

  const getRandomMessage = () => {
    const category = reminder.title.toLowerCase();
    let messages = friendlyMessages.default;
    
    if (category.includes('water')) messages = friendlyMessages.water;
    else if (category.includes('medicine')) messages = friendlyMessages.medicine;
    else if (category.includes('call')) messages = friendlyMessages.call;
    else if (category.includes('workout') || category.includes('exercise')) messages = friendlyMessages.workout;
    else if (reminder.category === 'alarm') messages = friendlyMessages.alarm;
    
    return messages[Math.floor(Math.random() * messages.length)];
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-xl flex items-center justify-center p-6"
      >
        <motion.div
          initial={{ scale: 0.8, y: 50 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.8, y: 50 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="w-full max-w-sm"
        >
          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onDismiss}
            className="absolute top-4 right-4 rounded-full"
          >
            <X className="w-5 h-5" />
          </Button>

          {/* Icon with glow */}
          <div className="flex justify-center mb-8">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className={cn(
                'w-24 h-24 rounded-full flex items-center justify-center',
                'aura-gradient aura-glow-strong'
              )}
            >
              <span className="text-4xl">{reminder.icon}</span>
            </motion.div>
          </div>

          {/* Content */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Bell className="w-4 h-4" />
              <span className="text-sm uppercase tracking-wider">Reminder</span>
            </div>

            <h2 className="text-2xl font-bold text-foreground">
              {reminder.title}
            </h2>

            <p className="text-lg text-muted-foreground">
              {getRandomMessage()}
            </p>

            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>{reminder.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-8 space-y-4">
            {/* Snooze options */}
            <div className="flex justify-center gap-2">
              {snoozeOptions.map((option) => (
                <Button
                  key={option.value}
                  variant="outline"
                  size="sm"
                  onClick={() => onSnooze(option.value)}
                  className="rounded-full"
                >
                  <Clock className="w-3 h-3 mr-1" />
                  {option.label}
                </Button>
              ))}
            </div>

            {/* Done button */}
            <Button
              onClick={onComplete}
              className="w-full h-14 text-lg rounded-2xl aura-gradient"
            >
              <Check className="w-5 h-5 mr-2" />
              Done
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
