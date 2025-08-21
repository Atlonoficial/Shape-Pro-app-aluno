import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Check, CheckCheck } from 'lucide-react';

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

interface MessageBubbleProps {
  message: ChatMessage;
  isOwn: boolean;
  showAvatar?: boolean;
}

export const MessageBubble = ({ 
  message, 
  isOwn, 
  showAvatar = true 
}: MessageBubbleProps) => {
  const formatTime = (dateString?: string) => {
    if (!dateString) return '';
    return format(new Date(dateString), 'HH:mm', { locale: ptBR });
  };

  const getStatusIcon = () => {
    if (!isOwn) return null;
    
    if (message.is_read) {
      return <CheckCheck size={14} className="text-primary" />;
    } else {
      return <Check size={14} className="text-muted-foreground" />;
    }
  };

  return (
    <div className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      {showAvatar && !isOwn && (
        <Avatar className="w-8 h-8 flex-shrink-0">
          <AvatarImage src="" />
          <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
            {message.sender_type === 'teacher' ? 'P' : 'A'}
          </AvatarFallback>
        </Avatar>
      )}
      
      {/* Spacer quando não há avatar */}
      {!showAvatar && !isOwn && <div className="w-8" />}

      {/* Mensagem */}
      <div className={`flex flex-col max-w-[80%] ${isOwn ? 'items-end' : 'items-start'}`}>
        <div
          className={`px-4 py-3 rounded-2xl ${
            isOwn
              ? 'bg-primary text-primary-foreground rounded-br-md'
              : 'bg-muted text-foreground rounded-bl-md'
          }`}
        >
          <p className="text-sm leading-relaxed break-words">
            {message.message}
          </p>
        </div>
        
        {/* Timestamp e status */}
        <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
          <span className="text-xs text-muted-foreground">
            {formatTime(message.created_at)}
          </span>
          {getStatusIcon()}
        </div>
      </div>
    </div>
  );
};