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
      return;
    }

    const fetchAllModules = async () => {
      try {
        let coursesQuery = supabase
          .from('courses')
          .select('id, title, description, thumbnail, instructor, is_free, price, total_lessons')
          .eq('is_published', true);

        // Get courses based on user type
        if (userProfile?.user_type === 'teacher') {
          coursesQuery = coursesQuery.eq('instructor', user.id);
        } else {
          // For students, get courses from their teacher OR public courses OR global courses
          const { data: studentData } = await supabase
            .from('students')
            .select('teacher_id')
            .eq('user_id', user.id)
            .maybeSingle();

          console.log('useAllModules: Student data:', studentData);

          if (studentData?.teacher_id) {
            // Busca: Cursos do professor OU Cursos públicos OU Cursos globais
            coursesQuery = coursesQuery.or(`instructor.eq.${studentData.teacher_id},is_public.eq.true,instructor.is.null`);
          } else {
            // Se não tem professor: Cursos públicos OU Cursos globais
            coursesQuery = coursesQuery.or(`is_public.eq.true,instructor.is.null`);
          }
        }

        const { data: courses, error: coursesError } = await coursesQuery;

        if (coursesError) {
          console.error('useAllModules: Error fetching courses:', coursesError);
          return;
        }

        if (!courses || courses.length === 0) {
          setCourses([]);
          return;
        }

        // Check user purchases and active subscriptions for course access
        const { data: userPurchases } = await supabase
          .from('user_purchases')
          .select('course_id')
          .eq('user_id', user.id);

        const { data: activeSubscriptions } = await supabase
          .from('active_subscriptions')
          .select('plan_id, status, end_date')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .gte('end_date', new Date().toISOString().split('T')[0]);

        const purchasedCourseIds = userPurchases?.map(p => p.course_id) || [];
        const hasActiveSubscription = activeSubscriptions && activeSubscriptions.length > 0;

        console.log('useAllModules: User purchases:', purchasedCourseIds);
        console.log('useAllModules: Active subscriptions:', hasActiveSubscription);

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
                hasActiveSubscription ||
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
            hasActiveSubscription ||
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

          return courseWithModules;
        }); // Show ALL courses, not just ones with modules
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