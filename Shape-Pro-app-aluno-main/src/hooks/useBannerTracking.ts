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
    if (!user) {
      console.log('[useBannerTracking] ⚠️ No user - skipping tracking')
      return
    }

    const payload = {
      banner_id: interaction.bannerId,
      user_id: user.id,
      interaction_type: interaction.type,
      metadata: interaction.metadata || {}
    }

    console.log('[useBannerTracking] 📤 Sending interaction:', payload)

    try {
      const { data, error } = await supabase
        .from('banner_interactions')
        .insert(payload)
        .select()

      console.log('[useBannerTracking] 📥 Response:', { data, error })

      if (error) throw error
    } catch (error) {
      console.error('[useBannerTracking] ❌ Banner tracking failed:', error)
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