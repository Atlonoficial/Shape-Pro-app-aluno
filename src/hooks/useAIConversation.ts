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

      const invokePromise = supabase.functions.invoke('ai-assistant', {
        body: {
          message,
          conversationId: currentConversation?.id
        }
      });

      const { data, error } = await Promise.race([invokePromise, timeoutPromise]) as any;

      if (error) {
        // Handle specific error types with user-friendly messages
        const errorMsg = error.message || '';
        
        if (errorMsg === 'TIMEOUT') {
          throw new Error('A resposta está demorando muito. Tente uma pergunta mais simples ou aguarde alguns segundos.');
        }
        if (errorMsg.includes('Missing required environment variables') || 
            errorMsg.includes('OPENAI_API_KEY') || 
            errorMsg.includes('OPENAI_ASSISTANT_ID')) {
          throw new Error('Coach IA não configurado. Contate o suporte para ativar.');
        }
        if (errorMsg.includes('429') || error.status === 429) {
          throw new Error('Você atingiu o limite diário de 3 perguntas. Volte amanhã às 00h! 💪');
        }
        if (errorMsg.includes('401') || errorMsg.includes('Unauthorized') || error.status === 401) {
          throw new Error('Sessão expirada. Faça login novamente.');
        }
        if (errorMsg.includes('network') || errorMsg.includes('fetch') || errorMsg.includes('Failed to fetch')) {
          throw new Error('Erro de conexão. Verifique sua internet e tente novamente.');
        }
        if (error.status === 500) {
          throw new Error('Erro no servidor. Tente novamente em alguns instantes.');
        }
        
        throw new Error('Não foi possível conectar ao Coach IA. Tente novamente.');
      }

      if (!data?.response) {
        throw new Error('Resposta inválida do assistente. Tente novamente.');
      }

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