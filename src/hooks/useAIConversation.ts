import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/components/auth/AuthProvider';

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: any;
}

export interface AIConversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export const useAIConversation = () => {
  const { user } = useAuthContext();
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [currentConversation, setCurrentConversation] = useState<AIConversation | null>(null);
  const [conversations, setConversations] = useState<AIConversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load conversations for the user
  const loadConversations = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('ai_conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      setConversations(data || []);
    } catch (err) {
      console.error('Error loading conversations:', err);
      setError(err instanceof Error ? err.message : 'Failed to load conversations');
    }
  };

  // Load messages for a specific conversation
  const loadMessages = async (conversationId: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('ai_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const formattedMessages: AIMessage[] = (data || []).map(msg => ({
        id: msg.id,
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
        timestamp: new Date(msg.created_at),
        metadata: msg.metadata
      }));

      setMessages(formattedMessages);
    } catch (err) {
      console.error('Error loading messages:', err);
      setError(err instanceof Error ? err.message : 'Failed to load messages');
    }
  };

  // Send message to AI assistant
  const sendMessage = async (message: string): Promise<string> => {
    if (!user) throw new Error('Usuário não autenticado');

    setLoading(true);
    setError(null);

    try {
      // Verificar sessão ANTES de enviar
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !sessionData?.session) {
        console.error('[Coach IA] 🔐 Session error:', sessionError);
        throw new Error('🔐 Sessão expirada. Faça login novamente.');
      }

      console.log('[Coach IA] ✅ Session valid:', {
        userId: sessionData.session.user.id,
        expiresAt: sessionData.session.expires_at ? new Date(sessionData.session.expires_at * 1000).toISOString() : 'unknown'
      });

      // Add user message immediately to UI
      const userMessage: AIMessage = {
        id: `temp-${Date.now()}`,
        role: 'user',
        content: message,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, userMessage]);

      // Call AI assistant edge function with 45s timeout
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('TIMEOUT')), 45000)
      );

      console.log('[Coach IA] 🔍 Pre-flight checks:', {
        supabaseUrl: (supabase as any).supabaseUrl,
        hasAuth: !!supabase.auth,
        userId: user.id,
        messageLength: message.length,
        conversationId: currentConversation?.id,
        timestamp: new Date().toISOString()
      });

      let invokePromise;
      try {
        invokePromise = supabase.functions.invoke('ai-assistant', {
          body: {
            message,
            conversationId: currentConversation?.id
          },
          headers: {
            Authorization: `Bearer ${sessionData.session.access_token}`
          }
        });
        
        console.log('[Coach IA] 📤 Request sent successfully');
      } catch (invokeError: any) {
        console.error('[Coach IA] 🔥 Invoke failed immediately:', {
          error: invokeError,
          message: invokeError?.message,
          stack: invokeError?.stack
        });
        throw invokeError;
      }

      const { data, error } = await Promise.race([invokePromise, timeoutPromise]) as any;

      console.log('[Coach IA] 📥 Response received:', {
        hasData: !!data,
        hasError: !!error,
        errorStatus: error?.status,
        errorMessage: error?.message,
        dataKeys: data ? Object.keys(data) : [],
        timestamp: new Date().toISOString()
      });

      if (error) {
        const errorMsg = error.message || '';
        const errorStatus = error.status;
        
        console.error('[Coach IA] ❌ Error details:', {
          message: errorMsg,
          status: errorStatus,
          fullError: JSON.stringify(error, null, 2)
        });
        
        // Se erro 401, tentar refresh e retry UMA VEZ
        if (errorMsg.includes('401') || errorMsg.includes('Unauthorized') || errorStatus === 401) {
          console.log('[Coach IA] 🔄 Attempting token refresh...');
          
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
          
          if (refreshError || !refreshData?.session) {
            console.error('[Coach IA] ❌ Refresh failed:', refreshError);
            throw new Error('🔐 Sessão expirada. Faça login novamente.');
          }
          
          console.log('[Coach IA] ✅ Token refreshed, retrying...');
          
          // RETRY com novo token
          const retryResult = await supabase.functions.invoke('ai-assistant', {
            body: { message, conversationId: currentConversation?.id },
            headers: {
              Authorization: `Bearer ${refreshData.session.access_token}`
            }
          });
          
          if (retryResult.error) {
            console.error('[Coach IA] ❌ Retry failed:', retryResult.error);
            throw new Error(`❌ ${retryResult.error.message || 'Falha após refresh do token'}`);
          }
          
          // Usar resultado do retry e continuar o fluxo normal
          console.log('[Coach IA] ✅ Retry successful!');
          const retryData = retryResult.data;
          
          if (!retryData?.response) {
            throw new Error('📭 Resposta vazia do assistente. Tente novamente.');
          }
          
          const response = retryData.response;
          const conversationId = retryData.conversationId;

          // If this is a new conversation, update current conversation
          if (!currentConversation) {
            const { data: newConversation } = await supabase
              .from('ai_conversations')
              .select('*')
              .eq('id', conversationId)
              .single();

            if (newConversation) {
              setCurrentConversation(newConversation);
            }
          }

          // Add assistant response to UI
          const assistantMessage: AIMessage = {
            id: `ai-${Date.now()}`,
            role: 'assistant',
            content: response,
            timestamp: new Date()
          };

          // Remove temp user message and add both real messages
          setMessages(prev => {
            const withoutTemp = prev.filter(msg => msg.id !== userMessage.id);
            return [...withoutTemp, userMessage, assistantMessage];
          });

          // Reload conversations to update the list
          loadConversations();

          return response;
        }
        
        // Resto dos erros específicos
        if (errorMsg === 'TIMEOUT') {
          throw new Error('⏱️ Resposta demorando muito. Tente uma pergunta mais simples.');
        }
        
        if (errorMsg.includes('Missing required environment variables') || 
            errorMsg.includes('OPENAI_API_KEY') || 
            errorMsg.includes('OPENAI_ASSISTANT_ID')) {
          throw new Error('🔧 Coach IA não configurado. Configure as credenciais OpenAI no Supabase.');
        }
        
        if (errorMsg.includes('429') || errorStatus === 429) {
          throw new Error('⏰ Você atingiu o limite diário de 3 perguntas. Volte amanhã às 00h! 💪');
        }
        
        if (errorMsg.includes('403') || errorStatus === 403) {
          throw new Error('🚫 Sem permissão para acessar Coach IA.');
        }
        
        if (errorMsg.includes('network') || errorMsg.includes('fetch') || errorMsg.includes('Failed to fetch')) {
          throw new Error('📡 Erro de conexão. Verifique sua internet.');
        }
        
        if (errorStatus === 500) {
          throw new Error('⚙️ Erro interno do servidor. Tente novamente em alguns instantes.');
        }
        
        // Incluir erro original na mensagem para debug
        throw new Error(`❌ ${errorMsg || 'Não foi possível conectar ao Coach IA. Tente novamente.'}`);
      }

      if (!data?.response) {
        console.error('[Coach IA] ❌ Empty response from assistant');
        throw new Error('📭 Resposta vazia do assistente. Tente novamente.');
      }

      console.log('[Coach IA] ✅ Success! Response received:', {
        responseLength: data.response.length,
        conversationId: data.conversationId,
        threadId: data.threadId
      });

      const response = data.response;
      const conversationId = data.conversationId;

      // If this is a new conversation, update current conversation
      if (!currentConversation) {
        const { data: newConversation } = await supabase
          .from('ai_conversations')
          .select('*')
          .eq('id', conversationId)
          .single();

        if (newConversation) {
          setCurrentConversation(newConversation);
        }
      }

      // Add assistant response to UI
      const assistantMessage: AIMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };

      // Remove temp user message and add both real messages
      setMessages(prev => {
        const withoutTemp = prev.filter(msg => msg.id !== userMessage.id);
        return [...withoutTemp, userMessage, assistantMessage];
      });

      // Reload conversations to update the list
      loadConversations();

      return response;

    } catch (err) {
      console.error('Error sending message:', err);
      const errorMessage = err instanceof Error ? err.message : 'Falha ao enviar mensagem. Tente novamente.';
      setError(errorMessage);
      
      // Remove temp user message on error
      setMessages(prev => prev.filter(msg => !msg.id.startsWith('temp-')));
      
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Start new conversation
  const startNewConversation = () => {
    setCurrentConversation(null);
    setMessages([]);
    setError(null);
  };

  // Load specific conversation
  const loadConversation = async (conversationId: string) => {
    const conversation = conversations.find(c => c.id === conversationId);
    if (conversation) {
      setCurrentConversation(conversation);
      await loadMessages(conversationId);
    }
  };

  // Initialize on user change
  useEffect(() => {
    if (user) {
      loadConversations();
    } else {
      setConversations([]);
      setMessages([]);
      setCurrentConversation(null);
    }
  }, [user]);

  return {
    messages,
    conversations,
    currentConversation,
    loading,
    error,
    sendMessage,
    startNewConversation,
    loadConversation,
    loadConversations
  };
};