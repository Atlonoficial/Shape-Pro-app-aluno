import React, { createContext, useContext, ReactNode, useEffect } from "react";
import { useGamification } from "@/hooks/useGamification";
import { useRealtimeGamification } from "@/hooks/useRealtimeGamification";
import { AuthContext } from "@/components/auth/AuthProvider";

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
  // ✅ BUILD 32.1: Safe context access - não quebrar se AuthProvider não estiver pronto
  const authContext = useContext(AuthContext);
  
  // Se AuthProvider ainda não está pronto, renderizar children sem gamificação
  if (!authContext) {
    console.warn('[GamificationProvider] AuthContext not ready yet, rendering without gamification');
    return <>{children}</>;
  }
  
  const { user } = authContext;
  
  // Usar hooks reais de gamificação
  const {
    userPoints,
    activities,
    achievements,
    userAchievements,
    rankings,
    challenges,
    loading,
    fetchUserPoints,
    fetchActivities,
    joinChallenge,
    awardPoints,
    getLevelInfo,
    refresh
  } = useGamification();
  
  const { awardPointsForAction, updateStreak } = useRealtimeGamification();

  // ✅ BUILD 40.3: Daily check-in LAZY - aguardar 3s após login
  useEffect(() => {
    if (user?.id) {
      const sessionKey = `gamification_initialized_${user.id}_${new Date().toISOString().split('T')[0]}`;
      const alreadyInitialized = sessionStorage.getItem(sessionKey);
      
      if (!alreadyInitialized) {
        console.log('[GamificationProvider] Scheduling daily check-in in 3s...');
        
        // ✅ BUILD 40.3: Aguardar 3s antes de fazer check-in (não bloquear boot)
        const timer = setTimeout(() => {
          console.log('[GamificationProvider] Executing daily check-in');
          updateStreak();
          sessionStorage.setItem(sessionKey, 'true');
        }, 3000);
        
        return () => clearTimeout(timer);
      }
    }
  }, [user?.id, updateStreak]);

  // Só fornecer contexto se o usuário estiver autenticado
  if (!user) {
    const emptyContextValue: GamificationContextType = {
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
      <GamificationContext.Provider value={emptyContextValue}>
        {children}
      </GamificationContext.Provider>
    );
  }

  const contextValue: GamificationContextType = {
    userPoints,
    activities,
    achievements,
    userAchievements,
    rankings,
    challenges,
    loading,
    fetchUserPoints,
    fetchActivities,
    joinChallenge,
    awardPoints,
    getLevelInfo,
    refresh,
    awardPointsForAction,
    updateStreak
  };

  return (
    <GamificationContext.Provider value={contextValue}>
      {children}
    </GamificationContext.Provider>
  );
};