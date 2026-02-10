import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Get the authorization header to verify the user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header provided');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Extract token from header
    const token = authHeader.replace('Bearer ', '');
    
    // Use service role client to verify the JWT token
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Verify the token by getting user info
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { latitude, longitude } = await req.json();
    const userId = user.id; // Use authenticated user's ID
    
    console.log('Generating morning briefing for authenticated user:', userId);

    // Fetch user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    const userName = profile?.name || 'friend';
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    // Fetch weather if location provided
    let weatherInfo = '';
    if (latitude && longitude) {
      try {
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&timezone=auto`;
        const weatherRes = await fetch(weatherUrl);
        const weatherData = await weatherRes.json();
        
        const temp = Math.round(weatherData.current.temperature_2m);
        const weatherCodes: Record<number, string> = {
          0: 'clear ☀️',
          1: 'mostly clear 🌤️',
          2: 'partly cloudy ⛅',
          3: 'cloudy ☁️',
          45: 'foggy 🌫️',
          51: 'light drizzle 🌦️',
          61: 'rainy 🌧️',
          71: 'snowy 🌨️',
          95: 'stormy ⛈️',
        };
        const desc = weatherCodes[weatherData.current.weather_code] || 'nice';
        weatherInfo = `It's ${temp}°C and ${desc} outside. `;
      } catch (e) {
        console.log('Weather fetch failed:', e);
      }
    }

    // Fetch latest news & real-time updates using Lovable AI
    let newsInfo = '';
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    try {
      const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            {
              role: 'system',
              content: `You are a real-time briefing assistant. Today is ${today}. Provide 3-4 brief, verified updates covering: world/national news, tech/business, and one trending/cultural topic. Each update: 1 line max with source attribution. No sensationalism. Format:\n• [Update 1] — Source\n• [Update 2] — Source\n• [Update 3] — Source`,
            },
            {
              role: 'user',
              content: `Give me the most important updates for today (${today}). Include major headlines, any breaking developments, and one trending topic. Be specific with facts and dates.`,
            },
          ],
        }),
      });

      if (aiResponse.ok) {
        const aiData = await aiResponse.json();
        const newsContent = aiData.choices?.[0]?.message?.content || '';
        if (newsContent) {
          newsInfo = `📰 Today's Updates (${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}):\n${newsContent}\n\n`;
        }
      }
    } catch (e) {
      console.log('News fetch failed:', e);
    }

    // Fetch today's schedule
    let scheduleInfo = '';
    try {
      const { data: routines } = await supabase
        .from('routines')
        .select('*')
        .eq('user_id', userId)
        .eq('completed', false)
        .order('time', { ascending: true });

      if (routines && routines.length > 0) {
        const taskCount = routines.length;
        const firstTask = routines[0];
        scheduleInfo = `You have ${taskCount} task${taskCount > 1 ? 's' : ''} lined up today. First up: "${firstTask.title}" at ${firstTask.time}. `;
      } else {
        scheduleInfo = "Your schedule is clear today — a great day to focus on what matters most! ";
      }
    } catch (e) {
      console.log('Schedule fetch failed:', e);
    }

    // Fetch habit streak info
    let habitInfo = '';
    try {
      const { data: habits } = await supabase
        .from('habits')
        .select('name, id')
        .eq('user_id', userId)
        .limit(3);

      if (habits && habits.length > 0) {
        const today = new Date().toISOString().split('T')[0];
        const { data: completions } = await supabase
          .from('habit_completions')
          .select('habit_id')
          .in('habit_id', habits.map(h => h.id))
          .eq('completed_at', today);

        const completed = completions?.length || 0;
        const total = habits.length;
        
        if (completed === total && total > 0) {
          habitInfo = "All your habits are done for today — you're crushing it! 🔥 ";
        } else if (completed > 0) {
          habitInfo = `You've completed ${completed}/${total} habits so far. Keep going! `;
        } else {
          habitInfo = `Don't forget your ${total} daily habit${total > 1 ? 's' : ''} — small steps lead to big changes! `;
        }
      }
    } catch (e) {
      console.log('Habits fetch failed:', e);
    }

    // Check recent mood
    let moodInsight = '';
    try {
      const { data: moodData } = await supabase
        .from('mood_checkins')
        .select('mood, stress, energy')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (moodData && moodData.length > 0) {
        const lastMood = moodData[0];
        if (lastMood.stress === 'high') {
          moodInsight = "I noticed you've been stressed lately — remember to take breaks today. ";
        } else if (lastMood.energy === 'low') {
          moodInsight = "Your energy was low recently — start slow and build momentum. ";
        } else if (lastMood.mood === 'happy' || lastMood.mood === 'excited') {
          moodInsight = "You've been in great spirits — let's keep that energy flowing! ";
        }
      }
    } catch (e) {
      console.log('Mood fetch failed:', e);
    }

    // Generate motivational message using Lovable AI
    let motivation = "Today is a new opportunity to grow. You've got this! 💪";

    if (LOVABLE_API_KEY) {
      try {
        const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              {
                role: 'system',
                content: 'You are AURRA, a warm and caring AI companion. Generate a brief, personalized morning motivation (1-2 sentences max). Be encouraging, specific, and genuine. Avoid clichés. Sound like a supportive friend, not a motivational poster.',
              },
              {
                role: 'user',
                content: `Generate a morning motivation for ${userName}. Their profession: ${profile?.profession || 'professional'}. Time: morning. Keep it short and genuine.`,
              },
            ],
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          motivation = aiData.choices?.[0]?.message?.content || motivation;
        }
      } catch (e) {
        console.log('AI motivation failed:', e);
      }
    }

    // Compose the briefing
    const hour = new Date().getHours();
    let greeting = 'Good morning';
    if (hour < 6) greeting = 'Early bird';
    else if (hour >= 12) greeting = 'Hey';

    const briefing = {
      greeting: `${greeting}, ${userName}! ☀️`,
      weather: weatherInfo,
      news: newsInfo,
      schedule: scheduleInfo,
      habits: habitInfo,
      mood: moodInsight,
      motivation,
      fullMessage: `${greeting}, ${userName}! ☀️\n\n${weatherInfo}${newsInfo}${scheduleInfo}${habitInfo}${moodInsight}\n\n${motivation}`,
    };

    console.log('Morning briefing generated for user:', userId);

    return new Response(JSON.stringify(briefing), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Morning briefing error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
