import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

interface RazorpayOptions {
  key: string;
  amount?: number;
  currency?: string;
  name: string;
  description: string;
  order_id?: string;
  subscription_id?: string;
  recurring?: boolean;
  handler: (response: RazorpayResponse) => void;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: {
    color?: string;
  };
  modal?: {
    ondismiss?: () => void;
  };
}

interface RazorpayInstance {
  open: () => void;
  close: () => void;
}

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id?: string;
  razorpay_subscription_id?: string;
  razorpay_signature: string;
}

export type PaymentMode = 'one-time' | 'subscription';

export const useRazorpay = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);

  // Load Razorpay script
  useEffect(() => {
    if (window.Razorpay) {
      setIsScriptLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => setIsScriptLoaded(true);
    script.onerror = () => {
      console.error('Failed to load Razorpay script');
      toast.error('Payment gateway unavailable');
    };
    document.body.appendChild(script);

    return () => {
      // Don't remove script on cleanup as it may be needed
    };
  }, []);

  // One-time payment
  const initiatePayment = useCallback(async (
    tier: 'plus' | 'pro',
    userId: string,
    userProfile?: { name?: string; email?: string }
  ): Promise<boolean> => {
    if (!isScriptLoaded) {
      toast.error('Payment gateway is loading. Please try again.');
      return false;
    }

    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please sign in to continue');
        return false;
      }

      const { data: orderData, error: orderError } = await supabase.functions.invoke('create-razorpay-order', {
        body: { tier, userId },
      });

      if (orderError || !orderData) {
        console.error('Order creation error:', orderError);
        toast.error('Failed to create payment order');
        return false;
      }

      console.log('Order created:', orderData);

      return new Promise((resolve) => {
        const options: RazorpayOptions = {
          key: orderData.keyId,
          amount: orderData.amount,
          currency: orderData.currency,
          name: 'AURRA',
          description: `Upgrade to ${orderData.tierName}`,
          order_id: orderData.orderId,
          handler: async (response: RazorpayResponse) => {
            console.log('Payment successful:', response);
            
            try {
              const { data: verifyData, error: verifyError } = await supabase.functions.invoke('verify-razorpay-payment', {
                body: {
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  tier,
                  userId,
                },
              });

              if (verifyError || !verifyData?.success) {
                console.error('Verification error:', verifyError);
                toast.error('Payment verification failed. Please contact support.');
                resolve(false);
                return;
              }

              toast.success('Payment successful! Your subscription is now active.');
              resolve(true);
            } catch (err) {
              console.error('Verification error:', err);
              toast.error('Payment verification failed');
              resolve(false);
            }
          },
          prefill: {
            name: userProfile?.name || '',
            email: userProfile?.email || session.user.email || '',
          },
          theme: {
            color: '#8B5CF6',
          },
          modal: {
            ondismiss: () => {
              console.log('Payment modal dismissed');
              setIsLoading(false);
              resolve(false);
            },
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      });
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Payment failed. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isScriptLoaded]);

  // Subscription (recurring) payment
  const initiateSubscription = useCallback(async (
    tier: 'plus' | 'pro',
    userId: string,
    userProfile?: { name?: string; email?: string }
  ): Promise<boolean> => {
    if (!isScriptLoaded) {
      toast.error('Payment gateway is loading. Please try again.');
      return false;
    }

    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please sign in to continue');
        return false;
      }

      const { data: subData, error: subError } = await supabase.functions.invoke('create-razorpay-subscription', {
        body: { 
          tier, 
          userId,
          userEmail: session.user.email,
          userName: userProfile?.name,
        },
      });

      if (subError || !subData) {
        console.error('Subscription creation error:', subError);
        toast.error('Failed to create subscription');
        return false;
      }

      console.log('Subscription created:', subData);

      return new Promise((resolve) => {
        const options: RazorpayOptions = {
          key: subData.keyId,
          name: 'AURRA',
          description: `${subData.tierName} Monthly Subscription`,
          subscription_id: subData.subscriptionId,
          recurring: true,
          handler: async (response: RazorpayResponse) => {
            console.log('Subscription payment successful:', response);
            
            // For subscriptions, the webhook will handle activation
            // Just show success message here
            toast.success('Subscription activated! Auto-renewal is enabled.');
            resolve(true);
          },
          prefill: {
            name: userProfile?.name || '',
            email: userProfile?.email || session.user.email || '',
          },
          theme: {
            color: '#8B5CF6',
          },
          modal: {
            ondismiss: () => {
              console.log('Subscription modal dismissed');
              setIsLoading(false);
              resolve(false);
            },
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      });
    } catch (error) {
      console.error('Subscription error:', error);
      toast.error('Subscription failed. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isScriptLoaded]);

  return {
    initiatePayment,
    initiateSubscription,
    isLoading,
    isReady: isScriptLoaded,
  };
};
