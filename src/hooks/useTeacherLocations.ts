import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

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
      
      // For now, return mock data until table is properly set up
      setLocations([{
        id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        teacher_id: teacherId,
        name: 'Academia Mamuscle',
        address: 'Rua das Flores, 123',
        city: 'São Paulo',
        state: 'SP',
        postal_code: '01234-567',
        country: 'Brasil',
        phone: null,
        email: null,
        notes: null,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }]);
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