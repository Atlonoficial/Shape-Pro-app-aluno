import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Unauthorized');
    }

    const { gateway_type, credentials } = await req.json();

    console.log('[test-gateway-credentials] Testing credentials for:', gateway_type);

    let testResult = { valid: false, message: '', details: null };

    switch (gateway_type) {
      case 'mercadopago': {
        const accessToken = credentials.api_key || credentials.access_token;
        
        if (!accessToken) {
          testResult = {
            valid: false,
            message: 'API Key não fornecida',
            details: null
          };
          break;
        }

        try {
          const response = await fetch('https://api.mercadopago.com/v1/users/me', {
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          });

          if (response.ok) {
            const userData = await response.json();
            testResult = {
              valid: true,
              message: 'Credenciais válidas!',
              details: {
                user_id: userData.id,
                email: userData.email,
                country: userData.site_id
              }
            };
            console.log('[test-gateway-credentials] MercadoPago credentials valid:', userData.email);
          } else {
            const errorData = await response.json();
            testResult = {
              valid: false,
              message: 'Credenciais inválidas ou expiradas',
              details: errorData
            };
            console.error('[test-gateway-credentials] MercadoPago credentials invalid:', errorData);
          }
        } catch (error) {
          console.error('[test-gateway-credentials] Error testing MercadoPago:', error);
          testResult = {
            valid: false,
            message: 'Erro ao conectar com Mercado Pago',
            details: error.message
          };
        }
        break;
      }

      case 'stripe': {
        if (!credentials.secret_key) {
          testResult = {
            valid: false,
            message: 'Secret Key não fornecida',
            details: null
          };
          break;
        }

        try {
          const response = await fetch('https://api.stripe.com/v1/balance', {
            headers: {
              'Authorization': `Bearer ${credentials.secret_key}`
            }
          });

          if (response.ok) {
            testResult = {
              valid: true,
              message: 'Credenciais Stripe válidas!',
              details: null
            };
            console.log('[test-gateway-credentials] Stripe credentials valid');
          } else {
            testResult = {
              valid: false,
              message: 'Credenciais Stripe inválidas',
              details: null
            };
            console.error('[test-gateway-credentials] Stripe credentials invalid');
          }
        } catch (error) {
          console.error('[test-gateway-credentials] Error testing Stripe:', error);
          testResult = {
            valid: false,
            message: 'Erro ao conectar com Stripe',
            details: error.message
          };
        }
        break;
      }

      default:
        testResult = {
          valid: false,
          message: `Gateway ${gateway_type} não suportado para testes`,
          details: null
        };
    }

    return new Response(JSON.stringify(testResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('[test-gateway-credentials] Error:', error);
    return new Response(JSON.stringify({ 
      valid: false, 
      message: error.message 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
