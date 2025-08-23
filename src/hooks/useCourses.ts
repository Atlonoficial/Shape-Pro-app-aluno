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
    if (!user || !userProfile) {
      console.log('useCourses: Waiting for user and profile to load', { user: !!user, userProfile: !!userProfile });
      return;
    }

    const fetchCourses = async () => {
      console.log('useCourses: Starting fetch for user type:', userProfile.user_type);
      try {
        let query = supabase
          .from('courses')
          .select('*')
          .eq('is_published', true);

        // If user is teacher, show courses they created
        // If user is student, show courses from their teacher (free or enrolled)
        if (userProfile?.user_type === 'teacher') {
          console.log('useCourses: Fetching teacher courses for user:', user.id);
          query = query.eq('instructor', user.id);
        } else {
          // For students, get courses from their teacher
          console.log('useCourses: Fetching student teacher data for user:', user.id);
          const { data: studentData, error: studentError } = await supabase
            .from('students')
            .select('teacher_id')
            .eq('user_id', user.id)
            .maybeSingle();

          if (studentError) {
            console.error('useCourses: Error fetching student data:', studentError);
          }

          console.log('useCourses: Student data:', studentData);

          if (studentData?.teacher_id) {
            console.log('useCourses: Fetching courses from teacher:', studentData.teacher_id);
            query = query.eq('instructor', studentData.teacher_id);
          } else {
            // If student has no teacher, show free courses
            console.log('useCourses: No teacher found, showing free courses');
            query = query.eq('is_free', true);
          }
        }

        console.log('useCourses: Executing query');
        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) {
          console.error('useCourses: Error fetching courses:', error);
          return;
        }

        console.log('useCourses: Courses fetched successfully:', data?.length || 0);
        setCourses(data || []);
      } catch (error) {
        console.error('useCourses: Unexpected error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [user, userProfile]);

  return { courses, loading };
};