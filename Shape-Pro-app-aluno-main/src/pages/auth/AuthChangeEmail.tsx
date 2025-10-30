import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { AuthStatusHandler } from '@/components/auth/AuthStatusHandler';
import { parseAuthParams, processAuthAction, getRedirectPath } from '@/utils/authRedirectUtils';

export const AuthChangeEmail = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [redirectPath, setRedirectPath] = useState('/');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const processEmailChange = async () => {
      try {
        const actionData = parseAuthParams(searchParams);
        
        await processAuthAction(actionData);
        
        const path = await getRedirectPath();
        setRedirectPath(path);
        setStatus('success');
      } catch (error: any) {
        console.error('Email change error:', error);
        setErrorMessage(error.message || 'Erro ao processar alteração de email');
        setStatus('error');
      }
    };

    processEmailChange();
  }, [searchParams]);

  const handleRetry = () => {
    setStatus('loading');
    window.location.reload();
  };

  return (
    <AuthLayout 
      title="Alteração de Email"
      description={status === 'loading' ? 'Processando alteração...' : undefined}
    >
      <AuthStatusHandler
        status={status}
        successMessage="Email alterado com sucesso!"
        errorMessage={errorMessage}
        redirectPath={redirectPath}
        onRetry={handleRetry}
      />
    </AuthLayout>
  );
};