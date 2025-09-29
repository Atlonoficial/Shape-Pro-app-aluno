import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useStudentTeacher } from './useStudentTeacher';

export interface TeacherProfile {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  bio?: string;
  instagram_url?: string;
  facebook_url?: string;
  youtube_url?: string;
  whatsapp_url?: string;
  specialties?: string[];
}

export const useTeacherProfile = () => {
  const { teacherId, loading: teacherIdLoading } = useStudentTeacher();
  const [teacher, setTeacher] = useState<TeacherProfile | null>(null);
  const [loading, setLoading] = useState(false);

  console.log('[useTeacherProfile] Render - teacherId:', teacherId, 'teacherIdLoading:', teacherIdLoading);

  const fetchTeacherProfile = async () => {
    console.log('[useTeacherProfile] fetchTeacherProfile called, teacherId:', teacherId);
    
    if (!teacherId) {
      console.log('[useTeacherProfile] No teacherId, setting teacher to null');
      setTeacher(null);
      return;
    }

    try {
      console.log('[useTeacherProfile] Starting fetch for teacherId:', teacherId);
      setLoading(true);
      
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id, 
          name, 
          email, 
          avatar_url, 
          bio, 
          instagram_url, 
          facebook_url, 
          youtube_url,
          whatsapp_url,
          specialties
        `)
        .eq('id', teacherId)
        .eq('user_type', 'teacher')
        .maybeSingle();

      console.log('[useTeacherProfile] Query result:', { data, error });

      if (error) {
        console.error('[useTeacherProfile] Error fetching teacher profile:', error);
        return;
      }

      if (data) {
        console.log('[useTeacherProfile] Teacher data found:', data);
        setTeacher(data);
      } else {
        console.log('[useTeacherProfile] No teacher data returned');
        setTeacher(null);
      }
    } catch (error) {
      console.error('[useTeacherProfile] Unexpected error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('[useTeacherProfile] useEffect triggered - teacherId:', teacherId, 'teacherIdLoading:', teacherIdLoading);
    fetchTeacherProfile();
  }, [teacherId]);

  return {
    teacher,
    loading: loading || teacherIdLoading,
    refreshTeacher: fetchTeacherProfile,
  };
};