import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const securityHeaders = {
  ...corsHeaders,
  'Content-Type': 'application/json',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
};

// Rate limiting storage
const rateLimitMap = new Map();

interface NotificationPayload {
  title: string
  message: string
  target_users?: string[]
  data?: Record<string, any>
  scheduled_for?: string
  deep_link?: string
  image_url?: string
  action_text?: string
  action_url?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Get client IP for rate limiting
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    
    // Rate limiting: 20 requests per minute per IP
    const now = Date.now();
    const windowStart = now - 60000; // 1 minute window
    const clientRequests = rateLimitMap.get(clientIP) || [];
    const validRequests = clientRequests.filter((time: number) => time > windowStart);
    
    if (validRequests.length >= 20) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
        status: 429,
        headers: securityHeaders,
      });
    }
    
    validRequests.push(now);
    rateLimitMap.set(clientIP, validRequests);
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const body = await req.json();
    const { title, message, target_users, data, scheduled_for, deep_link, image_url, action_text, action_url }: NotificationPayload = body;
    
    // Input validation
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return new Response(JSON.stringify({ error: 'Invalid title' }), {
        status: 400,
        headers: securityHeaders,
      });
    }
    
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return new Response(JSON.stringify({ error: 'Invalid message' }), {
        status: 400,
        headers: securityHeaders,
      });
    }
    
    if (title.length > 200 || message.length > 1000) {
      return new Response(JSON.stringify({ error: 'Title or message too long' }), {
        status: 400,
        headers: securityHeaders,
      });
    }

    console.log('OneSignal: Processing notification request', { title, target_users })

    // Get OneSignal App ID and API Key from secrets/environment
    const oneSignalAppId = Deno.env.get('ONESIGNAL_APP_ID')
    const oneSignalApiKey = Deno.env.get('ONESIGNAL_API_KEY')
    
    if (!oneSignalAppId || !oneSignalApiKey) {
      throw new Error('OneSignal credentials not configured')
    }

    // If no target users specified, this is a broadcast to all users
    let playerIds: string[] = []
    
    if (target_users && target_users.length > 0) {
      // Get OneSignal player IDs for specific users
      const { data: profiles, error: profilesError } = await supabaseClient
        .from('profiles')
        .select('onesignal_player_id')
        .in('id', target_users)
        .not('onesignal_player_id', 'is', null)

      if (profilesError) {
        console.error('OneSignal: Error fetching user profiles:', profilesError)
        throw profilesError
      }

      playerIds = profiles
        ?.map(p => p.onesignal_player_id)
        .filter(Boolean) || []
      
      console.log('OneSignal: Found player IDs:', playerIds.length)
    } else {
      // Broadcast to all students of the requesting teacher (if teacher)
      const { data: teacherStudents, error: studentsError } = await supabaseClient
        .from('students')
        .select(`
          user_id,
          profiles!inner (
            onesignal_player_id
          )
        `)
        .not('profiles.onesignal_player_id', 'is', null)

      if (studentsError) {
        console.warn('OneSignal: Error fetching teacher students:', studentsError)
      } else if (teacherStudents) {
        playerIds = teacherStudents
          .map(s => s.profiles?.onesignal_player_id)
          .filter(Boolean) || []
        
        console.log('OneSignal: Broadcasting to teacher students:', playerIds.length)
      }
    }

    // Prepare OneSignal notification payload
    const oneSignalPayload: any = {
      app_id: oneSignalAppId,
      headings: { en: title },
      contents: { en: message },
      data: {
        ...data,
        deep_link,
        action_url,
      }
    }

    // Set targets
    if (playerIds.length > 0) {
      oneSignalPayload.include_player_ids = playerIds
    } else {
      // Broadcast to all users
      oneSignalPayload.included_segments = ['All']
    }

    // Add image if provided
    if (image_url) {
      oneSignalPayload.big_picture = image_url
      oneSignalPayload.large_icon = image_url
    }

    // Add action buttons if provided
    if (action_text && action_url) {
      oneSignalPayload.buttons = [{
        id: 'action_button',
        text: action_text,
        url: action_url
      }]
    }

    // Schedule notification if specified
    if (scheduled_for) {
      oneSignalPayload.send_after = scheduled_for
    }

    console.log('OneSignal: Sending notification payload:', oneSignalPayload)

    // Send notification via OneSignal API
    const oneSignalResponse = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${oneSignalApiKey}`
      },
      body: JSON.stringify(oneSignalPayload)
    })

    const oneSignalResult = await oneSignalResponse.json()
    
    if (!oneSignalResponse.ok) {
      console.error('OneSignal: API Error:', oneSignalResult)
      throw new Error(`OneSignal API Error: ${oneSignalResult.errors || 'Unknown error'}`)
    }

    console.log('OneSignal: Notification sent successfully:', oneSignalResult)

    // Log successful notifications to database
    if (target_users && target_users.length > 0) {
      const notificationLogs = target_users.map(userId => ({
        user_id: userId,
        status: 'sent',
        onesignal_id: oneSignalResult.id
      }))

      const { error: logError } = await supabaseClient
        .from('notification_logs')
        .insert(notificationLogs)

      if (logError) {
        console.error('OneSignal: Error logging notifications:', logError)
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        onesignal_id: oneSignalResult.id,
        recipients: oneSignalResult.recipients || playerIds.length
      }),
      {
        headers: securityHeaders,
        status: 200,
      }
    )

  } catch (error) {
    console.error('OneSignal: Function error:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: securityHeaders,
        status: 400,
      }
    )
  }
})