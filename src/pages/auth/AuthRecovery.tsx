import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { AuthStatusHandler } from '@/components/auth/AuthStatusHandler';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { parseAuthParams, processAuthAction, getRedirectPath } from '@/utils/authRedirectUtils';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff } from 'lucide-react';

export const AuthRecovery = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [status, setStatus] = useState<'loading' | 'form' | 'success' | 'error'>('loading');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [tokenExpired, setTokenExpired] = useState(false);
  const [redirectPath, setRedirectPath] = useState('/');

  useEffect(() => {
    const processRecovery = async () => {
      try {
        // Verificar erro na URL hash
        const hash = window.location.hash;
        const searchString = window.location.search;
        
        // ✅ Verificar se token está presente
        if (!searchString.includes('token_hash') && !hash.includes('token_hash') && !hash.includes('access_token')) {
          console.error('[Recovery] ❌ Token não encontrado na URL');
          setStatus('error');
          setErrorMessage('Link inválido ou expirado. Solicite um novo link de recuperação.');
          setTokenExpired(true);
          return;
        }
        
        // Verificar erros específicos no hash/query
        if (hash.includes('error=otp_expired') || 
            hash.includes('error_description=expired') ||
            hash.includes('error=token_expired') ||
            searchString.includes('error=access_denied')) {
          setTokenExpired(true);
          setErrorMessage('Link de recuperação expirado. Solicite um novo link.');
          setStatus('error');
          return;
        }
        
        // Parse both search params and URL fragments
        const actionData = parseAuthParams(searchParams);
        
        if (actionData.error) {
          throw new Error(actionData.error_description || actionData.error);
        }

        // Check if user is already authenticated (from fragment token)
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          console.log('User authenticated via recovery token');
          const path = await getRedirectPath();
          setRedirectPath(path);
          setStatus('form');
          return;
        }

        // If not authenticated and we have a token, process it
        if (actionData.token_hash) {
          await processAuthAction(actionData);
          const path = await getRedirectPath();
          setRedirectPath(path);
          setStatus('form');
        } else {
          throw new Error('Token de recuperação não encontrado');
        }
      } catch (error: any) {
        console.error('Recovery error:', error);
        
        // Detectar token expirado
        if (error.message?.includes('expired') || 
            error.message?.includes('invalid') ||
            error.message?.includes('otp')) {
          setTokenExpired(true);
          setErrorMessage('Link de recuperação expirado. Solicite um novo.');
        } else {
          setErrorMessage(error.message || 'Token de recuperação inválido ou expirado');
        }
        
        setStatus('error');
      }
    };

    processRecovery();
  }, [searchParams]);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🔐 AuthRecovery: Iniciando reset de senha');
    
    if (password !== confirmPassword) {
      console.log('❌ AuthRecovery: Senhas não coincidem');
      toast({
        title: "Erro",
        description: "As senhas não coincidem",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      console.log('❌ AuthRecovery: Senha muito curta');
      toast({
        title: "Erro",
        description: "A senha deve ter pelo menos 6 caracteres",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('💾 AuthRecovery: Atualizando senha no Supabase...');
      
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        console.error('❌ AuthRecovery: Erro ao atualizar senha:', error);
        throw error;
      }

      console.log('✅ AuthRecovery: Senha atualizada com sucesso');

      toast({
        title: "✅ Senha atualizada!",
        description: "Você já está autenticado e será redirecionado.",
      });

      setStatus('success');

      // Redirecionar automaticamente após 1.5s
      setTimeout(async () => {
        const path = await getRedirectPath();
        console.log('🔄 AuthRecovery: Redirecionando para:', path);
        navigate(path, { replace: true });
      }, 1500);
    } catch (error: any) {
      console.error('❌ AuthRecovery: Erro no processo:', error);
      toast({
        title: "Erro",
        description: error.message || 'Erro ao atualizar senha',
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetry = () => {
    setStatus('loading');
    window.location.reload();
  };

  if (status === 'loading') {
    return (
      <AuthLayout title="Recuperação de Senha">
        <AuthStatusHandler
          status="loading"
          onRetry={handleRetry}
        />
      </AuthLayout>
    );
  }

  if (status === 'error') {
    return (
      <AuthLayout title="Erro na Recuperação">
        <AuthStatusHandler
          status="error"
          errorMessage={errorMessage}
          onRetry={handleRetry}
        />
        
        {tokenExpired && (
          <Button
            onClick={() => navigate('/auth?tab=signin')}
            variant="outline"
            className="w-full mt-4"
          >
            📧 Solicitar Novo Link de Recuperação
          </Button>
        )}
      </AuthLayout>
    );
  }

  if (status === 'success') {
    return (
      <AuthLayout title="Senha Atualizada">
        <AuthStatusHandler
          status="success"
          successMessage="Senha atualizada! Redirecionando..."
          redirectPath={redirectPath}
          redirectDelay={2}
        />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout 
      title="Nova Senha"
      description="Defina sua nova senha para acessar sua conta"
    >
      <form onSubmit={handlePasswordReset} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">Nova Senha</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Digite sua nova senha"
              required
              minLength={6}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirme sua nova senha"
              required
              minLength={6}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <Button 
          type="submit" 
          className="w-full"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Atualizando...' : 'Atualizar Senha'}
        </Button>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => navigate('/')}
        >
          Cancelar
        </Button>
      </form>
    </AuthLayout>
  );
};