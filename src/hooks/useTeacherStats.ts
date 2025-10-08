import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface TeacherStats {
  totalCourses: number;
  activeStudents: number;
  totalProducts: number;
  pendingRequests: number;
}

export const useTeacherStats = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['teacher-stats', user?.id],
    queryFn: async (): Promise<TeacherStats> => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      // Buscar total de cursos publicados
      const { count: coursesCount } = await supabase
        .from('courses')
        .select('*', { count: 'exact', head: true })
        .eq('instructor', user.id)
        .eq('is_published', true);

      // Buscar alunos ativos
      const { count: studentsCount } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
        .eq('teacher_id', user.id);

      // Buscar produtos publicados
      const { count: productsCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('instructor_id', user.id)
        .eq('is_published', true);

      // Buscar solicitações pendentes de desbloqueio de cursos
      const { count: requestsCount } = await supabase
        .from('course_unlock_requests')
        .select('*', { count: 'exact', head: true })
        .eq('teacher_id', user.id)
        .eq('status', 'pending');

      return {
        totalCourses: coursesCount || 0,
        activeStudents: studentsCount || 0,
        totalProducts: productsCount || 0,
        pendingRequests: requestsCount || 0,
      };
    },
    enabled: !!user?.id,
    staleTime: 30000, // 30 segundos
  });
};
