import { useState, useRef, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useChat } from '@/hooks/useChat';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { 
  Send, 
  ArrowLeft, 
  MessageCircle,
  User,
  GraduationCap
} from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Chat entre Aluno e Professor
 * 
 * CONEXÃO COM DASHBOARD DO PROFESSOR:
 * - Mesmo conversation_id usado em ambos os apps
 * - Mensagens sincronizadas em tempo real via onSnapshot
 * - Professor vê quando aluno está online/digitando
 * - Push notifications bidirecionais
 */

export default function AlunoChat() {
  const { id: conversationId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { messages, loading, error, sendMessage } = useChat(conversationId);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Auto-scroll para última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Exibir erros
  useEffect(() => {
    if (error) {
      toast({
        title: "Erro no chat",
        description: error,
        variant: "destructive"
      });
    }
  }, [error, toast]);

  // Enviar mensagem
  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      await sendMessage(newMessage.trim());
      setNewMessage('');
    } catch (err) {
      toast({
        title: "Erro ao enviar",
        description: "Não foi possível enviar a mensagem. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  // Enviar com Enter
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Formatar horário da mensagem
  const formatMessageTime = (timestamp: any) => {
    if (!timestamp) return '';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    
    if (isToday(date)) {
      return format(date, 'HH:mm', { locale: ptBR });
    } else if (isYesterday(date)) {
      return `Ontem ${format(date, 'HH:mm', { locale: ptBR })}`;
    } else {
      return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    }
  };

  if (loading) {
    return <ChatSkeleton />;
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header do chat */}
      <Card className="rounded-none border-l-0 border-r-0 border-t-0">
        <CardHeader className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button asChild variant="ghost" size="sm">
                <Link to="/aluno/dashboard">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <div className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                <div>
                  <CardTitle className="text-lg">Professor</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Chat individual
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Área de mensagens */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <MessageCircle className="h-16 w-16 text-muted-foreground opacity-50 mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhuma mensagem ainda</h3>
            <p className="text-muted-foreground">
              Inicie uma conversa com seu professor!
            </p>
          </div>
        ) : (
          messages.map((message) => {
            const isMyMessage = message.sender_id === user?.uid;
            
            return (
              <div
                key={message.id}
                className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    isMyMessage
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  {/* Remetente */}
                  <div className="flex items-center gap-1 mb-1">
                    {isMyMessage ? (
                      <User className="h-3 w-3" />
                    ) : (
                      <GraduationCap className="h-3 w-3" />
                    )}
                    <span className="text-xs opacity-75">
                      {isMyMessage ? 'Você' : 'Professor'}
                    </span>
                  </div>
                  
                  {/* Conteúdo */}
                  <p className="text-sm break-words">{message.content}</p>
                  
                  {/* Horário */}
                  <p className="text-xs opacity-75 mt-1">
                    {formatMessageTime(message.created_at)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input de nova mensagem */}
      <Card className="rounded-none border-l-0 border-r-0 border-b-0">
        <CardContent className="p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex gap-2"
          >
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Digite sua mensagem..."
              disabled={sending}
              className="flex-1"
            />
            <Button 
              type="submit" 
              disabled={!newMessage.trim() || sending}
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// Skeleton do chat
function ChatSkeleton() {
  return (
    <div className="flex flex-col h-screen">
      <Card className="rounded-none border-l-0 border-r-0 border-t-0">
        <CardHeader className="py-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-8" />
            <div>
              <Skeleton className="h-6 w-24 mb-1" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="flex-1 p-4 space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}
          >
            <Skeleton className="h-16 w-48 rounded-lg" />
          </div>
        ))}
      </div>

      <Card className="rounded-none border-l-0 border-r-0 border-b-0">
        <CardContent className="p-4">
          <div className="flex gap-2">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-10" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}