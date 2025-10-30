import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Check, CheckCheck, Clock, AlertCircle, RotateCcw } from 'lucide-react';
import { useEffect, useRef } from 'react';

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
  delivered_at?: string;
}

interface MessageBubbleProps {
  message: ChatMessage;
  isOwn: boolean;
  showAvatar?: boolean;
  onRetry?: (localId: string) => void;
  onVisible?: (messageId: string) => void;
}

export const MessageBubble = ({ 
  message, 
  isOwn, 
  showAvatar = true,
  onRetry,
  onVisible
}: MessageBubbleProps) => {
  const formatTime = (dateString?: string) => {
    if (!dateString) return '';
    return format(new Date(dateString), 'HH:mm', { locale: ptBR });
  };

  const getStatusIcon = () => {
    if (!isOwn) return null;
    
    // Verificar status da mensagem primeiro
    switch (message.status) {
      case 'sending':
        return <Clock size={14} className="text-muted-foreground animate-pulse" />;
      case 'failed':
        return <AlertCircle size={14} className="text-destructive" />;
      case 'sent':
      default:
        // Sistema de status estilo WhatsApp
        if (message.is_read && message.read_at) {
          // ✓✓ azul - Lida
          return <CheckCheck size={14} className="text-primary" />;
        } else if (message.delivered_at) {
          // ✓✓ cinza - Entregue
          return <CheckCheck size={14} className="text-muted-foreground" />;
        } else if (message.created_at) {
          // ✓ cinza - Enviada
          return <Check size={14} className="text-muted-foreground" />;
        } else {
          // Enviando
          return <Clock size={14} className="text-muted-foreground animate-pulse" />;
        }
    }
  };

  const getMessageStyle = () => {
    const baseStyle = `px-4 py-3 rounded-2xl ${
      isOwn
        ? 'bg-primary text-primary-foreground rounded-br-md'
        : 'bg-muted text-foreground rounded-bl-md'
    }`;

    // Adicionar estilo para mensagens falhadas
    if (message.status === 'failed') {
      return `${baseStyle} border-2 border-destructive/20`;
    }

    return baseStyle;
  };

  const messageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Marcar mensagem como visível quando renderizada (não é própria e não foi lida)
    if (!isOwn && !message.is_read && onVisible && messageRef.current) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              onVisible(message.id);
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.5 }
      );
      
      observer.observe(messageRef.current);
      
      return () => observer.disconnect();
    }
  }, [isOwn, message.is_read, message.id, onVisible]);

  return (
    <div ref={messageRef} className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
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
        <div className={getMessageStyle()}>
          <p className="text-sm leading-relaxed break-words">
            {message.message}
          </p>
          
          {/* Botão de retry para mensagens falhadas */}
          {message.status === 'failed' && isOwn && onRetry && (
            <div className="mt-2 pt-2 border-t border-primary-foreground/20">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRetry(message.local_id || message.id)}
                className="h-auto p-1 text-xs text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10"
              >
                <RotateCcw size={12} className="mr-1" />
                Tentar novamente
              </Button>
            </div>
          )}
        </div>
        
        {/* Timestamp e status */}
        <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
          <span className="text-xs text-muted-foreground">
            {formatTime(message.created_at)}
          </span>
          {getStatusIcon()}
          
          {/* Indicador de mensagem falhada */}
          {message.status === 'failed' && (
            <span className="text-xs text-destructive font-medium">
              Falha no envio
            </span>
          )}
        </div>
      </div>
    </div>
  );
};