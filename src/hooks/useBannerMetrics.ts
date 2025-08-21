import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface BannerMetrics {
  banner_id: string;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
  conversion_rate: number;
  average_view_duration: number;
  expansions: number;
  navigations: number;
  unique_sessions: number;
  date: string;
}

interface UseBannerMetricsProps {
  bannerId?: string;
  startDate?: string;
  endDate?: string;
  teacherId?: string;
}

export const useBannerMetrics = ({ 
  bannerId, 
  startDate, 
  endDate, 
  teacherId 
}: UseBannerMetricsProps = {}) => {
  const [metrics, setMetrics] = useState<BannerMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchMetrics = useCallback(async () => {
    try {
      console.log('[BannerMetrics] Fetching metrics with filters:', { bannerId, startDate, endDate, teacherId });
      setLoading(true);
      setError(null);

      let query = supabase
        .from('banner_analytics')
        .select(`
          *,
          banners!banner_analytics_banner_id_fkey (
            id,
            title,
            created_by
          )
        `)
        .order('date', { ascending: false });

      // Apply filters
      if (bannerId) {
        query = query.eq('banner_id', bannerId);
      }

      if (startDate) {
        query = query.gte('date', startDate);
      }

      if (endDate) {
        query = query.lte('date', endDate);
      }

      // If teacherId is provided, filter by banners created by this teacher
      if (teacherId) {
        const { data: teacherBanners } = await supabase
          .from('banners')
          .select('id')
          .eq('created_by', teacherId);

        if (teacherBanners && teacherBanners.length > 0) {
          const bannerIds = teacherBanners.map(b => b.id);
          query = query.in('banner_id', bannerIds);
        } else {
          // Se não há banners do professor, retornar array vazio
          setMetrics([]);
          setLastUpdate(new Date());
          return;
        }
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw fetchError;
      }

      console.log('[BannerMetrics] Raw data received:', data);

      // Transform data to include metadata fields in the main object
      const transformedMetrics = data?.map((item: any) => ({
        banner_id: item.banner_id,
        user_id: item.user_id,
        date: item.date,
        impressions: item.impressions || 0,
        clicks: item.clicks || 0,
        conversions: item.conversions || 0,
        ctr: item.metadata?.ctr || 0,
        conversion_rate: item.metadata?.conversion_rate || 0,
        average_view_duration: item.metadata?.average_view_duration || 0,
        expansions: item.metadata?.expansions || 0,
        navigations: item.metadata?.navigations || 0,
        unique_sessions: item.metadata?.unique_sessions || 0,
        banner_title: item.banners?.title || 'Unknown Banner'
      })) || [];

      console.log('[BannerMetrics] Transformed metrics:', transformedMetrics);
      setMetrics(transformedMetrics);
      setLastUpdate(new Date());
    } catch (err) {
      console.error('[BannerMetrics] Error fetching banner metrics:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [bannerId, startDate, endDate, teacherId]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  // Configurar realtime updates
  useEffect(() => {
    console.log('[BannerMetrics] Setting up realtime subscription');
    
    const channel = supabase
      .channel('banner-analytics-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'banner_analytics'
        },
        (payload) => {
          console.log('[BannerMetrics] Realtime update received:', payload);
          fetchMetrics(); // Refetch data when changes occur
        }
      )
      .subscribe();

    return () => {
      console.log('[BannerMetrics] Cleaning up realtime subscription');
      supabase.removeChannel(channel);
    };
  }, [fetchMetrics]);

  // Calculate aggregated totals
  const totals = metrics.reduce((acc, metric) => ({
    impressions: acc.impressions + metric.impressions,
    clicks: acc.clicks + metric.clicks,
    conversions: acc.conversions + metric.conversions,
    expansions: acc.expansions + metric.expansions,
    navigations: acc.navigations + metric.navigations,
    unique_sessions: acc.unique_sessions + metric.unique_sessions
  }), {
    impressions: 0,
    clicks: 0,
    conversions: 0,
    expansions: 0,
    navigations: 0,
    unique_sessions: 0
  });

  const overallCTR = totals.impressions > 0 ? 
    Number((totals.clicks / totals.impressions * 100).toFixed(2)) : 0;

  const overallConversionRate = totals.clicks > 0 ? 
    Number((totals.conversions / totals.clicks * 100).toFixed(2)) : 0;

  return {
    metrics,
    loading,
    error,
    totals: {
      ...totals,
      ctr: overallCTR,
      conversion_rate: overallConversionRate
    },
    refresh: () => {
      setLoading(true);
      // Trigger useEffect re-run
    }
  };
};