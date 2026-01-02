import React, { useState, useContext } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Check, Heart, Sparkles, Star, Rocket, Crown, Loader2, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCredits, SubscriptionTier } from '@/hooks/useCredits';
import { AuraContext } from '@/contexts/AuraContext';
import { useRelationshipEvolution } from '@/hooks/useRelationshipEvolution';
import { useRazorpay, PaymentMode } from '@/hooks/useRazorpay';
import { useAuth } from '@/hooks/useAuth';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface UpgradeSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Plan configuration matching the spec exactly
const TIER_CONFIG: Record<SubscriptionTier, {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  price: string;
  priceValue: number;
  color: string;
  tagline: string;
  description: string;
  features: { label: string; highlight?: boolean }[];
}> = {
  core: {
    name: 'Free',
    icon: Heart,
    price: 'Free',
    priceValue: 0,
    color: 'text-muted-foreground',
    tagline: 'Light use',
    description: 'For checking in, quick chats, and getting a feel for AURRA.',
    features: [
      { label: 'Daily conversations (limited)' },
      { label: 'Basic reminders' },
      { label: 'Short-term memory' },
      { label: 'Calm responses' },
    ],
  },
  basic: {
    name: 'Basic',
    icon: Star,
    price: '₹99/month',
    priceValue: 99,
    color: 'text-blue-500',
    tagline: 'For students',
    description: 'For regular check-ins, routines, and staying consistent.',
    features: [
      { label: 'More daily conversations', highlight: true },
      { label: 'Daily routine & hydration' },
      { label: 'Medium-depth replies' },
      { label: 'Memory across days', highlight: true },
      { label: 'Light image generation' },
    ],
  },
  plus: {
    name: 'Plus',
    icon: Sparkles,
    price: '₹199/month',
    priceValue: 199,
    color: 'text-primary',
    tagline: 'Most popular',
    description: 'Most people choose this.',
    features: [
      { label: 'Long reasoning & explanations', highlight: true },
      { label: 'Coding & learning help', highlight: true },
      { label: 'Strong memory continuity' },
      { label: 'Image + document creation' },
      { label: 'Faster responses', highlight: true },
    ],
  },
  pro: {
    name: 'Pro',
    icon: Crown,
    price: '₹299/month',
    priceValue: 299,
    color: 'text-amber-500',
    tagline: 'Power users',
    description: 'For founders and power users who stay connected all day.',
    features: [
      { label: 'Everything in Plus', highlight: true },
      { label: 'Highest daily access', highlight: true },
      { label: 'Deep memory & recall' },
      { label: 'Priority response speed' },
      { label: 'Full Life-OS features', highlight: true },
    ],
  },
};

