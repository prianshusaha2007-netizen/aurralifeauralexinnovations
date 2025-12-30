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
    // Authentication check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.log('Unauthorized: No authorization header');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.log('Unauthorized: Invalid user token', authError?.message);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { subscription, title, body, icon, data } = await req.json();
    
    console.log('Sending push notification for user:', user.id, { title, body });

    if (!subscription || !title) {
      return new Response(
        JSON.stringify({ error: 'Subscription and title are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify subscription belongs to authenticated user
    if (subscription.endpoint) {
      const { data: userSub, error: subError } = await supabase
        .from('push_subscriptions')
        .select('user_id')
        .eq('endpoint', subscription.endpoint)
        .eq('user_id', user.id)
        .maybeSingle();

      if (subError) {
        console.error('Subscription lookup error:', subError.message);
      }

      if (!userSub) {
        console.log('Forbidden: Subscription does not belong to user');
        return new Response(
          JSON.stringify({ error: 'Invalid subscription' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Create notification payload
    const notificationPayload = {
      title,
      body: body || '',
      icon: icon || '/favicon.ico',
      data: data || {},
      timestamp: new Date().toISOString(),
    };

    console.log('Notification payload created for user:', user.id, notificationPayload);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Notification sent',
        payload: notificationPayload 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Push notification error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to send notification';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
