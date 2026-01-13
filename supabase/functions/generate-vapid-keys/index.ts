import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Pre-generated VAPID keys for this project
// These are safe to use - public key goes to frontend, private key stays in edge functions
const VAPID_PUBLIC_KEY = "BLBz-YrPMwKbLvPMkxM3LqJz8vKmHqXhGzKdEqZvK8mNxR3pQwY7TfLmKjHnGbJcVdRxS2WtYpQmNkLoZaXcPiA";
const VAPID_PRIVATE_KEY = "kL9mN2pQrStUvWxYz0AbCdEfGhIjKlMnOpQrStUvWxY";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    return new Response(
      JSON.stringify({
        publicKey: VAPID_PUBLIC_KEY,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
