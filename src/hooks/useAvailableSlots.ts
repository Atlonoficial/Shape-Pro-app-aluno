import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface AvailableSlot {
  slot_date: string;
  slot_start: string;
  slot_end: string;
  slot_minutes: number;
  slot_teacher_id: string;
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
      
      console.log('🕒 Buscando slots para:', { teacherId, dateStr, slotMinutes });
      console.log('⏰ Hora atual:', new Date().toISOString());
      
      const { data, error } = await supabase.rpc('list_available_slots_improved', {
        p_teacher_id: teacherId,
        p_start_date: dateStr,
        p_end_date: dateStr, 
        p_slot_minutes: slotMinutes,
      });

      if (error) {
        console.error('❌ Erro na RPC:', error);
        throw error;
      }
      
      console.log('✅ Slots disponíveis retornados:', data);
      console.log('📊 Total de slots encontrados:', data?.length || 0);
      
      // Log each individual slot for debugging
      if (data && data.length > 0) {
        data.forEach((slot: any, index: number) => {
          console.log(`📅 Slot ${index + 1}:`, {
            start: slot.slot_start,
            end: slot.slot_end,
            minutes: slot.slot_minutes,
            teacherId: slot.slot_teacher_id,
            date: slot.slot_date
          });
        });
      } else {
        console.log('⚠️ Nenhum slot disponível encontrado');
      }
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

  const bookAppointment = async ({
    teacherId,
    scheduledTime,
    type = 'class',
    duration,
    title,
    description,
    studentTitle,
    studentObjectives,
    studentNotes,
    locationId,
  }: {
    teacherId: string;
    scheduledTime: string;
    type?: string;
    duration?: number;
    title?: string;
    description?: string;
    studentTitle?: string;
    studentObjectives?: string;
    studentNotes?: string;
    locationId?: string;
  }): Promise<string | null> => {
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
        p_location_id: locationId || null,
      } as any);

      if (error) {
        throw error;
      }

      toast({
        title: 'Agendamento confirmado!',
        description: 'Seu agendamento foi criado com sucesso.',
      });

      return data;
    } catch (error: any) {
      console.error('Error booking appointment:', error);
      
      let errorMessage = 'Erro ao confirmar agendamento';
      if (error.message?.includes('Selected time is not available')) {
        errorMessage = 'Este horário não está mais disponível';
      } else if (error.message?.includes('too close to current time')) {
        errorMessage = 'Horário muito próximo do atual. Tente um horário mais tarde.';
      } else if (error.message?.includes('Same day booking is not allowed')) {
        errorMessage = 'Agendamentos no mesmo dia não são permitidos';
      } else if (error.message?.includes('Not authorized')) {
        errorMessage = 'Você não tem permissão para agendar com este professor';
      }
      
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
      
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const quickBookAppointment = async (
    teacherId: string,
    scheduledTime: string,
    options: {
      type?: string;
      duration?: number;
      title?: string;
      description?: string;
      studentTitle?: string;
      studentObjectives?: string;
      studentNotes?: string;
      locationId?: string;
    } = {}
  ): Promise<string | null> => {
    return bookAppointment({
      teacherId,
      scheduledTime,
      ...options,
    });
  };

  return {
    loading,
    getAvailableSlots,
    bookAppointment,
    quickBookAppointment,
  };
};