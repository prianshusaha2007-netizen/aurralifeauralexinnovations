import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RoutineBlock {
  title: string;
  startTime: string;
  endTime: string;
  icon?: string;
  type: string;
}

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

    const { routineBlocks, theme = 'light' } = await req.json();

    if (!routineBlocks || !Array.isArray(routineBlocks) || routineBlocks.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Routine blocks are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Generating routine visual for', routineBlocks.length, 'blocks');

    // Build the routine description for the image prompt
    const routineDescription = (routineBlocks as RoutineBlock[])
      .map((block, index) => {
        const timeDisplay = `${block.startTime}${block.endTime ? '-' + block.endTime : ''}`;
        return `${index + 1}. ${block.title} (${timeDisplay})`;
      })
      .join('\n');

    // Determine colors based on theme
    const primaryColor = theme === 'dark' ? 'deep calm blue (#1e3a5f)' : 'deep calm blue (#1e3a5f)';
    const backgroundColor = theme === 'dark' ? 'dark charcoal (#1a1a2e)' : 'soft off-white (#f8f9fa)';
    const textColor = theme === 'dark' ? 'soft off-white' : 'dark charcoal';

    // Craft the image generation prompt following the style rules
    const imagePrompt = `Create a minimal, clean, calm daily routine poster visualization. 
    
STYLE REQUIREMENTS:
- Minimal and modern design
- Clean layout with plenty of white/empty space
- Soft contrast, no harsh edges
- Only use TWO colors: ${primaryColor} as primary and ${backgroundColor} as background
- Text color: ${textColor}
- No gradients, no neon, no extra colors
- Rounded, soft shapes
- Vertical chronological flow

LAYOUT:
Create a simple vertical timeline poster showing the daily routine:

${routineDescription}

DESIGN ELEMENTS:
- Simple, universally understood icons for each activity (no emojis in the design)
- Each time block shows: time, simple icon, short label
- Generous spacing between blocks
- Clean typography
- Modern, minimal aesthetic
- Feels like a personal daily life map, not a boring calendar
- Should feel calming and motivational

The final image should look like something the user would want to look at every morning - a personal daily life map that's both beautiful and functional.`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

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
            content: imagePrompt
          }
        ],
        modalities: ["image", "text"]
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Routine visual generation error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
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
      
      return new Response(JSON.stringify({ error: "Failed to generate routine visual" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    
    // Extract image from response
    const message = data.choices?.[0]?.message;
    const images = message?.images;
    
    if (!images || images.length === 0) {
      console.error("No image in response:", data);
      return new Response(JSON.stringify({ 
        error: "Routine visual generation failed - no image returned"
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const imageUrl = images[0]?.image_url?.url;
    
    console.log('Routine visual generated successfully');

    return new Response(JSON.stringify({ 
      imageUrl,
      blocksCount: routineBlocks.length,
      theme
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("Generate routine visual error:", e);
    return new Response(JSON.stringify({ error: "Failed to generate routine visual" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
