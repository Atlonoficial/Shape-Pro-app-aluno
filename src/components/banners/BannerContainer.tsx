import { useEffect } from 'react'
import { StudentBannerDisplay } from './StudentBannerDisplay'
import { useStableUserType } from '@/hooks/useStableUserType'
import { logger } from '@/lib/logger'

interface BannerContainerProps {
  placement: 'header' | 'between-sections' | 'footer'
  maxBanners?: number
  className?: string
}

export function BannerContainer({ 
  placement, 
  className, 
  maxBanners = 3
}: BannerContainerProps) {
  const { isStudent, loading, userType, teacherId, refresh } = useStableUserType()

  // Refresh user type on mount
  useEffect(() => {
    logger.debug('BannerContainer', 'Component mounted, triggering refresh')
    refresh()
  }, [refresh])

  logger.debug('BannerContainer', 'Detailed check', {
    placement,
    isStudent,
    loading,
    userType,
    teacherId
  })

  if (loading) {
    return null
  }

  // Bloqueia APENAS se NÃO for estudante
  if (!isStudent && userType !== 'student') {
    logger.debug('BannerContainer', 'Blocking - not a student', { isStudent, userType })
    return null
  }

  logger.debug('BannerContainer', 'Rendering banners', { 
    userType, 
    isStudent, 
    placement,
    maxBanners
  })

  return (
    <div className={className}>
      <StudentBannerDisplay
        placement={placement}
        maxBanners={maxBanners}
        className={className}
      />
    </div>
  )
}
