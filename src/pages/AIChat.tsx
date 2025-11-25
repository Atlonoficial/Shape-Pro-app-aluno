import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAIConversation } from '@/hooks/useAIConversation';
import { useKeyboardState } from '@/hooks/useKeyboardState';
import { useAuthContext } from '@/components/auth/AuthProvider';
import { MobileContainer } from '@/components/layout/MobileContainer';
import { BottomNavigation } from '@/components/layout/BottomNavigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Loader2, Sparkles, Calendar, ArrowLeft } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ShapeProLogo } from '@/components/ui/ShapeProLogo';

export default function AIChat() {
  const navigate = useNavigate();
  const { userProfile } = useAuthContext();
  const { toast } = useToast();
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const { isVisible: keyboardVisible, height: keyboardHeight } = useKeyboardState();

  const {
    messages,
    loading,
    error,
    sendMessage,
  } = useAIConversation();

  const firstName = userProfile?.name?.split(' ')[0] || 'Usuário';

  // Helper para detectar erro de limite diário - usar diretamente sem estado derivado
  const isDailyLimitError = (errorMsg: string | null) => {
    if (!errorMsg) return false;
    const lowerError = errorMsg.toLowerCase();
    return lowerError.includes('limite') &&
      (lowerError.includes('diário') || lowerError.includes('dia') || lowerError.includes('perguntas'));
  };

  // Computed value - evita race condition do useEffect
  const dailyLimitReached = isDailyLimitError(error);

  const handleSendMessage = async () => {
    if (!input.trim() || loading) return;

    // Prevent sending if daily limit is reached
    if (dailyLimitReached) {
      toast({
        title: "Limite Atingido",
        description: "Você atingiu o limite diário de perguntas. Tente novamente amanhã!",
        variant: "destructive",
      });
      return;
    }

    const messageText = input.trim();
    setInput('');
    setIsTyping(false);

    try {
      await sendMessage(messageText);
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);

      // Toast específico para erro de limite diário
      if (error && typeof error === 'object' && 'message' in error) {
        const errorMsg = String(error.message);
        if (isDailyLimitError(errorMsg)) {
          toast({
            title: "🕐 Limite Diário Atingido",
            description: "Você fez 3 perguntas hoje. Volte amanhã para continuar!",
            variant: "destructive",
          });
        }
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleTabChange = (tab: string) => {
    navigate(`/?tab=${tab}`);
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };


  const suggestions = [
    "Criar treino de hipertrofia",
    "Dicas para perder gordura",
    "Explicar exercício Agachamento",
    "Sugestão de café da manhã"
  ];

  return (
    <>
      <MobileContainer className="!pb-0 !h-[100dvh] overflow-hidden">
        <div className="flex flex-col h-full w-full relative bg-background">
          {/* Header */}
          <div className="flex-none bg-background/80 backdrop-blur-md border-b border-border px-4 py-3 z-10">
            <div className="flex items-center justify-between relative">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/')}
                className="text-foreground hover:bg-muted -ml-2"
              >
                <ArrowLeft size={20} />
              </Button>

              <div className="flex items-center gap-2 absolute left-1/2 transform -translate-x-1/2">
                <ShapeProLogo className="h-8 w-8" />
                <span className="font-semibold text-lg">Shape AI</span>
              </div>

              <div className="w-10" /> {/* Spacer for alignment */}
            </div>
          </div>

          {/* Messages Area - Flex 1 to take available space */}
          <div className="flex-1 overflow-hidden relative w-full">
            <div className="absolute inset-0 overflow-y-auto px-4 py-4 space-y-6 pb-safe">
              {/* Daily limit error card */}
              {dailyLimitReached && (
                <div className="sticky top-0 z-10 mb-4 animate-fade-in">
                  <Card className="p-6 bg-card/95 backdrop-blur-md border-destructive/30 shadow-xl">
                    <CardContent className="p-0">
                      <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Calendar className="w-8 h-8 text-destructive" />
                      </div>
                      <h3 className="text-lg font-semibold text-center mb-2 text-destructive">
                        Limite Diário Atingido
                      </h3>
                      <p className="text-sm text-muted-foreground text-center mb-1">
                        Você atingiu o limite de perguntas por hoje.
                      </p>
                      <p className="text-sm text-muted-foreground text-center">
                        Volte amanhã para continuar! 🌅
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Welcome message */}
              {messages.length === 0 && !loading && !dailyLimitReached ? (
                <div className="flex flex-col items-center justify-center h-full px-6 animate-fade-up">
                  <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 shadow-glow">
                    <Sparkles className="w-10 h-10 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold mb-3 text-center bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                    Olá, {firstName}!
                  </h2>
                  <p className="text-muted-foreground text-center mb-8 max-w-xs">
                    Sou seu assistente pessoal de treino e nutrição. Como posso ajudar hoje?
                  </p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-5 py-3 shadow-sm ${msg.role === 'user'
                        ? 'bg-primary text-primary-foreground rounded-tr-sm'
                        : 'bg-card border border-border rounded-tl-sm'
                        }`}
                    >
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      <p className={`text-[10px] mt-1.5 text-right ${msg.role === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                        }`}>
                        {formatTime(msg.timestamp)}
                      </p>
                    </div>
                  </div>
                ))
              )}

              {loading && (
                <div className="flex justify-start animate-pulse">
                  <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-5 py-4 flex items-center gap-3">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}

              {error && !dailyLimitReached && (
                <div className="flex justify-center animate-fade-in">
                  <div className="bg-destructive/10 text-destructive border border-destructive/20 rounded-lg px-4 py-2 text-sm font-medium">
                    {error}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Input Area - Natural flow */}
          <div className={`w-full z-[100] bg-background/95 backdrop-blur-xl border-t border-border ${keyboardVisible ? 'pb-2' : 'pb-safe'}`}>
            <div className="p-3">
              <div className="flex items-end gap-2 max-w-4xl mx-auto">
                <div className="flex-1 relative bg-muted/30 rounded-3xl border border-border/50 focus-within:border-primary/50 focus-within:bg-muted/50 focus-within:ring-1 focus-within:ring-primary/20 transition-all duration-200">
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder={
                      dailyLimitReached
                        ? "Volte amanhã para mais perguntas..."
                        : "Digite sua dúvida..."
                    }
                    disabled={loading || dailyLimitReached}
                    className="min-h-[44px] max-h-[120px] resize-none border-0 bg-transparent focus-visible:ring-0 shadow-none text-base placeholder:text-muted-foreground/70 px-4 py-3"
                    rows={1}
                  />
                </div>
                <Button
                  onClick={handleSendMessage}
                  disabled={!input.trim() || loading || dailyLimitReached}
                  size="icon"
                  className={`h-10 w-10 rounded-full flex-shrink-0 transition-all duration-300 ${input.trim()
                    ? 'bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 hover:scale-105'
                    : 'bg-muted text-muted-foreground'
                    }`}
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5 ml-0.5" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </MobileContainer>
    </>
  );
}
