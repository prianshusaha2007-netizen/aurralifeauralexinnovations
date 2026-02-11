import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
};

// ---- Web Push Protocol Implementation using Web Crypto API ----

function base64UrlToUint8Array(base64Url: string): Uint8Array {
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const padding = '='.repeat((4 - base64.length % 4) % 4);
  const raw = atob(base64 + padding);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

function uint8ArrayToBase64Url(arr: Uint8Array): string {
  let binary = '';
  for (const byte of arr) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function concatUint8Arrays(...arrays: Uint8Array[]): Uint8Array {
  const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}

async function createVapidJwt(
  audience: string,
  subject: string,
  vapidPublicKey: string,
  vapidPrivateKey: string
): Promise<{ token: string; publicKeyBytes: Uint8Array }> {
  // Import the private key
  const privateKeyBytes = base64UrlToUint8Array(vapidPrivateKey);
  const publicKeyBytes = base64UrlToUint8Array(vapidPublicKey);

  // Build JWK for private key
  const x = uint8ArrayToBase64Url(publicKeyBytes.slice(1, 33));
  const y = uint8ArrayToBase64Url(publicKeyBytes.slice(33, 65));

  const jwk = {
    kty: 'EC',
    crv: 'P-256',
    x,
    y,
    d: vapidPrivateKey,
  };

  const key = await crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );

  // JWT header and payload
  const header = { typ: 'JWT', alg: 'ES256' };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    aud: audience,
    exp: now + 12 * 3600,
    sub: subject,
  };

  const encoder = new TextEncoder();
  const headerB64 = uint8ArrayToBase64Url(encoder.encode(JSON.stringify(header)));
  const payloadB64 = uint8ArrayToBase64Url(encoder.encode(JSON.stringify(payload)));
  const unsignedToken = `${headerB64}.${payloadB64}`;

  // Sign
  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    key,
    encoder.encode(unsignedToken)
  );

  // Convert DER signature to raw r||s format (already raw from Web Crypto)
  const signatureB64 = uint8ArrayToBase64Url(new Uint8Array(signature));
  const token = `${unsignedToken}.${signatureB64}`;

  return { token, publicKeyBytes };
}

async function encryptPayload(
  payload: string,
  p256dhKey: string,
  authSecret: string
): Promise<{ encrypted: Uint8Array; salt: Uint8Array; localPublicKey: Uint8Array }> {
  const encoder = new TextEncoder();
  const payloadBytes = encoder.encode(payload);

  // Generate local ECDH key pair
  const localKeyPair = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveBits']
  );

  const localPublicKeyRaw = await crypto.subtle.exportKey('raw', localKeyPair.publicKey);
  const localPublicKey = new Uint8Array(localPublicKeyRaw);

  // Import subscriber's public key
  const subscriberKeyBytes = base64UrlToUint8Array(p256dhKey);
  const subscriberKey = await crypto.subtle.importKey(
    'raw',
    subscriberKeyBytes,
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    []
  );

  // Derive shared secret via ECDH
  const sharedSecretBits = await crypto.subtle.deriveBits(
    { name: 'ECDH', public: subscriberKey },
    localKeyPair.privateKey,
    256
  );
  const sharedSecret = new Uint8Array(sharedSecretBits);

  // Auth secret
  const authSecretBytes = base64UrlToUint8Array(authSecret);

  // HKDF to derive PRK from auth
  const prkKey = await crypto.subtle.importKey('raw', sharedSecret, { name: 'HKDF' }, false, ['deriveBits']);

  // info for auth: "WebPush: info\0" + subscriber_key + local_key
  const authInfo = concatUint8Arrays(
    encoder.encode('WebPush: info\0'),
    subscriberKeyBytes,
    localPublicKey
  );

  const ikm = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: 'HKDF', hash: 'SHA-256', salt: authSecretBytes, info: authInfo },
      prkKey,
      256
    )
  );

  // Generate salt
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // Derive content encryption key and nonce using HKDF
  const ikmKey = await crypto.subtle.importKey('raw', ikm, { name: 'HKDF' }, false, ['deriveBits']);

  const cekInfo = encoder.encode('Content-Encoding: aes128gcm\0');
  const cekBits = await crypto.subtle.deriveBits(
    { name: 'HKDF', hash: 'SHA-256', salt, info: cekInfo },
    ikmKey,
    128
  );

  const nonceInfo = encoder.encode('Content-Encoding: nonce\0');
  const nonceBits = await crypto.subtle.deriveBits(
    { name: 'HKDF', hash: 'SHA-256', salt, info: nonceInfo },
    ikmKey,
    96
  );

  // Add padding delimiter
  const paddedPayload = concatUint8Arrays(payloadBytes, new Uint8Array([2]));

  // Encrypt with AES-128-GCM
  const contentKey = await crypto.subtle.importKey('raw', new Uint8Array(cekBits), { name: 'AES-GCM' }, false, ['encrypt']);
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: new Uint8Array(nonceBits) },
    contentKey,
    paddedPayload
  );

  // Build aes128gcm header: salt(16) + rs(4) + idlen(1) + keyid(65) + encrypted
  const rs = new Uint8Array(4);
  new DataView(rs.buffer).setUint32(0, 4096);
  const idLen = new Uint8Array([65]);

  const body = concatUint8Arrays(salt, rs, idLen, localPublicKey, new Uint8Array(encrypted));

  return { encrypted: body, salt, localPublicKey };
}

