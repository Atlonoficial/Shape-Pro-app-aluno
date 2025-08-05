import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from 'recharts';

interface WeightChartProps {
  progress?: any[];
  loading?: boolean;
}

export const WeightChart = ({ progress = [], loading = false }: WeightChartProps) => {
  // Preparar dados do Firebase para o gráfico
  const chartData = progress.length > 0 
    ? progress.slice(-7).map((entry, index) => ({
        day: new Date(entry.date).toLocaleDateString('pt-BR', { weekday: 'short' }),
        weight: entry.weight || 0
      }))
    : [
        { day: 'Seg', weight: 78.5 },
        { day: 'Ter', weight: 78.2 },
        { day: 'Qua', weight: 78.0 },
        { day: 'Qui', weight: 77.8 },
        { day: 'Sex', weight: 77.5 },
      ];
  
  const currentWeight = progress.length > 0 ? progress[progress.length - 1].weight : 77.5;
  const previousWeight = progress.length > 1 ? progress[progress.length - 2].weight : 78.5;
  const weightDiff = currentWeight - previousWeight;
  
  if (loading) {
    return (
      <div className="card-gradient p-6 mb-6 animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="h-6 bg-muted rounded mb-2 w-32"></div>
            <div className="h-4 bg-muted rounded w-20"></div>
          </div>
          <div className="text-right">
            <div className="h-8 bg-muted rounded mb-1 w-16"></div>
            <div className="h-4 bg-muted rounded w-24"></div>
          </div>
        </div>
        <div className="h-32 bg-muted rounded"></div>
      </div>
    );
  }
  return (
    <div className="card-gradient p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Progresso do Peso</h3>
          <p className="text-sm text-muted-foreground">Últimos {chartData.length} dias</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-primary">{currentWeight}kg</p>
          <p className={`text-sm ${weightDiff <= 0 ? 'text-success' : 'text-warning'}`}>
            {weightDiff <= 0 ? weightDiff.toFixed(1) : `+${weightDiff.toFixed(1)}`}kg esta semana
          </p>
        </div>
      </div>
      
      <div className="h-32">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <XAxis 
              dataKey="day" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis hide />
            <Line 
              type="monotone" 
              dataKey="weight" 
              stroke="hsl(var(--primary))" 
              strokeWidth={3}
              dot={{ fill: 'hsl(var(--primary))', strokeWidth: 0, r: 6 }}
              activeDot={{ r: 8, fill: 'hsl(var(--primary))' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};