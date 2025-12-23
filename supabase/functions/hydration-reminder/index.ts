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
    // Verify cron secret for scheduled invocations
    const cronSecret = req.headers.get('x-cron-secret');
    const expectedSecret = Deno.env.get('CRON_SECRET');
    
    if (!expectedSecret) {
      console.error('CRON_SECRET not configured');
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    if (cronSecret !== expectedSecret) {
      console.error('Invalid cron secret');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Checking hydration reminders...');

    // Get all users with hydration reminders enabled
    const { data: settings, error: settingsError } = await supabase
      .from('hydration_settings')
      .select('user_id, reminder_interval_minutes, daily_goal_ml')
      .eq('reminder_enabled', true);

    if (settingsError) {
      console.error('Error fetching settings:', settingsError);
      throw settingsError;
    }

    console.log(`Found ${settings?.length || 0} users with reminders enabled`);

    const now = new Date();
    const currentHour = now.getHours();
    
    // Only send reminders during waking hours (7 AM - 10 PM)
    if (currentHour < 7 || currentHour >= 22) {
      console.log('Outside waking hours, skipping reminders');
      return new Response(JSON.stringify({ message: 'Outside waking hours' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let notificationsSent = 0;

    for (const setting of settings || []) {
      try {
        // Get user's push subscriptions
        const { data: subscriptions } = await supabase
          .from('push_subscriptions')
          .select('*')
          .eq('user_id', setting.user_id);

        if (!subscriptions || subscriptions.length === 0) {
          console.log(`No push subscriptions for user ${setting.user_id}`);
          continue;
        }

        // Check user's profile for wake/sleep times
        const { data: profile } = await supabase
          .from('profiles')
          .select('wake_time, sleep_time, name')
          .eq('id', setting.user_id)
          .single();

        // Parse wake/sleep times
        const wakeHour = profile?.wake_time ? parseInt(profile.wake_time.split(':')[0]) : 7;
        const sleepHour = profile?.sleep_time ? parseInt(profile.sleep_time.split(':')[0]) : 23;

        // Skip if outside user's waking hours
        if (currentHour < wakeHour || currentHour >= sleepHour) {
          console.log(`Outside user ${setting.user_id} waking hours`);
          continue;
        }

        // Get today's hydration total
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        
        const { data: logs } = await supabase
          .from('hydration_logs')
          .select('amount_ml')
          .eq('user_id', setting.user_id)
          .gte('created_at', todayStart.toISOString());

        const totalToday = logs?.reduce((sum, log) => sum + log.amount_ml, 0) || 0;
        const progress = Math.round((totalToday / setting.daily_goal_ml) * 100);

        // Skip if goal already reached
        if (totalToday >= setting.daily_goal_ml) {
          console.log(`User ${setting.user_id} already reached goal`);
          continue;
        }

        // Calculate minutes since start of day to determine if reminder is due
        const minutesSinceMidnight = currentHour * 60 + now.getMinutes();
        
        // Use a simple check - send if we're at the start of an interval window (within 15 min)
        const minuteInInterval = minutesSinceMidnight % setting.reminder_interval_minutes;
        if (minuteInInterval > 15) {
          console.log(`Not in reminder window for user ${setting.user_id}`);
          continue;
        }

        const remaining = setting.daily_goal_ml - totalToday;
        const glasses = Math.ceil(remaining / 250);

        const messages = [
          `💧 Time to hydrate! You're at ${progress}% - just ${glasses} more glasses to go!`,
          `🌊 Water break! ${remaining}ml left to reach your goal today.`,
          `💦 Hey${profile?.name ? ` ${profile.name}` : ''}! Don't forget to drink water. ${progress}% complete!`,
          `🥤 Hydration check! You need ${glasses} more glasses today.`,
          `💧 Stay refreshed! ${remaining}ml until you hit your goal.`
        ];

        const message = messages[Math.floor(Math.random() * messages.length)];

        // Send push notification to all subscriptions
        for (const sub of subscriptions) {
          try {
            // Use web-push compatible format
            const pushPayload = {
              title: 'AURA Hydration Reminder',
              body: message,
              icon: '/favicon.ico',
              badge: '/favicon.ico',
              data: {
                type: 'hydration',
                url: '/'
              }
            };

            // Send via the send-push function
            const { error: pushError } = await supabase.functions.invoke('send-push', {
              body: {
                subscription: {
                  endpoint: sub.endpoint,
                  keys: {
                    p256dh: sub.p256dh,
                    auth: sub.auth
                  }
                },
                payload: pushPayload
              }
            });

            if (pushError) {
              console.error('Push error:', pushError);
            } else {
              notificationsSent++;
              console.log(`Sent hydration reminder to user ${setting.user_id}`);
            }
          } catch (pushErr) {
            console.error('Error sending push:', pushErr);
          }
        }
      } catch (userError) {
        console.error(`Error processing user ${setting.user_id}:`, userError);
      }
    }

    console.log(`Sent ${notificationsSent} hydration reminders`);

    return new Response(JSON.stringify({ 
      success: true, 
      notificationsSent,
      timestamp: now.toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Hydration reminder error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
