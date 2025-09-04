import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { AuthStatusHandler } from '@/components/auth/AuthStatusHandler';
import { parseAuthParams, processAuthAction, getRedirectPath } from '@/utils/authRedirectUtils';

export const AuthMagicLink = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [redirectPath, setRedirectPath] = useState('/');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const processMagicLink = async () => {
      try {
        const actionData = parseAuthParams(searchParams);
        
        await processAuthAction(actionData);
        
        const path = await getRedirectPath();
        setRedirectPath(path);
        setStatus('success');
      } catch (error: any) {
        console.error('Magic link error:', error);
        setErrorMessage(error.message || 'Erro ao processar link mágico');
        setStatus('error');
      }
    };

    processMagicLink();
  }, [searchParams]);

  const handleRetry = () => {
    setStatus('loading');
    window.location.reload();
  };

  return (
    <AuthLayout 
      title="Login por Link Mágico"
      description={status === 'loading' ? 'Processando seu login...' : undefined}
    >
      <AuthStatusHandler
        status={status}
        successMessage="Login realizado com sucesso!"
        errorMessage={errorMessage}
        redirectPath={redirectPath}
        onRetry={handleRetry}
      />
    </AuthLayout>
  );
};