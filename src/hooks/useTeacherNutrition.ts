import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

export interface StudentNutritionProgress {
  student_id: string;
  student_name: string;
  student_email: string;
  total_meals: number;
  completed_meals: number;
  adherence_percentage: number;
  last_meal_time?: string;
  daily_calories_target: number;
  daily_calories_consumed: number;
  calories_percentage: number;
}

export interface RecentMealActivity {
  id: string;
  student_id: string;
  student_name: string;
  meal_name: string;
  consumed: boolean;
  actual_time: string;
  created_at: string;
}

export const useTeacherNutrition = () => {
  const { user } = useAuth();
  const [studentsProgress, setStudentsProgress] = useState<StudentNutritionProgress[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentMealActivity[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStudentNutritionProgress = async () => {
    if (!user?.id) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Buscar alunos do professor
      const { data: students, error: studentsError } = await supabase
        .from('students')
        .select(`
          user_id,
          profiles(name, email)
        `)
        .eq('teacher_id', user.id);

      if (studentsError) throw studentsError;

      // Para cada aluno, buscar progresso nutricional
      const progressData = await Promise.all(
        (students || []).map(async (student: any) => {
          // Buscar plano ativo do aluno
          const { data: mealPlans } = await supabase
            .from('meal_plans')
            .select('*, meals_data, total_calories')
            .contains('assigned_students', [student.user_id])
            .order('created_at', { ascending: false })
            .limit(1);

          const activePlan = mealPlans?.[0];
          
          // Buscar logs de refeições de hoje
          const { data: mealLogs } = await supabase
            .from('meal_logs')
            .select('*')
            .eq('user_id', student.user_id)
            .gte('date', `${today}T00:00:00.000Z`)
            .lt('date', `${today}T23:59:59.999Z`);

          let totalMeals = 0;
          let completedMeals = 0;
          let dailyCaloriesTarget = 0;
          let dailyCaloriesConsumed = 0;
          let lastMealTime: string | undefined;

          // Usar nova estrutura com meals_data
          if (activePlan?.meals_data && Array.isArray(activePlan.meals_data)) {
            // Extrair meal_ids do meals_data
            const mealIds = activePlan.meals_data
              .map((item: any) => item.meal_id)
              .filter((id): id is string => typeof id === 'string');
            
            if (mealIds.length > 0) {
              // Buscar dados das refeições
              const { data: meals } = await supabase
                .from('meals')
                .select('id, calories')
                .in('id', mealIds);

              totalMeals = meals?.length || 0;
              dailyCaloriesTarget = activePlan.total_calories || 0;

              // Calcular refeições completadas e calorias consumidas
              meals?.forEach((meal) => {
                const mealLog = mealLogs?.find(log => log.meal_id === meal.id);
                if (mealLog?.consumed) {
                  completedMeals++;
                  dailyCaloriesConsumed += meal.calories || 0;
                  if (mealLog.actual_time && (!lastMealTime || mealLog.actual_time > lastMealTime)) {
                    lastMealTime = mealLog.actual_time;
                  }
                }
              });
            }
          }

          return {
            student_id: student.user_id,
            student_name: student.profiles?.name || student.profiles?.email || 'Aluno',
            student_email: student.profiles?.email || '',
            total_meals: totalMeals,
            completed_meals: completedMeals,
            adherence_percentage: totalMeals > 0 ? (completedMeals / totalMeals) * 100 : 0,
            last_meal_time: lastMealTime,
            daily_calories_target: dailyCaloriesTarget,
            daily_calories_consumed: dailyCaloriesConsumed,
            calories_percentage: dailyCaloriesTarget > 0 ? (dailyCaloriesConsumed / dailyCaloriesTarget) * 100 : 0
          } as StudentNutritionProgress;
        })
      );

      setStudentsProgress(progressData);
    } catch (error) {
      console.error('Erro ao buscar progresso nutricional dos alunos:', error);
    }
  };

  const fetchRecentActivities = async () => {
    if (!user?.id) return;

    try {
      // Buscar atividades recentes dos alunos (últimas 24 horas)
      const studentIds = studentsProgress.map(s => s.student_id);
      
      if (studentIds.length === 0) return;
      
      const { data: activities, error } = await supabase
        .from('meal_logs')
        .select(`
          id,
          user_id,
          meal_id,
          consumed,
          actual_time,
          created_at
        `)
        .in('user_id', studentIds)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      const recentActivitiesData: RecentMealActivity[] = [];

      for (const activity of activities || []) {
        // Buscar nome do aluno
        const { data: profile } = await supabase
          .from('profiles')
          .select('name, email')
          .eq('id', activity.user_id)
          .single();
        
        let mealName = 'Refeição';
        
        // Buscar nome da refeição
        const { data: meal } = await supabase
          .from('meals')
          .select('name')
          .eq('id', activity.meal_id)
          .single();
        
        mealName = meal?.name || 'Refeição';
        
        recentActivitiesData.push({
          id: activity.id,
          student_id: activity.user_id,
          student_name: profile?.name || profile?.email || 'Aluno',
          meal_name: mealName,
          consumed: activity.consumed,
          actual_time: activity.actual_time || '',
          created_at: activity.created_at
        });
      }

      setRecentActivities(recentActivitiesData);
    } catch (error) {
      console.error('Erro ao buscar atividades recentes:', error);
    }
  };

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    fetchStudentNutritionProgress().then(() => {
      setLoading(false);
    });

    // Real-time subscription para meal_logs de todos os alunos
    const realtimeChannel = supabase
      .channel('teacher_meal_logs_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'meal_logs'
        },
        (payload) => {
          console.log('Teacher nutrition realtime update:', payload);
          
          // Verificar se o aluno pertence a este professor
          const studentId = (payload.new as any)?.user_id || (payload.old as any)?.user_id;
          if (studentId) {
            supabase
              .from('students')
              .select('teacher_id')
              .eq('user_id', studentId)
              .single()
              .then(({ data: studentData }) => {
                if (studentData?.teacher_id === user.id) {
                  // Recarregar dados se o aluno pertencer a este professor
                  fetchStudentNutritionProgress();
                  fetchRecentActivities();
                }
              });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(realtimeChannel);
    };
  }, [user?.id]);

  useEffect(() => {
    if (studentsProgress.length > 0) {
      fetchRecentActivities();
    }
  }, [studentsProgress]);

  return {
    studentsProgress,
    recentActivities,
    loading,
    refreshData: () => {
      fetchStudentNutritionProgress();
      fetchRecentActivities();
    }
  };
};