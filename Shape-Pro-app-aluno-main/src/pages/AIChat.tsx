import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAIConversation } from '@/hooks/useAIConversation';
import { useKeyboardState } from '@/hooks/useKeyboardState';
import { useAuthContext } from '@/components/auth/AuthProvider';
import { MobileContainer } from '@/components/layout/MobileContainer';
import { BottomNavigation } from '@/components/layout/BottomNavigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Loader2, Sparkles, Calendar } from 'lucide-react';
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

  return (
    <>
      <MobileContainer>
        <div className="flex flex-col h-screen bg-background">
          {/* Header */}
          <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-4">
            <div className="flex items-center gap-3">
              <ShapeProLogo className="h-10 w-10" />
              <div>
                <h1 className="text-lg font-semibold">Assistente IA</h1>
                <p className="text-xs text-muted-foreground">
                  Olá, {firstName}! Como posso ajudar?
                </p>
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <div 
            className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
            style={{
              paddingBottom: '160px'
            }}
          >
            {/* Daily limit error card - sempre visível no topo quando ativo */}
            {dailyLimitReached && (
              <div className="sticky top-0 z-10 mb-4">
                <Card className="p-6 bg-card/95 backdrop-blur-md border-border/50 shadow-xl">
                  <CardContent className="p-0">
                    <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4 shadow-glow">
                      <Calendar className="w-8 h-8 text-primary-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold text-center mb-2">
                      Limite Diário Atingido
                    </h3>
                    <p className="text-sm text-muted-foreground text-center mb-1">
                      Você fez 3 perguntas hoje (3/3)
                    </p>
                    <p className="text-sm text-muted-foreground text-center">
                      Volte amanhã para continuar! 🌅
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Welcome message - só quando não há mensagens E não há erro de limite */}
            {messages.length === 0 && !loading && !dailyLimitReached ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-8">
                <Sparkles className="w-16 h-16 text-primary mb-4" />
                <h2 className="text-xl font-semibold mb-2">
                  Bem-vindo ao Assistente IA!
                </h2>
                <p className="text-muted-foreground">
                  Faça uma pergunta para começar a conversa.
                </p>
              </div>
            ) : messages.length > 0 ? (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {formatTime(msg.timestamp)}
                    </p>
                  </div>
                </div>
              ))
            ) : null}
            
            {loading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg px-4 py-2 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Pensando...</span>
                </div>
              </div>
            )}
            
            {error && !dailyLimitReached && (
              <div className="flex justify-center">
                <div className="bg-destructive/10 text-destructive rounded-lg px-4 py-2 text-sm">
                  {error}
                </div>
              </div>
            )}
          </div>

          {/* Input Area - Fixed at bottom with safe area support */}
          <div
            className="fixed left-0 right-0 bg-background border-t border-border transition-all duration-200 pointer-events-auto"
            style={{
              bottom: keyboardVisible 
                ? `${keyboardHeight}px` 
                : 'calc(72px + env(safe-area-inset-bottom))',
              zIndex: 10001,
              isolation: 'isolate',
              paddingBottom: 'env(safe-area-inset-bottom)'
            }}
          >
            <div className="px-4 py-3">
              <div className="flex gap-2 items-end">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder={
                    dailyLimitReached 
                      ? "Limite diário atingido. Volte amanhã! 🕐" 
                      : loading 
                      ? "Aguarde..." 
                      : "Digite sua mensagem..."
                  }
                  disabled={loading || dailyLimitReached}
                  className="min-h-[44px] max-h-[120px] resize-none"
                  rows={1}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!input.trim() || loading || dailyLimitReached}
                  size="icon"
                  className="shrink-0 h-11 w-11"
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </MobileContainer>

      {/* Bottom Navigation - Completely outside MobileContainer */}
      <BottomNavigation 
        activeTab="" 
        onTabChange={handleTabChange}
      />
    </>
  );
}
