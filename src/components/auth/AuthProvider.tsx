import { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { User, Session } from '@supabase/supabase-js';
import { UserProfile } from '@/lib/supabase';
import { LoadingScreen } from './LoadingScreen';
import { AuthScreen } from './AuthScreen';
import { initPush, clearExternalUserId } from '@/lib/push';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useNativePermissions } from '@/hooks/useNativePermissions';
import { useDeviceContext } from '@/hooks/useDeviceContext';

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
  const { isNative } = useDeviceContext();
  const { requestCameraPermission } = useNativePermissions(); // ✅ BUILD 24: Push gerenciado por OneSignal
  const [forceRender, setForceRender] = useState(false);
  const [emergencyMode, setEmergencyMode] = useState(false);
  const [emergencyDetails, setEmergencyDetails] = useState<string[]>([]);
  const [permissionsRequested, setPermissionsRequested] = useState(false);
  
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

  // ✅ FASE 3: Modo de emergência após 5 segundos (iOS é rápido!)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (auth.loading && !auth.isAuthenticated) {
        console.error('[AuthProvider] 🚨 EMERGENCY MODE: Auth stuck for 5s');
        setEmergencyDetails([
          `Loading: ${auth.loading}`,
          `User: ${auth.user?.id || 'null'}`,
          `Profile: ${auth.userProfile ? 'loaded' : 'null'}`,
          `Timestamp: ${new Date().toISOString()}`
        ]);
        setEmergencyMode(true);
      }
    }, 5000); // ✅ Reduzido de 8s → 5s
    return () => clearTimeout(timer);
  }, [auth.loading, auth.isAuthenticated, auth.user, auth.userProfile]);

  // Inicializar OneSignal quando usuário estiver autenticado
  useEffect(() => {
    if (auth.isAuthenticated && auth.user?.id) {
      console.log('[AuthProvider] ✅ BUILD 29: User authenticated, initializing OneSignal', {
        userId: auth.user.id,
        timestamp: new Date().toISOString()
      });
      initPush(auth.user.id);
    } else if (!auth.isAuthenticated && !auth.loading) {
      // Limpar configurações OneSignal no logout
      console.log('[AuthProvider] 🚪 Clearing OneSignal on logout');
      clearExternalUserId();
    }
  }, [auth.isAuthenticated, auth.user?.id, auth.loading]);

  // ✅ BUILD 24: Removido - OneSignal gerencia permissões automaticamente

  // ✅ FASE 3: Emergency mode UI melhorada com detalhes técnicos
  if (emergencyMode) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-white">Falha ao Iniciar</h1>
          <p className="text-gray-400 text-sm">
            O app não conseguiu carregar em 5 segundos.
          </p>
          
          {/* Mostrar detalhes técnicos */}
          <details className="text-left text-xs text-gray-500 bg-gray-900 p-3 rounded">
            <summary className="cursor-pointer font-medium text-gray-400">Detalhes técnicos</summary>
            <ul className="mt-2 space-y-1">
              {emergencyDetails.map((detail, i) => (
                <li key={i}>• {detail}</li>
              ))}
            </ul>
          </details>
          
          <Button 
            onClick={() => {
              console.log('[Emergency] User requested reload');
              window.location.reload();
            }}
            className="w-full mt-6 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
          >
            🔄 Tentar Novamente
          </Button>
          
          <Button 
            onClick={() => {
              console.log('[Emergency] User requested cache clear');
              if ('caches' in window) {
                caches.keys().then(names => {
                  names.forEach(name => caches.delete(name));
                });
              }
              localStorage.clear();
              window.location.reload();
            }}
            variant="outline"
            className="w-full text-white border-gray-700 hover:bg-gray-900"
          >
            🗑️ Limpar Cache e Tentar
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