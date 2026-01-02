import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Coffee, Zap, Leaf, HelpCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const DAILY_PLAN_KEY = 'aurra-daily-plan';

interface DailyPlan {
  plan: string;
  intensity: 'light' | 'normal' | 'busy' | 'unknown';
  keywords: string[];
  timestamp: string;
}

interface DailyPlanIndicatorProps {
  className?: string;
  showAnimation?: boolean;
}

const intensityConfig = {
  light: {
    icon: Leaf,
    label: 'Light Day',
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/20',
    gradient: 'from-green-500/20 to-green-500/5',
    emoji: '🍃',
  },
  normal: {
    icon: Coffee,
    label: 'Steady Day',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20',
    gradient: 'from-blue-500/20 to-blue-500/5',
    emoji: '☕',
  },
  busy: {
    icon: Zap,
    label: 'Busy Day',
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/20',
    gradient: 'from-amber-500/20 to-amber-500/5',
    emoji: '⚡',
  },
  unknown: {
    icon: HelpCircle,
    label: 'Flexible',
    color: 'text-muted-foreground',
    bgColor: 'bg-muted/50',
    borderColor: 'border-muted',
    gradient: 'from-muted/20 to-muted/5',
    emoji: '✨',
  },
};

export const DailyPlanIndicator: React.FC<DailyPlanIndicatorProps> = ({ 
  className,
  showAnimation = true,
}) => {
  const [plan, setPlan] = useState<DailyPlan | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [showAdaptAnimation, setShowAdaptAnimation] = useState(false);

  useEffect(() => {
    const checkPlan = () => {
      const today = new Date().toISOString().split('T')[0];
      const savedPlan = localStorage.getItem(DAILY_PLAN_KEY);
      
      if (savedPlan) {
        try {
          const parsed = JSON.parse(savedPlan);
          if (parsed.timestamp?.startsWith(today)) {
            setPlan(parsed);
            setIsVisible(true);
          } else {
            setPlan(null);
            setIsVisible(false);
          }
        } catch {
          setPlan(null);
          setIsVisible(false);
        }
      }
    };

    checkPlan();
    
    // Listen for storage changes
    const handleStorage = () => checkPlan();
    window.addEventListener('storage', handleStorage);
    
    // Check periodically
    const interval = setInterval(checkPlan, 5000);
    
    return () => {
      window.removeEventListener('storage', handleStorage);
      clearInterval(interval);
    };
  }, []);

  // Trigger adapt animation when plan changes
  useEffect(() => {
    if (plan && showAnimation) {
      setShowAdaptAnimation(true);
      const timer = setTimeout(() => setShowAdaptAnimation(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [plan?.timestamp, showAnimation]);

  if (!isVisible || !plan) return null;

  const config = intensityConfig[plan.intensity];
  const Icon = config.icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.95 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className={cn(
          'relative overflow-hidden rounded-full border px-3 py-1.5',
          config.bgColor,
          config.borderColor,
          className
        )}
      >
        {/* Shimmer animation on adapt */}
        <AnimatePresence>
          {showAdaptAnimation && (
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: '200%' }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1, ease: 'easeInOut' }}
              className={cn(
                'absolute inset-0 bg-gradient-to-r',
                config.gradient,
                'via-white/30'
              )}
            />
          )}
        </AnimatePresence>

        <div className="relative flex items-center gap-2">
          <motion.div
            animate={showAdaptAnimation ? { 
              scale: [1, 1.2, 1],
              rotate: [0, 10, -10, 0],
            } : {}}
            transition={{ duration: 0.5 }}
          >
            <Icon className={cn('w-3.5 h-3.5', config.color)} />
          </motion.div>
          
          <span className={cn('text-xs font-medium', config.color)}>
            {config.label}
          </span>
          
          {plan.keywords.length > 0 && (
            <span className="text-xs text-muted-foreground">
              • {plan.keywords.slice(0, 2).join(', ')}
            </span>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

/**
 * Compact badge version for header
 */
export const DailyPlanBadge: React.FC<{ className?: string }> = ({ className }) => {
  const [plan, setPlan] = useState<DailyPlan | null>(null);

  useEffect(() => {
    const checkPlan = () => {
      const today = new Date().toISOString().split('T')[0];
      const savedPlan = localStorage.getItem(DAILY_PLAN_KEY);
      
      if (savedPlan) {
        try {
          const parsed = JSON.parse(savedPlan);
          if (parsed.timestamp?.startsWith(today)) {
            setPlan(parsed);
          }
        } catch {}
      }
    };

    checkPlan();
    const interval = setInterval(checkPlan, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!plan) return null;

  const config = intensityConfig[plan.intensity];

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={cn(
        'flex items-center justify-center w-6 h-6 rounded-full',
        config.bgColor,
        className
      )}
      title={`${config.label}: ${plan.plan}`}
    >
      <span className="text-xs">{config.emoji}</span>
    </motion.div>
  );
};

/**
 * Full card showing plan adaptation
 */
export const DailyPlanAdaptCard: React.FC<{
  onDismiss?: () => void;
  className?: string;
}> = ({ onDismiss, className }) => {
  const [plan, setPlan] = useState<DailyPlan | null>(null);
  const [showCard, setShowCard] = useState(false);

  useEffect(() => {
    const checkPlan = () => {
      const today = new Date().toISOString().split('T')[0];
      const savedPlan = localStorage.getItem(DAILY_PLAN_KEY);
      const shownKey = `aurra-plan-card-shown-${today}`;
      
      if (savedPlan && !localStorage.getItem(shownKey)) {
        try {
          const parsed = JSON.parse(savedPlan);
          if (parsed.timestamp?.startsWith(today)) {
            setPlan(parsed);
            setShowCard(true);
            // Auto-hide after 5 seconds
            setTimeout(() => {
              setShowCard(false);
              localStorage.setItem(shownKey, 'true');
            }, 5000);
          }
        } catch {}
      }
    };

    const timer = setTimeout(checkPlan, 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem(`aurra-plan-card-shown-${today}`, 'true');
    setShowCard(false);
    onDismiss?.();
  };

  if (!showCard || !plan) return null;

  const config = intensityConfig[plan.intensity];
  const Icon = config.icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        className={cn(
          'relative overflow-hidden rounded-2xl border p-4',
          config.bgColor,
          config.borderColor,
          className
        )}
      >
        {/* Animated background */}
        <motion.div
          className={cn(
            'absolute inset-0 bg-gradient-to-br opacity-50',
            config.gradient
          )}
          animate={{
            backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
        />

        <div className="relative">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <motion.div
                animate={{ 
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0],
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className={cn('p-2 rounded-full', config.bgColor)}
              >
                <Icon className={cn('w-5 h-5', config.color)} />
              </motion.div>
              <div>
                <p className={cn('font-medium', config.color)}>
                  {config.label} Mode
                </p>
                <p className="text-xs text-muted-foreground">
                  Adapting to your plan
                </p>
              </div>
            </div>
            
            <button
              onClick={handleDismiss}
              className="p-1 rounded-full hover:bg-muted/50 transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-foreground/80">
              "{plan.plan}"
            </p>
            
            {plan.keywords.length > 0 && (
              <div className="flex gap-1.5 flex-wrap">
                {plan.keywords.map((keyword, i) => (
                  <motion.span
                    key={keyword}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className={cn(
                      'px-2 py-0.5 rounded-full text-xs',
                      config.bgColor,
                      config.color
                    )}
                  >
                    {keyword}
                  </motion.span>
                ))}
              </div>
            )}
          </div>

          <motion.div
            initial={{ width: '100%' }}
            animate={{ width: '0%' }}
            transition={{ duration: 5, ease: 'linear' }}
            className={cn('absolute bottom-0 left-0 h-0.5', config.color.replace('text-', 'bg-'))}
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
