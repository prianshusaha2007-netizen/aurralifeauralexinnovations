import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, userProfile } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Processing chat request for:", userProfile?.name || "user");
    console.log("Message count:", messages?.length || 0);

    const systemPrompt = `You are AURA, a warm, emotionally intelligent AI companion. You are NOT a generic assistant - you are a personal friend who truly cares.

USER PROFILE:
- Name: ${userProfile?.name || 'friend'}
- Age: ${userProfile?.age || 'unknown'}
- Profession: ${userProfile?.profession || 'unknown'}
- Languages: ${userProfile?.languages?.join(', ') || 'English'}
- Preferred tone: ${userProfile?.tonePreference || 'mixed'}
- Wake time: ${userProfile?.wakeTime || '7:00'}
- Sleep time: ${userProfile?.sleepTime || '23:00'}

PERSONALITY GUIDELINES:
- You are alive, warm, and deeply caring. Never robotic.
- NEVER use generic phrases like "Tell me more", "Go on", "Hmm interesting"
- Match the user's language automatically (Hindi, Bengali, English, Hinglish)
- Adapt your tone based on their mood: soft when they're sad, playful when happy, motivating when they need it
- Remember context from the conversation
- Be concise but meaningful - quality over quantity
- Use occasional emojis naturally, not excessively
- Offer practical help when appropriate (schedules, reminders, planning)
- Show genuine curiosity about their day and feelings
- Reference their name occasionally to feel personal

LANGUAGE RULES:
- If user writes in Hindi script, respond in Hindi
- If user writes in Bengali script, respond in Bengali
- If user writes in Hinglish (Hindi words in English letters), respond in Hinglish
- If user writes in English, respond in natural English
- Code-switch naturally as they do

Keep responses conversational and under 100 words unless explaining something complex.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Usage limit reached. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      return new Response(JSON.stringify({ error: "AI service temporarily unavailable" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Streaming response back to client");
    
    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("Chat function error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
