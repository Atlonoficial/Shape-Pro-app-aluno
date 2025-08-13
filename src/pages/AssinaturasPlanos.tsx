import { useMemo, useEffect, useState } from "react";
import { ArrowLeft, Crown, Check, Star, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { useStudentProfile } from "@/hooks/useStudentProfile";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

// AssinaturasPlanos Component - Updated to fix caching issue
const AssinaturasPlanos = () => {
  const navigate = useNavigate();
  const { student } = useStudentProfile();
  const { user } = useAuth();

  const [subInfo, setSubInfo] = useState<{
    nome: string;
    preco: string;
    periodo: string;
    dataRenovacao: string;
    status: string;
    features?: string[];
  } | null>(null);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      if (!user?.id) {
        if (isMounted) setSubInfo(null);
        return;
      }
      try {
        const { data: sub } = await (supabase as any)
          .from('plan_subscriptions')
          .select('id, plan_id, status, start_at, end_at, teacher_id')
          .eq('student_user_id', user.id)
          .eq('status', 'active')
          .order('start_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!sub) {
          if (isMounted) setSubInfo(null);
          return;
        }

        const { data: plan } = await (supabase as any)
          .from('plan_catalog')
          .select('name, price, interval, currency, features')
          .eq('id', sub.plan_id)
          .single();

        const currency = plan?.currency || 'BRL';
        const price = typeof plan?.price === 'number'
          ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(plan.price)
          : '-';

        const periodoMap: Record<string, string> = {
          monthly: 'mês',
          quarterly: 'trimestre',
          yearly: 'ano'
        };

        const periodo = plan?.interval ? (periodoMap[plan.interval] || plan.interval) : '-';
        const dataRenovacao = sub.end_at
          ? new Date(sub.end_at).toLocaleDateString('pt-BR')
          : '-';

        if (isMounted) {
          setSubInfo({
            nome: plan?.name ?? student?.active_plan ?? 'free',
            preco: price,
            periodo,
            dataRenovacao,
            status: sub.status ?? 'ativo',
            features: plan?.features || [],
          });
        }
      } catch (e) {
        if (isMounted) setSubInfo(null);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [user?.id, student?.teacher_id]);
const planoAtual = useMemo(() => {
  if (subInfo) return subInfo;
  if (!student?.active_plan) return null;
  return {
    nome: student.active_plan,
    preco: "-",
    periodo: "-",
    dataRenovacao: "-",
    status: student.membership_status || "ativo",
    features: [],
  };
}, [subInfo, student?.active_plan, student?.membership_status]);

  // Determinar benefícios ativos baseado no plano
  const beneficiosAtivos = useMemo(() => {
    if (!planoAtual || planoAtual.nome === 'free') {
      return beneficiosGratuitos;
    }
    
    // Se tem features específicas do plano, usar elas
    if (planoAtual.features && planoAtual.features.length > 0) {
      return planoAtual.features;
    }
    
    // Fallback para benefícios gratuitos se não há features específicas
    return beneficiosGratuitos;
  }, [planoAtual]);

  const beneficiosGratuitos = [
    "Acesso a treinos básicos",
    "Acompanhamento básico de progresso",
    "Chat com o professor (limitado)"
  ];


  const [planosDisponiveis, setPlanosDisponiveis] = useState<any[]>([]);

  useEffect(() => {
    const loadPlanos = async () => {
      if (!student?.teacher_id) return;
      
      try {
        const { data: planos } = await (supabase as any)
          .from('plan_catalog')
          .select('*')
          .eq('teacher_id', student.teacher_id)
          .eq('is_active', true)
          .order('price', { ascending: true });
        
        setPlanosDisponiveis(planos || []);
      } catch (e) {
        console.error('Error loading plans:', e);
      }
    };
    loadPlanos();
  }, [student?.teacher_id]);

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

  const handleContratarPlano = async (planoId: string) => {
    if (!user?.id || !student?.teacher_id) return;
    
    try {
      const { error } = await (supabase as any)
        .from('plan_subscriptions')
        .insert({
          student_user_id: user.id,
          teacher_id: student.teacher_id,
          plan_id: planoId,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Solicitação enviada!",
        description: "Seu professor será notificado para aprovar sua assinatura."
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível enviar a solicitação. Tente novamente.",
        variant: "destructive"
      });
    }
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
          <>
            {/* Acesso Gratuito */}
            <Card className="p-6 bg-muted/30 border-border/30">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center">
                  <Crown className="w-6 h-6 text-muted-foreground" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">Acesso Gratuito</h2>
                  <p className="text-sm text-muted-foreground">
                    Conteúdos liberados pelo seu professor
                  </p>
                </div>
              </div>
              
              <div className="space-y-3">
                <h3 className="font-semibold text-foreground mb-3">Benefícios disponíveis:</h3>
                <div className="grid gap-2">
                  {beneficiosGratuitos.map((beneficio, index) => (
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
          </>
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
                        {planoAtual.status?.toUpperCase?.() || 'ATIVO'}
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

        {/* Planos Disponíveis para Contratação */}
        {planosDisponiveis.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-foreground">Planos Disponíveis</h2>
            <div className="grid gap-4">
              {planosDisponiveis.map((plano) => (
                <Card key={plano.id} className={`p-6 ${plano.highlighted ? 'border-primary/50 bg-primary/5' : 'border-border/30'}`}>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-bold text-foreground">{plano.name}</h3>
                        {plano.highlighted && (
                          <Badge variant="secondary" className="bg-primary/20 text-primary">
                            Recomendado
                          </Badge>
                        )}
                      </div>
                      {plano.description && (
                        <p className="text-sm text-muted-foreground mb-3">{plano.description}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-foreground">
                        {new Intl.NumberFormat('pt-BR', { 
                          style: 'currency', 
                          currency: plano.currency || 'BRL' 
                        }).format(plano.price)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        /{plano.interval === 'monthly' ? 'mês' : plano.interval === 'yearly' ? 'ano' : plano.interval}
                      </p>
                    </div>
                  </div>

                  {plano.features && plano.features.length > 0 && (
                    <div className="mb-4">
                      <div className="grid gap-2">
                        {plano.features.map((feature: string, index: number) => (
                          <div key={index} className="flex items-center gap-3">
                            <div className="w-5 h-5 bg-success/20 rounded-full flex items-center justify-center">
                              <Check className="w-3 h-3 text-success" />
                            </div>
                            <span className="text-sm text-foreground">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <Button 
                    onClick={() => handleContratarPlano(plano.id)}
                    className="w-full"
                    variant={plano.highlighted ? "default" : "outline"}
                  >
                    Solicitar Plano
                  </Button>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssinaturasPlanos;