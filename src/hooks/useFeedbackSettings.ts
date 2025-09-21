import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface TeacherFeedbackSettings {
  id?: string;
  teacher_id: string;
  feedback_frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  feedback_days: number[];
  custom_questions: CustomQuestion[];
  is_active: boolean;
}

export interface CustomQuestion {
  id: string;
  text: string;
  type: 'text' | 'rating' | 'multiple_choice';
  options?: string[];
  required: boolean;
}

export const useFeedbackSettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [settings, setSettings] = useState<TeacherFeedbackSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('teacher_feedback_settings')
        .select('*')
        .eq('teacher_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setSettings({
          ...data,
          feedback_frequency: data.feedback_frequency as 'daily' | 'weekly' | 'biweekly' | 'monthly',
          custom_questions: (data.custom_questions as any[]) || []
        });
      } else {
        // Create default settings
        const defaultSettings: TeacherFeedbackSettings = {
          teacher_id: user.id,
          feedback_frequency: 'weekly',
          feedback_days: [5], // Friday
          custom_questions: [],
          is_active: true,
        };
        setSettings(defaultSettings);
      }
    } catch (error) {
      console.error('Error fetching feedback settings:', error);
      toast({
        title: "Erro ao carregar configurações",
        description: "Não foi possível carregar as configurações de feedback.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (newSettings: TeacherFeedbackSettings): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      const { error } = await supabase
        .from('teacher_feedback_settings')
        .upsert({
          ...newSettings,
          teacher_id: user.id,
          custom_questions: newSettings.custom_questions as any,
        });

      if (error) throw error;

      setSettings(newSettings);
      toast({
        title: "Configurações salvas!",
        description: "As configurações de feedback foram atualizadas com sucesso.",
      });

      return true;
    } catch (error) {
      console.error('Error saving feedback settings:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as configurações. Tente novamente.",
        variant: "destructive"
      });
      return false;
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [user?.id]);

  return {
    settings,
    loading,
    saveSettings,
    refetch: fetchSettings,
  };
};