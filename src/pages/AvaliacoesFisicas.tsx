import { useState } from "react";
import { ArrowLeft, Plus, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from "recharts";

interface Avaliacao {
  id: number;
  data: string;
  peso: number;
  gordura: number;
  massaMagra: number;
  cintura: number;
  quadril: number;
}

const avaliacoesData: Avaliacao[] = [
  {
    id: 1,
    data: "15/01/2024",
    peso: 72.5,
    gordura: 18.2,
    massaMagra: 59.3,
    cintura: 78,
    quadril: 95
  },
  {
    id: 2,
    data: "01/01/2024", 
    peso: 74.0,
    gordura: 19.1,
    massaMagra: 59.8,
    cintura: 80,
    quadril: 97
  },
  {
    id: 3,
    data: "15/12/2023",
    peso: 75.2,
    gordura: 20.5,
    massaMagra: 59.7,
    cintura: 82,
    quadril: 99
  }
];

const chartData = avaliacoesData.map(item => ({
  data: item.data.slice(0, 5),
  peso: item.peso
})).reverse();

export const AvaliacoesFisicas = () => {
  const navigate = useNavigate();
  const [avaliacoes] = useState<Avaliacao[]>(avaliacoesData);

  const handleNovaAvaliacao = () => {
    toast({
      title: "Nova avaliação",
      description: "Funcionalidade de adicionar avaliação em desenvolvimento.",
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
            onClick={() => navigate("/?tab=profile")}
            className="text-foreground"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold text-foreground">Avaliações Físicas</h1>
          <Badge variant="secondary" className="bg-primary/10 text-primary">
            {avaliacoes.length}
          </Badge>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Weight Chart */}
        <Card className="p-6 bg-card/50 border-border/50">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-accent" />
            <h2 className="text-lg font-semibold text-foreground">Evolução do Peso</h2>
          </div>
          
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis 
                  dataKey="data" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="peso" 
                  stroke="hsl(var(--accent))" 
                  strokeWidth={3}
                  dot={{ fill: 'hsl(var(--accent))', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Info Message */}
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
          <p className="text-primary text-sm font-medium">
            Suas métricas serão enviadas em tempo real ao seu professor.
          </p>
        </div>

        {/* Avaliações List */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Histórico de Avaliações</h3>
          
          {avaliacoes.map((avaliacao) => (
            <Card key={avaliacao.id} className="p-4 bg-card/50 border-border/50">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-foreground">{avaliacao.data}</h4>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Peso:</span>
                    <span className="font-medium text-accent">{avaliacao.peso} kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">% Gordura:</span>
                    <span className="font-medium text-foreground">{avaliacao.gordura}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Massa Magra:</span>
                    <span className="font-medium text-foreground">{avaliacao.massaMagra} kg</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cintura:</span>
                    <span className="font-medium text-foreground">{avaliacao.cintura} cm</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Quadril:</span>
                    <span className="font-medium text-foreground">{avaliacao.quadril} cm</span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Floating Action Button */}
      <Button
        onClick={handleNovaAvaliacao}
        className="fixed bottom-20 right-4 w-14 h-14 rounded-full btn-accent shadow-lg"
        size="icon"
      >
        <Plus className="w-6 h-6" />
      </Button>
    </div>
  );
};