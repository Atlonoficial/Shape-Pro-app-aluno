import { useEffect, useState } from 'react';
import { useAuthContext } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Bell } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export function NotificationPermissionPrompt() {
  const { user, userProfile } = useAuthContext();
  const [showPrompt, setShowPrompt] = useState(false);
  const [checking, setChecking] = useState(true);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [waitingForPlayerId, setWaitingForPlayerId] = useState(false);

  useEffect(() => {
    async function checkPermissions() {
      if (!user?.id || userProfile?.user_type !== 'student') {
        setChecking(false);
        return;
      }

      // ✅ BUILD 32: Verificar se já tem Player ID no banco (sempre, ignorar localStorage)
      const { data: profile } = await supabase
        .from('profiles')
        .select('onesignal_player_id')
        .eq('id', user.id)
        .single();

      if (profile?.onesignal_player_id) {
        // Já tem Player ID, marcar localStorage e não perguntar mais
        localStorage.setItem('onesignal_permission_asked', 'true');
        setChecking(false);
        return;
      }

      // ✅ BUILD 32: Se não tem Player ID, verificar se já perguntamos antes
      const askedBefore = localStorage.getItem('onesignal_permission_asked');
      if (askedBefore) {
        // Já perguntamos mas usuário recusou - não perguntar novamente
        setChecking(false);
        return;
      }

      // Verificar permissões do browser
      if ('Notification' in window) {
        const permission = Notification.permission;
        
        if (permission === 'default') {
          // Ainda não perguntou, mostrar prompt
          console.log('[NotificationPrompt] 🔔 BUILD 32: Showing permission prompt (no Player ID in DB)');
          setShowPrompt(true);
        } else if (permission === 'granted') {
          // Permissão concedida mas sem Player ID - aguardar OneSignal processar
          console.log('[NotificationPrompt] ⏳ BUILD 32: Permission granted, waiting for Player ID...');
        } else if (permission === 'denied') {
          // Usuário bloqueou notificações no browser
          console.warn('[NotificationPrompt] ⚠️ BUILD 32: Notifications blocked by user');
          localStorage.setItem('onesignal_permission_asked', 'true');
        }
      }

      setChecking(false);
    }

    checkPermissions();
  }, [user, userProfile]);

  const handleAccept = async () => {
    console.log('[NotificationPrompt] 🎯 User clicked "Ativar Notificações"');
    localStorage.setItem('onesignal_permission_asked', 'true');
    
    if ('Notification' in window) {
      try {
        const permission = await Notification.requestPermission();
        console.log('[NotificationPrompt] 📋 Permission result:', permission);
        
        if (permission === 'granted') {
          console.log('[NotificationPrompt] ✅ Permission granted! Waiting for OneSignal Player ID...');
          setPermissionGranted(true);
          setWaitingForPlayerId(true);
          
          toast({
            title: "Permissão concedida!",
            description: "Aguardando sincronização...",
          });
        } else {
          console.warn('[NotificationPrompt] ⚠️ Permission denied by user');
          toast({
            title: "Permissão negada",
            description: "Você não receberá notificações push.",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error('[NotificationPrompt] ❌ Error requesting permission:', error);
        toast({
          title: "Erro",
          description: "Não foi possível solicitar permissão.",
          variant: "destructive"
        });
      }
    }
    
    setShowPrompt(false);
  };

  const handleDecline = () => {
    console.log('[NotificationPrompt] ❌ User declined notifications');
    localStorage.setItem('onesignal_permission_asked', 'true');
    setShowPrompt(false);
  };

  // ✅ Timer para verificar se Player ID foi salvo após 30 segundos
  useEffect(() => {
    if (!permissionGranted || !waitingForPlayerId || !user?.id) return;

    console.log('[NotificationPrompt] ⏳ Starting 30-second timer to check Player ID...');
    
    const timer = setTimeout(async () => {
      console.log('[NotificationPrompt] ⏰ 30 seconds elapsed, checking Player ID...');
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('onesignal_player_id')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('[NotificationPrompt] ❌ Error checking Player ID:', error);
          return;
        }

        if (!data?.onesignal_player_id) {
          console.error('[NotificationPrompt] ❌ Player ID NOT saved after 30 seconds!');
          
          toast({
            title: "Erro ao configurar notificações",
            description: "Por favor, tente novamente ou verifique suas configurações.",
            variant: "destructive"
          });
          
          // Permitir retry removendo o flag
          localStorage.removeItem('onesignal_permission_asked');
          setWaitingForPlayerId(false);
        } else {
          console.log('[NotificationPrompt] ✅ Player ID saved successfully:', data.onesignal_player_id);
          
          toast({
            title: "Notificações ativadas!",
            description: "Você receberá lembretes e avisos do professor.",
          });
          
          setWaitingForPlayerId(false);
        }
      } catch (error) {
        console.error('[NotificationPrompt] ❌ Exception checking Player ID:', error);
        setWaitingForPlayerId(false);
      }
    }, 30000); // 30 segundos

    return () => {
      console.log('[NotificationPrompt] 🧹 Cleaning up timer');
      clearTimeout(timer);
    };
  }, [permissionGranted, waitingForPlayerId, user?.id]);

  if (checking || !showPrompt) return null;

  return (
    <AlertDialog open={showPrompt} onOpenChange={setShowPrompt}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Bell className="w-8 h-8 text-primary" />
            </div>
          </div>
          <AlertDialogTitle className="text-center">
            Ativar Notificações Push?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            Receba lembretes de treinos, avisos do professor e atualizações importantes diretamente no seu dispositivo.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel onClick={handleDecline}>
            Agora Não
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleAccept}>
            Ativar Notificações
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
