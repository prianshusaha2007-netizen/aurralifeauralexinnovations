import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-razorpay-signature',
};

// IP-based rate limiting for webhooks
const webhookRateLimitMap = new Map<string, { count: number; resetTime: number }>();
const WEBHOOK_RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const WEBHOOK_RATE_LIMIT_MAX_REQUESTS = 100; // 100 webhook requests per minute per IP

function checkWebhookRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const ipLimit = webhookRateLimitMap.get(ip);
  
  if (!ipLimit || now > ipLimit.resetTime) {
    webhookRateLimitMap.set(ip, { count: 1, resetTime: now + WEBHOOK_RATE_LIMIT_WINDOW_MS });
    return { allowed: true };
  }
  
  if (ipLimit.count >= WEBHOOK_RATE_LIMIT_MAX_REQUESTS) {
    const retryAfter = Math.ceil((ipLimit.resetTime - now) / 1000);
    return { allowed: false, retryAfter };
  }
  
  ipLimit.count++;
  return { allowed: true };
}

// Log webhook events for monitoring
function logWebhookEvent(eventType: string, data: Record<string, unknown>) {
  const timestamp = new Date().toISOString();
  console.log(JSON.stringify({
    type: 'WEBHOOK_EVENT',
    timestamp,
    eventType,
    ...data,
  }));
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const requestId = crypto.randomUUID();
  const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const startTime = Date.now();

  try {
    // Rate limit check
    const rateLimit = checkWebhookRateLimit(clientIp);
    if (!rateLimit.allowed) {
      logWebhookEvent('RATE_LIMITED', { requestId, clientIp, retryAfter: rateLimit.retryAfter });
      return new Response(
        JSON.stringify({ error: 'Too many requests' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': String(rateLimit.retryAfter) } }
      );
    }

    const RAZORPAY_WEBHOOK_SECRET = Deno.env.get('RAZORPAY_WEBHOOK_SECRET');
    if (!RAZORPAY_WEBHOOK_SECRET) {
      logWebhookEvent('CONFIG_ERROR', { requestId, error: 'Razorpay webhook secret not configured' });
      throw new Error('Razorpay webhook secret not configured');
    }

    // Get the webhook signature
    const signature = req.headers.get('x-razorpay-signature');
    const body = await req.text();

    logWebhookEvent('WEBHOOK_RECEIVED', { 
      requestId, 
      clientIp, 
      hasSignature: !!signature,
      bodyLength: body.length 
    });

    // Verify webhook signature
    if (!signature) {
      logWebhookEvent('SIGNATURE_MISSING', { requestId, clientIp });
      return new Response(
        JSON.stringify({ error: 'Missing signature' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const expectedSignature = await generateHmac(body, RAZORPAY_WEBHOOK_SECRET);
    const signatureValid = expectedSignature === signature;

    if (!signatureValid) {
      logWebhookEvent('SIGNATURE_INVALID', { 
        requestId, 
        clientIp,
        receivedSignaturePrefix: signature.substring(0, 10) + '...',
        expectedSignaturePrefix: expectedSignature.substring(0, 10) + '...'
      });
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    logWebhookEvent('SIGNATURE_VERIFIED', { requestId });

    const payload = JSON.parse(body);
    const event = payload.event;
    const subscriptionData = payload.payload?.subscription?.entity;
    const paymentData = payload.payload?.payment?.entity;

    logWebhookEvent('EVENT_PARSED', { 
      requestId, 
      event,
      subscriptionId: subscriptionData?.id,
      paymentId: paymentData?.id,
      userId: subscriptionData?.notes?.userId || paymentData?.notes?.userId
    });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let handlerResult = { success: true, action: 'none' };

    switch (event) {
      case 'subscription.authenticated':
        logWebhookEvent('SUBSCRIPTION_AUTHENTICATED', { requestId, subscriptionId: subscriptionData?.id });
        handlerResult = { success: true, action: 'authenticated' };
        break;

      case 'subscription.activated':
        logWebhookEvent('SUBSCRIPTION_ACTIVATED', { 
          requestId, 
          subscriptionId: subscriptionData?.id,
          userId: subscriptionData?.notes?.userId,
          tier: subscriptionData?.notes?.tier
        });
        await handleSubscriptionActivated(supabase, subscriptionData, requestId);
        handlerResult = { success: true, action: 'activated' };
        break;

      case 'subscription.charged':
        logWebhookEvent('SUBSCRIPTION_CHARGED', { 
          requestId, 
          subscriptionId: subscriptionData?.id,
          paymentId: paymentData?.id,
          amount: paymentData?.amount
        });
        await handleSubscriptionCharged(supabase, subscriptionData, paymentData, requestId);
        handlerResult = { success: true, action: 'charged' };
        break;

      case 'subscription.completed':
        logWebhookEvent('SUBSCRIPTION_COMPLETED', { requestId, subscriptionId: subscriptionData?.id });
        await handleSubscriptionEnded(supabase, subscriptionData, 'completed', requestId);
        handlerResult = { success: true, action: 'completed' };
        break;

      case 'subscription.cancelled':
        logWebhookEvent('SUBSCRIPTION_CANCELLED', { requestId, subscriptionId: subscriptionData?.id });
        await handleSubscriptionEnded(supabase, subscriptionData, 'cancelled', requestId);
        handlerResult = { success: true, action: 'cancelled' };
        break;

      case 'subscription.halted':
        logWebhookEvent('SUBSCRIPTION_HALTED', { requestId, subscriptionId: subscriptionData?.id });
        await handleSubscriptionEnded(supabase, subscriptionData, 'halted', requestId);
        handlerResult = { success: true, action: 'halted' };
        break;

      case 'subscription.pending':
        logWebhookEvent('SUBSCRIPTION_PENDING', { requestId, subscriptionId: subscriptionData?.id });
        handlerResult = { success: true, action: 'pending' };
        break;

      case 'payment.captured':
        logWebhookEvent('PAYMENT_CAPTURED', { requestId, paymentId: paymentData?.id, amount: paymentData?.amount });
        handlerResult = { success: true, action: 'payment_captured' };
        break;

      case 'payment.failed':
        logWebhookEvent('PAYMENT_FAILED', { 
          requestId, 
          paymentId: paymentData?.id,
          errorCode: paymentData?.error_code,
          errorDescription: paymentData?.error_description
        });
        handlerResult = { success: true, action: 'payment_failed' };
        break;

      default:
        logWebhookEvent('UNHANDLED_EVENT', { requestId, event });
        handlerResult = { success: true, action: 'unhandled' };
    }

    const processingTime = Date.now() - startTime;
    logWebhookEvent('WEBHOOK_COMPLETED', { 
      requestId, 
      processingTimeMs: processingTime,
      ...handlerResult
    });

    return new Response(
      JSON.stringify({ received: true, requestId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    const processingTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    logWebhookEvent('WEBHOOK_ERROR', { 
      requestId, 
      processingTimeMs: processingTime,
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return new Response(
      JSON.stringify({ error: errorMessage, requestId }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function handleSubscriptionActivated(supabase: any, subscriptionData: Record<string, unknown>, requestId: string) {
  const notes = subscriptionData?.notes as Record<string, string> | undefined;
  if (!notes?.userId) {
    logWebhookEvent('HANDLER_ERROR', { requestId, handler: 'activated', error: 'No userId in subscription notes' });
    return;
  }

  const userId = notes.userId;
  const tier = notes.tier || 'plus';

  // Calculate next billing date
  const currentEnd = subscriptionData.current_end 
    ? new Date((subscriptionData.current_end as number) * 1000) 
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
    logWebhookEvent('DB_ERROR', { requestId, handler: 'activated', table: 'subscriptions', error: subError.message });
  }

  // Update user_engagement
  const { error: engError } = await supabase
    .from('user_engagement')
    .update({
      subscription_tier: tier,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  if (engError) {
    logWebhookEvent('DB_ERROR', { requestId, handler: 'activated', table: 'user_engagement', error: engError.message });
  }

  // Update user_credits with new tier limits
  // Aligned with payment architecture spec: Free=20, Basic=60, Plus=150, Pro=999999
  const creditLimits: Record<string, number> = {
    core: 20,
    basic: 60,
    plus: 150,
    pro: 999999,
  };
  
  const { error: credError } = await supabase
    .from('user_credits')
    .update({
      is_premium: true,
      premium_since: new Date().toISOString(),
      daily_credits_limit: creditLimits[tier] || 150,
      daily_credits_used: 0, // Reset on activation
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  if (credError) {
    logWebhookEvent('DB_ERROR', { requestId, handler: 'activated', table: 'user_credits', error: credError.message });
  }

  // Insert system chat message to confirm upgrade in chat
  const tierNames: Record<string, string> = { basic: 'Basic', plus: 'Plus', pro: 'Pro' };
  const tierName = tierNames[tier] || 'Plus';
  const confirmationMessage = `You're on ${tierName} now ✨\nYou can think deeper, learn faster, and stay with me all day. Let's make the most of it!`;
  
  const { error: chatError } = await supabase
    .from('chat_messages')
    .insert({
      user_id: userId,
      sender: 'assistant',
      content: confirmationMessage,
      chat_date: new Date().toISOString().split('T')[0],
    });

  if (chatError) {
    logWebhookEvent('DB_ERROR', { requestId, handler: 'activated', table: 'chat_messages', error: chatError.message });
  } else {
    logWebhookEvent('CHAT_CONFIRMATION_SENT', { requestId, userId, tier });
  }

  logWebhookEvent('HANDLER_SUCCESS', { requestId, handler: 'activated', userId, tier });
}

async function handleSubscriptionCharged(supabase: any, subscriptionData: Record<string, unknown>, paymentData: Record<string, unknown>, requestId: string) {
  const notes = subscriptionData?.notes as Record<string, string> | undefined;
  if (!notes?.userId) {
    logWebhookEvent('HANDLER_ERROR', { requestId, handler: 'charged', error: 'No userId in subscription notes' });
    return;
  }

  const userId = notes.userId;
  const tier = notes.tier || 'plus';

  // Record payment
  const { error: payError } = await supabase
    .from('payments')
    .insert({
      user_id: userId,
      razorpay_order_id: subscriptionData.id as string,
      razorpay_payment_id: paymentData?.id as string | undefined,
      amount: (paymentData?.amount as number) || ((subscriptionData.plan as Record<string, unknown>)?.item as Record<string, unknown>)?.amount as number,
      currency: (paymentData?.currency as string) || 'INR',
      status: 'completed',
      tier: tier,
      completed_at: new Date().toISOString(),
    });

  if (payError) {
    logWebhookEvent('DB_ERROR', { requestId, handler: 'charged', table: 'payments', error: payError.message });
  }

  // Extend subscription
  const currentEnd = subscriptionData.current_end 
    ? new Date((subscriptionData.current_end as number) * 1000) 
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const { error: subError } = await supabase
    .from('subscriptions')
    .update({
      expires_at: currentEnd.toISOString(),
      status: 'active',
    })
    .eq('user_id', userId);

  if (subError) {
    logWebhookEvent('DB_ERROR', { requestId, handler: 'charged', table: 'subscriptions', error: subError.message });
  }

  logWebhookEvent('HANDLER_SUCCESS', { requestId, handler: 'charged', userId });
}

async function handleSubscriptionEnded(supabase: any, subscriptionData: Record<string, unknown>, status: string, requestId: string) {
  const notes = subscriptionData?.notes as Record<string, string> | undefined;
  if (!notes?.userId) {
    logWebhookEvent('HANDLER_ERROR', { requestId, handler: 'ended', error: 'No userId in subscription notes' });
    return;
  }

  const userId = notes.userId;

  // Update subscription status
  const { error: subError } = await supabase
    .from('subscriptions')
    .update({
      status: status,
      cancelled_at: status === 'cancelled' ? new Date().toISOString() : null,
    })
    .eq('user_id', userId);

  if (subError) {
    logWebhookEvent('DB_ERROR', { requestId, handler: 'ended', table: 'subscriptions', error: subError.message });
  }

  // Downgrade user
  const { error: engError } = await supabase
    .from('user_engagement')
    .update({
      subscription_tier: 'core',
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  if (engError) {
    logWebhookEvent('DB_ERROR', { requestId, handler: 'ended', table: 'user_engagement', error: engError.message });
  }

  const { error: credError } = await supabase
    .from('user_credits')
    .update({
      is_premium: false,
      daily_credits_limit: 30, // Free tier limit
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  if (credError) {
    logWebhookEvent('DB_ERROR', { requestId, handler: 'ended', table: 'user_credits', error: credError.message });
  }

  logWebhookEvent('HANDLER_SUCCESS', { requestId, handler: 'ended', userId, status });
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
