import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Crown, Star, Heart, CreditCard, Calendar, Check, X, Loader2, AlertCircle, ChevronRight, Sparkles, MessageCircle, Brain, Dumbbell, Palette, Users, Mic, Image, FileText, BarChart3, Zap, Clock, RefreshCw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useAura } from '@/contexts/AuraContext';
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
  core: { 
    name: 'AURRA Core', 
    icon: Heart, 
    color: 'text-muted-foreground', 
    bgColor: 'bg-muted',
    tagline: 'A calm, supportive companion — no pressure.',
    price: 'Free',
  },
  plus: { 
    name: 'AURRA Plus', 
    icon: Star, 
    color: 'text-primary', 
    bgColor: 'bg-primary/10',
    tagline: 'For consistency & growth',
    price: '₹99/month',
  },
  pro: { 
    name: 'AURRA Pro', 
    icon: Crown, 
    color: 'text-amber-500', 
    bgColor: 'bg-amber-500/10',
    tagline: 'For builders & serious self-growth',
    price: '₹299/month',
  },
};

// Persona access matrix
const PERSONA_ACCESS = [
  { name: 'Companion', icon: Heart, free: 'full', plus: 'full', pro: 'full' },
  { name: 'Best Friend', icon: Users, free: 'light', plus: 'deep', pro: 'deep' },
  { name: 'Mentor', icon: Brain, free: 'basic', plus: 'full', pro: 'full' },
  { name: 'Coach', icon: Dumbbell, free: 'none', plus: 'full', pro: 'full' },
  { name: 'Creative Partner', icon: Palette, free: 'none', plus: 'full', pro: 'full' },
  { name: 'Thinking Partner', icon: Sparkles, free: 'none', plus: 'none', pro: 'full' },
];

// Features by plan
const PLAN_FEATURES: Record<string, { icon: React.ComponentType<{ className?: string }>; label: string; highlight?: boolean }[]> = {
  core: [
    { icon: Heart, label: 'Companion persona' },
    { icon: Users, label: 'Best Friend (light)' },
    { icon: MessageCircle, label: 'Daily check-ins' },
    { icon: Heart, label: 'Emotional support' },
    { icon: Clock, label: 'Basic reminders' },
    { icon: BarChart3, label: 'Routine viewing' },
    { icon: Brain, label: 'Limited memory' },
    { icon: Zap, label: 'Limited daily conversations' },
  ],
  plus: [
    { icon: Users, label: 'Best Friend (deep)', highlight: true },
    { icon: Brain, label: 'Mentor persona (full)', highlight: true },
    { icon: Dumbbell, label: 'Coach persona (gym, habits)', highlight: true },
    { icon: Palette, label: 'Creative partner persona', highlight: true },
    { icon: MessageCircle, label: 'Longer conversations' },
    { icon: Brain, label: 'Full Life Memory Graph', highlight: true },
    { icon: BarChart3, label: 'Skill sessions (coding, design, gym)' },
    { icon: Mic, label: 'Voice replies' },
    { icon: Image, label: 'Image & document tools' },
  ],
  pro: [
    { icon: Check, label: 'Everything in Plus', highlight: true },
    { icon: Sparkles, label: 'Co-Founder / Thinking Partner', highlight: true },
    { icon: BarChart3, label: 'Long-term planning & decision tracking' },
    { icon: Zap, label: 'Skill acceleration paths' },
    { icon: Brain, label: 'Advanced progress insights' },
    { icon: Clock, label: 'Priority responses' },
    { icon: Zap, label: 'Higher usage limits' },
  ],
};

// Usage display (human-friendly, no numbers)
const USAGE_DISPLAY = {
  core: {
    conversations: 'Limited',
    memory: 'Basic',
    skills: 'Limited',
    voiceImages: 'Limited',
  },
  plus: {
    conversations: 'Extended',
    memory: 'Full',
    skills: 'Unlimited',
    voiceImages: 'Included',
  },
  pro: {
    conversations: 'Unlimited',
    memory: 'Advanced',
    skills: 'Unlimited',
    voiceImages: 'Included',
  },
};

