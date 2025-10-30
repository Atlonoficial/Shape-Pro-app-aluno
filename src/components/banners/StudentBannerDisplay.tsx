import { useEffect, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { useBannerTracking } from '@/hooks/useBannerTracking'
import { openExternalLink } from '@/utils/openExternalLink'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { logger } from '@/lib/logger'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel"
import Autoplay from "embla-carousel-autoplay"

interface Banner {
  id: string
  title: string
  message: string | null
  image_url: string | null
  action_text: string | null
  action_url: string | null
  priority: number | null
  type?: string | null
}

interface StudentBannerDisplayProps {
  placement: string
  maxBanners?: number
  className?: string
}

export function StudentBannerDisplay({ 
  placement, 
  maxBanners = 3, 
  className = ''
}: StudentBannerDisplayProps) {
  const { user } = useAuth()
  const { trackView, trackClick } = useBannerTracking()
  const [banners, setBanners] = useState<Banner[]>([])
  const [expandedBannerId, setExpandedBannerId] = useState<string | null>(null)
  const [api, setApi] = useState<CarouselApi>()
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    async function fetchBanners() {
      logger.debug('StudentBannerDisplay', 'Fetching banners', { 
        userId: user?.id, 
        placement, 
        maxBanners 
      })

      if (!user) {
        logger.debug('StudentBannerDisplay', 'No user - aborting')
        return
      }

      const now = new Date().toISOString()

      // ✅ BUILD 38: Buscar dados do estudante para encontrar o teacher_id
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('teacher_id')
        .eq('user_id', user.id)
        .single()

      logger.debug('StudentBannerDisplay', 'Student data fetched', { studentData, studentError })

      let teacherBanners: Banner[] = []

      // Try teacher banners first if teacher_id exists
      if (studentData?.teacher_id && !studentError) {
        logger.debug('StudentBannerDisplay', 'Fetching teacher banners', { teacherId: studentData.teacher_id })
        
        let teacherQuery = supabase
          .from('banners')
          .select('id, title, message, image_url, action_text, action_url, priority, type')
          .eq('created_by', studentData.teacher_id)
          .eq('is_active', true)
          .lte('start_date', now)
          .or(`end_date.is.null,end_date.gte.${now}`)
          .order('priority', { ascending: false })
          .order('created_at', { ascending: false })

        if (maxBanners) {
          teacherQuery = teacherQuery.limit(maxBanners)
        }

        const { data: teacherData, error: teacherError } = await teacherQuery

        logger.debug('StudentBannerDisplay', 'Teacher banners fetched', { 
          count: teacherData?.length, 
          teacherError 
        })

        if (!teacherError && teacherData && teacherData.length > 0) {
          setBanners(teacherData)
          return
        }

        teacherBanners = teacherData || []
      }

      // ✅ BUILD 38: Fallback to global banners
      logger.debug('StudentBannerDisplay', 'Trying global banners')
      
      let globalQuery = supabase
        .from('banners')
        .select('id, title, message, image_url, action_text, action_url, priority, type')
        .is('created_by', null)
        .eq('is_active', true)
        .lte('start_date', now)
        .or(`end_date.is.null,end_date.gte.${now}`)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false })

      if (maxBanners) {
        globalQuery = globalQuery.limit(maxBanners)
      }

      const { data: globalData, error: globalError } = await globalQuery

      logger.debug('StudentBannerDisplay', 'Global banners fetched', { 
        count: globalData?.length, 
        globalError 
      })

      if (globalError) {
        logger.error('StudentBannerDisplay', 'Error fetching global banners', globalError)
        setBanners(teacherBanners)
      } else {
        // Combine teacher and global banners
        const allBanners = [...teacherBanners, ...(globalData || [])]
        setBanners(maxBanners ? allBanners.slice(0, maxBanners) : allBanners)
      }
    }

    fetchBanners()
  }, [user, placement, maxBanners])

  useEffect(() => {
    if (!api) return
    
    api.on("select", () => {
      setCurrent(api.selectedScrollSnap())
      // Colapsar banner anterior ao mudar de slide
      setExpandedBannerId(null)
    })
  }, [api])

  const handleBannerToggle = (bannerId: string) => {
    logger.debug('StudentBannerDisplay', 'Toggling banner', { bannerId })
    
    if (expandedBannerId === bannerId) {
      // Se já está expandido, colapsar
      setExpandedBannerId(null)
    } else {
      // Expandir este banner e trackear view
      setExpandedBannerId(bannerId)
      trackView(bannerId, { placement })
      logger.debug('StudentBannerDisplay', 'Tracking VIEW', { 
        bannerId, 
        placement 
      })
    }
  }

  const handleBannerClick = (banner: Banner, e: React.MouseEvent) => {
    e.stopPropagation() // Prevenir toggle do card
    logger.debug('StudentBannerDisplay', 'Tracking CLICK', { 
      bannerId: banner.id, 
      placement, 
      actionUrl: banner.action_url 
    })
    trackClick(banner.id, { placement, actionUrl: banner.action_url })
    
    if (banner.action_url) {
      openExternalLink(banner.action_url)
    }
  }

  if (banners.length === 0) {
    logger.debug('StudentBannerDisplay', 'No banners to display')
    return null
  }

  // Banner único - sem carrossel
  if (banners.length === 1) {
    const banner = banners[0]
    const isExpanded = expandedBannerId === banner.id

    return (
      <div className={className}>
        <div className="banner-card bg-card border border-border rounded-lg overflow-hidden hover:shadow-md transition-all duration-300">
          {/* Imagem sem overlay */}
          <div className="relative">
            {banner.image_url && (
              <img 
                src={banner.image_url} 
                alt={banner.title}
                className="w-full h-auto"
              />
            )}
          </div>
          
          {/* Conteúdo sempre visível abaixo da imagem */}
          <div 
            onClick={() => handleBannerToggle(banner.id)}
            className="p-4 bg-card cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">{banner.title}</h3>
              <ChevronDown 
                className={cn(
                  "w-5 h-5 transition-transform duration-300 text-muted-foreground",
                  isExpanded && "rotate-180"
                )}
              />
            </div>
            <p className="text-sm text-muted-foreground mt-1">Clique para ver detalhes</p>
          </div>
          
          {/* Conteúdo expandido */}
          {isExpanded && (
            <div className="px-4 pb-4 space-y-4 bg-card animate-in fade-in-0 slide-in-from-top-2 duration-300">
              {banner.message && (
                <p className="text-muted-foreground">{banner.message}</p>
              )}
              
              {banner.action_text && banner.action_url && (
                <button 
                  onClick={(e) => handleBannerClick(banner, e)}
                  className="w-full bg-primary text-primary-foreground px-4 py-3 rounded-lg hover:bg-primary/90 transition-colors font-medium"
                >
                  {banner.action_text}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  // Múltiplos banners - com carrossel
  return (
    <Carousel
      setApi={setApi}
      opts={{
        align: "start",
        loop: true,
      }}
      plugins={[
        Autoplay({
          delay: 5000,
          stopOnInteraction: true,
          stopOnMouseEnter: true,
        }),
      ]}
      className={className}
    >
      <CarouselContent>
        {banners.map((banner) => {
          const isExpanded = expandedBannerId === banner.id

          return (
            <CarouselItem key={banner.id}>
              <div className="banner-card bg-card border border-border rounded-lg overflow-hidden hover:shadow-md transition-all duration-300">
                {/* Imagem sem overlay */}
                <div className="relative">
                  {banner.image_url && (
                    <img 
                      src={banner.image_url} 
                      alt={banner.title}
                      className="w-full h-auto"
                    />
                  )}
                </div>
                
                {/* Conteúdo sempre visível abaixo da imagem */}
                <div 
                  onClick={() => handleBannerToggle(banner.id)}
                  className="p-4 bg-card cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-foreground">{banner.title}</h3>
                    <ChevronDown 
                      className={cn(
                        "w-5 h-5 transition-transform duration-300 text-muted-foreground",
                        isExpanded && "rotate-180"
                      )}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">Clique para ver detalhes</p>
                </div>
                
                {/* Conteúdo expandido */}
                {isExpanded && (
                  <div className="px-4 pb-4 space-y-4 bg-card animate-in fade-in-0 slide-in-from-top-2 duration-300">
                    {banner.message && (
                      <p className="text-muted-foreground">{banner.message}</p>
                    )}
                    
                    {banner.action_text && banner.action_url && (
                      <button 
                        onClick={(e) => handleBannerClick(banner, e)}
                        className="w-full bg-primary text-primary-foreground px-4 py-3 rounded-lg hover:bg-primary/90 transition-colors font-medium"
                      >
                        {banner.action_text}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </CarouselItem>
          )
        })}
      </CarouselContent>
      
      <CarouselPrevious className="left-2" />
      <CarouselNext className="right-2" />
      
      {/* Dots indicadores */}
      <div className="flex justify-center gap-2 mt-4">
        {banners.map((_, index) => (
          <button
            key={index}
            onClick={() => api?.scrollTo(index)}
            className={cn(
              "h-2 rounded-full transition-all",
              index === current 
                ? "bg-primary w-4" 
                : "bg-muted-foreground/30 w-2"
            )}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </Carousel>
  )
}
