import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
};

// This edge function processes scheduled notifications
// It should be called by a cron job every minute
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify cron secret for security
    const cronSecret = req.headers.get('x-cron-secret');
    const expectedCronSecret = Deno.env.get('CRON_SECRET');
    
    if (!cronSecret || cronSecret !== expectedCronSecret) {
      console.error('Invalid or missing cron secret');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date().toISOString();

    // Get all unsent notifications that are due
    const { data: pendingNotifications, error: fetchError } = await supabase
      .from('scheduled_notifications')
      .select('*')
      .eq('sent', false)
      .lte('scheduled_for', now)
      .order('scheduled_for', { ascending: true })
      .limit(100);

    if (fetchError) {
      console.error('Error fetching pending notifications:', fetchError);
      throw fetchError;
    }

    if (!pendingNotifications || pendingNotifications.length === 0) {
      return new Response(JSON.stringify({
        message: 'No pending notifications',
        processed: 0,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Processing ${pendingNotifications.length} notifications`);

    const processed: string[] = [];
    const failed: string[] = [];

    for (const notification of pendingNotifications) {
      try {
        // Get user's push subscriptions
        const { data: subscriptions } = await supabase
          .from('push_subscriptions')
          .select('*')
          .eq('user_id', notification.user_id);

        // Mark as sent (even if no subscriptions, we don't want to keep retrying)
        const { error: updateError } = await supabase
          .from('scheduled_notifications')
          .update({ sent: true })
          .eq('id', notification.id);

        if (updateError) {
          console.error(`Failed to mark notification ${notification.id} as sent:`, updateError);
          failed.push(notification.id);
          continue;
        }

        // Log the notification for debugging
        console.log(`Processed notification ${notification.id} for user ${notification.user_id}:`, {
          title: notification.title,
          type: notification.notification_type,
          subscriptions: subscriptions?.length || 0,
        });

        processed.push(notification.id);

        // In a full implementation, you would:
        // 1. Use web-push library to send to each subscription
        // 2. Handle failed/expired subscriptions
        // 3. Send FCM for native apps

      } catch (error) {
        console.error(`Error processing notification ${notification.id}:`, error);
        failed.push(notification.id);
      }
    }

    return new Response(JSON.stringify({
      message: 'Notifications processed',
      processed: processed.length,
      failed: failed.length,
      processedIds: processed,
      failedIds: failed,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Process scheduled notifications error:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
