import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useConversation } from '@/hooks/useConversation';
import { useEnhancedPresence } from '@/hooks/useEnhancedPresence';
import { useChatNotifications } from '@/hooks/useChatNotifications';
import { useConnectionStatus } from '@/hooks/useConnectionStatus';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { MessageInput } from '@/components/chat/MessageInput';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { MobileContainer } from '@/components/layout/MobileContainer';
import { Loader2 } from 'lucide-react';

export default function Chat() {
  const { user, userProfile } = useAuth();
  const [isTyping, setIsTyping] = useState(false);
  
  // Inicializar notificações de chat
  useChatNotifications();
  
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
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <p className="text-destructive mb-2">Erro ao carregar chat</p>
            <p className="text-muted-foreground text-sm">{error}</p>
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
        
        <ChatInterface 
          messages={messages}
          currentUserId={user?.id}
          connectionStatus={connectionStatus}
          isReconnecting={reconnecting}
          onMessagesRead={markAsRead}
          onRetryMessage={retryMessage}
          onMessageVisible={markMessageAsRead}
        />
        
        <MessageInput 
          onSendMessage={handleSendMessage}
          onTyping={handleTyping}
          disabled={!conversation}
          connectionStatus={connectionStatus}
        />
      </div>
    </MobileContainer>
  );
}