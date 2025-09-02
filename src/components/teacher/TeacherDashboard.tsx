import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, ShoppingCart, Users, FileText, Utensils, Bell } from "lucide-react";
import { CourseManagement } from "./CourseManagement";
import { ProductManagement } from "./ProductManagement";
import { StudentStats } from "./StudentStats";
import { UnlockRequestsManager } from "./UnlockRequestsManager";
import { NutritionDashboard } from "./NutritionDashboard";
import { NotificationManager } from "./NotificationManager";
import { useAuth } from "@/hooks/useAuth";

export const TeacherDashboard = () => {
  const { userProfile } = useAuth();

  if (userProfile?.user_type !== 'teacher') {
    return (
      <div className="p-6 text-center">
        <h2 className="text-lg font-semibold text-muted-foreground">
          Acesso restrito a professores
        </h2>
      </div>
    );
  }

  return (
    <div className="p-4 pt-6 pb-24">
      {/* Header Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-primary">Total de Cursos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">+2 este mês</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-secondary/10 to-secondary/5 border-secondary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-secondary">Alunos Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">48</div>
            <p className="text-xs text-muted-foreground">+5 esta semana</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Navigation */}
        <Tabs defaultValue="courses" className="w-full">
          <TabsList className="grid w-full grid-cols-6 mb-6">
            <TabsTrigger value="courses" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Cursos
            </TabsTrigger>
            <TabsTrigger value="products" className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Produtos
            </TabsTrigger>
            <TabsTrigger value="students" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Alunos
            </TabsTrigger>
            <TabsTrigger value="nutrition" className="flex items-center gap-2">
              <Utensils className="h-4 w-4" />
              Nutrição
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notificações
            </TabsTrigger>
            <TabsTrigger value="requests" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Solicitações
            </TabsTrigger>
          </TabsList>

        <TabsContent value="courses" className="mt-4">
          <CourseManagement />
        </TabsContent>

        <TabsContent value="products" className="mt-4">
          <ProductManagement />
        </TabsContent>

        <TabsContent value="students" className="mt-4">
          <StudentStats />
        </TabsContent>

        <TabsContent value="nutrition" className="mt-4">
          <NutritionDashboard />
        </TabsContent>

        <TabsContent value="notifications" className="mt-4">
          <NotificationManager />
        </TabsContent>

        <TabsContent value="requests" className="mt-4">
          <UnlockRequestsManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};