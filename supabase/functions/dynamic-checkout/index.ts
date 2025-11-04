import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.54.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-platform',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      teacherId, 
      studentId, 
      items, 
      totalAmount,
      customerData = {} 
    } = await req.json();

    console.log('🚀 Creating dynamic checkout:', { teacherId, studentId, items, totalAmount });

    // Validações básicas
    if (!teacherId || !studentId || !items || !totalAmount) {
      throw new Error('Dados obrigatórios não informados');
    }

    // Buscar configurações de pagamento do professor
    let { data: paymentSettings, error: settingsError } = await supabase
      .from('teacher_payment_settings')
      .select('*')
      .eq('teacher_id', teacherId)
      .eq('is_active', true)
      .single();

    // Fallback: se não encontrar configurações do professor, buscar configuração global
    if (settingsError || !paymentSettings) {
      console.log('⚠️ Teacher payment settings not found, trying system config fallback...');
      
      const { data: systemConfig, error: systemError } = await supabase
        .from('system_payment_config')
        .select('*')
        .eq('gateway_type', 'mercadopago')
        .eq('is_active', true)
        .single();
        
      if (systemError || !systemConfig) {
        console.error('❌ No payment settings found (teacher or system):', { settingsError, systemError });
        throw new Error('Configurações de pagamento não encontradas');
      }
      
      console.log('✅ Using system payment config as fallback');
      paymentSettings = systemConfig;
    }

    console.log('✅ Payment settings found:', paymentSettings.gateway_type);

    // Criar transação no banco
    const { data: transaction, error: transactionError } = await supabase
      .from('payment_transactions')
      .insert({
        teacher_id: teacherId,
        student_id: studentId,
        amount: totalAmount,
        gateway_type: paymentSettings.gateway_type,
        currency: 'BRL',
        status: 'pending',
        metadata: {
          items,
          customer_data: customerData,
          created_via: 'dynamic_checkout'
        }
      })
      .select()
      .single();

    if (transactionError) {
      console.error('❌ Transaction creation failed:', transactionError);
      throw new Error('Falha ao criar transação');
    }

    console.log('✅ Transaction created:', transaction.id);

    // Processar itens específicos por tipo
    const processedItems = await processCheckoutItems(items, teacherId);
    
    // Direcionar para gateway específico baseado na configuração
    let checkoutResponse;
    
    switch (paymentSettings.gateway_type) {
      case 'mercado_pago':
      case 'mercadopago':
        checkoutResponse = await createMercadoPagoCheckout(
          paymentSettings.credentials,
          transaction,
          processedItems,
          customerData
        );
        break;
      
      case 'stripe':
        checkoutResponse = await createStripeCheckout(
          paymentSettings.credentials,
          transaction,
          processedItems,
          customerData
        );
        break;
        
      case 'pagseguro':
        checkoutResponse = await createPagSeguroCheckout(
          paymentSettings.credentials,
          transaction,
          processedItems,
          customerData
        );
        break;
        
      case 'asaas':
        checkoutResponse = await createAsaasCheckout(
          paymentSettings.credentials,
          transaction,
          processedItems,
          customerData
        );
        break;
        
      default:
        throw new Error(`Gateway ${paymentSettings.gateway_type} não suportado`);
    }

    // Atualizar transação com dados do gateway
    if (checkoutResponse) {
      await supabase
        .from('payment_transactions')
        .update({
          gateway_transaction_id: transaction.id, // ✅ ID interno da transação
          gateway_payment_id: checkoutResponse.payment_id, // ✅ ID do pagamento (pode ser null)
          gateway_preference_id: checkoutResponse.transaction_id, // ✅ ID da preferência/checkout
          checkout_url: checkoutResponse.checkout_url,
          gateway_response: checkoutResponse.raw_response,
          expires_at: checkoutResponse.expires_at
        })
        .eq('id', transaction.id);

      console.log('✅ Transaction updated:', {
        internal_id: transaction.id,
        preference_id: checkoutResponse.transaction_id,
        payment_id: checkoutResponse.payment_id
      });

      console.log('✅ Checkout created successfully:', checkoutResponse.checkout_url);

      return new Response(
        JSON.stringify({
          success: true,
          transaction_id: transaction.id,
          checkout_url: checkoutResponse.checkout_url,
          gateway_type: paymentSettings.gateway_type,
          expires_at: checkoutResponse.expires_at
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      throw new Error('Checkout response is empty');
    }

  } catch (error: any) {
    console.error('❌ Checkout creation failed:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error?.message || 'Internal server error'
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

// MercadoPago Integration
async function createMercadoPagoCheckout(credentials: any, transaction: any, items: any[], customerData: any) {
  console.log('🔑 Creating MercadoPago checkout with credentials check');
  
  // Support both api_key (dashboard format) and access_token (legacy format)
  const accessToken = credentials.api_key || credentials.access_token;
  
  if (!accessToken) {
    console.error('❌ MercadoPago credentials missing:', { 
      has_api_key: !!credentials.api_key,
      has_access_token: !!credentials.access_token,
      available_keys: Object.keys(credentials)
    });
    throw new Error('MercadoPago API key não configurado');
  }
  
  console.log('✅ MercadoPago credentials found:', { 
    credential_type: credentials.api_key ? 'api_key' : 'access_token',
    is_sandbox: credentials.is_sandbox 
  });

  const preference = {
    items: items.map(item => ({
      title: item.title,
      unit_price: parseFloat(item.price),
      quantity: item.quantity || 1,
      currency_id: 'BRL'
    })),
    payer: {
      name: customerData.name || '',
      email: customerData.email || '',
    },
    external_reference: transaction.id,
    notification_url: `${supabaseUrl}/functions/v1/payment-webhook/mercadopago`,
    back_urls: {
      success: `https://d46ecb0f-56a1-441d-a5d5-bac293c0288a.lovableproject.com/assinaturas-planos?payment=success&transaction_id=${transaction.id}`,
      failure: `https://d46ecb0f-56a1-441d-a5d5-bac293c0288a.lovableproject.com/assinaturas-planos?payment=failure&transaction_id=${transaction.id}`,
      pending: `https://d46ecb0f-56a1-441d-a5d5-bac293c0288a.lovableproject.com/assinaturas-planos?payment=pending&transaction_id=${transaction.id}`,
    },
    auto_return: 'approved',
    expires: true,
    expiration_date_from: new Date().toISOString(),
    expiration_date_to: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24h
  };

  const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(preference)
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(`MercadoPago: ${data.message || 'Erro desconhecido'}`);
  }

  return {
    transaction_id: data.id,
    payment_id: data.id,
    checkout_url: data.init_point,
    expires_at: preference.expiration_date_to,
    raw_response: data
  };
}

// Stripe Integration
async function createStripeCheckout(credentials: any, transaction: any, items: any[], customerData: any) {
  const secretKey = credentials.secret_key;
  if (!secretKey) {
    throw new Error('Stripe secret key não configurada');
  }

  const lineItems = items.map(item => ({
    price_data: {
      currency: 'brl',
      product_data: {
        name: item.title,
      },
      unit_amount: Math.round(parseFloat(item.price) * 100), // centavos
    },
    quantity: item.quantity || 1,
  }));

  const session = {
    payment_method_types: ['card'],
    line_items: lineItems,
    mode: 'payment',
    success_url: `${Deno.env.get('FRONTEND_URL')}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${Deno.env.get('FRONTEND_URL')}/payment/cancel`,
    metadata: {
      transaction_id: transaction.id
    },
    expires_at: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24h
  };

  const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${secretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams(session as any).toString()
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(`Stripe: ${data.error?.message || 'Erro desconhecido'}`);
  }

  return {
    transaction_id: data.id,
    payment_id: data.id,
    checkout_url: data.url,
    expires_at: new Date(session.expires_at * 1000).toISOString(),
    raw_response: data
  };
}

// PagSeguro Integration
async function createPagSeguroCheckout(credentials: any, transaction: any, items: any[], customerData: any) {
  const token = credentials.token;
  if (!token) {
    throw new Error('PagSeguro token não configurado');
  }

  // PagSeguro implementation aqui
  throw new Error('PagSeguro integration em desenvolvimento');
}

// Asaas Integration  
async function createAsaasCheckout(credentials: any, transaction: any, items: any[], customerData: any) {
  const apiKey = credentials.api_key;
  if (!apiKey) {
    throw new Error('Asaas API key não configurada');
  }

  // Asaas implementation aqui
  throw new Error('Asaas integration em desenvolvimento');
}

// Processar itens do checkout baseado no tipo
async function processCheckoutItems(items: any[], teacherId: string) {
  const processedItems = [];
  
  for (const item of items) {
    if (item.type === 'plan') {
      // Buscar dados do plano no catálogo
      const { data: planData, error } = await supabase
        .from('plan_catalog')
        .select('*')
        .eq('id', item.plan_catalog_id)
        .eq('teacher_id', teacherId)
        .eq('is_active', true)
        .single();
        
      if (error || !planData) {
        throw new Error(`Plano não encontrado ou inativo: ${item.plan_catalog_id}`);
      }
      
      // Validar preço
      if (planData.price !== parseFloat(item.price)) {
        throw new Error(`Preço do plano inválido. Esperado: ${planData.price}, Recebido: ${item.price}`);
      }
      
      processedItems.push({
        ...item,
        title: planData.name,
        description: planData.description,
        plan_data: planData
      });
    } else {
      // Outros tipos de item (curso, produto, etc.)
      processedItems.push(item);
    }
  }
  
  return processedItems;
}