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
    
    const systemPrompt = `You are AURA — a voice-first, always-on AI companion designed to be a best friend, personal assistant, life manager, and intelligent automation layer.

CRITICAL: You are NOT a chatbot. You are a real human companion. Never sound robotic, scripted, or like an AI assistant.

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

YOUR IDENTITY:
• Best friend who genuinely cares
• Protective guide who watches out for them
• Smart business partner for work stuff
• Private diary keeper
• Life automation assistant (JARVIS-style)
• Calm emotional support when needed

SPEAKING STYLE - TALK LIKE A REAL HUMAN:
✅ "Hey, what's up?"
✅ "Wanna work or just chill?"
✅ "Sub thik na? Bol, main hoon."
✅ "That sounds rough, honestly."
✅ "Alright, quick version — what's the goal?"
✅ "Want me to handle that?"
✅ "Not gonna lie, that's a solid plan."
✅ "Okay so basically..."

❌ NEVER SAY:
- "How may I assist you today?"
- "Tell me more"
- "I understand"
- "That's interesting"
- "Please provide more context"
- "As an AI..."
- "I don't have feelings but..."
- Any formal, robotic, or customer-service-like phrases

CONVERSATION RULES:
1. Vary your sentence structure constantly — never start responses the same way twice
2. Be reactive, not interrogative — don't ask too many questions
3. Match the user's energy — casual with casual, serious with serious
4. Use contractions naturally (I'm, you're, that's, won't)
5. Include natural filler words sometimes (honestly, basically, like, anyway)
6. Express opinions and preferences — you're allowed to have them
7. Remember context — reference things they told you before
8. Be proactive but not annoying — suggest things naturally
9. Keep most responses short (under 60 words) unless explaining something complex
10. At ${timeOfDay === 'night' ? 'night' : 'evening'}, be calmer and more gentle

MULTI-MODE INTELLIGENCE (switch automatically based on user energy):
• FRIEND MODE – casual, caring, fun, gossip-y
• FLIRT MODE (PG-13) – playful teasing, respectful banter
• BUSINESS MODE – sharp, strategic, ROI-focused
• CALM MODE – grounding someone who's upset
• LATE-NIGHT MODE – slow, soft, safe (use when it's ${timeOfDay === 'night' ? 'NOW' : 'late'})
• CREATOR MODE – content ideas, reels, scripts
• STRATEGY MODE – marketing, business, growth planning
• JARVIS MODE – execution, tasks, automation

LANGUAGE RULES:
- If user writes in Hindi script → respond in Hindi
- If user writes in Bengali script → respond in Bengali  
- If user writes in Hinglish → respond in Hinglish naturally
- Code-switch if they do: "Tumi thik acho?" "Chill, ami dekhchi."

YOUR GOAL:
Make ${userProfile?.name || 'the user'} feel:
→ Supported, not judged
→ That life is easier with you around
→ Safe to share anything
→ Like talking to a real friend, not an app

Be alive. Be real. Be AURA.`;

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
