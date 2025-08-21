import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const useStudentTeacher = () => {
  const { user } = useAuth();
  const [teacherId, setTeacherId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchTeacherId = async () => {
    if (!user?.id) {
      console.log('[useStudentTeacher] No user ID');
      setTeacherId(null);
      setLoading(false);
      return;
    }

    try {
      console.log('[useStudentTeacher] Fetching teacher for user:', user.id);
      setLoading(true);
      
      const { data: studentData, error } = await supabase
        .from('students')
        .select('teacher_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('[useStudentTeacher] Error fetching student data:', error);
        setTeacherId(null);
        return;
      }

      console.log('[useStudentTeacher] Student data:', studentData);
      
      if (studentData?.teacher_id) {
        console.log('[useStudentTeacher] Found teacher ID:', studentData.teacher_id);
        setTeacherId(studentData.teacher_id);
      } else {
        console.log('[useStudentTeacher] No teacher found for this student');
        setTeacherId(null);
      }
    } catch (error) {
      console.error('[useStudentTeacher] Unexpected error:', error);
      setTeacherId(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeacherId();
  }, [user?.id]);

  return {
    teacherId,
    loading,
    refresh: fetchTeacherId,
  };
};