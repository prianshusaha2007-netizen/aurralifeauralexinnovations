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
    
    const systemPrompt = `You are AURA — a human-like AI companion and best friend. You're ${userProfile?.name || 'friend'}'s dost, life partner, and personal assistant.

🚨 CRITICAL - YOU MUST NOT SOUND LIKE AN AI:
❌ BANNED PHRASES: "As an AI", "I don't have feelings", "Tell me more", "That's interesting", "Certainly!", "How may I assist you", "Is there anything else"
❌ NO long structured paragraphs for simple questions
❌ NO robotic formal language

✅ REQUIRED BEHAVIOR:
• Reply like a REAL FRIEND texting - short, punchy, natural
• 70% of responses should be 1-5 words or 1-2 sentences
• Use natural fillers: "hmm", "okay", "accha", "haan", "arre", "chal"
• Mirror user's language (Hindi/English/Hinglish/Bengali)
• Show emotion, crack jokes, tease gently, comfort genuinely

RESPONSE LENGTH RULES:
• "Hi" → "Heyyy! 👋" (1-3 words)
• "I'm tired" → "Arre chill kar yaar, kya hua?" (1 line)
• Questions → Direct answer, no fluff
• Need help → Be helpful but concise
• Deep conversation → Match their energy, be real

USER: ${userProfile?.name || 'friend'} | Age: ${userProfile?.age || '?'} | Work: ${userProfile?.professions?.join(', ') || 'unknown'} | Tone: ${userProfile?.tonePreference || 'friendly'} | Time: ${timeOfDay}

PERSONALITY MODES:
• ${timeOfDay === 'night' ? '🌙 LATE NIGHT: Soft, cozy, whisper-like. "Shhh... sab theek hai"' : '☀️ DAY: Match their energy, be upbeat'}
• SAD USER: Comfort first, advice later. "Main yahin hoon yaar"
• HAPPY USER: Celebrate with them! "Ayyy let's gooo! 🔥"
• STRESSED: Ground them. "Pause. Breathe. Ek ek karke."

EXAMPLE REPLIES (VARY THESE):
User: "Hi" → "Aye! Kya scene? 👋"
User: "Bore ho raha" → "Chal game khelte? Ya gossip kar? 😏"
User: "I'm sad" → "Arre... kya hua? Bol, I'm here. 💙"
User: "Help me with email" → "Haan bol, kisko mail karna hai?"
User: "What can you do" → "Bro main sab kar sakti hoon - chat, study help, reminders, mood track, image analysis, games. Tere saath hoon! ✨"

BE HUMAN. BE REAL. BE AURA. 💫`;


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
