import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { StudentLayout } from "@/components/layout/StudentLayout";
import { BottomNavigation } from "@/components/layout/BottomNavigation";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { Workouts } from "@/components/workouts/Workouts";
import { Nutrition } from "@/components/nutrition/Nutrition";
import { Profile } from "@/components/profile/Profile";
import { Members } from "@/components/members/Members";
import { GamificationDashboard } from "@/components/gamification/GamificationDashboard";
import { NotificationPermissionPrompt } from "@/components/notifications/NotificationPermissionPrompt";
import { useGamificationIntegration } from "@/hooks/useGamificationIntegration";
import { useGamificationStravaIntegration } from "@/hooks/useGamificationStravaIntegration";

const Index = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('home');

  // Integração automática de gamificação
  useGamificationIntegration();
  useGamificationStravaIntegration();

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleCoachClick = () => {
    navigate('/chat');
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  const handleWorkoutClick = () => {
    setActiveTab('workouts');
  };

  const renderContent = () => {
    const content = (() => {
      switch (activeTab) {
        case 'home':
          return <Dashboard onCoachClick={handleCoachClick} onWorkoutClick={handleWorkoutClick} />;
        case 'workouts':
          return <Workouts />;
        case 'nutrition':
          return <Nutrition />;
        case 'gamification':
          return <GamificationDashboard />;
        case 'members':
          return <Members />;
        case 'profile':
          return <Profile />;
        default:
          return <Dashboard onCoachClick={handleCoachClick} onWorkoutClick={handleWorkoutClick} />;
      }
    })();

    return (
      <div
        key={activeTab}
        style={{ isolation: 'isolate' }}
        className="animate-in fade-in slide-in-from-bottom-4 duration-300"
      >
        {content}
      </div>
    );
  };

  return (
    <>
      <NotificationPermissionPrompt />
      <StudentLayout
        bottomNav={
          <BottomNavigation
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />
        }
      >
        {renderContent()}
      </StudentLayout>
    </>
  );
};

export default Index;
