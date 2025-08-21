import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useActiveSubscription } from './useActiveSubscription';

export interface TeacherProfile {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  bio?: string;
  instagram_url?: string;
  facebook_url?: string;
  whatsapp_number?: string;
  specialties?: string[];
}

export const useTeacherProfile = () => {
  const { teacherId } = useActiveSubscription();
  const [teacher, setTeacher] = useState<TeacherProfile | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchTeacherProfile = async () => {
    if (!teacherId) {
      setTeacher(null);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, email, avatar_url, bio, instagram_url, facebook_url, whatsapp_number, specialties')
        .eq('id', teacherId)
        .eq('user_type', 'teacher')
        .single();

      if (error) {
        console.error('Erro ao buscar perfil do professor:', error);
        return;
      }

      if (data) {
        setTeacher(data);
      }
    } catch (error) {
      console.error('Erro ao buscar perfil do professor:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeacherProfile();
  }, [teacherId]);

  return {
    teacher,
    loading,
    refreshTeacher: fetchTeacherProfile,
  };
};