import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export interface AvailableSlot {
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
      
      const { data, error } = await supabase.rpc('list_available_slots', {
        p_teacher_id: teacherId,
        p_date: dateStr,
        p_slot_minutes: slotMinutes,
      });

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Error fetching available slots:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao buscar horários disponíveis',
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
    description?: string
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
    }
  ) => {
    return bookAppointment(
      teacherId,
      scheduledTime,
      options?.type || 'consultation',
      options?.duration || 60,
      options?.title,
      options?.description
    );
  };

  return {
    loading,
    getAvailableSlots,
    bookAppointment,
    quickBookAppointment,
  };
};