import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

interface BannerTrackingData {
  banner_id: string;
  interaction_type: 'detail_view' | 'redirect_click';
  metadata?: {
    viewport?: { width: number; height: number };
    scroll_position?: number;
    url?: string;
    action_url?: string;
    [key: string]: any;
  };
}

export const useBannerTracking = () => {
  const [isTracking, setIsTracking] = useState(false);
  const { user } = useAuth();

  const trackInteraction = useCallback(async (data: BannerTrackingData) => {
    if (!user?.id || isTracking) return;
    
    try {
      setIsTracking(true);
      
      // Capturar dados contextuais
      const metadata = {
        ...data.metadata,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        },
        scroll_position: window.scrollY,
        timestamp: new Date().toISOString(),
        user_agent: navigator.userAgent.substring(0, 200),
        url: window.location.href
      };

      const insertData = {
        banner_id: data.banner_id,
        user_id: user.id,
        interaction_type: data.interaction_type,
        session_id: `${user.id}-${Date.now()}`,
        ip_address: null,
        user_agent: navigator.userAgent.substring(0, 200),
        metadata
      };

      const { error } = await supabase
        .from('banner_interactions')
        .insert(insertData);

      if (error) {
        console.error('[useBannerTracking] Database error:', error);
      } else {
        console.log(`[useBannerTracking] Successfully tracked ${data.interaction_type} for banner: ${data.banner_id}`);
      }
    } catch (error) {
      console.error('[useBannerTracking] Unexpected error:', error);
    } finally {
      setIsTracking(false);
    }
  }, [user?.id, isTracking]);

  // MÉTRICA 1: Detail View - Clique no card do banner
  const trackDetailView = useCallback((bannerId: string) => {
    console.log('[useBannerTracking] Tracking detail view for banner:', bannerId);
    trackInteraction({
      banner_id: bannerId,
      interaction_type: 'detail_view'
    });
  }, [trackInteraction]);

  // MÉTRICA 2: Redirect Click - Clique no botão de ação
  const trackRedirectClick = useCallback((bannerId: string, actionUrl: string) => {
    console.log('[useBannerTracking] Tracking redirect click for banner:', bannerId);
    trackInteraction({
      banner_id: bannerId,
      interaction_type: 'redirect_click',
      metadata: {
        action_url: actionUrl
      }
    });

    // Toast de confirmação
    toast({
      title: "Redirecionamento registrado",
      description: "Você será redirecionado em instantes.",
      duration: 2000
    });
  }, [trackInteraction]);

  return {
    trackDetailView,
    trackRedirectClick,
    isTracking
  };
};