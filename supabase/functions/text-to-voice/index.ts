import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { text, voice } = await req.json();

    if (!text) {
      throw new Error('Text is required');
    }

    console.log('Processing text-to-voice request, voice:', voice || 'default');

    // For full TTS support, users would need to add OpenAI or ElevenLabs API keys
    // This is a placeholder that returns a message about setup requirements
    
    return new Response(
      JSON.stringify({ 
        audioContent: null,
        message: 'Voice synthesis requires additional setup. Add an OpenAI or ElevenLabs API key for voice features.',
        requiresSetup: true
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Text-to-voice error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
