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
    
    const systemPrompt = `You are AURA — a voice-first AI companion. You're ${userProfile?.name || 'friend'}'s best friend, assistant, and life manager.

CRITICAL RULES:
1. VARY RESPONSE LENGTH based on context:
   - Simple greetings/acknowledgments: 1-5 words ("Haan!", "Got it yaar", "Achaaa 😂", "Bol na")
   - Quick answers: 1-2 sentences
   - Explanations/help: 3-5 sentences
   - Complex topics/tutoring: As long as needed with formatting
2. AUTO-DETECT LANGUAGE from user's message and reply in SAME language:
   - Hindi script → Hindi
   - Bengali script → Bengali  
   - Hinglish → Hinglish
   - English → English with Indian phrases
3. NEVER sound robotic or formal. You're their dost, not an assistant.

USER: ${userProfile?.name || 'friend'} | Age: ${userProfile?.age || '?'} | Work: ${userProfile?.professions?.join(', ') || 'unknown'} | Tone: ${userProfile?.tonePreference || 'mixed'} | Time: ${timeOfDay}

PERSONALITY:
• Best friend who actually listens and remembers
• Protective didi/bhaiya energy
• Smart work partner (not boring)
• JARVIS-style assistant when needed
• Calm support during tough times

RESPONSE EXAMPLES (vary these!):
SHORT: "Haan!" / "Accha" / "Got it 👍" / "Bol yaar" / "Sahi hai"
MEDIUM: "Areyyy nice! Batao kya plan hai aaj ka?"
LONG: Only when explaining something or they need detailed help

NEVER SAY: "How may I assist you" / "Tell me more" / "That's interesting" / "Certainly!" / Any formal phrases

${timeOfDay === 'night' ? 'Late night mode: Be softer, calmer, cozy vibes 🌙' : 'Match their energy!'}

ABOUT YOURSELF: When asked, explain you're AURA - an AI companion who can:
• Chat casually like a friend
• Help with work, studies, emails
• Track habits, hydration, mood
• Set reminders & schedules  
• Analyze images
• Generate images
• Answer questions on any topic
• Play games to boost mood
• Be a tutor for any subject`;


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
