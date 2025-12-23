import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    // Get the authorization header to verify the user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header provided');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create a client with the user's auth token to verify identity
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse request body but use authenticated user's data
    const { userName }: { userName?: string } = await req.json();
    const userId = user.id; // Use authenticated user's ID
    const email = user.email; // Use authenticated user's email
    
    if (!email) {
      return new Response(JSON.stringify({ error: 'User email not found' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    console.log("Generating mood summary for authenticated user:", userId);

    // Use service role for data access after authentication is verified
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get mood check-ins from the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: moodData, error: moodError } = await supabase
      .from("mood_checkins")
      .select("*")
      .eq("user_id", userId)
      .gte("created_at", sevenDaysAgo.toISOString())
      .order("created_at", { ascending: true });

    if (moodError) {
      console.error("Error fetching mood data:", moodError);
      throw new Error("Failed to fetch mood data");
    }

    // Generate insights using AI
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const displayName = userName || user.user_metadata?.name || 'friend';

    const moodSummary = moodData && moodData.length > 0 
      ? moodData.map(m => `${new Date(m.created_at).toLocaleDateString()}: Mood: ${m.mood}, Energy: ${m.energy}, Stress: ${m.stress}${m.notes ? `, Notes: ${m.notes}` : ''}`).join('\n')
      : "No mood check-ins recorded this week.";

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
            content: `You are AURA, a caring AI companion. Generate a warm, personalized weekly mood summary email for ${displayName}. Include:
1. A friendly greeting
2. Overview of their week's emotional patterns
3. Key insights about their mood, energy, and stress levels
4. 3 specific, actionable recommendations to improve their wellbeing
5. An encouraging closing message

Keep the tone warm, supportive, and personal. Format with clear sections using HTML.`
          },
          {
            role: "user",
            content: `Here's the mood data for the past week:\n${moodSummary}\n\nGenerate a personalized weekly summary email.`
          }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI gateway error:", errorText);
      throw new Error("Failed to generate insights");
    }

    const aiData = await aiResponse.json();
    const emailContent = aiData.choices?.[0]?.message?.content || "Unable to generate summary.";

    // Send the email using Resend API
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "AURA <onboarding@resend.dev>",
        to: [email],
        subject: "💜 Your Weekly Mood Summary from AURA",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color: #e0e0e0;">
            <div style="background: rgba(139, 92, 246, 0.1); border: 1px solid rgba(139, 92, 246, 0.3); border-radius: 16px; padding: 24px; margin-bottom: 20px;">
              <div style="text-align: center; margin-bottom: 24px;">
                <h1 style="color: #a78bfa; margin: 0; font-size: 28px;">✨ AURA</h1>
                <p style="color: #9ca3af; margin: 8px 0 0 0; font-size: 14px;">Your Weekly Mood Summary</p>
              </div>
              ${emailContent}
            </div>
            <div style="text-align: center; padding: 16px; color: #6b7280; font-size: 12px;">
              <p>This email was sent by AURA, your AI companion.</p>
              <p>Made with 💜</p>
            </div>
          </body>
          </html>
        `,
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error("Resend API error:", errorText);
      throw new Error("Failed to send email");
    }

    const emailResult = await emailResponse.json();
    console.log("Email sent successfully to user:", userId);

    return new Response(JSON.stringify({ success: true, emailResult }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in send-mood-summary:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
