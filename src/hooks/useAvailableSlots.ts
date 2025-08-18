import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export interface AvailableSlot {
  slot_date: string;
  slot_start: string;
  slot_end: string;
}

export const useAvailableSlots = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const getAvailableSlots = async (
    teacherId: string,
    date: Date | string,
    slotMinutes: number = 60
  ): Promise<AvailableSlot[]> => {
    try {
      setLoading(true);
      
      const dateStr = typeof date === 'string' ? date : date.toISOString().slice(0, 10);
      
      console.log('Fetching slots for:', { teacherId, dateStr, slotMinutes });
      
      // Use improved function that respects teacher booking settings
      const { data, error } = await supabase.rpc('list_available_slots_improved', {
        p_teacher_id: teacherId,
        p_start_date: dateStr,
        p_end_date: dateStr, // Same date for start and end to get slots for specific day
        p_slot_minutes: slotMinutes,
      });

      if (error) {
        console.error('RPC Error:', error);
        throw error;
      }
      
      console.log('Available slots returned:', data);
      return data || [];
    } catch (error: any) {
      console.error('Error fetching available slots:', error);
      
      // More specific error messages
      let errorMessage = 'Falha ao buscar horários disponíveis';
      if (error.message?.includes('Not authorized')) {
        errorMessage = 'Você não tem permissão para visualizar os horários deste professor';
      } else if (error.message?.includes('Not authenticated')) {
        errorMessage = 'Você precisa estar logado para ver os horários';
      }
      
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  const bookAppointment = async (
    teacherId: string,
    scheduledTime: string,
    type: string = 'consultation',
    duration: number = 60,
    title?: string,
    description?: string,
    studentTitle?: string,
    studentObjectives?: string,
    studentNotes?: string
  ): Promise<{ success: boolean; appointmentId?: string }> => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.rpc('book_appointment', {
        p_teacher_id: teacherId,
        p_scheduled_time: scheduledTime,
        p_type: type,
        p_duration: duration,
        p_title: title,
        p_description: description,
        p_student_title: studentTitle,
        p_student_objectives: studentObjectives,
        p_student_notes: studentNotes,
      });

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Agendamento criado com sucesso!',
      });

      return { success: true, appointmentId: data };
    } catch (error: any) {
      console.error('Error booking appointment:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Falha ao criar agendamento',
        variant: 'destructive',
      });
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const quickBookAppointment = async (
    teacherId: string,
    scheduledTime: string,
    options?: {
      type?: string;
      duration?: number;
      title?: string;
      description?: string;
      studentTitle?: string;
      studentObjectives?: string;
      studentNotes?: string;
    }
  ) => {
    return bookAppointment(
      teacherId,
      scheduledTime,
      options?.type || 'consultation',
      options?.duration || 60,
      options?.title,
      options?.description,
      options?.studentTitle,
      options?.studentObjectives,
      options?.studentNotes
    );
  };

  return {
    loading,
    getAvailableSlots,
    bookAppointment,
    quickBookAppointment,
  };
};