const SubscriptionScreen: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { userProfile, addChatMessage } = useAura();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [activeTab, setActiveTab] = useState('plans');

  const aiName = userProfile.aiName || 'AURRA';

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
        .update({ is_premium: false })
        .eq('user_id', user.id);

      // Add gentle AURRA message
      addChatMessage({
        content: "I'll still be here — just a little lighter. Thanks for spending time with me. 🤍",
        sender: 'aura',
      });

      toast.success("Your subscription has been cancelled. You'll keep your benefits until the end of the billing period.");
      fetchData();
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      toast.error('Failed to cancel subscription');
    } finally {
      setIsCancelling(false);
    }
  };

  const currentTier = (subscription?.tier || 'core') as keyof typeof TIER_INFO;
  const tierInfo = TIER_INFO[currentTier];
  const TierIcon = tierInfo.icon;
  const isPaid = currentTier !== 'core' && subscription?.status === 'active';

  const getAccessBadge = (access: string) => {
    switch (access) {
      case 'full':
        return <Check className="w-4 h-4 text-green-500" />;
      case 'deep':
        return <span className="text-xs text-green-600 font-medium">Deep</span>;
      case 'light':
        return <span className="text-xs text-blue-500 font-medium">Light</span>;
      case 'basic':
        return <span className="text-xs text-muted-foreground font-medium">Basic</span>;
      case 'none':
        return <X className="w-4 h-4 text-muted-foreground/40" />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        {/* Header Skeleton */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
          <div className="flex items-center gap-3 p-4">
            <Skeleton className="w-10 h-10 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-3 w-56" />
            </div>
          </div>
        </div>

        <div className="p-4 space-y-6">
          {/* Current Plan Card Skeleton */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-4">
                <Skeleton className="w-12 h-12 rounded-xl" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-28" />
                  <Skeleton className="h-3 w-44" />
                </div>
              </div>
              <Skeleton className="h-4 w-48 mb-4" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </CardContent>
          </Card>

          {/* Tabs Skeleton */}
          <Skeleton className="h-10 w-full rounded-lg" />

          {/* Plan Cards Skeleton */}
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Skeleton className="w-5 h-5 rounded" />
                      <Skeleton className="h-5 w-24" />
                    </div>
                    <Skeleton className="h-5 w-20" />
                  </div>
                  <Skeleton className="h-4 w-40 mb-4" />
                  <div className="space-y-2">
                    {[1, 2, 3, 4, 5].map((j) => (
                      <div key={j} className="flex items-center gap-2">
                        <Skeleton className="w-4 h-4 rounded" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                    ))}
                  </div>
                  {i > 1 && <Skeleton className="h-10 w-full mt-4 rounded-lg" />}
                </CardContent>
              </Card>
            ))}
          </div>
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
            <h1 className="text-xl font-bold">Your {aiName} Plan</h1>
            <p className="text-xs text-muted-foreground">
              Choose how deep you want {aiName} to grow with you.
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Current Plan Card */}
        <Card className={cn("border-2", tierInfo.bgColor, isPaid && "border-primary")}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-3">
              <div className={cn("p-3 rounded-xl", tierInfo.bgColor)}>
                <TierIcon className={cn("w-6 h-6", tierInfo.color)} />
              </div>
              <div>
                <h2 className={cn("text-lg font-bold", tierInfo.color)}>{tierInfo.name}</h2>
                <p className="text-sm text-muted-foreground">{tierInfo.tagline}</p>
              </div>
            </div>
            
            {isPaid ? (
              <p className="text-sm text-muted-foreground mb-4">
                Thanks for supporting our journey 🤍
              </p>
            ) : (
              <p className="text-sm text-muted-foreground mb-4">
                Always free. No pressure to upgrade.
              </p>
            )}

            <Button 
              onClick={() => isPaid ? setActiveTab('billing') : setShowUpgrade(true)}
              className="w-full"
              variant={isPaid ? "outline" : "default"}
            >
              {isPaid ? 'Manage plan' : 'Explore upgrades'}
            </Button>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="plans">Plans</TabsTrigger>
            <TabsTrigger value="usage">Usage</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
          </TabsList>

          {/* Plans Tab */}
          <TabsContent value="plans" className="space-y-4 mt-4">
            {/* Persona Access Table */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Persona Access</CardTitle>
                <p className="text-xs text-muted-foreground">
                  You never lose emotional support — upgrades only add depth.
                </p>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 font-medium">Persona</th>
                        <th className="text-center py-2 font-medium text-muted-foreground">Free</th>
                        <th className="text-center py-2 font-medium text-primary">Plus</th>
                        <th className="text-center py-2 font-medium text-amber-500">Pro</th>
                      </tr>
                    </thead>
                    <tbody>
                      {PERSONA_ACCESS.map((persona) => {
                        const Icon = persona.icon;
                        return (
                          <tr key={persona.name} className="border-b border-border/50">
                            <td className="py-3">
                              <div className="flex items-center gap-2">
                                <Icon className="w-4 h-4 text-muted-foreground" />
                                <span>{persona.name}</span>
                              </div>
                            </td>
                            <td className="text-center py-3">{getAccessBadge(persona.free)}</td>
                            <td className="text-center py-3">{getAccessBadge(persona.plus)}</td>
                            <td className="text-center py-3">{getAccessBadge(persona.pro)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Plan Cards */}
            {(['core', 'plus', 'pro'] as const).map((tier) => {
              const info = TIER_INFO[tier];
              const Icon = info.icon;
              const features = PLAN_FEATURES[tier];
              const isCurrent = tier === currentTier;
              
              return (
                <Card 
                  key={tier}
                  className={cn(
                    "transition-all",
                    isCurrent && "border-2 border-primary",
                    tier === 'pro' && "bg-gradient-to-br from-amber-500/5 to-orange-500/5",
                    tier === 'plus' && "bg-gradient-to-br from-primary/5 to-accent/5"
                  )}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Icon className={cn("w-5 h-5", info.color)} />
                        <span className={cn("font-semibold", info.color)}>{info.name}</span>
                        {isCurrent && <Badge variant="secondary">Current</Badge>}
                      </div>
                      <span className="font-bold">{info.price}</span>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-4">{info.tagline}</p>
                    
                    <div className="space-y-2">
                      {features.slice(0, 5).map((feature, i) => {
                        const FeatureIcon = feature.icon;
                        return (
                          <div 
                            key={i} 
                            className={cn(
                              "flex items-center gap-2 text-sm",
                              feature.highlight ? "text-foreground font-medium" : "text-muted-foreground"
                            )}
                          >
                            <FeatureIcon className={cn("w-4 h-4", feature.highlight && info.color)} />
                            <span>{feature.label}</span>
                          </div>
                        );
                      })}
                      {features.length > 5 && (
                        <p className="text-xs text-muted-foreground">
                          +{features.length - 5} more features
                        </p>
                      )}
                    </div>

                    {tier !== 'core' && !isCurrent && (
                      <Button 
                        onClick={() => setShowUpgrade(true)}
                        className={cn(
                          "w-full mt-4",
                          tier === 'pro' && "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                        )}
                      >
                        Upgrade to {tier === 'plus' ? 'Plus' : 'Pro'}
                      </Button>
                    )}
                    
                    {tier !== 'core' && (
                      <p className="text-xs text-center text-muted-foreground mt-2">
                        {tier === 'plus' ? 'Cancel anytime · No lock-in' : 'Built for people building something meaningful'}
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>

          {/* Usage Tab */}
          <TabsContent value="usage" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Daily Usage</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: 'Daily conversations', key: 'conversations' as const },
                  { label: 'Memory depth', key: 'memory' as const },
                  { label: 'Skill sessions', key: 'skills' as const },
                  { label: 'Voice & images', key: 'voiceImages' as const },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                    <span className="text-sm">{item.label}</span>
                    <Badge variant="secondary" className={cn(
                      currentTier === 'pro' && "bg-amber-500/10 text-amber-600",
                      currentTier === 'plus' && "bg-primary/10 text-primary"
                    )}>
                      {USAGE_DISPLAY[currentTier][item.key]}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Billing Tab */}
          <TabsContent value="billing" className="space-y-4 mt-4">
            {isPaid && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Subscription Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Current plan</span>
                    <span className="font-medium">{tierInfo.name}</span>
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
                  
                  <Separator className="my-4" />
                  
                  <div className="space-y-2">
                    {currentTier !== 'pro' && (
                      <Button variant="outline" className="w-full" onClick={() => setShowUpgrade(true)}>
                        Change plan
                      </Button>
                    )}
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" className="w-full text-muted-foreground">
                          Cancel subscription
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Cancel your subscription?</AlertDialogTitle>
                          <AlertDialogDescription>
                            You'll keep your benefits until the end of the billing period. 
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
                            {isCancelling ? 'Cancelling...' : 'Cancel subscription'}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Payment History */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Payment History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {payments.length === 0 ? (
                  <div className="text-center py-6">
                    <CreditCard className="w-10 h-10 mx-auto text-muted-foreground/40 mb-2" />
                    <p className="text-sm text-muted-foreground">No payments yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {payments.slice(0, 5).map((payment) => (
                      <div key={payment.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                        <div>
                          <p className="text-sm font-medium">
                            {TIER_INFO[payment.tier as keyof typeof TIER_INFO]?.name || payment.tier}
                          </p>
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
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <UpgradeSheet open={showUpgrade} onOpenChange={setShowUpgrade} />
    </div>
  );
};

export default SubscriptionScreen;
