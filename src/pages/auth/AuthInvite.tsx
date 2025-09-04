import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { AuthStatusHandler } from '@/components/auth/AuthStatusHandler';
import { parseAuthParams, processAuthAction, getRedirectPath } from '@/utils/authRedirectUtils';

export const AuthInvite = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [redirectPath, setRedirectPath] = useState('/');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const processInvite = async () => {
      try {
        const actionData = parseAuthParams(searchParams);
        
        await processAuthAction(actionData);
        
        const path = await getRedirectPath();
        setRedirectPath(path);
        setStatus('success');
      } catch (error: any) {
        console.error('Invite error:', error);
        setErrorMessage(error.message || 'Erro ao processar convite');
        setStatus('error');
      }
    };

    processInvite();
  }, [searchParams]);

  const handleRetry = () => {
    setStatus('loading');
    window.location.reload();
  };

  return (
    <AuthLayout 
      title="Convite Aceito"
      description={status === 'loading' ? 'Processando seu convite...' : undefined}
    >
      <AuthStatusHandler
        status={status}
        successMessage="Convite aceito com sucesso! Bem-vindo à Shape Pro!"
        errorMessage={errorMessage}
        redirectPath={redirectPath}
        onRetry={handleRetry}
      />
    </AuthLayout>
  );
};