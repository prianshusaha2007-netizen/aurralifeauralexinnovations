import React from 'react';
import { Search, Youtube, ShoppingCart, UtensilsCrossed, Package, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface ActionItem {
  id: string;
  name: string;
  icon: React.ElementType;
  color: string;
  action: 'simulate' | 'link';
  url?: string;
}

const actions: ActionItem[] = [
  { id: 'google', name: 'Google', icon: Search, color: 'bg-blue-500', action: 'simulate' },
  { id: 'youtube', name: 'YouTube', icon: Youtube, color: 'bg-red-500', action: 'simulate' },
  { id: 'blinkit', name: 'Blinkit', icon: Package, color: 'bg-yellow-500', action: 'link', url: 'https://blinkit.com' },
  { id: 'zomato', name: 'Zomato', icon: UtensilsCrossed, color: 'bg-rose-500', action: 'link', url: 'https://www.zomato.com' },
  { id: 'amazon', name: 'Amazon', icon: ShoppingCart, color: 'bg-orange-500', action: 'link', url: 'https://www.amazon.in' },
];

interface ActionsBarProps {
  onActionSelect?: (action: string, message: string) => void;
}

export const ActionsBar: React.FC<ActionsBarProps> = ({ onActionSelect }) => {
  const { toast } = useToast();

  const handleAction = (action: ActionItem) => {
    if (action.action === 'link' && action.url) {
      toast({
        title: `Opening ${action.name}...`,
        description: "AURA can help you order or shop!",
      });
      window.open(action.url, '_blank');
    } else if (action.action === 'simulate') {
      const messages: Record<string, string> = {
        google: "I can search this on Google for you! What do you want to find?",
        youtube: "Want me to open YouTube? What are we watching today?",
      };
      if (onActionSelect) {
        onActionSelect(action.id, messages[action.id] || "How can I help with this?");
      } else {
        toast({
          title: `${action.name} Action`,
          description: messages[action.id] || "Opening soon...",
        });
      }
    }
  };

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 px-1 scrollbar-hide">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <Button
            key={action.id}
            variant="ghost"
            size="sm"
            onClick={() => handleAction(action)}
            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/50 hover:bg-muted border border-border/50 transition-all"
          >
            <div className={`w-5 h-5 rounded-full ${action.color} flex items-center justify-center`}>
              <Icon className="w-3 h-3 text-white" />
            </div>
            <span className="text-xs font-medium">{action.name}</span>
            {action.action === 'link' && <ExternalLink className="w-3 h-3 text-muted-foreground" />}
          </Button>
        );
      })}
    </div>
  );
};
