import React from 'react';
import { MessageSquare, Bell, MapPin, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export type QuickNavTab = 'chat' | 'reminders' | 'services' | 'menu';

interface GlobalBottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onMenuClick: () => void;
  className?: string;
}

const navItems: { id: QuickNavTab; icon: React.ElementType; label: string }[] = [
  { id: 'chat', icon: MessageSquare, label: 'Chat' },
  { id: 'reminders', icon: Bell, label: 'Reminders' },
  { id: 'services', icon: MapPin, label: 'Services' },
  { id: 'menu', icon: Menu, label: 'Menu' },
];

export const GlobalBottomNav: React.FC<GlobalBottomNavProps> = ({
  activeTab,
  onTabChange,
  onMenuClick,
  className,
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
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50',
        'bg-card/95 backdrop-blur-xl border-t border-border/50',
        'safe-area-inset-bottom',
        className
      )}
    >
      <div className="flex items-center justify-around py-2 px-4 max-w-lg mx-auto">
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
                'flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-200',
                'min-w-[64px] relative',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="bottomNavIndicator"
                  className="absolute inset-0 bg-primary/10 rounded-xl"
                  transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                />
              )}
              <Icon className={cn('w-5 h-5 relative z-10', isActive && 'text-primary')} />
              <span className={cn('text-xs font-medium relative z-10', isActive && 'text-primary')}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </motion.nav>
  );
};
