import { useState, useEffect } from 'react';
import { getToken, deleteToken } from 'firebase/messaging';
import { doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { messaging, db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';

/**
 * Hook para gerenciar tokens FCM (Firebase Cloud Messaging)
 * 
 * ONDE USAR:
 * - /pages/aluno/dashboard.tsx (registrar token ao fazer login)
 * - App.tsx (registrar token na inicialização do app)
 * - Componente de configurações de notificação
 * 
 * EXEMPLO DE USO:
 * const { token, permission, requestPermission, error } = useFCMTokens();
 * 
 * // Registrar token automaticamente:
 * useEffect(() => {
 *   if (user) {
 *     requestPermission();
 *   }
 * }, [user]);
 */

interface UseFCMTokensReturn {
  token: string | null;
  permission: NotificationPermission | null;
  loading: boolean;
  error: string | null;
  requestPermission: () => Promise<boolean>;
  removeToken: () => Promise<void>;
}

export const useFCMTokens = (): UseFCMTokensReturn => {
  const [token, setToken] = useState<string | null>(null);
  const [permission, setPermission] = useState<NotificationPermission | null>(
    typeof Notification !== 'undefined' ? Notification.permission : null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // VAPID Key - deve ser a mesma configurada no Firebase Console
  const VAPID_KEY = 'BMxKJwPMxKJwPMxKJwPMxKJwPMxKJwPMxKJwPMxKJwPMxKJwPMxKJwPMxKJwPMxKJwPMxKJwPM'; // Substitua pela sua VAPID key

  const requestPermission = async (): Promise<boolean> => {
    if (!messaging || !user) {
      console.warn('Messaging não disponível ou usuário não logado');
      return false;
    }

    try {
      setLoading(true);
      setError(null);

      // 1. Solicitar permissão de notificação
      const permission = await Notification.requestPermission();
      setPermission(permission);

      if (permission !== 'granted') {
        setError('Permissão de notificação negada');
        return false;
      }

      // 2. Obter token FCM
      const currentToken = await getToken(messaging, {
        vapidKey: VAPID_KEY
      });

      if (currentToken) {
        setToken(currentToken);

        // 3. Salvar token no Firestore associado ao usuário
        await saveTokenToFirestore(currentToken);
        
        console.log('Token FCM registrado:', currentToken);
        return true;
      } else {
        setError('Não foi possível obter token FCM');
        return false;
      }

    } catch (err) {
      console.error('Erro ao solicitar permissão FCM:', err);
      setError('Erro ao configurar notificações');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const saveTokenToFirestore = async (fcmToken: string) => {
    if (!user) return;

    try {
      // Salvar token na coleção fcm_tokens
      await setDoc(doc(db, 'fcm_tokens', `${user.uid}_${Date.now()}`), {
        userId: user.uid,
        token: fcmToken,
        platform: 'web',
        userAgent: navigator.userAgent,
        createdAt: serverTimestamp(),
        lastUsed: serverTimestamp(),
        active: true
      });

      // Opcional: Limpar tokens antigos do mesmo usuário
      // await cleanupOldTokens();

    } catch (err) {
      console.error('Erro ao salvar token no Firestore:', err);
      throw err;
    }
  };

  const removeToken = async () => {
    if (!messaging || !token) return;

    try {
      setLoading(true);
      
      // 1. Remover token do Firebase Messaging
      await deleteToken(messaging);
      
      // 2. Marcar token como inativo no Firestore
      if (user) {
        // Aqui você pode implementar lógica para marcar tokens como inativos
        // ou removê-los da coleção fcm_tokens
      }

      setToken(null);
      console.log('Token FCM removido');

    } catch (err) {
      console.error('Erro ao remover token FCM:', err);
      setError('Erro ao remover notificações');
    } finally {
      setLoading(false);
    }
  };

  // Verificar permissão atual na inicialização
  useEffect(() => {
    if (typeof Notification !== 'undefined') {
      setPermission(Notification.permission);
    }
  }, []);

  return {
    token,
    permission,
    loading,
    error,
    requestPermission,
    removeToken
  };
};