import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface CourseWithModules {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  instructor: string;
  is_free: boolean;
  price: number | null;
  hasAccess: boolean;
  total_lessons: number;
  modules: ModuleWithCourse[];
}

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
  hasAccess: boolean;
}

export const useAllModules = () => {
  const [courses, setCourses] = useState<CourseWithModules[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, userProfile } = useAuth();

  useEffect(() => {
    if (!user || !userProfile) {
      console.log('🔍 useAllModules: Waiting for user and profile to load');
      return;
    }

    const fetchAllModules = async () => {
        console.log('🚀 useAllModules: Starting fetch for user type:', userProfile.user_type);
        try {
          let coursesQuery = supabase
            .from('courses')
            .select('id, title, description, thumbnail, instructor, is_free, price, total_lessons')
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

            console.log('useAllModules: Student data:', studentData);

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

          console.log('📚 useAllModules: Fetched courses:', courses?.length, courses);

          if (!courses || courses.length === 0) {
            console.log('❌ useAllModules: No courses found');
            setCourses([]);
            return;
          }

        // Check user purchases for course access
        const { data: userPurchases } = await supabase
          .from('user_purchases')
          .select('course_id')
          .eq('user_id', user.id);

        const purchasedCourseIds = userPurchases?.map(p => p.course_id) || [];
        console.log('useAllModules: User purchases:', purchasedCourseIds);

        // Get all modules for these courses
        const courseIds = courses.map(course => course.id);
        console.log('useAllModules: Course IDs to fetch modules for:', courseIds);
        
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
        }

        console.log('📦 useAllModules: Modules data:', modulesData?.length, modulesData);

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

        // Group modules by course and add access information
        const coursesWithModules: CourseWithModules[] = courses.map((course: any) => {
          const courseModules = (modulesData || [])
            .filter((module: any) => module.course_id === course.id)
            .map((module: any) => {
              const hasAccess = course.is_free || 
                               purchasedCourseIds.includes(course.id) || 
                               userProfile?.user_type === 'teacher';
              
              return {
                id: module.id,
                title: module.title,
                description: module.description || '',
                cover_image_url: module.cover_image_url || course.thumbnail || '',
                course_id: module.course_id,
                course_title: course.title || '',
                course_thumbnail: course.thumbnail || '',
                order_index: module.order_index,
                lessons_count: lessonsCountMap[module.id] || 0,
                hasAccess
              };
            });

          const hasAccess = course.is_free || 
                           purchasedCourseIds.includes(course.id) || 
                           userProfile?.user_type === 'teacher';

          const courseWithModules = {
            id: course.id,
            title: course.title,
            description: course.description || '',
            thumbnail: course.thumbnail || '',
            instructor: course.instructor,
            is_free: course.is_free,
            price: course.price,
            hasAccess,
            total_lessons: course.total_lessons || 0,
            modules: courseModules
          };

          console.log('✅ useAllModules: Course processed:', course.title, 'modules:', courseModules.length, 'hasAccess:', hasAccess);
          return courseWithModules;
        }); // Show ALL courses, not just ones with modules

        console.log('🎉 useAllModules: All courses processed successfully:', coursesWithModules.length, 'courses with modules:', coursesWithModules.filter(c => c.modules.length > 0).length);
        setCourses(coursesWithModules);
      } catch (error) {
        console.error('useAllModules: Unexpected error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllModules();
  }, [user, userProfile]);

  return { courses, loading };
};