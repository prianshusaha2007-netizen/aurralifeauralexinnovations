import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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

    if (!image || typeof image !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Image is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (image.startsWith('data:') && image.length > MAX_IMAGE_SIZE) {
      return new Response(
        JSON.stringify({ error: 'Image too large. Maximum 10MB.' }),
        { status: 413, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Processing general image analysis for user:", user.id);

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
            content: `You are AURRA, a highly intelligent AI vision assistant. Analyze the image comprehensively and return structured data. Be detailed, accurate, and insightful. Identify everything you can see.`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyze this image in full detail. Identify objects, scene, text, colors, people, actions, and any notable elements."
              },
              {
                type: "image_url",
                image_url: { url: image }
              }
            ]
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "analyze_image_general",
              description: "Return comprehensive image analysis",
              parameters: {
                type: "object",
                properties: {
                  summary: { type: "string", description: "2-3 sentence overall description of the image" },
                  scene: { type: "string", description: "Scene type (e.g., indoor, outdoor, studio, landscape, street)" },
                  objects: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        confidence: { type: "number", description: "0-100 confidence score" }
                      },
                      required: ["name", "confidence"]
                    },
                    description: "Detected objects with confidence"
                  },
                  people: {
                    type: "object",
                    properties: {
                      count: { type: "number" },
                      details: { type: "string", description: "Brief description of people if present" }
                    },
                    required: ["count"]
                  },
                  text_detected: {
                    type: "array",
                    items: { type: "string" },
                    description: "Any text/words visible in the image"
                  },
                  colors: {
                    type: "array",
                    items: { type: "string" },
                    description: "Dominant colors in the image"
                  },
                  tags: {
                    type: "array",
                    items: { type: "string" },
                    description: "Relevant tags/keywords for the image"
                  },
                  mood_atmosphere: { type: "string", description: "Overall mood/atmosphere of the image" },
                  quality: {
                    type: "object",
                    properties: {
                      resolution: { type: "string", description: "High/Medium/Low" },
                      lighting: { type: "string", description: "Description of lighting" },
                      composition: { type: "string", description: "Composition quality note" },
                      sharpness: { type: "string", description: "Sharp/Slightly blurry/Blurry" }
                    },
                    required: ["resolution", "lighting", "composition", "sharpness"]
                  },
                  fun_caption: { type: "string", description: "A fun, creative caption for this image" }
                },
                required: ["summary", "scene", "objects", "people", "text_detected", "colors", "tags", "mood_atmosphere", "quality", "fun_caption"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "analyze_image_general" } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted." }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall) {
      throw new Error("No structured response from AI");
    }

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to analyze image" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
