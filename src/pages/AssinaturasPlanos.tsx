import { useMemo, useEffect, useState } from "react";
import { ArrowLeft, Crown, Check, Star, Calendar, Diamond, Trophy, Gem, X, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { useStudentProfile } from "@/hooks/useStudentProfile";
import { useAuth } from "@/hooks/useAuth";
import { useActiveSubscription } from "@/hooks/useActiveSubscription";
import { useCheckout } from "@/hooks/useCheckout";
import { supabase } from "@/integrations/supabase/client";
import { ConnectionStatus } from "@/components/ui/ConnectionStatus";

// Mapeamento de ícones dos planos
const PLAN_ICONS = {
  crown: { icon: Crown, color: 'text-yellow-500', bgColor: 'bg-yellow-500/20' },
  star: { icon: Star, color: 'text-blue-500', bgColor: 'bg-blue-500/20' },
  diamond: { icon: Diamond, color: 'text-purple-500', bgColor: 'bg-purple-500/20' },
  trophy: { icon: Trophy, color: 'text-orange-500', bgColor: 'bg-orange-500/20' },
  gem: { icon: Gem, color: 'text-emerald-500', bgColor: 'bg-emerald-500/20' }
};

// Função para obter ícone do plano
const getPlanIcon = (iconKey?: string) => {
  const iconData = PLAN_ICONS[iconKey as keyof typeof PLAN_ICONS] || PLAN_ICONS.crown;
  return iconData;
};

// AssinaturasPlanos Component - Updated to fix caching issue
const AssinaturasPlanos = () => {
  const navigate = useNavigate();
  const { student } = useStudentProfile();
  const { user } = useAuth();
  const { subscription, loading: subscriptionLoading } = useActiveSubscription();
  const { createCheckout, loading: checkoutLoading } = useCheckout();

  // Handle payment return from MercadoPago
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');
    const transactionId = urlParams.get('transaction_id');

    if (paymentStatus && transactionId) {
      switch (paymentStatus) {
        case 'success':
          toast({
            title: "Pagamento Aprovado! ✅",
            description: "Seu plano foi ativado com sucesso.",
          });
          break;
        case 'pending':
          toast({
            title: "Pagamento Pendente ⏳",
            description: "Aguarde a confirmação do pagamento.",
          });
          break;
        case 'failure':
          toast({
            title: "Pagamento Rejeitado ❌",
            description: "O pagamento não foi aprovado. Tente novamente.",
            variant: "destructive"
          });
          break;
      }
      // Clean URL
      window.history.replaceState({}, '', '/assinaturas-planos');
    }
  }, []);

  // Estrutura de benefícios para plano gratuito
  const beneficiosEstruturados = {
    liberados: ["Conteúdos liberados pelo professor"],
    naoLiberados: [
      "Acesso a treinos básicos",
      "Acompanhamento básico de progresso",
      "Chat com o professor (limitado)"
    ]
  };

  const planoAtual = useMemo(() => {
    if (subscription) {
      const currency = subscription.plan_currency || 'BRL';
      const price = subscription.plan_price
        ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(subscription.plan_price)
        : '-';

      const periodoMap: Record<string, string> = {
        monthly: 'mês',
        quarterly: 'trimestre',
        yearly: 'ano'
      };

      const periodo = subscription.plan_interval
        ? (periodoMap[subscription.plan_interval] || subscription.plan_interval)
        : '-';

      const dataRenovacao = subscription.end_at
        ? new Date(subscription.end_at).toLocaleDateString('pt-BR')
        : '-';

      return {
        nome: subscription.plan_name,
        preco: price,
        periodo,
        dataRenovacao,
        status: subscription.status,
        features: subscription.plan_features || [],
        daysRemaining: subscription.daysRemaining,
        expirationStatus: subscription.expirationStatus
      };
    }

    if (!student?.active_plan) return null;
    return {
      nome: student.active_plan === 'free' ? 'Gratuito' : student.active_plan,
      preco: "-",
      periodo: "-",
      dataRenovacao: "-",
      status: student.membership_status || "ativo",
      features: [],
      daysRemaining: undefined,
      expirationStatus: undefined
    };
  }, [subscription, student?.active_plan, student?.membership_status]);

  // Determinar se é plano gratuito
  const isPlanoGratuito = !planoAtual || planoAtual.nome === 'Gratuito' || planoAtual.nome === 'free';

  // Benefícios para planos pagos
  const beneficiosPagos = useMemo(() => {
    if (planoAtual?.features && planoAtual.features.length > 0) {
      return planoAtual.features;
    }
    return [];
  }, [planoAtual]);


  const [teacherPhone, setTeacherPhone] = useState<string | null>(null);
  const [planosDisponiveis, setPlanosDisponiveis] = useState<any[]>([]);

  useEffect(() => {
    const loadTeacherInfo = async () => {
      if (!student?.teacher_id) return;
      try {
        const { data: profile } = await (supabase as any)
          .from('profiles')
          .select('phone')
          .eq('id', student.teacher_id)
          .single();

        if (profile?.phone) {
          setTeacherPhone(profile.phone);
        }
      } catch (e) {
        console.error('Error loading teacher profile:', e);
      }
    };
    loadTeacherInfo();
  }, [student?.teacher_id]);

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
    if (!student?.teacher_id) return;

    // Buscar dados do plano
    const plano = planosDisponiveis.find(p => p.id === planoId);
    if (!plano) return;

    if (!teacherPhone) {
      toast({
        title: "Contato indisponível",
        description: "O telefone do professor não está cadastrado para contato.",
        variant: "destructive"
      });
      return;
    }

    // Formatar mensagem para WhatsApp
    const message = `Olá! Gostaria de contratar o plano *${plano.name}* no valor de *${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: plano.currency || 'BRL' }).format(plano.price)}*. Como podemos prosseguir?`;

    // Limpar telefone (remover caracteres não numéricos)
    const cleanPhone = teacherPhone.replace(/\D/g, '');

    // Criar link do WhatsApp
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;

    // Abrir em nova aba
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-background pb-safe-4xl">
      {/* Header */}
      <div className="p-4 pt-8 border-b border-border/30">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
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
          <ConnectionStatus />
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
                  {/* Benefício liberado */}
                  {beneficiosEstruturados.liberados.map((beneficio, index) => (
                    <div key={`liberado-${index}`} className="flex items-center gap-3">
                      <div className="w-5 h-5 bg-success/20 rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-success" />
                      </div>
                      <span className="text-sm text-foreground">{beneficio}</span>
                    </div>
                  ))}
                  {/* Benefícios não liberados */}
                  {beneficiosEstruturados.naoLiberados.map((beneficio, index) => (
                    <div key={`nao-liberado-${index}`} className="flex items-center gap-3">
                      <div className="w-5 h-5 bg-destructive/20 rounded-full flex items-center justify-center">
                        <span className="w-3 h-3 text-destructive text-xs font-bold">×</span>
                      </div>
                      <span className="text-sm text-muted-foreground">{beneficio}</span>
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
                      <Badge
                        variant="secondary"
                        className={
                          planoAtual.expirationStatus === 'expired'
                            ? "bg-destructive/20 text-destructive"
                            : planoAtual.expirationStatus === 'expiring_soon'
                              ? "bg-warning/20 text-warning"
                              : "bg-success/20 text-success"
                        }
                      >
                        {planoAtual.status?.toUpperCase?.() || 'ATIVO'}
                      </Badge>
                      {planoAtual.daysRemaining !== undefined && planoAtual.daysRemaining >= 0 && (
                        <Badge variant="outline" className="text-xs">
                          {planoAtual.daysRemaining === 0
                            ? "Vence hoje"
                            : `${planoAtual.daysRemaining} dias restantes`
                          }
                        </Badge>
                      )}
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
                  {isPlanoGratuito ? (
                    <>
                      {/* Benefícios liberados */}
                      {beneficiosEstruturados.liberados.map((beneficio, index) => (
                        <div key={`liberado-${index}`} className="flex items-center gap-3">
                          <div className="w-5 h-5 bg-success/20 rounded-full flex items-center justify-center">
                            <Check className="w-3 h-3 text-success" />
                          </div>
                          <span className="text-sm text-foreground">{beneficio}</span>
                        </div>
                      ))}
                      {/* Benefícios não liberados */}
                      {beneficiosEstruturados.naoLiberados.map((beneficio, index) => (
                        <div key={`nao-liberado-${index}`} className="flex items-center gap-3">
                          <div className="w-5 h-5 bg-destructive/20 rounded-full flex items-center justify-center">
                            <span className="w-3 h-3 text-destructive text-xs font-bold">×</span>
                          </div>
                          <span className="text-sm text-muted-foreground">{beneficio}</span>
                        </div>
                      ))}
                    </>
                  ) : (
                    /* Benefícios de planos pagos */
                    beneficiosPagos.map((beneficio, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div className="w-5 h-5 bg-success/20 rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-success" />
                        </div>
                        <span className="text-sm text-foreground">{beneficio}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </Card>

            {/* Informações de Cobrança - apenas se existir detalhamento */}
            {planoAtual.preco !== '-' && planoAtual.dataRenovacao !== '-' && (
              <Card className={`p-6 ${planoAtual.expirationStatus === 'expiring_soon'
                ? "border-warning/30 bg-warning/5"
                : planoAtual.expirationStatus === 'expired'
                  ? "border-destructive/30 bg-destructive/5"
                  : ""
                }`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${planoAtual.expirationStatus === 'expiring_soon'
                    ? "bg-warning/20"
                    : planoAtual.expirationStatus === 'expired'
                      ? "bg-destructive/20"
                      : "bg-primary/20"
                    }`}>
                    <Calendar className={`w-5 h-5 ${planoAtual.expirationStatus === 'expiring_soon'
                      ? "text-warning"
                      : planoAtual.expirationStatus === 'expired'
                        ? "text-destructive"
                        : "text-primary"
                      }`} />
                  </div>
                  <h2 className="text-lg font-semibold text-foreground">Informações de Cobrança</h2>
                </div>
                <div className="space-y-3">
                  {planoAtual.expirationStatus === 'expiring_soon' && (
                    <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg">
                      <p className="text-sm text-warning font-medium">
                        ⚠️ Seu plano vence em {planoAtual.daysRemaining} dias! Entre em contato com seu professor para renovar.
                      </p>
                    </div>
                  )}
                  {planoAtual.expirationStatus === 'expired' && (
                    <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                      <p className="text-sm text-destructive font-medium">
                        ❌ Seu plano expirou! Entre em contato com seu professor para renovar.
                      </p>
                    </div>
                  )}
                  <div className="flex justify-between items-center py-2 border-b border-border/30">
                    <span className="text-muted-foreground">
                      {planoAtual.expirationStatus === 'expired' ? 'Expirou em' : 'Próxima cobrança'}
                    </span>
                    <span className="text-foreground">{planoAtual.dataRenovacao}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-muted-foreground">Valor</span>
                    <span className="text-foreground font-semibold">{planoAtual.preco}</span>
                  </div>
                  {planoAtual.daysRemaining !== undefined && planoAtual.daysRemaining >= 0 && (
                    <div className="flex justify-between items-center py-2">
                      <span className="text-muted-foreground">Tempo restante</span>
                      <span className={`font-semibold ${planoAtual.expirationStatus === 'expiring_soon'
                        ? "text-warning"
                        : "text-foreground"
                        }`}>
                        {planoAtual.daysRemaining === 0
                          ? "Vence hoje"
                          : `${planoAtual.daysRemaining} dias`
                        }
                      </span>
                    </div>
                  )}
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
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-gradient-primary">Planos Disponíveis</h2>
              <p className="text-muted-foreground">Escolha o plano ideal para acelerar seus resultados</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
              {planosDisponiveis.map((plano) => {
                const iconData = getPlanIcon(plano.icon);
                const IconComponent = iconData.icon;

                return (
                  <Card
                    key={plano.id}
                    className={`group relative overflow-hidden transition-all duration-300 hover-lift max-w-sm mx-auto w-full ${plano.highlighted
                      ? 'card-premium border-primary/30 bg-gradient-to-br from-primary/5 via-background to-accent/5'
                      : 'card-gradient border-border/20 hover:border-primary/20'
                      }`}
                  >
                    {/* Plano Recomendado Badge */}
                    {plano.highlighted && (
                      <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 z-10">
                        <Badge className="badge-premium shadow-glow text-xs px-2 py-1">
                          ⭐ Recomendado
                        </Badge>
                      </div>
                    )}

                    <div className="p-4 pt-6 space-y-4">
                      {/* Header com Ícone */}
                      <div className="text-center space-y-3">
                        <div className={`w-12 h-12 mx-auto rounded-xl ${iconData.bgColor} flex items-center justify-center transition-transform duration-300 group-hover:scale-110`}>
                          <IconComponent className={`w-6 h-6 ${iconData.color}`} />
                        </div>

                        <div className="space-y-1">
                          <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                            {plano.name}
                          </h3>
                          {plano.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {plano.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Preço */}
                      <div className="text-center">
                        <div className="flex items-baseline justify-center gap-1">
                          <span className={`text-2xl font-bold ${plano.highlighted ? 'text-gradient-primary' : 'text-foreground'}`}>
                            {new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: plano.currency || 'BRL'
                            }).format(plano.price)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            /{plano.interval === 'monthly' ? 'mês' : plano.interval === 'yearly' ? 'ano' : plano.interval}
                          </span>
                        </div>
                      </div>

                      {/* Features */}
                      {plano.features && plano.features.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-xs font-semibold text-foreground text-center">
                            Incluído:
                          </h4>
                          <div className="space-y-2 max-h-32 overflow-y-auto scrollbar-thin">
                            {plano.features.slice(0, 4).map((feature: string, index: number) => (
                              <div key={index} className="flex items-start gap-2 group/feature">
                                <div className="w-4 h-4 bg-success/20 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0 transition-transform duration-200 group-hover/feature:scale-110">
                                  <Check className="w-2.5 h-2.5 text-success" />
                                </div>
                                <span className="text-xs text-foreground leading-relaxed flex-1">
                                  {feature}
                                </span>
                              </div>
                            ))}
                            {plano.features.length > 4 && (
                              <p className="text-xs text-muted-foreground text-center">
                                +{plano.features.length - 4} benefícios adicionais
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Botão de Ação */}
                      <div className="pt-2">
                        <Button
                          onClick={() => handleContratarPlano(plano.id)}
                          disabled={checkoutLoading}
                          className={`w-full h-10 text-sm font-semibold transition-all duration-300 ${plano.highlighted
                            ? 'btn-primary animate-glow'
                            : 'btn-secondary hover:btn-primary'
                            }`}
                          size="sm"
                        >
                          {checkoutLoading ? 'Processando...' : 'Contratar Agora'}
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssinaturasPlanos;