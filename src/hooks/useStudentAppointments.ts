import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface StudentAppointment {
  id: string;
  scheduled_time: string;
  duration: number | null;
  type: string | null;
  title: string | null;
  status: string | null;
  teacher_id: string | null;
  student_objectives: string | null;
  student_notes: string | null;
  notes: string | null;
  cancellation_reason: string | null;
  cancelled_by: string | null;
  cancelled_at: string | null;
}

export const useStudentAppointments = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<StudentAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [optimisticOperations, setOptimisticOperations] = useState<Set<string>>(new Set());

  const fetchAppointments = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('appointments')
        .select('id, scheduled_time, duration, type, title, status, teacher_id, student_objectives, student_notes, notes, cancellation_reason, cancelled_by, cancelled_at')
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

  const cancelAppointment = useCallback(async (appointmentId: string, reason?: string) => {
    // Optimistic UI - immediately update local state
    setOptimisticOperations(prev => new Set(prev).add(appointmentId));
    setAppointments(prev => 
      prev.map(apt => 
        apt.id === appointmentId 
          ? { ...apt, status: 'cancelled' }
          : apt
      )
    );

    try {
      const { error } = await supabase
        .from('appointments')
        .update({ 
          status: 'cancelled',
          cancellation_reason: reason || 'Cancelado pelo aluno',
          cancelled_by: user?.id,
          cancelled_at: new Date().toISOString()
        })
        .eq('id', appointmentId)
        .eq('student_id', user?.id);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Agendamento cancelado com sucesso',
      });
    } catch (error: any) {
      console.error('Error cancelling appointment:', error);
      
      // Rollback optimistic update on error
      setAppointments(prev => 
        prev.map(apt => 
          apt.id === appointmentId 
            ? { ...apt, status: 'scheduled' }
            : apt
        )
      );
      
      toast({
        title: 'Erro',
        description: 'Falha ao cancelar agendamento',
        variant: 'destructive',
      });
    } finally {
      setOptimisticOperations(prev => {
        const newSet = new Set(prev);
        newSet.delete(appointmentId);
        return newSet;
      });
    }
  }, [user?.id, toast]);

  const rescheduleAppointment = useCallback(async (appointmentId: string, newDateTime: string) => {
    // Optimistic UI - immediately update local state
    setOptimisticOperations(prev => new Set(prev).add(appointmentId));
    const originalAppointment = appointments.find(apt => apt.id === appointmentId);
    
    setAppointments(prev => 
      prev.map(apt => 
        apt.id === appointmentId 
          ? { ...apt, scheduled_time: newDateTime, status: 'scheduled' }
          : apt
      )
    );

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
    } catch (error: any) {
      console.error('Error rescheduling appointment:', error);
      
      // Rollback optimistic update on error
      if (originalAppointment) {
        setAppointments(prev => 
          prev.map(apt => 
            apt.id === appointmentId 
              ? originalAppointment
              : apt
          )
        );
      }
      
      toast({
        title: 'Erro',
        description: 'Falha ao reagendar',
        variant: 'destructive',
      });
    } finally {
      setOptimisticOperations(prev => {
        const newSet = new Set(prev);
        newSet.delete(appointmentId);
        return newSet;
      });
    }
  }, [appointments, user?.id, toast]);

  // Handle real-time updates with granular updates
  const handleRealtimeUpdate = useCallback((payload: any) => {
    if (payload.eventType === 'INSERT') {
      setAppointments(prev => [...prev, payload.new]);
    } else if (payload.eventType === 'UPDATE') {
      setAppointments(prev => 
        prev.map(apt => 
          apt.id === payload.new.id ? payload.new : apt
        )
      );
    } else if (payload.eventType === 'DELETE') {
      setAppointments(prev => 
        prev.filter(apt => apt.id !== payload.old.id)
      );
    }
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    
    fetchAppointments();

    // Set up granular real-time subscriptions for instant updates
    const channel = supabase
      .channel('student-appointments-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'appointments',
          filter: `student_id=eq.${user.id}`,
        },
        (payload) => handleRealtimeUpdate({ eventType: 'INSERT', new: payload.new })
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'appointments',
          filter: `student_id=eq.${user.id}`,
        },
        (payload) => handleRealtimeUpdate({ eventType: 'UPDATE', new: payload.new, old: payload.old })
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'appointments',
          filter: `student_id=eq.${user.id}`,
        },
        (payload) => handleRealtimeUpdate({ eventType: 'DELETE', old: payload.old })
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, handleRealtimeUpdate]);

  // Separate upcoming and past appointments
  const now = new Date();
  const upcomingAppointments = appointments.filter(
    (apt) => new Date(apt.scheduled_time) >= now && apt.status !== 'cancelled'
  );
  const pastAppointments = appointments.filter(
    (apt) => new Date(apt.scheduled_time) < now || apt.status === 'cancelled'
  ).reverse();

  return {
    appointments,
    upcomingAppointments,
    pastAppointments,
    loading,
    cancelAppointment,
    rescheduleAppointment,
    refreshAppointments: fetchAppointments,
    optimisticOperations,
    isOptimistic: (id: string) => optimisticOperations.has(id),
  };
};