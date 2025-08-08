import { useState, useEffect } from "react";
import { ArrowLeft, Plus, TrendingUp, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { useAuth } from "@/hooks/useAuth";
import { addPhysicalAssessment, getPhysicalAssessmentsByUser, PhysicalAssessment } from "@/lib/firestore";
import { Input } from "@/components/ui/input";
import { Timestamp } from "firebase/firestore";

export const AvaliacoesFisicas = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [avaliacoes, setAvaliacoes] = useState<PhysicalAssessment[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [data, setData] = useState("");
  const [peso, setPeso] = useState("");
  const [gordura, setGordura] = useState("");
  const [massaMagra, setMassaMagra] = useState("");
  const [cintura, setCintura] = useState("");
  const [quadril, setQuadril] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user?.uid) return;
    const unsub = getPhysicalAssessmentsByUser(user.uid, setAvaliacoes);
    return () => unsub();
  }, [user?.uid]);

  const chartData = avaliacoes
    .slice()
    .reverse()
    .map(item => ({
      data: item.date.toDate().toLocaleDateString('pt-BR').slice(0,5),
      peso: item.weight
    }));

  const handleNovaAvaliacao = () => setShowForm((s) => !s);

  const handleSalvar = async () => {
    if (!user?.uid) return;
    if (!data || !peso) {
      toast({ title: 'Campos obrigatórios', description: 'Preencha data e peso.', variant: 'destructive' });
      return;
    }
    try {
      setSaving(true);
      await addPhysicalAssessment({
        userId: user.uid,
        date: Timestamp.fromDate(new Date(data)),
        weight: parseFloat(peso),
        bodyFat: gordura ? parseFloat(gordura) : undefined,
        muscleMass: massaMagra ? parseFloat(massaMagra) : undefined,
        waist: cintura ? parseFloat(cintura) : undefined,
        hip: quadril ? parseFloat(quadril) : undefined,
        notes: undefined
      });
      toast({ title: 'Avaliação salva', description: 'Seus dados foram enviados ao professor.' });
      setShowForm(false);
      setData(''); setPeso(''); setGordura(''); setMassaMagra(''); setCintura(''); setQuadril('');
    } catch (e: any) {
      toast({ title: 'Erro ao salvar', description: e.message || 'Tente novamente', variant: 'destructive' });
    } finally {
      setSaving(false);
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

        {/* Form Nova Avaliação */}
        {showForm && (
          <Card className="p-4 bg-card/50 border-border/50">
            <div className="grid grid-cols-2 gap-3">
              <Input type="date" value={data} onChange={(e) => setData(e.target.value)} />
              <Input placeholder="Peso (kg)" value={peso} onChange={(e) => setPeso(e.target.value)} />
              <Input placeholder="% Gordura (opcional)" value={gordura} onChange={(e) => setGordura(e.target.value)} />
              <Input placeholder="Massa magra (kg)" value={massaMagra} onChange={(e) => setMassaMagra(e.target.value)} />
              <Input placeholder="Cintura (cm)" value={cintura} onChange={(e) => setCintura(e.target.value)} />
              <Input placeholder="Quadril (cm)" value={quadril} onChange={(e) => setQuadril(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2 mt-3">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button onClick={handleSalvar} disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button>
            </div>
          </Card>
        )}

        {/* Avaliações List */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Histórico de Avaliações</h3>
          {avaliacoes.map((avaliacao) => (
            <Card key={avaliacao.id} className="p-4 bg-card/50 border-border/50">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-foreground">{avaliacao.date.toDate().toLocaleDateString('pt-BR')}</h4>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Peso:</span>
                    <span className="font-medium text-accent">{avaliacao.weight} kg</span>
                  </div>
                  {avaliacao.bodyFat !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">% Gordura:</span>
                      <span className="font-medium text-foreground">{avaliacao.bodyFat}%</span>
                    </div>
                  )}
                  {avaliacao.muscleMass !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Massa Magra:</span>
                      <span className="font-medium text-foreground">{avaliacao.muscleMass} kg</span>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  {avaliacao.waist !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Cintura:</span>
                      <span className="font-medium text-foreground">{avaliacao.waist} cm</span>
                    </div>
                  )}
                  {avaliacao.hip !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Quadril:</span>
                      <span className="font-medium text-foreground">{avaliacao.hip} cm</span>
                    </div>
                  )}
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