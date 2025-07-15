import { useState, useEffect } from "react";
import { ArrowLeft, ChevronRight, Bell, User, Moon, Globe, Shield, LogOut, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

export const Configuracoes = () => {
  const navigate = useNavigate();
  const [notificacoes, setNotificacoes] = useState(true);
  const [tema, setTema] = useState("escuro");
  const [idioma, setIdioma] = useState("pt");

  useEffect(() => {
    // Demonstração de notificação ao carregar as configurações
    const timer = setTimeout(() => {
      toast({
        title: "🔔 Hora do treino!",
        description: "Você tem um treino agendado para hoje às 18:00",
      });
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const handleSair = () => {
    toast({
      title: "Saindo...",
      description: "Você será desconectado do aplicativo.",
      variant: "destructive"
    });
  };

  const handlePlanosClick = () => {
    toast({
      title: "Planos e Assinaturas",
      description: "Gerencie seu plano atual e explore novas opções",
    });
  };

  const configItems = [
    {
      icon: Bell,
      title: "Notificações",
      description: "Receber alertas e lembretes (clique para exemplo!)",
      action: (
        <Switch 
          checked={notificacoes}
          onCheckedChange={(checked) => {
            setNotificacoes(checked);
            if (checked) {
              toast({
                title: "🔥 Notificações ativadas!",
                description: "Você receberá lembretes de treinos e dicas personalizadas",
              });
            }
          }}
        />
      )
    },
    {
      icon: Crown,
      title: "Planos e Assinaturas",
      description: "Gerencie seu plano atual",
      action: <ChevronRight className="w-4 h-4 text-muted-foreground" />,
      onClick: handlePlanosClick
    },
    {
      icon: User,
      title: "Conta",
      description: "E-mail e alteração de senha",
      action: <ChevronRight className="w-4 h-4 text-muted-foreground" />,
      onClick: () => toast({ title: "Configurações de conta", description: "Em desenvolvimento" })
    },
    {
      icon: Moon,
      title: "Tema",
      description: "Aparência do aplicativo",
      action: (
        <Select value={tema} onValueChange={setTema}>
          <SelectTrigger className="w-24 h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="claro">Claro</SelectItem>
            <SelectItem value="escuro">Escuro</SelectItem>
          </SelectContent>
        </Select>
      )
    },
    {
      icon: Globe,
      title: "Idioma",
      description: "Idioma do aplicativo",
      action: (
        <Select value={idioma} onValueChange={setIdioma}>
          <SelectTrigger className="w-24 h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pt">PT-BR</SelectItem>
            <SelectItem value="en">English</SelectItem>
            <SelectItem value="es">Español</SelectItem>
          </SelectContent>
        </Select>
      )
    },
    {
      icon: Shield,
      title: "Política de Privacidade",
      description: "Termos e condições",
      action: <ChevronRight className="w-4 h-4 text-muted-foreground" />,
      onClick: () => toast({ title: "Política de privacidade", description: "Abrindo documento..." })
    }
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="p-4 pt-8 border-b border-border/30">
        <div className="flex items-center gap-3 mb-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate("/?tab=profile")}
            className="text-foreground"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold text-foreground">Configurações</h1>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Configuration Items */}
        <div className="space-y-2">
          {configItems.map((item, index) => (
            <Card 
              key={index} 
              className="p-4 bg-card/50 border-border/50 hover:bg-card/70 transition-colors cursor-pointer"
              onClick={item.onClick}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                    <item.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  {item.action}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Logout Button */}
        <Card className="p-4 bg-destructive/10 border-destructive/20 hover:bg-destructive/20 transition-colors cursor-pointer">
          <Button
            variant="ghost"
            onClick={handleSair}
            className="w-full justify-start text-destructive hover:text-destructive hover:bg-transparent p-0"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-destructive/20 rounded-lg flex items-center justify-center">
                <LogOut className="w-5 h-5 text-destructive" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold">Sair</h3>
                <p className="text-sm text-destructive/70">Desconectar da conta</p>
              </div>
            </div>
          </Button>
        </Card>

        {/* Footer Note */}
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mt-6">
          <p className="text-primary text-sm font-medium">
            Alterações serão aplicadas ao seu app e notificadas ao seu professor, quando relevante.
          </p>
        </div>
      </div>
    </div>
  );
};