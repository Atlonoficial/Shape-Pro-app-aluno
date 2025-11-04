import { useState, useEffect } from 'react';
import { supabase, SUPABASE_KEY } from '@/integrations/supabase/client';
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

  // Debug: Log error state changes
  useEffect(() => {
    if (error) {
      console.log('[useAIConversation] ⚠️ Error state set:', error);
      console.log('[useAIConversation] 📅 Current date:', new Date().toISOString());
      console.log('[useAIConversation] 👤 User ID:', user?.id);
    } else {
      console.log('[useAIConversation] ✅ Error state cleared');
    }
  }, [error, user]);

  // Check daily limit status directly from database
  const checkDailyLimitStatus = async (): Promise<boolean> => {
    if (!user) return false;

    try {
      console.log('[useAIConversation] 🔍 Checking daily limit status for user:', user.id);
      
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      
      const { data, error: queryError } = await supabase
        .from('ai_usage_stats')
        .select('daily_count')
        .eq('user_id', user.id)
        .eq('usage_date', today)
        .maybeSingle();

      if (queryError) {
        console.error('[useAIConversation] ❌ Error checking daily limit:', queryError);
        return false;
      }

      const dailyCount = data?.daily_count || 0;
      const DAILY_LIMIT = 3;
      const limitReached = dailyCount >= DAILY_LIMIT;

      console.log('[useAIConversation] 📊 Daily limit status:', {
        userId: user.id,
        date: today,
        dailyCount,
        limit: DAILY_LIMIT,
        limitReached
      });

      return limitReached;
    } catch (err) {
      console.error('[useAIConversation] ❌ Exception checking daily limit:', err);
      return false;
    }
  };

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
    if (!user) throw new Error('User not authenticated');

    // Check if there's already a daily limit error - prevent sending
    if (error && error.toLowerCase().includes('limite') && 
        (error.toLowerCase().includes('diário') || error.toLowerCase().includes('dia'))) {
      console.log('[useAIConversation] 🚫 Daily limit already reached, blocking send');
      throw new Error(error); // Re-throw the existing error
    }

    setLoading(true);
    setError(null); // Clear error only if we're actually attempting to send

    // Add user message immediately to UI
    const userMessage: AIMessage = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);

    try {
      // Verify authentication before calling edge function
      console.log('[useAIConversation] Sending message to AI assistant:', {
        message,
        conversationId: currentConversation?.id,
        userId: user?.id
      });

      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        throw new Error('Sessão expirada. Faça login novamente.');
      }

      console.log('[useAIConversation] Session verified, calling edge function');
      console.log('[useAIConversation] Edge function configuration:', {
        functionUrl: 'https://bqbopkqzkavhmenjlhab.supabase.co/functions/v1/ai-assistant',
        hasSession: !!sessionData.session,
        tokenPrefix: sessionData.session.access_token.substring(0, 20),
        messageLength: message.length,
        hasConversation: !!currentConversation?.id,
        conversationId: currentConversation?.id,
        userId: user.id
      });

      // Retry logic: 3 attempts with exponential backoff
      const maxRetries = 3;
      let lastError: Error | null = null;
      let responseData: any = null;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`[useAIConversation] 🔄 Attempt ${attempt}/${maxRetries}`);
          
          const controller = new AbortController();
          const timeoutId = setTimeout(() => {
            console.log(`[useAIConversation] ⏱️ Timeout after 45s`);
            controller.abort();
          }, 45000); // 45s timeout
          
          // Use fetch directly to avoid SDK bugs
          const httpResponse = await fetch(
            'https://bqbopkqzkavhmenjlhab.supabase.co/functions/v1/ai-assistant',
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${sessionData.session.access_token}`,
                'Content-Type': 'application/json',
                'apikey': SUPABASE_KEY,
              },
              body: JSON.stringify({
                message,
                conversationId: currentConversation?.id
              }),
              signal: controller.signal
            }
          );
          
          clearTimeout(timeoutId);
          
          console.log(`[useAIConversation] 📥 Response status:`, httpResponse.status);
          
          if (!httpResponse.ok) {
            const errorText = await httpResponse.text();
            console.error(`[useAIConversation] ❌ Response error:`, errorText);
            
            // Parse error response to check for specific error types
            let errorData: any = null;
            try {
              errorData = JSON.parse(errorText);
            } catch {
              // Not JSON, treat as plain text error
            }
            
            // Check if it's a daily limit error - don't retry these
            if (httpResponse.status === 429 && errorData?.type === 'daily_limit_exceeded') {
              const limitError = new Error(errorData.error || 'Limite diário atingido');
              console.warn(`[useAIConversation] 🚫 Daily limit reached, not retrying`);
              throw limitError;
            }
            
            throw new Error(`Edge Function returned ${httpResponse.status}: ${errorText}`);
          }
          
          responseData = await httpResponse.json();
          console.log(`[useAIConversation] ✅ Attempt ${attempt} succeeded`);
          break; // Success, exit retry loop
          
        } catch (err: any) {
          lastError = err;
          console.error(`[useAIConversation] ❌ Attempt ${attempt} threw exception:`, {
            message: err.message,
            name: err.name
          });
          
          // Don't retry if it's a daily limit error
          if (err.message.includes('Limite diário') || err.message.includes('limite de')) {
            throw err;
          }
          
          // Retry for other errors
          if (attempt < maxRetries) {
            const backoffTime = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
            console.log(`[useAIConversation] 💤 Waiting ${backoffTime}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, backoffTime));
          }
        }
      }

      if (!responseData) {
        const finalError = lastError || new Error('Failed after all retries');
        console.error('[useAIConversation] 🚫 All attempts failed:', finalError);
        throw finalError;
      }

      console.log('[useAIConversation] Edge function response:', {
        hasResponse: !!responseData.response,
        hasConversationId: !!responseData.conversationId,
        responseLength: responseData.response?.length || 0,
        usage: responseData.usage
      });

      const response = responseData.response;
      const conversationId = responseData.conversationId;

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

      // Clear error on success
      setError(null);
      
      // Reload conversations to update the list
      loadConversations();

      return response;

    } catch (err) {
      console.error('Error sending message:', err);
      
      let errorMessage = 'Falha ao enviar mensagem';
      
      if (err instanceof Error) {
        const msg = err.message.toLowerCase();
        
        // Check for daily limit error first (most specific)
        if (msg.includes('limite diário') || msg.includes('limite de') || msg.includes('perguntas por dia')) {
          errorMessage = err.message; // Use the exact message from backend
        } else if (msg.includes('missing required environment variables') || msg.includes('openai')) {
          errorMessage = 'Configuração do assistente pendente. Contate o suporte.';
        } else if (msg.includes('rate limit') || msg.includes('429')) {
          errorMessage = 'Muitas requisições. Aguarde 1 minuto e tente novamente.';
        } else if (msg.includes('unauthorized') || msg.includes('401')) {
          errorMessage = 'Sessão expirada. Faça login novamente.';
        } else if (msg.includes('network') || msg.includes('fetch')) {
          errorMessage = 'Erro de conexão. Verifique sua internet.';
        } else if (msg.includes('timeout')) {
          errorMessage = 'Tempo de resposta excedido. Tente novamente.';
        } else {
          errorMessage = err.message;
        }
      }
      
        console.log('[useAIConversation] 🔴 Setting error state:', errorMessage);
        setError(errorMessage);
        
        // Save timestamp for daily limit errors (user-specific)
        if (user && errorMessage.toLowerCase().includes('limite') && 
            (errorMessage.toLowerCase().includes('diário') || errorMessage.toLowerCase().includes('dia'))) {
          const storageKey = `ai_error_timestamp_${user.id}`;
          localStorage.setItem(storageKey, new Date().toISOString());
          console.log('[useAIConversation] 💾 Saved error timestamp for user:', user.id);
        }
      
      // Remove temp user message on error
      setMessages(prev => prev.filter(msg => msg.id !== userMessage.id));
      
      console.log('[useAIConversation] 🔴 Error state should be set now');
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

  // Verify daily limit status when user changes or component mounts
  useEffect(() => {
    const verifyDailyLimit = async () => {
      if (!user) return;

      console.log('[useAIConversation] 🔍 Verifying daily limit for user:', user.id);
      
      const limitReached = await checkDailyLimitStatus();
      
      if (limitReached) {
        const errorMsg = 'Você atingiu o limite diário de 3 perguntas. Tente novamente amanhã às 00:00.';
        console.log('[useAIConversation] 🚫 Daily limit reached on mount, setting error');
        setError(errorMsg);
        
        // Save timestamp
        const storageKey = `ai_error_timestamp_${user.id}`;
        localStorage.setItem(storageKey, new Date().toISOString());
      } else {
        console.log('[useAIConversation] ✅ Daily limit OK, clearing error');
        setError(null);
        
        // Clear timestamp
        const storageKey = `ai_error_timestamp_${user.id}`;
        localStorage.removeItem(storageKey);
      }
    };

    if (user) {
      loadConversations();
      verifyDailyLimit();
      console.log('[useAIConversation] 🔄 User logged in - verifying daily limit');
    } else {
      setConversations([]);
      setMessages([]);
      setCurrentConversation(null);
      setError(null);
      console.log('[useAIConversation] 🚪 User logged out - cleared state');
    }
  }, [user]);

  // Reset daily limit at midnight by re-checking database
  useEffect(() => {
    if (!user) return;

    const checkDailyReset = () => {
      const now = new Date();
      const nextMidnight = new Date(now);
      nextMidnight.setHours(24, 0, 0, 0);
      
      const timeUntilMidnight = nextMidnight.getTime() - now.getTime();
      
      console.log('[useAIConversation] ⏰ Scheduled midnight reset in', Math.round(timeUntilMidnight / 1000 / 60), 'minutes');
      
      const timeoutId = setTimeout(async () => {
        console.log('[useAIConversation] 🕐 Midnight reached - re-checking daily limit from database');
        
        // Log cleanup details
        console.log('[useAIConversation] 🕐 Midnight reset executed:', {
          userId: user.id,
          messagesCleared: messages.length,
          conversationCleared: !!currentConversation,
          timestamp: new Date().toISOString()
        });
        
        // Clear messages and conversation for new day
        console.log('[useAIConversation] 🧹 Clearing messages for new day');
        setMessages([]);
        setCurrentConversation(null);
        console.log('[useAIConversation] ✨ New day started - UI reset');
        
        const limitReached = await checkDailyLimitStatus();
        
        if (!limitReached) {
          console.log('[useAIConversation] ✅ Daily limit reset - clearing error');
          setError(null);
          
          // Clear user-specific timestamp
          const storageKey = `ai_error_timestamp_${user.id}`;
          localStorage.removeItem(storageKey);
        } else {
          console.log('[useAIConversation] ⚠️ Daily limit still reached after midnight check');
        }
        
        // Schedule next check
        checkDailyReset();
      }, timeUntilMidnight);
      
      return timeoutId;
    };
    
    const timeoutId = checkDailyReset();
    
    return () => {
      clearTimeout(timeoutId);
    };
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