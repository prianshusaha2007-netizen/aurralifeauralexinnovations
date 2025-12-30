import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Check, Heart, Sparkles, Brain, Mic, Image, Zap, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCredits } from '@/hooks/useCredits';
import { useAura } from '@/contexts/AuraContext';
import { toast } from 'sonner';

interface UpgradeSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FREE_FEATURES = [
  { icon: MessageCircle, label: 'Daily conversations' },
  { icon: Heart, label: 'Emotional support' },
  { icon: Sparkles, label: 'Basic reminders' },
  { icon: Sparkles, label: 'Routine overview' },
  { icon: Sparkles, label: 'Companion persona' },
];

const PREMIUM_FEATURES = [
  { icon: MessageCircle, label: 'Unlimited conversations', highlight: true },
  { icon: Brain, label: 'Longer, deeper reasoning', highlight: true },
  { icon: Brain, label: 'Full memory graph' },
  { icon: Zap, label: 'Skill mentoring (coding, gym, creative)' },
  { icon: Mic, label: 'Voice replies' },
  { icon: Image, label: 'Image & document tools' },
  { icon: Zap, label: 'Faster responses' },
];

export const UpgradeSheet: React.FC<UpgradeSheetProps> = ({ open, onOpenChange }) => {
  const { upgradeToPremium } = useCredits();
  const { userProfile } = useAura();
  const [isUpgrading, setIsUpgrading] = useState(false);

  const aiName = userProfile.aiName || 'AURRA';

  const handleUpgrade = async () => {
    setIsUpgrading(true);
    
    // Simulate payment flow (in real app, integrate with payment provider)
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const success = await upgradeToPremium();
    
    if (success) {
      toast.success(`Thank you 🤍 I'm here with you — without limits now.`);
      onOpenChange(false);
    } else {
      toast.error("Looks like that didn't go through. No worries — we can try again anytime.");
    }
    
    setIsUpgrading(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
        <SheetHeader className="text-center pb-4">
          <div className="flex justify-center mb-3">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20">
              <Heart className="w-8 h-8 text-primary" />
            </div>
          </div>
          <SheetTitle className="text-2xl font-bold">
            Stay with {aiName} longer 🤍
          </SheetTitle>
          <p className="text-muted-foreground text-sm mt-2">
            You've been building a rhythm here. Upgrading helps me stay more present, remember more, and go deeper with you.
          </p>
        </SheetHeader>

        <div className="mt-6 space-y-6 overflow-y-auto max-h-[50vh] pb-4">
          {/* Free Plan */}
          <div className="rounded-2xl border border-border p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm font-semibold text-muted-foreground">🟢 Free</span>
            </div>
            <div className="space-y-2">
              {FREE_FEATURES.map((feature, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="w-4 h-4 text-muted-foreground/60" />
                  <span>{feature.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Premium Plan */}
          <div className="rounded-2xl border-2 border-primary bg-gradient-to-br from-primary/5 to-accent/5 p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm font-semibold text-primary">🔵 {aiName} Plus</span>
              <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                Recommended
              </span>
            </div>
            <div className="space-y-2">
              {PREMIUM_FEATURES.map((feature, i) => (
                <div 
                  key={i} 
                  className={cn(
                    "flex items-center gap-2 text-sm",
                    feature.highlight ? "text-foreground font-medium" : "text-muted-foreground"
                  )}
                >
                  <Check className={cn(
                    "w-4 h-4",
                    feature.highlight ? "text-primary" : "text-muted-foreground/60"
                  )} />
                  <span>{feature.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="pt-4 border-t border-border space-y-3">
          <Button 
            className="w-full h-12 rounded-xl text-base font-semibold bg-primary hover:bg-primary/90"
            onClick={handleUpgrade}
            disabled={isUpgrading}
          >
            {isUpgrading ? (
              <>
                <Sparkles className="w-5 h-5 mr-2 animate-pulse" />
                Processing...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Unlock {aiName} Plus
              </>
            )}
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            ₹49–₹299/month · Cancel anytime · No pressure
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
};
