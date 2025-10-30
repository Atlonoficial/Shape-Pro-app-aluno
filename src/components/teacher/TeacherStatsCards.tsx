import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useTeacherStats } from "@/hooks/useTeacherStats";
import { BookOpen, Users, ShoppingCart, FileText } from "lucide-react";

export const TeacherStatsCards = () => {
  const { data: stats, isLoading } = useTeacherStats();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 mb-6">
        {[1, 2].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 mb-6">
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-primary flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Total de Cursos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.totalCourses || 0}</div>
          <p className="text-xs text-muted-foreground">
            {stats?.totalCourses === 1 ? 'curso publicado' : 'cursos publicados'}
          </p>
        </CardContent>
      </Card>
      
      <Card className="bg-gradient-to-r from-secondary/10 to-secondary/5 border-secondary/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-secondary flex items-center gap-2">
            <Users className="h-4 w-4" />
            Alunos Ativos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.activeStudents || 0}</div>
          <p className="text-xs text-muted-foreground">
            {stats?.activeStudents === 1 ? 'aluno cadastrado' : 'alunos cadastrados'}
          </p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-accent/10 to-accent/5 border-accent/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-accent flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Produtos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.totalProducts || 0}</div>
          <p className="text-xs text-muted-foreground">
            {stats?.totalProducts === 1 ? 'produto publicado' : 'produtos publicados'}
          </p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-warning/10 to-warning/5 border-warning/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-warning flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Solicitações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.pendingRequests || 0}</div>
          <p className="text-xs text-muted-foreground">
            {stats?.pendingRequests === 1 ? 'solicitação pendente' : 'solicitações pendentes'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
