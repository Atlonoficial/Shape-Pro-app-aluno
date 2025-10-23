import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.54.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔍 Strava auth request:', { method: req.method, url: req.url });
    
    // ✅ VALIDAÇÃO ANTECIPADA DE SECRETS (antes de tudo)
    const clientId = Deno.env.get('STRAVA_CLIENT_ID');
    const clientSecret = Deno.env.get('STRAVA_CLIENT_SECRET');
    
    console.log('🔑 Secret status:', {
      hasClientId: !!clientId,
      hasClientSecret: !!clientSecret,
      clientIdLength: clientId?.length || 0
    });
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const requestBody = await req.json();
    console.log('📦 Request body:', requestBody);
    
    const { action, code, state } = requestBody;

    // ✅ HEALTH CHECK (sem autenticação necessária)
    if (action === 'health_check') {
      console.log('🏥 Health check requested');
      return new Response(JSON.stringify({
        status: 'ok',
        timestamp: new Date().toISOString(),
        secrets: {
          clientId: !!clientId,
          clientSecret: !!clientSecret
        },
        message: (!clientId || !clientSecret) 
          ? 'Strava secrets not configured. Please configure STRAVA_CLIENT_ID and STRAVA_CLIENT_SECRET in Edge Function secrets.'
          : 'All secrets configured correctly'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ✅ VALIDAÇÃO DE AUTENTICAÇÃO (para ações que precisam)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('❌ Missing authorization header');
      throw new Error('No authorization header');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      console.error('❌ Authentication error:', authError);
      throw new Error('Invalid authentication');
    }

    console.log('✅ Authenticated user:', user.id);

    if (action === 'get_auth_url') {
      // Validação de configuração (já validado no início)
      if (!clientId) {
        console.error('❌ STRAVA_CLIENT_ID not configured');
        return new Response(JSON.stringify({
          error: 'Strava integration not configured',
          details: 'STRAVA_CLIENT_ID is missing. Please configure it in Edge Function secrets.',
          missingSecrets: ['STRAVA_CLIENT_ID']
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      const redirectUri = `https://d46ecb0f-56a1-441d-a5d5-bac293c0288a.lovableproject.com/strava-callback`;
      
      console.log('🔗 Generating Strava auth URL:', { 
        clientId: clientId.substring(0, 5) + '...', 
        redirectUri,
        userId: user.id 
      });
      
      const authUrl = `https://www.strava.com/oauth/authorize?` +
        `client_id=${clientId}&` +
        `response_type=code&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `approval_prompt=force&` +
        `scope=read,activity:read_all&` +
        `state=${user.id}`;

      return new Response(JSON.stringify({ authUrl }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'exchange_code') {
      // Validação de configuração (já validado no início)
      if (!clientId || !clientSecret) {
        console.error('❌ Strava credentials not configured');
        const missingSecrets = [];
        if (!clientId) missingSecrets.push('STRAVA_CLIENT_ID');
        if (!clientSecret) missingSecrets.push('STRAVA_CLIENT_SECRET');
        
        return new Response(JSON.stringify({
          error: 'Strava integration not configured',
          details: `Missing secrets: ${missingSecrets.join(', ')}. Please configure them in Edge Function secrets.`,
          missingSecrets
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      console.log('🔄 Exchanging Strava code for token...');
      
      const tokenResponse = await fetch('https://www.strava.com/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          code: code,
          grant_type: 'authorization_code'
        })
      });

      const tokenData = await tokenResponse.json();
      
      if (!tokenResponse.ok) {
        throw new Error(`Strava token exchange failed: ${tokenData.message}`);
      }

      // Salvar conexão no banco
      const { error: insertError } = await supabase
        .from('wearable_connections')
        .upsert({
          user_id: user.id,
          provider: 'strava',
          provider_user_id: tokenData.athlete?.id?.toString(),
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          token_expires_at: new Date(tokenData.expires_at * 1000).toISOString(),
          is_active: true,
          metadata: {
            athlete: tokenData.athlete,
            scope: tokenData.scope
          }
        }, {
          onConflict: 'user_id,provider'
        });

      if (insertError) {
        console.error('Error saving connection:', insertError);
        throw new Error('Failed to save connection');
      }

      // Iniciar sincronização inicial
      const syncResponse = await fetch(`${new URL(req.url).origin}/functions/v1/strava-sync`, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ user_id: user.id })
      });

      return new Response(JSON.stringify({ 
        success: true, 
        athlete: tokenData.athlete 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    throw new Error('Invalid action');

  } catch (error: any) {
    console.error('Strava auth error:', error);
    return new Response(JSON.stringify({ 
      error: error?.message || 'Internal server error'
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});