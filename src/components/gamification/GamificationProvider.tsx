import React, { createContext, useContext, ReactNode } from "react";
import { useGamification } from "@/hooks/useGamification";
import { useGamificationIntegration } from "@/hooks/useGamificationIntegration";

interface GamificationContextType {
  // Data from useGamification
  userPoints: any;
  activities: any[];
  achievements: any[];
  userAchievements: any[];
  rankings: any[];
  challenges: any[];
  loading: boolean;
  
  // Actions
  fetchUserPoints: () => Promise<void>;
  fetchActivities: (limit?: number) => Promise<void>;
  joinChallenge: (challengeId: string) => Promise<void>;
  awardPoints: (activityType: string, description: string, customPoints?: number) => Promise<void>;
  getLevelInfo: (points: number) => any;
  refresh: () => Promise<void>;
  
  // Integration actions
  awardPointsForAction: (action: string, description?: string) => Promise<void>;
  updateStreak: () => Promise<void>;
}

const GamificationContext = createContext<GamificationContextType | null>(null);

export const useGamificationContext = () => {
  const context = useContext(GamificationContext);
  if (!context) {
    throw new Error('useGamificationContext must be used within GamificationProvider');
  }
  return context;
};

interface GamificationProviderProps {
  children: ReactNode;
}

export const GamificationProvider: React.FC<GamificationProviderProps> = ({ children }) => {
  const gamificationData = useGamification();
  const { awardPointsForAction, updateStreak } = useGamificationIntegration();

  const contextValue: GamificationContextType = {
    ...gamificationData,
    awardPointsForAction,
    updateStreak
  };

  return (
    <GamificationContext.Provider value={contextValue}>
      {children}
    </GamificationContext.Provider>
  );
};