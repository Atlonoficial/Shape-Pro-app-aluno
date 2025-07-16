import { Target, TrendingUp, Award, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export const Metas = () => {
  const metasAtivas = [
    {
      titulo: "Perder 5kg",
      descricao: "Meta de emagrecimento",
      progresso: 60,
      atual: "3kg perdidos",
      prazo: "30 dias restantes",
      categoria: "peso",
      cor: "success"
    },
    {
      titulo: "Correr 5km",
      descricao: "Resistência cardiovascular",
      progresso: 75,
      atual: "3.8km alcançados",
      prazo: "15 dias restantes",
      categoria: "cardio",
      cor: "primary"
    },
    {
      titulo: "Supino 100kg",
      descricao: "Força no peito",
      progresso: 85,
      atual: "85kg atual",
      prazo: "20 dias restantes",
      categoria: "forca",
      cor: "warning"
    },
    {
      titulo: "Treinar 5x por semana",
      descricao: "Frequência semanal",
      progresso: 80,
      atual: "4 treinos esta semana",
      prazo: "2 dias restantes",
      categoria: "frequencia",
      cor: "accent"
    }
  ];

  const conquistas = [
    {
      titulo: "Primeira Semana",
      descricao: "Complete 7 dias seguidos",
      data: "15/12/2024",
      icone: "🏆"
    },
    {
      titulo: "Força Crescente",
      descricao: "Aumente 10kg no supino",
      data: "10/12/2024",
      icone: "💪"
    },
    {
      titulo: "Resistência",
      descricao: "Corra 3km sem parar",
      data: "05/12/2024",
      icone: "🏃"
    }
  ];

  const estatisticas = [
    { label: "Metas Ativas", valor: "4", icone: Target, cor: "primary" },
    { label: "Conquistas", valor: "12", icone: Award, cor: "warning" },
    { label: "Progresso Médio", valor: "75%", icone: TrendingUp, cor: "success" }
  ];

  return (
    <div className="p-4 pt-8 pb-24">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-2">Metas e Progresso</h1>
        <p className="text-sm text-muted-foreground">Acompanhe seu desenvolvimento</p>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {estatisticas.map((stat, index) => (
          <Card key={index} className="card-gradient p-4 border border-border/50">
            <div className="text-center">
              <stat.icone size={20} className={`text-${stat.cor} mx-auto mb-2`} />
              <div className="text-lg font-bold text-foreground">{stat.valor}</div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </div>
          </Card>
        ))}
      </div>

      {/* Botão Adicionar Meta */}
      <div className="mb-6">
        <Button className="btn-primary w-full">
          <Plus size={18} className="mr-2" />
          Adicionar Nova Meta
        </Button>
      </div>

      {/* Metas Ativas */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Metas Ativas</h3>
          <span className="text-sm text-muted-foreground">{metasAtivas.length} metas</span>
        </div>
        
        {metasAtivas.map((meta, index) => (
          <Card key={index} className="card-gradient p-6 border border-border/50">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h4 className="font-semibold text-foreground text-lg">{meta.titulo}</h4>
                <p className="text-sm text-muted-foreground">{meta.descricao}</p>
              </div>
              <div className={`w-12 h-12 bg-gradient-to-br from-${meta.cor} to-${meta.cor}/80 rounded-full flex items-center justify-center`}>
                <Target size={20} className="text-white" />
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progresso</span>
                <span className="font-medium text-foreground">{meta.progresso}%</span>
              </div>
              
              <Progress value={meta.progresso} className="h-2" />
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{meta.atual}</span>
                <span className="text-warning">{meta.prazo}</span>
              </div>
            </div>
            
            <div className="flex gap-2 mt-4">
              <Button size="sm" variant="outline" className="flex-1">
                Editar
              </Button>
              <Button size="sm" className="btn-primary flex-1">
                Atualizar
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Conquistas */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold text-foreground mb-4">Conquistas Recentes</h3>
        
        <div className="space-y-3">
          {conquistas.map((conquista, index) => (
            <Card key={index} className="card-gradient p-4 border border-border/50">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gradient-to-br from-warning to-warning/80 rounded-full flex items-center justify-center">
                  <span className="text-lg">{conquista.icone}</span>
                </div>
                
                <div className="flex-1">
                  <h4 className="font-medium text-foreground">{conquista.titulo}</h4>
                  <p className="text-sm text-muted-foreground">{conquista.descricao}</p>
                </div>
                
                <div className="text-right">
                  <span className="text-xs text-muted-foreground">{conquista.data}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Dica Motivacional */}
      <Card className="card-gradient p-4 mt-6 border border-primary/20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary-variant rounded-full flex items-center justify-center">
            <span className="text-sm">💡</span>
          </div>
          <div>
            <h4 className="font-medium text-foreground">Dica do Coach</h4>
            <p className="text-sm text-muted-foreground">
              Defina metas específicas e mensuráveis. O progresso acontece um passo de cada vez!
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};