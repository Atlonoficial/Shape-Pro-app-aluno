import { useAuthContext } from './AuthProvider';
import { LoadingScreen } from './LoadingScreen';
import { AuthScreen } from './AuthScreen';

interface AuthGuardProps {
  children: React.ReactNode;
}

export const AuthGuard = ({ children }: AuthGuardProps) => {
  const { isAuthenticated, loading } = useAuthContext();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  return <>{children}</>;
};