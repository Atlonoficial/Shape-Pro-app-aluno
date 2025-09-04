import { useEffect, useState } from 'react';
import { useAuthContext } from '@/components/auth/AuthProvider';
import { getPlayerIdStatus } from '@/lib/oneSignalWeb';

export const usePlayerIdSync = () => {
  const { user } = useAuthContext();
  const [syncStatus, setSyncStatus] = useState({
    hasPlayerId: false,
    playerId: null as string | null,
    loading: true,
    lastChecked: null as Date | null
  });

  const checkPlayerIdStatus = async () => {
    if (!user?.id) {
      setSyncStatus(prev => ({ ...prev, loading: false }));
      return;
    }

    setSyncStatus(prev => ({ ...prev, loading: true }));
    
    try {
      const result = await getPlayerIdStatus(user.id);
      setSyncStatus({
        hasPlayerId: result.hasPlayerId,
        playerId: result.playerId || null,
        loading: false,
        lastChecked: new Date()
      });
    } catch (error) {
      console.error('Error checking Player ID sync status:', error);
      setSyncStatus(prev => ({ 
        ...prev, 
        loading: false,
        lastChecked: new Date()
      }));
    }
  };

  useEffect(() => {
    checkPlayerIdStatus();
  }, [user?.id]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(checkPlayerIdStatus, 30000);
    return () => clearInterval(interval);
  }, [user?.id]);

  return {
    ...syncStatus,
    refresh: checkPlayerIdStatus
  };
};