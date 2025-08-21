import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/components/auth/AuthProvider';

export const useStudentTeacher = () => {
  const { user } = useAuthContext();
  const [teacherId, setTeacherId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchTeacherId = async () => {
    console.log('[useStudentTeacher] fetchTeacherId called, user:', user);
    
    if (!user?.id) {
      console.log('[useStudentTeacher] No user ID, using default teacher');
      // Use default teacher when no user is authenticated
      const defaultTeacherId = '0d5398c2-278e-4853-b980-f36961795e52'; // Atlon Tech
      setTeacherId(defaultTeacherId);
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
        // Use default teacher when there's an error
        const defaultTeacherId = '0d5398c2-278e-4853-b980-f36961795e52'; // Atlon Tech
        console.log('[useStudentTeacher] Using default teacher:', defaultTeacherId);
        setTeacherId(defaultTeacherId);
        return;
      }

      console.log('[useStudentTeacher] Student data:', studentData);
      
      if (studentData?.teacher_id) {
        console.log('[useStudentTeacher] Found teacher ID:', studentData.teacher_id);
        setTeacherId(studentData.teacher_id);
      } else {
        // Use default teacher when no student record exists
        const defaultTeacherId = '0d5398c2-278e-4853-b980-f36961795e52'; // Atlon Tech
        console.log('[useStudentTeacher] No student record found, using default teacher:', defaultTeacherId);
        setTeacherId(defaultTeacherId);
      }
    } catch (error) {
      console.error('[useStudentTeacher] Unexpected error:', error);
      // Use default teacher when there's an unexpected error
      const defaultTeacherId = '0d5398c2-278e-4853-b980-f36961795e52'; // Atlon Tech
      console.log('[useStudentTeacher] Error occurred, using default teacher:', defaultTeacherId);
      setTeacherId(defaultTeacherId);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('[useStudentTeacher] useEffect triggered, user?.id:', user?.id);
    fetchTeacherId();
  }, [user?.id]);

  return {
    teacherId,
    loading,
    refresh: fetchTeacherId,
  };
};