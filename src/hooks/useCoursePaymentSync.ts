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
    if (!courseId) return;

    try {
      setLoading(true);
      
      // Buscar dados do curso
      const { data: course, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();

      if (courseError) throw courseError;

      // Buscar configurações de pagamento do professor
      const { data: paymentSettings, error: paymentError } = await supabase
        .from('teacher_payment_settings')
        .select('*')
        .eq('teacher_id', course.instructor)
        .single();

      const hasActiveGateway = paymentSettings?.is_active && 
                              paymentSettings?.gateway_type && 
                              Object.keys(paymentSettings?.credentials || {}).length > 0;

      const canPurchase = hasActiveGateway && course.price && course.price > 0;

      setCourseData({
        ...course,
        hasActiveGateway,
        canPurchase
      });
    } catch (error) {
      console.error('Error fetching course payment data:', error);
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