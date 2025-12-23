import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation constants
const MAX_QUERY_LENGTH = 500;
const VALID_SEARCH_TYPES = ['google', 'youtube'];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
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

    const { query, type = 'google' } = requestData;

    // Validate query
    if (!query || typeof query !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Query is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const trimmedQuery = query.trim();
    if (trimmedQuery.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Query cannot be empty' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (trimmedQuery.length > MAX_QUERY_LENGTH) {
      return new Response(
        JSON.stringify({ error: `Query too long. Maximum ${MAX_QUERY_LENGTH} characters allowed.` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate search type
    const searchType = typeof type === 'string' && VALID_SEARCH_TYPES.includes(type) ? type : 'google';

    console.log(`Web search: type=${searchType}, query=${trimmedQuery}`);

    // Use Lovable AI with grounded search capability
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    let systemPrompt = '';
    if (searchType === 'youtube') {
      systemPrompt = `You are a YouTube search assistant. When the user searches for something, provide a list of 5-8 relevant YouTube video suggestions with:
- Title (make it realistic and clickable)
- Channel name
- View count (realistic numbers)
- Duration (in MM:SS format)
- Brief description
- A realistic video ID (11 characters)

Format your response as a JSON array with objects containing: title, channel, views, duration, description, videoId.
Only respond with the JSON array, no other text.`;
    } else {
      systemPrompt = `You are a Google search assistant. When the user searches for something, provide 5-8 relevant search results with:
- Title (realistic webpage title)
- URL (realistic URL)
- Snippet (2-3 sentence description)
- Source name

Format your response as a JSON array with objects containing: title, url, snippet, source.
Only respond with the JSON array, no other text.`;
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
      throw new Error('Failed to get search results');
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '[]';
    
    // Parse the JSON response
    let results = [];
    try {
      // Extract JSON from the response (might be wrapped in markdown code blocks)
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        results = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error('Failed to parse search results:', e);
      results = [];
    }

    console.log(`Returning ${results.length} results for ${searchType} search`);

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