import { useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'

export interface BannerInteraction {
  bannerId: string
  type: 'view' | 'click'  // IMPORTANTE: usar exatamente estes valores
  metadata?: Record<string, any>
}

export function useBannerTracking() {
  const { user } = useAuth()

  const trackInteraction = useCallback(async (interaction: BannerInteraction) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('banner_interactions')
        .insert({
          banner_id: interaction.bannerId,
          user_id: user.id,
          interaction_type: interaction.type,
          metadata: interaction.metadata || {}
        })

      if (error) throw error
    } catch (error) {
      console.error('Banner tracking failed:', error)
    }
  }, [user])

  const trackView = useCallback((bannerId: string, metadata?: Record<string, any>) => {
    trackInteraction({
      bannerId,
      type: 'view',
      metadata: {
        ...metadata,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        }
      }
    })
  }, [trackInteraction])

  const trackClick = useCallback((bannerId: string, metadata?: Record<string, any>) => {
    trackInteraction({
      bannerId,
      type: 'click',
      metadata
    })
  }, [trackInteraction])

  return { trackView, trackClick }
}