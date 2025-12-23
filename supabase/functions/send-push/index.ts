import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// This edge function sends push notifications to subscribed users
// It can be called via cron job (with CRON_SECRET) or by authenticated users (for their own notifications)
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Check for cron secret first (for scheduled invocations)
    const cronSecret = req.headers.get('x-cron-secret');
    const expectedCronSecret = Deno.env.get('CRON_SECRET');
    const isCronInvocation = cronSecret && expectedCronSecret && cronSecret === expectedCronSecret;
    
    let authenticatedUserId: string | null = null;
    
    if (!isCronInvocation) {
      // If not a cron job, require user authentication
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        console.error('No authorization header and no valid cron secret');
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Verify the user's token
      const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } }
      });

      const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
      if (authError || !user) {
        console.error('Auth error:', authError);
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      authenticatedUserId = user.id;
    }

    const { type, userId, title, body, data } = await req.json();
    
    // If authenticated user is trying to send to a different user, deny
    if (authenticatedUserId && userId && userId !== authenticatedUserId) {
      console.error('User tried to send notification to another user');
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Determine target user ID
    const targetUserId = authenticatedUserId || userId;
    
    console.log('Push notification request:', { type, targetUserId, isCronInvocation });

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user's push subscriptions
    let query = supabase.from('push_subscriptions').select('*');
    
    if (targetUserId) {
      query = query.eq('user_id', targetUserId);
    } else if (!isCronInvocation) {
      // If no userId specified and not cron, deny (security measure)
      return new Response(JSON.stringify({ error: 'User ID required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: subscriptions, error: subError } = await query;

    if (subError) {
      console.error('Error fetching subscriptions:', subError);
      throw subError;
    }

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(JSON.stringify({ 
        message: 'No subscriptions found',
        sent: 0 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Found ${subscriptions.length} subscriptions`);

    // For now, we'll return info about what would be sent
    // In production, you'd use web-push library or a service like Firebase
    const notificationPayload = {
      title: title || 'AURA',
      body: body || 'You have a notification',
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: type || 'general',
      data: data || {},
    };

    // Note: Actual push sending requires VAPID keys and web-push
    // For MVP, we're using local notifications via service worker
    
    return new Response(JSON.stringify({
      message: 'Notification queued',
      payload: notificationPayload,
      subscriptionCount: subscriptions.length,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Send push error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
