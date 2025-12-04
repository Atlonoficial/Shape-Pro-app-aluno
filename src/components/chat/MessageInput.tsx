import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Paperclip } from 'lucide-react';

interface MessageInputProps {
  onSendMessage: (content: string) => void;
  onTyping?: (isTyping: boolean) => void;
  disabled?: boolean;
  connectionStatus?: 'connected' | 'connecting' | 'disconnected';
  keyboardVisible?: boolean;
}

export const MessageInput = ({
  onSendMessage,
  onTyping,
  disabled = false,
  connectionStatus = 'connected',
  keyboardVisible = false
}: MessageInputProps) => {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  const handleSend = () => {
    if (!message.trim() || disabled || connectionStatus === 'disconnected') return;

    onSendMessage(message.trim());
    setMessage('');
    handleTypingStop();

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTypingStart = () => {
    if (!isTyping) {
      setIsTyping(true);
      onTyping?.(true);
    }

    // Reset timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      handleTypingStop();
    }, 3000);
  };

  const handleTypingStop = () => {
    if (isTyping) {
      setIsTyping(false);
      onTyping?.(false);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);

    if (e.target.value.trim()) {
      handleTypingStart();
    } else {
      handleTypingStop();
    }

    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  };

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className={`border-t border-border bg-background/95 backdrop-blur-xl p-3 transition-all duration-300 ease-out ${keyboardVisible ? 'pb-3' : 'pb-[calc(env(safe-area-inset-bottom)+12px)]'}`}>
      <div className="flex items-end gap-2 max-w-4xl mx-auto">
        {/* Botão de anexo (futuro) */}
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground flex-shrink-0 h-10 w-10 rounded-full hover:bg-muted/50 transition-colors"
          disabled={disabled}
        >
          <Paperclip size={20} />
        </Button>

        {/* Input de mensagem */}
        <div className="flex-1 relative bg-muted/30 rounded-3xl border border-border/50 focus-within:border-primary/50 focus-within:bg-muted/50 focus-within:ring-1 focus-within:ring-primary/20 transition-all duration-200">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={handleChange}
            onKeyPress={handleKeyPress}
            placeholder={
              disabled
                ? "Conectando..."
                : connectionStatus === 'disconnected'
                  ? "Sem conexão..."
                  : connectionStatus === 'connecting'
                    ? "Reconectando..."
                    : "Digite sua mensagem..."
            }
            disabled={disabled || connectionStatus === 'disconnected'}
            className="min-h-[44px] max-h-[120px] resize-none pr-4 py-3 border-0 bg-transparent focus-visible:ring-0 shadow-none text-base placeholder:text-muted-foreground/70"
            rows={1}
          />
        </div>

        {/* Botão de envio */}
        <Button
          onClick={handleSend}
          disabled={!message.trim() || disabled || connectionStatus === 'disconnected'}
          size="icon"
          className={`h-10 w-10 rounded-full flex-shrink-0 transition-all duration-300 ${message.trim()
            ? 'bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 hover:scale-105'
            : 'bg-muted text-muted-foreground'
            }`}
        >
          <Send size={18} className={message.trim() ? 'ml-0.5' : ''} />
        </Button>
      </div>
    </div>
  );
};
