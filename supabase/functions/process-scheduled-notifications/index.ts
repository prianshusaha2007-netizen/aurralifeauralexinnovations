import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
};

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

    if (fetchError) throw fetchError;

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
    const pushSent: string[] = [];

    for (const notification of pendingNotifications) {
      try {
        // Actually send push notification via send-web-push
        try {
          const pushResponse = await fetch(`${supabaseUrl}/functions/v1/send-web-push`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseServiceKey}`,
            },
            body: JSON.stringify({
              userId: notification.user_id,
              title: notification.title,
              body: notification.body,
              tag: `scheduled-${notification.id}`,
              data: { notificationId: notification.id, type: notification.notification_type },
            }),
          });

          if (pushResponse.ok) {
            const pushResult = await pushResponse.json();
            if (pushResult.success) {
              pushSent.push(notification.id);
            }
            console.log(`Push result for ${notification.id}:`, pushResult);
          } else {
            console.warn(`Push failed for ${notification.id}: ${pushResponse.status}`);
          }
        } catch (pushErr) {
          console.warn(`Push delivery error for ${notification.id}:`, pushErr);
        }

        // Mark as sent
        const { error: updateError } = await supabase
          .from('scheduled_notifications')
          .update({ sent: true })
          .eq('id', notification.id);

        if (updateError) {
          console.error(`Failed to mark notification ${notification.id} as sent:`, updateError);
          failed.push(notification.id);
          continue;
        }

        processed.push(notification.id);
      } catch (error) {
        console.error(`Error processing notification ${notification.id}:`, error);
        failed.push(notification.id);
      }
    }

    return new Response(JSON.stringify({
      message: 'Notifications processed',
      processed: processed.length,
      pushSent: pushSent.length,
      failed: failed.length,
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
