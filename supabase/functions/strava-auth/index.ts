import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.54.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

serve(async (req) => {
  const requestId = crypto.randomUUID().substring(0, 8);
  const timestamp = new Date().toISOString();
  
  console.log(`[${timestamp}] [${requestId}] 📨 NOVA REQUISIÇÃO`);
  console.log(`[${requestId}] 🔍 Método: ${req.method}`);
  console.log(`[${requestId}] 🔍 URL: ${req.url}`);
  console.log(`[${requestId}] 🔍 Headers:`, JSON.stringify(Object.fromEntries(req.headers.entries()), null, 2));

  // Public status endpoint (no authentication required)
  if (req.method === 'GET' && new URL(req.url).pathname.endsWith('/status')) {
    return new Response(JSON.stringify({
      status: 'online',
      timestamp: new Date().toISOString(),
      version: 'build-38',
      message: 'Edge Function is running'
    }), {
      headers: { 
        ...corsHeaders,
        'Content-Type': 'application/json' 
      },
    });
  }

  if (req.method === 'OPTIONS') {
    console.log(`[${requestId}] ✅ Respondendo OPTIONS (CORS preflight)`);
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
  }

  try {
    console.log(`[${requestId}] 🔍 Iniciando processamento...`);
    
    // ✅ VALIDAÇÃO ANTECIPADA DE SECRETS (antes de tudo)
    const clientId = Deno.env.get('STRAVA_CLIENT_ID');
    const clientSecret = Deno.env.get('STRAVA_CLIENT_SECRET');
    
    console.log(`[${requestId}] 🔑 Secret status:`, {
      hasClientId: !!clientId,
      hasClientSecret: !!clientSecret,
      clientIdLength: clientId?.length || 0
    });
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log(`[${requestId}] 📖 Lendo body da requisição...`);
    const requestBody = await req.json();
    console.log(`[${requestId}] 📦 Body recebido:`, JSON.stringify(requestBody, null, 2));
    
    const { action, code, state } = requestBody;
    console.log(`[${requestId}] 🎯 Action solicitada: ${action}`);

    // ✅ DEBUG ENDPOINT (diagnóstico completo de requisição)
    if (action === 'debug') {
      console.log(`[${requestId}] 🐛 Processando DEBUG`);
      const debugInfo = {
        receivedAt: new Date().toISOString(),
        requestId,
        method: req.method,
        url: req.url,
        headers: Object.fromEntries(req.headers.entries()),
        body: requestBody,
        environment: {
          hasClientId: !!clientId,
          hasClientSecret: !!clientSecret,
          supabaseUrl: !!Deno.env.get('SUPABASE_URL'),
          serviceRoleKey: !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
        }
      };
      console.log(`[${requestId}] 📊 Debug info:`, JSON.stringify(debugInfo, null, 2));
      return new Response(JSON.stringify(debugInfo), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  // ✅ PING ENDPOINT (teste de conectividade básico)
  if (action === 'ping') {
    console.log(`[${requestId}] 🏓 Processando PING`);
    const response = {
      pong: true,
      timestamp: new Date().toISOString(),
      server: 'strava-auth',
      version: 'build-38',
      requestId,
      secretsConfigured: !!(clientId && clientSecret),
      secretsDetails: {
        hasClientId: !!clientId,
        hasClientSecret: !!clientSecret,
        clientIdLength: clientId?.length || 0
      }
    };
    console.log(`[${requestId}] ✅ Respondendo PING:`, JSON.stringify(response, null, 2));
    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

    // ✅ HEALTH CHECK (sem autenticação necessária)
    if (action === 'health_check') {
      console.log(`[${requestId}] 🏥 Processando HEALTH CHECK`);
      console.log(`[${requestId}] 🔑 STRAVA_CLIENT_ID presente: ${!!clientId}`);
      console.log(`[${requestId}] 🔑 STRAVA_CLIENT_SECRET presente: ${!!clientSecret}`);
      
      const response = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        secrets: {
          clientId: !!clientId,
          clientSecret: !!clientSecret
        },
        message: (!clientId || !clientSecret) 
          ? 'Strava secrets not configured. Please configure STRAVA_CLIENT_ID and STRAVA_CLIENT_SECRET in Edge Function secrets.'
          : 'All secrets configured correctly',
        requestId
      };
      
      console.log(`[${requestId}] ✅ Respondendo HEALTH CHECK:`, JSON.stringify(response, null, 2));
      return new Response(JSON.stringify(response), {
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

    console.log(`[${requestId}] ✅ Authenticated user:`, user.id);

    if (action === 'get_auth_url') {
      console.log(`[${requestId}] 🎯 PROCESSING get_auth_url for user: ${user.id}`);
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
      
      // ALWAYS use web callback with platform query param for mobile deep link
      const platform = requestBody.platform || 'web';
      const isMobile = platform === 'mobile';
      
      console.log(`[${requestId}] 📱 Platform detection:`, {
        receivedPlatform: requestBody.platform,
        detectedPlatform: platform,
        isMobile
      });

      // Use web callback for both web and mobile (mobile will be deep linked)
      const redirectUri = 'https://d46ecb0f-56a1-441d-a5d5-bac293c0288a.lovableproject.com/strava-callback';
      
      console.log(`[${requestId}] 🔗 Generating Strava auth URL:`, { 
        clientId: clientId.substring(0, 5) + '...', 
        redirectUri,
        userId: user.id,
        platform: isMobile ? 'mobile' : 'web',
        explicitPlatform: requestBody.platform
      });
      
      // Add platform as query param to redirect URI for mobile detection
      const finalRedirectUri = isMobile 
        ? `${redirectUri}?platform=mobile`
        : redirectUri;
      
      const authUrl = `https://www.strava.com/oauth/authorize?` +
        `client_id=${clientId}&` +
        `response_type=code&` +
        `redirect_uri=${encodeURIComponent(finalRedirectUri)}&` +
        `approval_prompt=force&` +
        `scope=read,activity:read_all&` +
        `state=${user.id}`;

      console.log(`[${requestId}] ✅ Generated authUrl successfully`);
      console.log(`[${requestId}] 🌐 URL: ${authUrl.substring(0, 80)}...`);

      return new Response(JSON.stringify({ authUrl, requestId }), {
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
    const errorId = crypto.randomUUID().substring(0, 8);
    console.error(`[${errorId}] ❌ ERRO CRÍTICO na função strava-auth`);
    console.error(`[${errorId}] 📊 Tipo: ${error?.constructor?.name}`);
    console.error(`[${errorId}] 📊 Nome: ${error?.name}`);
    console.error(`[${errorId}] 📊 Mensagem: ${error?.message}`);
    console.error(`[${errorId}] 📊 Stack trace:`, error instanceof Error ? error.stack : 'N/A');
    console.error(`[${errorId}] 📊 Causa:`, error?.cause);
    
    const errorResponse = {
      error: error?.message || 'Internal server error',
      timestamp: new Date().toISOString(),
      errorId,
      type: error?.name || 'UnknownError',
      details: error instanceof Error ? error.stack : undefined
    };
    
    console.error(`[${errorId}] 📤 Respondendo com erro:`, JSON.stringify(errorResponse, null, 2));
    
    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});