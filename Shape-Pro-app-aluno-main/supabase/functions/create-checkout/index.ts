import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.54.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get authenticated user
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Não autenticado');
    }

    const { course_id, teacher_id, amount, course_title } = await req.json();

    if (!course_id || !teacher_id || !amount) {
      throw new Error('Parâmetros obrigatórios faltando');
    }

    // Get teacher's payment settings
    const { data: paymentSettings, error: settingsError } = await supabase
      .from('teacher_payment_settings')
      .select('*')
      .eq('teacher_id', teacher_id)
      .eq('is_active', true)
      .single();

    if (settingsError || !paymentSettings) {
      throw new Error('Professor não possui gateway de pagamento configurado');
    }

    // Create payment transaction record
    const { data: transaction, error: transactionError } = await supabase
      .from('payment_transactions')
      .insert({
        teacher_id,
        student_id: user.id,
        amount,
        currency: 'BRL',
        gateway_type: paymentSettings.gateway_type,
        status: 'pending',
        metadata: {
          course_id,
          course_title,
          payment_type: 'course_purchase'
        }
      })
      .select()
      .single();

    if (transactionError) {
      throw transactionError;
    }

    let checkoutUrl = '';

    // Create checkout based on gateway type
    switch (paymentSettings.gateway_type) {
      case 'mercadopago':
        checkoutUrl = await createMercadoPagoCheckout(paymentSettings.credentials, {
          transaction_id: transaction.id,
          amount,
          title: `Curso: ${course_title}`,
          student_email: user.email
        });
        break;
      
      case 'stripe':
        checkoutUrl = await createStripeCheckout(paymentSettings.credentials, {
          transaction_id: transaction.id,
          amount,
          title: `Curso: ${course_title}`,
          student_email: user.email
        });
        break;
      
      case 'pagseguro':
        checkoutUrl = await createPagSeguroCheckout(paymentSettings.credentials, {
          transaction_id: transaction.id,
          amount,
          title: `Curso: ${course_title}`,
          student_email: user.email
        });
        break;
      
      default:
        throw new Error(`Gateway ${paymentSettings.gateway_type} não suportado`);
    }

    // Update transaction with checkout URL
    await supabase
      .from('payment_transactions')
      .update({ 
        checkout_url: checkoutUrl,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24h expiry
      })
      .eq('id', transaction.id);

    return new Response(
      JSON.stringify({ 
        checkout_url: checkoutUrl,
        transaction_id: transaction.id
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: any) {
    console.error('Error creating checkout:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Internal server error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});

async function createMercadoPagoCheckout(credentials: any, params: any) {
  // Implement MercadoPago checkout creation
  // This is a placeholder - actual implementation would use MercadoPago SDK
  return `https://mercadopago.com.br/checkout/${params.transaction_id}`;
}

async function createStripeCheckout(credentials: any, params: any) {
  // Implement Stripe checkout creation
  // This is a placeholder - actual implementation would use Stripe SDK
  return `https://checkout.stripe.com/${params.transaction_id}`;
}

async function createPagSeguroCheckout(credentials: any, params: any) {
  // Implement PagSeguro checkout creation
  // This is a placeholder - actual implementation would use PagSeguro SDK
  return `https://pagseguro.uol.com.br/checkout/${params.transaction_id}`;
}