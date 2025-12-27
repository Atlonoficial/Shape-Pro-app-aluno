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

        // ✅ BUILD 39: Buscar banners ativos - a tabela usa target_users[], não created_by
        console.log('[useBanners] 🔍 Fetching active banners...');

        const { data: activeBanners, error: bannersError } = await supabase
          .from('banners')
          .select('*')
          .eq('is_active', true)
          .lte('start_date', new Date().toISOString())
          .or(`end_date.is.null,end_date.gte.${new Date().toISOString()}`)
          .order('priority', { ascending: false })
          .order('created_at', { ascending: false });

        console.log('[useBanners] 📢 Active banners:', { count: activeBanners?.length, error: bannersError });

        if (bannersError) {
          console.error('[useBanners] ❌ Error fetching banners:', bannersError);
          setBanners([]);
        } else {
          // Filtrar banners: mostra se target_users está vazio (global) ou contém o usuário
          const relevantBanners = (activeBanners || []).filter((banner: any) => {
            const targets = banner.target_users || [];
            return targets.length === 0 || targets.includes(userId);
          });
          setBanners(relevantBanners);
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