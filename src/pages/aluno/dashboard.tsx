import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useMyData } from '@/hooks/useMyData';
import { useMyTrainings } from '@/hooks/useMyTrainings';
import { useFCMTokens } from '@/hooks/useFCMTokens';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  User, 
  Dumbbell, 
  Calendar, 
  Trophy, 
  Bell,
  PlayCircle,
  Clock,
  Target
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Navigate } from 'react-router-dom';

/**
 * Dashboard Principal do Aluno
 * 
 * FUNCIONALIDADES:
 * - Exibe perfil do aluno usando useMyData()
 * - Lista treinos atribuídos com useMyTrainings()
 * - Registra token FCM automaticamente com useFCMTokens()
 * - Cards com métricas de progresso
 * - Acesso rápido a treinos e funcionalidades
 * 
 * ROTEAMENTO:
 * - Adicionar em App.tsx: <Route path="/aluno/dashboard" element={<AlunoDashboard />} />
 * - Proteger com AuthGuard para usuários autenticados
 */

export default function AlunoDashboard() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const { student, trainings: assignedTrainings, loading: dataLoading, error: dataError } = useMyData(user?.uid);
  const { trainings: myTrainings, loading: trainingsLoading, error: trainingsError } = useMyTrainings(user?.uid);
  const { requestPermission, permission, error: fcmError } = useFCMTokens();
  const { toast } = useToast();

  // Redirecionar se não autenticado
  if (authLoading) {
    return <DashboardSkeleton />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Registrar token FCM ao carregar dashboard
  useEffect(() => {
    if (user && permission !== 'granted') {
      requestPermission().then((success) => {
        if (success) {
          toast({
            title: "Notificações ativadas",
            description: "Você receberá notificações sobre novos treinos e mensagens.",
          });
        }
      });
    }
  }, [user, permission, requestPermission]);

  // Mostrar erros se houver
  useEffect(() => {
    if (dataError || trainingsError || fcmError) {
      toast({
        title: "Erro ao carregar dados",
        description: dataError || trainingsError || fcmError || "Erro desconhecido",
        variant: "destructive"
      });
    }
  }, [dataError, trainingsError, fcmError]);

  const loading = dataLoading || trainingsLoading;

  return (
    <div className="min-h-screen bg-background p-4 space-y-6">
      {/* Header com perfil */}
      <Card>
        <CardHeader className="flex flex-row items-center space-y-0 space-x-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={user?.photoURL || ''} />
            <AvatarFallback>
              <User className="h-8 w-8" />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <CardTitle className="text-xl">
              Olá, {user?.displayName || user?.email || 'Aluno'}! 👋
            </CardTitle>
            <CardDescription>
              Pronto para treinar hoje? Você tem {myTrainings.length} treinos disponíveis.
            </CardDescription>
          </div>
          <Badge variant={permission === 'granted' ? 'default' : 'secondary'}>
            <Bell className="h-3 w-3 mr-1" />
            {permission === 'granted' ? 'Notificações ON' : 'Notificações OFF'}
          </Badge>
        </CardHeader>
      </Card>

      {/* Métricas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          title="Treinos Ativos"
          value={loading ? '...' : myTrainings.length.toString()}
          icon={<Dumbbell className="h-4 w-4" />}
          description="Treinos disponíveis"
        />
        <MetricCard
          title="Treinos Concluídos"
          value={loading ? '...' : '12'} // Implementar contagem real
          icon={<Trophy className="h-4 w-4" />}
          description="Este mês"
        />
        <MetricCard
          title="Próximo Treino"
          value={loading ? '...' : 'Hoje'}
          icon={<Calendar className="h-4 w-4" />}
          description="Treino agendado"
        />
      </div>

      {/* Lista de Treinos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5" />
            Meus Treinos
          </CardTitle>
          <CardDescription>
            Treinos atribuídos pelo seu professor
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : myTrainings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Dumbbell className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum treino atribuído ainda.</p>
              <p className="text-sm">Entre em contato com seu professor.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {myTrainings.slice(0, 3).map((training) => (
                <div 
                  key={training.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Dumbbell className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium">{training.name}</h4>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        45 min
                        <Target className="h-3 w-3 ml-2" />
                        {training.difficulty || 'Intermediário'}
                      </p>
                    </div>
                  </div>
                  <Button size="sm">
                    <PlayCircle className="h-4 w-4 mr-1" />
                    Iniciar
                  </Button>
                </div>
              ))}
              
              {myTrainings.length > 3 && (
                <Button variant="outline" className="w-full">
                  Ver todos os treinos ({myTrainings.length})
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ações rápidas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Button variant="outline" className="h-20 flex-col gap-2">
          <Calendar className="h-6 w-6" />
          <span className="text-xs">Agenda</span>
        </Button>
        <Button variant="outline" className="h-20 flex-col gap-2">
          <Trophy className="h-6 w-6" />
          <span className="text-xs">Progresso</span>
        </Button>
        <Button variant="outline" className="h-20 flex-col gap-2">
          <User className="h-6 w-6" />
          <span className="text-xs">Perfil</span>
        </Button>
        <Button variant="outline" className="h-20 flex-col gap-2">
          <Bell className="h-6 w-6" />
          <span className="text-xs">Chat</span>
        </Button>
      </div>
    </div>
  );
}

// Componente auxiliar para métricas
function MetricCard({ title, value, icon, description }: {
  title: string;
  value: string;
  icon: React.ReactNode;
  description: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
          <div className="p-2 bg-primary/10 rounded-lg">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Skeleton para loading state
function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-background p-4 space-y-6">
      <Skeleton className="h-24 w-full" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
      <Skeleton className="h-64 w-full" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
    </div>
  );
}