import { useState } from "react";
import { MobileContainer } from "@/components/layout/MobileContainer";
import { BottomNavigation } from "@/components/layout/BottomNavigation";
import { Dashboard } from "@/components/dashboard/Dashboard";

const Index = () => {
  const [activeTab, setActiveTab] = useState('home');

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <Dashboard />;
      case 'workouts':
        return (
          <div className="p-4 pt-8 pb-24">
            <h2 className="text-2xl font-bold text-foreground mb-4">Treinos</h2>
            <p className="text-muted-foreground">Área de treinos em desenvolvimento...</p>
          </div>
        );
      case 'nutrition':
        return (
          <div className="p-4 pt-8 pb-24">
            <h2 className="text-2xl font-bold text-foreground mb-4">Nutrição</h2>
            <p className="text-muted-foreground">Plano nutricional em desenvolvimento...</p>
          </div>
        );
      case 'rewards':
        return (
          <div className="p-4 pt-8 pb-24">
            <h2 className="text-2xl font-bold text-foreground mb-4">Recompensas</h2>
            <p className="text-muted-foreground">Loja de recompensas em desenvolvimento...</p>
          </div>
        );
      case 'profile':
        return (
          <div className="p-4 pt-8 pb-24">
            <h2 className="text-2xl font-bold text-foreground mb-4">Perfil</h2>
            <p className="text-muted-foreground">Perfil do usuário em desenvolvimento...</p>
          </div>
        );
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
