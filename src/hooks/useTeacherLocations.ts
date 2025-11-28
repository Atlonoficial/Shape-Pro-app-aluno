import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export interface TeacherLocation {
  id: string;
  teacher_id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  postal_code: string | null;
  country: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useTeacherLocations = (teacherId?: string | null) => {
  const { toast } = useToast();
  const [locations, setLocations] = useState<TeacherLocation[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLocations = async () => {
    if (!teacherId) {
      setLocations([]);
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('training_locations')
        .select('*')
        .eq('teacher_id', teacherId)
        .order('name');

      if (error) throw error;

      setLocations((data || []) as any as TeacherLocation[]);
    } catch (error: any) {
      console.error('Error fetching teacher locations:', error);
      toast({
        title: "Erro ao carregar locais",
        description: "Não foi possível carregar os locais de treino.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, [teacherId]);

  return {
    locations,
    loading,
    refreshLocations: fetchLocations,
  };
};