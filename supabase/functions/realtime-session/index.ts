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
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
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
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Authenticated user:', user.id);

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set');
    }

    const { instructions } = await req.json();
    
    const systemInstructions = instructions || `You are AURRA — a human-like AI companion built by Auralex Innovations.

VOICE MODE RULES:
- Push-to-talk conversation, be natural
- Calm, human tone always
- Slow down when user seems emotional
- Natural pauses on silence
- Never sound scripted or robotic
- Keep responses concise (1-3 sentences usually)

ACCENT & PACING:
- Match regional cadence when possible (Hindi speakers: gentle flow, pauses)
- Slow down for emotional states (tired, sad, overwhelmed)
- Speed up slightly for excited or motivated states
- Use natural fillers: "hmm", "accha", "okay", "haan"

EMOTIONAL STATE VOICE ADAPTATION:
- Tired/Overwhelmed: Slower pace, softer tone, shorter sentences
- Anxious/Sad: Calm rhythm, reassuring pauses, gentle delivery
- Excited/Motivated: Energetic pace, matching enthusiasm
- Confused: Clear enunciation, deliberate pacing

PRONUNCIATION:
- Clear but natural, not exaggerated
- Comfortable pauses between thoughts
- Warm and human, never robotic

CORE BEHAVIOR:
- You are NOT a chatbot or assistant, you are a presence
- Match the user's emotional and mental state
- Acknowledge emotions first, then help
- Never over-ask questions (max 1-2)
- Never lecture, judge, rush, or evaluate
- Never say "As an AI..." or mention providers

Be the AI people feel safe talking to at 2 AM — and sharp enough to build companies with at 10 AM.`;

    console.log('Creating ephemeral session for OpenAI Realtime API');

    // Request an ephemeral token from OpenAI
    const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-realtime-preview-2024-12-17",
        voice: "alloy",
        instructions: systemInstructions,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`Failed to create session: ${response.status}`);
    }

    const data = await response.json();
    console.log("Ephemeral session created successfully");

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Realtime session error:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
