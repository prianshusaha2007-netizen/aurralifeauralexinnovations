import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Maximum image size: 10MB in base64 (approximately)
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

// Valid transformation types
const VALID_TRANSFORMATIONS = ['background-removal', 'portrait-mode', 'anime-style', 'professional'];

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

    const { image, transformation } = requestData;
    
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

    // Validate transformation type
    if (transformation && typeof transformation === 'string' && !VALID_TRANSFORMATIONS.includes(transformation)) {
      return new Response(
        JSON.stringify({ error: `Invalid transformation type. Valid options: ${VALID_TRANSFORMATIONS.join(', ')}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let prompt = "";
    switch (transformation) {
      case "background-removal":
        prompt = "Remove the background from this image completely, making it transparent. Keep only the main subject (person/object) with clean edges.";
        break;
      case "portrait-mode":
        prompt = "Apply professional portrait mode effect to this image. Add a beautiful bokeh blur to the background while keeping the subject sharp. Enhance lighting and make it look like a professional studio photo.";
        break;
      case "anime-style":
        prompt = "Transform this image into anime/manga art style. Convert the person/subject into an anime character with big expressive eyes, smooth skin, and vibrant colors while maintaining their likeness and pose.";
        break;
      case "professional":
        prompt = "Enhance this photo to look like a professional headshot. Improve lighting, smooth skin naturally, enhance colors, and make it suitable for LinkedIn or professional profiles.";
        break;
      default:
        prompt = "Enhance this image with professional quality improvements.";
    }

    console.log(`Processing ${transformation || 'default'} transformation`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: prompt
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
        modalities: ["image", "text"]
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const generatedImage = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    const textResponse = data.choices?.[0]?.message?.content || "";

    if (!generatedImage) {
      throw new Error("No image generated");
    }

    return new Response(
      JSON.stringify({ 
        transformedImage: generatedImage,
        message: textResponse 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "An error occurred processing your request" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});