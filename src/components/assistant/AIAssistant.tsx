
import { useState, useRef, useEffect } from "react";
import { Send, Bot, Calendar, Award, Target, Plus, MessageSquare, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ShapeProLogo } from "@/components/ui/ShapeProLogo";
import { useAuthContext } from "@/components/auth/AuthProvider";
import { useAIConversation } from "@/hooks/useAIConversation";
import { toast } from "sonner";

export const AIAssistant = () => {
  const { user, userProfile } = useAuthContext();
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
    } catch (err) {
      console.error('Error sending message:', err);
      toast.error('Erro ao enviar mensagem. Tente novamente.');
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

  return (
    <div className="flex flex-col h-screen relative bg-gradient-dark">
      {/* Header com Logo Shape Pro */}
      <div className="p-6 pt-8 text-center bg-gradient-to-b from-card/90 to-transparent border-b border-border/20">
        {/* Data */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            {new Date().toLocaleDateString('pt-BR', { 
              day: 'numeric', 
              month: 'long', 
              year: 'numeric' 
            })}
          </span>
        </div>

        {/* Shape Pro Logo */}
        <div className="mb-6">
          <ShapeProLogo className="h-12 w-auto" />
        </div>

        {/* Saudação personalizada */}
        <div className="space-y-4">
          <h1 className="text-2xl font-bold text-foreground">
            Olá, <span className="text-gradient-primary">{userName}!</span>
          </h1>
          
          {/* Badges de conquistas */}
          <div className="flex items-center justify-center gap-3">
            <div className="badge-premium flex items-center gap-1">
              <Target className="w-3 h-3" />
              Ritmo Shape
            </div>
            <div className="badge-member flex items-center gap-1">
              <Award className="w-3 h-3" />
              Consistência Pro
            </div>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 pb-32 space-y-4">
        {messages.length === 0 && !loading && (
          <div className="text-center py-8">
            <Bot className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              Olá, {userName}! 👋 Sou seu Coach IA da Shape Pro. Estou aqui para te guiar com base nos seus dados reais. Como posso ajudar?
            </p>
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
      <div className="fixed bottom-20 left-0 right-0 p-3 bg-gradient-to-t from-background via-background/95 to-transparent">
        <div className="flex items-center gap-2 bg-card/80 backdrop-blur-md border border-border/50 rounded-2xl p-2 w-full max-w-lg mx-auto shadow-lg">
          <div className="flex-1 min-w-0">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Digite sua mensagem para o Coach Shape Pro..."
              className="w-full px-3 py-2.5 bg-transparent border-none resize-none text-foreground placeholder:text-muted-foreground focus:outline-none text-sm leading-5"
              rows={1}
              style={{ minHeight: '40px', maxHeight: '120px' }}
            />
          </div>
          
          <Button
            size="sm"
            onClick={handleSendMessage}
            disabled={!inputText.trim() || loading}
            className="btn-primary h-10 w-10 shrink-0 rounded-xl"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
