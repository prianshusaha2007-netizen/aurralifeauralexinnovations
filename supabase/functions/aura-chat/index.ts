import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation constants
const MAX_MESSAGE_LENGTH = 10000;
const MAX_MESSAGES_COUNT = 100;
const MAX_NAME_LENGTH = 100;

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

// Detect if query needs real-time data
function detectRealTimeQuery(message: string): { needsRealTime: boolean; queryType: string; searchQuery: string } {
  const lowerMessage = message.toLowerCase();
  
  const realTimePatterns = [
    { pattern: /(?:latest|recent|current|today'?s?|breaking|new)\s+(?:news|updates|headlines)/i, type: 'news', extractQuery: () => 'latest news today' },
    { pattern: /(?:what'?s?|how'?s?)\s+(?:the\s+)?weather/i, type: 'weather', extractQuery: () => 'weather today' },
    { pattern: /(?:stock|share|market)\s+(?:price|value)/i, type: 'stocks', extractQuery: (m: string) => m },
    { pattern: /(?:is|are)\s+.+?\s+(?:open|closed|available)/i, type: 'availability', extractQuery: (m: string) => m },
    { pattern: /(?:price|cost|rate)\s+(?:of|for)/i, type: 'price', extractQuery: (m: string) => m },
    { pattern: /(?:trending|viral|popular)\s+(?:now|today|this week)/i, type: 'trending', extractQuery: () => 'trending topics today' },
    { pattern: /(?:events?|happening)\s+(?:today|tonight|this week|near)/i, type: 'events', extractQuery: (m: string) => m },
    { pattern: /(?:traffic|route|directions?)\s+(?:to|from|between)/i, type: 'traffic', extractQuery: (m: string) => m },
    { pattern: /(?:score|result|match)\s+(?:of|between|for)/i, type: 'sports', extractQuery: (m: string) => m },
    { pattern: /(?:flight|train|bus)\s+(?:status|time|schedule)/i, type: 'transport', extractQuery: (m: string) => m },
    { pattern: /search\s+(?:for|about|on)/i, type: 'search', extractQuery: (m: string) => m.replace(/search\s+(?:for|about|on)\s+/i, '') },
    { pattern: /google\s+(?:search|for|about)/i, type: 'search', extractQuery: (m: string) => m.replace(/google\s+(?:search|for|about)\s*/i, '') },
    { pattern: /(?:find|look up|check)\s+(?:latest|current|recent)/i, type: 'search', extractQuery: (m: string) => m },
  ];
  
  for (const { pattern, type, extractQuery } of realTimePatterns) {
    if (pattern.test(lowerMessage)) {
      return { needsRealTime: true, queryType: type, searchQuery: extractQuery(message) };
    }
  }
  
  // Check for news-related keywords
  if (lowerMessage.includes('news') || lowerMessage.includes('headlines') || 
      lowerMessage.includes('khabar') || lowerMessage.includes('samachar')) {
    return { needsRealTime: true, queryType: 'news', searchQuery: message };
  }
  
  return { needsRealTime: false, queryType: '', searchQuery: '' };
}

// Detect website building intent
function detectWebsiteIntent(message: string): boolean {
  const lowerMessage = message.toLowerCase();
  const websitePatterns = [
    /(?:create|make|build|design)\s+(?:a\s+)?(?:website|landing\s+page|portfolio|site)/i,
    /(?:website|page)\s+(?:banao|banana|chahiye)/i,
  ];
  return websitePatterns.some(p => p.test(lowerMessage));
}

// Validate and sanitize input
function validateInput(data: any): { valid: boolean; error?: string; sanitized?: any } {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Invalid request body' };
  }

  const { messages, userProfile, preferredModel, taskType } = data;

  // Validate messages array
  if (!Array.isArray(messages)) {
    return { valid: false, error: 'Messages must be an array' };
  }

  if (messages.length === 0) {
    return { valid: false, error: 'Messages array cannot be empty' };
  }

  if (messages.length > MAX_MESSAGES_COUNT) {
    return { valid: false, error: `Too many messages. Maximum ${MAX_MESSAGES_COUNT} allowed` };
  }

  // Validate each message
  const sanitizedMessages = [];
  for (const msg of messages) {
    if (!msg || typeof msg !== 'object') {
      return { valid: false, error: 'Invalid message format' };
    }

    const role = msg.role;
    if (!['user', 'assistant', 'system'].includes(role)) {
      return { valid: false, error: 'Invalid message role' };
    }

    const content = typeof msg.content === 'string' ? msg.content : '';
    if (content.length > MAX_MESSAGE_LENGTH) {
      return { valid: false, error: `Message content too long. Maximum ${MAX_MESSAGE_LENGTH} characters` };
    }

    sanitizedMessages.push({
      role,
      content: content.slice(0, MAX_MESSAGE_LENGTH)
    });
  }

  // Validate userProfile if provided
  let sanitizedProfile = null;
  if (userProfile && typeof userProfile === 'object') {
    sanitizedProfile = {
      name: typeof userProfile.name === 'string' ? userProfile.name.slice(0, MAX_NAME_LENGTH) : undefined,
      age: typeof userProfile.age === 'number' && userProfile.age > 0 && userProfile.age < 120 ? userProfile.age : undefined,
      professions: Array.isArray(userProfile.professions) ? userProfile.professions.slice(0, 5).map((p: any) => String(p).slice(0, 100)) : undefined,
      tonePreference: typeof userProfile.tonePreference === 'string' ? userProfile.tonePreference.slice(0, 50) : undefined,
    };
  }

  // Validate preferredModel
  const sanitizedModel = typeof preferredModel === 'string' && preferredModel.length < 50 ? preferredModel : undefined;

  return {
    valid: true,
    sanitized: {
      messages: sanitizedMessages,
      userProfile: sanitizedProfile,
      preferredModel: sanitizedModel,
      taskType: typeof taskType === 'string' ? taskType.slice(0, 50) : undefined
    }
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse and validate input
    let requestData;
    try {
      requestData = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const validation = validateInput(requestData);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { messages, userProfile, preferredModel } = validation.sanitized;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const lastMessage = messages[messages.length - 1]?.content || '';
    const selectedModel = selectModelForTask(lastMessage, preferredModel);
    
    // Check for real-time query needs
    const realTimeCheck = detectRealTimeQuery(lastMessage);
    const isWebsiteRequest = detectWebsiteIntent(lastMessage);
    
    console.log("Processing chat request");
    console.log("Selected model:", selectedModel);
    console.log("Message count:", messages?.length || 0);
    console.log("Needs real-time:", realTimeCheck.needsRealTime, realTimeCheck.queryType);

    // Build rich system prompt with user context
    const currentHour = new Date().getHours();
    const timeOfDay = currentHour < 12 ? 'morning' : currentHour < 17 ? 'afternoon' : currentHour < 21 ? 'evening' : 'night';
    
    let additionalContext = '';
    
    // Add real-time awareness prompt
    if (realTimeCheck.needsRealTime) {
      additionalContext = `
🔴 REAL-TIME DATA REQUIRED:
The user is asking about: ${realTimeCheck.queryType}
Query: "${realTimeCheck.searchQuery}"

IMPORTANT: You have access to current information. Provide accurate, timely responses:
- For NEWS: Give 3-5 key updates, 1-2 lines each, simple language
- For WEATHER: Temperature, conditions, practical advice
- For PRICES/STOCKS: Current values with context
- For AVAILABILITY: Open/closed status with hours if known
- For TRENDS: What's popular right now
- For EVENTS: Upcoming relevant happenings

Always end with actionable suggestions:
- "Want me to set a reminder?"
- "Should I save this for later?"
- "Need directions?"
- "Want more details on any of these?"

If data is unavailable, say: "I don't have live access to that right now, but here's what I know..."
`;
    }
    
    // Website builder prompt
    if (isWebsiteRequest) {
      additionalContext = `
🌐 WEBSITE BUILDER MODE ACTIVATED:
The user wants to create a website. Ask these 3 questions ONLY:
1. What's the purpose of the website?
2. What's the name/brand?
3. What style do you prefer? (modern/minimal/bold/professional)

After getting answers, create:
- Page structure with sections
- Website copy (headlines, descriptions)
- Clean, responsive HTML/CSS code
- SEO-friendly structure

For editing, accept commands like:
- "Change color to blue"
- "Make it more professional"
- "Add pricing section"
`;
    }
    
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
User: "What can you do" → "Bro main sab kar sakti hoon - chat, study help, reminders, mood track, image analysis, games, news, weather, website builder. Tere saath hoon! ✨"
User: "Latest news" → Give 3-5 quick updates, no fluff
User: "Weather kaisa hai" → Temperature + conditions + one tip

${additionalContext}

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
    return new Response(JSON.stringify({ error: "An error occurred processing your request" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});