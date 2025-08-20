import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { useWeightProgress } from '@/hooks/useWeightProgress';
import { useAuthContext } from '@/components/auth/AuthProvider';

interface WeightChartProps {
  onWeightNeeded?: () => void;
}

export const WeightChart = ({ onWeightNeeded }: WeightChartProps) => {
  const { user } = useAuthContext();
  const { weightData, loading } = useWeightProgress(user?.id || '');
  
  // Use only real data
  const chartData = weightData;
  
  const currentWeight = chartData.length > 0 ? chartData[chartData.length - 1].weight : 0;
  const previousWeight = chartData.length > 1 ? chartData[chartData.length - 2].weight : 0;
  const weightDiff = currentWeight - previousWeight;
  
  // Custom label renderer for weight values on top of bars
  const renderCustomLabel = (props: any) => {
    const { x, y, width, value } = props;
    return (
      <text 
        x={x + width / 2} 
        y={y - 5} 
        fill="hsl(var(--primary))" 
        textAnchor="middle" 
        fontSize="12" 
        fontWeight="600"
      >
        {value}kg
      </text>
    );
  };
  
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
        <div className="h-40 bg-muted rounded"></div>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="card-gradient p-6 mb-6 text-center">
        <h3 className="text-lg font-semibold text-foreground mb-2">Evolução do Peso</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Registre seu peso todas as sextas-feiras para ver sua evolução!
        </p>
        <button 
          onClick={onWeightNeeded}
          className="btn-primary text-sm px-4 py-2"
        >
          Registrar Primeiro Peso
        </button>
      </div>
    );
  }
  return (
    <div className="card-gradient p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Evolução do Peso</h3>
          <p className="text-sm text-muted-foreground">Últimas {chartData.length} semanas</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-primary">{currentWeight}kg</p>
          {previousWeight > 0 && (
            <p className={`text-sm ${weightDiff <= 0 ? 'text-success' : 'text-warning'}`}>
              {weightDiff <= 0 ? weightDiff.toFixed(1) : `+${weightDiff.toFixed(1)}`}kg vs anterior
            </p>
          )}
        </div>
      </div>
      
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 20, right: 5, left: 5, bottom: 5 }}>
            <XAxis 
              dataKey="date" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis hide />
            <Bar 
              dataKey="weight" 
              radius={[8, 8, 0, 0]}
            >
              <LabelList content={renderCustomLabel} />
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={`hsl(var(--primary) / ${0.7 + (index * 0.1)})`}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};