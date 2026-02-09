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

  const startTime = Date.now();
  console.log('🕐 Daily credit reset cron job started at:', new Date().toISOString());

  try {
    // Verify cron secret for security - FAIL CLOSED
    const cronSecret = Deno.env.get('CRON_SECRET');
    
    if (!cronSecret) {
      console.error('❌ CRON_SECRET not configured - rejecting request');
      return new Response(
        JSON.stringify({ error: 'Service misconfigured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const authHeader = req.headers.get('Authorization');
    if (authHeader !== `Bearer ${cronSecret}`) {
      console.error('❌ Unauthorized cron request');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const today = new Date().toISOString().split('T')[0];
    console.log('📅 Today\'s date:', today);

    // Find all users who need their credits reset
    const { data: usersToReset, error: fetchError } = await supabase
      .from('user_credits')
      .select('id, user_id, daily_credits_used, last_reset_date')
      .neq('last_reset_date', today);

    if (fetchError) {
      console.error('❌ Error fetching users:', fetchError);
      throw fetchError;
    }

    console.log(`👥 Found ${usersToReset?.length || 0} users needing credit reset`);

    if (!usersToReset || usersToReset.length === 0) {
      console.log('✅ No users need credit reset today');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No users need reset',
          usersReset: 0,
          processingTimeMs: Date.now() - startTime
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Reset credits for all users
    const { data: updated, error: updateError } = await supabase
      .from('user_credits')
      .update({
        daily_credits_used: 0,
        last_reset_date: today,
        updated_at: new Date().toISOString(),
      })
      .neq('last_reset_date', today)
      .select('id');

    if (updateError) {
      console.error('❌ Error resetting credits:', updateError);
      throw updateError;
    }

    const usersReset = updated?.length || 0;
    const processingTime = Date.now() - startTime;
    
    console.log(`✅ Successfully reset credits for ${usersReset} users`);
    console.log(`⏱️ Processing time: ${processingTime}ms`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Reset credits for ${usersReset} users`,
        usersReset,
        processingTimeMs: processingTime,
        resetDate: today
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Cron job failed:', errorMessage);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage,
        processingTimeMs: Date.now() - startTime
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
