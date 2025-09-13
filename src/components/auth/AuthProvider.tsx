import { createContext, useContext, ReactNode, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { User, Session } from '@supabase/supabase-js';
import { UserProfile } from '@/lib/supabase';
import { LoadingScreen } from './LoadingScreen';
import { AuthScreen } from './AuthScreen';
import { initPush } from '@/lib/push';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isAuthenticated: boolean;
  isStudent: boolean;
  isTeacher: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const auth = useAuth();
  const PUBLIC_PATHS = ['/auth/verify', '/auth/verified', '/reset-password'];
  const isPublicRoute = PUBLIC_PATHS.some((p) => window.location.pathname.startsWith(p));

  // Inicializar OneSignal quando usuário estiver autenticado
  useEffect(() => {
    if (auth.isAuthenticated && auth.user?.id) {
      console.log('AuthProvider: Initializing OneSignal for user:', auth.user.id);
      initPush(auth.user.id);
    }
  }, [auth.isAuthenticated, auth.user?.id]);

  if (auth.loading) {
    return <LoadingScreen />;
  }

  if (!auth.isAuthenticated && !isPublicRoute) {
    return <AuthScreen />;
  }

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
};