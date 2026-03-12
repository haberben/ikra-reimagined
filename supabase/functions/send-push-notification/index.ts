import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// You must set this in your Supabase project dashboard secrets
// Key name: FCM_SERVER_KEY
// Value: The legacy server key from your Firebase project settings
const FCM_SERVER_KEY = Deno.env.get('FCM_SERVER_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { title, body, imageUrl } = await req.json()

    if (!title || !body) {
         return new Response(JSON.stringify({ error: "Title and body are required." }), { 
             headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
             status: 400 
         })
    }

    if (!FCM_SERVER_KEY) {
        console.error("FCM_SERVER_KEY is missing from environment variables.");
        return new Response(JSON.stringify({ error: "Server configuration error." }), { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
            status: 500 
        })
    }

    // Since we don't have user device tokens yet, we'll send a topic message
    // Appflow users can easily subscribe to "all_users" when the app boots
    const fcmPayload = {
      to: "/topics/all_users",
      notification: {
        title: title,
        body: body,
        image: imageUrl || null,
        sound: "default"
      },
      data: {
        route: "/notifications"
      }
    }

    const res = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `key=${FCM_SERVER_KEY}`
      },
      body: JSON.stringify(fcmPayload)
    });

    const fcmResult = await res.json();
    
    return new Response(
      JSON.stringify({ success: true, message: "Notification sent", details: fcmResult }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
