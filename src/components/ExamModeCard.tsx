import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Target, Clock, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import auraAvatar from '@/assets/aura-avatar.jpeg';

interface ExamModeCardProps {
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  onChoice: (choice: string) => void;
  onSendMessage: (message: string) => void;
  onDismiss: () => void;
}

export const ExamModeCard: React.FC<ExamModeCardProps> = ({
  timeOfDay,
  onChoice,
  onSendMessage,
  onDismiss,
}) => {
  const [isTyping, setIsTyping] = useState(true);
  const [step, setStep] = useState<'initial' | 'subject' | 'done'>('initial');
  const [selectedSubject, setSelectedSubject] = useState('');

  React.useEffect(() => {
    const timer = setTimeout(() => setIsTyping(false), 1000);
    return () => clearTimeout(timer);
  }, [step]);

  const getMessage = () => {
    switch (step) {
      case 'initial':
        if (timeOfDay === 'morning') {
          return "Exam week, right.\nLet's keep this calm and focused.";
        } else if (timeOfDay === 'evening' || timeOfDay === 'night') {
          return "You've studied enough for today.\nWant to revise lightly or stop?";
        }
        return "How's the studying going?\nNeed help with anything specific?";
      case 'subject':
        return "Good choice. What's the first paper?";
      case 'done':
        return "You showed up today. That counts.\nTomorrow, we'll continue from here.";
    }
  };

  const getOptions = () => {
    switch (step) {
      case 'initial':
        if (timeOfDay === 'morning') {
          return [
            { id: 'plan', label: 'Make a light plan', icon: Target },
            { id: 'one', label: 'One subject at a time', icon: BookOpen },
          ];
        } else if (timeOfDay === 'evening' || timeOfDay === 'night') {
          return [
            { id: 'revise', label: 'Light revision', icon: BookOpen },
            { id: 'stop', label: 'Stop for today', icon: CheckCircle },
          ];
        }
        return [
          { id: 'help', label: 'Help with a topic', icon: BookOpen },
          { id: 'break', label: 'Take a break', icon: Clock },
        ];
      case 'subject':
        return []; // Will show input instead
      default:
        return [];
    }
  };

  const handleChoice = (choice: string) => {
    if (choice === 'one') {
      setStep('subject');
      setIsTyping(true);
    } else if (choice === 'stop' || choice === 'revise') {
      onChoice(choice);
      setStep('done');
      setIsTyping(true);
      setTimeout(onDismiss, 2500);
    } else {
      onChoice(choice);
      onDismiss();
    }
  };

  const handleSubjectSubmit = () => {
    if (selectedSubject.trim()) {
      onSendMessage(`I want to focus on ${selectedSubject} today`);
      onDismiss();
    }
  };

  const options = getOptions();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-4"
    >
      {/* AURRA Message */}
      <div className="flex gap-3 mb-4">
        <div className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-blue-500/20 shrink-0">
          <img src={auraAvatar} alt="AURRA" className="w-full h-full object-cover" />
        </div>
        
        <div className="flex-1">
          <motion.div
            key={step}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[85%]"
          >
            {isTyping ? (
              <div className="flex gap-1.5 py-1">
                <span className="w-2 h-2 bg-blue-400/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-blue-400/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-blue-400/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            ) : (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-blue-500">
                  <BookOpen className="w-4 h-4" />
                  <span className="text-xs font-medium">Study Mode</span>
                </div>
                <p className="text-foreground whitespace-pre-line">
                  {getMessage()}
                </p>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Options */}
      <AnimatePresence mode="wait">
        {!isTyping && step === 'initial' && options.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ delay: 0.1 }}
            className="ml-12 flex gap-2 flex-wrap"
          >
            {options.map((option) => {
              const Icon = option.icon;
              return (
                <motion.button
                  key={option.id}
                  onClick={() => handleChoice(option.id)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 transition-all font-medium text-sm"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Icon className="w-4 h-4" />
                  {option.label}
                </motion.button>
              );
            })}
          </motion.div>
        )}

        {!isTyping && step === 'subject' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="ml-12 flex gap-2 items-center"
          >
            <input
              type="text"
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              placeholder="e.g., Math, Physics..."
              className="rounded-full px-4 py-2.5 bg-card border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleSubjectSubmit()}
            />
            <Button 
              onClick={handleSubjectSubmit}
              disabled={!selectedSubject.trim()}
              className="rounded-full"
              size="sm"
            >
              Start
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
