import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, tier, userId } = await req.json();
    console.log('Verifying payment:', { razorpay_order_id, razorpay_payment_id, tier, userId });

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

    // Update user's subscription in database
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
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
        user_id: userId,
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
      .eq('user_id', userId);

    if (engagementError) {
      console.error('Error updating engagement:', engagementError);
    }

    // Update user_credits to premium
    const { error: creditsError } = await supabase
      .from('user_credits')
      .update({
        is_premium: true,
        premium_since: new Date().toISOString(),
        daily_credits_limit: tier === 'pro' ? 500 : 200,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

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
