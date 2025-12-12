import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// VAPID keys would be stored as secrets in production
// For now, we'll generate a simple notification payload

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { subscription, title, body, icon, data } = await req.json();
    
    console.log('Sending push notification:', { title, body });

    if (!subscription || !title) {
      return new Response(
        JSON.stringify({ error: 'Subscription and title are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // In a full implementation, you would use web-push library
    // For now, we'll return success and let the frontend handle local notifications
    const notificationPayload = {
      title,
      body: body || '',
      icon: icon || '/favicon.ico',
      data: data || {},
      timestamp: new Date().toISOString(),
    };

    console.log('Notification payload created:', notificationPayload);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Notification sent',
        payload: notificationPayload 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Push notification error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to send notification';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
