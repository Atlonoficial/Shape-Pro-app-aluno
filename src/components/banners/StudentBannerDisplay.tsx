import { useEffect, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { useBannerTracking } from '@/hooks/useBannerTracking'

interface Banner {
  id: string
  title: string
  message: string | null
  image_url: string | null
  action_text: string | null
  action_url: string | null
  priority: number | null
}

export function StudentBannerDisplay({ placement }: { placement: string }) {
  const { user } = useAuth()
  const { trackView, trackClick } = useBannerTracking()
  const [banners, setBanners] = useState<Banner[]>([])

  useEffect(() => {
    async function fetchBanners() {
      if (!user) return

      // Buscar dados do estudante para encontrar o teacher_id
      const { data: studentData } = await supabase
        .from('students')
        .select('teacher_id')
        .eq('user_id', user.id)
        .single()

      if (!studentData?.teacher_id) return

      // Buscar banners ativos do professor
      const { data: bannersData } = await supabase
        .from('banners')
        .select('id, title, message, image_url, action_text, action_url, priority')
        .eq('created_by', studentData.teacher_id)
        .eq('is_active', true)
        .lte('start_date', new Date().toISOString())
        .or('end_date.is.null,end_date.gte.' + new Date().toISOString())
        .order('priority', { ascending: false })

      setBanners(bannersData || [])
    }

    fetchBanners()
  }, [user])

  const handleBannerView = (banner: Banner) => {
    trackView(banner.id, { placement })
  }

  const handleBannerClick = (banner: Banner) => {
    trackClick(banner.id, { placement, actionUrl: banner.action_url })
    
    if (banner.action_url) {
      window.open(banner.action_url, '_blank')
    }
  }

  return (
    <div className="space-y-4">
      {banners.map((banner) => (
        <div 
          key={banner.id}
          className="banner-card cursor-pointer bg-card border border-border rounded-lg p-4 hover:shadow-md transition-shadow"
          onClick={() => handleBannerView(banner)}
        >
          {banner.image_url && (
            <img 
              src={banner.image_url} 
              alt={banner.title}
              className="w-full h-48 object-cover rounded-lg mb-4"
            />
          )}
          
          <h3 className="text-lg font-semibold text-foreground mb-2">{banner.title}</h3>
          {banner.message && <p className="text-muted-foreground mb-4">{banner.message}</p>}
          
          {banner.action_text && banner.action_url && (
            <button 
              onClick={(e) => {
                e.stopPropagation()
                handleBannerClick(banner)
              }}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
            >
              {banner.action_text}
            </button>
          )}
        </div>
      ))}
    </div>
  )
}