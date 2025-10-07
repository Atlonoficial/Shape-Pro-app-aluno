import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { AuthStatusHandler } from '@/components/auth/AuthStatusHandler';
import { parseAuthParams, processAuthAction, getRedirectPath, getActionTitle, getActionDescription } from '@/utils/authRedirectUtils';

export const AuthConfirm = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [redirectPath, setRedirectPath] = useState('/');
  const [actionType, setActionType] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const processConfirmation = async () => {
      try {
        console.log('🔐 AuthConfirm: Iniciando processamento de confirmação');
        const actionData = parseAuthParams(searchParams);
        console.log('📋 AuthConfirm: Dados da ação:', actionData);
        setActionType(actionData.type);

        await processAuthAction(actionData);
        console.log('✅ AuthConfirm: Ação processada com sucesso');
        
        const path = await getRedirectPath();
        console.log('🎯 AuthConfirm: Path de redirecionamento calculado:', path);
        setRedirectPath(path);
        setStatus('success');
      } catch (error: any) {
        console.error('❌ AuthConfirm: Erro na confirmação:', error);
        setErrorMessage(error.message || 'Erro ao processar confirmação');
        setStatus('error');
      }
    };

    processConfirmation();
  }, [searchParams]);

  const handleRetry = () => {
    setStatus('loading');
    window.location.reload();
  };

  return (
    <AuthLayout 
      title={getActionTitle(actionType)}
      description={status === 'loading' ? 'Processando sua solicitação...' : undefined}
    >
      <AuthStatusHandler
        status={status}
        successMessage={getActionDescription(actionType)}
        errorMessage={errorMessage}
        redirectPath={redirectPath}
        onRetry={handleRetry}
      />
    </AuthLayout>
  );
};