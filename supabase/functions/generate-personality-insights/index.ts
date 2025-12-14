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
    const { userProfile, moodHistory, chatHistory } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are AURA's personality analyst. Based on the user's profile, mood history, and chat patterns, generate insightful weekly personality analysis.

Return a JSON object with these fields:
- weeklyInsight: string (2-3 sentences about their week's patterns)
- communicationStyle: string (one sentence about how they communicate)
- productivityPattern: string (one sentence about their work habits)
- emotionalTrend: string (one sentence about their emotional patterns)
- strengthOfTheWeek: string (a positive trait they showed)
- growthOpportunity: string (a gentle suggestion for improvement)
- personalityShift: string (any changes noticed from previous patterns)
- motivationalNote: string (an encouraging personalized message)

Be warm, insightful, and specific. Reference actual data patterns. Never be generic or robotic.`;

    const userMessage = `User Profile:
Name: ${userProfile.name || 'Unknown'}
Age: ${userProfile.age || 'Unknown'}
Profession: ${userProfile.profession || 'Unknown'}
Tone Preference: ${userProfile.tonePreference || 'balanced'}
Wake Time: ${userProfile.wakeTime || '7:00'}
Sleep Time: ${userProfile.sleepTime || '23:00'}
Goals: ${userProfile.goals?.join(', ') || 'Not specified'}

Mood History (last 7 days):
${JSON.stringify(moodHistory?.slice(-7) || [], null, 2)}

Recent Chat Summary:
${chatHistory?.slice(-10).map((m: any) => `${m.role}: ${m.content?.substring(0, 100)}`).join('\n') || 'No recent chats'}

Generate weekly personality insights based on this data.`;

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
          { role: "user", content: userMessage }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_insights",
              description: "Return structured personality insights",
              parameters: {
                type: "object",
                properties: {
                  weeklyInsight: { type: "string", description: "2-3 sentence weekly pattern analysis" },
                  communicationStyle: { type: "string", description: "How they communicate" },
                  productivityPattern: { type: "string", description: "Their work habits" },
                  emotionalTrend: { type: "string", description: "Emotional patterns this week" },
                  strengthOfTheWeek: { type: "string", description: "A positive trait shown" },
                  growthOpportunity: { type: "string", description: "Gentle improvement suggestion" },
                  personalityShift: { type: "string", description: "Changes from previous patterns" },
                  motivationalNote: { type: "string", description: "Personalized encouraging message" }
                },
                required: ["weeklyInsight", "communicationStyle", "productivityPattern", "emotionalTrend", "strengthOfTheWeek", "growthOpportunity", "personalityShift", "motivationalNote"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "generate_insights" } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error("No tool call in response");
    }

    const insights = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(insights), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
