import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple in-memory rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10; // 10 requests per minute per user

function checkRateLimit(userId: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const userLimit = rateLimitMap.get(userId);
  
  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true };
  }
  
  if (userLimit.count >= RATE_LIMIT_MAX_REQUESTS) {
    const retryAfter = Math.ceil((userLimit.resetTime - now) / 1000);
    return { allowed: false, retryAfter };
  }
  
  userLimit.count++;
  return { allowed: true };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate the user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header provided');
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Create auth client to verify the user
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      console.error('Authentication failed:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use authenticated user's ID - never trust client-supplied userId
    const authenticatedUserId = user.id;

    // Check rate limit
    const rateLimit = checkRateLimit(authenticatedUserId);
    if (!rateLimit.allowed) {
      console.warn('Rate limit exceeded for user:', authenticatedUserId);
      return new Response(
        JSON.stringify({ error: 'Too many requests. Please try again later.', retryAfter: rateLimit.retryAfter }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': String(rateLimit.retryAfter) } }
      );
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, tier } = await req.json();
    console.log('Verifying payment:', { razorpay_order_id, razorpay_payment_id, tier, authenticatedUserId });

    const RAZORPAY_KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET');
    if (!RAZORPAY_KEY_SECRET) {
      throw new Error('Payment gateway not configured');
    }

    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = await generateHmac(body, RAZORPAY_KEY_SECRET);

    if (expectedSignature !== razorpay_signature) {
      console.error('Signature verification failed');
      throw new Error('Payment verification failed');
    }

    console.log('Payment signature verified successfully');

    // Use service role for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Update payment record
    const { data: paymentData, error: paymentError } = await supabase
      .from('payments')
      .update({
        razorpay_payment_id: razorpay_payment_id,
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('razorpay_order_id', razorpay_order_id)
      .eq('user_id', authenticatedUserId) // Ensure payment belongs to authenticated user
      .select()
      .single();

    if (paymentError) {
      console.error('Error updating payment:', paymentError);
    }

    // Calculate subscription expiry (30 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Upsert subscription
    const { error: subError } = await supabase
      .from('subscriptions')
      .upsert({
        user_id: authenticatedUserId,
        tier: tier,
        status: 'active',
        started_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
        cancelled_at: null,
        payment_id: paymentData?.id,
      }, {
        onConflict: 'user_id',
      });

    if (subError) {
      console.error('Error upserting subscription:', subError);
    }

    // Update user_engagement with new tier
    const { error: engagementError } = await supabase
      .from('user_engagement')
      .update({
        subscription_tier: tier,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', authenticatedUserId);

    if (engagementError) {
      console.error('Error updating engagement:', engagementError);
    }

    // Update user_credits to premium with new tier limits
    // Free: 30, Basic: 120, Plus: 300, Pro: 999 (unlimited)
    const creditLimits: Record<string, number> = {
      core: 30,
      basic: 120,
      plus: 300,
      pro: 999,
    };
    
    const { error: creditsError } = await supabase
      .from('user_credits')
      .update({
        is_premium: true,
        premium_since: new Date().toISOString(),
        daily_credits_limit: creditLimits[tier] || 300,
        daily_credits_used: 0, // Reset on upgrade
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', authenticatedUserId);

    if (creditsError) {
      console.error('Error updating credits:', creditsError);
    }

    console.log('User subscription updated successfully');

    return new Response(
      JSON.stringify({ success: true, message: 'Payment verified and subscription activated' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error verifying payment:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

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
