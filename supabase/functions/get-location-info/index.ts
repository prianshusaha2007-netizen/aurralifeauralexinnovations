import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { latitude, longitude, type } = await req.json();
    
    console.log('Location info request:', { latitude, longitude, type });

    if (type === 'restaurants') {
      // Use Overpass API (free OpenStreetMap service) for nearby restaurants
      const overpassQuery = `
        [out:json][timeout:25];
        (
          node["amenity"="restaurant"](around:2000,${latitude},${longitude});
          node["amenity"="cafe"](around:2000,${latitude},${longitude});
          node["amenity"="fast_food"](around:2000,${latitude},${longitude});
        );
        out body 10;
      `;
      
      const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: `data=${encodeURIComponent(overpassQuery)}`,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
      
      if (!response.ok) throw new Error('Overpass API error');
      
      const data = await response.json();
      
      const restaurants = data.elements?.slice(0, 5).map((el: any) => ({
        name: el.tags?.name || 'Unnamed Restaurant',
        cuisine: el.tags?.cuisine || 'Various',
        type: el.tags?.amenity === 'cafe' ? 'Café' : el.tags?.amenity === 'fast_food' ? 'Fast Food' : 'Restaurant',
        lat: el.lat,
        lon: el.lon,
      })) || [];
      
      return new Response(JSON.stringify({ restaurants }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    if (type === 'traffic') {
      // For traffic, we'd need a paid API. Return a simulated response for now.
      const hour = new Date().getHours();
      let trafficLevel = 'light';
      let eta = 'Normal commute times expected';
      
      if ((hour >= 8 && hour <= 10) || (hour >= 17 && hour <= 19)) {
        trafficLevel = 'heavy';
        eta = 'Expect 20-30 min delays on major routes';
      } else if ((hour >= 7 && hour <= 11) || (hour >= 16 && hour <= 20)) {
        trafficLevel = 'moderate';
        eta = 'Expect 10-15 min delays on busy roads';
      }
      
      return new Response(JSON.stringify({
        trafficLevel,
        eta,
        suggestion: trafficLevel === 'heavy' 
          ? 'Consider leaving later or using alternate routes'
          : trafficLevel === 'moderate'
          ? 'Minor delays expected, plan accordingly'
          : 'Roads are clear, good time to travel!',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid type' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Location info error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
