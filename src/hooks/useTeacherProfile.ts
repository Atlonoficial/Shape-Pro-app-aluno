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
  specialties?: string | string[];
}

export const useTeacherProfile = () => {
  const { teacherId, loading: teacherIdLoading } = useStudentTeacher();
  const [teacher, setTeacher] = useState<TeacherProfile | null>(null);
  const [loading, setLoading] = useState(false);

  console.log('[useTeacherProfile] Render - teacherId:', teacherId, 'teacherIdLoading:', teacherIdLoading);

  // FASE 3: Logs avançados para debugging
  const fetchTeacherProfile = async () => {
    if (!teacherId) {
      console.warn('[useTeacherProfile] ⚠️ No teacherId provided');
      setTeacher(null);
      return;
    }

    try {
      setLoading(true);
      console.log('[useTeacherProfile] 🔍 Fetching teacher profile:', teacherId);
      
      // Buscar dados do professor
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

      if (error) {
        // Log detalhado do erro RLS ou de query
        const currentUser = await supabase.auth.getUser();
        console.error('[useTeacherProfile] ❌ RLS or Query Error:', {
          error,
          errorCode: error.code,
          errorMessage: error.message,
          teacherId,
          currentUserId: currentUser.data.user?.id,
          hint: 'Check if RLS policies allow student to view teacher profile'
        });
        setTeacher(null);
        return;
      }

      if (data) {
        console.log('[useTeacherProfile] ✅ Teacher profile loaded:', {
          id: data.id,
          name: data.name,
          hasBio: !!data.bio,
          hasAvatar: !!data.avatar_url,
          hasSocials: !!(data.instagram_url || data.facebook_url || data.youtube_url || data.whatsapp_url),
          specialtiesCount: Array.isArray(data.specialties) ? data.specialties.length : 0
        });
        setTeacher(data);
      } else {
        console.warn('[useTeacherProfile] ⚠️ Teacher not found or RLS blocked access');
        setTeacher(null);
      }
    } catch (error) {
      console.error('[useTeacherProfile] 💥 Unexpected error:', error);
      setTeacher(null);
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