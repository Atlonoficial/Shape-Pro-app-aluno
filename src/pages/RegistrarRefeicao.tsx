import { Plus, Apple, Clock, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const RegistrarRefeicao = () => {
  const refeicoesDoDia = [
    { 
      nome: "Café da Manhã", 
      horario: "07:30", 
      calorias: 450, 
      status: "concluido",
      alimentos: ["Aveia", "Banana", "Whey Protein"]
    },
    { 
      nome: "Lanche da Manhã", 
      horario: "10:00", 
      calorias: 200, 
      status: "concluido",
      alimentos: ["Maçã", "Castanhas"]
    },
    { 
      nome: "Almoço", 
      horario: "12:30", 
      calorias: 650, 
      status: "pendente",
      alimentos: []
    },
    { 
      nome: "Lanche da Tarde", 
      horario: "15:30", 
      calorias: 300, 
      status: "pendente",
      alimentos: []
    },
    { 
      nome: "Jantar", 
      horario: "19:00", 
      calorias: 550, 
      status: "pendente",
      alimentos: []
    }
  ];

  const metaDiaria = 2150;
  const consumido = refeicoesDoDia
    .filter(r => r.status === "concluido")
    .reduce((total, r) => total + r.calorias, 0);

  return (
    <div className="p-4 pt-8 pb-24">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-2">Controle Nutricional</h1>
        <p className="text-sm text-muted-foreground">Registre suas refeições de hoje</p>
      </div>

      {/* Resumo Calórico */}
      <Card className="card-gradient p-6 mb-6 border border-warning/20">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Meta Calórica</h3>
            <p className="text-sm text-muted-foreground">{consumido} / {metaDiaria} kcal</p>
          </div>
          <div className="w-16 h-16 bg-gradient-to-br from-warning to-warning/80 rounded-full flex items-center justify-center">
            <Target size={24} className="text-white" />
          </div>
        </div>
        
        <div className="w-full bg-muted rounded-full h-3 mb-4">
          <div 
            className="bg-gradient-to-r from-warning to-warning/80 h-3 rounded-full transition-all duration-300"
            style={{ width: `${Math.min((consumido / metaDiaria) * 100, 100)}%` }}
          ></div>
        </div>
        
        <div className="text-center">
          <span className="text-sm font-medium text-foreground">
            Restam {metaDiaria - consumido} kcal
          </span>
        </div>
      </Card>

      {/* Refeições do Dia */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Refeições de Hoje</h3>
          <Button size="sm" className="btn-primary">
            <Plus size={16} className="mr-1" />
            Adicionar
          </Button>
        </div>
        
        {refeicoesDoDia.map((refeicao, index) => (
          <Card key={index} className="card-gradient p-4 border border-border/50">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-foreground">{refeicao.nome}</h4>
                  <div className="flex items-center gap-1">
                    <Clock size={14} className="text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{refeicao.horario}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <span className="text-sm text-warning font-medium">{refeicao.calorias} kcal</span>
                  {refeicao.status === "concluido" && (
                    <span className="text-xs bg-success/10 text-success px-2 py-1 rounded-full">
                      Concluído
                    </span>
                  )}
                </div>
                
                {refeicao.alimentos.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-muted-foreground">
                      {refeicao.alimentos.join(", ")}
                    </p>
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                {refeicao.status === "concluido" ? (
                  <Apple size={20} className="text-success" />
                ) : (
                  <Button size="sm" variant="outline">
                    Registrar
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Dicas Nutricionais */}
      <Card className="card-gradient p-4 mt-6 border border-accent/20">
        <h4 className="font-medium text-foreground mb-2">💡 Dica do Dia</h4>
        <p className="text-sm text-muted-foreground">
          Mantenha-se hidratado! Beba pelo menos 2 litros de água ao longo do dia.
        </p>
      </Card>
    </div>
  );
};