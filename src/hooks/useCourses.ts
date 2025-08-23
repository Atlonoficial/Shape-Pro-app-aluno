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
    if (!user) return;

    const fetchCourses = async () => {
      try {
        let query = supabase
          .from('courses')
          .select('*')
          .eq('is_published', true);

        // If user is teacher, show courses they created
        // If user is student, show courses from their teacher (free or enrolled)
        if (userProfile?.user_type === 'teacher') {
          query = query.eq('instructor', user.id);
        } else {
          // For students, get courses from their teacher
          const { data: studentData } = await supabase
            .from('students')
            .select('teacher_id')
            .eq('user_id', user.id)
            .single();

          if (studentData?.teacher_id) {
            query = query.eq('instructor', studentData.teacher_id);
          } else {
            // If student has no teacher, show free courses
            query = query.eq('is_free', true);
          }
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching courses:', error);
          return;
        }

        setCourses(data || []);
      } catch (error) {
        console.error('Error fetching courses:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [user, userProfile]);

  return { courses, loading };
};