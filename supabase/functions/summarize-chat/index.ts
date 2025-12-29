import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MESSAGE_THRESHOLD = 50;

interface ChatMessage {
  id: string;
  content: string;
  sender: string;
  created_at: string;
}

interface LifeMemory {
  memory_type: string;
  title: string;
  content: string;
  metadata: Record<string, any>;
  importance_score: number;
}

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

    console.log('Checking message count for user:', user.id);

    // Get message count
    const { count, error: countError } = await supabase
      .from('chat_messages')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (countError) {
      console.error('Error counting messages:', countError);
      throw countError;
    }

    console.log('Current message count:', count);

    // Check if we need to summarize
    if (!count || count < MESSAGE_THRESHOLD) {
      return new Response(
        JSON.stringify({ 
          summarized: false, 
          message: `Only ${count || 0} messages. Summarization happens at ${MESSAGE_THRESHOLD}.` 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch oldest messages to summarize
    const { data: messages, error: messagesError } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(MESSAGE_THRESHOLD);

    if (messagesError || !messages || messages.length === 0) {
      console.error('Error fetching messages:', messagesError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch messages' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Fetched', messages.length, 'messages for summarization');

    // Use AI to summarize and extract memories
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const conversationText = messages.map((m: ChatMessage) => 
      `${m.sender === 'user' ? 'User' : 'AURRA'}: ${m.content}`
    ).join('\n');

    const timeRangeStart = messages[0].created_at;
    const timeRangeEnd = messages[messages.length - 1].created_at;

    const systemPrompt = `You are an AI that analyzes conversations to extract meaningful patterns and create summaries.

Analyze the following conversation and provide a JSON response with:
1. "summary": A 2-3 sentence summary of the key topics and interactions
2. "emotional_trend": The overall emotional arc (e.g., "anxious → calmer", "neutral", "stressed throughout", "excited → focused")
3. "key_topics": Array of 3-5 main topics discussed
4. "open_loops": Array of unresolved tasks, pending decisions, or things to follow up on
5. "life_memories": Array of significant life details to remember (if any), each with:
   - "memory_type": one of "person", "goal", "habit", "emotional_pattern", "decision", "preference", "routine", "relationship"
   - "title": Short descriptive title
   - "content": Detailed content
   - "importance_score": 1-10 (how important is this to remember)

Only extract life_memories for genuinely significant information the user shared about their life - not casual small talk.

Respond ONLY with valid JSON, no markdown formatting.`;

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
          { role: "user", content: `Analyze this conversation:\n\n${conversationText}` }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("Failed to analyze conversation");
    }

    const aiResponse = await response.json();
    const analysisText = aiResponse.choices?.[0]?.message?.content || '';
    
    console.log('AI analysis received');

    // Parse the AI response
    let analysis;
    try {
      // Clean up potential markdown formatting
      const cleanJson = analysisText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      analysis = JSON.parse(cleanJson);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError, analysisText);
      // Fallback to basic summary
      analysis = {
        summary: "Conversation summary unavailable.",
        emotional_trend: "unknown",
        key_topics: [],
        open_loops: [],
        life_memories: []
      };
    }

    // Insert life memories
    const insertedMemoryIds: string[] = [];
    if (analysis.life_memories && analysis.life_memories.length > 0) {
      for (const memory of analysis.life_memories) {
        const { data: memoryData, error: memoryError } = await supabase
          .from('life_memories')
          .insert({
            user_id: user.id,
            memory_type: memory.memory_type,
            title: memory.title,
            content: memory.content,
            importance_score: memory.importance_score || 5,
            metadata: { source: 'chat_summarization', time_range: { start: timeRangeStart, end: timeRangeEnd } }
          })
          .select('id')
          .single();

        if (!memoryError && memoryData) {
          insertedMemoryIds.push(memoryData.id);
          console.log('Inserted life memory:', memory.title);
        }
      }
    }

    // Insert chat summary
    const { error: summaryError } = await supabase
      .from('chat_summaries')
      .insert({
        user_id: user.id,
        message_count: messages.length,
        time_range_start: timeRangeStart,
        time_range_end: timeRangeEnd,
        summary: analysis.summary,
        emotional_trend: analysis.emotional_trend,
        key_topics: analysis.key_topics || [],
        open_loops: analysis.open_loops || [],
        extracted_memories: insertedMemoryIds
      });

    if (summaryError) {
      console.error('Error inserting summary:', summaryError);
      throw summaryError;
    }

    console.log('Chat summary inserted successfully');

    // Delete the summarized messages
    const messageIds = messages.map((m: ChatMessage) => m.id);
    const { error: deleteError } = await supabase
      .from('chat_messages')
      .delete()
      .in('id', messageIds);

    if (deleteError) {
      console.error('Error deleting messages:', deleteError);
      // Don't throw - summary is saved, just log the issue
    } else {
      console.log('Deleted', messageIds.length, 'summarized messages');
    }

    return new Response(
      JSON.stringify({
        summarized: true,
        messages_processed: messages.length,
        summary: analysis.summary,
        emotional_trend: analysis.emotional_trend,
        key_topics: analysis.key_topics,
        open_loops: analysis.open_loops,
        memories_extracted: insertedMemoryIds.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Summarization error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
