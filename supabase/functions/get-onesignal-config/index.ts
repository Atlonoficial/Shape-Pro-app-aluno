import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('OneSignal Config: Providing App ID for client')
    
    // Get OneSignal App ID from environment
    const oneSignalAppId = Deno.env.get('ONESIGNAL_APP_ID')
    
    if (!oneSignalAppId) {
      throw new Error('OneSignal App ID not configured')
    }

    return new Response(
      JSON.stringify({
        success: true,
        appId: oneSignalAppId
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 200,
      }
    )

  } catch (error) {
    console.error('OneSignal Config: Error:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 400,
      }
    )
  }
})