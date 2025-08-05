import { useState, useEffect, useRef } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useChat } from '@/hooks/useChat';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Send, 
  ArrowLeft, 
  Phone, 
  Video, 
  MoreVertical,
  Clock,
  Check,
  CheckCheck
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, isToday, isYesterday } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Página de Chat Individual do Aluno
 * 
 * FUNCIONALIDADES:
 * - Chat em tempo real usando useChat()
 * - Interface similar ao WhatsApp
 * - Envio de mensagens com Enter ou botão
 * - Auto-scroll para mensagens novas
 * - Indicadores de status de mensagem
 * 
 * ROTEAMENTO:
 * - Adicionar em App.tsx: <Route path="/aluno/chat/:id" element={<AlunoChat />} />
 * - Usar como: /aluno/chat/conversation_123
 * - Proteger com AuthGuard
 */

export default function AlunoChat() {
  const { id: conversationId } = useParams<{ id: string }>();
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const { messages, loading, sendMessage, error } = useChat(conversationId);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Redirecionar se não autenticado
  if (authLoading) {
    return <ChatSkeleton />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!conversationId) {
    return <Navigate to="/aluno/dashboard" replace />;
  }

  // Auto-scroll para última mensagem
  useEffect(() => {
    if (messagesEndRef.current && messages.length > 0) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Mostrar erro se houver
  useEffect(() => {
    if (error) {
      toast({
        title: "Erro no chat",
        description: error,
        variant: "destructive"
      });
    }
  }, [error]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!newMessage.trim() || sending) return;

    try {
      setSending(true);
      await sendMessage(newMessage);
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatMessageTime = (timestamp: Date) => {
    if (isToday(timestamp)) {
      return format(timestamp, 'HH:mm');
    } else if (isYesterday(timestamp)) {
      return 'Ontem ' + format(timestamp, 'HH:mm');
    } else {
      return format(timestamp, 'dd/MM HH:mm', { locale: ptBR });
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header do Chat */}
      <Card className="rounded-none border-b">
        <CardHeader className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => window.history.back()}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              
              <Avatar className="h-10 w-10">
                <AvatarImage src="/professor-avatar.jpg" />
                <AvatarFallback>
                  Prof
                </AvatarFallback>
              </Avatar>
              
              <div>
                <CardTitle className="text-lg">Professor João</CardTitle>
                <p className="text-sm text-muted-foreground">
                  <Badge variant="secondary" className="text-xs">
                    Online
                  </Badge>
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm">
                <Phone className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Video className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Área de Mensagens */}
      <ScrollArea className="flex-1 p-4">
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                <Skeleton className="h-12 w-64 rounded-lg" />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
              <Send className="h-8 w-8" />
            </div>
            <p>Nenhuma mensagem ainda.</p>
            <p className="text-sm">Envie a primeira mensagem para seu professor!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => {
              const isMyMessage = message.senderId === user?.uid;
              
              return (
                <div 
                  key={message.id}
                  className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[70%] ${isMyMessage ? 'order-2' : 'order-1'}`}>
                    <div 
                      className={`p-3 rounded-lg ${
                        isMyMessage 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-sm">{message.message}</p>
                      <div className={`flex items-center gap-1 mt-1 ${
                        isMyMessage ? 'justify-end' : 'justify-start'
                      }`}>
                        <span className={`text-xs ${
                          isMyMessage ? 'text-primary-foreground/70' : 'text-muted-foreground'
                        }`}>
                          {formatMessageTime(message.createdAt instanceof Date ? message.createdAt : new Date())}
                        </span>
                        {isMyMessage && (
                          <div className="text-primary-foreground/70">
                            {message.isRead ? (
                              <CheckCheck className="h-3 w-3" />
                            ) : (
                              <Check className="h-3 w-3" />
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>

      {/* Input de Nova Mensagem */}
      <Card className="rounded-none border-t">
        <CardContent className="p-4">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Digite sua mensagem..."
              disabled={sending || loading}
              className="flex-1"
              autoFocus
            />
            <Button 
              type="submit" 
              disabled={!newMessage.trim() || sending || loading}
              size="sm"
            >
              {sending ? (
                <Clock className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// Skeleton para loading state
function ChatSkeleton() {
  return (
    <div className="flex flex-col h-screen bg-background">
      <Skeleton className="h-20 w-full rounded-none" />
      <div className="flex-1 p-4 space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
            <Skeleton className="h-12 w-64 rounded-lg" />
          </div>
        ))}
      </div>
      <Skeleton className="h-16 w-full rounded-none" />
    </div>
  );
}