import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Razorpay plan IDs (create these in Razorpay dashboard or via API)
const PLAN_CONFIG: Record<string, { planId: string; name: string; amount: number }> = {
  plus: { planId: '', name: 'AURRA Plus', amount: 9900 },   // ₹99
  pro: { planId: '', name: 'AURRA Pro', amount: 29900 },    // ₹299
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tier, userId, userEmail, userName } = await req.json();
    console.log('Creating Razorpay subscription for tier:', tier, 'userId:', userId);

    const RAZORPAY_KEY_ID = Deno.env.get('RAZORPAY_KEY_ID');
    const RAZORPAY_KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET');

    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      console.error('Razorpay credentials not configured');
      throw new Error('Payment gateway not configured');
    }

    const auth = btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`);
    const tierConfig = PLAN_CONFIG[tier];
    
    if (!tierConfig) {
      throw new Error('Invalid tier selected');
    }

    // First, ensure we have a plan created
    let planId = tierConfig.planId;
    
    if (!planId) {
      // Create a plan if it doesn't exist
      console.log('Creating Razorpay plan for tier:', tier);
      const planResponse = await fetch('https://api.razorpay.com/v1/plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${auth}`,
        },
        body: JSON.stringify({
          period: 'monthly',
          interval: 1,
          item: {
            name: tierConfig.name,
            amount: tierConfig.amount,
            currency: 'INR',
            description: `${tierConfig.name} Monthly Subscription`,
          },
        }),
      });

      if (!planResponse.ok) {
        const errorText = await planResponse.text();
        console.error('Failed to create plan:', errorText);
        throw new Error('Failed to create subscription plan');
      }

      const plan = await planResponse.json();
      planId = plan.id;
      console.log('Plan created:', planId);
    }

    // Create a subscription
    const subscriptionData = {
      plan_id: planId,
      total_count: 12, // 12 months of billing cycles
      quantity: 1,
      customer_notify: 1,
      notes: {
        tier,
        userId,
        product: tierConfig.name,
      },
    };

    console.log('Creating Razorpay subscription:', subscriptionData);

    const subResponse = await fetch('https://api.razorpay.com/v1/subscriptions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`,
      },
      body: JSON.stringify(subscriptionData),
    });

    if (!subResponse.ok) {
      const errorText = await subResponse.text();
      console.error('Razorpay subscription API error:', errorText);
      throw new Error('Failed to create subscription');
    }

    const subscription = await subResponse.json();
    console.log('Razorpay subscription created:', subscription.id);

    // Save subscription record to database
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { error: insertError } = await supabase
      .from('payments')
      .insert({
        user_id: userId,
        razorpay_order_id: subscription.id,
        amount: tierConfig.amount,
        currency: 'INR',
        status: 'pending',
        tier: tier,
      });

    if (insertError) {
      console.error('Error saving payment record:', insertError);
    }

    return new Response(
      JSON.stringify({
        subscriptionId: subscription.id,
        shortUrl: subscription.short_url,
        amount: tierConfig.amount,
        currency: 'INR',
        keyId: RAZORPAY_KEY_ID,
        tierName: tierConfig.name,
        planId: planId,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error creating Razorpay subscription:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
