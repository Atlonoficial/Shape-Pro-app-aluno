import { useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageBubble } from './MessageBubble';
import { format, isToday, isYesterday } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
}

interface ChatInterfaceProps {
  messages: ChatMessage[];
  currentUserId?: string;
  onMessagesRead?: () => void;
}

export const ChatInterface = ({ 
  messages, 
  currentUserId, 
  onMessagesRead 
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
    );
  }

  return (
    <div className="flex-1 relative">
      <ScrollArea ref={scrollAreaRef} className="h-full px-4">
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
                    key={message.id}
                    message={message}
                    isOwn={message.sender_id === currentUserId}
                    showAvatar={
                      index === 0 || 
                      dayMessages[index - 1]?.sender_id !== message.sender_id
                    }
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