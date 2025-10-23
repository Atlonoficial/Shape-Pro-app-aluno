import { useEffect } from 'react';
import { useAuthContext } from './AuthProvider';
import { useNavigate, useLocation } from 'react-router-dom';
import { LoadingScreen } from './LoadingScreen';

interface TermsGuardProps {
  children: React.ReactNode;
}

export const TermsGuard = ({ children }: TermsGuardProps) => {
  const { userProfile, loading } = useAuthContext();
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    if (!loading && userProfile) {
      // Verificar se usuário aceitou os termos
      if (!userProfile.terms_accepted_at || !userProfile.privacy_accepted_at) {
        console.warn('[TermsGuard] Usuário não aceitou termos, redirecionando...');
        
        // Não redirecionar se já estiver na página de aceitar termos
        if (location.pathname !== '/accept-terms') {
          navigate('/accept-terms', { replace: true });
        }
      }
    }
  }, [userProfile, loading, navigate, location.pathname]);
  
  if (loading) return <LoadingScreen />;
  
  // Se não aceitou os termos e não está na página de aceitar, não renderiza
  if (userProfile && (!userProfile.terms_accepted_at || !userProfile.privacy_accepted_at) && location.pathname !== '/accept-terms') {
    return null;
  }
  
  return <>{children}</>;
};
