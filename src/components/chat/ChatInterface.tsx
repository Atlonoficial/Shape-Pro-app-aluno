import { useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageBubble } from './MessageBubble';
import { ConnectionIndicator } from './ConnectionIndicator';
import { format, isToday, isYesterday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ConnectionStatus } from '@/hooks/useConnectionStatus';

interface ChatMessage {
  id: string;
  conversation_id?: string;
  sender_id?: string;
  message: string;
  message_type?: string;
  sender_type?: string;
  is_read?: boolean;
  read_at?: string;
  created_at?: string;
  reply_to?: string;
  attachments?: any;
  status?: 'sending' | 'sent' | 'failed';
  local_id?: string;
}

interface ChatInterfaceProps {
  messages: ChatMessage[];
  currentUserId?: string;
  connectionStatus: ConnectionStatus;
  isReconnecting?: boolean;
  onMessagesRead?: () => void;
  onRetryMessage?: (localId: string) => void;
}

export const ChatInterface = ({ 
  messages, 
  currentUserId,
  connectionStatus,
  isReconnecting = false,
  onMessagesRead,
  onRetryMessage
}: ChatInterfaceProps) => {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const lastMessageRef = useRef<HTMLDivElement>(null);

  // Auto scroll para nova mensagem
  useEffect(() => {
    if (lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Marcar como lidas quando visível
  useEffect(() => {
    const timer = setTimeout(() => {
      onMessagesRead?.();
    }, 1000);

    return () => clearTimeout(timer);
  }, [messages, onMessagesRead]);

  const formatMessageDate = (dateString: string) => {
    const date = new Date(dateString);
    
    if (isToday(date)) {
      return 'Hoje';
    } else if (isYesterday(date)) {
      return 'Ontem';
    } else {
      return format(date, 'dd/MM/yyyy', { locale: ptBR });
    }
  };

  const groupMessagesByDate = (messages: ChatMessage[]) => {
    const groups: { [key: string]: ChatMessage[] } = {};
    
    messages.forEach(message => {
      if (!message.created_at) return;
      
      const dateKey = format(new Date(message.created_at), 'yyyy-MM-dd');
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(message);
    });
    
    return groups;
  };

  const messageGroups = groupMessagesByDate(messages);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col">
        {/* Connection Status */}
        {connectionStatus !== 'connected' && (
          <div className="flex justify-center p-2 border-b border-border">
            <ConnectionIndicator 
              status={connectionStatus} 
              isReconnecting={isReconnecting}
            />
          </div>
        )}
        
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">💬</span>
            </div>
            <p className="text-muted-foreground">Nenhuma mensagem ainda</p>
            <p className="text-sm text-muted-foreground mt-1">
              Comece uma conversa!
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col relative">
      {/* Connection Status */}
      {connectionStatus !== 'connected' && (
        <div className="flex justify-center p-2 border-b border-border bg-muted/50">
          <ConnectionIndicator 
            status={connectionStatus} 
            isReconnecting={isReconnecting}
          />
        </div>
      )}
      
      <ScrollArea ref={scrollAreaRef} className="flex-1 px-4">
        <div className="space-y-4 py-4">
          {Object.entries(messageGroups).map(([dateKey, dayMessages]) => (
            <div key={dateKey}>
              {/* Separador de data */}
              <div className="flex items-center justify-center my-6">
                <div className="bg-muted px-3 py-1 rounded-full">
                  <span className="text-xs text-muted-foreground font-medium">
                    {formatMessageDate(dayMessages[0].created_at!)}
                  </span>
                </div>
              </div>
              
              {/* Mensagens do dia */}
              <div className="space-y-3">
                {dayMessages.map((message, index) => (
                  <MessageBubble
                    key={`${message.id}-${message.created_at}`}
                    message={message}
                    isOwn={message.sender_id === currentUserId}
                    showAvatar={
                      index === 0 || 
                      dayMessages[index - 1]?.sender_id !== message.sender_id
                    }
                    onRetry={onRetryMessage}
                  />
                ))}
              </div>
            </div>
          ))}
          
          {/* Referência para scroll automático */}
          <div ref={lastMessageRef} />
        </div>
      </ScrollArea>
    </div>
  );
};