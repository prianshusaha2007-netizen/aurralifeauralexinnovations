import React, { useState, useContext } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Check, Heart, Sparkles, Star, Rocket, Crown, Loader2, RefreshCw, Users, Brain, Dumbbell, Palette } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCredits } from '@/hooks/useCredits';
import { AuraContext } from '@/contexts/AuraContext';
import { useRelationshipEvolution, SubscriptionTier } from '@/hooks/useRelationshipEvolution';
import { useRazorpay, PaymentMode } from '@/hooks/useRazorpay';
import { useAuth } from '@/hooks/useAuth';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface UpgradeSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TIER_CONFIG: Record<SubscriptionTier, {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  price: string;
  priceRange: string;
  priceValue: number;
  color: string;
  tagline: string;
  description: string;
  features: { label: string; highlight?: boolean }[];
}> = {
  core: {
    name: 'AURRA Core',
    icon: Heart,
    price: 'Free',
    priceRange: 'Free',
    priceValue: 0,
    color: 'text-muted-foreground',
    tagline: 'For getting started',
    description: 'A calm, supportive companion — no pressure.',
    features: [
      { label: 'Companion persona' },
      { label: 'Best Friend (light)' },
      { label: 'Daily check-ins' },
      { label: 'Emotional support' },
      { label: 'Basic reminders' },
      { label: 'Limited memory' },
      { label: 'Limited conversations' },
    ],
  },
  plus: {
    name: 'AURRA Plus',
    icon: Star,
    price: '₹99',
    priceRange: '₹99/month',
    priceValue: 99,
    color: 'text-primary',
    tagline: 'For consistency & growth',
    description: 'Most users choose this',
    features: [
      { label: 'Best Friend (deep)', highlight: true },
      { label: 'Mentor persona (full)', highlight: true },
      { label: 'Coach persona (gym, habits)', highlight: true },
      { label: 'Creative partner persona', highlight: true },
      { label: 'Longer conversations' },
      { label: 'Full Life Memory Graph', highlight: true },
      { label: 'Skill sessions' },
      { label: 'Voice replies' },
      { label: 'Image & document tools' },
    ],
  },
  pro: {
    name: 'AURRA Pro',
    icon: Crown,
    price: '₹299',
    priceRange: '₹299/month',
    priceValue: 299,
    color: 'text-amber-500',
    tagline: 'For builders & serious self-growth',
    description: 'Built for people building something meaningful',
    features: [
      { label: 'Everything in Plus', highlight: true },
      { label: 'Co-Founder / Thinking Partner', highlight: true },
      { label: 'Long-term planning' },
      { label: 'Decision tracking' },
      { label: 'Skill acceleration paths' },
      { label: 'Advanced insights' },
      { label: 'Priority responses' },
      { label: 'Higher limits' },
    ],
  },
};

export const UpgradeSheet: React.FC<UpgradeSheetProps> = ({ open, onOpenChange }) => {
  const { upgradeToPremium } = useCredits();
  const { upgradeTier, recordUpgradePrompt, engagement } = useRelationshipEvolution();
  // Use optional context to avoid crash outside AuraProvider
  const auraContext = useContext(AuraContext);
  const userProfile = auraContext?.userProfile ?? { name: 'User', aiName: 'AURRA' };
  const { user } = useAuth();
  const { initiatePayment, initiateSubscription, isLoading: isPaymentLoading, isReady: isPaymentReady } = useRazorpay();
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier>('plus');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('subscription');

  const aiName = userProfile.aiName ?? 'AURRA';
  const userName = userProfile.name ?? 'User';
  const currentTier = engagement?.subscriptionTier || 'core';

  const handleUpgrade = async (tier: SubscriptionTier) => {
    if (tier === 'core' || !user) return;
    
    let success = false;
    
    if (paymentMode === 'subscription') {
      success = await initiateSubscription(tier as 'plus' | 'pro', user.id, {
        name: userName,
        email: user.email,
      });
    } else {
      success = await initiatePayment(tier as 'plus' | 'pro', user.id, {
        name: userName,
        email: user.email,
      });
    }

    if (success) {
      await upgradeTier(tier);
      await upgradeToPremium();
      await recordUpgradePrompt();
      onOpenChange(false);
    }
  };

  const getTierIndex = (tier: SubscriptionTier) => {
    return tier === 'core' ? 0 : tier === 'plus' ? 1 : 2;
  };

  const canUpgradeTo = (tier: SubscriptionTier) => {
    return getTierIndex(tier) > getTierIndex(currentTier);
  };

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
          <div className="flex gap-2 justify-center">
            {(['core', 'plus', 'pro'] as SubscriptionTier[]).map((tier) => {
              const config = TIER_CONFIG[tier];
              const Icon = config.icon;
              const isSelected = selectedTier === tier;
              const isCurrent = currentTier === tier;
              
              return (
                <button
                  key={tier}
                  onClick={() => setSelectedTier(tier)}
                  className={cn(
                    "flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl transition-all",
                    isSelected 
                      ? "bg-primary/10 border-2 border-primary" 
                      : "bg-muted/50 border-2 border-transparent hover:bg-muted",
                    isCurrent && "ring-2 ring-offset-2 ring-green-500"
                  )}
                >
                  <Icon className={cn("w-4 h-4", config.color)} />
                  <span className={cn("text-xs font-medium", config.color)}>
                    {tier === 'core' ? 'Free' : tier.charAt(0).toUpperCase() + tier.slice(1)}
                  </span>
                  {isCurrent && (
                    <span className="text-[9px] text-green-600 dark:text-green-400">Current</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Selected Tier Details */}
          {(['core', 'plus', 'pro'] as SubscriptionTier[]).map((tier) => {
            const config = TIER_CONFIG[tier];
            const Icon = config.icon;
            const isVisible = selectedTier === tier;
            const isCurrent = currentTier === tier;
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
                  {config.priceRange}
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
                              Upgrade to {tier === 'plus' ? 'Plus' : 'Pro'}
                            </>
                          )}
                        </Button>
                        <p className="text-[10px] text-center text-muted-foreground mt-2">
                          {tier === 'plus' 
                            ? 'Cancel anytime · No lock-in' 
                            : 'Built for people building something meaningful'
                          }
                        </p>
                      </>
                    ) : (
                      <div className="text-center text-sm text-muted-foreground py-2">
                        Upgrade to Plus first
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
