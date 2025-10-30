import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface CourseProgress {
  id: string;
  course_id: string;
  user_id: string;
  overall_progress: number;
  module_progress: any;
  last_accessed: string;
  certificate_issued: boolean;
  certificate_url?: string;
}

export const useCourseProgress = (courseId?: string) => {
  const [courseProgress, setCourseProgress] = useState<CourseProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user || !courseId) {
      setLoading(false);
      return;
    }

    const fetchProgress = async () => {
      try {
        const { data, error } = await supabase
          .from('course_progress')
          .select('*')
          .eq('user_id', user.id)
          .eq('course_id', courseId)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching course progress:', error);
          return;
        }

        setCourseProgress(data);
      } catch (error) {
        console.error('Error fetching course progress:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();
  }, [user, courseId]);

  const updateProgress = async (moduleId: string, lessonId: string, completed: boolean) => {
    if (!user || !courseId) return;

    try {
      // Get current progress
      const currentProgress = Array.isArray(courseProgress?.module_progress) ? courseProgress.module_progress : [];
      const moduleIndex = currentProgress.findIndex((m: any) => m.module_id === moduleId);
      
      let updatedProgress;
      if (moduleIndex >= 0) {
        updatedProgress = [...currentProgress];
        const lessons = updatedProgress[moduleIndex].lessons || [];
        const lessonIndex = lessons.findIndex((l: any) => l.lesson_id === lessonId);
        
        if (lessonIndex >= 0) {
          lessons[lessonIndex] = { lesson_id: lessonId, completed, completed_at: new Date().toISOString() };
        } else {
          lessons.push({ lesson_id: lessonId, completed, completed_at: new Date().toISOString() });
        }
        
        updatedProgress[moduleIndex].lessons = lessons;
      } else {
        updatedProgress = [
          ...currentProgress,
          {
            module_id: moduleId,
            lessons: [{ lesson_id: lessonId, completed, completed_at: new Date().toISOString() }]
          }
        ];
      }

      // Calculate overall progress
      // This would need to be calculated based on total lessons vs completed lessons
      
      if (courseProgress) {
        // Update existing progress
        const { error } = await supabase
          .from('course_progress')
          .update({
            module_progress: updatedProgress,
            last_accessed: new Date().toISOString()
          })
          .eq('id', courseProgress.id);

        if (error) throw error;
      } else {
        // Create new progress record
        const { error } = await supabase
          .from('course_progress')
          .insert({
            course_id: courseId,
            user_id: user.id,
            module_progress: updatedProgress,
            overall_progress: 0,
            last_accessed: new Date().toISOString()
          });

        if (error) throw error;
      }

      // Refresh progress data
      const { data, error: fetchError } = await supabase
        .from('course_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .single();

      if (!fetchError && data) {
        setCourseProgress(data);
      }
    } catch (error) {
      console.error('Error updating course progress:', error);
    }
  };

  return { courseProgress, loading, updateProgress };
};