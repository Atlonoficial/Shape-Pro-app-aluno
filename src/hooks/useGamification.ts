import { useState, useEffect } from "react";
import { useAuthContext } from "@/components/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UserPoints {
  user_id: string;
  total_points: number;
  level: number;
  current_streak: number;
  longest_streak: number;
  last_activity_date: string;
}

interface GamificationActivity {
  id: string;
  activity_type: string;
  points_earned: number;
  description: string;
  metadata: any;
  created_at: string;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  points_reward: number;
  rarity: string;
  condition_type: string;
  condition_value: number;
  is_active: boolean;
}

interface UserAchievement {
  id: string;
  achievement_id: string;
  points_earned: number;
  earned_at: string;
  achievement: Achievement;
}

interface MonthlyRanking {
  id: string;
  user_id: string;
  position: number;
  total_points: number;
  month: string;
  profile: {
    name: string;
    avatar_url?: string;
  };
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  challenge_type: string;
  target_value: number;
  points_reward: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  participation?: {
    current_progress: number;
    completed: boolean;
  };
}

export const useGamification = () => {
  const { user } = useAuthContext();
  const [userPoints, setUserPoints] = useState<UserPoints | null>(null);
  const [activities, setActivities] = useState<GamificationActivity[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [rankings, setRankings] = useState<MonthlyRanking[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);

  // Buscar pontos do usuário
  const fetchUserPoints = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from("user_points")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      setUserPoints(data);
    } catch (error) {
      console.error("Error fetching user points:", error);
    }
  };

  // Buscar atividades recentes
  const fetchActivities = async (limit = 20) => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from("gamification_activities")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      setActivities(data || []);
    } catch (error) {
      console.error("Error fetching activities:", error);
    }
  };

  // Buscar conquistas disponíveis
  const fetchAchievements = async () => {
    if (!user?.id) return;

    try {
      // Buscar teacher_id do usuário primeiro
      const { data: studentData } = await supabase
        .from("students")
        .select("teacher_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!studentData?.teacher_id) return;

      const { data, error } = await supabase
        .from("achievements")
        .select("*")
        .eq("created_by", studentData.teacher_id)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAchievements(data || []);
    } catch (error) {
      console.error("Error fetching achievements:", error);
    }
  };

  // Buscar conquistas do usuário
  const fetchUserAchievements = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from("user_achievements")
        .select(`
          *,
          achievement:achievements(*)
        `)
        .eq("user_id", user.id)
        .order("earned_at", { ascending: false });

      if (error) throw error;
      setUserAchievements(data || []);
    } catch (error) {
      console.error("Error fetching user achievements:", error);
    }
  };

  // Buscar ranking mensal
  const fetchRankings = async () => {
    if (!user?.id) return;

    try {
      // Buscar teacher_id do usuário primeiro
      const { data: studentData } = await supabase
        .from("students")
        .select("teacher_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!studentData?.teacher_id) return;

      const currentMonth = new Date().toISOString().slice(0, 7) + "-01";

      const { data, error } = await supabase
        .from("monthly_rankings")
        .select("*")
        .eq("teacher_id", studentData.teacher_id)
        .eq("month", currentMonth)
        .order("position", { ascending: true })
        .limit(10);

      if (error) throw error;

      // Buscar profiles separadamente
      if (data && data.length > 0) {
        const userIds = data.map(r => r.user_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, name, avatar_url")
          .in("id", userIds);

        const rankingsWithProfiles = data.map(ranking => ({
          ...ranking,
          profile: profiles?.find(p => p.id === ranking.user_id) || { name: 'Usuário', avatar_url: null }
        }));

        setRankings(rankingsWithProfiles);
      } else {
        setRankings([]);
      }
    } catch (error) {
      console.error("Error fetching rankings:", error);
    }
  };

  // Buscar desafios ativos
  const fetchChallenges = async () => {
    if (!user?.id) return;

    try {
      // Buscar teacher_id do usuário primeiro
      const { data: studentData } = await supabase
        .from("students")
        .select("teacher_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!studentData?.teacher_id) return;

      const { data, error } = await supabase
        .from("challenges")
        .select("*")
        .eq("teacher_id", studentData.teacher_id)
        .eq("is_active", true)
        .gte("end_date", new Date().toISOString().split("T")[0])
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Buscar participações do usuário
      const challengeIds = data?.map(c => c.id) || [];
      if (challengeIds.length > 0) {
        const { data: participations } = await supabase
          .from("challenge_participations")
          .select("*")
          .eq("user_id", user.id)
          .in("challenge_id", challengeIds);

        const challengesWithParticipation = data?.map(challenge => ({
          ...challenge,
          participation: participations?.find(p => p.challenge_id === challenge.id)
        }));

        setChallenges(challengesWithParticipation || []);
      } else {
        setChallenges(data || []);
      }
    } catch (error) {
      console.error("Error fetching challenges:", error);
    }
  };

  // Participar de um desafio
  const joinChallenge = async (challengeId: string) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from("challenge_participations")
        .insert({
          challenge_id: challengeId,
          user_id: user.id
        });

      if (error) throw error;
      
      toast.success("Desafio aceito com sucesso!");
      await fetchChallenges();
    } catch (error: any) {
      if (error.code === "23505") { // unique violation
        toast.error("Você já está participando deste desafio");
      } else {
        toast.error("Erro ao aceitar desafio");
        console.error("Error joining challenge:", error);
      }
    }
  };

  // Dar pontos manualmente (para testes ou ações específicas)
  const awardPoints = async (activityType: string, description: string, customPoints?: number) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase.rpc("award_points_enhanced", {
        p_user_id: user.id,
        p_activity_type: activityType,
        p_description: description,
        p_custom_points: customPoints
      });

      if (error) throw error;
      
      await Promise.all([
        fetchUserPoints(),
        fetchActivities()
      ]);
      
      toast.success(`Pontos adicionados: ${description}`);
    } catch (error) {
      console.error("Error awarding points:", error);
      toast.error("Erro ao adicionar pontos");
    }
  };

  // Obter nível baseado em pontos
  const getLevelInfo = (points: number) => {
    const level = Math.floor(Math.sqrt(points / 100)) + 1;
    const currentLevelPoints = Math.pow(level - 1, 2) * 100;
    const nextLevelPoints = Math.pow(level, 2) * 100;
    const progressToNext = points - currentLevelPoints;
    const pointsNeeded = nextLevelPoints - currentLevelPoints;
    const progress = (progressToNext / pointsNeeded) * 100;

    const levelNames = [
      "Iniciante", "Bronze", "Prata", "Ouro", "Platina", "Diamante", "Mestre", "Lenda"
    ];

    return {
      level,
      name: levelNames[Math.min(level - 1, levelNames.length - 1)] || `Nível ${level}`,
      currentLevelPoints,
      nextLevelPoints,
      progressToNext,
      pointsNeeded,
      progress: Math.min(progress, 100)
    };
  };

  // Inicializar dados e configurar subscriptions em tempo real
  useEffect(() => {
    const loadData = async () => {
      if (!user?.id) return;
      
      setLoading(true);
      try {
        await Promise.all([
          fetchUserPoints(),
          fetchActivities(),
          fetchAchievements(),
          fetchUserAchievements(),
          fetchRankings(),
          fetchChallenges()
        ]);
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      loadData();
    }
  }, [user?.id]);

  // ✅ BUILD 53: Realtime removido - consolidado em useGlobalRealtime

  return {
    userPoints,
    activities,
    achievements,
    userAchievements,
    rankings,
    challenges,
    loading,
    fetchUserPoints,
    fetchActivities,
    fetchAchievements,
    fetchUserAchievements,
    fetchRankings,
    fetchChallenges,
    joinChallenge,
    awardPoints,
    getLevelInfo,
    refresh: async () => {
      await Promise.all([
        fetchUserPoints(),
        fetchActivities(),
        fetchAchievements(),
        fetchUserAchievements(),
        fetchRankings(),
        fetchChallenges()
      ]);
    }
  };
};