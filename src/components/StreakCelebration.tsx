import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Trophy, Star, Crown, Sparkles, PartyPopper } from 'lucide-react';
import { Button } from '@/components/ui/button';
import confetti from 'canvas-confetti';

interface StreakCelebrationProps {
  streak: number;
  isOpen: boolean;
  onClose: () => void;
}

interface Milestone {
  days: number;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  gradient: string;
  reward: string;
}

const milestones: Milestone[] = [
  { days: 7, title: 'Week Warrior!', subtitle: 'First week conquered!', icon: Star, gradient: 'from-amber-500 to-orange-500', reward: '⭐ Bronze Badge' },
  { days: 14, title: 'Two Week Champion!', subtitle: 'Unstoppable momentum!', icon: Flame, gradient: 'from-orange-500 to-red-500', reward: '🔥 Silver Badge' },
  { days: 30, title: 'Monthly Master!', subtitle: 'A whole month strong!', icon: Trophy, gradient: 'from-purple-500 to-pink-500', reward: '🏆 Gold Badge' },
  { days: 60, title: 'Double Month Legend!', subtitle: 'Two months of dedication!', icon: Crown, gradient: 'from-blue-500 to-purple-500', reward: '👑 Platinum Badge' },
  { days: 100, title: 'Century Champion!', subtitle: '100 days of excellence!', icon: Crown, gradient: 'from-emerald-500 to-teal-500', reward: '💎 Diamond Badge' },
  { days: 365, title: 'Year Legend!', subtitle: 'A full year of greatness!', icon: PartyPopper, gradient: 'from-rose-500 to-purple-600', reward: '🌟 Legendary Badge' },
];

export const StreakCelebration: React.FC<StreakCelebrationProps> = ({ streak, isOpen, onClose }) => {
  const [currentMilestone, setCurrentMilestone] = useState<Milestone | null>(null);

  useEffect(() => {
    // Find if user just hit a milestone
    const milestone = milestones.find(m => m.days === streak);
    if (milestone) {
      setCurrentMilestone(milestone);
    }
  }, [streak]);

  useEffect(() => {
    if (isOpen && currentMilestone) {
      // Trigger confetti explosion
      const duration = 3000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          clearInterval(interval);
          return;
        }

        const particleCount = 50 * (timeLeft / duration);

        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
          colors: ['#a855f7', '#ec4899', '#f97316', '#fbbf24'],
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
          colors: ['#a855f7', '#ec4899', '#f97316', '#fbbf24'],
        });
      }, 250);

      return () => clearInterval(interval);
    }
  }, [isOpen, currentMilestone]);

  if (!currentMilestone) return null;

  const Icon = currentMilestone.icon;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-lg"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.5, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.5, y: 50 }}
            transition={{ type: 'spring', bounce: 0.5 }}
            className="relative w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Animated background rings */}
            <motion.div
              className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${currentMilestone.gradient} opacity-20 blur-xl`}
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
            />
            
            <div className={`relative rounded-3xl bg-gradient-to-br ${currentMilestone.gradient} p-1 shadow-2xl`}>
              <div className="bg-background rounded-[22px] p-6 text-center space-y-4">
                {/* Animated Icon */}
                <motion.div
                  initial={{ rotate: -180, scale: 0 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ delay: 0.3, type: 'spring', bounce: 0.6 }}
                  className={`mx-auto w-24 h-24 rounded-full bg-gradient-to-br ${currentMilestone.gradient} flex items-center justify-center shadow-lg`}
                >
                  <Icon className="w-12 h-12 text-white" />
                </motion.div>

                {/* Streak Number */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Flame className="w-8 h-8 text-orange-500" />
                    <span className="text-5xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                      {streak}
                    </span>
                  </div>
                  <p className="text-lg text-muted-foreground">Day Streak!</p>
                </motion.div>

                {/* Title */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <h2 className={`text-2xl font-bold bg-gradient-to-r ${currentMilestone.gradient} bg-clip-text text-transparent`}>
                    {currentMilestone.title}
                  </h2>
                  <p className="text-muted-foreground">{currentMilestone.subtitle}</p>
                </motion.div>

                {/* Reward */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 }}
                  className="py-3 px-4 bg-muted/50 rounded-xl"
                >
                  <div className="flex items-center justify-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-500" />
                    <span className="font-semibold">Reward: {currentMilestone.reward}</span>
                  </div>
                </motion.div>

                {/* Motivational Text */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="text-sm text-muted-foreground italic"
                >
                  "Consistency beats intensity. You're proving it every day!"
                </motion.p>

                {/* Action Button */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                >
                  <Button 
                    onClick={onClose}
                    className={`w-full bg-gradient-to-r ${currentMilestone.gradient} text-white hover:opacity-90`}
                  >
                    Keep Going! 🚀
                  </Button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Helper hook to check and trigger celebrations
export const useStreakCelebration = (streak: number) => {
  const [showCelebration, setShowCelebration] = useState(false);
  
  useEffect(() => {
    const celebratedMilestones = JSON.parse(localStorage.getItem('aura-celebrated-milestones') || '[]');
    const milestone = milestones.find(m => m.days === streak);
    
    if (milestone && !celebratedMilestones.includes(streak)) {
      setShowCelebration(true);
      // Mark as celebrated
      localStorage.setItem('aura-celebrated-milestones', JSON.stringify([...celebratedMilestones, streak]));
    }
  }, [streak]);
  
  return { showCelebration, setShowCelebration };
};
