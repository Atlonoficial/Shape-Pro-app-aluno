import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.54.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const gateway = url.pathname.split('/').pop(); // mercadopago, stripe, etc
    
    console.log('🔔 Webhook received from:', gateway);
    console.log('📋 Request method:', req.method);
    console.log('🔗 Full URL:', req.url);

    // Se for GET, é um teste de conectividade
    if (req.method === 'GET') {
      return new Response('Webhook is active', { status: 200, headers: corsHeaders });
    }

    let paymentData;
    
    switch (gateway) {
      case 'mercadopago':
        paymentData = await handleMercadoPagoWebhook(req);
        break;
        
      case 'stripe':
        paymentData = await handleStripeWebhook(req);
        break;
        
      case 'pagseguro':
        paymentData = await handlePagSeguroWebhook(req);
        break;
        
      case 'asaas':
        paymentData = await handleAsaasWebhook(req);
        break;

      case 'test':
        // Endpoint de teste para processar transações pendentes manualmente
        return await processTestPayments();
        
      default:
        console.log('❓ Unknown gateway:', gateway);
        throw new Error(`Gateway webhook não suportado: ${gateway}`);
    }

    if (!paymentData) {
      console.log('⚠️ No payment data returned from gateway handler');
      return new Response('OK', { status: 200, headers: corsHeaders });
    }

    console.log('💰 Payment data processed:', paymentData);

    // Buscar transação pelo payment ID ou preference ID
    console.log('🔍 Searching transaction with:', {
      gateway_payment_id: paymentData.transaction_id,
      external_reference: paymentData.external_reference
    });

    const { data: foundTransaction, error: findError } = await supabase
      .from('payment_transactions')
      .select('id')
      .or(`gateway_payment_id.eq.${paymentData.transaction_id},gateway_preference_id.eq.${paymentData.transaction_id}`)
      .maybeSingle();

    // Fallback: buscar por external_reference se não encontrar
    let transactionToUpdate = foundTransaction;
    
    if (!transactionToUpdate && paymentData.external_reference) {
      console.log('🔄 Trying fallback search by external_reference:', paymentData.external_reference);
      const { data: fallbackTransaction } = await supabase
        .from('payment_transactions')
        .select('id')
        .eq('id', paymentData.external_reference)
        .maybeSingle();
      
      transactionToUpdate = fallbackTransaction;
    }

    if (!transactionToUpdate) {
      console.error('❌ Transaction not found for payment:', paymentData.transaction_id);
      throw new Error(`Transaction not found for payment ID: ${paymentData.transaction_id}`);
    }

    console.log('✅ Found transaction:', transactionToUpdate.id);

    // Atualizar status da transação
    const { error: updateError } = await supabase
      .from('payment_transactions')
      .update({
        status: paymentData.status,
        paid_at: paymentData.status === 'paid' ? new Date().toISOString() : null,
        gateway_payment_id: paymentData.transaction_id, // Atualizar com o payment ID real
        gateway_response: paymentData.raw_data,
        updated_at: new Date().toISOString()
      })
      .eq('id', transactionToUpdate.id);

    if (updateError) {
      console.error('❌ Failed to update transaction:', updateError);
      throw updateError;
    }

    // Se pagamento aprovado, liberar acesso
    if (paymentData.status === 'paid') {
      console.log('✅ Payment approved, processing access...');
      await processSuccessfulPayment(transactionToUpdate.id);
    }

    console.log('✅ Webhook processed successfully');

    return new Response('OK', { 
      status: 200,
      headers: corsHeaders 
    });

  } catch (error: any) {
    console.error('❌ Webhook processing failed:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Internal server error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

// MercadoPago Webhook Handler
async function handleMercadoPagoWebhook(req: Request) {
  const body = await req.json();
  
  console.log('📥 MercadoPago webhook body:', JSON.stringify(body, null, 2));
  
  if (body.type !== 'payment') {
    console.log('🔄 Non-payment notification, ignoring');
    return null;
  }

  const paymentId = body.data.id;
  const externalReference = body.external_reference;
  
  console.log('🔍 Looking for transaction with payment ID:', paymentId);
  
  // Buscar transação pelo gateway_preference_id ou external_reference
  const { data: transaction } = await supabase
    .from('payment_transactions')
    .select('teacher_id, id')
    .or(`gateway_preference_id.eq.${paymentId},id.eq.${externalReference}`)
    .maybeSingle();

  if (!transaction) {
    console.error('❌ Transaction not found for payment ID:', paymentId, 'or external_reference:', externalReference);
    throw new Error(`Transaction not found for payment ID: ${paymentId}`);
  }
  
  console.log('✅ Found transaction:', transaction.id);

  const { data: settings } = await supabase
    .from('teacher_payment_settings')
    .select('credentials')
    .eq('teacher_id', transaction.teacher_id)
    .single();

  if (!settings) {
    throw new Error('Payment settings not found');
  }

    const accessToken = settings.credentials.api_key || settings.credentials.access_token;
    if (!accessToken) {
      throw new Error('MercadoPago credentials not found');
    }

    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

  const payment = await response.json();
  
  console.log('💳 MercadoPago payment status:', payment.status);

  return {
    transaction_id: paymentId,
    external_reference: payment.external_reference,
    status: mapMercadoPagoStatus(payment.status),
    raw_data: payment
  };
}

// Stripe Webhook Handler
async function handleStripeWebhook(req: Request) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');
  
  // Validar signature do Stripe aqui
  const event = JSON.parse(body);
  
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    
    return {
      transaction_id: session.id,
      status: 'paid',
      raw_data: session
    };
  }

  return null;
}

