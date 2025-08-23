import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface ModuleWithCourse {
  id: string;
  title: string;
  description: string;
  cover_image_url: string;
  course_id: string;
  course_title: string;
  course_thumbnail: string;
  order_index: number;
  lessons_count: number;
}

export const useAllModules = () => {
  const [modules, setModules] = useState<ModuleWithCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, userProfile } = useAuth();

  useEffect(() => {
    if (!user || !userProfile) {
      console.log('useAllModules: Waiting for user and profile to load');
      return;
    }

    const fetchAllModules = async () => {
      console.log('useAllModules: Starting fetch for user type:', userProfile.user_type);
      try {
        let coursesQuery = supabase
          .from('courses')
          .select('id, title, thumbnail')
          .eq('is_published', true);

        // Get courses based on user type
        if (userProfile?.user_type === 'teacher') {
          coursesQuery = coursesQuery.eq('instructor', user.id);
        } else {
          // For students, get courses from their teacher
          const { data: studentData } = await supabase
            .from('students')
            .select('teacher_id')
            .eq('user_id', user.id)
            .maybeSingle();

          if (studentData?.teacher_id) {
            coursesQuery = coursesQuery.eq('instructor', studentData.teacher_id);
          } else {
            // If student has no teacher, show free courses
            coursesQuery = coursesQuery.eq('is_free', true);
          }
        }

        const { data: courses, error: coursesError } = await coursesQuery;

        if (coursesError) {
          console.error('useAllModules: Error fetching courses:', coursesError);
          return;
        }

        if (!courses || courses.length === 0) {
          console.log('useAllModules: No courses found');
          setModules([]);
          return;
        }

        // Get all modules for these courses
        const courseIds = courses.map(course => course.id);
        const { data: modulesData, error: modulesError } = await supabase
          .from('course_modules' as any)
          .select(`
            id,
            title,
            description,
            cover_image_url,
            course_id,
            order_index,
            is_published
          `)
          .in('course_id', courseIds)
          .eq('is_published', true)
          .order('course_id', { ascending: true })
          .order('order_index', { ascending: true });

        if (modulesError) {
          console.error('useAllModules: Error fetching modules:', modulesError);
          return;
        }

        if (!modulesData) {
          setModules([]);
          return;
        }

        // Get lesson counts for each module
        const moduleIds = modulesData.map((module: any) => module.id);
        const { data: lessonsCount, error: lessonsError } = await supabase
          .from('course_lessons' as any)
          .select('module_id, id')
          .in('module_id', moduleIds)
          .eq('is_published', true);

        if (lessonsError) {
          console.error('useAllModules: Error fetching lessons count:', lessonsError);
        }

        // Count lessons per module
        const lessonsCountMap = lessonsCount?.reduce((acc: any, lesson: any) => {
          acc[lesson.module_id] = (acc[lesson.module_id] || 0) + 1;
          return acc;
        }, {} as Record<string, number>) || {};

        // Combine modules with course data and lesson counts
        const modulesWithCourse: ModuleWithCourse[] = modulesData.map((module: any) => {
          const course = courses.find(c => c.id === module.course_id);
          return {
            id: module.id,
            title: module.title,
            description: module.description || '',
            cover_image_url: module.cover_image_url || course?.thumbnail || '',
            course_id: module.course_id,
            course_title: course?.title || '',
            course_thumbnail: course?.thumbnail || '',
            order_index: module.order_index,
            lessons_count: lessonsCountMap[module.id] || 0
          };
        });

        console.log('useAllModules: Modules fetched successfully:', modulesWithCourse.length);
        setModules(modulesWithCourse);
      } catch (error) {
        console.error('useAllModules: Unexpected error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllModules();
  }, [user, userProfile]);

  return { modules, loading };
};