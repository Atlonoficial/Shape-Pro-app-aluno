import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, ShoppingCart, Users, FileText, Utensils, Bell, MessageSquare, CreditCard, Activity } from "lucide-react";
import { CourseManagement } from "./CourseManagement";
import { ProductManagement } from "./ProductManagement";
import { StudentStats } from "./StudentStats";
import { UnlockRequestsManager } from "./UnlockRequestsManager";
import { NutritionDashboard } from "./NutritionDashboard";
import { NotificationManager } from "./NotificationManager";
import { FeedbackManager } from "./FeedbackManager";
import { PaymentGatewayConfig } from "./PaymentGatewayConfig";
import { StravaStudentMonitoring } from "./StravaStudentMonitoring";
import { TeacherStatsCards } from "./TeacherStatsCards";
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
    <div className="p-4 pt-6 pb-safe">
      {/* Header Stats - Dados Reais */}
      <TeacherStatsCards />

       {/* Tabs Navigation */}
        <Tabs defaultValue="courses" className="w-full">
          <TabsList className="grid w-full grid-cols-9 mb-6">
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
            <TabsTrigger value="feedbacks" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Feedbacks
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Pagamentos
            </TabsTrigger>
            <TabsTrigger value="strava" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Strava
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

        <TabsContent value="feedbacks" className="mt-4">
          <FeedbackManager />
        </TabsContent>
        
        <TabsContent value="payments" className="mt-4">
          <PaymentGatewayConfig />
        </TabsContent>
        
        <TabsContent value="strava" className="mt-4">
          <StravaStudentMonitoring />
        </TabsContent>
      </Tabs>
    </div>
  );
};