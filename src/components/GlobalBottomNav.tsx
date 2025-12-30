import React from 'react';
import { MessageSquare, Bell, Compass, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export type QuickNavTab = 'chat' | 'reminders' | 'services' | 'menu';

interface GlobalBottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onMenuClick: () => void;
  className?: string;
  upcomingRemindersCount?: number;
}

const navItems: { id: QuickNavTab; icon: React.ElementType; label: string }[] = [
  { id: 'chat', icon: MessageSquare, label: 'Chat' },
  { id: 'reminders', icon: Bell, label: 'Reminders' },
  { id: 'services', icon: Compass, label: 'Explore' },
  { id: 'menu', icon: Menu, label: 'More' },
];

export const GlobalBottomNav: React.FC<GlobalBottomNavProps> = ({
  activeTab,
  onTabChange,
  onMenuClick,
  className,
  upcomingRemindersCount = 0,
}) => {
  const handleClick = (id: QuickNavTab) => {
    if (id === 'menu') {
      onMenuClick();
    } else {
      onTabChange(id);
    }
  };

  return (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', damping: 30, stiffness: 400 }}
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50',
        'bg-card/98 backdrop-blur-lg border-t border-border/30',
        'safe-area-inset-bottom',
        className
      )}
    >
      <div className="flex items-center justify-around py-2 px-2 max-w-lg mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id || 
            (item.id === 'reminders' && activeTab === 'reminders') ||
            (item.id === 'services' && activeTab === 'services');

          return (
            <button
              key={item.id}
              onClick={() => handleClick(item.id)}
              className={cn(
                'flex flex-col items-center justify-center gap-1 py-2 px-5 rounded-2xl transition-all duration-200',
                'min-w-[72px] min-h-[56px] relative',
                'active:scale-95',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="bottomNavIndicator"
                  className="absolute inset-0 bg-primary/8 rounded-2xl"
                  transition={{ type: 'spring', damping: 30, stiffness: 400 }}
                />
              )}
              <div className="relative">
                <Icon className={cn(
                  'w-5 h-5 relative z-10 transition-transform duration-200',
                  isActive && 'scale-110'
                )} />
                {item.id === 'reminders' && upcomingRemindersCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 flex items-center justify-center bg-primary text-primary-foreground text-[10px] font-bold rounded-full z-20"
                  >
                    {upcomingRemindersCount > 9 ? '9+' : upcomingRemindersCount}
                  </motion.span>
                )}
              </div>
              <span className={cn(
                'text-[11px] font-semibold relative z-10 tracking-wide',
                isActive && 'text-primary'
              )}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </motion.nav>
  );
};