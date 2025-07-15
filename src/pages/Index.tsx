import { useState } from "react";
import { MobileContainer } from "@/components/layout/MobileContainer";
import { BottomNavigation } from "@/components/layout/BottomNavigation";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { Workouts } from "@/components/workouts/Workouts";
import { Nutrition } from "@/components/nutrition/Nutrition";
import { Profile } from "@/components/profile/Profile";
import { Rewards } from "@/components/rewards/Rewards";

const Index = () => {
  const [activeTab, setActiveTab] = useState('home');

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <Dashboard />;
      case 'workouts':
        return <Workouts />;
      case 'nutrition':
        return <Nutrition />;
      case 'rewards':
        return <Rewards />;
      case 'profile':
        return <Profile />;
      default:
        return <Dashboard />;
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
