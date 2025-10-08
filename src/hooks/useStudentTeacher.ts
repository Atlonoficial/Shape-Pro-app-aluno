import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/components/auth/AuthProvider';

const DEFAULT_TEACHER_ID = '2db424b4-08d2-4ad0-9dd0-971eaab960e1'; // Antonio Bispo

export const useStudentTeacher = () => {
  const { user } = useAuthContext();
  const [teacherId, setTeacherId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchTeacherId = async () => {
    console.log('[useStudentTeacher] fetchTeacherId called, user:', user);
    
    if (!user?.id) {
      console.log('[useStudentTeacher] No user ID, using default teacher');
      setTeacherId(DEFAULT_TEACHER_ID);
      setLoading(false);
      return;
    }

    try {
      console.log('[useStudentTeacher] Fetching teacher for user:', user.id);
      setLoading(true);
      
      // 1. Try to fetch from student-teacher relationship
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('teacher_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!studentError && studentData?.teacher_id) {
        console.log('[useStudentTeacher] Found teacher from students table:', studentData.teacher_id);
        setTeacherId(studentData.teacher_id);
        setLoading(false);
        return;
      }

      // 2. Try to fetch from tenant's default teacher
      const { data: profileData } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .maybeSingle();

      if (profileData?.tenant_id) {
        const { data: tenantData } = await supabase
          .from('tenants')
          .select('default_teacher_id')
          .eq('id', profileData.tenant_id)
          .maybeSingle();

        if (tenantData?.default_teacher_id) {
          console.log('[useStudentTeacher] Found teacher from tenant:', tenantData.default_teacher_id);
          setTeacherId(tenantData.default_teacher_id);
          setLoading(false);
          return;
        }
      }

      // 3. Fallback to default teacher
      console.log('[useStudentTeacher] Using fallback default teacher:', DEFAULT_TEACHER_ID);
      setTeacherId(DEFAULT_TEACHER_ID);
    } catch (error) {
      console.error('[useStudentTeacher] Unexpected error:', error);
      setTeacherId(DEFAULT_TEACHER_ID);
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