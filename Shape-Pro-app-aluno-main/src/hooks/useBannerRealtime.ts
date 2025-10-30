import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useRealtimeManager } from './useRealtimeManager';

interface BannerRealtimeMetrics {
  totalInteractions: number;
  todayInteractions: number;
  recentInteractions: any[];
  isConnected: boolean;
}

export const useBannerRealtime = () => {
  const [metrics, setMetrics] = useState<BannerRealtimeMetrics>({
    totalInteractions: 0,
    todayInteractions: 0,
    recentInteractions: [],
    isConnected: false
  });

  const [loading, setLoading] = useState(true);

  const fetchInitialData = async () => {
    try {
      console.log('[BannerRealtime] Fetching initial data...');
      
      const today = new Date().toISOString().split('T')[0];
      
      // Total interactions
      const { count: totalCount } = await supabase
        .from('banner_interactions')
        .select('*', { count: 'exact', head: true });

      // Today's interactions  
      const { count: todayCount } = await supabase
        .from('banner_interactions')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', `${today}T00:00:00.000Z`)
        .lt('created_at', `${today}T23:59:59.999Z`);

      // Recent interactions
      const { data: recentData } = await supabase
        .from('banner_interactions')
        .select(`
          *,
          banners!banner_interactions_banner_id_fkey (
            title
          )
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      setMetrics({
        totalInteractions: totalCount || 0,
        todayInteractions: todayCount || 0,
        recentInteractions: recentData || [],
        isConnected: true
      });

      console.log('[BannerRealtime] Initial data loaded:', {
        total: totalCount,
        today: todayCount,
        recent: recentData?.length
      });
    } catch (error) {
      console.error('[BannerRealtime] Error fetching initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Use centralized realtime manager
  const { isConnected } = useRealtimeManager({
    subscriptions: [
      {
        table: 'banner_interactions',
        event: 'INSERT',
        callback: (payload) => {
          console.log('[BannerRealtime] New interaction received:', payload);
          setMetrics(prev => ({
            ...prev,
            totalInteractions: prev.totalInteractions + 1,
            todayInteractions: prev.todayInteractions + 1,
            recentInteractions: [payload.new, ...prev.recentInteractions.slice(0, 9)]
          }));
        }
      },
      {
        table: 'banner_analytics',
        event: '*',
        callback: () => {
          console.log('[BannerRealtime] Analytics update received');
        }
      }
    ],
    enabled: true,
    channelName: 'banner-realtime',
    debounceMs: 500
  });

  useEffect(() => {
    setMetrics(prev => ({ ...prev, isConnected }));
  }, [isConnected]);

  return {
    ...metrics,
    loading,
    refresh: fetchInitialData
  };
};