export const UpgradeSheet: React.FC<UpgradeSheetProps> = ({ open, onOpenChange }) => {
  const { upgradeToPremium, tier: currentTier } = useCredits();
  const { upgradeTier, recordUpgradePrompt, engagement } = useRelationshipEvolution();
  const auraContext = useContext(AuraContext);
  const userProfile = auraContext?.userProfile ?? { name: 'User', aiName: 'AURRA' };
  const { user } = useAuth();
  const { initiatePayment, initiateSubscription, isLoading: isPaymentLoading, isReady: isPaymentReady } = useRazorpay();
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier>('plus');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('subscription');

  const aiName = userProfile.aiName ?? 'AURRA';
  const userName = userProfile.name ?? 'User';
  const displayCurrentTier = engagement?.subscriptionTier || currentTier || 'core';

  const handleUpgrade = async (tier: SubscriptionTier) => {
    if (tier === 'core' || !user) return;
    
    let success = false;
    
    if (paymentMode === 'subscription') {
      success = await initiateSubscription(tier as 'basic' | 'plus' | 'pro', user.id, {
        name: userName,
        email: user.email,
      });
    } else {
      success = await initiatePayment(tier as 'basic' | 'plus' | 'pro', user.id, {
        name: userName,
        email: user.email,
      });
    }

    if (success) {
      await upgradeTier(tier);
      await upgradeToPremium(tier);
      await recordUpgradePrompt();
      onOpenChange(false);
    }
  };

  const getTierIndex = (tier: SubscriptionTier) => {
    const order = { core: 0, basic: 1, plus: 2, pro: 3 };
    return order[tier] ?? 0;
  };

  const canUpgradeTo = (tier: SubscriptionTier) => {
    return getTierIndex(tier) > getTierIndex(displayCurrentTier as SubscriptionTier);
  };

  const tiers: SubscriptionTier[] = ['core', 'basic', 'plus', 'pro'];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[92vh] rounded-t-3xl overflow-hidden">
        <SheetHeader className="text-center pb-3">
          <div className="flex justify-center mb-2">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20">
              <Rocket className="w-7 h-7 text-primary" />
            </div>
          </div>
          <SheetTitle className="text-xl font-bold">
            Go deeper with {aiName}
          </SheetTitle>
          <p className="text-muted-foreground text-sm">
            Upgrades only add depth. You never lose emotional support.
          </p>
        </SheetHeader>

        <div className="mt-3 space-y-3 overflow-y-auto max-h-[60vh] pb-4">
          {/* Tier Selection Pills */}
          <div className="flex gap-2 justify-center flex-wrap">
            {tiers.map((tier) => {
              const config = TIER_CONFIG[tier];
              const Icon = config.icon;
              const isSelected = selectedTier === tier;
              const isCurrent = displayCurrentTier === tier;
              
              return (
                <button
                  key={tier}
                  onClick={() => setSelectedTier(tier)}
                  className={cn(
                    "flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all",
                    isSelected 
                      ? "bg-primary/10 border-2 border-primary" 
                      : "bg-muted/50 border-2 border-transparent hover:bg-muted",
                    isCurrent && "ring-2 ring-offset-2 ring-green-500"
                  )}
                >
                  <Icon className={cn("w-4 h-4", config.color)} />
                  <span className={cn("text-xs font-medium", config.color)}>
                    {config.name}
                  </span>
                  {isCurrent && (
                    <span className="text-[9px] text-green-600 dark:text-green-400">Current</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Selected Tier Details */}
          {tiers.map((tier) => {
            const config = TIER_CONFIG[tier];
            const Icon = config.icon;
            const isVisible = selectedTier === tier;
            const isCurrent = displayCurrentTier === tier;
            const canUpgrade = canUpgradeTo(tier);
            
            if (!isVisible) return null;

            return (
              <div
                key={tier}
                className={cn(
                  "rounded-2xl border p-4 transition-all",
                  tier === 'pro' 
                    ? "border-2 border-amber-500/50 bg-gradient-to-br from-amber-500/5 to-orange-500/5"
                    : tier === 'plus'
                    ? "border-2 border-primary bg-gradient-to-br from-primary/5 to-accent/5"
                    : "border-border"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Icon className={cn("w-5 h-5", config.color)} />
                    <span className={cn("text-sm font-semibold", config.color)}>
                      {config.name}
                    </span>
                  </div>
                  {tier === 'plus' && (
                    <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                      Most Popular
                    </span>
                  )}
                </div>
                
                <p className="text-xs text-muted-foreground mb-2">
                  {config.tagline}
                </p>
                
                <div className="text-lg font-bold mb-3">
                  {config.price}
                </div>
                
                <div className="grid grid-cols-2 gap-x-2 gap-y-1.5">
                  {config.features.map((feature, i) => (
                    <div 
                      key={i} 
                      className={cn(
                        "flex items-center gap-1.5 text-xs",
                        feature.highlight ? "text-foreground font-medium" : "text-muted-foreground"
                      )}
                    >
                      <Check className={cn(
                        "w-3 h-3 flex-shrink-0",
                        feature.highlight ? config.color : "text-muted-foreground/60"
                      )} />
                      <span className="truncate">{feature.label}</span>
                    </div>
                  ))}
                </div>

                {tier === 'core' && (
                  <p className="text-xs text-muted-foreground mt-3 text-center italic">
                    "Always free. No pressure to upgrade."
                  </p>
                )}

                {/* Payment Mode Selection */}
                {tier !== 'core' && canUpgrade && (
                  <div className="mt-4 p-3 bg-muted/50 rounded-xl">
                    <p className="text-xs font-medium mb-2">Billing:</p>
                    <RadioGroup 
                      value={paymentMode} 
                      onValueChange={(v) => setPaymentMode(v as PaymentMode)}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="subscription" id="subscription" />
                        <Label htmlFor="subscription" className="text-xs cursor-pointer flex items-center gap-1">
                          <RefreshCw className="w-3 h-3" />
                          Auto-renew monthly
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="one-time" id="one-time" />
                        <Label htmlFor="one-time" className="text-xs cursor-pointer">
                          One month only
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                )}

                {/* CTA */}
                {tier !== 'core' && (
                  <div className="mt-4">
                    {isCurrent ? (
                      <div className="text-center text-sm text-green-600 dark:text-green-400 font-medium py-2">
                        ✓ This is your current plan
                      </div>
                    ) : canUpgrade ? (
                      <>
                        <Button 
                          className={cn(
                            "w-full h-11 rounded-xl text-base font-semibold",
                            tier === 'pro' 
                              ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                              : "bg-primary hover:bg-primary/90"
                          )}
                          onClick={() => handleUpgrade(tier)}
                          disabled={isPaymentLoading || !isPaymentReady}
                        >
                          {isPaymentLoading ? (
                            <>
                              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                              Processing...
                            </>
                          ) : !isPaymentReady ? (
                            <>
                              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                              Loading...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-5 h-5 mr-2" />
                              Upgrade to {config.name}
                            </>
                          )}
                        </Button>
                        <p className="text-[10px] text-center text-muted-foreground mt-2">
                          Cancel anytime · No lock-in
                        </p>
                      </>
                    ) : (
                      <div className="text-center text-sm text-muted-foreground py-2">
                        Already included in your plan
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-border">
          <p className="text-[10px] text-center text-muted-foreground">
            {paymentMode === 'subscription' 
              ? 'Auto-renews monthly · Cancel anytime from settings'
              : 'One-time · 30 days access'
            }
          </p>
          <p className="text-[9px] text-center text-muted-foreground/60 mt-1">
            Secure payment via Razorpay · Upgrades never appear during emotional moments
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
};
