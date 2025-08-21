import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface BannerInteractionData {
  banner_id: string;
  interaction_type: 'view' | 'click' | 'expand' | 'collapse' | 'navigate' | 'conversion';
  metadata?: {
    viewport?: { width: number; height: number };
    scroll_position?: number;
    session_duration?: number;
    slide_index?: number;
    url?: string;
    [key: string]: any;
  };
}

export const useBannerAnalytics = () => {
  const [isTracking, setIsTracking] = useState(false);
  const { user } = useAuth();

  const trackInteraction = useCallback(async (data: BannerInteractionData) => {
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
        user_agent: navigator.userAgent.substring(0, 200), // Limitar tamanho
        url: window.location.href
      };

      const { error } = await supabase
        .from('banner_interactions')
        .insert({
          banner_id: data.banner_id,
          user_id: user.id,
          interaction_type: data.interaction_type,
          session_id: `${user.id}-${Date.now()}`, // Session ID simples
          ip_address: null, // Será capturado pelo servidor se necessário
          user_agent: navigator.userAgent.substring(0, 200),
          metadata
        });

      if (error) {
        console.error('Error tracking banner interaction:', error);
      }
    } catch (error) {
      console.error('Error tracking banner interaction:', error);
    } finally {
      setIsTracking(false);
    }
  }, [user?.id, isTracking]);

  // Tracking específico para impressões
  const trackImpression = useCallback((bannerId: string, viewDuration?: number) => {
    trackInteraction({
      banner_id: bannerId,
      interaction_type: 'view',
      metadata: {
        view_duration: viewDuration
      }
    });
  }, [trackInteraction]);

  // Tracking específico para cliques
  const trackClick = useCallback((bannerId: string, actionUrl?: string) => {
    trackInteraction({
      banner_id: bannerId,
      interaction_type: 'click',
      metadata: {
        action_url: actionUrl
      }
    });
  }, [trackInteraction]);

  // Tracking específico para expansão
  const trackExpansion = useCallback((bannerId: string, expanded: boolean) => {
    trackInteraction({
      banner_id: bannerId,
      interaction_type: expanded ? 'expand' : 'collapse'
    });
  }, [trackInteraction]);

  // Tracking específico para navegação entre slides
  const trackNavigation = useCallback((bannerId: string, slideIndex: number, direction: 'next' | 'prev' | 'direct') => {
    trackInteraction({
      banner_id: bannerId,
      interaction_type: 'navigate',
      metadata: {
        slide_index: slideIndex,
        direction
      }
    });
  }, [trackInteraction]);

  // Tracking específico para conversões (clicks externos)
  const trackConversion = useCallback((bannerId: string, conversionUrl: string) => {
    trackInteraction({
      banner_id: bannerId,
      interaction_type: 'conversion',
      metadata: {
        conversion_url: conversionUrl
      }
    });
  }, [trackInteraction]);

  return {
    trackImpression,
    trackClick,
    trackExpansion,
    trackNavigation,
    trackConversion,
    trackInteraction,
    isTracking
  };
};