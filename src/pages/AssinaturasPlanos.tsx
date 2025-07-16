import { CreditCard, Check, Crown, Star, Calendar, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";

export const AssinaturasPlanos = () => {
  const navigate = useNavigate();

  const planos = [
    {
      id: "basico",
      nome: "Básico",
      preco: 29.90,
      periodo: "mês",
      descricao: "Ideal para iniciantes",
      recursos: [
        "Treinos básicos",
        "Acompanhamento nutricional",
        "Chat com IA limitado",
        "Relatórios mensais"
      ],
      cor: "secondary",
      popular: false
    },
    {
      id: "premium",
      nome: "Premium",
      preco: 59.90,
      periodo: "mês", 
      descricao: "Mais completo e personalizado",
      recursos: [
        "Treinos personalizados",
        "Acompanhamento nutricional completo",
        "Chat com IA ilimitado",
        "Relatórios semanais",
        "Agendamento com personal",
        "Acesso a lives exclusivas"
      ],
      cor: "primary",
      popular: true
    },
    {
      id: "enterprise",
      nome: "Enterprise", 
      preco: 99.90,
      periodo: "mês",
      descricao: "Para atletas e profissionais",
      recursos: [
        "Todos os recursos Premium",
        "Personal trainer dedicado",
        "Análises biométricas avançadas",
        "Suporte prioritário 24/7",
        "Acesso a eventos exclusivos",
        "Consultoria nutricional especializada"
      ],
      cor: "warning",
      popular: false
    }
  ];

  const assinatura = {
    planoAtual: "Premium",
    status: "ativa",
    proximaCobranca: "15/01/2025",
    valor: 59.90,
    cartao: "**** **** **** 4532",
    bandeira: "Visa"
  };

  const historico = [
    {
      data: "15/12/2024",
      plano: "Premium",
      valor: 59.90,
      status: "pago",
      metodo: "Cartão *4532"
    },
    {
      data: "15/11/2024", 
      plano: "Premium",
      valor: 59.90,
      status: "pago",
      metodo: "Cartão *4532"
    },
    {
      data: "15/10/2024",
      plano: "Básico",
      valor: 29.90,
      status: "pago", 
      metodo: "Cartão *4532"
    },
    {
      data: "15/09/2024",
      plano: "Básico",
      valor: 29.90,
      status: "pago",
      metodo: "Cartão *4532"
    }
  ];

  return (
    <div className="p-4 pt-8 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="p-2"
        >
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Assinaturas & Planos</h1>
          <p className="text-sm text-muted-foreground">Gerencie sua assinatura e pagamentos</p>
        </div>
      </div>

      <Tabs defaultValue="assinatura" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="assinatura">Minha Assinatura</TabsTrigger>
          <TabsTrigger value="planos">Planos</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
        </TabsList>

        {/* Minha Assinatura */}
        <TabsContent value="assinatura" className="space-y-6">
          {/* Status da Assinatura */}
          <Card className="card-gradient p-6 border border-primary/20">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Crown size={24} className="text-primary" />
                  <h3 className="text-lg font-semibold text-foreground">Plano {assinatura.planoAtual}</h3>
                  <Badge className="bg-success/10 text-success">Ativo</Badge>
                </div>
                <p className="text-muted-foreground">Sua assinatura está ativa e funcionando perfeitamente</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">R$ {assinatura.valor}</div>
                <div className="text-sm text-muted-foreground">por mês</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="text-sm text-muted-foreground">Próxima cobrança</label>
                <div className="flex items-center gap-1 mt-1">
                  <Calendar size={16} className="text-primary" />
                  <span className="font-medium text-foreground">{assinatura.proximaCobranca}</span>
                </div>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Método de pagamento</label>
                <div className="flex items-center gap-1 mt-1">
                  <CreditCard size={16} className="text-primary" />
                  <span className="font-medium text-foreground">{assinatura.cartao}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button className="btn-primary flex-1">
                Alterar Plano
              </Button>
              <Button variant="outline" className="flex-1">
                Gerenciar Cartão
              </Button>
            </div>
          </Card>

          {/* Método de Pagamento */}
          <Card className="card-gradient p-6 border border-border/50">
            <h3 className="text-lg font-semibold text-foreground mb-4">Método de Pagamento</h3>
            
            <div className="flex items-center justify-between p-4 bg-card rounded-lg border border-border/50 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-6 bg-gradient-to-r from-blue-600 to-blue-800 rounded flex items-center justify-center">
                  <span className="text-xs font-bold text-white">VISA</span>
                </div>
                <div>
                  <div className="font-medium text-foreground">{assinatura.cartao}</div>
                  <div className="text-sm text-muted-foreground">Expira em 12/27</div>
                </div>
              </div>
              <Badge variant="outline" className="text-success border-success">Principal</Badge>
            </div>

            <Button variant="outline" className="w-full">
              <CreditCard size={16} className="mr-2" />
              Adicionar Novo Cartão
            </Button>
          </Card>

          {/* Ações Rápidas */}
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="p-4 h-auto">
              <div className="text-center">
                <Star size={20} className="mx-auto mb-2 text-warning" />
                <div className="font-medium">Upgrade</div>
                <div className="text-xs text-muted-foreground">Melhorar plano</div>
              </div>
            </Button>
            <Button variant="outline" className="p-4 h-auto">
              <div className="text-center">
                <Calendar size={20} className="mx-auto mb-2 text-primary" />
                <div className="font-medium">Pausar</div>
                <div className="text-xs text-muted-foreground">Suspender temporariamente</div>
              </div>
            </Button>
          </div>
        </TabsContent>

        {/* Planos Disponíveis */}
        <TabsContent value="planos" className="space-y-4">
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold text-foreground mb-2">Escolha o melhor plano para você</h3>
            <p className="text-sm text-muted-foreground">Você pode alterar seu plano a qualquer momento</p>
          </div>

          {planos.map((plano) => (
            <Card 
              key={plano.id} 
              className={`card-gradient p-6 border transition-all relative ${
                plano.popular ? 'border-primary/50 shadow-lg' : 'border-border/50'
              } ${assinatura.planoAtual === plano.nome ? 'bg-primary/5' : ''}`}
            >
              {plano.popular && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-white">
                  Mais Popular
                </Badge>
              )}
              
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="text-xl font-bold text-foreground flex items-center gap-2">
                    {plano.nome}
                    {assinatura.planoAtual === plano.nome && (
                      <Badge variant="outline" className="text-success border-success">Atual</Badge>
                    )}
                  </h4>
                  <p className="text-muted-foreground">{plano.descricao}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-foreground">
                    R$ {plano.preco}
                  </div>
                  <div className="text-sm text-muted-foreground">por {plano.periodo}</div>
                </div>
              </div>

              <div className="space-y-2 mb-6">
                {plano.recursos.map((recurso, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Check size={16} className="text-success" />
                    <span className="text-sm text-foreground">{recurso}</span>
                  </div>
                ))}
              </div>

              <Button 
                className={`w-full ${
                  assinatura.planoAtual === plano.nome 
                    ? 'btn-secondary' 
                    : plano.popular 
                    ? 'btn-primary' 
                    : 'btn-outline'
                }`}
                disabled={assinatura.planoAtual === plano.nome}
              >
                {assinatura.planoAtual === plano.nome ? 'Plano Atual' : 'Selecionar Plano'}
              </Button>
            </Card>
          ))}
        </TabsContent>

        {/* Histórico de Pagamentos */}
        <TabsContent value="historico" className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Histórico de Pagamentos</h3>
          
          {historico.map((item, index) => (
            <Card key={index} className="card-gradient p-4 border border-border/50">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-foreground">Plano {item.plano}</h4>
                    <Badge 
                      className={`${
                        item.status === 'pago' 
                          ? 'bg-success/10 text-success' 
                          : 'bg-destructive/10 text-destructive'
                      }`}
                    >
                      {item.status === 'pago' ? 'Pago' : 'Pendente'}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{item.data}</span>
                    <span>{item.metodo}</span>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="font-bold text-foreground">R$ {item.valor}</div>
                  <Button variant="ghost" size="sm" className="text-xs p-1 h-auto">
                    Ver detalhes
                  </Button>
                </div>
              </div>
            </Card>
          ))}

          <div className="text-center py-4">
            <Button variant="outline">
              Carregar mais histórico
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};