import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Banner {
  id: string;
  title: string;
  message?: string;
  description?: string;
  image_url?: string;
  action_url?: string;
  action_text?: string;
  type?: string;
  priority: number;
  is_active: boolean;
  start_date?: string;
  end_date?: string;
  created_at: string;
}

export const useBanners = (userId?: string) => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchBanners = async () => {
      try {
        const { data, error } = await supabase
          .from('banners')
          .select('*')
          .eq('is_active', true)
          .or(`target_users.cs.{${userId}},target_users.eq.{}`)
          .lte('start_date', new Date().toISOString())
          .or(`end_date.is.null,end_date.gte.${new Date().toISOString()}`)
          .order('priority', { ascending: false })
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching banners:', error);
          return;
        }

        setBanners(data || []);
      } catch (error) {
        console.error('Error fetching banners:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBanners();
  }, [userId]);

  return { banners, loading };
};