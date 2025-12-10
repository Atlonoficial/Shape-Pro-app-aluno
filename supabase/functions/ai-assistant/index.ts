import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.54.0';

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

interface StudentContextData {
  profile: any;
  student: any;
  anamnese: any;
  workouts: any[];
  nutritionPlans: any[];
  progress: any[];
  medicalExams: any[];
  progressPhotos: any[];
  mealLogs: any[];
  recentActivities: any[];
}

// ✅ BUILD 85: Constantes de controle - Limites por tipo de usuário
const FREE_DAILY_LIMIT = 3;     // 3 perguntas por dia para usuários gratuitos
const PREMIUM_DAILY_LIMIT = 20; // 20 perguntas por dia para assinantes
const MAX_RESPONSE_TOKENS = 500; // ~350-400 caracteres

/**
 * ✅ BUILD 85: Verifica se usuário tem assinatura premium ativa
 * Verifica tanto via metadata do usuário quanto via tabela de subscriptions
 */
async function checkPremiumStatus(supabase: any, userId: string): Promise<boolean> {
  console.log('[checkPremiumStatus] Verificando status premium para:', userId);

  try {
    // 1. Verificar metadata do usuário (atualizado pelo RevenueCat webhook ou app)
    const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(userId);

    if (!userError && user?.user_metadata?.premium === true) {
      console.log('[checkPremiumStatus] ✅ Premium via metadata');
      return true;
    }

    // 2. Verificar tabela plan_subscriptions (assinaturas via personal trainer)
    const { data: planSub } = await supabase
      .from('plan_subscriptions')
      .select('status')
      .eq('student_user_id', userId)
      .eq('status', 'active')
      .maybeSingle();

    if (planSub) {
      console.log('[checkPremiumStatus] ✅ Premium via plan_subscriptions');
      return true;
    }

    // 3. Verificar entitlements armazenados (se webhook RevenueCat atualizar)
    const { data: entitlement } = await supabase
      .from('user_entitlements')
      .select('entitlement_id, is_active')
      .eq('user_id', userId)
      .eq('is_active', true)
      .in('entitlement_id', ['premium_ai', 'Atlon Tech Pro', 'premium_access'])
      .maybeSingle();

    if (entitlement) {
      console.log('[checkPremiumStatus] ✅ Premium via user_entitlements:', entitlement.entitlement_id);
      return true;
    }

    console.log('[checkPremiumStatus] ❌ Usuário não é premium');
    return false;
  } catch (error) {
    console.error('[checkPremiumStatus] Erro ao verificar premium:', error);
    // Em caso de erro, assume free por segurança
    return false;
  }
}

/**
 * Verifica limite diário e incrementa contador
 * ✅ BUILD 85: Agora usa limite dinâmico baseado no status premium
 */
