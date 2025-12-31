import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Crown, Star, Heart, CreditCard, Calendar, Check, X, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

const TIER_INFO = {
  core: { name: 'AURRA Core', icon: Heart, color: 'text-muted-foreground', bgColor: 'bg-muted' },
  plus: { name: 'AURRA Plus', icon: Star, color: 'text-primary', bgColor: 'bg-primary/10' },
  pro: { name: 'AURRA Pro', icon: Crown, color: 'text-amber-500', bgColor: 'bg-amber-500/10' },
};

const SubscriptionScreen: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Fetch payments
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (paymentsError) throw paymentsError;
      setPayments(paymentsData || []);

      // Fetch subscription
      const { data: subData, error: subError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (subError) throw subError;
      setSubscription(subData);
    } catch (error) {
      console.error('Error fetching subscription data:', error);
      toast.error('Failed to load subscription data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!user || !subscription) return;
    
    setIsCancelling(true);
    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (error) throw error;

      // Also update user_engagement to core tier
      await supabase
        .from('user_engagement')
        .update({ subscription_tier: 'core' })
        .eq('user_id', user.id);

      // Update user_credits
      await supabase
        .from('user_credits')
        .update({ is_premium: false })
        .eq('user_id', user.id);

      toast.success('Subscription cancelled. You can continue using AURRA Core.');
      fetchData();
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      toast.error('Failed to cancel subscription');
    } finally {
      setIsCancelling(false);
    }
  };

  const currentTier = subscription?.tier || 'core';
  const tierInfo = TIER_INFO[currentTier as keyof typeof TIER_INFO] || TIER_INFO.core;
  const TierIcon = tierInfo.icon;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
      case 'active':
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Active</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/20">Cancelled</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">Pending</Badge>;
      case 'failed':
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/20">Failed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
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
          <h1 className="text-xl font-bold">Subscription</h1>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Current Plan Card */}
        <Card className={cn("border-2", tierInfo.bgColor)}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TierIcon className={cn("w-6 h-6", tierInfo.color)} />
                <CardTitle className={tierInfo.color}>{tierInfo.name}</CardTitle>
              </div>
              {getStatusBadge(subscription?.status || 'active')}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {subscription && subscription.tier !== 'core' ? (
              <>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>Started {format(new Date(subscription.started_at), 'MMM d, yyyy')}</span>
                </div>
                {subscription.expires_at && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <AlertCircle className="w-4 h-4" />
                    <span>Expires {format(new Date(subscription.expires_at), 'MMM d, yyyy')}</span>
                  </div>
                )}
                {subscription.cancelled_at && (
                  <div className="flex items-center gap-2 text-sm text-red-500">
                    <X className="w-4 h-4" />
                    <span>Cancelled on {format(new Date(subscription.cancelled_at), 'MMM d, yyyy')}</span>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                You're on the free plan. Upgrade to unlock more features.
              </p>
            )}

            <div className="flex gap-2 pt-2">
              {currentTier !== 'pro' && (
                <Button 
                  onClick={() => setShowUpgrade(true)}
                  className="flex-1"
                >
                  {currentTier === 'core' ? 'Upgrade Plan' : 'Upgrade to Pro'}
                </Button>
              )}
              {subscription && subscription.tier !== 'core' && subscription.status !== 'cancelled' && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" className="flex-1">
                      Cancel Plan
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Cancel Subscription?</AlertDialogTitle>
                      <AlertDialogDescription>
                        You'll lose access to {tierInfo.name} features at the end of your billing period. 
                        You can always re-subscribe later.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Keep Plan</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleCancelSubscription}
                        disabled={isCancelling}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {isCancelling ? 'Cancelling...' : 'Cancel Subscription'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Payment History */}
        <div>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Payment History
          </h2>
          
          {payments.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <CreditCard className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">No payments yet</p>
                <p className="text-sm text-muted-foreground/70">
                  Your payment history will appear here
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {payments.map((payment) => {
                const paymentTierInfo = TIER_INFO[payment.tier as keyof typeof TIER_INFO] || TIER_INFO.core;
                const PaymentTierIcon = paymentTierInfo.icon;
                
                return (
                  <Card key={payment.id}>
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={cn("p-2 rounded-full", paymentTierInfo.bgColor)}>
                            <PaymentTierIcon className={cn("w-4 h-4", paymentTierInfo.color)} />
                          </div>
                          <div>
                            <p className="font-medium">{paymentTierInfo.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(payment.created_at), 'MMM d, yyyy · h:mm a')}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">
                            ₹{(payment.amount / 100).toFixed(0)}
                          </p>
                          {getStatusBadge(payment.status)}
                        </div>
                      </div>
                      {payment.razorpay_payment_id && (
                        <div className="mt-2 pt-2 border-t border-border">
                          <p className="text-xs text-muted-foreground font-mono">
                            ID: {payment.razorpay_payment_id}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Plan Comparison */}
        <div>
          <h2 className="text-lg font-semibold mb-3">Compare Plans</h2>
          <div className="space-y-3">
            {Object.entries(TIER_INFO).map(([tier, info]) => {
              const Icon = info.icon;
              const isCurrent = tier === currentTier;
              
              return (
                <Card 
                  key={tier}
                  className={cn(
                    "transition-all",
                    isCurrent && "border-2 border-primary"
                  )}
                >
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn("p-2 rounded-full", info.bgColor)}>
                          <Icon className={cn("w-4 h-4", info.color)} />
                        </div>
                        <div>
                          <p className={cn("font-medium", info.color)}>{info.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {tier === 'core' ? 'Free' : tier === 'plus' ? '₹199/month' : '₹499/month'}
                          </p>
                        </div>
                      </div>
                      {isCurrent ? (
                        <Badge variant="secondary">Current</Badge>
                      ) : tier !== 'core' && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setShowUpgrade(true)}
                        >
                          Upgrade
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      <UpgradeSheet open={showUpgrade} onOpenChange={setShowUpgrade} />
    </div>
  );
};

export default SubscriptionScreen;
