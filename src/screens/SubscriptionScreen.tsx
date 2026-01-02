import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, CreditCard, Sparkles, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { UpgradeSheet } from '@/components/UpgradeSheet';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface Payment {
  id: string;
  razorpay_order_id: string;
  razorpay_payment_id: string | null;
  amount: number;
  currency: string;
  status: string;
  tier: string;
  created_at: string;
  completed_at: string | null;
}

interface Subscription {
  id: string;
  tier: string;
  status: string;
  started_at: string;
  expires_at: string | null;
  cancelled_at: string | null;
}

// Plan definitions following the exact spec:
// Free ₹0 (30 credits), Basic ₹99 (120), Plus ₹199 (300), Pro ₹299 (unlimited)
const PLANS = [
  {
    id: 'core',
    name: 'Free',
    tag: 'Light use',
    price: null,
    priceLabel: 'Free',
    description: 'For checking in, quick chats, and getting a feel for AURRA.',
    features: [
      'Daily conversations (limited)',
      'Basic reminders',
      'Short-term memory',
      'Calm responses',
    ],
    ctaText: "You're on this plan",
    highlight: false,
  },
  {
    id: 'basic',
    name: 'Basic',
    tag: 'For students',
    price: 99,
    priceLabel: '₹99/month',
    description: 'For regular check-ins, routines, and staying consistent.',
    features: [
      'More daily conversations',
      'Daily routine & hydration',
      'Medium-depth replies',
      'Memory across days',
      'Light image generation',
    ],
    ctaText: 'Upgrade to Basic',
    highlight: false,
  },
  {
    id: 'plus',
    name: 'Plus',
    tag: 'Most popular',
    price: 199,
    priceLabel: '₹199/month',
    description: 'For students, builders, and focused daily use.',
    features: [
      'Long reasoning & explanations',
      'Coding & learning help',
      'Strong memory continuity',
      'Image + document creation',
      'Faster responses',
    ],
    ctaText: 'Upgrade to Plus',
    highlight: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    tag: 'Power users',
    price: 299,
    priceLabel: '₹299/month',
    description: 'For founders and power users who stay connected all day.',
    features: [
      'Highest daily access',
      'Deep memory & recall',
      'Priority response speed',
      'Full Life-OS features',
      'Everything unlocked',
    ],
    ctaText: 'Upgrade to Pro',
    highlight: false,
  },
];

// Map subscription tiers to plan IDs
const TIER_TO_PLAN: Record<string, string> = {
  core: 'core',
  basic: 'basic',
  plus: 'plus',
  pro: 'pro',
};

