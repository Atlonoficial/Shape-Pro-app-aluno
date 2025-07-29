import { useState } from "react";
import { ArrowLeft, Crown, Check, Star, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

const AssinaturasPlanos = () => {
  const navigate = useNavigate();
  
  // Simulando o plano atual do usuário
  const [planoAtual] = useState({
    nome: "Shape Pro Premium",
    preco: "R$ 79,90",
    periodo: "mensal",
    dataRenovacao: "15/02/2024",
    status: "ativo"
  });

  const beneficiosAtivos = [
    "Acesso ilimitado a todos os treinos",
    "Planos nutricionais personalizados",
    "Coach IA 24/7",
    "Relatórios de progresso detalhados",
    "Suporte prioritário",
    "Novos treinos semanais",
    "Acompanhamento profissional"
  ];

  const handleCancelarAssinatura = () => {
    toast({
      title: "Cancelamento solicitado",
      description: "Você receberá um email com as instruções para cancelamento.",
      variant: "destructive"
    });
  };

  const handleAlterarPlano = () => {
    toast({
      title: "Alterar plano",
      description: "Entre em contato com nosso suporte para alterar seu plano.",
    });
  };

  const handleRenovarAssinatura = () => {
    toast({
      title: "Renovação confirmada",
      description: "Sua assinatura foi renovada automaticamente.",
    });
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="p-4 pt-8 border-b border-border/30">
        <div className="flex items-center gap-3 mb-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate("/configuracoes")}
            className="text-foreground"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold text-foreground">Planos e Assinaturas</h1>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Plano Atual */}
        <Card className="p-6 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
                <Crown className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">{planoAtual.nome}</h2>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-success/20 text-success">
                    {planoAtual.status.toUpperCase()}
                  </Badge>
                  <span className="text-sm text-muted-foreground">•</span>
                  <span className="text-sm text-muted-foreground">
                    Renovação: {planoAtual.dataRenovacao}
                  </span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-primary">{planoAtual.preco}</p>
              <p className="text-sm text-muted-foreground">/{planoAtual.periodo}</p>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-foreground mb-3">Benefícios inclusos:</h3>
            <div className="grid gap-2">
              {beneficiosAtivos.map((beneficio, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-success/20 rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-success" />
                  </div>
                  <span className="text-sm text-foreground">{beneficio}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Informações de Cobrança */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">Informações de Cobrança</h2>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-border/30">
              <span className="text-muted-foreground">Método de pagamento</span>
              <span className="text-foreground">•••• •••• •••• 1234</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border/30">
              <span className="text-muted-foreground">Próxima cobrança</span>
              <span className="text-foreground">{planoAtual.dataRenovacao}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-muted-foreground">Valor</span>
              <span className="text-foreground font-semibold">{planoAtual.preco}</span>
            </div>
          </div>
        </Card>

        {/* Ações */}
        <div className="space-y-3">
          <Button 
            onClick={handleRenovarAssinatura}
            className="w-full"
          >
            <Star className="w-4 h-4 mr-2" />
            Renovar Automaticamente
          </Button>
          
          <Button 
            variant="outline"
            onClick={handleAlterarPlano}
            className="w-full"
          >
            Alterar Plano
          </Button>
          
          <Button 
            variant="outline"
            onClick={handleCancelarAssinatura}
            className="w-full text-destructive border-destructive/30 hover:bg-destructive/10"
          >
            Cancelar Assinatura
          </Button>
        </div>

        {/* Suporte */}
        <Card className="p-4 bg-primary/10 border-primary/20">
          <h3 className="font-medium text-primary mb-2">Precisa de ajuda?</h3>
          <p className="text-sm text-primary/80 mb-3">
            Nossa equipe de suporte está sempre disponível para ajudar com questões sobre sua assinatura.
          </p>
          <Button variant="outline" size="sm" className="text-primary border-primary/30">
            Contatar Suporte
          </Button>
        </Card>
      </div>
    </div>
  );
};

export default AssinaturasPlanos;