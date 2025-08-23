import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface RewardItem {
  id: string;
  title: string;
  description?: string;
  points_cost: number;
  image_url?: string;
  stock?: number;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export const useRewards = () => {
  const [rewards, setRewards] = useState<RewardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, userProfile } = useAuth();

  useEffect(() => {
    if (!user) return;

    const fetchRewards = async () => {
      try {
        let query = supabase
          .from('rewards_items')
          .select('*')
          .eq('is_active', true);

        // If user is teacher, show rewards they created
        // If user is student, show rewards from their teacher
        if (userProfile?.user_type === 'teacher') {
          query = query.eq('created_by', user.id);
        } else {
          // For students, get rewards from their teacher
          const { data: studentData } = await supabase
            .from('students')
            .select('teacher_id')
            .eq('user_id', user.id)
            .single();

          if (studentData?.teacher_id) {
            query = query.eq('created_by', studentData.teacher_id);
          } else {
            // If student has no teacher, show no rewards
            setRewards([]);
            setLoading(false);
            return;
          }
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching rewards:', error);
          return;
        }

        setRewards(data || []);
      } catch (error) {
        console.error('Error fetching rewards:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRewards();
  }, [user, userProfile]);

  return { rewards, loading };
};