import { useMemo } from 'react';
import { useAuthContext } from '@/components/auth/AuthProvider';

export const useOptimizedAvatar = () => {
  const { userProfile } = useAuthContext();

  const avatarUrl = useMemo(() => {
    if (!userProfile?.avatar_url) return null;
    
    // Only add cache busting if URL contains timestamp parameter already
    const hasTimestamp = userProfile.avatar_url.includes('?t=');
    
    if (hasTimestamp) {
      return userProfile.avatar_url;
    }
    
    // Add cache busting only for storage URLs to ensure fresh images
    const isStorageUrl = userProfile.avatar_url.includes('supabase') || 
                        userProfile.avatar_url.includes('storage');
    
    return isStorageUrl 
      ? `${userProfile.avatar_url}?t=${Date.now()}`
      : userProfile.avatar_url;
  }, [userProfile?.avatar_url]);

  const memberSince = useMemo(() => {
    if (!userProfile?.created_at) return '';
    
    const created = new Date(userProfile.created_at);
    return created.toLocaleDateString('pt-BR', { 
      month: 'long', 
      year: 'numeric' 
    });
  }, [userProfile?.created_at]);

  const displayName = useMemo(() => {
    return userProfile?.name || 'Usuário';
  }, [userProfile?.name]);

  const avatarFallback = useMemo(() => {
    return userProfile?.name?.charAt(0)?.toUpperCase() || 'U';
  }, [userProfile?.name]);

  return {
    avatarUrl,
    memberSince,
    displayName,
    avatarFallback
  };
};