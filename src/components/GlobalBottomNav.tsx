import React from 'react';
import { Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

interface GlobalBottomNavProps {
  onMenuClick: () => void;
  className?: string;
}

// Minimal bottom nav - Chat is the cockpit, this just provides access to settings
export const GlobalBottomNav: React.FC<GlobalBottomNavProps> = ({
  onMenuClick,
  className,
}) => {
  return (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', damping: 30, stiffness: 400 }}
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50',
        'bg-card/80 backdrop-blur-lg border-t border-border/30',
        'safe-area-inset-bottom',
        className
      )}
    >
      <div className="flex items-center justify-end py-2 px-4 max-w-lg mx-auto">
        <Button
          variant="ghost"
          size="sm"
          onClick={onMenuClick}
          className="text-muted-foreground hover:text-foreground gap-2"
        >
          <Menu className="w-5 h-5" />
          <span className="text-sm">More</span>
        </Button>
      </div>
    </motion.nav>
  );
};
