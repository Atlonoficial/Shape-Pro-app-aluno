import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { enablePush, disablePush, checkNotificationPermission } from '@/lib/push';
import { toast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

export interface NotificationPreferences {
  push_enabled: boolean;
  workout_reminders?: boolean;
  achievements?: boolean;
  social?: boolean;
  tips?: boolean;
}

interface UseNotificationPreferencesReturn {
  preferences: NotificationPreferences | null;
  loading: boolean;
  togglePush: () => Promise<void>;
  updatePreferences: (newPrefs: Partial<NotificationPreferences>) => Promise<void>;
  permissionStatus: 'granted' | 'denied' | 'default' | null;
  refreshPermissions: () => Promise<void>;
}

export function useNotificationPreferences(userId: string | undefined): UseNotificationPreferencesReturn {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'default' | null>(null);

  // Carregar preferências do banco de dados
  const loadPreferences = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      logger.debug('NotificationPreferences', 'Loading preferences', { userId });
      
      const { data, error } = await supabase
        .from('profiles')
        .select('notification_preferences')
        .eq('id', userId)
        .single();

      if (error) throw error;

      const rawPrefs = data?.notification_preferences;
      const prefs: NotificationPreferences = rawPrefs 
        ? (rawPrefs as unknown as NotificationPreferences)
        : { push_enabled: true };
      setPreferences(prefs);
      
      logger.info('NotificationPreferences', 'Preferences loaded', prefs);
    } catch (error) {
      logger.error('NotificationPreferences', 'Error loading preferences', error);
      // Definir padrão em caso de erro
      setPreferences({ push_enabled: true });
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Verificar permissões do sistema operacional
  const refreshPermissions = useCallback(async () => {
    try {
      const status = await checkNotificationPermission();
      setPermissionStatus(status);
      logger.debug('NotificationPreferences', 'Permission status', { status });
    } catch (error) {
      logger.error('NotificationPreferences', 'Error checking permissions', error);
      setPermissionStatus('default');
    }
  }, []);

  // Carregar ao montar
  useEffect(() => {
    loadPreferences();
    refreshPermissions();
  }, [loadPreferences, refreshPermissions]);

  // Atualizar preferências no banco de dados
  const updatePreferences = useCallback(async (newPrefs: Partial<NotificationPreferences>) => {
    if (!userId || !preferences) return;

    const updatedPrefs = { ...preferences, ...newPrefs };

    try {
      logger.info('NotificationPreferences', 'Updating preferences', updatedPrefs);

      const { error } = await supabase
        .from('profiles')
        .update({ notification_preferences: updatedPrefs })
        .eq('id', userId);

      if (error) throw error;

      setPreferences(updatedPrefs);
      logger.info('NotificationPreferences', 'Preferences updated successfully');
    } catch (error) {
      logger.error('NotificationPreferences', 'Error updating preferences', error);
      throw error;
    }
  }, [userId, preferences]);

  // Toggle push notifications (ação principal)
  const togglePush = useCallback(async () => {
    if (!userId || !preferences) return;

    const newValue = !preferences.push_enabled;
    setLoading(true);

    try {
      // Verificar permissão do SO antes de ativar
      if (newValue) {
        const status = await checkNotificationPermission();
        
        if (status === 'denied') {
          toast({
            title: "Permissão Negada",
            description: "Você precisa habilitar notificações nas configurações do dispositivo.",
            variant: "destructive"
          });
          setLoading(false);
          return;
        }
      }

      // Atualizar OneSignal primeiro
      if (newValue) {
        logger.info('NotificationPreferences', 'Enabling push notifications');
        enablePush();
        toast({
          title: "🔔 Notificações ativadas!",
          description: "Você receberá lembretes de treinos e dicas personalizadas",
        });
      } else {
        logger.info('NotificationPreferences', 'Disabling push notifications');
        disablePush();
        toast({
          title: "Notificações desativadas",
          description: "Você não receberá mais notificações push",
        });
      }

      // Depois atualizar no banco de dados
      await updatePreferences({ push_enabled: newValue });

    } catch (error) {
      logger.error('NotificationPreferences', 'Error toggling push', error);
      
      toast({
        title: "Erro",
        description: "Não foi possível alterar as notificações. Tente novamente.",
        variant: "destructive"
      });
      
      // Reverter estado local em caso de erro
      await loadPreferences();
    } finally {
      setLoading(false);
    }
  }, [userId, preferences, updatePreferences, loadPreferences]);

  return {
    preferences,
    loading,
    togglePush,
    updatePreferences,
    permissionStatus,
    refreshPermissions
  };
}
