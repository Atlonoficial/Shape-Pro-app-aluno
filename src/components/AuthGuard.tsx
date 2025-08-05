import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

/**
 * Componente para proteger rotas que precisam de autenticação
 * 
 * ONDE USAR:
 * - Envolver páginas do aluno: /aluno/dashboard, /aluno/chat, etc.
 * - Qualquer rota que precise de usuário logado
 * 
 * EXEMPLO DE USO:
 * <Route path="/aluno/dashboard" element={
 *   <AuthGuard>
 *     <AlunoDashboard />
 *   </AuthGuard>
 * } />
 */

interface AuthGuardProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export default function AuthGuard({ children, redirectTo = "/login" }: AuthGuardProps) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}