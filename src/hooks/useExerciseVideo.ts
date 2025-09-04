import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Exercise {
  id: string;
  name: string;
  video_url?: string;
  image_url?: string;
  instructions?: string;
  description?: string;
}

export const useExerciseVideo = (exerciseName: string) => {
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!exerciseName) {
      setExercise(null);
      return;
    }

    const fetchExercise = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Buscar exercício pelo nome exato primeiro
        let { data, error } = await supabase
          .from('exercises')
          .select('id, name, video_url, image_url, instructions, description')
          .eq('name', exerciseName)
          .limit(1);

        if (error) throw error;

        // Se não encontrou pelo nome exato, buscar por similaridade
        if (!data || data.length === 0) {
          const { data: similarData, error: similarError } = await supabase
            .from('exercises')
            .select('id, name, video_url, image_url, instructions, description')
            .ilike('name', `%${exerciseName}%`)
            .limit(1);

          if (similarError) throw similarError;
          data = similarData;
        }

        setExercise(data && data.length > 0 ? data[0] : null);
      } catch (err) {
        console.error('Erro ao buscar exercício:', err);
        setError('Erro ao carregar vídeo do exercício');
      } finally {
        setLoading(false);
      }
    };

    fetchExercise();
  }, [exerciseName]);

  return {
    exercise,
    loading,
    error,
    videoUrl: exercise?.video_url,
    imageUrl: exercise?.image_url,
    instructions: exercise?.instructions,
    description: exercise?.description
  };
};