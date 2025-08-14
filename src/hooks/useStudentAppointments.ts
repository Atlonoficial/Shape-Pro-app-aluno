import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';

export interface StudentAppointment {
  id: string;
  scheduled_time: string;
  duration: number | null;
  type: string | null;
  title: string | null;
  status: string | null;
  teacher_id: string | null;
}

export const useStudentAppointments = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<StudentAppointment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAppointments = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('appointments')
        .select('id, scheduled_time, duration, type, title, status, teacher_id')
        .eq('student_id', user.id)
        .order('scheduled_time', { ascending: true });

      if (error) throw error;
      setAppointments(data || []);
    } catch (error: any) {
      console.error('Error fetching appointments:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao carregar agendamentos',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const cancelAppointment = async (appointmentId: string, reason?: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ 
          status: 'cancelled',
          notes: reason || 'Cancelado pelo aluno'
        })
        .eq('id', appointmentId)
        .eq('student_id', user?.id);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Agendamento cancelado com sucesso',
      });

      // Refresh appointments
      fetchAppointments();
    } catch (error: any) {
      console.error('Error cancelling appointment:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao cancelar agendamento',
        variant: 'destructive',
      });
    }
  };

  const rescheduleAppointment = async (appointmentId: string, newDateTime: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ 
          scheduled_time: newDateTime,
          status: 'scheduled'
        })
        .eq('id', appointmentId)
        .eq('student_id', user?.id);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Agendamento reagendado com sucesso',
      });

      // Refresh appointments
      fetchAppointments();
    } catch (error: any) {
      console.error('Error rescheduling appointment:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao reagendar',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    fetchAppointments();

    // Set up real-time subscription
    const channel = supabase
      .channel('student-appointments')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments',
          filter: `student_id=eq.${user?.id}`,
        },
        () => {
          fetchAppointments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  // Separate upcoming and past appointments
  const now = new Date();
  const upcomingAppointments = appointments.filter(
    (apt) => new Date(apt.scheduled_time) >= now
  );
  const pastAppointments = appointments.filter(
    (apt) => new Date(apt.scheduled_time) < now
  ).reverse();

  return {
    appointments,
    upcomingAppointments,
    pastAppointments,
    loading,
    cancelAppointment,
    rescheduleAppointment,
    refreshAppointments: fetchAppointments,
  };
};