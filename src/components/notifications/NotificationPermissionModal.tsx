import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Bell } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { logger } from '@/lib/logger';
import { toast } from 'sonner';

export const NotificationPermissionModal = () => {
  const [open, setOpen] = useState(false);
  const [oneSignalReady, setOneSignalReady] = useState(false);

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

    // ✅ BUILD 53: Escutar evento onesignal-ready
    const handleOneSignalReady = (event: Event) => {
      logger.info('NotificationPermissionModal', 'OneSignal ready event received', (event as CustomEvent).detail);
      setOneSignalReady(true);

      // Mostrar modal após 1 segundo extra (garantir estabilidade)
      setTimeout(() => {
        logger.info('NotificationPermissionModal', 'Displaying permission modal');
        setOpen(true);
      }, 1000);
    };

    window.addEventListener('onesignal-ready', handleOneSignalReady);

    // ✅ Fallback: Verificar manualmente se OneSignal já está pronto
    const checkOneSignalReady = () => {
      if (window.plugins?.OneSignal) {
        logger.info('NotificationPermissionModal', 'OneSignal detected via polling');
        setOneSignalReady(true);

        setTimeout(() => {
          logger.info('NotificationPermissionModal', 'Displaying permission modal');
          setOpen(true);
        }, 1000);
      } else {
        logger.debug('NotificationPermissionModal', 'OneSignal not ready yet, checking again in 1s');
        setTimeout(checkOneSignalReady, 1000);
      }
    };

    // Iniciar verificação após 3 segundos (deixar app carregar)
    const timer = setTimeout(checkOneSignalReady, 3000);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('onesignal-ready', handleOneSignalReady);
    };
  }, []);

  const handleAccept = async () => {
    try {
      logger.info('NotificationPermissionModal', 'User accepted, requesting native permission');

      // ✅ BUILD 55: Usar função centralizada do push.ts
      const { requestPermission } = await import('@/lib/push');
      const accepted = await requestPermission();

      if (accepted) {
        logger.info('NotificationPermissionModal', 'User accepted native permission');
        localStorage.setItem('notification_permission_requested', 'true');
        setOpen(false);

        // Toast de confirmação
        toast.success('🔔 Notificações ativadas!', {
          description: 'Você receberá lembretes de treinos e avisos importantes.',
          duration: 4000
        });
      } else {
        logger.info('NotificationPermissionModal', 'User denied native permission');
        localStorage.setItem('notification_permission_requested', 'declined');
        setOpen(false);
      }
    } catch (error) {
      logger.error('NotificationPermissionModal', 'Error requesting permission', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';

      // Verificar se é problema do plugin
      if (!window.plugins?.OneSignal) {
        toast.error('Plugin de notificações não disponível', {
          description: 'Tente reinstalar o app ou atualizar para a versão mais recente.'
        });
      } else {
        toast.error('Erro ao solicitar permissões', {
          description: errorMessage || 'Por favor, tente novamente.'
        });
      }

      // Fechar modal mesmo com erro para não travar a UI
      localStorage.setItem('notification_permission_requested', 'error');
      setOpen(false);
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
