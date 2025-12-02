import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useConversation } from '@/hooks/useConversation';
import { useEnhancedPresence } from '@/hooks/useEnhancedPresence';
import { useConnectionStatus } from '@/hooks/useConnectionStatus';
import { useKeyboardState } from '@/hooks/useKeyboardState';
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
  const { isVisible: keyboardVisible, height: keyboardHeight } = useKeyboardState();

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

  const [blockedUsers, setBlockedUsers] = useState<Set<string>>(new Set());

  // Fetch blocked users
  useEffect(() => {
    const fetchBlockedUsers = async () => {
      if (!user?.id) return;
      try {
        const { data, error } = await supabase
          .from('blocked_users')
          .select('blocked_id')
          .eq('blocker_id', user.id);

        if (data && !error) {
          setBlockedUsers(new Set(data.map(b => b.blocked_id)));
        }
      } catch (error) {
        console.error('Error fetching blocked users:', error);
      }
    };

    fetchBlockedUsers();
  }, [user?.id]);

  // Filter messages from blocked users
  const filteredMessages = messages.filter(msg => !msg.sender_id || !blockedUsers.has(msg.sender_id));

  useEffect(() => {
    if (conversation && messages.length > 0) {
      markAsRead();
    }
  }, [conversation, messages, markAsRead]);

  // Auto-delete chat notifications and cleanup old messages when entering conversation
  useEffect(() => {
    if (conversation?.id && user?.id) {
      const performCleanup = async () => {
        try {
          // Clear notifications
          await supabase.rpc('delete_chat_notifications', {
            p_user_id: user.id,
            p_conversation_id: conversation.id
          });

          // Cleanup old messages (older than 7 days)
          // We call this here to ensure the chat is clean when opened
          await supabase.rpc('cleanup_old_messages' as any);

        } catch (error) {
          console.error('Erro na limpeza do chat:', error);
        }
      };

      performCleanup();
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

  // Ref for auto-scrolling
  const chatMessagesContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (chatMessagesContainerRef.current) {
      chatMessagesContainerRef.current.scrollTop = chatMessagesContainerRef.current.scrollHeight;
    }
  };

  // Auto-scroll when keyboard opens
  useEffect(() => {
    if (keyboardVisible) {
      // Small delay to allow layout to resize
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    }
  }, [keyboardVisible]);

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
    <MobileContainer className="!h-[100dvh] bg-background" withBottomPadding={false}>
      <div className="flex flex-col h-full w-full relative">
        <ChatHeader
          conversation={conversation}
          onlineUsers={onlineUsers}
          typingUsers={typingUsers}
          connectionStatus={connectionStatus}
          isReconnecting={reconnecting}
        />

        {/* Chat messages - Flex 1 to take available space */}
        <div className="flex-1 overflow-hidden relative w-full">
          <div className="absolute inset-0 overflow-y-auto pb-safe" id="chat-messages-container" ref={chatMessagesContainerRef}>
            <ChatInterface
              messages={filteredMessages}
              currentUserId={user?.id}
              connectionStatus={connectionStatus}
              isReconnecting={reconnecting}
              onMessagesRead={markAsRead}
              onRetryMessage={retryMessage}
              onMessageVisible={markMessageAsRead}
            />
          </div>
        </div>

        {/* Input at bottom - Natural flow, no fixed positioning needed with flex col */}
        <div className="w-full z-[var(--z-message-input)] transition-all duration-300 ease-out">
          <MessageInput
            onSendMessage={handleSendMessage}
            onTyping={handleTyping}
            disabled={!conversation}
            connectionStatus={connectionStatus}
            keyboardVisible={keyboardVisible}
          />
        </div>
      </div>
    </MobileContainer>
  );
}