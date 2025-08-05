import { useAuth } from '@/hooks/useAuth';
import { useMyTrainings } from '@/hooks/useMyTrainings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { 
  Dumbbell, 
  Clock, 
  Target, 
  Calendar,
  CheckCircle,
  PlayCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Página de Treinos do Aluno
 * 
 * CONEXÃO COM DASHBOARD DO PROFESSOR:
 * - Mostra todos os treinos criados pelo professor para este aluno
 * - Status e progresso são sincronizados em tempo real
 * - Professor vê quando aluno inicia/completa treinos
 */

export default function AlunoTreinos() {
  const { user } = useAuth();
  const { trainings, loading, error } = useMyTrainings(user?.uid);

  if (loading) {
    return <TreinosSkeleton />;
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-destructive">Erro ao carregar treinos: {error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const activeTrainings = trainings.filter(t => t.status === 'active');
  const completedTrainings = trainings.filter(t => t.status === 'completed');

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Meus Treinos</h1>
          <p className="text-muted-foreground">
            Treinos atribuídos pelo seu professor
          </p>
        </div>
        <div className="text-sm text-muted-foreground">
          {trainings.length} treinos • {activeTrainings.length} ativos
        </div>
      </div>

      {/* Treinos Ativos */}
      {activeTrainings.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <PlayCircle className="h-5 w-5" />
            Treinos Ativos
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeTrainings.map((training) => (
              <TrainingCard key={training.id} training={training} />
            ))}
          </div>
        </section>
      )}

      {/* Treinos Concluídos */}
      {completedTrainings.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Treinos Concluídos
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {completedTrainings.map((training) => (
              <TrainingCard key={training.id} training={training} />
            ))}
          </div>
        </section>
      )}

      {/* Estado vazio */}
      {trainings.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Target className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium mb-2">Nenhum treino encontrado</h3>
            <p className="text-muted-foreground mb-4">
              Aguarde seu professor criar treinos para você.
            </p>
            <Button asChild variant="outline">
              <Link to="/aluno/dashboard">
                Voltar ao Dashboard
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Componente para cada treino
interface TrainingCardProps {
  training: any;
}

function TrainingCard({ training }: TrainingCardProps) {
  const isActive = training.status === 'active';
  const isCompleted = training.status === 'completed';
  
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{training.title}</CardTitle>
            <CardDescription>
              {training.description || 'Treino personalizado'}
            </CardDescription>
          </div>
          <Badge variant={isActive ? 'default' : 'secondary'}>
            {isActive ? 'Ativo' : 'Concluído'}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Informações do treino */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Dumbbell className="h-4 w-4" />
            {training.exercises?.length || 0} exercícios
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {training.estimated_duration || '45'} min
          </div>
        </div>

        {/* Data de criação */}
        {training.created_at && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            Criado em {format(new Date(training.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </div>
        )}

        {/* Data de conclusão */}
        {isCompleted && training.completed_at && (
          <div className="flex items-center gap-1 text-sm text-green-600">
            <CheckCircle className="h-4 w-4" />
            Concluído em {format(new Date(training.completed_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </div>
        )}

        {/* Botões de ação */}
        <div className="flex gap-2">
          <Button asChild className="flex-1">
            <Link to={`/aluno/treinos/${training.id}`}>
              {isCompleted ? 'Ver Treino' : 'Começar Treino'}
            </Link>
          </Button>
          {isActive && (
            <Button asChild variant="outline" size="sm">
              <Link to={`/aluno/treinos/${training.id}/progresso`}>
                Progresso
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Skeleton de carregamento
function TreinosSkeleton() {
  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-5 w-64" />
        </div>
        <Skeleton className="h-5 w-32" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-full" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}