import { PushNotifications } from './PushNotifications';
import { useAuthContext } from '@/components/auth/AuthProvider';

export const PushNotificationsWrapper = () => {
  // Tentar obter o contexto de auth, se não estiver disponível, não renderizar
  try {
    const { user } = useAuthContext();
    return <PushNotifications />;
  } catch (error) {
    // Se AuthContext não estiver disponível ainda, não renderizar nada
    return null;
  }
};