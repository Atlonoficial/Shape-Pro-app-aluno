import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export interface TeacherBookingSettings {
  id: string;
  teacher_id: string;
  minimum_advance_minutes: number;
  visibility_days: number;
  allow_same_day: boolean;
  created_at: string;
  updated_at: string;
}

export const useTeacherBookingSettings = (teacherId?: string | null) => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<TeacherBookingSettings | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchSettings = async () => {
    if (!teacherId) {
      setSettings(null);
      return;
    }

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('teacher_booking_settings')
        .select('*')
        .eq('teacher_id', teacherId)
        .single();

      if (error) {
        console.error('Error fetching teacher booking settings:', error);
        return;
      }
      
      setSettings(data);
    } catch (error: any) {
      console.error('Error fetching teacher booking settings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [teacherId]);

  return {
    settings,
    loading,
    minimumAdvanceMinutes: settings?.minimum_advance_minutes || 60,
    maximumAdvanceDays: settings?.visibility_days || 30,
    allowSameDayBooking: settings?.allow_same_day || false,
    refreshSettings: fetchSettings,
  };
};