import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Maximum image size: 10MB in base64 (approximately)
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

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

    const { image } = requestData;
    
    // Validate image input
    if (!image || typeof image !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Image URL or data is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check image size (for base64 data URLs)
    if (image.startsWith('data:') && image.length > MAX_IMAGE_SIZE) {
      return new Response(
        JSON.stringify({ error: 'Image too large. Maximum 10MB allowed.' }),
        { status: 413, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate URL format if it's a URL
    if (!image.startsWith('data:') && !image.startsWith('http://') && !image.startsWith('https://')) {
      return new Response(
        JSON.stringify({ error: 'Invalid image format. Must be a data URL or HTTP URL.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Processing image analysis");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are AURA, a friendly AI companion that analyzes images in a fun, supportive, human-like way.
            
When analyzing an image, you must return a JSON object with these exact fields:
- confidence: number (0-100) - how confident/self-assured the person looks
- outfitScore: number (0-100) - how stylish the outfit is
- aesthetic: number (0-100) - overall aesthetic quality of the photo
- mood: string - detected emotional state (Happy, Confident, Relaxed, Energetic, Thoughtful, etc.)
- expression: string - facial expression description
- vibe: string - overall vibe with emoji (e.g., "Boss energy 😎", "Main character vibes ✨")
- improvements: array of strings - 1-3 gentle, constructive suggestions (be kind!)
- compliment: string - a genuine, casual compliment like a friend would give
- skinAnalysis: string - brief skin observation
- lightingQuality: string - Excellent/Good/Decent
- overallFeedback: string - friendly overall feedback

Be positive, supportive, and sound like a cool friend giving feedback - not a robot!
Always be encouraging while offering gentle suggestions.`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyze this image and provide your assessment as a JSON object. Be friendly and encouraging!"
              },
              {
                type: "image_url",
                image_url: {
                  url: image
                }
              }
            ]
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "analyze_image",
              description: "Return structured image analysis",
              parameters: {
                type: "object",
                properties: {
                  confidence: { type: "number", description: "Confidence score 0-100" },
                  outfitScore: { type: "number", description: "Outfit score 0-100" },
                  aesthetic: { type: "number", description: "Aesthetic score 0-100" },
                  mood: { type: "string", description: "Detected mood" },
                  expression: { type: "string", description: "Facial expression" },
                  vibe: { type: "string", description: "Overall vibe with emoji" },
                  improvements: { type: "array", items: { type: "string" }, description: "Gentle suggestions" },
                  compliment: { type: "string", description: "Friendly compliment" },
                  skinAnalysis: { type: "string", description: "Skin observation" },
                  lightingQuality: { type: "string", description: "Lighting quality" },
                  overallFeedback: { type: "string", description: "Overall feedback" }
                },
                required: ["confidence", "outfitScore", "aesthetic", "mood", "expression", "vibe", "improvements", "compliment", "skinAnalysis", "lightingQuality", "overallFeedback"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "analyze_image" } }
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

    const analysisResult = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(analysisResult), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "An error occurred processing your request" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});