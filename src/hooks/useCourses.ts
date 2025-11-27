import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/components/auth/AuthProvider';

export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  instructor: string;
  modules: any;
  enrolled_users: string[];
  is_published: boolean;
  is_free: boolean;
  is_public: boolean;
  duration: number;
  category: string;
  price: number | null;
  created_at: string;
  updated_at: string;
}

import { getCache, setCache } from '@/lib/cache';

export const useCourses = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, userProfile } = useAuthContext();

  useEffect(() => {
    if (!user || !userProfile) {
      return;
    }

    const fetchCourses = async () => {
      // const cacheKey = `courses_${user.id}_${userProfile.user_type}`;
      // const cachedData = getCache(cacheKey);

      // if (cachedData) {
      //   console.log('useCourses: ⚡ Usando cache');
      //   setCourses(cachedData);
      //   setLoading(false);
      //   return;
      // }

      console.log('useCourses: 🔍 Iniciando busca de cursos para:', userProfile.user_type);
      try {
        // ✅ PROFESSORES: Ver apenas seus cursos
        if (userProfile?.user_type === 'teacher') {
          const { data, error } = await supabase
            .from('courses')
            .select('*')
            .or(`instructor.eq.${user.id},is_public.eq.true`)
            .order('created_at', { ascending: false });

          if (error) {
            console.error('useCourses: ❌ Erro ao buscar cursos do professor:', error);
            throw error;
          }

          setCourses(data || []);
          // setCache(cacheKey, data || []);

        } else {
          // ✅ ALUNOS: Buscar cursos do professor + cursos públicos

          // 1️⃣ Verificar professor do aluno
          const { data: studentData, error: studentError } = await supabase
            .from('students')
            .select('teacher_id')
            .eq('user_id', user.id)
            .maybeSingle();

          if (studentError) console.error('useCourses: Erro ao buscar dados do aluno:', studentError);
          console.log('useCourses: 👨‍🏫 Professor do aluno:', studentData?.teacher_id);

          // 2️⃣ Query Otimizada: Buscar todos os cursos relevantes em uma única requisição
          let query = supabase
            .from('courses')
            .select('*')
            .eq('is_published', true);

          if (studentData?.teacher_id) {
            // Busca: Cursos do professor OU Cursos públicos OU Cursos globais
            query = query.or(`instructor.eq.${studentData.teacher_id},is_public.eq.true,instructor.is.null`);
          } else {
            // Busca: Cursos públicos OU Cursos globais
            query = query.or(`is_public.eq.true,instructor.is.null`);
          }

          const { data, error } = await query.order('created_at', { ascending: false });

          if (error) {
            console.error('useCourses: ❌ Erro ao buscar cursos:', error);
            throw error;
          }

          console.log('useCourses: ✅ Cursos carregados:', data?.length);
          if (data) {
            data.forEach(c => console.log(`📦 Curso: ${c.title} | Thumb: ${c.thumbnail}`));
          }

          setCourses(data || []);
          // setCache(cacheKey, data || []);
        }
      } catch (error) {
        console.error('useCourses: ❌ Erro ao buscar cursos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [user, userProfile]);

  return { courses, loading };
};