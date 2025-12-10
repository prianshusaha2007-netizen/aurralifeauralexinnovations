import React from 'react';
import { MessageCircle, Brain, Calendar, Settings, Gamepad2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavigationBarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: 'chat', icon: MessageCircle, label: 'Chat' },
  { id: 'play', icon: Gamepad2, label: 'Play' },
  { id: 'routine', icon: Calendar, label: 'Routine' },
  { id: 'memories', icon: Brain, label: 'Memory' },
  { id: 'settings', icon: Settings, label: 'Settings' },
];

export const NavigationBar: React.FC<NavigationBarProps> = ({ activeTab, onTabChange }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-xl border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around py-2 px-4 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'flex flex-col items-center gap-1 py-2 px-4 rounded-xl transition-all duration-300',
                isActive 
                  ? 'text-aura-nav-active' 
                  : 'text-aura-nav-inactive hover:text-foreground'
              )}
            >
              <div className={cn(
                'relative p-2 rounded-xl transition-all duration-300',
                isActive && 'bg-primary/10'
              )}>
                <Icon 
                  className={cn(
                    'w-5 h-5 transition-all duration-300',
                    isActive && 'scale-110'
                  )} 
                />
                {isActive && (
                  <div className="absolute inset-0 rounded-xl bg-primary/20 blur-md -z-10" />
                )}
              </div>
              <span className={cn(
                'text-[10px] font-medium transition-all duration-300',
                isActive && 'font-semibold'
              )}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
