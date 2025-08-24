import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface Lesson {
  id: string;
  title: string;
  description?: string;
  video_url?: string;
  video_duration_minutes?: number;
  order_index: number;
  content?: string;
  is_published: boolean;
  is_free: boolean;
}

export const useModuleLessons = (moduleId: string | null) => {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!moduleId) {
      setLessons([]);
      return;
    }

    const fetchLessons = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const { data, error } = await supabase
          .from('course_lessons' as any)
          .select(`
            id,
            title,
            description,
            video_url,
            video_duration_minutes,
            order_index,
            content,
            is_published,
            is_free
          `)
          .eq('module_id', moduleId)
          .eq('is_published', true)
          .order('order_index', { ascending: true });

        if (error) throw error;

        setLessons((data as unknown as Lesson[]) || []);
      } catch (err) {
        console.error('Erro ao carregar aulas:', err);
        setError('Erro ao carregar aulas');
        toast({
          title: "Erro",
          description: "Não foi possível carregar as aulas do módulo",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchLessons();
  }, [moduleId, toast]);

  return {
    lessons,
    loading,
    error
  };
};