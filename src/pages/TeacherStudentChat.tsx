import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useConversation } from '@/hooks/useConversation';
import { useEnhancedPresence } from '@/hooks/useEnhancedPresence';
import { useConnectionStatus } from '@/hooks/useConnectionStatus';
import { supabase } from '@/integrations/supabase/client';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { MessageInput } from '@/components/chat/MessageInput';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { MobileContainer } from '@/components/layout/MobileContainer';
import { BottomNavigation } from '@/components/layout/BottomNavigation';
import { Loader2 } from 'lucide-react';

export default function Chat() {
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();
  const [isTyping, setIsTyping] = useState(false);
  
  // Status de conexão
  const { status: globalConnectionStatus } = useConnectionStatus();
  
  const {
    conversation,
    messages,
    loading,
    error,
    reconnecting,
    connectionStatus,
    sendMessage,
    retryMessage,
    markAsRead,
    markMessageAsRead
  } = useConversation(user?.id);

  const {
    onlineUsers,
    typingUsers,
    sendTypingIndicator
  } = useEnhancedPresence(conversation?.id || '');

  useEffect(() => {
    if (conversation && messages.length > 0) {
      markAsRead();
    }
  }, [conversation, messages, markAsRead]);

  // Auto-delete chat notifications when entering conversation
  useEffect(() => {
    if (conversation?.id && user?.id) {
      const deleteNotifications = async () => {
        try {
          const { error } = await supabase.rpc('delete_chat_notifications', {
            p_user_id: user.id,
            p_conversation_id: conversation.id
          });
          
          if (error) {
            console.error('Erro ao deletar notificações:', error);
          }
        } catch (error) {
          console.error('Erro ao deletar notificações:', error);
        }
      };
      
      deleteNotifications();
    }
  }, [conversation?.id, user?.id]);

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;
    
    try {
      await sendMessage(content);
      setIsTyping(false);
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
    }
  };

  const handleTyping = (typing: boolean) => {
    setIsTyping(typing);
    if (conversation) {
      sendTypingIndicator(typing);
    }
  };

  const handleTabChange = (tab: string) => {
    navigate(`/?tab=${tab}`);
  };

  if (loading) {
    return (
      <MobileContainer>
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MobileContainer>
    );
  }

  if (error) {
    return (
      <MobileContainer>
        <div className="flex flex-col items-center justify-center h-screen p-6">
          <div className="text-center max-w-md">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-destructive/20 p-3">
                <Loader2 className="h-16 w-16 text-destructive" />
              </div>
            </div>
            
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Não foi possível carregar o chat
            </h2>
            
            <p className="text-muted-foreground mb-4">{error}</p>
            
            {error.includes('vinculado a um professor') && (
              <div className="bg-muted rounded-lg p-4 mt-4">
                <p className="text-sm text-muted-foreground">
                  💡 Para ter acesso ao chat com seu professor, é necessário que ele
                  te vincule como aluno através do Dashboard de Professores.
                </p>
              </div>
            )}
            
            <button
              onClick={() => navigate('/')}
              className="mt-6 px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Voltar para Início
            </button>
          </div>
        </div>
      </MobileContainer>
    );
  }

  return (
    <MobileContainer>
      <div className="flex flex-col h-screen">
        <ChatHeader 
          conversation={conversation}
          onlineUsers={onlineUsers}
          typingUsers={typingUsers}
          connectionStatus={connectionStatus}
          isReconnecting={reconnecting}
        />
        
        {/* Chat messages with padding for input + bottom nav */}
        <div className="flex-1 overflow-hidden pb-[168px]">
          <ChatInterface 
            messages={messages}
            currentUserId={user?.id}
            connectionStatus={connectionStatus}
            isReconnecting={reconnecting}
            onMessagesRead={markAsRead}
            onRetryMessage={retryMessage}
            onMessageVisible={markMessageAsRead}
          />
        </div>
        
        {/* Fixed input above bottom navigation */}
        <div className="fixed bottom-[72px] left-0 right-0 z-[var(--z-message-input)]">
          <MessageInput 
            onSendMessage={handleSendMessage}
            onTyping={handleTyping}
            disabled={!conversation}
            connectionStatus={connectionStatus}
          />
        </div>

        {/* Bottom Navigation fixed at bottom */}
        <BottomNavigation 
          activeTab="assistant" 
          onTabChange={handleTabChange} 
        />
      </div>
    </MobileContainer>
  );
}