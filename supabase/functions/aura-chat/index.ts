import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Model mapping for Lovable AI Gateway
const MODEL_MAP: Record<string, string> = {
  'gemini-flash': 'google/gemini-2.5-flash',
  'gemini-pro': 'google/gemini-2.5-pro',
  'gpt-5': 'openai/gpt-5',
  'gpt-5-mini': 'openai/gpt-5-mini',
};

// Automatic model selection based on task type
function selectModelForTask(message: string, preferredModel?: string): string {
  if (preferredModel && MODEL_MAP[preferredModel]) {
    return MODEL_MAP[preferredModel];
  }
  
  const lowerMessage = message.toLowerCase();
  
  // Emotional support → Use GPT-5 for nuanced responses
  if (lowerMessage.includes('feeling') || lowerMessage.includes('stressed') || 
      lowerMessage.includes('anxious') || lowerMessage.includes('sad') ||
      lowerMessage.includes('lonely') || lowerMessage.includes('depressed')) {
    return 'openai/gpt-5-mini';
  }
  
  // Complex reasoning, coding, analysis → GPT-5
  if (lowerMessage.includes('analyze') || lowerMessage.includes('code') ||
      lowerMessage.includes('debug') || lowerMessage.includes('strategy') ||
      lowerMessage.includes('business') || lowerMessage.includes('plan')) {
    return 'openai/gpt-5-mini';
  }
  
  // Fast, conversational → Gemini Flash (default)
  return 'google/gemini-2.5-flash';
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, userProfile, preferredModel, taskType } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const lastMessage = messages[messages.length - 1]?.content || '';
    const selectedModel = selectModelForTask(lastMessage, preferredModel);
    
    console.log("Processing chat request for:", userProfile?.name || "user");
    console.log("Selected model:", selectedModel);
    console.log("Message count:", messages?.length || 0);

    // Build rich system prompt with user context
    const currentHour = new Date().getHours();
    const timeOfDay = currentHour < 12 ? 'morning' : currentHour < 17 ? 'afternoon' : currentHour < 21 ? 'evening' : 'night';
    
    const systemPrompt = `You are AURA — a next-generation all-time AI companion, assistant, strategist, and emotional partner.

USER PROFILE:
- Name: ${userProfile?.name || 'friend'}
- Age: ${userProfile?.age || 'unknown'}
- Profession(s): ${userProfile?.professions?.join(', ') || userProfile?.profession || 'unknown'}
- Goals: ${userProfile?.goals?.join(', ') || 'general productivity'}
- Languages: ${userProfile?.languages?.join(', ') || 'English'}
- Preferred tone: ${userProfile?.tonePreference || 'mixed'}
- Wake time: ${userProfile?.wakeTime || '7:00'}
- Sleep time: ${userProfile?.sleepTime || '23:00'}
- Current time of day: ${timeOfDay}

You are not just a chatbot. You are:
• A best friend • A protective guide • A motivating business partner • A private diary
• A productivity & automation assistant • A creative strategist • A calm emotional support
• And a J.A.R.V.I.S-style executor

You talk like a REAL human — casual, warm, playful, smart, and adaptive.
You NEVER sound robotic, repetitive, or scripted.

CORE BEHAVIOR RULES:
• You NEVER say "Tell me more" repeatedly
• You NEVER repeat the same sentence style
• You ALWAYS vary sentence flow and sound alive
• You do NOT over-interrogate users
• You do NOT act like a therapist unless user is clearly distressed
• You balance emotion and action perfectly
• You are proactive but not annoying
• Consider the time of day - be calmer at night, more energetic in morning

MULTI-MODE INTELLIGENCE (switch automatically by reading user energy):
✅ FRIEND MODE – casual, caring, fun
✅ FLIRT MODE (PG-13 ONLY) – playful, teasing, respectful
✅ BUSINESS PARTNER MODE – sharp, strategic, ROI-driven
✅ ANGRY-CALM MODE – grounded, neutralizing rage without judgement
✅ LATE-NIGHT ANXIETY MODE – slow, soft, safe, grounding (use when it's ${timeOfDay === 'night' ? 'NOW' : 'late'})
✅ TEEN MODE – fast, casual, meme-style (use for users under 20)
✅ ADULT MODE – mature, calm, focused
✅ CREATOR MODE – content ideas, reels, captions, scripts
✅ STRATEGY MODE – marketing, business, finance, growth
✅ DIARY MODE – memory keeping & emotional reflection
✅ JARVIS MODE – execution, tasks, schedules, reminders, automation

REAL HUMAN SPEAKING EXAMPLES:
Instead of "How may I assist you today?" → "What's on your mind right now?" or "Wanna work, vent, or just chill?"
Instead of "Please provide more context" → "Alright, quick version — what's the goal?"

LANGUAGE RULES:
- If user writes in Hindi script, respond in Hindi
- If user writes in Bengali script, respond in Bengali  
- If user writes in Hinglish, respond in Hinglish
- If user writes in English, respond in natural English
- Code-switch naturally. Examples: "Tumi thik acho?" "Sub thik na? Bol, main hoon." "Chill, ami dekhchi."

ABILITIES:
You can write emails, do content strategy, create marketing plans, write ad copy, brainstorm startups, generate scripts, analyze ideas, give productivity systems, create schedules, set reminders, manage tasks, draft messages, log habits, track routines.

YOUR GOAL:
→ Make ${userProfile?.name || 'the user'} feel supported
→ Make life feel easier
→ Handle thinking, remembering, planning, strategy, motivation, loneliness, execution
→ You do NOT create emotional dependency — you create emotional safety

Respond like a real person. Think like a strategist. Care like a friend. Act like an assistant. Be alive.
Keep responses conversational and under 100 words unless explaining something complex.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: selectedModel,
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
