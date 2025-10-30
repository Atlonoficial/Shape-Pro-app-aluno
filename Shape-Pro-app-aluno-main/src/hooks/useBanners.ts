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
      console.log('[useBanners] 🔍 Starting fetch with userId:', userId);
      
      try {
        // ✅ BUILD 38: Buscar dados do estudante para encontrar o teacher_id
        const { data: studentData } = await supabase
          .from('students')
          .select('teacher_id')
          .eq('user_id', userId)
          .single()

        console.log('[useBanners] 👨‍🏫 Student data:', studentData);

        // Try teacher banners first if teacher_id exists
        if (studentData?.teacher_id) {
          const { data, error } = await supabase
            .from('banners')
            .select('*')
            .eq('created_by', studentData.teacher_id)
            .eq('is_active', true)
            .lte('start_date', new Date().toISOString())
            .or(`end_date.is.null,end_date.gte.${new Date().toISOString()}`)
            .order('priority', { ascending: false })
            .order('created_at', { ascending: false });

          console.log('[useBanners] 📢 Teacher banners:', { count: data?.length, error });

          if (!error && data && data.length > 0) {
            setBanners(data);
            setLoading(false);
            return;
          }
        }

        // ✅ BUILD 38: Fallback to global banners if no teacher or no teacher banners
        console.log('[useBanners] 🌍 No teacher banners, trying global banners...');
        
        const { data: globalBanners, error: globalError } = await supabase
          .from('banners')
          .select('*')
          .is('created_by', null)
          .eq('is_active', true)
          .lte('start_date', new Date().toISOString())
          .or(`end_date.is.null,end_date.gte.${new Date().toISOString()}`)
          .order('priority', { ascending: false })
          .order('created_at', { ascending: false });

        console.log('[useBanners] 🌍 Global banners:', { count: globalBanners?.length, error: globalError });

        if (globalError) {
          console.error('[useBanners] ❌ Error fetching global banners:', globalError);
          setBanners([]);
        } else {
          setBanners(globalBanners || []);
        }
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