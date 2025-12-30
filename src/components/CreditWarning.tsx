import React from 'react';
import { Button } from '@/components/ui/button';
import { Clock, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CreditWarningProps {
  type: 'soft' | 'limit';
  aiName?: string;
  onContinueTomorrow?: () => void;
  onUpgrade?: () => void;
  className?: string;
}

export const CreditWarning: React.FC<CreditWarningProps> = ({
  type,
  aiName = 'AURRA',
  onContinueTomorrow,
  onUpgrade,
  className
}) => {
  if (type === 'soft') {
    return (
      <div className={cn(
        "flex flex-col gap-2 p-3 rounded-2xl bg-muted/50 border border-border/50 text-sm",
        className
      )}>
        <p className="text-muted-foreground">
          We've talked quite a bit today 🙂
          <br />
          If you want, we can continue tomorrow — or unlock more time together.
        </p>
        <div className="flex gap-2 mt-1">
          <Button 
            variant="ghost" 
            size="sm" 
            className="rounded-full text-xs"
            onClick={onContinueTomorrow}
          >
            <Clock className="w-3 h-3 mr-1" />
            Continue tomorrow
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="rounded-full text-xs border-primary/30 text-primary hover:bg-primary/10"
            onClick={onUpgrade}
          >
            <Sparkles className="w-3 h-3 mr-1" />
            Unlock more time
          </Button>
        </div>
      </div>
    );
  }

  // Limit reached
  return (
    <div className={cn(
      "flex flex-col gap-2 p-4 rounded-2xl bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/20 text-sm",
      className
    )}>
      <p className="text-foreground">
        I want to stay with you longer.
        <br />
        For now, let's pause here — or you can unlock unlimited conversations and go deeper anytime.
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
          Upgrade {aiName}
        </Button>
      </div>
    </div>
  );
};
