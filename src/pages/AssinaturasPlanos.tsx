import { useMemo } from "react";
import { ArrowLeft, Crown, Check, Star, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { useStudentProfile } from "@/hooks/useStudentProfile";

const AssinaturasPlanos = () => {
  const navigate = useNavigate();
  const { student } = useStudentProfile();

  const planoAtual = useMemo(() => {
    if (!student?.activePlan) return null;
    return {
      nome: student.activePlan,
      preco: "-",
      periodo: "-",
      dataRenovacao: "-",
      status: "ativo",
    };
  }, [student?.activePlan]);

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
      title: "Somente pelo professor",
      description: "A assinatura é gerenciada pelo seu professor.",
    });
  };

  const handleAlterarPlano = () => {
    toast({
      title: "Somente pelo professor",
      description: "Seu professor define e altera o plano.",
    });
  };

  const handleRenovarAssinatura = () => {
    toast({
      title: "Somente pelo professor",
      description: "A renovação é controlada pelo professor.",
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
        {!planoAtual ? (
          <Card className="p-6 bg-muted/30 border-border/30 text-center">
            <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center mx-auto mb-3">
              <Crown className="w-6 h-6 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-bold text-foreground">Sem plano atribuído</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Seu professor ainda não liberou um plano. Assim que for liberado, aparecerá aqui.
            </p>
          </Card>
        ) : (
          <>
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
                        ATIVO
                      </Badge>
                    </div>
                  </div>
                </div>
                {planoAtual.preco !== '-' && planoAtual.periodo !== '-' && (
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">{planoAtual.preco}</p>
                    <p className="text-sm text-muted-foreground">/{planoAtual.periodo}</p>
                  </div>
                )}
              </div>

              {/* Benefícios visíveis com o plano */}
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

            {/* Informações de Cobrança - apenas se existir detalhamento */}
            {planoAtual.preco !== '-' && planoAtual.dataRenovacao !== '-' && (
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-primary" />
                  </div>
                  <h2 className="text-lg font-semibold text-foreground">Informações de Cobrança</h2>
                </div>
                <div className="space-y-3">
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
            )}

            {/* Suporte */}
            <Card className="p-4 bg-primary/10 border-primary/20">
              <h3 className="font-medium text-primary mb-2">Precisa de ajuda?</h3>
              <p className="text-sm text-primary/80 mb-3">
                Fale com seu professor para ajustar seu plano ou tirar dúvidas.
              </p>
              <Button variant="outline" size="sm" className="text-primary border-primary/30">
                Contatar Professor
              </Button>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default AssinaturasPlanos;