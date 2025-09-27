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
        
      default:
        throw new Error(`Gateway webhook não suportado: ${gateway}`);
    }

    if (!paymentData) {
      return new Response('OK', { status: 200 });
    }

    console.log('💰 Payment data processed:', paymentData);

    // Atualizar status da transação
    const { error: updateError } = await supabase
      .from('payment_transactions')
      .update({
        status: paymentData.status,
        paid_at: paymentData.status === 'paid' ? new Date().toISOString() : null,
        gateway_response: paymentData.raw_data
      })
      .eq('gateway_transaction_id', paymentData.transaction_id);

    if (updateError) {
      console.error('❌ Failed to update transaction:', updateError);
      throw updateError;
    }

    // Se pagamento aprovado, liberar acesso
    if (paymentData.status === 'paid') {
      await processSuccessfulPayment(paymentData.transaction_id);
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
  
  if (body.type !== 'payment') {
    console.log('🔄 Non-payment notification, ignoring');
    return null;
  }

  const paymentId = body.data.id;
  
  // Buscar dados do pagamento na API do MercadoPago
  // Aqui você precisa das credenciais do professor específico
  const { data: transaction } = await supabase
    .from('payment_transactions')
    .select('teacher_id')
    .eq('gateway_payment_id', paymentId)
    .single();

  if (!transaction) {
    throw new Error(`Transaction not found for payment ID: ${paymentId}`);
  }

  const { data: settings } = await supabase
    .from('teacher_payment_settings')
    .select('credentials')
    .eq('teacher_id', transaction.teacher_id)
    .single();

  if (!settings) {
    throw new Error('Payment settings not found');
  }

  const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: {
      'Authorization': `Bearer ${settings.credentials.access_token}`
    }
  });

  const payment = await response.json();

  return {
    transaction_id: paymentId,
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

  // Buscar transação
  const { data: transaction } = await supabase
    .from('payment_transactions')
    .select('*')
    .eq('gateway_transaction_id', transactionId)
    .single();

  if (!transaction) {
    throw new Error('Transaction not found');
  }

  const metadata = transaction.metadata;
  
  // Processar itens comprados
  if (metadata.items) {
    for (const item of metadata.items) {
      if (item.type === 'course') {
        await grantCourseAccess(transaction.student_id, item.course_id);
      }
      if (item.type === 'product') {
        await processProductPurchase(transaction.student_id, item.product_id);
      }
      if (item.type === 'plan') {
        // Usar função do banco para ativar plano
        await supabase.rpc('activate_student_plan', {
          p_student_id: transaction.student_id,
          p_teacher_id: transaction.teacher_id,
          p_plan_catalog_id: item.plan_catalog_id
        });
      }
    }
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