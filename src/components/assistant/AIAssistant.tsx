import { useState, useRef, useEffect } from "react";
import { Send, Mic, MicOff, Bot, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

const initialMessages: Message[] = [
  {
    id: '1',
    text: 'Olá! Sou seu assistente pessoal de fitness. Como posso te ajudar hoje?',
    sender: 'ai',
    timestamp: new Date()
  }
];

export const AIAssistant = () => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
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
    <div className="flex flex-col h-full p-4 pt-8 pb-24">
      {/* Header */}
      <div className="mb-4 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
            <Bot className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Coach IA</h1>
        </div>
        <p className="text-sm text-muted-foreground">Seu assistente pessoal de fitness</p>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[80%] ${message.sender === 'user' ? 'order-2' : 'order-1'}`}>
              {message.sender === 'ai' && (
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-xs text-muted-foreground">Coach IA</span>
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

      {/* Input Area */}
      <div className="flex items-end gap-2 bg-card/30 rounded-xl p-2">
        <div className="flex-1 bg-background/50 rounded-lg">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Digite sua mensagem..."
            className="w-full p-3 bg-transparent border-none resize-none text-foreground placeholder:text-muted-foreground focus:outline-none"
            rows={1}
            style={{ minHeight: '44px', maxHeight: '120px' }}
          />
        </div>
        
        <Button
          size="icon"
          onClick={() => setIsRecording(!isRecording)}
          className={`${isRecording ? 'btn-destructive' : 'btn-secondary'} w-11 h-11`}
        >
          {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </Button>
        
        <Button
          size="icon"
          onClick={handleSendMessage}
          disabled={!inputText.trim()}
          className="btn-accent w-11 h-11"
        >
          <Send className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
};