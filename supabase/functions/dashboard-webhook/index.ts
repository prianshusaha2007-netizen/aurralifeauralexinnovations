import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-secret',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  
  try {
    // Verify webhook secret for security
    const webhookSecret = req.headers.get('x-webhook-secret');
    const expectedSecret = Deno.env.get('WEBHOOK_SECRET');
    
    if (expectedSecret && webhookSecret !== expectedSecret) {
      console.log('[Dashboard Webhook] Unauthorized access attempt');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const url = new URL(req.url);
    const endpoint = url.pathname.split('/').pop();
    const params = Object.fromEntries(url.searchParams);

    console.log(`[Dashboard Webhook] Request: ${endpoint}, Params:`, params);

    let responseData: any = {};

    switch (endpoint) {
      case 'overview':
        responseData = await getOverviewMetrics(supabase);
        break;
      
      case 'users':
        responseData = await getUserMetrics(supabase, params);
        break;
      
      case 'engagement':
        responseData = await getEngagementMetrics(supabase, params);
        break;
      
      case 'subscriptions':
        responseData = await getSubscriptionMetrics(supabase);
        break;
      
      case 'chat':
        responseData = await getChatMetrics(supabase, params);
        break;
      
      case 'focus':
        responseData = await getFocusMetrics(supabase, params);
        break;
      
      case 'habits':
        responseData = await getHabitMetrics(supabase, params);
        break;
      
      case 'moods':
        responseData = await getMoodMetrics(supabase, params);
        break;

      case 'challenges':
        responseData = await getChallengeMetrics(supabase);
        break;

      case 'realtime':
        responseData = await getRealtimeStats(supabase);
        break;

      default:
        // Return all metrics for root endpoint
        responseData = await getAllMetrics(supabase);
    }

    const processingTime = Date.now() - startTime;
    console.log(`[Dashboard Webhook] Completed in ${processingTime}ms`);

    return new Response(
      JSON.stringify({
        success: true,
        timestamp: new Date().toISOString(),
        processingTimeMs: processingTime,
        data: responseData
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Dashboard Webhook] Error:', errorMessage);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage,
        timestamp: new Date().toISOString()
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function getOverviewMetrics(supabase: any) {
  const [
    { count: totalUsers },
    { count: totalMessages },
    { count: activeSubscriptions },
    { count: totalFocusSessions },
    { count: totalHabits }
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('chat_messages').select('*', { count: 'exact', head: true }),
    supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('focus_sessions').select('*', { count: 'exact', head: true }),
    supabase.from('habits').select('*', { count: 'exact', head: true })
  ]);

  return {
    totalUsers: totalUsers || 0,
    totalMessages: totalMessages || 0,
    activeSubscriptions: activeSubscriptions || 0,
    totalFocusSessions: totalFocusSessions || 0,
    totalHabits: totalHabits || 0
  };
}

async function getUserMetrics(supabase: any, params: Record<string, string>) {
  const limit = parseInt(params.limit) || 100;
  const offset = parseInt(params.offset) || 0;

  const [
    { data: profiles, count: totalCount },
    { data: recentSignups },
    { count: activeToday }
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, name, age, gender, profession, created_at, preferred_model', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1),
    supabase
      .from('profiles')
      .select('id, name, created_at')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false }),
    supabase
      .from('user_engagement')
      .select('*', { count: 'exact', head: true })
      .gte('last_interaction_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
  ]);

  return {
    users: profiles || [],
    totalCount: totalCount || 0,
    recentSignups: recentSignups?.length || 0,
    activeToday: activeToday || 0,
    pagination: { limit, offset }
  };
}

async function getEngagementMetrics(supabase: any, params: Record<string, string>) {
  const days = parseInt(params.days) || 30;
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const [
    { data: engagementData },
    { data: dailyActivity }
  ] = await Promise.all([
    supabase
      .from('user_engagement')
      .select('*')
      .order('last_interaction_at', { ascending: false })
      .limit(1000),
    supabase
      .from('chat_messages')
      .select('created_at')
      .gte('created_at', startDate)
  ]);

  // Calculate engagement stats
  const totalMessages = engagementData?.reduce((sum: number, e: any) => sum + (e.total_messages || 0), 0) || 0;
  const avgDaysActive = engagementData?.reduce((sum: number, e: any) => sum + (e.total_days_active || 0), 0) / (engagementData?.length || 1);
  
  // Group daily activity
  const activityByDay: Record<string, number> = {};
  dailyActivity?.forEach((msg: any) => {
    const day = msg.created_at.split('T')[0];
    activityByDay[day] = (activityByDay[day] || 0) + 1;
  });

  const relationshipPhases = engagementData?.reduce((acc: Record<string, number>, e: any) => {
    const phase = e.relationship_phase || 'unknown';
    acc[phase] = (acc[phase] || 0) + 1;
    return acc;
  }, {}) || {};

  return {
    totalEngagedUsers: engagementData?.length || 0,
    totalMessages,
    avgDaysActive: Math.round(avgDaysActive * 10) / 10,
    relationshipPhases,
    dailyActivity: activityByDay,
    moodShares: engagementData?.reduce((sum: number, e: any) => sum + (e.mood_shares || 0), 0) || 0,
    skillSessions: engagementData?.reduce((sum: number, e: any) => sum + (e.skill_sessions || 0), 0) || 0
  };
}

async function getSubscriptionMetrics(supabase: any) {
  const [
    { data: subscriptions },
    { data: payments },
    { data: credits }
  ] = await Promise.all([
    supabase
      .from('subscriptions')
      .select('tier, status, created_at, expires_at'),
    supabase
      .from('payments')
      .select('amount, currency, status, tier, created_at')
      .order('created_at', { ascending: false })
      .limit(100),
    supabase
      .from('user_credits')
      .select('is_premium, daily_credits_used, daily_credits_limit')
  ]);

  const tierCounts = subscriptions?.reduce((acc: Record<string, number>, s: any) => {
    const tier = s.tier || 'free';
    acc[tier] = (acc[tier] || 0) + 1;
    return acc;
  }, {}) || {};

  const activeSubscriptions = subscriptions?.filter((s: any) => s.status === 'active') || [];
  const completedPayments = payments?.filter((p: any) => p.status === 'completed') || [];
  const totalRevenue = completedPayments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
  const premiumUsers = credits?.filter((c: any) => c.is_premium)?.length || 0;

  return {
    totalSubscriptions: subscriptions?.length || 0,
    activeSubscriptions: activeSubscriptions.length,
    tierDistribution: tierCounts,
    premiumUsers,
    recentPayments: completedPayments.slice(0, 10),
    totalRevenue,
    avgCreditsUsed: credits?.reduce((sum: number, c: any) => sum + (c.daily_credits_used || 0), 0) / (credits?.length || 1)
  };
}

async function getChatMetrics(supabase: any, params: Record<string, string>) {
  const days = parseInt(params.days) || 7;
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const [
    { data: messages, count: totalCount },
    { data: summaries },
    { data: sessions }
  ] = await Promise.all([
    supabase
      .from('chat_messages')
      .select('sender, created_at', { count: 'exact' })
      .gte('created_at', startDate),
    supabase
      .from('chat_summaries')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('chat_sessions')
      .select('*')
      .gte('created_at', startDate)
  ]);

  const messagesBySender = messages?.reduce((acc: Record<string, number>, m: any) => {
    acc[m.sender] = (acc[m.sender] || 0) + 1;
    return acc;
  }, {}) || {};

  const messagesByDay: Record<string, number> = {};
  messages?.forEach((msg: any) => {
    const day = msg.created_at.split('T')[0];
    messagesByDay[day] = (messagesByDay[day] || 0) + 1;
  });

  return {
    totalMessages: totalCount || 0,
    messagesBySender,
    messagesByDay,
    avgMessagesPerDay: Math.round((totalCount || 0) / days),
    totalSummaries: summaries?.length || 0,
    totalSessions: sessions?.length || 0,
    keyTopics: summaries?.flatMap((s: any) => s.key_topics || []).slice(0, 20) || []
  };
}

async function getFocusMetrics(supabase: any, params: Record<string, string>) {
  const days = parseInt(params.days) || 30;
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const { data: sessions } = await supabase
    .from('focus_sessions')
    .select('*')
    .gte('created_at', startDate);

  const totalMinutes = sessions?.reduce((sum: number, s: any) => sum + (s.duration_minutes || 0), 0) || 0;
  const completedSessions = sessions?.filter((s: any) => s.completed === 'yes' || s.completed === true) || [];
  
  const byType = sessions?.reduce((acc: Record<string, { count: number; minutes: number }>, s: any) => {
    const type = s.focus_type || 'other';
    if (!acc[type]) acc[type] = { count: 0, minutes: 0 };
    acc[type].count++;
    acc[type].minutes += s.duration_minutes || 0;
    return acc;
  }, {}) || {};

  const struggleRate = sessions?.filter((s: any) => (s.struggled_count || 0) > 0).length / (sessions?.length || 1);

  return {
    totalSessions: sessions?.length || 0,
    completedSessions: completedSessions.length,
    completionRate: Math.round((completedSessions.length / (sessions?.length || 1)) * 100),
    totalMinutes,
    avgSessionDuration: Math.round(totalMinutes / (sessions?.length || 1)),
    byType,
    struggleRate: Math.round(struggleRate * 100)
  };
}

async function getHabitMetrics(supabase: any, params: Record<string, string>) {
  const days = parseInt(params.days) || 30;
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const [
    { data: habits },
    { data: completions }
  ] = await Promise.all([
    supabase.from('habits').select('*'),
    supabase
      .from('habit_completions')
      .select('*')
      .gte('completed_at', startDate)
  ]);

  const completionsByDay: Record<string, number> = {};
  completions?.forEach((c: any) => {
    const day = c.completed_at.split('T')[0];
    completionsByDay[day] = (completionsByDay[day] || 0) + 1;
  });

  return {
    totalHabits: habits?.length || 0,
    totalCompletions: completions?.length || 0,
    avgCompletionsPerDay: Math.round((completions?.length || 0) / days),
    completionsByDay,
    habitsByFrequency: habits?.reduce((acc: Record<string, number>, h: any) => {
      const freq = h.frequency || 'daily';
      acc[freq] = (acc[freq] || 0) + 1;
      return acc;
    }, {}) || {}
  };
}

async function getMoodMetrics(supabase: any, params: Record<string, string>) {
  const days = parseInt(params.days) || 30;
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const { data: checkins } = await supabase
    .from('mood_checkins')
    .select('*')
    .gte('created_at', startDate);

  const moodDistribution = checkins?.reduce((acc: Record<string, number>, c: any) => {
    acc[c.mood] = (acc[c.mood] || 0) + 1;
    return acc;
  }, {}) || {};

  const energyDistribution = checkins?.reduce((acc: Record<string, number>, c: any) => {
    acc[c.energy] = (acc[c.energy] || 0) + 1;
    return acc;
  }, {}) || {};

  const stressDistribution = checkins?.reduce((acc: Record<string, number>, c: any) => {
    acc[c.stress] = (acc[c.stress] || 0) + 1;
    return acc;
  }, {}) || {};

  return {
    totalCheckins: checkins?.length || 0,
    avgCheckinsPerDay: Math.round((checkins?.length || 0) / days * 10) / 10,
    moodDistribution,
    energyDistribution,
    stressDistribution
  };
}

async function getChallengeMetrics(supabase: any) {
  const [
    { data: challenges },
    { data: participants }
  ] = await Promise.all([
    supabase.from('community_challenges').select('*'),
    supabase.from('challenge_participants').select('*')
  ]);

  const activeChallenges = challenges?.filter((c: any) => c.is_active) || [];
  const completedParticipants = participants?.filter((p: any) => p.completed) || [];

  return {
    totalChallenges: challenges?.length || 0,
    activeChallenges: activeChallenges.length,
    totalParticipants: participants?.length || 0,
    completedParticipants: completedParticipants.length,
    completionRate: Math.round((completedParticipants.length / (participants?.length || 1)) * 100)
  };
}

async function getRealtimeStats(supabase: any) {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

  const [
    { count: messagesLastHour },
    { count: messagesLast24h },
    { count: activeUsersLast24h }
  ] = await Promise.all([
    supabase.from('chat_messages').select('*', { count: 'exact', head: true }).gte('created_at', oneHourAgo),
    supabase.from('chat_messages').select('*', { count: 'exact', head: true }).gte('created_at', oneDayAgo),
    supabase.from('user_engagement').select('*', { count: 'exact', head: true }).gte('last_interaction_at', oneDayAgo)
  ]);

  return {
    messagesLastHour: messagesLastHour || 0,
    messagesLast24h: messagesLast24h || 0,
    activeUsersLast24h: activeUsersLast24h || 0,
    serverTime: now.toISOString()
  };
}

async function getAllMetrics(supabase: any) {
  const [overview, engagement, subscriptions, realtime] = await Promise.all([
    getOverviewMetrics(supabase),
    getEngagementMetrics(supabase, { days: '30' }),
    getSubscriptionMetrics(supabase),
    getRealtimeStats(supabase)
  ]);

  return {
    overview,
    engagement,
    subscriptions,
    realtime
  };
}
