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
    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    const assistantId = Deno.env.get('OPENAI_ASSISTANT_ID');
    
    const result = {
      timestamp: new Date().toISOString(),
      status: 'OK',
      secrets: {
        hasOpenAIKey: !!openaiKey,
        keyPrefix: openaiKey?.substring(0, 15) || 'MISSING',
        hasAssistantId: !!assistantId,
        assistantIdPrefix: assistantId?.substring(0, 15) || 'MISSING',
      },
      request: {
        method: req.method,
        hasAuthHeader: !!req.headers.get('authorization'),
        authHeaderPrefix: req.headers.get('authorization')?.substring(0, 25) || 'MISSING',
      },
      allEnvVars: Object.keys(Deno.env.toObject()).filter(k => 
        k.includes('OPENAI') || k.includes('SUPABASE')
      ),
      message: assistantId && openaiKey 
        ? '✅ Secrets configurados corretamente!' 
        : '❌ Secrets ausentes. Configure OPENAI_ASSISTANT_ID no Supabase.'
    };
    
    return new Response(JSON.stringify(result, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ 
      error: error.message,
      stack: error.stack 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