const SubscriptionScreen: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const aiName = 'AURRA';

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data: paymentsData } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      setPayments(paymentsData || []);

      const { data: subData } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      setSubscription(subData);
    } catch (error) {
      console.error('Error fetching subscription data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!user || !subscription) return;
    
    setIsCancelling(true);
    try {
      await supabase
        .from('subscriptions')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      await supabase
        .from('user_engagement')
        .update({ subscription_tier: 'core' })
        .eq('user_id', user.id);

      await supabase
        .from('user_credits')
        .update({ 
          is_premium: false,
          daily_credits_limit: 30, // Free tier limit
        })
        .eq('user_id', user.id);

      toast.info("I'll still be here — just a little lighter. 🤍");
      toast.success("Your subscription has been cancelled. You'll keep your benefits until the end of the billing period.");
      fetchData();
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      toast.error('Failed to cancel subscription');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleUpgrade = (planId: string) => {
    setSelectedPlan(planId);
    setShowUpgrade(true);
  };

  const currentTier = subscription?.tier || 'core';
  const currentPlanId = TIER_TO_PLAN[currentTier] || 'core';
  const isPaid = currentTier !== 'core' && subscription?.status === 'active';

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
          <div className="flex items-center gap-3 p-4">
            <Skeleton className="w-10 h-10 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-3 w-56" />
            </div>
          </div>
        </div>
        <div className="p-4 space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-6 w-24 mb-2" />
                <Skeleton className="h-4 w-full mb-4" />
                <div className="space-y-2">
                  {[1, 2, 3, 4].map((j) => (
                    <Skeleton key={j} className="h-4 w-48" />
                  ))}
                </div>
                <Skeleton className="h-10 w-full mt-4 rounded-lg" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <div className="flex items-center gap-3 p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Your plan & access</h1>
            <p className="text-xs text-muted-foreground">
              Choose what fits your day. You can change this anytime.
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Intro text */}
        <p className="text-sm text-muted-foreground text-center px-4">
          Pick what feels right. You can upgrade, downgrade, or cancel anytime.
        </p>

        {/* Plan Cards */}
        {PLANS.map((plan) => {
          const isCurrent = plan.id === currentPlanId;
          const isHighlighted = plan.highlight;
          
          return (
            <Card 
              key={plan.id}
              className={cn(
                "relative overflow-hidden transition-all",
                isHighlighted && "ring-2 ring-primary shadow-lg shadow-primary/10",
                isCurrent && !isHighlighted && "border-2 border-primary/50"
              )}
            >
              {/* Highlight glow effect for Plus */}
              {isHighlighted && (
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 pointer-events-none" />
              )}
              
              <CardContent className="pt-6 relative">
                {/* Plan header */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-bold">{plan.name}</h3>
                      {isHighlighted && (
                        <Badge className="bg-primary text-primary-foreground text-xs">
                          <Sparkles className="w-3 h-3 mr-1" />
                          {plan.tag}
                        </Badge>
                      )}
                      {!isHighlighted && (
                        <Badge variant="secondary" className="text-xs">
                          {plan.tag}
                        </Badge>
                      )}
                    </div>
                    {isCurrent && (
                      <Badge variant="outline" className="text-xs text-primary border-primary/50">
                        Current plan
                      </Badge>
                    )}
                  </div>
                  <span className="text-lg font-bold text-foreground">
                    {plan.priceLabel}
                  </span>
                </div>

                {/* Description */}
                <p className="text-sm text-muted-foreground mb-4">
                  {plan.description}
                </p>

                <Separator className="my-4" />

                {/* Features */}
                <ul className="space-y-2.5 mb-5">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm">
                      <Check className={cn(
                        "w-4 h-4 mt-0.5 shrink-0",
                        isHighlighted ? "text-primary" : "text-muted-foreground"
                      )} />
                      <span className="text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Separator className="my-4" />

                {/* CTA Button */}
                {isCurrent ? (
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    disabled
                  >
                    {plan.ctaText}
                  </Button>
                ) : (
                  <Button 
                    onClick={() => handleUpgrade(plan.id)}
                    className={cn(
                      "w-full",
                      isHighlighted && "bg-primary hover:bg-primary/90"
                    )}
                  >
                    {plan.ctaText}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}

        {/* Billing section for paid users */}
        {isPaid && (
          <>
            <Separator className="my-6" />
            
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-4">Manage subscription</h3>
                
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Current plan</span>
                    <span className="font-medium capitalize">{currentPlanId}</span>
                  </div>
                  {subscription?.started_at && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Started</span>
                      <span>{format(new Date(subscription.started_at), 'MMM d, yyyy')}</span>
                    </div>
                  )}
                  {subscription?.expires_at && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Next billing</span>
                      <span>{format(new Date(subscription.expires_at), 'MMM d, yyyy')}</span>
                    </div>
                  )}
                </div>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" className="w-full text-muted-foreground text-sm">
                      Cancel subscription
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Cancel your subscription?</AlertDialogTitle>
                      <AlertDialogDescription>
                        You&apos;ll keep your benefits until the end of the billing period. 
                        No guilt — {aiName} will still be here for you.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Keep plan</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleCancelSubscription}
                        disabled={isCancelling}
                        className="bg-muted text-muted-foreground hover:bg-muted/80"
                      >
                        {isCancelling ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Cancelling...
                          </>
                        ) : (
                          'Cancel subscription'
                        )}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          </>
        )}

        {/* Payment History */}
        {payments.length > 0 && (
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Payment history
              </h3>
              <div className="space-y-3">
                {payments.slice(0, 5).map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                    <div>
                      <p className="text-sm font-medium capitalize">{payment.tier}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(payment.created_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">₹{(payment.amount / 100).toFixed(0)}</p>
                      <Badge 
                        variant="secondary" 
                        className={cn(
                          "text-xs",
                          payment.status === 'completed' && "bg-green-500/10 text-green-600"
                        )}
                      >
                        {payment.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <UpgradeSheet open={showUpgrade} onOpenChange={setShowUpgrade} />
    </div>
  );
};

export default SubscriptionScreen;
