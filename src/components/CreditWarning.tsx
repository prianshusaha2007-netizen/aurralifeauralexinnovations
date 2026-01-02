import React from 'react';
import { Button } from '@/components/ui/button';
import { Clock, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CreditWarningProps {
  type: 'soft' | 'limit';
  aiName?: string;
  onContinueTomorrow?: () => void;
  onUpgrade?: () => void;
  onStayLonger?: () => void;
  className?: string;
}

/**
 * Credit warning component with WhatsApp-style friendly messaging.
 * UX Rule: Instead of showing technical credit info, AURRA says calm, human messages.
 */
export const CreditWarning: React.FC<CreditWarningProps> = ({
  type,
  aiName = 'AURRA',
  onContinueTomorrow,
  onUpgrade,
  onStayLonger,
  className
}) => {
  // Soft warning at ~80% usage - casual, no pressure
  if (type === 'soft') {
    return (
      <div className={cn(
        "flex flex-col gap-2 p-3 rounded-2xl bg-muted/50 border border-border/50 text-sm animate-fade-in",
        className
      )}>
        <p className="text-foreground">
          We've talked quite a bit today 🙂
          <br />
          <span className="text-muted-foreground">
            Want to continue tomorrow or stay longer?
          </span>
        </p>
        <div className="flex gap-2 mt-1">
          <Button 
            variant="ghost" 
            size="sm" 
            className="rounded-full text-xs"
            onClick={onContinueTomorrow}
          >
            <Clock className="w-3 h-3 mr-1" />
            Continue Tomorrow
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="rounded-full text-xs border-primary/30 text-primary hover:bg-primary/10"
            onClick={onStayLonger || onUpgrade}
          >
            <Sparkles className="w-3 h-3 mr-1" />
            Stay longer
          </Button>
        </div>
      </div>
    );
  }

  // Limit reached - friendly pause message (no technical jargon)
  return (
    <div className={cn(
      "flex flex-col gap-2 p-4 rounded-2xl bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/20 text-sm animate-fade-in",
      className
    )}>
      <p className="text-foreground">
        Let's pause here for today 🙂
        <br />
        <span className="text-muted-foreground">
          Want to continue tomorrow or upgrade?
        </span>
      </p>
      <div className="flex gap-2 mt-2">
        <Button 
          variant="ghost" 
          size="sm" 
          className="rounded-full text-xs"
          onClick={onContinueTomorrow}
        >
          <Clock className="w-3 h-3 mr-1" />
          Come back tomorrow
        </Button>
        <Button 
          size="sm" 
          className="rounded-full text-xs bg-primary hover:bg-primary/90"
          onClick={onUpgrade}
        >
          <Sparkles className="w-3 h-3 mr-1" />
          Upgrade
        </Button>
      </div>
    </div>
  );
};
