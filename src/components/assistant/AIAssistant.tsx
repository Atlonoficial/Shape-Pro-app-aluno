import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, AlertCircle, Calendar, Loader2, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ShapeProLogo } from '@/components/ui/ShapeProLogo';
import { useAuthContext } from '@/components/auth/AuthProvider';
import { useAIConversation } from '@/hooks/useAIConversation';
import { useGamificationActions } from '@/hooks/useRealtimeGamification';
import { useAIUsageLimit } from '@/hooks/useAIUsageLimit';
import { useKeyboard } from '@/contexts/KeyboardContext';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';

export const AIAssistant = () => {
  const { user, userProfile } = useAuthContext();
  const { awardAIInteractionPoints } = useGamificationActions();
  const userName = (userProfile?.name || 'Usuário').trim().split(/\s+/)[0];
  
  const { 
    messages, 
    loading, 
    error, 
    sendMessage 
  } = useAIConversation();
  
  const { dailyCount, dailyLimit, canAsk, remainingQuestions, resetTime, loading: limitLoading, incrementUsage } = useAIUsageLimit();
  const { isVisible: keyboardVisible, height: keyboardHeight } = useKeyboard();
  
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || loading || !canAsk) return;

    const messageText = inputText;
    setInputText('');

    try {
      await sendMessage(messageText);
      
      // Increment usage count
      incrementUsage();
      
      // Award points for AI interaction
      await awardAIInteractionPoints();
      
      toast.success(
        remainingQuestions > 1 
          ? `Você ainda tem ${remainingQuestions - 1} ${remainingQuestions - 1 === 1 ? 'pergunta' : 'perguntas'} hoje.`
          : "Essa foi sua última pergunta de hoje! 💪"
      );
    } catch (err) {
      logger.error('Error sending message:', err);
      toast.error(err instanceof Error ? err.message : 'Erro ao enviar mensagem. Tente novamente.');
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

  // Adjust messages container bottom padding based on keyboard
  const messagesPaddingBottom = keyboardVisible 
    ? `${keyboardHeight + 100}px` 
    : '160px';

  return (
    <div className="flex flex-col h-screen relative bg-gradient-dark">
      {/* Header com Logo Shape Pro */}
      <div className="p-3 sm:p-4 pt-safe text-center bg-gradient-to-b from-card/90 to-transparent border-b border-border/20">
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
        
        {/* Usage Indicator */}
        {!limitLoading && (
          <div className={`text-xs font-medium flex items-center justify-center gap-1 mt-2 ${canAsk ? 'text-primary' : 'text-warning'}`}>
            <Sparkles className="w-3 h-3" />
            {remainingQuestions > 0 
              ? `${remainingQuestions} ${remainingQuestions === 1 ? 'pergunta disponível' : 'perguntas disponíveis'} hoje`
              : `Limite diário atingido (reinicia às ${resetTime})`
            }
          </div>
        )}
      </div>

      {/* Messages Container */}
      <div 
        className="flex-1 overflow-y-auto p-4 space-y-4"
        style={{ paddingBottom: messagesPaddingBottom }}
      >
        {messages.length === 0 && !loading && (
          <div className="text-center py-8">
            <Bot className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-2">
              Olá, {userName}! 👋 Sou seu Coach IA da Shape Pro. Estou aqui para te guiar com base nos seus dados reais. Como posso ajudar?
            </p>
            {canAsk && (
              <p className="text-xs text-primary font-medium mt-2">
                Você tem {remainingQuestions} {remainingQuestions === 1 ? 'pergunta' : 'perguntas'} disponíveis hoje
              </p>
            )}
          </div>
        )}
        
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
              
              <Card className={`p-3 ${
                message.role === 'user' 
                  ? 'bg-primary text-background ml-auto' 
                  : 'bg-card/50 border-border/50'
              }`}>
                <p className={`text-sm whitespace-pre-wrap ${
                  message.role === 'user' ? 'text-background' : 'text-foreground'
                }`}>
                  {message.content}
                </p>
                <p className={`text-xs mt-1 ${
                  message.role === 'user' 
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
      <div 
        className="fixed left-0 right-0 p-2 sm:p-3 bg-gradient-to-t from-background via-background/95 to-transparent pb-safe"
        style={{ 
          bottom: keyboardVisible ? `${keyboardHeight}px` : '64px',
          transition: 'bottom 0.2s ease-out',
          willChange: 'transform'
        }}
      >
        {!canAsk && (
          <div className="flex items-center gap-2 mb-2 mx-auto max-w-lg p-3 bg-warning/10 border border-warning/20 rounded-lg">
            <AlertCircle className="w-4 h-4 text-warning" />
            <p className="text-xs text-warning font-medium">
              Você atingiu o limite de 3 perguntas diárias. Reinicia às {resetTime} 💪
            </p>
          </div>
        )}
        
        <div className="flex items-end gap-1.5 sm:gap-2 bg-card/80 backdrop-blur-md border border-border/50 rounded-xl sm:rounded-2xl p-1.5 sm:p-2 w-full max-w-lg mx-auto shadow-lg">
          <div className="flex-1 min-w-0">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={canAsk ? "Digite sua mensagem..." : "Limite diário atingido"}
              className="w-full px-2 sm:px-3 py-2 sm:py-2.5 bg-transparent border-none resize-none text-foreground placeholder:text-muted-foreground focus:outline-none text-sm leading-5"
              rows={1}
              style={{ minHeight: '36px', maxHeight: '100px' }}
              disabled={loading || !canAsk}
            />
          </div>
          
          <Button
            size="sm"
            onClick={handleSendMessage}
            disabled={!inputText.trim() || loading || !canAsk}
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
