import { Play, Clock, Target, CheckCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

export const IniciarTreino = () => {
  const navigate = useNavigate();

  const exercicios = [
    { nome: "Supino Reto", series: "4x12", peso: "80kg", concluido: false },
    { nome: "Supino Inclinado", series: "3x10", peso: "70kg", concluido: false },
    { nome: "Crucifixo", series: "3x12", peso: "30kg", concluido: false },
    { nome: "Tríceps Testa", series: "4x10", peso: "40kg", concluido: false },
    { nome: "Tríceps Corda", series: "3x12", peso: "25kg", concluido: false },
  ];

  return (
    <div className="p-4 pt-8 pb-24">
      {/* Header com botão de volta */}
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/")}
          className="p-2"
        >
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Treino de Hoje</h1>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Target size={16} className="text-primary" />
              <span>PEITO & TRÍCEPS</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock size={16} className="text-warning" />
              <span>45 min</span>
            </div>
          </div>
        </div>
      </div>

      {/* Status Card */}
      <Card className="card-gradient p-6 mb-6 border border-primary/20">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Status do Treino</h3>
            <p className="text-sm text-muted-foreground">0 de {exercicios.length} exercícios concluídos</p>
          </div>
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary-variant rounded-full flex items-center justify-center">
            <Play size={24} className="text-white ml-1" />
          </div>
        </div>
        
        <Button className="btn-primary w-full">
          <Play size={18} className="mr-2" />
          Iniciar Treino
        </Button>
      </Card>

      {/* Lista de Exercícios */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Exercícios</h3>
        
        {exercicios.map((exercicio, index) => (
          <Card key={index} className="card-gradient p-4 border border-border/50">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h4 className="font-medium text-foreground">{exercicio.nome}</h4>
                <div className="flex items-center gap-4 mt-1">
                  <span className="text-sm text-muted-foreground">Séries: {exercicio.series}</span>
                  <span className="text-sm text-muted-foreground">Peso: {exercicio.peso}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {exercicio.concluido ? (
                  <CheckCircle size={24} className="text-success" />
                ) : (
                  <div className="w-6 h-6 border-2 border-muted rounded-full"></div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Botão Finalizar */}
      <div className="mt-8">
        <Button variant="outline" className="w-full">
          Finalizar Treino
        </Button>
      </div>
    </div>
  );
};