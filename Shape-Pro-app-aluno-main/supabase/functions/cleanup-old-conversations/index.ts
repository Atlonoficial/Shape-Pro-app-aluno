import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.54.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Constantes
const RETENTION_HOURS = 24; // Manter conversas das últimas 24 horas

serve(async (req) => {
  console.log('[cleanup-old-conversations] 🧹 Starting cleanup process...', {
    timestamp: new Date().toISOString(),
    retentionHours: RETENTION_HOURS
  });

  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Calcular data limite (24 horas atrás)
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - RETENTION_HOURS);
    const cutoffISO = cutoffDate.toISOString();

    console.log('[cleanup-old-conversations] Cutoff date:', cutoffISO);

    // Buscar conversas antigas (mais de 24 horas)
    const { data: oldConversations, error: fetchError } = await supabase
      .from('ai_conversations')
      .select('id, thread_id, user_id, created_at')
      .lt('updated_at', cutoffISO);

    if (fetchError) {
      console.error('[cleanup-old-conversations] Error fetching old conversations:', fetchError);
      throw fetchError;
    }

    if (!oldConversations || oldConversations.length === 0) {
      console.log('[cleanup-old-conversations] ✅ No old conversations to delete');
      return new Response(JSON.stringify({
        success: true,
        deletedConversations: 0,
        deletedThreads: 0,
        message: 'No old conversations found'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`[cleanup-old-conversations] Found ${oldConversations.length} conversations to delete`);

    // Estatísticas
    let deletedThreadsCount = 0;
    const conversationIds = oldConversations.map(c => c.id);
    const threadIds = oldConversations.filter(c => c.thread_id).map(c => c.thread_id);

    // 1️⃣ Deletar threads da OpenAI (se tiver API key)
    if (openaiApiKey && threadIds.length > 0) {
      console.log(`[cleanup-old-conversations] Deleting ${threadIds.length} OpenAI threads...`);
      
      for (const threadId of threadIds) {
        try {
          const deleteResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${openaiApiKey}`,
              'OpenAI-Beta': 'assistants=v2'
            }
          });

          if (deleteResponse.ok) {
            deletedThreadsCount++;
            console.log(`[cleanup-old-conversations] ✅ Deleted thread: ${threadId}`);
          } else {
            const errorData = await deleteResponse.json();
            console.warn(`[cleanup-old-conversations] ⚠️ Failed to delete thread ${threadId}:`, errorData);
          }
        } catch (error) {
          console.error(`[cleanup-old-conversations] Error deleting thread ${threadId}:`, error);
        }
      }
    }

    // 2️⃣ Deletar mensagens (CASCADE vai deletar automaticamente)
    // Mas vamos contar quantas eram antes
    const { count: messagesCount } = await supabase
      .from('ai_messages')
      .select('id', { count: 'exact', head: true })
      .in('conversation_id', conversationIds);

    console.log(`[cleanup-old-conversations] Will delete ${messagesCount || 0} messages (via CASCADE)`);

    // 3️⃣ Deletar conversas (vai deletar mensagens via CASCADE)
    const { error: deleteError } = await supabase
      .from('ai_conversations')
      .delete()
      .in('id', conversationIds);

    if (deleteError) {
      console.error('[cleanup-old-conversations] Error deleting conversations:', deleteError);
      throw deleteError;
    }

    const result = {
      success: true,
      deletedConversations: oldConversations.length,
      deletedMessages: messagesCount || 0,
      deletedThreads: deletedThreadsCount,
      cutoffDate: cutoffISO,
      retentionHours: RETENTION_HOURS,
      timestamp: new Date().toISOString()
    };

    console.log('[cleanup-old-conversations] 🎉 Cleanup completed successfully:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('[cleanup-old-conversations] ❌ Error:', {
      message: error?.message,
      stack: error?.stack,
      timestamp: new Date().toISOString()
    });

    return new Response(JSON.stringify({
      success: false,
      error: error?.message || 'Internal server error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
