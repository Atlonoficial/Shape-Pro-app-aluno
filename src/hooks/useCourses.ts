import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

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
  created_at: string;
  updated_at: string;
}

export const useCourses = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, userProfile } = useAuth();

  useEffect(() => {
    if (!user || !userProfile) {
      console.log('useCourses: Aguardando user e profile...', { user: !!user, userProfile: !!userProfile });
      return;
    }

    const fetchCourses = async () => {
      console.log('useCourses: 🔍 Iniciando busca de cursos para:', userProfile.user_type);
      try {
        // ✅ PROFESSORES: Ver apenas seus cursos
        if (userProfile?.user_type === 'teacher') {
          console.log('useCourses: 👨‍🏫 Buscando cursos do professor:', user.id);
          
          const { data, error } = await supabase
            .from('courses')
            .select('*')
            .eq('instructor', user.id)
            .eq('is_published', true)
            .order('created_at', { ascending: false });

          if (error) {
            console.error('useCourses: ❌ Erro ao buscar cursos do professor:', error);
            return;
          }

          console.log('useCourses: ✅ Cursos do professor:', data?.length);
          setCourses(data || []);
          
        } else {
          // ✅ ALUNOS: Buscar cursos do professor + cursos públicos
          console.log('useCourses: 👨‍🎓 Buscando cursos para aluno...');
          
          // 1️⃣ Verificar se aluno tem professor
          const { data: studentData, error: studentError } = await supabase
            .from('students')
            .select('teacher_id')
            .eq('user_id', user.id)
            .maybeSingle();

          if (studentError) {
            console.error('useCourses: ⚠️ Erro ao buscar dados do aluno:', studentError);
          }

          console.log('useCourses: 📋 Dados do aluno:', { 
            hasTeacher: !!studentData?.teacher_id,
            teacherId: studentData?.teacher_id 
          });

          let allCourses: Course[] = [];

          // 2️⃣ Se tem professor, buscar cursos dele (públicos e privados)
          if (studentData?.teacher_id) {
            const { data: teacherCourses, error: teacherError } = await supabase
              .from('courses')
              .select('*')
              .eq('instructor', studentData.teacher_id)
              .eq('is_published', true)
              .order('created_at', { ascending: false });

            if (teacherError) {
              console.error('useCourses: ❌ Erro ao buscar cursos do professor:', teacherError);
            } else {
              console.log('useCourses: 👨‍🏫 Cursos do professor:', teacherCourses?.length);
              allCourses = [...(teacherCourses || [])];
            }
          }

          // 3️⃣ ✅ BUILD 39: Buscar TODOS os cursos públicos de OUTROS professores
          const { data: publicCourses, error: publicError } = await supabase
            .from('courses')
            .select('*')
            .eq('is_published', true)
            .eq('is_public', true)
            .neq('instructor', studentData?.teacher_id || '00000000-0000-0000-0000-000000000000')
            .order('created_at', { ascending: false });

          if (publicError) {
            console.error('useCourses: ❌ Erro ao buscar cursos públicos:', publicError);
          } else {
            console.log('useCourses: 🌍 Cursos públicos de outros professores:', publicCourses?.length);
            allCourses = [...allCourses, ...(publicCourses || [])];
          }

          // 4️⃣ Buscar cursos globais (instructor = NULL)
          const { data: globalCourses, error: globalError } = await supabase
            .from('courses')
            .select('*')
            .is('instructor', null)
            .eq('is_published', true)
            .order('created_at', { ascending: false });

          if (globalError) {
            console.error('useCourses: ❌ Erro ao buscar cursos globais:', globalError);
          } else {
            console.log('useCourses: 🌐 Cursos globais:', globalCourses?.length);
            allCourses = [...allCourses, ...(globalCourses || [])];
          }

          // 5️⃣ Remover duplicatas por ID
          const uniqueCourses = Array.from(
            new Map(allCourses.map(c => [c.id, c])).values()
          );

          console.log('useCourses: ✅ Total de cursos únicos:', uniqueCourses.length);
          setCourses(uniqueCourses);
        }
      } catch (error) {
        console.error('useCourses: ❌ Erro inesperado:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [user, userProfile]);

  return { courses, loading };
};