import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';

export interface TeacherAvailability {
  id: string;
  teacher_id: string;
  weekday: number;
  start_time: string;
  end_time: string;
  slot_minutes: number;
}

export const useStudentTeacherAvailability = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [availability, setAvailability] = useState<TeacherAvailability[]>([]);
  const [teacherId, setTeacherId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchTeacherAndAvailability = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // First, get the teacher ID for this student
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('teacher_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (studentError) throw studentError;
      
      const teacherIdFound = studentData?.teacher_id;
      setTeacherId(teacherIdFound);

      if (!teacherIdFound) {
        setAvailability([]);
        setLoading(false);
        return;
      }

      // Then fetch the teacher's availability
      const { data: availabilityData, error: availabilityError } = await supabase
        .from('teacher_availability')
        .select('*')
        .eq('teacher_id', teacherIdFound)
        .order('weekday', { ascending: true })
        .order('start_time', { ascending: true });

      if (availabilityError) throw availabilityError;
      setAvailability(availabilityData || []);
    } catch (error: any) {
      console.error('Error fetching teacher availability:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao carregar disponibilidade do professor',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeacherAndAvailability();

    // Set up real-time subscription for teacher availability changes
    let channel: any = null;
    
    if (teacherId) {
      channel = supabase
        .channel('teacher-availability')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'teacher_availability',
            filter: `teacher_id=eq.${teacherId}`,
          },
          () => {
            fetchTeacherAndAvailability();
          }
        )
        .subscribe();
    }

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [user?.id, teacherId]);

  // Helper function to get availability for a specific weekday
  const getAvailabilityForWeekday = (weekday: number) => {
    return availability.filter(av => av.weekday === weekday);
  };

  // Helper function to format weekday names
  const getWeekdayName = (weekday: number) => {
    const names = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    return names[weekday] || '';
  };

  return {
    availability,
    teacherId,
    loading,
    getAvailabilityForWeekday,
    getWeekdayName,
    refreshAvailability: fetchTeacherAndAvailability,
  };
};