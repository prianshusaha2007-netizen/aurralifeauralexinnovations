import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation constants
const MAX_QUERY_LENGTH = 500;
const VALID_SEARCH_TYPES = ['google', 'youtube', 'news', 'realtime'];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication check
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
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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

    const { query, type = 'google' } = requestData;

    if (!query || typeof query !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Query is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const trimmedQuery = query.trim();
    if (trimmedQuery.length === 0 || trimmedQuery.length > MAX_QUERY_LENGTH) {
      return new Response(
        JSON.stringify({ error: trimmedQuery.length === 0 ? 'Query cannot be empty' : `Query too long. Maximum ${MAX_QUERY_LENGTH} characters.` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const searchType = typeof type === 'string' && VALID_SEARCH_TYPES.includes(type) ? type : 'google';
    console.log(`Web search: type=${searchType}, query=${trimmedQuery}`);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    let systemPrompt = '';
    if (searchType === 'youtube') {
      systemPrompt = `You are a YouTube search assistant. Today is ${today}. Provide 5-8 relevant YouTube video suggestions with: title, channel, views (realistic numbers), duration (MM:SS), description, videoId (11 chars). Format as a JSON array. Only respond with the JSON array.`;
    } else if (searchType === 'news' || searchType === 'realtime') {
      systemPrompt = `You are a real-time information assistant with access to current world knowledge. Today is ${today}.

Your task: Provide the most current, accurate, and verified information available on the user's query.

RULES:
- Present information as current facts with dates where possible
- Include source attribution (e.g., "According to Reuters...", "As reported by...")
- Distinguish between confirmed facts and developing stories
- For news: provide 5-8 updates with title, source, date, summary, and category
- For general queries: provide comprehensive, up-to-date answers
- Never fabricate specific statistics or quotes
- If information may be outdated, note: "As of my latest data..."

Format for news queries: JSON array with objects containing: title, source, date, summary, category, importance (high/medium/low).
Format for realtime queries: JSON object with: answer (string), sources (array of source names), lastUpdated (date string), confidence (high/medium/low).

Only respond with the JSON, no other text.`;
    } else {
      systemPrompt = `You are a Google search assistant with current world knowledge. Today is ${today}. Provide 5-8 relevant, accurate search results with: title (realistic webpage title), url (realistic URL), snippet (2-3 sentence description with current info), source. Format as a JSON array. Only respond with the JSON array.`;
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
          { role: "user", content: `Search for: ${trimmedQuery}` },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded, please try again shortly.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'AI usage limit reached.' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      throw new Error('Failed to get search results');
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '[]';
    
    let results = [];
    try {
      const jsonMatch = content.match(/[\[{][\s\S]*[\]}]/);
      if (jsonMatch) {
        results = JSON.parse(jsonMatch[0]);
        // Normalize: if realtime returns an object, wrap it
        if (!Array.isArray(results)) {
          results = [results];
        }
      }
    } catch (e) {
      console.error('Failed to parse search results:', e);
      results = [];
    }

    console.log(`Returning ${Array.isArray(results) ? results.length : 1} results for ${searchType} search`);

    return new Response(
      JSON.stringify({ results, type: searchType }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Web search error:', error);
    return new Response(
      JSON.stringify({ error: 'An error occurred processing your request' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
