import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-razorpay-signature',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RAZORPAY_KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET');
    if (!RAZORPAY_KEY_SECRET) {
      throw new Error('Razorpay secret not configured');
    }

    // Get the webhook signature
    const signature = req.headers.get('x-razorpay-signature');
    const body = await req.text();
    
    console.log('Received Razorpay webhook');

    // Verify webhook signature
    if (signature) {
      const expectedSignature = await generateHmac(body, RAZORPAY_KEY_SECRET);
      if (expectedSignature !== signature) {
        console.error('Webhook signature verification failed');
        return new Response(
          JSON.stringify({ error: 'Invalid signature' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const payload = JSON.parse(body);
    const event = payload.event;
    const subscriptionData = payload.payload?.subscription?.entity;
    const paymentData = payload.payload?.payment?.entity;

    console.log('Webhook event:', event);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    switch (event) {
      case 'subscription.authenticated':
        console.log('Subscription authenticated:', subscriptionData?.id);
        break;

      case 'subscription.activated':
        console.log('Subscription activated:', subscriptionData?.id);
        await handleSubscriptionActivated(supabase, subscriptionData);
        break;

      case 'subscription.charged':
        console.log('Subscription charged:', subscriptionData?.id, paymentData?.id);
        await handleSubscriptionCharged(supabase, subscriptionData, paymentData);
        break;

      case 'subscription.completed':
        console.log('Subscription completed:', subscriptionData?.id);
        await handleSubscriptionEnded(supabase, subscriptionData, 'completed');
        break;

      case 'subscription.cancelled':
        console.log('Subscription cancelled:', subscriptionData?.id);
        await handleSubscriptionEnded(supabase, subscriptionData, 'cancelled');
        break;

      case 'subscription.halted':
        console.log('Subscription halted (payment failed):', subscriptionData?.id);
        await handleSubscriptionEnded(supabase, subscriptionData, 'halted');
        break;

      case 'subscription.pending':
        console.log('Subscription pending:', subscriptionData?.id);
        break;

      case 'payment.captured':
        console.log('Payment captured:', paymentData?.id);
        break;

      case 'payment.failed':
        console.log('Payment failed:', paymentData?.id);
        break;

      default:
        console.log('Unhandled webhook event:', event);
    }

    return new Response(
      JSON.stringify({ received: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Webhook processing error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function handleSubscriptionActivated(supabase: any, subscriptionData: any) {
  if (!subscriptionData?.notes?.userId) {
    console.error('No userId in subscription notes');
    return;
  }

  const userId = subscriptionData.notes.userId;
  const tier = subscriptionData.notes.tier || 'plus';

  // Calculate next billing date
  const currentEnd = subscriptionData.current_end 
    ? new Date(subscriptionData.current_end * 1000) 
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  // Upsert subscription
  const { error: subError } = await supabase
    .from('subscriptions')
    .upsert({
      user_id: userId,
      tier: tier,
      status: 'active',
      started_at: new Date().toISOString(),
      expires_at: currentEnd.toISOString(),
      cancelled_at: null,
    }, {
      onConflict: 'user_id',
    });

  if (subError) {
    console.error('Error upserting subscription:', subError);
  }

  // Update user_engagement
  await supabase
    .from('user_engagement')
    .update({
      subscription_tier: tier,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  // Update user_credits
  await supabase
    .from('user_credits')
    .update({
      is_premium: true,
      premium_since: new Date().toISOString(),
      daily_credits_limit: tier === 'pro' ? 500 : 200,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  console.log('Subscription activated for user:', userId);
}

async function handleSubscriptionCharged(supabase: any, subscriptionData: any, paymentData: any) {
  if (!subscriptionData?.notes?.userId) return;

  const userId = subscriptionData.notes.userId;
  const tier = subscriptionData.notes.tier || 'plus';

  // Record payment
  await supabase
    .from('payments')
    .insert({
      user_id: userId,
      razorpay_order_id: subscriptionData.id,
      razorpay_payment_id: paymentData?.id,
      amount: paymentData?.amount || subscriptionData.plan?.item?.amount,
      currency: paymentData?.currency || 'INR',
      status: 'completed',
      tier: tier,
      completed_at: new Date().toISOString(),
    });

  // Extend subscription
  const currentEnd = subscriptionData.current_end 
    ? new Date(subscriptionData.current_end * 1000) 
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await supabase
    .from('subscriptions')
    .update({
      expires_at: currentEnd.toISOString(),
      status: 'active',
    })
    .eq('user_id', userId);

  console.log('Subscription charged for user:', userId);
}

async function handleSubscriptionEnded(supabase: any, subscriptionData: any, status: string) {
  if (!subscriptionData?.notes?.userId) return;

  const userId = subscriptionData.notes.userId;

  // Update subscription status
  await supabase
    .from('subscriptions')
    .update({
      status: status,
      cancelled_at: status === 'cancelled' ? new Date().toISOString() : null,
    })
    .eq('user_id', userId);

  // Downgrade user
  await supabase
    .from('user_engagement')
    .update({
      subscription_tier: 'core',
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  await supabase
    .from('user_credits')
    .update({
      is_premium: false,
      daily_credits_limit: 50,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  console.log('Subscription ended for user:', userId, 'status:', status);
}

async function generateHmac(data: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(data);
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}
