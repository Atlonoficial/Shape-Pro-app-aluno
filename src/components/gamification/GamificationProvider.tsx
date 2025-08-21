import React, { createContext, useContext, ReactNode } from "react";

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
  // Valores padrão para evitar erro de contexto
  const contextValue: GamificationContextType = {
    userPoints: { user_id: '', total_points: 0, level: 1, current_streak: 0, longest_streak: 0, last_activity_date: '' },
    activities: [],
    achievements: [],
    userAchievements: [],
    rankings: [],
    challenges: [],
    loading: false,
    fetchUserPoints: async () => {},
    fetchActivities: async () => {},
    joinChallenge: async () => {},
    awardPoints: async () => {},
    getLevelInfo: () => ({ level: 1, pointsForNext: 100 }),
    refresh: async () => {},
    awardPointsForAction: async () => {},
    updateStreak: async () => {}
  };

  return (
    <GamificationContext.Provider value={contextValue}>
      {children}
    </GamificationContext.Provider>
  );
};