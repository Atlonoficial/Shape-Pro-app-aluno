
import { useState, useRef, useEffect } from "react";
import { Send, Bot, Calendar, Award, Target, Plus, MessageSquare, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ShapeProLogo } from "@/components/ui/ShapeProLogo";
import { useAuthContext } from "@/components/auth/AuthProvider";
import { useAIConversation } from "@/hooks/useAIConversation";
import { useGamificationActions } from "@/hooks/useRealtimeGamification";
import { toast } from "sonner";

export const AIAssistant = () => {
  const { user, userProfile } = useAuthContext();
  const { awardAIInteractionPoints } = useGamificationActions();
  const userName = (userProfile?.name || 'Usuário').trim().split(/\s+/)[0];

  const {
    messages,
    conversations,
    currentConversation,
    loading,
    error,
    sendMessage,
    startNewConversation,
    loadConversation
  } = useAIConversation();

  const [inputText, setInputText] = useState('');
  const [showConversations, setShowConversations] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Helper function to check if error is daily limit
  const isDailyLimitError = (errorMsg: string | null): boolean => {
    if (!errorMsg) return false;
    const msg = errorMsg.toLowerCase();
    return msg.includes('limite diário') ||
      msg.includes('limite de') ||
      msg.includes('perguntas por dia') ||
      msg.includes('daily_limit');
  };

  // Debug: Log error state changes
  useEffect(() => {
    console.log('[AIAssistant] Error state changed:', { error, isDailyLimit: isDailyLimitError(error) });
  }, [error]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || loading) return;

    const messageText = inputText;
    setInputText('');

    try {
      await sendMessage(messageText);
      await awardAIInteractionPoints();
    } catch (err) {
      console.error('[AIAssistant] Error in handleSendMessage:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      console.log('[AIAssistant] Error message:', errorMessage);

      if (isDailyLimitError(errorMessage)) {
        console.log('[AIAssistant] Daily limit error detected');
        toast.error('🕐 Limite diário atingido! Você fez 3 perguntas hoje. Volte amanhã para continuar!');
      } else {
        toast.error('Erro ao enviar mensagem. Tente novamente.');
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 100)}px`;
    }
  }, [inputText]);

  return (
    <div className="flex flex-col h-screen relative bg-gradient-dark">
      {/* Header com Logo Shape Pro */}
      <div className="p-3 sm:p-4 pt-6 sm:pt-8 text-center bg-gradient-to-b from-card/90 to-transparent border-b border-border/20">
        {/* Data */}
        <div className="flex items-center justify-center gap-2 mb-3 sm:mb-4">
          <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            {new Date().toLocaleDateString('pt-BR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            })}
          </span>
        </div>

        {/* Shape Pro Logo - Responsiva */}
        <div className="mb-4 sm:mb-6">
          <ShapeProLogo className="h-16 sm:h-24 md:h-32 w-auto mx-auto" />
        </div>

        {/* Saudação personalizada */}
        <div>
          <h1 className="text-lg sm:text-2xl font-bold text-foreground">
            Olá, <span className="text-gradient-primary">{userName}!</span>
          </h1>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 pb-32 space-y-4">
        {/* Daily limit error card - sempre visível no topo quando ativo */}
        {isDailyLimitError(error) && (
          <div className="sticky top-0 z-10 mb-4">
            <Card className="p-6 bg-card/95 backdrop-blur-md border-border/50 max-w-md mx-auto shadow-xl">
              <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4 shadow-glow">
                <Calendar className="w-8 h-8 text-primary-foreground" />
              </div>
              <h3 className="text-lg font-bold mb-2 text-foreground">Limite Diário Atingido</h3>
              <p className="text-muted-foreground mb-4">
                Você fez suas <span className="font-bold text-primary">3 perguntas</span> de hoje!
              </p>
              <p className="text-sm text-muted-foreground">
                Volte amanhã para continuar conversando com seu Coach IA. 🕐
              </p>
            </Card>
          </div>
        )}

        {/* Welcome message - só quando não há mensagens E não há erro de limite */}
        {messages.length === 0 && !loading && !isDailyLimitError(error) && (
          <div className="text-center py-8">
            <Bot className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              Olá, {userName}! 👋 Sou seu Coach IA da Shape Pro. Estou aqui para te guiar com base nos seus dados reais. Como posso ajudar?
            </p>
          </div>
        )}

        {/* Mensagens do histórico - sempre visíveis, mesmo com erro de limite */}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[80%] ${message.role === 'user' ? 'order-2' : 'order-1'}`}>
              {message.role === 'assistant' && (
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center shadow-glow">
                    <Bot className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <span className="text-sm font-semibold text-primary">Coach Shape Pro</span>
                </div>
              )}

              <Card className={`p-3 ${message.role === 'user'
                  ? 'bg-primary text-background ml-auto'
                  : 'bg-card/50 border-border/50'
                }`}>
                <p className={`text-sm whitespace-pre-wrap ${message.role === 'user' ? 'text-background' : 'text-foreground'
                  }`}>
                  {message.content}
                </p>
                <p className={`text-xs mt-1 ${message.role === 'user'
                    ? 'text-background/70'
                    : 'text-muted-foreground'
                  }`}>
                  {formatTime(message.timestamp)}
                </p>
              </Card>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="max-w-[80%]">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center shadow-glow">
                  <Loader2 className="w-5 h-5 text-primary-foreground animate-spin" />
                </div>
                <span className="text-sm font-semibold text-primary">Coach Shape Pro</span>
              </div>
              <Card className="p-3 bg-card/50 border-border/50">
                <p className="text-sm text-muted-foreground">
                  Analisando seus dados e preparando resposta personalizada...
                </p>
              </Card>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Fixed Input Area */}
      <div className="fixed bottom-safe left-0 right-0 p-2 sm:p-3 bg-gradient-to-t from-background via-background/95 to-transparent z-20">
        <div className="flex items-end gap-1.5 sm:gap-2 bg-card/80 backdrop-blur-md border border-border/50 rounded-xl sm:rounded-2xl p-1.5 sm:p-2 w-full max-w-full sm:max-w-lg mx-auto shadow-lg">
          <div className="flex-1 min-w-0">
            <textarea
              ref={textareaRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                isDailyLimitError(error)
                  ? "Limite diário atingido. Volte amanhã! 🕐"
                  : "Digite sua mensagem..."
              }
              disabled={isDailyLimitError(error)}
              className="w-full px-2 sm:px-3 py-2 sm:py-2.5 bg-transparent border-none resize-none text-foreground placeholder:text-muted-foreground focus:outline-none text-sm leading-5 disabled:opacity-50 disabled:cursor-not-allowed"
              rows={1}
              style={{ minHeight: '40px', maxHeight: '100px' }}
            />
          </div>

          <Button
            size="sm"
            onClick={handleSendMessage}
            disabled={!inputText.trim() || loading || isDailyLimitError(error)}
            className="btn-primary h-8 w-8 sm:h-10 sm:w-10 shrink-0 rounded-lg sm:rounded-xl"
          >
            {loading ? (
              <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
            ) : (
              <Send className="w-3 h-3 sm:w-4 sm:h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
