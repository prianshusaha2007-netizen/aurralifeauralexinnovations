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
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Running routine notification scheduler...');

    // Get all users with their activity patterns
    const { data: users } = await supabase.from('profiles').select('id, name, wake_time, sleep_time');
    
    if (!users) return new Response(JSON.stringify({ success: false }), { headers: corsHeaders });

    const now = new Date();
    const currentHour = now.getHours();

    for (const user of users) {
      // Fetch user's activity patterns from last week
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);

      const [habitsRes, routinesRes, hydrationRes] = await Promise.all([
        supabase.from('habit_completions')
          .select('completed_at')
          .eq('user_id', user.id)
          .gte('completed_at', weekAgo.toISOString().split('T')[0]),
        supabase.from('routines')
          .select('time, type, completed')
          .eq('user_id', user.id),
        supabase.from('hydration_logs')
          .select('created_at')
          .eq('user_id', user.id)
          .gte('created_at', weekAgo.toISOString())
      ]);

      // Analyze patterns and generate recommendations
      const habits = habitsRes.data || [];
      const routines = routinesRes.data || [];
      const hydration = hydrationRes.data || [];

      // Calculate activity patterns by hour
      const activityByHour: Record<number, number> = {};
      habits.forEach(h => {
        const hour = new Date(h.completed_at).getHours();
        activityByHour[hour] = (activityByHour[hour] || 0) + 1;
      });

      // Find peak activity hours
      const peakHours = Object.entries(activityByHour)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([hour]) => parseInt(hour));

      // Generate personalized recommendations
      const recommendations: { title: string; body: string; hour: number }[] = [];

      // Morning recommendation
      const wakeHour = parseInt(user.wake_time?.split(':')[0] || '7');
      if (currentHour === wakeHour) {
        recommendations.push({
          title: '🌅 Good Morning!',
          body: `Hey ${user.name}! Start your day strong. You've been most productive at ${peakHours[0] || 9}:00 lately!`,
          hour: wakeHour
        });
      }

      // Peak productivity reminder
      if (peakHours.includes(currentHour) && habits.length >= 3) {
        recommendations.push({
          title: '⚡ Peak Time!',
          body: `This is usually your most productive hour! Perfect time for important tasks.`,
          hour: currentHour
        });
      }

      // Hydration check
      const todayHydration = hydration.filter(h => 
        h.created_at.split('T')[0] === now.toISOString().split('T')[0]
      ).length;
      
      if (currentHour >= 12 && currentHour <= 18 && todayHydration < 4) {
        recommendations.push({
          title: '💧 Hydration Check',
          body: `You've had ${todayHydration} glasses today. Let's stay hydrated!`,
          hour: currentHour
        });
      }

      // Evening wind-down
      const sleepHour = parseInt(user.sleep_time?.split(':')[0] || '23');
      if (currentHour === sleepHour - 1) {
        recommendations.push({
          title: '🌙 Wind Down Time',
          body: `Time to start winding down. You usually sleep around ${user.sleep_time}. Great job today!`,
          hour: sleepHour - 1
        });
      }

      // Weekly summary (Sunday evening)
      if (now.getDay() === 0 && currentHour === 19) {
        const completionRate = routines.length > 0 
          ? Math.round((routines.filter(r => r.completed).length / routines.length) * 100)
          : 0;
        
        recommendations.push({
          title: '📊 Weekly Summary',
          body: `This week: ${habits.length} habits completed, ${completionRate}% routine completion. Keep it up!`,
          hour: 19
        });
      }

      // Store scheduled notifications
      for (const rec of recommendations) {
        const scheduledFor = new Date();
        scheduledFor.setHours(rec.hour, 0, 0, 0);
        
        if (scheduledFor < now) {
          scheduledFor.setDate(scheduledFor.getDate() + 1);
        }

        await supabase.from('scheduled_notifications').insert({
          user_id: user.id,
          notification_type: 'routine_recommendation',
          title: rec.title,
          body: rec.body,
          scheduled_for: scheduledFor.toISOString()
        });
      }
    }

    // Send pending notifications
    const { data: pendingNotifications } = await supabase
      .from('scheduled_notifications')
      .select('*')
      .eq('sent', false)
      .lte('scheduled_for', now.toISOString());

    if (pendingNotifications && pendingNotifications.length > 0) {
      for (const notif of pendingNotifications) {
        // Get user's push subscription
        const { data: subscription } = await supabase
          .from('push_subscriptions')
          .select('*')
          .eq('user_id', notif.user_id)
          .maybeSingle();

        if (subscription) {
          // Mark as sent
          await supabase
            .from('scheduled_notifications')
            .update({ sent: true })
            .eq('id', notif.id);
          
          console.log(`Notification sent to user ${notif.user_id}: ${notif.title}`);
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: users.length,
        notificationsSent: pendingNotifications?.length || 0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Routine notifications error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
