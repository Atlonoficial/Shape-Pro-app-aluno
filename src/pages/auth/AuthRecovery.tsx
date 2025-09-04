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
  const [redirectPath, setRedirectPath] = useState('/');

  useEffect(() => {
    const processRecovery = async () => {
      try {
        const actionData = parseAuthParams(searchParams);
        
        if (actionData.error) {
          throw new Error(actionData.error_description || actionData.error);
        }

        // For recovery, we need to process the token first
        await processAuthAction(actionData);
        
        const path = await getRedirectPath();
        setRedirectPath(path);
        setStatus('form');
      } catch (error: any) {
        console.error('Recovery error:', error);
        setErrorMessage(error.message || 'Token de recuperação inválido ou expirado');
        setStatus('error');
      }
    };

    processRecovery();
  }, [searchParams]);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Erro",
        description: "A senha deve ter pelo menos 6 caracteres",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;

      setStatus('success');
    } catch (error: any) {
      console.error('Password update error:', error);
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
      </AuthLayout>
    );
  }

  if (status === 'success') {
    return (
      <AuthLayout title="Senha Atualizada">
        <AuthStatusHandler
          status="success"
          successMessage="Sua senha foi atualizada com sucesso!"
          redirectPath={redirectPath}
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