async function sendPushToSubscription(
  endpoint: string,
  p256dh: string,
  auth: string,
  payload: string,
  vapidPublicKey: string,
  vapidPrivateKey: string,
  vapidSubject: string
): Promise<{ success: boolean; status: number; statusText: string }> {
  const url = new URL(endpoint);
  const audience = `${url.protocol}//${url.host}`;

  // Create VAPID authorization
  const { token, publicKeyBytes } = await createVapidJwt(
    audience,
    vapidSubject,
    vapidPublicKey,
    vapidPrivateKey
  );

  // Convert p256dh and auth from standard base64 to base64url
  const p256dhUrl = p256dh.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  const authUrl = auth.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

  // Encrypt the payload
  const { encrypted } = await encryptPayload(payload, p256dhUrl, authUrl);

  const vapidPublicKeyB64 = uint8ArrayToBase64Url(publicKeyBytes);

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Encoding': 'aes128gcm',
      'TTL': '86400',
      'Authorization': `vapid t=${token}, k=${vapidPublicKeyB64}`,
    },
    body: encrypted,
  });

  return {
    success: response.status >= 200 && response.status < 300,
    status: response.status,
    statusText: response.statusText,
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

    const { userId, title, body, icon, tag, data } = await req.json();

    if (!userId) throw new Error('userId is required');

    // Get VAPID keys from system_config
    const { data: vapidPub } = await supabase
      .from('system_config')
      .select('config_value')
      .eq('config_key', 'vapid_public_key')
      .single();

    const { data: vapidPriv } = await supabase
      .from('system_config')
      .select('config_value')
      .eq('config_key', 'vapid_private_key')
      .single();

    if (!vapidPub || !vapidPriv) {
      // Try to generate keys first
      const genResponse = await fetch(`${supabaseUrl}/functions/v1/generate-vapid-keys`, {
        headers: { 'Authorization': `Bearer ${supabaseServiceKey}` },
      });
      if (!genResponse.ok) {
        throw new Error('VAPID keys not configured. Call generate-vapid-keys first.');
      }
    }

    const vapidPublicKey = vapidPub?.config_value;
    const vapidPrivateKey = vapidPriv?.config_value;

    if (!vapidPublicKey || !vapidPrivateKey) {
      throw new Error('VAPID keys not found after generation attempt');
    }

    const vapidSubject = `mailto:noreply@aura-app.com`;

    // Get user's push subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', userId);

    if (subError) throw subError;

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ success: false, message: 'No push subscriptions found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const payload = JSON.stringify({
      title: title || 'AURA',
      body: body || 'You have a new notification',
      icon: icon || '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      tag: tag || `aura-${Date.now()}`,
      data: data || {},
      timestamp: Date.now(),
    });

    const results = [];
    const expiredEndpoints: string[] = [];

    for (const sub of subscriptions) {
      try {
        const result = await sendPushToSubscription(
          sub.endpoint,
          sub.p256dh,
          sub.auth,
          payload,
          vapidPublicKey,
          vapidPrivateKey,
          vapidSubject
        );

        results.push({ endpoint: sub.endpoint, ...result });

        // Clean up expired/invalid subscriptions (410 Gone or 404)
        if (result.status === 410 || result.status === 404) {
          expiredEndpoints.push(sub.endpoint);
        }
      } catch (err) {
        console.error(`Failed to send push to ${sub.endpoint}:`, err);
        results.push({ endpoint: sub.endpoint, success: false, error: String(err) });
      }
    }

    // Remove expired subscriptions
    if (expiredEndpoints.length > 0) {
      await supabase
        .from('push_subscriptions')
        .delete()
        .eq('user_id', userId)
        .in('endpoint', expiredEndpoints);
      console.log(`Cleaned up ${expiredEndpoints.length} expired subscriptions`);
    }

    const successCount = results.filter(r => r.success).length;

    return new Response(
      JSON.stringify({
        success: successCount > 0,
        message: `Sent to ${successCount}/${results.length} subscription(s)`,
        results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Web push error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
