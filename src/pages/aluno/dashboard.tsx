import { useAuth } from '@/hooks/useAuth';
import { useMyData } from '@/hooks/useMyData';
import { useMyTrainings } from '@/hooks/useMyTrainings';
import { useFCMTokens } from '@/hooks/useFCMTokens';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  User, 
  Dumbbell, 
  TrendingUp, 
  Calendar,
  MessageCircle,
  Target,
  Clock
} from 'lucide-react';

/**
 * Dashboard do Aluno - Conectado ao Dashboard do Professor
 * 
 * SINCRONIZAÇÃO EM TEMPO REAL:
 * - Professor cadastra aluno → aparece aqui via useMyData
 * - Professor cria treino → aluno vê via useMyTrainings  
 * - FCM tokens registrados → professor pode enviar notificações
 * - Chat disponível para comunicação bidirecional
 */

export default function AlunoDashboard() {
  const { user } = useAuth();
  const { student, loading: studentLoading, error: studentError } = useMyData(user?.uid);
  const { trainings, loading: trainingsLoading, error: trainingsError } = useMyTrainings(user?.uid);
  const { requestPermission, token, loading: fcmLoading } = useFCMTokens();
  const { toast } = useToast();

  // Registrar FCM token automaticamente para receber notificações do professor
  useEffect(() => {
    if (user && !token && !fcmLoading) {
      requestPermission().catch(err => {
        console.warn('Falha ao registrar token FCM:', err);
      });
    }
  }, [user, token, fcmLoading, requestPermission]);

  // Exibir erros via toast
  useEffect(() => {
    if (studentError) {
      toast({
        title: "Erro no perfil",
        description: studentError,
        variant: "destructive"
      });
    }
    if (trainingsError) {
      toast({
        title: "Erro nos treinos", 
        description: trainingsError,
        variant: "destructive"
      });
    }
  }, [studentError, trainingsError, toast]);

  if (studentLoading || trainingsLoading) {
    return <DashboardSkeleton />;
  }

  // Estatísticas calculadas dos treinos
  const activeTrainings = trainings.filter(t => t.status === 'active').length;
  const completedTrainings = trainings.filter(t => t.status === 'completed').length;
  const nextTraining = trainings.find(t => t.status === 'active' && !t.completed_at);

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header com informações do aluno */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Olá, {user?.displayName || user?.email?.split('@')[0] || 'Aluno'}!
          </CardTitle>
          <CardDescription>
            {student?.teacherId && `Professor: ${student.teacherId}`}
            {token && " • Notificações ativadas"}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Métricas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          title="Treinos Ativos"
          value={activeTrainings}
          icon={<Dumbbell className="h-4 w-4" />}
          description="Treinos disponíveis"
        />
        <MetricCard
          title="Treinos Concluídos"
          value={completedTrainings}
          icon={<TrendingUp className="h-4 w-4" />}
          description="Total completado"
        />
        <MetricCard
          title="Próximo Treino"
          value={nextTraining ? nextTraining.title : "Nenhum"}
          icon={<Clock className="h-4 w-4" />}
          description="Próxima sessão"
        />
      </div>

      {/* Ações rápidas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Button asChild variant="outline" className="h-20 flex-col">
          <Link to="/aluno/agenda">
            <Calendar className="h-6 w-6 mb-2" />
            Agenda
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-20 flex-col">
          <Link to="/aluno/progresso">
            <TrendingUp className="h-6 w-6 mb-2" />
            Progresso
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-20 flex-col">
          <Link to="/aluno/perfil">
            <User className="h-6 w-6 mb-2" />
            Perfil
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-20 flex-col">
          <Link to={`/aluno/chat/${student?.teacherId || 'professor'}`}>
            <MessageCircle className="h-6 w-6 mb-2" />
            Chat
          </Link>
        </Button>
      </div>

      {/* Lista de treinos */}
      <Card>
        <CardHeader>
          <CardTitle>Meus Treinos</CardTitle>
          <CardDescription>
            Treinos atribuídos pelo seu professor
          </CardDescription>
        </CardHeader>
        <CardContent>
          {trainings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum treino atribuído ainda.</p>
              <p className="text-sm">Aguarde seu professor criar treinos para você.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {trainings.map((training) => (
                <div
                  key={training.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <h3 className="font-medium">{training.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {training.exercises?.length || 0} exercícios
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        training.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {training.status === 'active' ? 'Ativo' : 'Concluído'}
                    </span>
                    <Button asChild size="sm">
                      <Link to={`/aluno/treinos/${training.id}`}>
                        Começar Treino
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Componente para métricas
interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description: string;
}

function MetricCard({ title, value, icon, description }: MetricCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between space-y-0 pb-2">
          <h3 className="text-sm font-medium">{title}</h3>
          {icon}
        </div>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

// Skeleton para carregamento
function DashboardSkeleton() {
  return (
    <div className="container mx-auto p-4 space-y-6">
      <Skeleton className="h-32 w-full" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
      </div>
      <Skeleton className="h-64 w-full" />
    </div>
  );
}