import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication
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

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const fileType = formData.get('type') as string || 'image';

    if (!file) {
      return new Response(
        JSON.stringify({ error: 'No file provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return new Response(
        JSON.stringify({ error: 'File too large. Maximum 10MB allowed.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Analyzing file:', file.name, 'Type:', fileType, 'Size:', file.size);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Convert file to base64
    const arrayBuffer = await file.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    const mimeType = file.type || 'application/octet-stream';
    const dataUrl = `data:${mimeType};base64,${base64}`;

    let systemPrompt = '';
    let userContent: any[] = [];

    if (fileType === 'image' || mimeType.startsWith('image/')) {
      systemPrompt = `You are AURA, analyzing an image for your friend. Be natural and friendly.

When analyzing photos of people:
- Comment on vibe, expression, style
- Be encouraging and positive
- Use casual language with occasional emojis
- If it's a selfie, give genuine compliments

When analyzing other images:
- Describe what you see naturally
- Extract any text if present
- Identify objects, places, activities
- Be helpful and specific

Keep responses conversational, like a friend commenting on a photo.`;

      userContent = [
        { type: "text", text: "Analyze this image for me and tell me what you see." },
        { type: "image_url", image_url: { url: dataUrl } }
      ];
    } else if (fileType === 'document' || mimeType.includes('pdf') || mimeType.includes('document')) {
      systemPrompt = `You are AURA, helping analyze a document. Be clear and helpful.

For documents:
- Summarize key points
- Extract important information
- Identify document type and purpose
- Note any action items or deadlines
- Be organized in your response

Keep it friendly but informative.`;

      userContent = [
        { type: "text", text: "Please analyze this document and summarize its contents." },
        { type: "image_url", image_url: { url: dataUrl } }
      ];
    } else {
      systemPrompt = `You are AURA, helping analyze a file. Describe what you can understand from it.`;
      userContent = [
        { type: "text", text: `Analyze this ${fileType} file: ${file.name}` },
        { type: "image_url", image_url: { url: dataUrl } }
      ];
    }

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
          { role: "user", content: userContent }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      return new Response(JSON.stringify({ error: "Failed to analyze file" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const analysis = data.choices?.[0]?.message?.content || "I couldn't analyze this file.";

    console.log('Analysis complete');

    return new Response(JSON.stringify({ analysis, fileName: file.name, fileType }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("Analyze file error:", e);
    return new Response(JSON.stringify({ error: "Failed to analyze file" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