// PagSeguro Webhook Handler  
async function handlePagSeguroWebhook(req: Request) {
  // PagSeguro webhook implementation
  throw new Error('PagSeguro webhook em desenvolvimento');
}

// Asaas Webhook Handler
async function handleAsaasWebhook(req: Request) {
  // Asaas webhook implementation
  throw new Error('Asaas webhook em desenvolvimento');
}

// Processar pagamento aprovado
async function processSuccessfulPayment(transactionId: string) {
  console.log('🎉 Processing successful payment:', transactionId);

  // Buscar transação pelo ID interno
  const { data: transaction, error: fetchError } = await supabase
    .from('payment_transactions')
    .select('*')
    .eq('id', transactionId)
    .single();

  if (fetchError || !transaction) {
    console.error('❌ Transaction not found:', transactionId, fetchError);
    throw new Error(`Transaction not found: ${transactionId}`);
  }

  console.log('📄 Processing transaction:', transaction);

  const metadata = transaction.metadata;
  
  // Processar itens comprados
  if (metadata.items) {
    for (const item of metadata.items) {
      console.log('🔄 Processing item:', item);
      
      if (item.type === 'course') {
        console.log('📚 Granting course access...');
        await grantCourseAccess(transaction.student_id, item.course_id);
      }
      
      if (item.type === 'product') {
        console.log('📦 Processing product purchase...');
        await processProductPurchase(transaction.student_id, item.product_id);
      }
      
      if (item.type === 'plan') {
        console.log('💳 Activating plan subscription...');
        const { data: activationResult, error: activationError } = await supabase.rpc('activate_student_plan', {
          p_student_id: transaction.student_id,
          p_teacher_id: transaction.teacher_id,
          p_plan_catalog_id: item.plan_catalog_id
        });
        
        if (activationError) {
          console.error('❌ Failed to activate plan:', activationError);
          throw new Error(`Failed to activate plan: ${activationError.message}`);
        }
        
        console.log('✅ Plan activated successfully:', activationResult);
      }
    }
  } else {
    console.log('⚠️ No items found in transaction metadata');
  }

  // Dar pontos de gamificação pela compra
  await supabase.rpc('award_points_enhanced_v3', {
    p_user_id: transaction.student_id,
    p_activity_type: 'purchase_completed',
    p_description: `Compra realizada - ${transaction.amount} BRL`,
    p_metadata: { transaction_id: transaction.id, amount: transaction.amount }
  });

  // Notificar professor sobre a venda
  await notifyTeacherOfSale(transaction);

  console.log('✅ Successful payment processed completely');
}

// Liberar acesso ao curso
async function grantCourseAccess(studentId: string, courseId: string) {
  const { error } = await supabase
    .from('user_purchases')
    .upsert({
      user_id: studentId,
      course_id: courseId,
      purchased_at: new Date().toISOString()
    });

  if (error) {
    console.error('❌ Failed to grant course access:', error);
  } else {
    console.log('✅ Course access granted:', { studentId, courseId });
  }
}

// Processar compra de produto
async function processProductPurchase(studentId: string, productId: string) {
  // Implementar lógica para produtos físicos/digitais
  console.log('📦 Processing product purchase:', { studentId, productId });
}

// Notificar professor sobre venda
async function notifyTeacherOfSale(transaction: any) {
  try {
    await supabase.functions.invoke('send-push-notification', {
      body: {
        user_ids: [transaction.teacher_id],
        title: '💰 Nova Venda!',
        message: `Você recebeu uma nova venda de R$ ${transaction.amount}`,
        data: {
          type: 'sale_notification',
          transaction_id: transaction.id,
          amount: transaction.amount
        }
      }
    });
  } catch (error) {
    console.error('❌ Failed to notify teacher:', error);
  }
}

// Processar transações de teste (para desenvolvimento)
async function processTestPayments() {
  console.log('🧪 Processing test payments...');
  
  try {
    // Buscar transações pendentes criadas nas últimas 24 horas
    const { data: pendingTransactions, error } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('status', 'pending')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .limit(10);

    if (error) {
      console.error('❌ Failed to fetch pending transactions:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const results = [];

    for (const transaction of pendingTransactions || []) {
      console.log(`🔄 Processing pending transaction: ${transaction.id}`);
      
      try {
        // Simular pagamento aprovado
        const { error: updateError } = await supabase
          .from('payment_transactions')
          .update({
            status: 'paid',
            paid_at: new Date().toISOString(),
            gateway_response: { test: true, processed_at: new Date().toISOString() }
          })
          .eq('id', transaction.id);

        if (updateError) {
          console.error('❌ Failed to update transaction:', updateError);
          results.push({ transaction_id: transaction.id, success: false, error: updateError.message });
          continue;
        }

        // Processar pagamento aprovado
        await processSuccessfulPayment(transaction.gateway_transaction_id || transaction.id);
        
        results.push({ transaction_id: transaction.id, success: true });
        console.log(`✅ Transaction ${transaction.id} processed successfully`);
        
      } catch (error: any) {
        console.error(`❌ Failed to process transaction ${transaction.id}:`, error);
        results.push({ transaction_id: transaction.id, success: false, error: error.message });
      }
    }

    return new Response(JSON.stringify({ 
      message: 'Test payments processed',
      processed: results.length,
      results 
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('❌ Test payment processing failed:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// Mapear status do MercadoPago
function mapMercadoPagoStatus(mpStatus: string): string {
  const statusMap: { [key: string]: string } = {
    'approved': 'paid',
    'pending': 'pending',
    'cancelled': 'cancelled',
    'rejected': 'failed',
    'refunded': 'refunded'
  };
  
  return statusMap[mpStatus] || 'pending';
}