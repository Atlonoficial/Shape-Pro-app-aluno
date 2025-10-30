import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { AuthStatusHandler } from '@/components/auth/AuthStatusHandler';
import { parseAuthParams } from '@/utils/authRedirectUtils';

export const AuthError = () => {
  const [searchParams] = useSearchParams();
  const [errorMessage, setErrorMessage] = useState('');
  const [errorDetails, setErrorDetails] = useState('');

  useEffect(() => {
    const actionData = parseAuthParams(searchParams);
    
    const message = actionData.error_description || actionData.error || 'Ocorreu um erro durante a autenticação';
    setErrorMessage(message);
    
    // Provide more specific error messages based on error codes
    if (actionData.error_code) {
      switch (actionData.error_code) {
        case 'invalid_request':
          setErrorDetails('Link inválido ou expirado. Solicite um novo link.');
          break;
        case 'unauthorized':
          setErrorDetails('Acesso não autorizado. Verifique suas credenciais.');
          break;
        case 'access_denied':
          setErrorDetails('Acesso negado. Entre em contato com o suporte.');
          break;
        case 'server_error':
          setErrorDetails('Erro no servidor. Tente novamente em alguns minutos.');
          break;
        default:
          setErrorDetails('Entre em contato com o suporte se o problema persistir.');
      }
    } else {
      setErrorDetails('Entre em contato com o suporte se o problema persistir.');
    }
  }, [searchParams]);

  return (
    <AuthLayout 
      title="Erro de Autenticação"
      description="Não foi possível processar sua solicitação"
    >
      <div className="space-y-4 text-center">
        <AuthStatusHandler
          status="error"
          errorMessage={errorMessage}
        />
        
        {errorDetails && (
          <div className="text-sm text-muted-foreground p-4 bg-muted rounded-lg">
            <p className="font-medium mb-2">Detalhes:</p>
            <p>{errorDetails}</p>
          </div>
        )}
      </div>
    </AuthLayout>
  );
};