async function checkAndUpdateDailyLimit(
  supabase: any,
  userId: string,
  isPremium: boolean
): Promise<{ allowed: boolean; dailyCount: number; dailyLimit: number; message?: string }> {

  const DAILY_LIMIT = isPremium ? PREMIUM_DAILY_LIMIT : FREE_DAILY_LIMIT;
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  console.log('[checkDailyLimit] Checking for user:', userId, 'date:', today, 'isPremium:', isPremium, 'limit:', DAILY_LIMIT);

  // Buscar registro de uso do dia
  const { data: usageData, error: fetchError } = await supabase
    .from('ai_usage_stats')
    .select('*')
    .eq('user_id', userId)
    .eq('usage_date', today)
    .maybeSingle();

  if (fetchError) {
    console.error('[checkDailyLimit] Error fetching usage:', fetchError);
    throw fetchError;
  }

  if (usageData) {
    // Registro existe - verificar limite
    const currentCount = usageData.daily_count;

    console.log('[checkDailyLimit] Current count:', currentCount, 'Limit:', DAILY_LIMIT);

    if (currentCount >= DAILY_LIMIT) {
      console.warn('[checkDailyLimit] ⚠️ Daily limit reached');
      const limitMessage = isPremium
        ? `Você atingiu o limite de ${DAILY_LIMIT} perguntas premium por dia. Seu limite reseta à meia-noite. 🕐`
        : `Você atingiu o limite de ${DAILY_LIMIT} perguntas gratuitas por dia. Assine o Coach IA para ter 20 perguntas diárias! 🚀`;
      return {
        allowed: false,
        dailyCount: currentCount,
        dailyLimit: DAILY_LIMIT,
        message: limitMessage
      };
    }

    // Incrementar contador
    const { error: updateError } = await supabase
      .from('ai_usage_stats')
      .update({
        daily_count: currentCount + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', usageData.id);

    if (updateError) {
      console.error('[checkDailyLimit] Error updating usage:', updateError);
      throw updateError;
    }

    console.log('[checkDailyLimit] ✅ Usage updated to:', currentCount + 1);

    return {
      allowed: true,
      dailyCount: currentCount + 1,
      dailyLimit: DAILY_LIMIT
    };

  } else {
    // Primeiro uso do dia - criar registro
    const { error: insertError } = await supabase
      .from('ai_usage_stats')
      .insert({
        user_id: userId,
        usage_date: today,
        daily_count: 1
      });

    if (insertError) {
      console.error('[checkDailyLimit] Error inserting usage:', insertError);
      throw insertError;
    }

    console.log('[checkDailyLimit] ✅ New usage record created');

    return {
      allowed: true,
      dailyCount: 1,
      dailyLimit: DAILY_LIMIT
    };
  }
}

serve(async (req) => {
  // Log inicial
  console.log('[ai-assistant] 📥 Request received:', {
    method: req.method,
    url: req.url,
    hasAuth: !!req.headers.get('authorization'),
    timestamp: new Date().toISOString()
  });

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    console.log('[ai-assistant] ✅ OPTIONS - Returning CORS headers');
    return new Response(null, {
      headers: corsHeaders,
      status: 200
    });
  }

  // Log detalhado APÓS OPTIONS
  console.log('[ai-assistant] 📋 Full request details:', {
    method: req.method,
    url: req.url,
    headers: {
      authorization: req.headers.get('authorization')?.substring(0, 30) + '...',
      contentType: req.headers.get('content-type'),
      apikey: req.headers.get('apikey')?.substring(0, 20) + '...',
      origin: req.headers.get('origin'),
      userAgent: req.headers.get('user-agent')?.substring(0, 50)
    },
    timestamp: new Date().toISOString()
  });

  // Rejeitar métodos != POST
  if (req.method !== 'POST') {
    console.error('[ai-assistant] ❌ Invalid method:', req.method);
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: securityHeaders,
    });
  }

  console.log('[ai-assistant] ✅ POST request validated');

  try {
    // Get client IP for rate limiting
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';

    // Rate limiting: 10 requests per minute per IP
    const now = Date.now();
    const windowStart = now - 60000; // 1 minute window
    const clientRequests = rateLimitMap.get(clientIP) || [];
    const validRequests = clientRequests.filter((time: number) => time > windowStart);

    if (validRequests.length >= 10) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
        status: 429,
        headers: securityHeaders,
      });
    }

    validRequests.push(now);
    rateLimitMap.set(clientIP, validRequests);

    // Input validation
    const body = await req.json();
    const { message, conversationId } = body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return new Response(JSON.stringify({ error: 'Invalid message' }), {
        status: 400,
        headers: securityHeaders,
      });
    }

    if (message.length > 2000) {
      return new Response(JSON.stringify({ error: 'Message too long' }), {
        status: 400,
        headers: securityHeaders,
      });
    }

    if (conversationId && (typeof conversationId !== 'string' || !/^[a-f0-9-]{36}$/.test(conversationId))) {
      return new Response(JSON.stringify({ error: 'Invalid conversation ID' }), {
        status: 400,
        headers: securityHeaders,
      });
    }

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    const assistantId = Deno.env.get('OPENAI_ASSISTANT_ID');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    console.log('[ai-assistant] Environment check:', {
      hasOpenAIKey: !!openaiApiKey,
      hasAssistantId: !!assistantId,
      assistantIdPrefix: assistantId?.substring(0, 8),
      hasSupabaseUrl: !!supabaseUrl,
      hasSupabaseKey: !!supabaseKey
    });

    if (!openaiApiKey || !assistantId || !supabaseUrl || !supabaseKey) {
      console.error('[ai-assistant] Missing environment variables:', {
        missingOpenAIKey: !openaiApiKey,
        missingAssistantId: !assistantId,
        missingSupabaseUrl: !supabaseUrl,
        missingSupabaseKey: !supabaseKey
      });
      throw new Error('Missing required environment variables');
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from JWT token
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    console.log('Processing AI request for user:', user.id);

    // ✅ BUILD 85: Verificar status premium ANTES de checar limite
    const isPremium = await checkPremiumStatus(supabase, user.id);
    console.log('[ai-assistant] Premium status:', isPremium);

    // VERIFICAR LIMITE DIÁRIO (agora com limite dinâmico)
    const dailyCheck = await checkAndUpdateDailyLimit(supabase, user.id, isPremium);

    if (!dailyCheck.allowed) {
      console.warn('[ai-assistant] ❌ Daily limit exceeded');
      return new Response(JSON.stringify({
        error: dailyCheck.message,
        dailyCount: dailyCheck.dailyCount,
        dailyLimit: dailyCheck.dailyLimit,
        isPremium: isPremium,
        type: 'daily_limit_exceeded'
      }), {
        status: 429, // Too Many Requests
        headers: securityHeaders,
      });
    }

    console.log('[ai-assistant] ✅ Daily limit check passed:', {
      count: dailyCheck.dailyCount,
      limit: dailyCheck.dailyLimit,
      remaining: dailyCheck.dailyLimit - dailyCheck.dailyCount,
      isPremium: isPremium
    });

    // Get or create conversation
    let conversation;
    if (conversationId) {
      const { data } = await supabase
        .from('ai_conversations')
        .select('*')
        .eq('id', conversationId)
        .eq('user_id', user.id)
        .single();
      conversation = data;
    }

    if (!conversation) {
      const { data, error } = await supabase
        .from('ai_conversations')
        .insert({
          user_id: user.id,
          title: message.substring(0, 50) + '...'
        })
        .select()
        .single();

      if (error) throw error;
      conversation = data;
    }

    // Collect student contextual data
    console.log('[ai-assistant] Collecting student context for user:', user.id);
    const studentContext = await collectStudentContext(supabase, user.id);
    console.log('[ai-assistant] Student context collected');

    // Create OpenAI thread if not exists
    let threadId = conversation.thread_id;
    if (!threadId) {
      const threadResponse = await fetch('https://api.openai.com/v1/threads', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
          'OpenAI-Beta': 'assistants=v2'
        },
        body: JSON.stringify({
          metadata: { user_id: user.id }
        })
      });

      const thread = await threadResponse.json();
      threadId = thread.id;

      // Update conversation with thread_id
      await supabase
        .from('ai_conversations')
        .update({ thread_id: threadId })
        .eq('id', conversation.id);
    }

    // Save user message
    await supabase
      .from('ai_messages')
      .insert({
        conversation_id: conversation.id,
        role: 'user',
        content: message
      });

    // Add message to OpenAI thread with context
    console.log('[ai-assistant] Adding message to OpenAI thread:', threadId);
    const contextualMessage = `DADOS DO ALUNO PARA CONTEXTO (use essas informações para personalizar suas respostas):

PERFIL: ${studentContext.profile ? `Nome: ${studentContext.profile.name}, Email: ${studentContext.profile.email}` : 'Não disponível'}

INFORMAÇÕES DO ESTUDANTE: ${studentContext.student ? `Status: ${studentContext.student.membership_status}, Plano: ${studentContext.student.active_plan}, Objetivos: ${studentContext.student.goals?.join(', ') || 'Não definidos'}` : 'Não disponível'}

ANAMNESE: ${studentContext.anamnese ? `Doenças: ${studentContext.anamnese.doencas?.join(', ') || 'Nenhuma'}, Alergias: ${studentContext.anamnese.alergias?.join(', ') || 'Nenhuma'}, Medicações: ${studentContext.anamnese.medicacoes?.join(', ') || 'Nenhuma'}, Sono: ${studentContext.anamnese.qualidade_sono || 'Não informado'}, Lesões: ${studentContext.anamnese.lesoes || 'Nenhuma'}` : 'Não preenchida'}

TREINOS ATIVOS: ${studentContext.workouts.length > 0 ? studentContext.workouts.map(w => `${w.name} (${w.difficulty})`).join(', ') : 'Nenhum treino ativo'}

PLANOS NUTRICIONAIS: ${studentContext.nutritionPlans.length > 0 ? studentContext.nutritionPlans.map(p => `${p.name} - ${p.daily_calories} cal`).join(', ') : 'Nenhum plano nutricional'}

PROGRESSO RECENTE: ${studentContext.progress.length > 0 ? studentContext.progress.slice(-3).map(p => `${p.type}: ${p.value}${p.unit} (${new Date(p.date).toLocaleDateString('pt-BR')})`).join(', ') : 'Sem dados de progresso'}

PERGUNTA DO ALUNO: ${message}

IMPORTANTE: Use essas informações para dar respostas personalizadas e específicas para o aluno. Seja empático, motivador e use os dados reais para dar conselhos precisos.`;

    await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2'
      },
      body: JSON.stringify({
        role: 'user',
        content: contextualMessage
      })
    });

    // Run the assistant com limite de tokens
    const runResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2'
      },
      body: JSON.stringify({
        assistant_id: assistantId,
        max_completion_tokens: MAX_RESPONSE_TOKENS // Limitar resposta a ~350-400 caracteres
      })
    });

    const run = await runResponse.json();
    console.log('OpenAI run created:', run.id);

    // Poll for completion
    let runStatus = run;
    while (runStatus.status === 'queued' || runStatus.status === 'in_progress') {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const statusResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs/${run.id}`, {
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'OpenAI-Beta': 'assistants=v2'
        }
      });

      runStatus = await statusResponse.json();
      console.log('Run status:', runStatus.status);
    }

    if (runStatus.status !== 'completed') {
      throw new Error(`Assistant run failed with status: ${runStatus.status}`);
    }

    // Get messages
    const messagesResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'OpenAI-Beta': 'assistants=v2'
      }
    });

    const messages = await messagesResponse.json();
    const assistantMessage = messages.data.find((msg: any) => msg.role === 'assistant');

    if (!assistantMessage) {
      throw new Error('No assistant response found');
    }

    const responseContent = assistantMessage.content[0].text.value;

    // Save assistant message
    await supabase
      .from('ai_messages')
      .insert({
        conversation_id: conversation.id,
        role: 'assistant',
        content: responseContent,
        metadata: { thread_id: threadId, run_id: run.id }
      });

    // Update conversation timestamp
    await supabase
      .from('ai_conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversation.id);

    console.log('[ai-assistant] 🎉 SUCCESS - Sending response:', {
      conversationId: conversation.id,
      threadId: threadId,
      responseLength: responseContent.length,
      userId: user.id,
      dailyUsage: dailyCheck.dailyCount,
      dailyLimit: dailyCheck.dailyLimit,
      isPremium: isPremium,
      timestamp: new Date().toISOString()
    });

    return new Response(JSON.stringify({
      response: responseContent,
      conversationId: conversation.id,
      threadId: threadId,
      usage: {
        dailyCount: dailyCheck.dailyCount,
        dailyLimit: dailyCheck.dailyLimit,
        remainingToday: dailyCheck.dailyLimit - dailyCheck.dailyCount,
        isPremium: isPremium
      }
    }), {
      headers: securityHeaders,
    });

  } catch (error: any) {
    console.error('[ai-assistant] Error:', {
      message: error?.message,
      stack: error?.stack,
      timestamp: new Date().toISOString()
    });

    return new Response(JSON.stringify({
      error: error?.message || 'Internal server error'
    }), {
      status: 500,
      headers: securityHeaders,
    });
  }
});

async function collectStudentContext(supabase: any, userId: string): Promise<StudentContextData> {
  console.log('Collecting context for user:', userId);

  try {
    // Get profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    // Get student info
    const { data: student } = await supabase
      .from('students')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Get anamnese
    const { data: anamnese } = await supabase
      .from('anamneses')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Get workouts (last 5)
    const { data: workouts } = await supabase
      .from('workouts')
      .select('*')
      .contains('assigned_to', [userId])
      .order('created_at', { ascending: false })
      .limit(5);

    // Get nutrition plans (active ones)
    const { data: nutritionPlans } = await supabase
      .from('nutrition_plans')
      .select('*')
      .contains('assigned_to', [userId])
      .order('created_at', { ascending: false })
      .limit(3);

    // Get recent progress (last 10)
    const { data: progress } = await supabase
      .from('progress')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(10);

    // Get recent medical exams
    const { data: medicalExams } = await supabase
      .from('medical_exams')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(5);

    // Get recent progress photos
    const { data: progressPhotos } = await supabase
      .from('progress_photos')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(5);

    // Get recent meal logs (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: mealLogs } = await supabase
      .from('meal_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('date', sevenDaysAgo.toISOString())
      .order('date', { ascending: false });

    // Get recent gamification activities
    const { data: recentActivities } = await supabase
      .from('gamification_activities')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    return {
      profile: profile || null,
      student: student || null,
      anamnese: anamnese || null,
      workouts: workouts || [],
      nutritionPlans: nutritionPlans || [],
      progress: progress || [],
      medicalExams: medicalExams || [],
      progressPhotos: progressPhotos || [],
      mealLogs: mealLogs || [],
      recentActivities: recentActivities || []
    };

  } catch (error) {
    console.error('Error collecting student context:', error);
    return {
      profile: null,
      student: null,
      anamnese: null,
      workouts: [],
      nutritionPlans: [],
      progress: [],
      medicalExams: [],
      progressPhotos: [],
      mealLogs: [],
      recentActivities: []
    };
  }
}