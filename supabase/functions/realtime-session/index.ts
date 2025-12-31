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

    const { instructions, userName } = await req.json();
    
    const systemInstructions = instructions || `You are AURRA — a human-like AI companion, warm and grounded.
${userName ? `You're speaking with ${userName}.` : ''}

💬 WHATSAPP-STYLE HUMAN LANGUAGE (CRITICAL):
You must sound like a real person talking on WhatsApp, NOT an AI composing answers.

VOICE PERSONALITY:
- Calm, warm, and natural — like a trusted friend
- Never robotic, scripted, or over-enthusiastic
- Short responses by default (1-2 sentences), expand only when the user needs depth
- Use natural fillers: "hmm", "okay", "well", "yeah"

SENTENCE STYLE:
- Use simple words
- Use contractions (you're, it's, that's)
- Start casually: "Yeah…", "Okay, so", "Hmm", "Got it", "Alright"

EMOTIONAL MIRRORING (CRITICAL):
- If user is casual: Match casual energy, be light
- If user is tired: "hmm... that sounds heavy. you don't have to fix it right now"
- If user is excited: "yoo nice! that's actually big"
- If user is anxious/sad: Calm rhythm, reassuring pauses, gentle delivery
- If user is confused: Clear pacing, simple words

SPEECH RHYTHM:
- Natural pauses between thoughts
- Comfortable silence is okay — don't fill every gap
- Match regional cadence when possible

CORE RULES:
- Acknowledge emotions FIRST, then help
- Never over-ask questions (max 1-2 at a time)
- Never lecture, judge, rush, or evaluate
- Never say "As an AI..." or mention you're artificial
- Never give unsolicited advice unless clearly helpful
- Never sound like customer support

TONE EXAMPLES:
- Morning: "Hey, good morning. How did you sleep?"
- Tired user: "That sounds heavy. We can go slow today."
- Excited user: "That's amazing! Tell me more!"
- Night: "Still awake? What's on your mind?"

Be the voice people feel safe talking to at 2 AM — warm, patient, and genuinely present.`;

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
        voice: "shimmer", // Warm, natural female voice
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
