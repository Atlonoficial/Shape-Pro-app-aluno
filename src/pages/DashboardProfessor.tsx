import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { MobileContainer } from "@/components/layout/MobileContainer";
import { TeacherDashboard } from "@/components/teacher/TeacherDashboard";
import { NotificationManager } from "@/components/teacher/NotificationManager";
import { NotificationStatus } from "@/components/notifications/NotificationStatus";
import { NotificationDebug } from "@/components/notifications/NotificationDebug";
import { Button } from "@/components/ui/button";

const DashboardProfessor = () => {
  const navigate = useNavigate();

  return (
    <MobileContainer>
      <div className="flex flex-col h-full">
        {/* Header */}
        <header className="flex items-center gap-3 p-4 border-b border-border bg-card">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/?tab=profile")}
            className="h-10 w-10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Dashboard Professor</h1>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4 space-y-6">
          <NotificationDebug />
          <NotificationManager />
          <NotificationStatus />
        </div>
      </div>
    </MobileContainer>
  );
};

export default DashboardProfessor;