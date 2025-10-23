import { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { User, Session } from '@supabase/supabase-js';
import { UserProfile } from '@/lib/supabase';
import { LoadingScreen } from './LoadingScreen';
import { AuthScreen } from './AuthScreen';
import { initPush, clearExternalUserId } from '@/lib/push';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';

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
  const location = useLocation();
  const [forceRender, setForceRender] = useState(false);
  const [emergencyMode, setEmergencyMode] = useState(false);
  
  // ✅ NOVO: Log detalhado do estado de auth a cada mudança
  useEffect(() => {
    console.log('[AuthProvider] 📊 Auth state update:', {
      loading: auth.loading,
      isAuthenticated: auth.isAuthenticated,
      hasUser: !!auth.user,
      hasProfile: !!auth.userProfile,
      userType: auth.userProfile?.user_type || 'null',
      pathname: location.pathname,
      timestamp: new Date().toISOString()
    });
  }, [auth.loading, auth.isAuthenticated, auth.user, auth.userProfile, location.pathname]);
  
  const PUBLIC_PATHS = [
    '/auth/verify', 
    '/auth/verified', 
    '/auth/confirm',
    '/auth/recovery',
    '/auth/invite',
    '/auth/magic-link',
    '/auth/change-email',
    '/auth/error'
  ];
  
  const isPublicRoute = PUBLIC_PATHS.some((p) => location.pathname.startsWith(p));

  // FASE 3: Timeout de 8 segundos para forçar renderização se loading travar
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (auth.loading && !forceRender) {
        console.warn('[AuthProvider] ⚠️ Loading timeout (8s) - forcing render');
        setForceRender(true);
      }
    }, 8000);
    return () => clearTimeout(timeout);
  }, [auth.loading, forceRender]);

  // FASE 5: Modo de emergência após 15 segundos E só se realmente travou
  useEffect(() => {
    const timer = setTimeout(() => {
      // Só ativar emergency mode se REALMENTE travou
      if (auth.loading && !auth.isAuthenticated && !auth.user) {
        console.error('[AuthProvider] 🚨 EMERGENCY MODE: Auth stuck for 8s');
        setEmergencyMode(true);
      }
    }, 8000); // ✅ FASE 4: Reduzido de 15s → 8s
    return () => clearTimeout(timer);
  }, [auth.loading, auth.isAuthenticated, auth.user]);

  // Inicializar OneSignal quando usuário estiver autenticado
  useEffect(() => {
    if (auth.isAuthenticated && auth.user?.id) {
      console.log('AuthProvider: Initializing OneSignal for user:', auth.user.id);
      initPush(auth.user.id);
    } else if (!auth.isAuthenticated && !auth.loading) {
      // Limpar configurações OneSignal no logout
      clearExternalUserId();
      console.log('AuthProvider: OneSignal cleared for logout');
    }
  }, [auth.isAuthenticated, auth.user?.id, auth.loading]);

  // FASE 6: Emergency mode fallback UI
  if (emergencyMode) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-foreground">Problemas de Conexão</h1>
          <p className="text-muted-foreground">
            O app está tendo dificuldades para conectar. Tente:
          </p>
          <ul className="text-left space-y-2 text-sm text-muted-foreground">
            <li>• Verificar sua conexão de internet</li>
            <li>• Reiniciar o aplicativo</li>
            <li>• Limpar cache e tentar novamente</li>
          </ul>
          <Button 
            onClick={() => window.location.reload()}
            className="w-full mt-6"
          >
            Recarregar App
          </Button>
        </div>
      </div>
    );
  }

  // FASE 3: Sempre mostrar LoadingScreen quando loading, mesmo com forceRender
  if (auth.loading) {
    if (forceRender) {
      console.warn('[AuthProvider] ⚠️ Force render ativado mas auth ainda loading');
    }
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