import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function arrayBufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

async function generateVapidKeys(): Promise<{ publicKey: string; privateKey: string }> {
  const keyPair = await crypto.subtle.generateKey(
    { name: 'ECDSA', namedCurve: 'P-256' },
    true,
    ['sign', 'verify']
  );

  const publicKeyRaw = await crypto.subtle.exportKey('raw', keyPair.publicKey);
  const privateKeyJwk = await crypto.subtle.exportKey('jwk', keyPair.privateKey);

  return {
    publicKey: arrayBufferToBase64Url(publicKeyRaw),
    privateKey: privateKeyJwk.d!,
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if VAPID keys already exist
    const { data: existingPublic } = await supabase
      .from('system_config')
      .select('config_value')
      .eq('config_key', 'vapid_public_key')
      .single();

    if (existingPublic) {
      return new Response(
        JSON.stringify({ publicKey: existingPublic.config_value }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate new VAPID keys
    const keys = await generateVapidKeys();

    // Store both keys
    const { error: pubErr } = await supabase.from('system_config').upsert({
      config_key: 'vapid_public_key',
      config_value: keys.publicKey,
    }, { onConflict: 'config_key' });

    const { error: privErr } = await supabase.from('system_config').upsert({
      config_key: 'vapid_private_key',
      config_value: keys.privateKey,
    }, { onConflict: 'config_key' });

    if (pubErr || privErr) {
      throw new Error(`Failed to store VAPID keys: ${pubErr?.message || privErr?.message}`);
    }

    console.log('Generated and stored new VAPID keys');

    return new Response(
      JSON.stringify({ publicKey: keys.publicKey }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('VAPID key generation error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
