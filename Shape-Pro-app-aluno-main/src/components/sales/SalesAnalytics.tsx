import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, DollarSign, Users, CreditCard } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/components/auth/AuthProvider';

export const SalesAnalytics: React.FC = () => {
  const { user } = useAuthContext();

  const { data: salesData, isLoading } = useQuery({
    queryKey: ['sales-analytics', user?.id],
    queryFn: async () => {
      if (!user) return null;

      // Buscar transações dos últimos 30 dias
      const { data: transactions } = await supabase
        .from('payment_transactions')
        .select('*')
        .eq('teacher_id', user.id)
        .eq('status', 'paid')
        .gte('paid_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('paid_at', { ascending: false });

      return transactions || [];
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000 // 5 minutos
  });

  // Processar dados para gráficos
  const processedData = React.useMemo(() => {
    if (!salesData) return { daily: [], monthly: [], byGateway: [], metrics: {} };

    const daily = salesData.reduce((acc: any[], transaction) => {
      const date = new Date(transaction.paid_at!).toLocaleDateString('pt-BR');
      const existing = acc.find(item => item.date === date);
      
      if (existing) {
        existing.amount += Number(transaction.amount);
        existing.count += 1;
      } else {
        acc.push({
          date,
          amount: Number(transaction.amount),
          count: 1
        });
      }
      
      return acc;
    }, []);

    const byGateway = salesData.reduce((acc: any[], transaction) => {
      const gateway = transaction.gateway_type;
      const existing = acc.find(item => item.name === gateway);
      
      if (existing) {
        existing.value += Number(transaction.amount);
        existing.count += 1;
      } else {
        acc.push({
          name: gateway,
          value: Number(transaction.amount),
          count: 1
        });
      }
      
      return acc;
    }, []);

    const metrics = {
      totalRevenue: salesData.reduce((sum, t) => sum + Number(t.amount), 0),
      totalTransactions: salesData.length,
      uniqueStudents: new Set(salesData.map(t => t.student_id)).size,
      avgTransactionValue: salesData.length > 0 ? 
        salesData.reduce((sum, t) => sum + Number(t.amount), 0) / salesData.length : 0
    };

    return { daily, byGateway, metrics };
  }, [salesData]);

  const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00'];

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {(processedData.metrics as any)?.totalRevenue?.toFixed(2) || '0.00'}
            </div>
            <p className="text-xs text-muted-foreground">Últimos 30 dias</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transações</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(processedData.metrics as any)?.totalTransactions || 0}
            </div>
            <p className="text-xs text-muted-foreground">Total de vendas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alunos Únicos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(processedData.metrics as any)?.uniqueStudents || 0}
            </div>
            <p className="text-xs text-muted-foreground">Compradores diferentes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {(processedData.metrics as any)?.avgTransactionValue?.toFixed(2) || '0.00'}
            </div>
            <p className="text-xs text-muted-foreground">Por transação</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Vendas por Dia</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={processedData.daily}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => [`R$ ${Number(value).toFixed(2)}`, 'Valor']}
                />
                <Bar dataKey="amount" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Vendas por Gateway</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={processedData.byGateway}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: R$ ${Number(value).toFixed(0)}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {processedData.byGateway.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `R$ ${Number(value).toFixed(2)}`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Lista de transações recentes */}
      <Card>
        <CardHeader>
          <CardTitle>Transações Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {salesData?.slice(0, 10).map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Aluno</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(transaction.paid_at!).toLocaleDateString('pt-BR')} • {transaction.gateway_type}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">R$ {Number(transaction.amount).toFixed(2)}</p>
                  <p className="text-sm text-green-600">Pago</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};