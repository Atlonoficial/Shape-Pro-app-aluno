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
      console.log('[useCoursePaymentSync] Course instructor:', course.instructor);
      console.log('[useCoursePaymentSync] Course price:', course.price);

      // Buscar configurações de pagamento do professor
      const { data: paymentSettings, error: paymentError } = await supabase
        .from('teacher_payment_settings')
        .select('*')
        .eq('teacher_id', course.instructor)
        .single();

      console.log('[useCoursePaymentSync] Payment settings query result:', { data: paymentSettings, error: paymentError });

      const hasActiveGateway = paymentSettings?.is_active && 
                              paymentSettings?.gateway_type && 
                              Object.keys(paymentSettings?.credentials || {}).length > 0;

      const canPurchase = hasActiveGateway && course.price && course.price > 0;

      console.log('[useCoursePaymentSync] Gateway analysis:', {
        hasPaymentSettings: !!paymentSettings,
        isActive: paymentSettings?.is_active,
        gatewayType: paymentSettings?.gateway_type,
        hasCredentials: Object.keys(paymentSettings?.credentials || {}).length > 0,
        hasActiveGateway,
        coursePrice: course.price,
        canPurchase
      });

      const courseData = {
        ...course,
        hasActiveGateway,
        canPurchase
      };

      console.log('[useCoursePaymentSync] Final course data:', courseData);
      setCourseData(courseData);
    } catch (error) {
      console.error('[useCoursePaymentSync] Error fetching course payment data:', error);
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