import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Bell } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { logger } from '@/lib/logger';

export const NotificationPermissionModal = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // ✅ Apenas mostrar em mobile nativo
    if (!Capacitor.isNativePlatform()) {
      logger.debug('NotificationPermissionModal', 'Web platform detected, skipping modal');
      return;
    }
    
    // ✅ Verificar se já pediu permissão
    const hasRequested = localStorage.getItem('notification_permission_requested');
    if (hasRequested) {
      logger.debug('NotificationPermissionModal', 'Permission already requested, skipping');
      return;
    }
    
    // ✅ Mostrar após 3 segundos (deixar app carregar completamente)
    logger.debug('NotificationPermissionModal', 'Scheduling modal display in 3s');
    const timer = setTimeout(() => {
      logger.info('NotificationPermissionModal', 'Displaying permission modal');
      setOpen(true);
    }, 3000);
    
    return () => clearTimeout(timer);
  }, []);

  const handleAccept = async () => {
    try {
      logger.info('NotificationPermissionModal', 'User accepted, requesting native permission');
      
      if (window.plugins?.OneSignal) {
        // ✅ Pedir permissão nativa do iOS/Android
        await window.plugins.OneSignal.promptForPushNotificationsWithUserResponse();
        logger.info('NotificationPermissionModal', 'Native permission prompt displayed');
        localStorage.setItem('notification_permission_requested', 'true');
        setOpen(false);
      } else {
        logger.warn('NotificationPermissionModal', 'OneSignal plugin not available');
      }
    } catch (error) {
      logger.error('NotificationPermissionModal', 'Error requesting permission', error);
    }
  };

  const handleDecline = () => {
    logger.info('NotificationPermissionModal', 'User declined notification permission');
    localStorage.setItem('notification_permission_requested', 'declined');
    setOpen(false);
  };

  // ✅ Não renderizar nada se não estiver aberto (evitar overhead)
  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Bell className="h-6 w-6 text-primary" />
            Ativar Notificações
          </DialogTitle>
          <DialogDescription className="text-base pt-2">
            Receba lembretes de treinos, atualizações do seu professor e celebre suas conquistas! 🎯
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-3 mt-4">
          <Button variant="outline" onClick={handleDecline} className="flex-1">
            Agora Não
          </Button>
          <Button onClick={handleAccept} className="flex-1">
            Ativar Notificações
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
