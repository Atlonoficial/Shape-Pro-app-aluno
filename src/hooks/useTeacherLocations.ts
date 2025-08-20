import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface TeacherLocation {
  id: string;
  teacher_id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
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
        .eq('is_active', true)
        .order('name');

      if (error) {
        console.error('Error fetching teacher locations:', error);
        toast({
          title: "Erro ao carregar locais",
          description: "Não foi possível carregar os locais de treino.",
          variant: "destructive",
        });
        return;
      }
      
      setLocations(data || []);
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

  // Set up real-time subscription
  useEffect(() => {
    if (!teacherId) return;

    const channel = supabase
      .channel('teacher_locations_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'training_locations',
          filter: `teacher_id=eq.${teacherId}`
        },
        () => {
          fetchLocations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [teacherId]);

  return {
    locations,
    loading,
    refreshLocations: fetchLocations,
  };
};