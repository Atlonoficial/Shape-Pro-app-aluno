import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, TrendingUp, Scale, Ruler, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { NewAssessmentDialog } from "@/components/physical-assessment/NewAssessmentDialog";

interface PhysicalAssessment {
  id: string;
  date: string;
  weight: number;
  body_fat: number;
  muscle_mass: number;
  height: number;
  created_at: string;
}

export const AvaliacoesFisicas = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [assessments, setAssessments] = useState<PhysicalAssessment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAssessments = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      // Buscar avaliações físicas da tabela progress com filtro por tipo
      const { data, error } = await supabase
        .from("progress")
        .select("*")
        .eq("user_id", user.id)
        .eq("type", "physical_assessment")
        .order("date", { ascending: false });

      if (error) throw error;
      
      // Agrupar dados por data para formar avaliações completas
      const groupedData = (data || []).reduce((acc: any, item: any) => {
        const dateKey = item.date.split('T')[0];
        if (!acc[dateKey]) {
          acc[dateKey] = { 
            id: dateKey, 
            date: dateKey, 
            created_at: item.created_at 
          };
        }
        
        if (item.notes === 'weight') {
          acc[dateKey].weight = item.value;
        } else if (item.notes === 'body_fat') {
          acc[dateKey].body_fat = item.value;
        } else if (item.notes === 'muscle_mass') {
          acc[dateKey].muscle_mass = item.value;
        } else if (item.notes === 'height') {
          acc[dateKey].height = item.value;
        }
        
        return acc;
      }, {});

      setAssessments(Object.values(groupedData));
    } catch (error) {
      console.error("Erro ao buscar avaliações:", error);
      toast.error("Erro ao carregar avaliações físicas");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchAssessments();
  }, [fetchAssessments]);

  // Preparar dados para o gráfico de peso
  const weightData = assessments
    .filter(a => a.weight)
    .map(a => ({
      date: new Date(a.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      weight: a.weight
    }))
    .reverse();

  const latestAssessment = assessments[0];

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
          <span className="ml-auto text-xs bg-warning/20 text-warning px-2 py-1 rounded-full font-medium">
            {assessments.length}
          </span>
        </div>
      </div>

      <div className="p-4">
        {/* Weight Chart */}
        {weightData.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Evolução do Peso
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weightData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="weight" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={{ fill: "hsl(var(--primary))" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Info Banner */}
        <Card className="mb-4 bg-primary/10 border-primary/20">
          <CardContent className="p-4">
            <p className="text-primary text-sm">
              Suas métricas estão sendo enviadas em tempo real ao seu professor.
            </p>
          </CardContent>
        </Card>

        {/* Add Assessment Button */}
        <div className="mb-6">
          <NewAssessmentDialog onAssessmentCreated={fetchAssessments} />
        </div>

        {/* Historical Assessments */}
        <h2 className="text-lg font-semibold mb-3">Histórico de Avaliações</h2>
        
        {loading ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              Carregando avaliações...
            </CardContent>
          </Card>
        ) : assessments.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhuma avaliação física registrada.</p>
              <p className="text-sm text-muted-foreground mt-2">
                Aguarde seu professor adicionar suas avaliações.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {assessments.map((assessment) => (
              <Card key={assessment.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-foreground">
                      {new Date(assessment.date).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit", 
                        year: "numeric"
                      })}
                    </h3>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {assessment.weight && (
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <Scale className="w-4 h-4 text-primary" />
                          <span className="text-sm text-muted-foreground">Peso</span>
                        </div>
                        <p className="font-semibold text-foreground">{assessment.weight} kg</p>
                      </div>
                    )}
                    
                    {assessment.body_fat && (
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <Activity className="w-4 h-4 text-primary" />
                          <span className="text-sm text-muted-foreground">% Gordura</span>
                        </div>
                        <p className="font-semibold text-foreground">{assessment.body_fat}%</p>
                      </div>
                    )}
                    
                    {assessment.muscle_mass && (
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <TrendingUp className="w-4 h-4 text-primary" />
                          <span className="text-sm text-muted-foreground">Massa Magra</span>
                        </div>
                        <p className="font-semibold text-foreground">{assessment.muscle_mass} kg</p>
                      </div>
                    )}
                    
                    {assessment.height && (
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <Ruler className="w-4 h-4 text-primary" />
                          <span className="text-sm text-muted-foreground">Altura</span>
                        </div>
                        <p className="font-semibold text-foreground">{assessment.height} cm</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};