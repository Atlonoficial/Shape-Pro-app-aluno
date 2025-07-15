import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from 'recharts';

const data = [
  { day: 'Seg', weight: 78.5 },
  { day: 'Ter', weight: 78.2 },
  { day: 'Qua', weight: 78.0 },
  { day: 'Qui', weight: 77.8 },
  { day: 'Sex', weight: 77.5 },
];

export const WeightChart = () => {
  return (
    <div className="card-gradient p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Progresso do Peso</h3>
          <p className="text-sm text-muted-foreground">Últimos 5 dias</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-primary">77.5kg</p>
          <p className="text-sm text-success">-1.0kg esta semana</p>
        </div>
      </div>
      
      <div className="h-32">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
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