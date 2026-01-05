import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

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
      toast.error('Payment gateway unavailable. Please check your internet connection and try again.');
    };
    document.body.appendChild(script);

    return () => {
      // Don't remove script on cleanup as it may be needed
    };
  }, []);

  // One-time payment - supports basic, plus, pro tiers
  const initiatePayment = useCallback(async (
    tier: 'basic' | 'plus' | 'pro',
    _userId: string, // Ignored - server uses authenticated user
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

      // Only send tier - server will get userId from auth token
      const { data: orderData, error: orderError } = await supabase.functions.invoke('create-razorpay-order', {
        body: { tier },
      });

      if (orderError || !orderData) {
        console.error('Order creation error:', orderError);
        const errorMessage = orderData?.error || orderError?.message || 'Something went wrong';
        toast.error(`Payment failed: ${errorMessage}. Please try again or contact support.`);
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
            
            // Show "Activating..." - do NOT celebrate yet
            toast.info('Activating your plan...', { duration: 3000 });
            
            try {
              // Only send payment details and tier - server will get userId from auth token
              const { data: verifyData, error: verifyError } = await supabase.functions.invoke('verify-razorpay-payment', {
                body: {
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  tier,
                },
              });

              if (verifyError || !verifyData?.success) {
                console.error('Verification error:', verifyError);
                // Payment received but verification failed - webhook will handle
                toast.info('Payment received! Your subscription will be activated shortly.', { duration: 5000 });
                resolve(false);
                return;
              }

              // Backend verification successful - now celebrate!
              // The chat confirmation message is already inserted by the backend
              confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#8B5CF6', '#F59E0B', '#10B981', '#3B82F6', '#EC4899'],
              });
              
              // Second burst for extra celebration
              setTimeout(() => {
                confetti({
                  particleCount: 50,
                  angle: 60,
                  spread: 55,
                  origin: { x: 0 },
                  colors: ['#8B5CF6', '#F59E0B', '#10B981'],
                });
                confetti({
                  particleCount: 50,
                  angle: 120,
                  spread: 55,
                  origin: { x: 1 },
                  colors: ['#8B5CF6', '#F59E0B', '#10B981'],
                });
              }, 250);

              // Simple success - backend already sent chat confirmation
              toast.success('Welcome to the journey! 🎉');
              resolve(true);
            } catch (err) {
              console.error('Verification error:', err);
              toast.info('Payment received! Check your chat for confirmation.');
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
              toast.info('Payment cancelled. You can upgrade anytime from settings.');
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
      toast.error('Payment failed unexpectedly. Please check your connection and try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isScriptLoaded]);

  // Subscription (recurring) payment - supports basic, plus, pro tiers
  const initiateSubscription = useCallback(async (
    tier: 'basic' | 'plus' | 'pro',
    _userId: string, // Ignored - server uses authenticated user
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

      // Only send tier and userName - server will get userId and email from auth token
      const { data: subData, error: subError } = await supabase.functions.invoke('create-razorpay-subscription', {
        body: { 
          tier, 
          userName: userProfile?.name,
        },
      });

      if (subError || !subData) {
        console.error('Subscription creation error:', subError);
        const errorMessage = subData?.error || subError?.message || 'Something went wrong';
        toast.error(`Subscription failed: ${errorMessage}. Please try again or contact support.`);
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
            
            // Show "Activating..." - do NOT celebrate yet
            // The webhook is the single source of truth for subscription activation
            toast.info('Activating your subscription...', { duration: 3000 });
            
            // For subscriptions, the webhook (subscription.activated) is the source of truth
            // The webhook will insert the chat confirmation message
            // We wait briefly then celebrate (webhook should have processed by now)
            await new Promise(r => setTimeout(r, 2000));
            
            // Trigger confetti celebration
            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 },
              colors: ['#8B5CF6', '#F59E0B', '#10B981', '#3B82F6', '#EC4899'],
            });
            
            // Second burst for extra celebration
            setTimeout(() => {
              confetti({
                particleCount: 50,
                angle: 60,
                spread: 55,
                origin: { x: 0 },
                colors: ['#8B5CF6', '#F59E0B', '#10B981'],
              });
              confetti({
                particleCount: 50,
                angle: 120,
                spread: 55,
                origin: { x: 1 },
                colors: ['#8B5CF6', '#F59E0B', '#10B981'],
              });
            }, 250);

            // Simple success - backend webhook already sent chat confirmation
            toast.success('Welcome to the journey! 🎉');
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
              toast.info('Subscription cancelled. You can subscribe anytime from settings.');
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
      toast.error('Subscription failed unexpectedly. Please check your connection and try again.');
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
