/**
 * 🔄 useCoursePaymentSync Hook - SIMPLIFIED FOR iOS COMPLIANCE
 * 
 * ⚠️ Apple App Store Guideline 3.1.1 Compliance
 * 
 * Este hook foi SIMPLIFICADO para remover lógica de pagamento externo.
 * O campo `canPurchase` sempre retorna `false` para evitar qualquer
 * fluxo de compra externa no iOS.
 * 
 * O acesso a cursos é controlado pelo PROFESSOR no Dashboard:
 * - Professor cria curso e define visibilidade
 * - Aluno vinculado ao professor pode ver cursos publicados
 * - Pagamento pelo serviço acontece FORA do app
 * 
 * @see Guideline 3.1.3(e) - Person-to-person services exception
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface CoursePaymentData {
  id: string;
  title: string;
  description?: string;
  price?: number;
  thumbnail?: string;
  instructor: string;
  total_lessons?: number;
  hasActiveGateway: boolean;
  canPurchase: boolean;
}

export const useCoursePaymentSync = (courseId: string) => {
  const { user } = useAuth();
  const [courseData, setCourseData] = useState<CoursePaymentData | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchCourseWithPaymentData = async () => {
    if (!courseId) {
      console.log('[useCoursePaymentSync] No courseId provided');
      return;
    }

    try {
      setLoading(true);
      console.log('[useCoursePaymentSync] Fetching course data for ID:', courseId);

      // Buscar dados do curso
      const { data: course, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();

      if (courseError) {
        console.error('[useCoursePaymentSync] Course fetch error:', courseError);
        throw courseError;
      }

      console.log('[useCoursePaymentSync] Course data:', course);

      // 🚫 iOS COMPLIANCE: canPurchase always false
      // External purchases are not allowed on iOS
      // Access is controlled by the teacher in the Dashboard
      const coursePaymentData: CoursePaymentData = {
        id: course.id,
        title: course.title,
        description: course.description,
        price: undefined, // Don't expose price on iOS
        thumbnail: course.thumbnail,
        instructor: course.instructor,
        total_lessons: course.total_lessons,
        hasActiveGateway: false, // Always false for iOS compliance
        canPurchase: false // 🚫 DISABLED: No external purchases on iOS
      };

      console.log('[useCoursePaymentSync] Final course data (iOS compliant):', coursePaymentData);
      setCourseData(coursePaymentData);

    } catch (error) {
      console.error('[useCoursePaymentSync] Error fetching course data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourseWithPaymentData();
  }, [courseId, user]);

  return {
    courseData,
    loading,
    refresh: fetchCourseWithPaymentData
  };
};