
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { MobileContainer } from "@/components/layout/MobileContainer";
import { BottomNavigation } from "@/components/layout/BottomNavigation";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { Workouts } from "@/components/workouts/Workouts";
import { Nutrition } from "@/components/nutrition/Nutrition";
import { Profile } from "@/components/profile/Profile";
import { Members } from "@/components/members/Members";
import { AIAssistant } from "@/components/assistant/AIAssistant";
import { GamificationDashboard } from "@/components/gamification/GamificationDashboard";
import { useChatNotifications } from "@/hooks/useChatNotifications";

const Index = () => {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('home');
  
  // Ativar notificações de chat em toda a aplicação
  useChatNotifications();

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleCoachClick = () => {
    setActiveTab('assistant');
  };

  const handleWorkoutClick = () => {
    setActiveTab('workouts');
  };

  const renderContent = () => {
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
      case 'assistant':
        return <AIAssistant />;
      case 'profile':
        return <Profile />;
      default:
        return <Dashboard onCoachClick={handleCoachClick} onWorkoutClick={handleWorkoutClick} />;
    }
  };

  return (
    <MobileContainer>
      {renderContent()}
      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
    </MobileContainer>
  );
};

export default Index;
