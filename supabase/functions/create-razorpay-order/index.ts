import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tier, userId } = await req.json();
    console.log('Creating Razorpay order for tier:', tier, 'userId:', userId);

    const RAZORPAY_KEY_ID = Deno.env.get('RAZORPAY_KEY_ID');
    const RAZORPAY_KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET');

    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      console.error('Razorpay credentials not configured');
      throw new Error('Payment gateway not configured');
    }

    // Define pricing (in paise - 1 INR = 100 paise)
    const tierPricing: Record<string, { amount: number; name: string }> = {
      plus: { amount: 9900, name: 'AURRA Plus' },   // ₹99
      pro: { amount: 29900, name: 'AURRA Pro' },    // ₹299
    };

    const tierInfo = tierPricing[tier];
    if (!tierInfo) {
      throw new Error('Invalid tier selected');
    }

    // Create Razorpay order
    const orderData = {
      amount: tierInfo.amount,
      currency: 'INR',
      receipt: `${tier}_${Date.now()}`.slice(0, 40),
      notes: {
        tier,
        userId,
        product: tierInfo.name,
      },
    };

    console.log('Creating Razorpay order with data:', orderData);

    const auth = btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`);
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`,
      },
      body: JSON.stringify(orderData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Razorpay API error:', errorText);
      throw new Error('Failed to create payment order');
    }

    const order = await response.json();
    console.log('Razorpay order created:', order.id);

    // Save payment record to database
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { error: insertError } = await supabase
      .from('payments')
      .insert({
        user_id: userId,
        razorpay_order_id: order.id,
        amount: order.amount,
        currency: order.currency,
        status: 'pending',
        tier: tier,
      });

    if (insertError) {
      console.error('Error saving payment record:', insertError);
      // Don't throw - payment can still proceed
    }

    return new Response(
      JSON.stringify({
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: RAZORPAY_KEY_ID,
        tierName: tierInfo.name,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error creating Razorpay order:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
