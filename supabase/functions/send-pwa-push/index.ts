import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const VAPID_PUBLIC_KEY = "BLBz-YrPMwKbLvPMkxM3LqJz8vKmHqXhGzKdEqZvK8mNxR3pQwY7TfLmKjHnGbJcVdRxS2WtYpQmNkLoZaXcPiA";
const VAPID_PRIVATE_KEY = "kL9mN2pQrStUvWxYz0AbCdEfGhIjKlMnOpQrStUvWxY";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Convert base64url to Uint8Array
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { userId, title, body, icon, data, tag } = await req.json();

    if (!userId) {
      throw new Error('userId is required');
    }

    // Get user's push subscriptions
    const { data: subscriptions, error: subError } = await supabaseClient
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', userId);

    if (subError) throw subError;

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ success: false, message: 'No push subscriptions found for user' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const notificationPayload = JSON.stringify({
      title: title || 'AURA',
      body: body || 'You have a new notification',
      icon: icon || '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      tag: tag || `aura-${Date.now()}`,
      data: data || {},
      timestamp: Date.now(),
    });

    // For each subscription, we'd send the push notification
    // Note: Full web-push implementation requires the web-push library
    // For now, we'll store the notification for client-side polling
    const { error: notifError } = await supabaseClient
      .from('scheduled_notifications')
      .insert({
        user_id: userId,
        title: title || 'AURA',
        body: body || 'You have a new notification',
        notification_type: 'push',
        scheduled_for: new Date().toISOString(),
        sent: false,
      });

    if (notifError) throw notifError;

    return new Response(
      JSON.stringify({
        success: true,
        message: `Notification queued for ${subscriptions.length} subscription(s)`,
        payload: JSON.parse(notificationPayload),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Push notification error:', error);
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
