
import { useState, useRef, useEffect } from "react";
import { Send, Bot, Calendar, Award, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ShapeProLogo } from "@/components/ui/ShapeProLogo";

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

const initialMessages: Message[] = [
  {
    id: '1',
    text: 'Olá, Alex! 👋 Sou seu Coach IA da Shape Pro. Estou aqui para te guiar, vamos começar?',
    sender: 'ai',
    timestamp: new Date()
  }
];

export const AIAssistant = () => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');

    // Simular resposta da IA
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: getAIResponse(inputText),
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiResponse]);
    }, 1000);
  };

  const getAIResponse = (input: string): string => {
    const lowerInput = input.toLowerCase();
    
    if (lowerInput.includes('treino') || lowerInput.includes('exercício')) {
      return 'Ótimo! Vejo que você está interessado em treinos. Posso sugerir alguns exercícios baseados em seus objetivos. Qual é seu foco principal: força, cardio ou flexibilidade?';
    }
    
    if (lowerInput.includes('dieta') || lowerInput.includes('alimentação')) {
      return 'Excelente pergunta sobre nutrição! Uma alimentação balanceada é fundamental. Posso ajudar você a planejar suas refeições. Qual é seu objetivo: ganho de massa, perda de peso ou manutenção?';
    }
    
    if (lowerInput.includes('peso') || lowerInput.includes('emagrecer')) {
      return 'Para perda de peso eficaz, recomendo combinar exercícios cardiovasculares com musculação e uma dieta balanceada. Quer que eu crie um plano personalizado para você?';
    }
    
    return 'Entendi! Estou aqui para ajudar com treinos, nutrição, e acompanhar seu progresso. Tem alguma meta específica em mente?';
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
            Olá, <span className="text-gradient-primary">Alex!</span>
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
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[80%] ${message.sender === 'user' ? 'order-2' : 'order-1'}`}>
              {message.sender === 'ai' && (
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center shadow-glow">
                    <Bot className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <span className="text-sm font-semibold text-primary">Coach Shape Pro</span>
                </div>
              )}
              
              <Card className={`p-3 ${
                message.sender === 'user' 
                  ? 'bg-primary text-background ml-auto' 
                  : 'bg-card/50 border-border/50'
              }`}>
                <p className={`text-sm ${
                  message.sender === 'user' ? 'text-background' : 'text-foreground'
                }`}>
                  {message.text}
                </p>
                <p className={`text-xs mt-1 ${
                  message.sender === 'user' 
                    ? 'text-background/70' 
                    : 'text-muted-foreground'
                }`}>
                  {formatTime(message.timestamp)}
                </p>
              </Card>
            </div>
          </div>
        ))}
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
            disabled={!inputText.trim()}
            className="btn-primary h-10 w-10 shrink-0 rounded-xl"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
